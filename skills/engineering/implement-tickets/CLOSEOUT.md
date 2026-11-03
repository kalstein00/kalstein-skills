# Parent-owned per-ticket close-out

This contract applies only inside an explicitly requested `implement-tickets` batch. The parent performs tracker writes; workers provide implementation evidence. Use the configured tracker and the `close-spec` capability. Load that capability through the Skill tool, or read and apply its bundled instructions when the host has no Skill tool. Do not spawn a separate close-out agent.

## Scope and readiness

- Resolve the exact supplied implementation tickets and their actual parent relationships. Parent PRDs/specs and unrelated issues are outside automatic closure scope, including when all children become closed. Report an input that is a parent/spec rather than silently closing it or expanding its children.
- Before a ticket closes, require its current acceptance criteria, focused checks, review, documentation, scoped commit, and required UI live/E2E/image evidence. Reuse applicable evidence; neither a commit nor a worker's success claim proves acceptance.
- The parent's deferred batch suite covers broad regression/common quality checks, not missing ticket acceptance. Run any deferred check needed for that ticket's acceptance before closing it. If acceptance requires publication, installation, or merge, satisfy that requirement using established delivery authority or leave the ticket blocked; closure authority does not authorize a push/merge.
- Reconcile already closed tickets against valid scope/evidence on resume. A correctly completed ticket needs neither reimplementation, another comment, nor another close call. A closed state without usable acceptance proof is a reported gap, not permission to count implementation as verified.

## Complete one ticket before advancing

1. Re-read current scope/state and relevant completion history. Confirm the reviewed commit and evidence cover the exact candidate. Keep incomplete tickets open and report the missing criterion or failed gate.
2. Post one concise completion comment through the configured tracker. Include the implemented outcome, acceptance mapping, commit SHA(s)/branch and local-versus-published state, verification results, UI journey/inspected artifact references when applicable, documentation, and separately named pending batch gates. Do not attach private/local-only files as if remote readers could access them; state artifact access/retention limits. Reuse an existing matching comment during recovery.
3. Close this implementation ticket with the tracker's successful/completed resolution and clean up only its configured stale execution/ready labels. A comment or checked box is not an issue-state transition. Preserve historical issue bodies and existing parent/child links. Workers never perform this mutation.
4. Read back the ticket state, successful resolution, completion comment, and applicable labels. If a write times out or returns an uncertain result, reconcile the actual state/comment history before retrying. Do not duplicate a comment or close request blindly. Missing confirmation leaves the queue blocked before the next ticket.
5. Read the actual parent's child states/progress when the tracker exposes them. Native GitHub sub-issue progress comes from the linked child states; do not rewrite the PRD body, invent relationships, or substitute a chat counter. Count the complete actual child set, not just the supplied batch. If parent progress is unavailable, retain the confirmed child closure and explicitly report the progress as unverified; do not fabricate `1/4`. A missing/conflicting relationship is reported without adding links unless that edit is already authorized.
6. Save ticket/comment URLs, verified closed state, commit/evidence references, deferred batch gates, and observed parent progress or its precise limitation in the existing checkpoint. Only then dispatch the next ticket.

## Later failures and recovery

When a later ticket or final batch gate fails, first determine which acceptance it invalidates. A missing broad gate or unrelated failure keeps the batch incomplete without falsely reopening valid tickets. If evidence shows a ticket closed by this batch no longer meets its acceptance on the current candidate, the parent updates that ticket with the failed evidence, reopens it, verifies the open state, and returns the repair to the owning worker. Preserve the parent's actual progress change. Re-close only after restored acceptance and the same close-out checks. Do not reopen unrelated or pre-existing closed tickets without established authority.

Keep successful closures when a queue stops on another blocked ticket. Report closed, blocked, and pending work separately. Passing all batch gates does not authorize closing the parent PRD/spec; that is a separately requested operation.
