# Explicit continuation v1

`coordinateBatch({snapshotId,ledger,ranking,eligibility,decisions,continuation:null})`는
읽은 ledger와 고정 ranking을 selection에 연결하는 pure coordinator다. 상태/파일을 쓰지 않는다.
eligibility는 selection의 `{id,eligible,owners,reason?}`이며 confirmed identity reconciliation이
있는 경우만 `priorId`를 추가한다. 모호한 identity/불완전 owner는 호출자가 ineligible로 표시한다.
동일 ID는 자동 ledger 조회, rename은 확인된 priorId만 조회한다. scanner가 의미로 합치지 않는다.

accepted는 중복 제외한다. rejected는 `decisions[currentId]={structure,history}`의 기존
predicate 결과를 사용한다. 하나라도 reopen이면 검토 가능, 둘 다 suppressed일 때만 억제,
나머지는 review-needed로 보존하되 후보에서 제외하고 `comparisonDiagnostics`로 분리한다.
이는 rejected 판단을 새로 내리는 것이 아니며 비교 완료를 뜻하지 않는다.
deferred/미기록은 base eligibility를 유지한다. type-dependent 순환은 base에서 제외한다.
accepted/rejected identity 대응 자체가 실패하면 미대응 항목을 새 항목으로 추측하지 않고
비교 진단으로 보류한다. 확인된 다른 항목의 기존 판정은 계속 사용할 수 있다.
이 coordinator는 raw baseline으로 predicate를 다시 계산하거나 disposition을 새로 쓰지 않는다.

일반 scan은 continuation:null로 항상 같은 batch를 낸다. 반환된 next token을 다시 제공하는
행위가 직전 offered batch를 검토했고 다음 batch로 가겠다는 명시 요청이다. token의 reviewed는
그 요청이 실행될 때만 적용된다. ledger의 accepted/rejected/deferred 판정 기록과 별개다.
이미 소비한 ID를 제외한 뒤 기존 selection을 호출하므로 매 batch의 5/20/3 cap이 유지된다.
다시 처음 감사하거나 snapshot이 바뀌면 deferred가 영구 제외되지 않는다.

token은 snapshot/ledger/population identity와 checksum에 연결된다. 변경·손상은
invalid-continuation과 복구 안내, 남은 ranked eligible 항목이 없으면 exhausted/next:null이다.
checksum은 우발적 손상 감지이며 보안 인증은 아니다. ledger를 명시 갱신하면 새 identity로
scan을 다시 시작한다. 자동 advance, 자동 ledger 수정, tracker publication은 없다.

검증: `node --test <skill>/scripts/continuation.test.cjs`.
