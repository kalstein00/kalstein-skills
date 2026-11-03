# Identity reconciliation v1

`reconcileIdentities(readLedgerResult, currentItems, {currentHead,currentComplete,windows})`
는 ledger를 변경하지 않는다. currentItems는 collector의 typed `{id,identity}` 목록이다.
windows는 `{baselineHead,currentHead,complete,commits,renames:[{commit,from,to}]}`다. 호출자는
각 ledger 기준 HEAD 이후 현재 HEAD까지 확인된 Git rename만 제공해야 한다. 500개 표본이
그 구간을 덮지 못하거나 rewrite/shallow 때문에 불완전하면 complete:false다. 여기서
불완전 범위의 동일성을 추측하지 않는다. 동일 HEAD는 빈 rename 구간으로 간주한다.
실제 window collector는 전체 baseline 구간을 별도로 수집하며 검증된 ancestry/merge 정책을
diff collector에 전달한다. 수집 실패의 원래 reason/recovery를 유지하고 complete로 승격하지 않는다.
accepted/rejected 대응 실패 시 scanner는 미대응 항목을 새 후보로 추정하지 않는다.
원본 ledger와 비교 실패 진단은 보존한다.

commits는 기준 이후의 검증된 oldest-first 위상 순서 SHA 목록이며 모든 rename commit을
포함해야 한다. timestamp/해시 정렬로 순서를 추측하지 않는다. 순서가 없으면 unresolved다.
각 commit에서 한 번만 경로를 이동한다. b→c 후 a→b이면 원래 a는 b에 대응한다.
동시 분기에서 하나의 선형 계보를 확인할 수 없으면 호출자가 complete:false로 제공한다.

파일은 시간 순서의 유일한 from→to 사슬로, symbol은 같은 symbolKind/qualifiedName/discriminator를
유지한 파일 경로 변경으로만 대응한다. 함수 이름 자체 변경을 의미로 추측하지 않는다.
분기/수렴/사이클 rename, old 경로 동시 존재, current ID 충돌, 여러 ledger가 한 ID로
대응하는 경우 unresolved다. 기준 rename 구간이 없거나 모호해도 unresolved다.

mappings는 originalId/currentId, 원래 disposition/entry, matched|renamed|retired|unresolved,
reason과 renameEvidence를 보존한다. disposition은 대응 결과일 뿐 원래 ledger bytes를
이동·삭제하지 않는다. 완전한 현재 모집단에서 ID가 사라지면 retired다. 현재 수집이
불완전하면 사라진 것으로 확정하지 않고 unresolved다.

cluster/violation은 멤버/규칙/endpoint의 typed ID가 정확히 같을 때만 같은 항목이다.
membership 변경은 새 identity이며 기존 기록을 파괴하지 않는다. 관련 file/symbol/cluster를
하나의 architecture candidate로 묶지 않는다. 중복 current symbol ID는 collisions에 남기고
newItems에서 제외한다. 그 외 대응되지 않은 독립 identity가 newItems다.

검증: `node --test <skill>/scripts/identity-reconciliation.test.cjs`.
