# `mkdocs serve` live-reload was silently dead — root cause and fix

**Date:** 2026-07-16
**Status:** **FIXED** — `click` upgraded to **8.4.2** in the `mkdocs` env, verified end to end.
**Severity:** high for the dev loop, zero for the built site. `mkdocs build` was never affected.

> **Correction, same day.** The first version of this document said the fix was
> `pip install "click<8.3"` and listed "wait for a newer mkdocs, then drop the pin" as a follow-up.
> **Both were wrong.** `mkdocs` 1.6.1 *is* the latest release — there is nothing to upgrade to, so
> that pin would have been permanent. And the bug exists **only in click 8.3.x**: it was already fixed
> upstream in **click 8.4.0**. Pinning backwards would have frozen this env on 8.2.1 forever, to dodge
> a bug that no longer exists in current click. The fix is to move **forward**, not back. Kept visible
> rather than quietly rewritten, because "pin backwards" is the reflex this bug invites and it is the
> wrong reflex here.

---

## Symptom

Edit a file, reload the browser, see the old page. Forever. No error, no warning, no log line.
`mkdocs serve` served whatever it built at startup and never rebuilt again.

Found the hard way: a newly added `docs/js/quiz-xapi.js` returned **404** from a running
`mkdocs serve`, which read exactly like a broken script tag. It wasn't. The server was serving a
config in which the file did not exist, because it had never rebuilt since startup.

**This is a nasty failure mode.** The natural conclusion is "my JavaScript is broken" and the natural
next step is to debug JavaScript that is fine. It cost real time today.

## Root cause

**`click` 8.3.x breaks `mkdocs` 1.6.1's `livereload` default.**

MkDocs declares the default with a pair of click options that share one destination
(`mkdocs/__main__.py`):

```python
@click.option('--no-livereload', 'livereload', flag_value=False, help=no_reload_help)
@click.option('--livereload',    'livereload', flag_value=True, default=True, hidden=True)
```

click 8.3 changed how that pattern resolves, so with no CLI flags `livereload` arrives **`False`**
instead of `True`. In `mkdocs/commands/serve.py` **every** watch registration sits behind that one
gate:

```python
if livereload:                                  # <- False on click 8.3.x
    server.watch(config.docs_dir)               # never runs
    if config.config_file_path:
        server.watch(config.config_file_path)   # never runs
    ...
    for item in config.watch:                   # never runs
        server.watch(item)
```

So `_watched_paths` stays empty. And in `mkdocs/livereload/__init__.py`, starting the observer is
itself conditional on that dict being non-empty:

```python
if self._watched_paths:
    self.observer.start()
    log.info(f"Watching paths for changes: {paths_str}")
```

Empty dict → observer never starts → nothing is ever detected → no rebuild. **Silently**: the only
signal is the *absence* of an INFO line, which nobody notices.

### Bisect — the break is a bounded island, not a one-way door

MkDocs's own flag pattern, invoked with no arguments. Each tested in a throwaway venv containing
nothing but click, so this is click's behaviour itself and not a mkdocs interaction:

| click | resolves to | verdict |
|---|---|---|
| 8.1.7 | `livereload=True` | ✅ |
| 8.2.1 | `livereload=True` | ✅ |
| **8.3.0** | **`livereload=False`** | ❌ regression introduced |
| **8.3.3** | **`livereload=False`** | ❌ still broken |
| **8.4.0** | `livereload=True` | ✅ **fixed upstream** |
| **8.4.2** (latest) | `livereload=True` | ✅ |

**The broken range is exactly `8.3.*`.** Anything `<8.3` or `>=8.4` is fine. This is the single most
important fact in this document, and it is the one the first draft got wrong by only testing versions
below the break.

## The fix

```bash
pip install -U "click>=8.4"      # in the mkdocs env -> click 8.4.2
```

Then **restart `mkdocs serve`** (a running process has already imported the old click; the change only
takes effect in a new one). `pip check` reports no broken requirements: only `mkdocs` depends on
click, and it requires `click>=7.0`.

**Move forward, not back.** `pip install "click<8.3"` also works and was the first thing tried — but
it is the wrong fix. `mkdocs` 1.6.1 is the newest release, so there would never be a mkdocs upgrade to
release the pin, and this env would sit on click 8.2.1 indefinitely, cut off from every later click
release, to avoid a bug that upstream already fixed.

If a constraint is ever written down, express it as the island it is:

```
click>=8.4        # or, if older clicks must stay allowed:  click!=8.3.*
```

Not `click<8.3`.

### Verified, end to end, on click 8.4.2

Not "the flag now returns True" — an actual edit reaching an actual server:

```
INFO -  [12:06:18] Watching paths for changes: 'docs', 'mkdocs.yml'    <- armed
INFO -  Detected file changes
INFO -  Building documentation...
INFO -  Documentation built
```

A marker appended to `docs/css/extra.css` was absent from the served CSS before the edit and present
~6s after. Before the fix, the same test failed on four separate fresh servers. Both candidate fixes
(8.2.1 and 8.4.2) were verified this way; 8.4.2 is the one installed.

## The tell — check this first, always

A healthy `mkdocs serve` prints this at **INFO**, between "Documentation built" and "Serving on":

```
INFO -  Watching paths for changes: 'docs', 'mkdocs.yml'
```

**If that line is absent, the watcher is not armed and nothing you edit will ever appear.** Check for
it before debugging anything else. It costs one second and it would have saved an hour.

## Ruled out — do not re-tread these

Each was tested, not assumed:

| Suspect | Verdict |
|---|---|
| A stale/long-running server | No. Reproduced on **fresh** servers, foreground and background. |
| `watchdog` broken | No. 6.0.0 works — verified directly. |
| `FSEventsObserver` vs `PollingObserver` | Neither. **Both** deliver events. MkDocs uses `PollingObserver(timeout=0.5)`; tested it directly with mkdocs's exact instance-assigned `on_any_event` handler — it fires. |
| macOS FSEvents / TCC on `~/Documents` | No. watchdog receives events in this exact directory. |
| Sandboxed execution | No. Fails unsandboxed too. |
| `extra_javascript`-specific | No. **No file of any type** triggers a rebuild — `.md` and `.css` both fail. |
| A local hook (`plugins/social_override.py`) | No. It has no serve/watch/livereload hooks. |
| mkdocs↔watchdog API incompatibility | No. `dispatch()` calls `self.on_any_event(event)`, so mkdocs's instance assignment works. |

## A `watch:` block in `mkdocs.yml` does NOT work around this

```yaml
watch:            # valid key, builds fine, and completely ineffective here
  - docs
  - mkdocs.yml
```

`watch` **is** a legal `mkdocs.yml` config key, so this passes `--strict`. But `config.watch` is
consumed by `for item in config.watch: server.watch(item)` at `serve.py:100` — **inside the same
`if livereload:` gate** that is false. It is also redundant when livereload works: `serve.py:89` and
`:91` already watch `docs/` and `mkdocs.yml` by default.

Pinning click is the only lever.

## Environment

| Package | Was | Now | Notes |
|---|---|---|---|
| click | 8.3.1 | **8.4.2** | 8.3.x is the only broken range; 8.4.0 fixed it. 8.4.2 is latest. |
| mkdocs | 1.6.1 | unchanged | **Already the latest release** — there is no newer mkdocs. |
| mkdocs-material | 9.7.0 | unchanged | |
| watchdog | 6.0.0 | unchanged | Innocent. Works fine; mkdocs never got far enough to use it. |

Env: `/Users/dan/miniconda3/envs/mkdocs`, Python 3.11, macOS.

## Follow-ups

1. **Do not pin backwards.** `click<8.3` is the tempting reflex and it is wrong: mkdocs 1.6.1 is the
   newest release, so there would be no future mkdocs upgrade to release such a pin, and this env
   would sit on click 8.2.1 indefinitely. If a constraint is ever written into a requirements file,
   make it `click>=8.4` (or `click!=8.3.*`) and link to this document. The failure is **silent**, so a
   future reader will not connect "my edits do nothing" to click on their own.
2. **A downgrade is the real risk now, not an upgrade.** With 8.4.2 installed, `pip install -U` is
   safe — the danger is anything that resolves click *backwards* into 8.3.x. That is a plausible
   accident: some other package requiring `click<8.4` would silently reintroduce this.

   **The structural fix is a lockfile, and it is now a decided direction.** This env
   (`~/miniconda3/envs/mkdocs`) is conda + pip with **no requirements file and no lock of any kind** —
   nothing records what is installed or why, which is exactly how click 8.3.1 arrived unnoticed. The
   project's standing decision (`mvp-status.md` §2) is that **all Python tooling moves to `uv`**, and
   this env is the outlier. Under `uv` with a committed `uv.lock`, click's version would be pinned by
   construction, `uv sync --frozen` would refuse to drift, and the constraint would live in a file
   rather than in a warning in this document that someone has to remember to read.
3. **Upstream.** This is a genuine mkdocs↔click incompatibility affecting **current mkdocs on current
   click at the time it was hit** — mkdocs 1.6.1 was released well before click 8.3 existed, and
   mkdocs has not shipped since. Anyone landing on mkdocs 1.6.1 + click 8.3.x gets a dev server that
   silently never reloads. Worth reporting if it is not already known.
4. **Restart the server before debugging any new MicroSim.** With the fix in place this should stop
   happening, but the reflex is cheap: if a sim's JS 404s, confirm the watcher is armed before
   suspecting the sim.

## Method note

This document was wrong twice, and both times a one-line remark from Dan corrected it.

**First:** the original explanation — *"new `extra_javascript` entries aren't picked up by
live-reload"* — was **invented**. It sounded plausible, was asserted confidently, and was never
checked. It also did not fit evidence already in hand: `docs/css/extra.css` had not updated either,
and `docs/` is unambiguously watched. *"It looks like the watcher did not fire"* was worth more than
the explanation, and following it found the real bug.

**Second:** the fix itself. Having bisected 8.1.7 ✅ / 8.2.1 ✅ / 8.3.1 ❌, the conclusion drawn was
"pin below 8.3" — because **every version tested was below the break**. Only versions that confirmed
the existing story got tested. *"Note that the current version of mkdocs is 1.6.1"* prompted a look at
the version landscape, which showed mkdocs had nothing newer to upgrade *to* — and that click had gone
on to 8.4.x, where the bug **is already fixed**. The recommended fix would have pinned this env
backwards, permanently, to avoid a bug that no longer exists.

Both failures are the same shape, and it is the shape that recurred all session: **testing the
hypothesis instead of testing the question.** Bisecting downward from a known-bad version answers "how
far back is it fine?" It does not answer "what is the fixed range?" — and the second question was the
one that mattered. When bisecting a regression, always probe **past** the break as well as behind it;
otherwise the fix is a downgrade by construction.

Cheapest lesson of the three: when the source says a log line should be printed, grep for it.
