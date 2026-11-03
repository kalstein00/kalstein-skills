# Observed graph coupling v1

## Representative witnesses

schema 3 report의 couplingPaths는 선정된 coupling 최대 신호에 대해 저장된 확인된
projection의 대표 경로만 제공한다. rules=`coupling-paths-v1:limit3`: 지표당 최대3개,
impact는 지정 impactDepth 이내, 나머지는 직접1단계다. BFS에서 이웃 ID를 정렬해
최단 경로 하나씩 선택하며 중복/자기/순환은 제외한다. incoming 지표도 출력 경로는
실제 source → target 순서다. file metric 경로는 원래 symbol edge/proof를 함께 보존한다.
관측0, 근거/owner 부족, 경로 부족, 표시 제한 생략은 별도 상태/이유다. 전체 경로를
열거하지 않고 metric의 관측값과 표시 개수 차이를 생략 수로 표시한다.
규칙은 snapshot metricSchema에 포함되며 JSON과 텍스트는 동일한 저장 경로를 사용한다.
proof.start/end는 캡처된 source 문자열의 0-based UTF-16 offset이며 end는 제외한다.
텍스트도 `파일; UTF-16 offset [start, end)`로 명시하며 줄 번호 형식으로 표시하지 않는다.
검증: coupling-paths.test.cjs, text-report.test.cjs, scan.test.cjs.

## Confirmed projection (additive)

`collectConfirmedCoupling(graph, ownership, config, bindingEvidence)`는 schema 3부터
기본 CLI 결합도 Interface다. `classifyEdges` 결과의 identity와 edge
모집단을 검증하고 confirmed edge만 fanIn/fanOut/crossOwnerOut/impact에 투영한다.
metric source는 `confirmed-coupling-v1`로 구분한다. bindingEvidence가 없으면 이 네
지표는 null/unavailable이며 혼합 graph 값을 대신 반환하지 않는다.
분류된 관측 집합의 0은 유효한 관측값이지만 전체 무의존을 뜻하지 않는다.
confirmation은 관측 범위와 미확인 edge 수를 표시하고 원본 bindingEvidence와 graph
누락을 보존한다. 기존 staticTestLinkage/runtimeCoverage 및 structure의 의미는 유지한다.
검증: `node --test scripts/confirmed-coupling.test.cjs scripts/coupling.test.cjs`.

`collectCoupling(graph, ownership, {schemaVersion:1, impactDepth, testFiles})`의 graph는
fresh normalized graph 입력 (현재 CLI의 심볼 graph 수집은 미지원), ownership은 ownership resolver 출력이다.
impactDepth는 필수 1..100 정수다. testFiles는 `{path,kind}`의 명시 목록이고 kind는
unit/integration/e2e 중 하나다. 빈 목록은 테스트 연결을 지정하지 않은 입력이며
프로젝트의 테스트가 없다는 주장이 아니다. 숨은 파일명 추론이나 runtime 조회는 없다.

v1은 calls/imports/references만 의존 방향 source → target으로 사용한다. 그 외 kind는
원본과 제외 이유를 보존한다. symbol metric은 symbol → symbol 연결만 사용한다.
file metric은 모든 선택 edge를 소속 파일 쌍으로 투영한다. 각 projection에서 self edge를
제외하고 이웃 ID 집합으로 중복을 제거한다. 같은 파일의 다른 symbol 간 edge는 symbol
metric에만 남는다. unmapped endpoint는 계산에서 제외하고 원본/이유와 partial을 반환한다.

- fanIn/fanOut: 직접 incoming/outgoing 이웃 수.
- impact: incoming 방향으로 impactDepth 이내에 도달하는 서로 다른 ID 수. 본인 제외.
- crossOwnerOut: outgoing 이웃 중 owner가 다른 ID 수. owner 누락은 명시 오류다.
- staticTestLinkage:<kind>: 같은 incoming 탐색에서 발견한 명시 testFiles의 서로 다른 경로 수.
- runtimeCoverage: 실행 자료가 없으므로 항상 unavailable:null. 정적 연결을 실제 실행
  coverage/테스트 품질로 해석하지 않는다.

metric은 관측된 graph의 값이다. resolution completeness를 뜻하지 않는다. graph source,
identity, unresolved/omitted/missing 정보와 개별 edge의 confidence/provenance/metadata를
보존하고 confidence를 임의 평균하거나 높은 fan-in을 결함/후보로 등록하지 않는다.
Adapter의 partial 상태는 유지한다. 각 cohort는 language:item-kind의 관측 item 집합이다.
깊이·testFiles·edgeKinds가 결과 config에 보존된다.

검증: `node --test <skill>/scripts/coupling.test.cjs`.
