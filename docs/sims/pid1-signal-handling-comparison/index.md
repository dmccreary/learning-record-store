---
title: PID 1 Signal Handling — Exec Form versus Shell Form
description: Given a simulated SIGTERM, compare how the signal propagates under exec-form versus shell-form ENTRYPOINT, and predict whether in-flight work finishes cleanly or is killed.
status: implemented
library: p5.js
bloom_level: Analyze (L4)
---

# PID 1 Signal Handling — Exec Form versus Shell Form



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md).

```text
Type: microsim
**sim-id:** pid1-signal-handling-comparison<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Given a simulated SIGTERM, compare how the signal propagates under exec-form versus shell-form ENTRYPOINT, and predict whether in-flight work finishes cleanly or is killed.

Canvas layout: Two side-by-side process-tree panels, left "Exec form: ENTRYPOINT [\"lrs\"]" (one box, "PID 1: lrs process"), right "Shell form: ENTRYPOINT lrs" (two stacked boxes, "PID 1: /bin/sh -c lrs" above "PID 2 (child): lrs process"). A control strip above: "Send SIGTERM" button and a "Grace period" slider (1-10s, default 5). A countdown and status readout below each panel.

Visual elements: Before SIGTERM, both panels show calm teal boxes with a pulsing "in-flight request" icon. On click, a signal icon travels from a "container runtime" icon down to PID 1 in each panel. Left panel: signal reaches `lrs` directly; box turns amber ("draining"), the request completes and fades, box turns gray ("exited") before the grace period ends. Right panel: signal reaches the shell, which turns amber, but no arrow continues to the child box, which stays teal ("unaware") until the countdown hits zero, then turns red ("SIGKILL -- work lost").

Interactive controls: "Send SIGTERM" button starts both panels' animation together; "Grace period" slider adjusts the countdown; "Reset" restores the pre-signal state.

Interactive features: Clicking either process box opens an infobox stating its PID, whether it received SIGTERM directly, and — for the child box — that Docker and Kubernetes send SIGTERM only to PID 1 by default.

Color coding: Teal running, amber draining, gray clean exit, red unclean SIGKILL.

Responsive design: Panels stack vertically on narrow viewports; the control strip stays fixed above both.
```

## Related Resources

- [Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md)
