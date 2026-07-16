"""Import real learning graphs from the intelligent-textbook repos next door.

Replaces the hand-authored curricula this seeder started with. Those were invented —
plausible, but vouched for by nobody. These are the actual learning graphs produced by
the `learning-graph-generator` skill and committed to each textbook repo, so every
concept, prerequisite edge, and taxonomy category in the demo is content someone
already stood behind.

SOURCE LAYOUT
-------------
Each textbook repo carries:

    docs/learning-graph/learning-graph.csv    ConceptID,ConceptLabel,Dependencies,TaxonomyID
    docs/learning-graph/taxonomy-names.json   {"CELL": "Cell Biology", ...}
    docs/learning-graph/metadata.json         {"title": ..., "creator": ..., "license": ...}
    docs/sims/<sim>/metadata.json             real MicroSims, with real titles

`Dependencies` is pipe-separated ConceptIDs. Taxonomy categories become chapters — in
this catalogue they are the closest thing to a chapter the source actually defines, and
they are already human-authored names ("Cellular Energetics", not "Chapter 5").

WHAT IS REAL AND WHAT IS NOT
----------------------------
Real: concepts, labels, DEPENDS_ON edges, taxonomy categories and their names, textbook
titles, MicroSim titles and types.

Inferred: which concepts a MicroSim COVERS. The sim metadata has no concept ids — only
3 of 76 biology sims carry a `concepts` field — so this matches sim title and topic text
against concept labels within the same book, conservatively. A sim that matches nothing
confidently gets no COVERS edge rather than a guessed one. See `_match_concepts`.

Synthesised: pages, quizzes, and questions — the source has concepts, not pagination.
And of course every learner, district, and mastery score, which is the whole point.

CONCEPT IDS ARE NAMESPACED
--------------------------
The CSVs number concepts 1..N *per book*, so ids collide across the catalogue. Every id
here is prefixed with the repo slug (`biology-42`), which is also what makes the three
books-in-one-graph queries safe.

ORDER IS NOT GIVEN
------------------
46 of 53 CSVs contain forward references — a concept that depends on one declared later
in the file. The graphs are acyclic, so a topological order exists, but the file order
is not it. `_topological` computes one. seed.py's mastery walk depends on this: it must
score every prerequisite before the concept that needs it.
"""

from __future__ import annotations

import csv
import json
import logging
import re
from pathlib import Path
from typing import TypedDict

log = logging.getLogger(__name__)

ConceptSpec = tuple[str, str, str, list[str]]  # id, label, taxonomy category, prereqs
ChapterSpec = tuple[str, list[ConceptSpec]]  # title, concepts
MicroSimSpec = tuple[str, str, str, str, list[str]]  # id, title, type, status, concepts


class Book(TypedDict):
    textbook_id: str
    title: str
    subject: str
    repo_url: str
    # TOPOLOGICAL order, and the authoritative one for anything walking prerequisites.
    # `chapters` groups these same concepts by taxonomy, and that grouping does NOT
    # preserve topological order — a concept in chapter 1 may depend on one in chapter
    # 3, because a taxonomy category is a subject area, not a teaching sequence.
    concepts: list[ConceptSpec]
    chapters: list[ChapterSpec]
    microsims: list[MicroSimSpec]


# Words that carry no signal when matching a sim to a concept. Without this, "The
# Explorer" matches "The Cell" on 'the' and the COVERS edges become noise.
_STOP = {
    "a",
    "an",
    "and",
    "the",
    "of",
    "for",
    "to",
    "in",
    "on",
    "with",
    "vs",
    "versus",
    "explorer",
    "simulator",
    "calculator",
    "builder",
    "viewer",
    "demo",
    "interactive",
    "visualizer",
    "diagram",
    "tool",
    "lab",
    "model",
    "chart",
    "graph",
    "sim",
    "microsim",
    "using",
    "understanding",
    "introduction",
    "intro",
    "basic",
    "basics",
    "overview",
}


def _tokens(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", text.lower()) if t and t not in _STOP and len(t) > 2}


def _slug(text: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", text.lower())).strip("-")


def _topological(rows: list[tuple[str, str, str, list[str]]]) -> list[ConceptSpec]:
    """Kahn's algorithm, prerequisites first.

    The CSVs are not reliably ordered (46 of 53 contain forward references), and
    seed.py's single forward pass over the concept list requires that a concept's
    prerequisites are already scored when it is reached. Ties are broken by the
    original file order so the result is deterministic and still reads roughly like
    the book. Raises on a cycle rather than silently emitting a partial order —
    design line 573 makes acyclicity load-bearing for prerequisite analysis.
    """
    by_id = {cid: (cid, label, tax, deps) for cid, label, tax, deps in rows}
    order = {cid: i for i, (cid, _, _, _) in enumerate(rows)}
    indegree = {cid: 0 for cid in by_id}
    dependents: dict[str, list[str]] = {cid: [] for cid in by_id}

    for cid, _label, _tax, deps in rows:
        for d in deps:
            if d in by_id:
                indegree[cid] += 1
                dependents[d].append(cid)

    ready = sorted([c for c, n in indegree.items() if n == 0], key=lambda c: order[c])
    out: list[ConceptSpec] = []
    while ready:
        cid = ready.pop(0)
        _c, label, tax, deps = by_id[cid]
        out.append((cid, label, tax, [d for d in deps if d in by_id]))
        newly = []
        for dep in dependents[cid]:
            indegree[dep] -= 1
            if indegree[dep] == 0:
                newly.append(dep)
        if newly:
            ready = sorted(ready + newly, key=lambda c: order[c])

    if len(out) != len(rows):
        stuck = sorted(set(by_id) - {c for c, _, _, _ in out}, key=lambda c: order[c])
        raise ValueError(f"cycle in learning graph; {len(stuck)} concepts unresolved: {stuck[:5]}")
    return out


def _match_concepts(sim_text: str, concepts: list[ConceptSpec], limit: int = 3) -> list[str]:
    """Best-effort MicroSim -> Concept mapping by label overlap.

    Deliberately conservative. A COVERS edge that is wrong is worse than one that is
    missing: the demo makes claims about which content teaches which concept, and a
    bad edge quietly poisons the "which MicroSim should I build next?" query. Requires
    that the concept's whole label (minus stopwords) appears in the sim's text, which
    matches "ATP Yield Calculator" -> "ATP Yield" but not -> "Calculus".
    """
    text = _tokens(sim_text)
    if not text:
        return []
    scored: list[tuple[int, str]] = []
    for cid, label, _tax, _deps in concepts:
        label_tokens = _tokens(label)
        if not label_tokens:
            continue
        if label_tokens <= text:  # every meaningful token of the label is present
            scored.append((len(label_tokens), cid))
    scored.sort(reverse=True)
    return [cid for _n, cid in scored[:limit]]


def _load_sims(repo: Path, prefix: str, concepts: list[ConceptSpec]) -> list[MicroSimSpec]:
    sims_dir = repo / "docs" / "sims"
    if not sims_dir.is_dir():
        return []
    out: list[MicroSimSpec] = []
    for sim in sorted(p for p in sims_dir.iterdir() if p.is_dir()):
        meta_path = sim / "metadata.json"
        title = sim.name.replace("-", " ").title()
        topic = ""
        if meta_path.is_file():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8", errors="replace"))
                title = str(meta.get("title") or title)
                edu = meta.get("educational")
                topic = str(edu.get("topic", "")) if isinstance(edu, dict) else ""
            except (json.JSONDecodeError, OSError):
                pass  # a malformed sim metadata is not a reason to drop the book
        covered = _match_concepts(f"{title} {topic} {sim.name.replace('-', ' ')}", concepts)
        # §4.1: status in {scaffold, built, approved}. The repos do not record a review
        # state, so "built" is the honest answer for "the directory exists and has a
        # sim in it" — claiming "approved" would invent a review that never happened.
        out.append((f"{prefix}-{_slug(sim.name)}", title, "p5js", "built", covered))
    return out


def discover(root: Path) -> list[Path]:
    """Textbook repos under `root`, identified by a committed learning graph."""
    found = sorted(
        p.parent.parent.parent
        for p in root.glob("*/docs/learning-graph/learning-graph.csv")
        if "/site/" not in str(p)
    )
    return found


def load_book(repo: Path) -> Book | None:
    """Read one textbook repo into a Book, or None if its learning graph is unusable."""
    lg = repo / "docs" / "learning-graph"
    csv_path = lg / "learning-graph.csv"
    if not csv_path.is_file():
        return None

    prefix = _slug(repo.name)
    rows: list[tuple[str, str, str, list[str]]] = []
    with csv_path.open(newline="", encoding="utf-8", errors="replace") as f:
        for r in csv.DictReader(f):
            cid = (r.get("ConceptID") or "").strip()
            label = (r.get("ConceptLabel") or "").strip()
            if not cid or not label:
                continue
            deps = [
                f"{prefix}-{d.strip()}"
                for d in (r.get("Dependencies") or "").split("|")
                if d.strip()
            ]
            rows.append((f"{prefix}-{cid}", label, (r.get("TaxonomyID") or "").strip(), deps))

    if not rows:
        return None

    try:
        concepts = _topological(rows)
    except ValueError as e:
        log.warning("skipping %s: %s", repo.name, e)
        return None

    tax_names: dict[str, str] = {}
    tax_path = lg / "taxonomy-names.json"
    if tax_path.is_file():
        try:
            tax_names = json.loads(tax_path.read_text(encoding="utf-8", errors="replace"))
        except (json.JSONDecodeError, OSError):
            tax_names = {}

    title, subject = repo.name.replace("-", " ").title(), repo.name
    meta_path = lg / "metadata.json"
    if meta_path.is_file():
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8", errors="replace"))
            title = str(meta.get("title") or title)
            subject = str(meta.get("subject") or subject)
        except (json.JSONDecodeError, OSError):
            pass

    # Taxonomy categories become chapters, in order of first appearance in the
    # topological ordering — so a chapter's prerequisites tend to precede it.
    chapters: list[ChapterSpec] = []
    seen: dict[str, list[ConceptSpec]] = {}
    for c in concepts:
        seen.setdefault(c[2] or "GEN", []).append(c)
    for tax_id, group in seen.items():
        chapters.append((tax_names.get(tax_id, tax_id), group))

    return {
        "textbook_id": f"tb-{prefix}",
        "title": title,
        "subject": subject,
        "concepts": concepts,
        # Constructed, not read: the repos have no remote recorded in the learning
        # graph, but every sim's `identifier` is dmccreary.github.io/<repo>/..., so
        # this is the repo that publishes it.
        "repo_url": f"https://github.com/dmccreary/{repo.name}",
        "chapters": chapters,
        "microsims": _load_sims(repo, prefix, concepts),
    }


def load_catalog(root: Path, only: list[str] | None = None) -> list[Book]:
    """Every usable textbook under `root`, optionally filtered to `only` repo names."""
    books: list[Book] = []
    for repo in discover(root):
        if only and repo.name not in only:
            continue
        book = load_book(repo)
        if book:
            books.append(book)
        else:
            log.warning("no usable learning graph in %s", repo.name)
    return books
