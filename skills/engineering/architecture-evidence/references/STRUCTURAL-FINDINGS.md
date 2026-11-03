# Structural findings v1

`collectStructuralFindings(graph, ownership, cruise)`는 두 근거를 별개 item으로 반환한다.
CLI의 graph는 고정 source를 `source-imports.cjs`로 변환한
`source-module-imports-v2` 파일 그래프다. TypeScript 5.3.3 AST의 import/export 선언을
메모리 내 source 경로로 해석하며 type-only와 re-export도 포함한다. 심볼 이름 추정 edge나 파일 내부 import 선언 node를 SCC 입력으로 사용하지 않는다.
외부 심볼 graph collector는 unsupported이며 파일 import 수집을 막지 않는다.
SCC는 이 파일 관계에서 계산한다. 실제 자기 import도 singleton cycle로 보존한다. 모든 owner와 edge의 provenance/
confidence를 유지한다. cluster identity는 정렬된 file evidence ID 집합이며 순열에
영향받지 않고 구성원 변경 시 달라진다. 큰 symbol과의 의미적 병합이나 후보 등록은 없다.

2026-09-27: 각 edge는 dependencyKind `type-only | value-capable`을 가진다.
선언 전체의 `import type`/`export type`만 type-only다. inline type specifier만 있는
`import { type T }`도 verbatimModuleSyntax에서 빈 import와 모듈 효과가 남을 수 있어
value-capable로 보존한다. 일반 import가 실제로 emit되는지는 주장하지 않는다.
전체 SCC의 ID/cycleSize는 유지하며 type-only edge를 뺀 graph도 SCC로 검사한다.
순환이 사라지면 cluster.dependencyKind=requires-type-only, 부분 순환이라도 남으면
value-capable이고 그 순환의 파일만 valueCyclePaths에 넣는다. 구분 없는 외부 edge는
unknown이며 안전하다고 분류하지 않는다. 어느 분류도 런타임 결함 또는 무결함의 증명이 아니다.

파일 해석은 captured JS/TS source만 사용하며 host 파일이나 tsconfig alias/package
해석을 추측하지 않는다. non-relative 경로는 외부 패키지/별칭 미해석으로, 누락 상대
경로·parse 오류·CommonJS/import-equals/import-type/dynamic import는 명시 공백으로
보존한다. 공백은 partial이며 빈 SCC를 전체 저장소 무순환 증명으로 해석하지 않는다.
source 입력이 없으면 실패한다. collector bytes와 source fingerprint가 snapshot에
포함되어 이전 raw-edge 기반 보고서는 수정 후 reuse 검증을 통과하지 못한다.

회귀 근거: mathjs의 parse가 로컬 Parser::parse에 exact-match로 연결되어 가짜
8파일 SCC를 만든 사례와, import 선언 node를 자기 의존성으로 투영한 사례.
`node --test scripts/source-imports.test.cjs scripts/structural-findings.test.cjs`로 검증한다.

cruise는 `{source:'dependency-cruiser@17.4.0', rules, ruleSource, pathPrefix, ruleIdentity, result}`다.
result는 명시 dependencyCruiser root/configPath/targets로 실행한 JSON 원본이다. ruleIdentity는
그 실행 시 config object의 schema fingerprint다. scanner가 실행 provenance를 보존해야 한다.
현재 config와 일치하지 않으면 layer 결과를 보류하고 partial/recovery를 반환한다.
summary.violations의 기존 non-circular dependency 규칙 결과만 읽으며 규칙 matcher를
재구현하지 않는다. report-mode나 warn severity를 변경하지 않는다. no-circular 보고는
Adapter의 SCC와 중복 layer item으로 만들지 않는다.

violation identity는 rule/source-file-ID/target-file-ID다. 동일 위반 중복을 제거하고
기존 rule definition, ruleSource, ruleIdentity, tool source를 보존한다. report 경로는
설정된 pathPrefix 기준 상대 경로이므로 repository 경로로 명시 변환한다. unknown rule, shape,
severity, owner 누락은 layer 결과를 unavailable로 간주하여 비우고 partial gap을 남긴다.
부분 graph, 누락 node/edge/file, unresolved 정보도 유지하므로 빈 결과는 완전성 보장이 아니다.
파일별 extraction 오류와 Adapter recovery를 그대로 제공한다. SCC owner 누락 시 해당
cluster만 보류하고 paths/recovery gap을 남기며 독립 layer 검사는 계속한다.

metrics는 SCC의 cycleSize(distinct member-file 수/files/higher), 각 관측 layer 위반의
layerViolation(1/violations/higher)을 제공한다. 모든 구성원/endpoint의 language가 같으면
그 language, 다르면 mixed인 language:item-kind cohort다. population은 관측된 해당 cohort
항목 수다. language 누락은 unknown cohort/unavailable:null이며 0으로 취급하지 않는다.
원본 cluster/violation·owner·provenance를 유지하고 기존 ranking의 min3/tie 규칙을 적용한다.

API 근거: dependency-cruiser는 copied library package가 없다. 설치된 고정 17.4.0의
types/cruise-result.d.mts (ICruiseResult.summary.violations)와 violations.d.mts
(IViolation.rule/from/to/type), rule-summary.d.mts를 직접 확인했다. 파일 import 분석 범위와 심볼 지표 미지원 계약은 GRAPH.md를 따른다.

검증: `node --test <skill>/scripts/structural-findings.test.cjs`.
프로젝트의 기존 검사 정책은 변경하지 않는다. 설정이 없으면 layer 측정을 partial로 남긴다.
