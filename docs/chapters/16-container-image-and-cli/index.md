# The Container Image and the Role Dispatcher CLI

## Summary

This chapter explains the one-image-many-roles philosophy that underlies deployment: the multi-stage Dockerfile, the non-root runtime, and the CLI role dispatcher that turns a single container image into a gateway, a processor, a summarizer, or any other role by command alone.

## Concepts Covered

This chapter covers the following 21 concepts from the learning graph:

1. One Image Many Roles Philosophy
2. Dockerfile Multi-Stage Build
3. Base Build Stage
4. Builder Build Stage
5. Runtime Build Stage
6. Non-Root Container User
7. uv Sync Command
8. Docker Build Cache Mount
9. Frozen Lockfile
10. Healthcheck Directive
11. PID 1 Signal Handling
12. Role Dispatcher CLI
13. Bootstrap CLI Role
14. Seed Demo Command
15. Loadgen Command
16. Replay CLI Command
17. Healthcheck CLI Command
18. Identity CLI Role
19. Analytics API CLI Role
20. Admin API CLI Role
21. Dashboards CLI Role

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md)
- [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)

---

TODO: Generate Chapter Content
