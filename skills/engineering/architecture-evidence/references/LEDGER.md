# Disposition ledger v1

판단 기록은 커밋 가능한 `.agents/architecture-evidence/ledger.json`에 두고 원시 측정/
ranking/scan은 기존 ignore 규칙의 `.codex/tmp/architecture-evidence/`에 둔다. 저장 API는
Git commit이나 raw artifact 생성을 하지 않는다. 실제 커밋 여부는 명시 workflow의 책임이다.

schemaVersion1의 entries는 id/typed identity, accepted|rejected|deferred, reason,
snapshot `{id,head,baseline}`, candidateRef를 가진다. candidateRef는 적용되는 Candidate
Register 문서/row 참조 문자열 또는 명시 null이다. baseline은 재검토 판단에 필요한 작은
비교 근거 object이며 원시 전체 metric dump가 아니다. 판단의 의미를 자동 승인하지 않는다.
typed ID, 필수 근거/기준 snapshot, 중복/알 수 없는 field/버전을 검증한다.

`readLedger(root)`는 파일이 없어도 디렉터리를 만들지 않는다. schema가 올바른 기존 파일은
bytes를 그대로 두며 identity는 raw bytes hash다. 없는 파일 identity는 null bytes의 hash다.
malformed/schema mismatch/read failure는 blocked/path/phase/reason/recovery이며 빈 ledger로
대체하지 않는다. scan/retry는 이 reader만 사용한다.

명시 `recordDisposition(root, entry, {expectedIdentity})`만 변경한다. ID별 기록을 갱신하며
다른 항목은 보존한다. exclusive lock으로 협력 writer를 직렬화하고 최신 bytes identity를
확인한다. 임시 파일 write/fsync 후 원본이 그대로인지 다시 확인하고 rename으로 교체한다.
교체 전 실패는 원본을 보존하며, 같은 기록의 재실행은 bytes를 바꾸지 않는다. lock을 무시하는
외부 편집과 교체 순간의 경쟁까지 보장하지는 않으므로 동시에 수동 편집하지 않는다.
writer가 만든 temp/lock만 정리하며 정리 실패는 별도 cleanupFailure/partial로 보인다.
교체 성공 뒤 cleanup 실패는 저장 취소가 아니므로 최신 ledger를 다시 읽어야 한다.

`acceptedEligibility(readResult,id)`는 accepted에 eligible:false를 반환한다. 다른 disposition은
eligible:null로 반환하여 rejected/deferred의 후속 정책 판정이 필요함을 명시한다. 미지원
ledger도 자동 선발하지 않는다. 이 helper 자체는 일반 scan의 최종 eligibility 판정이 아니다.

검증: `node --test <skill>/scripts/ledger.test.cjs`. 실제 Git ignore 조회로
raw 경로는 ignored, ledger 경로는 not ignored임을 확인했다.
