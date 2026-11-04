# Ticket handoff

Use this contract when creating tickets, checking them before dispatch, or implementing an existing ticket. A fresh worker must be able to recover the accepted scope and verification boundary from the ticket and its references.

## Required content

| Content | Readiness condition |
| --- | --- |
| Source and decisions | Link any source spec and relevant ADRs or design decisions. Preserve decisions made only in conversation in the ticket or a durable linked note. Include constraints and excluded work; write `None` when there are none. |
| Prerequisites | Name blocking tickets and required starting state, fixtures, or capabilities. Separate a prerequisite from work this ticket delivers. |
| Acceptance | Each criterion names an observable result and what would make it fail. It is satisfiable within this ticket once its prerequisites hold; acceptance owned by another ticket stays there. |
| Verification | Map each criterion to its public boundary, inputs/starting state, expected result, and check. For behavior tests, state what the boundary catches and misses, plus relevant error or alternate states. Direct changes name proportionate checks instead. |

Use stable spec, ADR, glossary, test-convention, and runtime references. Discover executable commands from the target project's instructions and configuration; preserve any explicitly agreed command. Describe product contracts precisely while leaving routine implementation choices to the worker. Implementation file paths and line numbers are optional navigation hints, not acceptance requirements.

For new or repaired behavior, identify the observation expected to fail before implementation. Existing-behavior coverage, mechanical changes, and documentation work use their selected route without inventing a product failure. UI behavior/layout also requires the scenario and evidence in the [UI evidence protocol](../ui-tdd/EVIDENCE.md).

## Before approval and dispatch

`to-tickets` presents the criteria, decisions, and verification boundaries with the proposed breakdown so the existing approval covers them. Resolve missing product decisions before publishing a ticket as `ready-for-agent`. A ticket may reference already accepted material instead of requesting the same approval again. Split work when it requires several independently deliverable outcomes or unresolved product/interface decisions prevent a bounded implementation.

Before dispatch, the parent checks this content and passes its references and accepted decisions to the worker. For an existing ticket, recover missing information from accepted sources and project instructions first. A ready label alone is not proof of this contract. If a necessary decision remains unresolved, name that decision and return it to the parent, or the user for standalone work, before making edits that depend on it. Routine internal implementation choices remain with the worker.

## Accepted test boundaries

A spec, ticket, or earlier agreement counts as seam approval when it identifies the public boundary to test, explicitly or through an unambiguous public operation such as an API request/response. Generic approval of a feature does not approve an unspecified test boundary. Reuse accepted boundaries and their catch/miss limits; confirm only a missing or materially changed boundary under `tdd`.
