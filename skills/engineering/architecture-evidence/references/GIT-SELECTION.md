# Git selection v1

`selectGitCommits(root, {excludeAuthorEmails:[], timeoutMs:30000})`는 HEAD commit을 고정하고
전체 부모 ancestry의 log를 수집한다. path/first-parent 필터는 없다. replace object는
비활성화한다. committer UNIX timestamp 내림차순, 동률은 전체 object ID 오름차순으로
정렬한 뒤 parent가 0~1개인 commit만 선택하고 명시 author email 제외를 적용한 후 500개를
자른다. 이름에 bot이 포함됐다는 이유로 제외하지 않는다. config와 실제 제외 목록을 남긴다.

일반 merge의 양쪽 하위 commit, root, squash commit, rebase 후 현재 도달 가능한 commit을
포함한다. 도달할 수 없는 squash 이전/rebase 이전 object는 포함하지 않는다. merge commit
자체를 churn에 제공하지 않으므로 merge resolution에만 있던 변경은 unavailable로 명시한다.
commit timestamp는 기록된 시각 기준이며 위상 순서 또는 실제 작업 시각을 보장하지 않는다.

반환값은 실제 commits(id/committerTime/parents/authorEmail), head, Git version, config,
sampleSize, 전체 reachable/eligible 수, excludedMerges/Authors, shallow/shortHistory다.
500개 미만은 실제 표본 수를 유지하여 partial로 보고한다. full ancestry 자체와 표본 부족은
구분한다. shallow는 경계 이전 누락을 명시하고 git fetch --unshallow 복구를 안내한다.
shallow 경계에서 log가 부모를 숨기면 원본 commit object header로 부모를 복원하여
merge를 root로 오분류하지 않는다. 부모 object가 실제로 확보됐다는 뜻은 아니다.
dirty source는 이 계산에 포함되지 않는다. HEAD가 수집 중 바뀌거나 Git 오류/timeout이
발생하면 blocked/recovery이며 정상 빈 표본으로 대체하지 않는다.

Git 프로세스별 timeout과 64MiB 출력 상한을 둔다. 값은 성공 산출물에 실행 시간처럼
휘발성 정보를 섞지 않는다. snapshot identity는 고정 입력/선택 결과의 schema hash다.

근거: [Git log](https://git-scm.com/docs/git-log)의 pretty-format %H/%ct/%P/%ae와
[Git rev-list](https://git-scm.com/docs/git-rev-list)의 reachable ancestry/first-parent 계약.
검증 환경 Git 2.51.0.windows.1에서 temporary repo의 merge/root/501/shallow/bot 및 실제
squash/rebase를 실행했다. `node --test <skill>/scripts/git-selection.test.cjs`.
