"""Kafka producer — design §5.1 steps 4 and 5, and §5.5 backpressure.

TWO RULES FROM THE DESIGN SHAPE THIS FILE
-----------------------------------------
1. "**Respond** — 200 ... after the *durable queue* ack, never after projection." (§5.1)
   So a request must await the broker's acknowledgement. Not fire-and-forget: a 200 that
   only means "queued locally" would be a lie the moment the process restarts, and this is
   the ingest path for the system of record.

2. "Backpressure is applied by the producer's local queue, never by rejecting a producer.
   Only when the local queue is full *and* the broker is unreachable does the gateway return
   503." (§5.1 / spec §5.5)
   So BufferError alone is NOT a 503 — it is the queue doing its job. We drain and retry
   first. A 503 means both the buffer and the broker are gone, and the design says that is
   page-worthy.

WHY A POLL THREAD
-----------------
confluent-kafka's Producer is a C client with its own background sender; delivery callbacks
only fire from inside `poll()`. Nothing calls `poll()` for you. If we polled inline per
request we would block the event loop, so a daemon thread polls and hands results back to the
loop via `call_soon_threadsafe`. Producer is documented thread-safe, so this is the standard
shape rather than a clever one.
"""

from __future__ import annotations

import asyncio
import logging
import threading
from typing import Any

from confluent_kafka import KafkaException, Producer

log = logging.getLogger(__name__)


class QueueFull(Exception):
    """Local queue full AND the broker unreachable — the only 503 the design permits."""


class StatementProducer:
    def __init__(self, bootstrap: str, topic: str) -> None:
        self._topic = topic
        self._producer = Producer(
            {
                "bootstrap.servers": bootstrap,
                # §5.1: acks=all. Anything weaker means a 200 can outlive the data.
                "acks": "all",
                # Retries can otherwise reorder or duplicate. Ordering per key is
                # load-bearing for BKT (§5.3), so idempotence is not optional here even
                # though ReplacingMergeTree would dedup eventually.
                "enable.idempotence": True,
                "linger.ms": 5,
                "compression.type": "lz4",
                "queue.buffering.max.messages": 100_000,
            }
        )
        self._closing = threading.Event()
        self._thread = threading.Thread(target=self._serve, name="kafka-poll", daemon=True)
        self._thread.start()

    def _serve(self) -> None:
        while not self._closing.is_set():
            self._producer.poll(0.1)

    async def produce_batch(self, messages: list[tuple[str, bytes]]) -> None:
        """Produce every message and await all acks. Raises QueueFull or KafkaException.

        Produce-then-await, rather than await-per-message, so one batch costs one round trip
        instead of N.

        NOTE the honest limit: this is all-or-nothing on *validation* (§9), not on delivery.
        If the broker dies midway some statements are already durable. That is deliberate and
        the design absorbs it — at-least-once plus ReplacingMergeTree keyed on statement_id
        gives effective idempotency (§5.3), so the producer's retry converges rather than
        double-counting.
        """
        loop = asyncio.get_running_loop()
        futures: list[asyncio.Future[None]] = []

        for key, value in messages:
            fut: asyncio.Future[None] = loop.create_future()

            def on_delivery(err: Any, _msg: Any, fut: asyncio.Future[None] = fut) -> None:
                # Fires on the poll thread. Guard set_* because the awaiting request may
                # have been cancelled (client hung up) before the ack landed.
                if fut.cancelled():
                    return
                if err is not None:
                    loop.call_soon_threadsafe(fut.set_exception, KafkaException(err))
                else:
                    loop.call_soon_threadsafe(fut.set_result, None)

            self._produce_one(key, value, on_delivery)
            futures.append(fut)

        await asyncio.gather(*futures)

    def _produce_one(self, key: str, value: bytes, on_delivery: Any) -> None:
        # BufferError is the local queue applying backpressure — expected under load, and
        # explicitly NOT a reason to reject the producer (§5.5). Drain and retry; only give
        # up if the queue never clears, which means the sender is not draining it, which
        # means the broker is gone.
        for attempt in range(3):
            try:
                self._producer.produce(
                    self._topic, key=key.encode("utf-8"), value=value, on_delivery=on_delivery
                )
                return
            except BufferError:
                log.warning(
                    "local produce queue full (%d msgs), draining; attempt %d",
                    len(self._producer),
                    attempt + 1,
                )
                self._producer.poll(0.5)
        raise QueueFull("local produce queue is full and did not drain — the broker is unreachable")

    def close(self, timeout: float = 10.0) -> None:
        try:
            self._producer.flush(timeout)
        finally:
            self._closing.set()
            self._thread.join(timeout=2.0)

    @property
    def queue_depth(self) -> int:
        return len(self._producer)
