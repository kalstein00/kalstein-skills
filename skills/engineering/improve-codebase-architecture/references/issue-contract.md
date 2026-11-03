# Architecture Tickets

When the user requests issue publication through this workflow, turn the approved Candidate Register into vertical slices and publish in dependency order using the configured tracker. Use the bundled to-tickets templates as document reference; do not invoke that explicit-only command automatically. If a new breakdown decision is needed, resolve it with the user or direct them to invoke to-tickets. Reuse an already approved breakdown without reopening it.

Preserve the candidate ID, demonstrated friction, intended observable outcome, relevant domain/ADR constraints, and focused verification as supporting context. Use the upstream ticket's What to build, Acceptance criteria, and blocker relationships rather than a second authoritative template.

Resolve material Interface, ownership, or migration decisions before publishing implementation work as ready. When the user requests a separate decision ticket, make its recorded decision the outcome and block implementation on it; do not invent an AFK/HITL schema requirement for every ticket.

Publishing does not implement or close the work. `implement` owns implementation/review/commit; explicitly requested `close-spec` owns evidence-based tracker closure.
