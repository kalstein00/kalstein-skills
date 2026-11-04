# Live UI evidence

## Define the journey in the ticket

For each changed UI outcome, record:

- starting screen, runtime target, necessary data, and prerequisites;
- a short ordered sequence of normal user actions;
- expected visible result and an observable pass condition;
- relevant enabled/disabled, help, empty/error, keyboard/focus, or size states;
- save/reopen/restart checks only when persistence or restore belongs to acceptance;
- automatic test seam and the key state(s) to capture.

Cover relevant states, not a universal device/theme matrix. Reuse acceptance decisions from the spec. Missing screenshot filenames or a known port need not block ticket planning; the implementer resolves runtime paths before verification.

## Operate the actual final candidate

Use the project's Agent Browser route and installed version-matched instructions. Build/reload only as required for the changed runtime and confirm the app contains the intended candidate. Identify the URL/window and relevant viewport or window size; for an installed-artifact requirement, verify that artifact rather than a dev build.

Navigate, click, type, scroll, and use keyboard controls through the visible UI. Use the project's public data/import path for setup. Internal state injection, direct IPC calls, DOM edits, or mocked component pages may help diagnosis, but cannot stand in for the accepted user journey. Read-only state or DOM inspection may supplement visible evidence. Test automation and live operation have separate results; reuse one run only when it actually fulfills both contracts.

## Capture and inspect

Capture the key result state after the real actions. Use before/after images for a visual correction or when comparison explains the change; otherwise one or a few meaningful state captures are enough. Include surrounding controls so the result can be judged in context. For an ephemeral transition that a still image cannot demonstrate, pair the capture with observable timing/event evidence or a short recording when available.

Immediately open each selected image with the available image-viewing tool and judge its pixels. Accessibility snapshots and file existence are supplementary. Check the acceptance result, wrapping/truncation, overlap, alignment, contrast, focus/disabled/help states when relevant, and consistency with neighboring controls. Record a defect, fix it inside scope, and refresh affected tests/live evidence before selecting a replacement capture. Stop repeated cosmetic tuning when the agreed outcome is satisfied; unresolved defects remain explicit.

Prefer synthetic or redacted input before capture. Exclude secrets, private paths, personal data, and unrelated windows from shareable evidence. Do not upload evidence to a tracker or public host unless the task's delivery authority covers that destination. Keep images as task artifacts; repository commits are needed only when the project owns visual goldens or expressly requires committed evidence.

## Connect evidence to acceptance

Record the candidate commit or working-tree state, app/build identity, target, size, journey, observed result, capture path, and inspection outcome in the existing task/QA record. Use a compact mapping:

| Criterion | Actions | Observed result | Evidence | Result |
| --- | --- | --- | --- | --- |
| Expected visible behavior | Ordered UI actions | Actual visible outcome | Inspected image and test reference | Pass / Fail / Unverified |

Use the project's durable QA owner when it exists. Keep each selected screenshot in the task's retained artifact location, where it can be reopened after app and test cleanup. If the capture starts in a disposable directory, copy the inspected image to the retained artifact location before cleanup. State any retention or access limits. Reuse evidence while the candidate, state, and environment remain relevant. If review or a later change affects the captured UI result, reopen the affected state in the final app and replace the image after inspecting it.

## Completion response

Include these facts in the final chat response and carry them through worker/batch/PR reports:

1. **Changed behavior:** what the user can now do.
2. **Live verification:** actual action sequence and observed result, with the verified target/candidate.
3. **Tests:** focused automated result, plus applicable final gates and any deferred parent-owned checks.
4. **Screenshot:** name the visible state and provide a reopenable link to the retained image. Also display it inline when supported, using the absolute local image path for a local artifact. A worker passes the retained image paths to its parent.
5. **Documentation and gaps:** updated document(s) or a concrete no-change reason; failed, skipped, blocked, or unverified acceptance.

Never label required-but-unverified work complete. A screenshot proves only the captured appearance; persistence, interaction, accessibility, or IPC claims need the corresponding observations and tests. Missing rendering support in the chat is a presentation limitation; it does not excuse missing capture or pixel inspection.
