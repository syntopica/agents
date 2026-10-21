# ADR 0002: Separate the public engine from private instance content

- Status: Accepted
- Date: 2026-10-21

The public control plane distributes reusable policy and code. Private instances
own account identities, customer classifications, authorization exceptions, host
inventories, and operating history. Public examples preserve procedures and
safety constraints through synthetic names and role-based ownership. Preserve
private originals before removal; ordinary cleanup leaves Git history intact
because rewriting published history has separate recovery and coordination
costs.
