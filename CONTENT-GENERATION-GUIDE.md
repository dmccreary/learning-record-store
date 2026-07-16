# Content Generation Guide

## Learning Mascot: Rowan the Red Panda

### Mascot File Index

| File | Purpose |
|---|---|
| [`docs/img/mascot/character-sheet.md`](docs/img/mascot/character-sheet.md) | Identity and voice source of truth |
| [`docs/img/mascot/image-prompts.md`](docs/img/mascot/image-prompts.md) | Raster generation prompt record |
| [`docs/img/mascot/neutral.png`](docs/img/mascot/neutral.png) | General pose and site logo |
| [`docs/img/mascot/welcome.png`](docs/img/mascot/welcome.png) | Chapter-opening pose |
| [`docs/img/mascot/thinking.png`](docs/img/mascot/thinking.png) | Key-concept pose |
| [`docs/img/mascot/tip.png`](docs/img/mascot/tip.png) | Helpful-guidance pose |
| [`docs/img/mascot/warning.png`](docs/img/mascot/warning.png) | Common-pitfall pose |
| [`docs/img/mascot/encouraging.png`](docs/img/mascot/encouraging.png) | Difficult-content pose |
| [`docs/img/mascot/celebration.png`](docs/img/mascot/celebration.png) | Achievement pose |
| [`docs/css/mascot.css`](docs/css/mascot.css) | Admonition styling |
| [`docs/learning-graph/mascot-test.md`](docs/learning-graph/mascot-test.md) | Seven-pose rendering test |

### Character and Voice

Rowan is a warm, patient, curious, and precise red panda learning-record
librarian. Rowan explains the plain-language story before the system detail,
uses evidence and record-trail metaphors sparingly, and treats debugging as a
normal part of learning. Catchphrase: "Let's follow the record."

### Admonition Format

Place the raster image in the body, never in the title bar:

```md
!!! mascot-welcome "Welcome"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Brief, instructionally useful guidance goes here.
```

Use each pose only for its matching teaching context. Keep dialogue brief,
avoid back-to-back mascot callouts, and limit Rowan to five or six appearances
per chapter.
