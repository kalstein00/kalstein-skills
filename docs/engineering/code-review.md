## What it does

`code-review` reviews the complete committed and working-tree candidate along two independent axes. **Standards** checks documented repository rules and the code-smell baseline. **Spec** checks source requirements and established contracts affected by the change. A contract does not leave review scope because the ticket did not repeat it.

For behavior changes, the Spec [subagent](https://www.aihero.dev/ai-coding-dictionary/subagent) traces the changed effect through its actual consumers and challenges the guards that claim it is safe. The report keeps defects, unresolved evidence, and advisory suggestions separate. Findings and evidence gaps remain visible under each axis.

## When to reach for it

Type `/code-review`, or the agent reaches for it when you request a branch, PR, work-in-progress, or review-since pass.

| Situation | Reach for |
| --- | --- |
| A candidate needs standards, requirement, or affected-contract review | `code-review` |
| A running system is broken and its cause is unknown | [diagnosing-bugs](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/diagnosing-bugs.md) |
| The codebase needs an architecture survey beyond one candidate | [improve-codebase-architecture](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/improve-codebase-architecture.md) |
| Changes are finished and only scoped Git finalization remains | [git-commit](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/git-commit.md) |

## Prerequisites

Supply a fixed point such as a commit, branch, tag, or merge-base. The skill checks that it resolves and that the candidate contains a diff or new task files. It includes staged, unstaged, and new task files within the caller's scope.

Supply ticket or conversation requirements when available. Without an explicit product spec, Spec still reviews affected established contracts and discloses the missing source. Inferred expectations remain distinct from accepted requirements.

## Behavior review

The boundary ledger makes the implementation's assumptions checkable. For materially affected stateful or asynchronous behavior, it connects each stage's owner, value identity or coordinate frame, guard, and completion condition. Paths sharing guarantees can be grouped. Literal-copy and mechanical changes with no behavior impact receive a short applicability statement.

The reviewer tries to construct a reachable state where a guard passes but the promised contract is false. Relevant examples include a new request paired with retained old data, a published update not yet installed by its consumer, a captured position applied to another snapshot, or recovery defaults that differ from normal operation. These are conditional review techniques, not a product-specific checklist.

A source-backed ordering guarantee can exclude a counterexample. When external-library semantics decide the outcome, the reviewer follows the project's versioned-documentation route. An unresolved consumer edge receives a precise evidence gap and the smallest observation needed to resolve it. Neither a passing test nor the presence of a readiness flag proves every later stage completed.

## Common questions

**Can review rules live in CODING_STANDARDS.md or CONTRIBUTING.md?**

Yes. Applicable project instructions and current standards pointers lead discovery, including those files at the root and along the changed paths. The review reads relevant sections and follows references for specific gaps. Historical plans and audits are consulted when they resolve authority, supersession, or evidence. Behavior contracts found in a standards document also reach Spec; the filename does not limit them to Standards.

The reusable review method stays in the skill. Project documents own the rules and contracts being checked, while the behavior procedure is loaded for behavior changes. Moving the method into a standards file alone would not preserve its Spec routing or implementation-time checks.

**Why can a reviewed change still contain an asynchronous bug?**

Individually correct checks can describe different versions of state. A latest-request check does not establish that a retained result or installed consumer belongs to that request. The review now traces these relationships and challenges each material completion guard. It still needs source or documented evidence for the proposed sequence; it does not invent a race because code is asynchronous.

**Does this become a checklist for the product that exposed a bug?**

No product names, grid APIs, or historical row numbers are required by the procedure. Historical failures are validation samples. The same identity, generation, and consumer-boundary questions apply to background jobs, document analysis, caches, and other stateful changes. The target project's contracts determine which questions matter.

**Does it review uncommitted work?**

Yes. Both reviewers receive the same base, path scope, complete tracked diff, and new-file list. If the candidate changes, refresh affected review evidence rather than attaching an old verdict to new code.

**What happens without a spec?**

The report says that no explicit spec was available. Spec can still identify a regression of a sourced existing contract. It cannot turn inferred product meaning into an accepted requirement or certify missing product acceptance.

**Does it run the application or the full test suite?**

It reuses candidate-bound evidence and checks what conditions it actually exercised. Missing required evidence goes to the check owner with a specific requested observation. A reviewer remains read-only and does not start a broad rerun or implementation cycle.

**Can I treat no findings as proof of correctness?**

Read the coverage and limits alongside the findings. The reviewer may exclude a counterexample through source guards, establish a defect through a reachable sequence, or leave a precise relation unresolved. Required unresolved evidence prevents a clean pass. The report is checkable evidence about the inspected scope, not exhaustive proof of every possible behavior.

**What if another tool also uses the name `code-review`?**

Use the installed plugin's qualified skill name when the host supports it. Command resolution and recursion limits belong to the host. This skill keeps its existing identity and independent review axes.

## It's working if

- Standards and Spec arrive separately, with source citations for their own findings.
- A behavior contract found in a coding-standard document is checked by Spec without a repository-wide documentation sweep.
- Behavioral findings show a triggering sequence and the guard that is missing or insufficient.
- The ledger distinguishes request freshness, result identity, consumer application, and observable completion where those stages exist.
- Known guards can exclude counterexamples, while unsupported assumptions remain specific evidence gaps.
- A literal documentation edit completes without an unrelated state-machine audit.
- Candidate identity, reviewed axes, instruction revision or artifact, and report references are retained in the existing task record.

## Where it fits

`code-review` closes the review stage of [implement](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement.md) and the combined candidate in [implement-spec](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/implement-spec.md). It also runs independently on a supplied candidate. Implementation owners resolve findings and refresh affected verification; [git-commit](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/git-commit.md) consumes completed evidence.

[ask-matt](https://github.com/kalstein00/kalstein-skills/blob/main/docs/engineering/ask-matt.md) maps the surrounding workflows.
