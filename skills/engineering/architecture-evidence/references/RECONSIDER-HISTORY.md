# History reconsideration v1

`reconsiderHistory(root,baselineHead,selectGitCommitsResult,{timeoutMs:30000})`는 rejected
기준 이후 현재 HEAD에서 새로 reachable인 전체 non-merge commit 집합을 별도로 수집한다.
최근 500개 pressure 표본과 bot 제외 목록은 이 250개 경과 정책의 모집단이 아니다.
all-parent ancestry의 side branch commit도 포함하고 merge commit 자체는 제외한다.

Git replacement를 비활성화하고 기준 commit 존재/조상 관계, 실제 shallow 상태, 선택한
HEAD의 전후 일치를 검사한다. `rev-list --reverse --topo-order --no-merges HEAD ^BASE --`의
commits를 보존한다. 이 순서는 commit 시간/해시 재정렬이 아닌 oldest-first 위상 순서다.
rename 계보 증명에는 별도의 완전한 rename 범위와 분기 모호성 확인도 필요하다.

249개 이하 suppressed, 250개 이상 reopen이다. count와 집합, 기준/현재 HEAD, 이유를
반환한다. rewrite/기준 소실/shallow/프로세스 실패/drift는 count:null인 review-needed다.
이는 0개 경과가 아니며 fetch 또는 명시 재검토 복구 안내를 남긴다. Git, ledger 파일과
기준을 변경하지 않는다. 같은 history/기준의 결과와 fingerprint는 재현 가능하다.

검증: `node --test <skill>/scripts/reconsider-history.test.cjs`.
