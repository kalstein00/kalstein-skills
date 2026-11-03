---
name: diagnose
description: Establish a bug's cause from runtime evidence without authorizing a production fix.
disable-model-invocation: true
---

# Diagnose

Call the Skill tool with "diagnosing-bugs" for its evidence loop (read and apply its bundled SKILL.md when the tool is unavailable) to establish the exact symptom, an agent-runnable reproduction where possible, falsifiable hypotheses, and distinguishing observations. This entry preserves the local diagnosis-only command. Read its instructions and apply the investigation stages; this request does not authorize its repair stage.

Return the confirmed cause and evidence, material alternatives rejected, commands/results, temporary instrumentation removed, and remaining unknowns. If a fix is also requested, use the route in [the execution contract](../implement/EXECUTION.md), carrying the reproduction into the required RED/GREEN and original-scenario recheck. A diagnosis-only result changes no production behavior.
