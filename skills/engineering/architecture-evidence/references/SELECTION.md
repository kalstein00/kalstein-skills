# Evidence selection v2

`selectEvidence(ranking, eligibility)`는 ledger나 Git을 쓰지 않는 순수 계산이다.
eligibility는 `{id,eligible,reason?,owners}`의 명시 목록이다. accepted 중복/rejected 억제
판정은 상위 호출자가 제공한다. 미선언 eligibility는 선발하지 않고 사유를 남긴다.
scanner는 requires-type-only SCC와 rejected 비교 불가 항목을 eligible=false로 제공한다.
원시 SCC/metric은 그대로 보존하지만 이들은 Top5/20/3 후보 slot을 소비하지 않는다.
unknown/value-capable 순환은 자동 무결함 처리하지 않는다. 비교 실패는 별도 진단이며
새 개선 후보가 아니다.
eligible item은 모든 owner를 제공해야 한다. owner가 없거나 ID가 중복되면 오류다.

먼저 eligibility를 적용한 각 신호군에서 percentile 내림차순/ID UTF-16 오름차순의 Top5를
선택한다. rank 입력의 열거 순서는 권위가 아니다. 신호군 이름/순서는 ranking v1과 같고
확인되지 않은 group/schema로 조용히 확장하지 않는다. 그 Top5들의 ID 합집합이 후보 풀이다.

대표 배정은 고정 group 순서로 진행한다. 이미 선발된 대표가 해당 group의 첫 후보이면
추가 slot을 쓰지 않는다. quota와 충돌하면 후보와 이유를 기록하고 같은 Top5의 다음
후보를 시도한다. 이후 Top5 소속 group 수 내림차순, bestPercentile 내림차순, ID 오름차순으로
남은 항목을 채운다. 이는 검토 순서이며 종합 결함 점수가 아니다.

전체20/owner당3은 수정할 수 없는 v1 hard cap이다. cluster를 포함한 모든 item은 제공된
owner 집합의 각 owner quota를 1씩 소비한다. 대표를 보장하려고 cap을 완화하지 않는다.
20개를 채우기 위해 group Top5 밖을 자동 탐색하지 않는다.

출력 selected는 선발 순서/phase/owners/groups/정렬 근거값이다. groups는 eligibility 적용
후 Top5, representatives는 충돌 시도를 포함한 배정 기록, ownerUsage는 실제 사용량이다.
excluded는 모든 미선발 ID와 accepted/rejected·missing eligibility·no ranked metric·
outside Top5·total/owner cap 사유를 제공한다. 입력 순열은 결과를 바꾸지 않는다.
작은 cohort/결측/미배정으로 group에 들어가지 못한 metric ID도 제외 목록에 포함한다.

검증: `node --test <skill>/scripts/selection.test.cjs`.

2026-09-27: schemaVersion 2 / eligible-top5-total20-owner3-v2는 기존 순서와 상한을 유지하고
selected.signalContext를 추가한다. 선정된 groups가 size/interface뿐이면 shape-only,
그 외 두 신호군 이상이면 multiple-signal-groups, 나머지는 single-signal-group이다.
미선정 신호의 부재나 독립적인 결함 증명을 뜻하지 않으며 이 분류만으로 항목을 제외하지 않는다.
검토된 비실행 대상의 중복 제외는 ledger와 reconsideration owner가 별도로 판단한다.
