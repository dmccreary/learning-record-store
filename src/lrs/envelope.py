"""The gateway -> processor wire format.

Shared deliberately. This is the same lesson `docs/js/lrs-xapi.js` exists for: two components
that must agree on a shape will drift if each writes its own copy. The gateway is the only
writer and the processor is the only reader, which is exactly the situation where a private
"obvious" dict silently grows a third field nobody else knows about.

WHY AN ENVELOPE RATHER THAN THE BARE STATEMENT
----------------------------------------------
Contract §8 lists fields the producer must never set, two of which the GATEWAY owns:

  district_id  — from the auth token. A producer must not be able to claim another
                 district's tenancy, so it cannot travel inside the statement body.
  stored_at    — arrival time, stamped at receipt. `timestamp` is event time and stays the
                 producer's.

Both must reach the processor, and neither belongs inside `statement` — `statement` is kept
byte-for-byte as the producer sent it (modulo a gateway-minted `id`) because it becomes the
`raw` column, and §5.2's boundary is enforced by the processor rewriting the actor block
there. Mixing gateway-derived fields into the producer's object would make "what did the
producer actually say?" unanswerable from the log.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Envelope:
    district_id: str
    stored_at: str  # ISO-8601 UTC, gateway receipt time
    statement: dict[str, Any]  # the producer's statement, verbatim + guaranteed `id`

    def to_json(self) -> bytes:
        return json.dumps(
            {
                "district_id": self.district_id,
                "stored_at": self.stored_at,
                "statement": self.statement,
            },
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")

    @staticmethod
    def from_json(data: bytes) -> Envelope:
        obj = json.loads(data)
        return Envelope(
            district_id=obj["district_id"],
            stored_at=obj["stored_at"],
            statement=obj["statement"],
        )
