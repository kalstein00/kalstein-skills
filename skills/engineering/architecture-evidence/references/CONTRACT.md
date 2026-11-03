# Architecture Evidence Interface v1

## Report schema 5: candidate filtering and comparison diagnostics

Metric/identity record v1과 별도로 최상위 report schema는 5이다. 기본 네 결합도 지표는
confirmed-coupling-v1이며 raw 혼합 graph는 staticTestLinkage와 graph collector에 남는다.
structure의 SCC는 source-module-imports-v2의 소스 확인 파일 관계만 사용한다.
binding 규칙/metric 의미는 snapshot.metricSchema, collector bytes와 고정 source 입력에
포함된다. schema 4 이하 또는 알 수 없는 report의 reuse는 명시적으로 fresh scan을 요구한다.
같은 schema라도 기존 source/config/graph/ledger fingerprint 검증을 통과해야 한다.
이전 report와 ledger를 새 의미로 자동 마이그레이션하지 않는다.

2026-09-27 후속 수정: schema 5는 type-dependent SCC를 후보에서 제외하고,
`queue.comparisonDiagnostics`에 비교 불가 항목을 별도로 보존한다. rejected 비교 실패는
새 후보가 아니다. baseline의 `item-observations-v2`는 항목 소스·선언·원시 구조 관측을
비교하며 Git 이력과 상대 순위는 지문에서 제외한다. metric 정의/typed ID는 변경하지
않으므로 snapshot metricSchema의 architecture-evidence-v4 identity는 유지한다.
재선정과 이전 baseline 호환 규칙은 [RECONSIDER-STRUCTURE](RECONSIDER-STRUCTURE.md)를 따른다.

2026-09-27: schema 4는 SCC의 dependencyKind/valueCyclePaths, 선언 surface의 breakdown,
selection schema 2의 signalContext, baseline의 선택적 reviewedEvidence를 보존한다.
크기·export 수만 선정된 shape-only, 여러 신호군이 겹친 multiple-signal-groups,
그 외 single-signal-group을 구별한다. 이는 선정된 Top 목록의 성격이며 미선정된 모든
신호가 없다는 주장이나 결함 심각도 분류가 아니다. 원시 지표, ID와 5/20/3 상한은 유지한다.

`schema.cjs`는 번들 수집기, ranking, scanner와 ledger가 공유하는 순수 JSON Interface다.
보고서를 실제 개선 후보로 채택하는 판단은 보고서 소비자가 수행한다.
검증: 저장소 root에서 `node --test <skill>/scripts/schema.test.cjs`.

## Identity와 직렬화

`canonicalJson`은 object key를 UTF-16 code-unit 순서로 정렬하고 array 순서는
유지한다. JSON 이외 값과 비유한 숫자는 거부한다. `fingerprint`는 이 UTF-8
문자열의 SHA-256이다. 모든 계약은 정확한 필드 집합을 쓰며 확장은 새 schema로 한다.
경로는 저장소 상대 경로와 `/`를 사용하며 대소문자를 보존한다.

`evidenceId(identity)`의 입력은 다음 중 하나다.

```js
{ kind: 'file', path: 'src/a.ts' }
{ kind: 'symbol', path: 'src/a.ts', qualifiedName: 'A.run', symbolKind: 'method' }
// 동명 충돌 때만 discriminator: 'overload:string' 같은 구조적 키를 추가한다.
{ kind: 'cluster', members: ['file:sha256:...', 'symbol:sha256:...'] }
{ kind: 'violation', rule: 'layer-rule', source: 'file:sha256:...', target: 'file:sha256:...' }
```

ID는 `kind:sha256:<digest>`다. cluster members는 중복 제거·정렬 후 hash한다.
줄 번호는 ID 필드가 아니며 rename 대응은 별도 Module이 소유한다.
`evidenceItems(identities)`는 ID 순서의 `{id, identity}`를 반환하고 중복 ID를
거부한다. symbol 충돌을 임의로 합치지 말고 구조적 discriminator를 제공한다.

## Metric

```js
{ schemaVersion: 1, itemId: 'file:sha256:...', name: 'loc', unit: 'lines',
  direction: 'higher', source: 'collector@version:snapshot', cohort: 'typescript:file',
  population: 10, validity: 'valid', value: 0 }
```

`metricRecord`는 검증한 복사본을 반환한다. direction은 higher/lower,
validity는 valid/unavailable/failed다. population은 비교 대상 개수(0 이상 정수)이며
valid 값은 유한한 숫자이고 population은 양수다. 미지원/실패는 value:null과
reason 문자열을 사용한다. 수집 실패를 0점으로 대체하지 않는다. 구체적인 metric
수식·cohort·최소 표본 규칙은 각 collector/ranking의 버전 있는 schema가 소유한다.
정적 test linkage는 coverage가 아니며 공개 AST surface는 전체 Interface가 아니다.

## Snapshot

```js
{ schemaVersion: 1,
  source: { head: '<HEAD>', files: [{ path: 'src/a.ts', fingerprint: '<content hash>' }],
    dirtyFingerprint: '<dirty contents hash, including an explicit empty-set hash when clean>' },
  git: { commits: ['<selected SHA in selection order>'], selection: '<versioned selection config identity>' },
  graph: { identity: '<graph content identity or explicit missing marker>', freshness: 'fresh' },
  tools: { typescript: '5.3.3' }, config: '<config hash>', metricSchema: '<schema identity>',
  ownership: '<map hash>', ledger: '<ledger hash or explicit absent marker>' }
```

`snapshotRecord`은 `{id,input}`을 반환한다. source files는 경로 순으로 정렬하고
중복 경로/commit은 거부한다. graph freshness는 fresh/stale/missing/unknown이다.
수집기가 graph의 실제 freshness와 content hash를 검증해야 하며 이 함수는
그 진위를 판정하지 않는다. runtime/tool/collector 버전을 tools에 함께 기록한다.
dirty source 크기·구조와 HEAD churn의 차이는 source와 git의 별도 입력으로 보존한다.
휘발 시간/진행 로그는 snapshot 밖에 두며 source/config/ledger 변화는 identity를 바꾼다.

The private metric transport gzip-compresses binding evidence as a versioned base64 envelope and restores the complete public JSON before scan assembly. This prevents duplicated raw-edge/proof payloads from exhausting the existing 64 MiB child-process wire limit. Expanded binding evidence has an explicit 128 MiB limit on both encoding and decoding; oversized, corrupt or unsupported envelopes fail visibly. The metric table, public evidence, classification identity and raw report format are unchanged. Collector-byte fingerprints invalidate old snapshots when this transport changes.
