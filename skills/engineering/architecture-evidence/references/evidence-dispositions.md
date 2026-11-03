# Evidence disposition examples

These synthetic examples illustrate records after LLM review; they are not findings about a target project.
Run the JavaScript from the repository root to construct IDs and records with the actual schema.
The example itself only builds objects. Do not copy its fixture HEAD into a real ledger.

```javascript
const {evidenceItems,fingerprint}=require('/absolute/skill/scripts/schema.cjs');
const one=identity=>evidenceItems([identity])[0];
const file=one({kind:'file',path:'example/main/session.ts'});
const other=one({kind:'file',path:'example/renderer/session.ts'});
const symbol=one({kind:'symbol',path:file.identity.path,qualifiedName:'Session.save',symbolKind:'method'});
const cycle=one({kind:'cluster',members:[file.id,other.id]});
const violation=one({kind:'violation',rule:'main-no-renderer',source:file.id,target:other.id});
const stable=one({kind:'symbol',path:'example/shared/codec.ts',qualifiedName:'decode',symbolKind:'function'});
const deferred=one({kind:'file',path:'example/main/restore.ts'});
const NA={validity:'not-applicable'};
const structure={schemaVersion:1,publicSurface:NA,
  percentiles:{fanIn:NA,fanOut:NA,impact:NA,complexity:NA},
  topGroups:{validity:'valid',population:'before-suppression',groups:['structure']},
  cycles:{validity:'valid',ids:[cycle.id]},violations:{validity:'valid',ids:[violation.id]},
  ownershipIdentity:fingerprint('example-ownership-v1'),metricSchemaIdentity:fingerprint('example-metrics-v1')};
const head='a'.repeat(40);
const snapshot={id:fingerprint({fixture:'reviewed-source',head}),head,baseline:{structure}};
const register={id:'C1',evidenceIds:[file.id,symbol.id,cycle.id,violation.id],
  evidence:'Source and graph confirm renderer state is read during main session save; focused restore test observes the dependency.',
  ownedBehavior:'Main owns the session save lifecycle; renderer supplies a serializable request.',
  outcome:'Saving a session no longer depends on renderer implementation state.',
  cohesiveMove:'Move request validation to the shared contract and keep save orchestration in main.',
  classification:'architecture',contracts:'Preserve save/restore ordering and error propagation; review applicable domain and ADR.',
  verification:'Focused session save/restore fixture must preserve success and failure behavior; dependency check must remove this edge.',
  dependencies:[],status:'pending'};
const candidateRef='docs/architecture/example-audit.md#c1';
const entries=[file,symbol,cycle,violation].map(item=>({...item,disposition:'accepted',
  reason:'LLM verified these independent signals describe the same session-save ownership violation.',snapshot,candidateRef}));
const stableBaseline={...structure,publicSurface:{validity:'valid',fingerprint:fingerprint('export declare function decode(input: string): Value;')},
  percentiles:{...structure.percentiles,fanIn:{validity:'valid',value:90,
    cohortKey:JSON.stringify(['fanIn','typescript:symbol','distinct-nodes','higher','coupling-v1:fixture:depth=2']),direction:'risk-higher'}},
  topGroups:{validity:'valid',population:'before-suppression',groups:['coupling']},
  cycles:{validity:'valid',ids:[]},violations:{validity:'valid',ids:[]}};
entries.push({...stable,disposition:'rejected',reason:'High fan-in is expected for this stable shared decoding Interface; callers share the same contract and focused tests support its error behavior.',
  snapshot:{...snapshot,baseline:{structure:stableBaseline}},candidateRef:null});
entries.push({...deferred,disposition:'deferred',reason:'Restore failure trace is missing; collect the trace and revisit in a later audit.',snapshot,candidateRef:null});
module.exports={entries,register};
```

Replace fixture observations, identities, metric applicability and snapshot with actual reviewed evidence.
The example candidate reference denotes a row that the owning workflow must actually create before
writing accepted records. All four typed IDs remain independently queryable and refer to that row.
Only the LLM's verified ownership explanation justifies the many-evidence-to-one-candidate relation.

For an authorized write, call `readLedger(root)`, then `recordDisposition(root, entry,
{expectedIdentity:readResult.identity})` from `<skill>/scripts/ledger.cjs` for each entry,
rereading between writes. A changed identity or malformed ledger must be repaired explicitly; never
replace it with an empty ledger. Preserve original IDs and use confirmed reconciliation for new paths.
`acceptedEligibility(readResult, acceptedId)` returns `{eligible:false,reason:'accepted duplicate'}`. It does not
decide rejected/deferred eligibility; use reconsideration and continuation owners for those cases.

These objects do not grant scan permission to write, publish, commit or implement C1. Keep the register
closed before authorized execution and update its execution status from actual verification evidence.
