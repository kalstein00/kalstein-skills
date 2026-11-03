# Git pressure v1

`collectGitPressure(root, selection, config)`는 git-selection의 실제 non-merge 목록만
`git log --no-walk --stdin --numstat -z --root`로 읽는다. merge diff는 사용하지 않는다.
root는 empty tree 기준이고 squash/rebase는 현재 도달 가능한 object의 diff만 포함한다.
shallow 선택은 boundary를 가짜 root로 측정하지 않도록 blocked다. 누락 object/Git 오류/
timeout/예상과 다른 numstat는 blocked/recovery이며 정상 0으로 대체하지 않는다.

고정 규칙: Myers, no-indent-heuristic, no-textconv/no-ext-diff, rename 50%, rename 후보
제한 없음(-l0), replace object 비활성화. Git 호출은 30초/64MiB 상한이며 timeoutMs를
명시 조정할 수 있다. attributes는 selection HEAD에서 읽고 global/system attributes는
사용하지 않는다. source dirty 편집은 history가 아니다.
snapshot 외부의 `.git/info/attributes`가 비어 있지 않으면 blocked다. 이 override로 같은
object의 binary/줄 수 분류가 달라지는 것을 조용히 허용하지 않는다.
동일한 이유로 `diff.<driver>.binary` 설정이 있으면 이름 존재만 검사하여 blocked로
보고한다. 사용자 설정 값을 결과에 노출하거나 snapshot 근거 없이 상속하지 않는다.

inventory의 production path만 압력 집계에 포함하고 generated-only/비production-only
commit은 이유와 ID를 남겨 제외한다. 변경 횟수는 경로별 commit 수, churn은 추가+삭제 줄
수다. binary numstat는 빈 변경이 아니므로 frequency는 세고 줄 수는 unavailable:null이다.
co-change는 같은 commit의 서로 다른 production 경로 쌍과 실제 commit 목록/support다.
coChangeMinSupport 기본3 미만은 eligible:false이며 통계적 연관성으로 해석하지 않는다.
production 변경 경로 수가 mechanicalThreshold 기본100 이상이거나 명시 mechanicalCommitIds에
속하면 mechanical로 표시한다. frequency/churn은 남기고 일반 co-change에서는 제외한다.
bot 필터는 selector의 명시 config만 따른다.

coChangeSupport metric은 각 측정 파일이 속한 eligible pair support의 최댓값이다.
단위 commits/higher, 기존 language:file cohort/관측 파일 population이다. 여러 peer를 합산하지
않으며 eligible pair가 없는 측정 파일은 0이다. 최소 support와 mechanical 제외를 적용한
원본 pair/commit 근거를 함께 보존한다. aggregation 규칙은 config에, 그 fingerprint는 metric
source에 포함한다. 실패한 history/diff를 정상 0으로 바꾸거나 pair를 candidate로 만들지 않는다.

rename은 NUL numstat의 old/new 경로를 읽어 `{commit,from,to}`로 보존한다. rename commit의
집계 경로는 destination이며 순수 rename의 줄 churn은 0이다. 과거 경로의 counter를 새
경로로 임의 합치지 않는다. 경로 재사용/branch별 rename을 lineage로 추측하지 않으며 후속
identity ledger가 이 명시 rename 근거를 소비한다. 경로별 원시 counter와 rename 연결을
분리해 출처 없는 동일시를 막는다.

출력은 selection identity/실제 commit 목록/history completeness/merge-only 한계,
file counter·metric, coChanges, renames, excluded/mechanical commit 목록과 config다.
같은 object/selection/config의 결과에는 시각·실행 시간 등 휘발성 값이 없다.

근거: [Git diff의 numstat/NUL/rename 계약](https://git-scm.com/docs/git-diff).
검증: `node --test <skill>/scripts/git-pressure.test.cjs`.
