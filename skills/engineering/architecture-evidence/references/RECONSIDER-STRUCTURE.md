# Structural reconsideration v1

`reconsiderStructure(baseline,current)`는 rejected 항목 하나의 compact 구조 기준을
비교하는 pure predicate다. ledger 읽기/쓰기를 수행하지 않는다. schemaVersion:1이며
다음 필드는 모두 명시한다. collector 결과를 조립하는 호출자가 적용 가능성을 결정한다.

- publicSurface: `{validity:'valid',fingerprint}`. 공개 declaration fingerprint만 사용한다.
- percentiles: fanIn/fanOut/impact/complexity 각각 `{validity:'valid',value,cohortKey,direction:'risk-higher'}`.
  ranking의 risk percentile과 cohortKey(원천 metric/cohort/unit/direction/source 포함)를 사용한다.
  두 값이 같은 비교군일 때 증가 10%p 이상이 악화다. 내부 body hash는 비교하지 않는다.
  산술 표현 오차만 흡수하도록 4×Number.EPSILON×max(10,두 값)의 허용 오차를 사용한다.
  percentile 반올림이나 9.99%p를 10%p로 올리는 정책은 없다.
- topGroups: `{validity:'valid',population:'before-suppression',groups}`. GROUPS의 그룹명이며
  rejected/accepted 억제 전 전체 비교 모집단의 Top 5 소속이다. 새 소속이 재개 이유다.
- cycles/violations: 각각 `{validity:'valid',ids}`. 해당 항목의 cycle/layer 위반 ID 집합이다.
- ownershipIdentity/metricSchemaIdentity: 비어 있지 않은 설정 fingerprint.

비교 항목에 적용되지 않으면 양쪽 모두 `{validity:'not-applicable'}`로 명시한다.
누락, unavailable, 적용 가능성 변화, 비교군/방향 불일치는 diagnostics와 review-needed다.
review-needed는 개선 후보가 아니라 별도 비교 진단이며 scanner는 해당 항목을 선발하지 않는다.
known trigger가 하나라도 있으면 reopen이며 다른 누락 진단도 남긴다. 모두 비교 가능하고
trigger가 없을 때 suppressed다. 아래의 명시적 동일 근거 규칙도 적용할 수 있다.
이유와 진단은 정렬하며 입력을 변경하지 않는다.
이 함수는 identity 대응, Git 경과 재개, eligibility 통합, Candidate 채택을 수행하지 않는다.

검증: `node --test <skill>/scripts/reconsider-structure.test.cjs`.

## 항목별 검토 근거 (2026-09-27 후속 수정)

새 scan baseline에는 reviewedEvidence `{rule:'item-observations-v2',identity}`가 있다.
항목의 source fingerprint(순환은 멤버 파일, 위반은 endpoint), declaration fingerprint,
해당 항목의 원시 구조 metric, 관련 SCC/위반, config/ownership/schema, tool bytes/version과
collector 상태/진단을 hash한다. 대상 파일 근거가 없거나 inventory 읽기 실패가 있으면 null이다.
무관한 파일 내용과 Git HEAD/ledger/pressure, population/percentile/Top 순위는 hash하지 않는다.
공유 선언의 추론된 표면 변화와 관측된 관련 순환/위반 변화는 포함된다. 미측정 의존성까지
비교한다는 뜻은 아니다. 수집기 진단/설정 변경은 보수적으로 동일성 확인을 무효화할 수 있다.

동일 v2 identity이면 순위만 움직인 percentile/새 Top 그룹은 재개 이유가 아니다.
history Top 진입 자체도 재개 이유에서 제외하며 별도의 250 commit 경과 규칙을 유지한다.
공개 표면·ownership·metric schema·새 관측 순환/위반 등의 확인된 구조 trigger는 우선한다.
부분 측정에서도 `observedCycles`의 ID/dependencyKind와 `observedViolations` ID의 추가는 양성 근거로 비교한다.
타입 순환이 값 가능 순환으로 바뀌면 같은 SCC ID여도 재개한다. 관측 없음은 무결함 증명이 아니다.

trigger가 없고 reviewedEvidence가 동일하면 suppressed/basis=unchanged-reviewed-evidence다.
unavailable/partial 진단은 그대로 보존한다. 비교 근거가 부족하면 review-needed로 별도
`queue.comparisonDiagnostics`에 남기며 후보에서는 제외한다. known trigger는 공백보다 우선한다.

이전 captured-evidence-v1 baseline은 계속 읽지만 v2와 같다고 추정하지 않는다.
기존 baseline/판정/HEAD를 자동 갱신하지 않는다. legacy 비교 공백은 새 결함이 아니며,
원래 판정과 복구 안내를 진단에 보존한다. 이전 v1은 전체 저장소 ranked history를 포함해
동일 HEAD 재실행만 통과하고 커밋 이후 반복 제외를 보장하지 못했으므로 새 baseline에는 사용하지 않는다.
