---
name: grill-with-docs
description: Interview the user about a design, document agreed domain decisions, and end with a plan for review.
disable-model-invocation: true
---

Load `grilling` and `domain-modeling` through the Skill tool. When the harness has no Skill tool, read the bundled [grilling](../../productivity/grilling/SKILL.md) and [domain-modeling](../domain-modeling/SKILL.md) instructions directly.

1. Inspect the repository and run the interview in rounds. Treat answers such as "yes" or "start with X" as design decisions for the plan. Record settled terms and qualifying ADRs through domain modeling when writes are allowed.
2. Once the user confirms the shared design, present a reviewable plan in chat. Include the agreed scope, work order, acceptance criteria, verification approach, and any deferred decisions. For a documentation-only session, summarize the agreed model and the documents updated. Save a separate plan file only when the user requests it and writes are allowed.
3. End the turn after presenting the plan or documentation summary. If a decision requires a prototype before the plan can be completed, report the open decision and end the turn. Implementation, prototypes, spec publication, and ticket creation each require a separate user request after this handoff. During the interview and planning, limit edits to design documentation.
