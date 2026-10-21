# ADR 0001: Name the repository family Rocket Agents

- Status: Accepted
- Date: 2026-08-19

The umbrella product is Rocket Agents; BRP is its workflow engine. The public
control plane is `syntopica/agents`. Independently maintained capabilities keep
distinct repository ownership rather than sharing private operational state
through the control plane.

Names and local paths have changed since this decision. The
[architecture guide](../architecture.md) defines current ownership, including
Scribe for conversation capture and transport and Atrium for indexing and
retrieval. Private libraries, host bootstrap, knowledge stores, account state,
and credentials stay outside this repository.
