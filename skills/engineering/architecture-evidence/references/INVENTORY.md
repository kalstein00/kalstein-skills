# Production 인벤토리 v1

저장소 root에서 `node --test <skill>/scripts/inventory.test.cjs`로 검증한다.

```js
const { collectInventory } = require('./<skill>/scripts/inventory.cjs');
const report = collectInventory(process.cwd(), {
  scopes: [], // 전체. 명시 범위는 저장소 상대 파일/디렉터리 경로 배열
  supportedLanguages: ['typescript'] // 준비된 수집기의 언어 지원 목록
});
```

입력은 `git ls-files --cached --others --exclude-standard -z`로 고정한다.
tracked와 무시되지 않은 untracked 파일을 포함하며 dirty 파일의 현재 bytes를 hash한다.
Git ignored untracked 파일은 모집단 밖이다. Git 명령 실패/timeout은 호출자에게 실패를
전달하며 다른 열거 방식으로 조용히 대체하지 않는다. scope가 없거나 오타이면 전체
범위로 확장하지 않는다. Module 이름은 호출자가 확인한 파일/디렉터리 scope로 전달한다.

규칙 순서:

1. 명시 scope 밖은 outOfScope로 기록한다.
2. docs/library-docs, generated/gen, vendor/vendored, fixtures, build/dist/target,
   node_modules, coverage, local cache 경로와 generated/gen 파일명은 제외한다.
3. test/tests/unit/integration/e2e 경로와 test/spec 파일명, test_ 접두사 및
   _test/_tests 접미사 파일명은 evidence로만 분류한다.
4. 정의된 source 확장자는 production이다. TS/JS/Rust/C/C++/Go/Python/PowerShell/
   Shell/SQL/Java/Kotlin/C#/Ruby/Vue/Svelte/Swift를 식별하며 분석 지원 여부와 분리한다.
5. 명시한 문서·설정·이미지·binary 형식은 non-source 제외다. 나머지는 unclassified로
   보존하며 전체 측정 완료로 표시하지 않는다. 새 언어/제외 규칙은 버전을 변경해야 한다.

counts의 production = supported + unsupported + failed다. 나머지 role과 production의
합은 entries 수다. unclassified는 확장자 규칙 보완이 필요한 별도 누락 모집단이다.
supported는 전달한 collector 지원 선언과 source 읽기 성공만 뜻하며 metric 계산 완료가
아니다. unsupported/failed/unclassified가 있으면 partial이다. 기본 지원 언어는 빈 목록이다.
scan orchestration은 metric별 수집 결과와 이 보고서를 합쳐야 한다.

각 production에는 언어·규칙·상태와 실제 bytes SHA-256 또는 failure/recovery가 있다.
symlink/non-regular source는 따라가지 않고 실패를 표시한다. 파일 내용/경로/규칙/범위/
지원 목록으로 결과 identity를 만들며 mtime·실행 시간·절대 root 경로를 섞지 않는다.
테스트는 별도 평가 증거이며 이 inventory는 그 품질 또는 coverage를 계산하지 않는다.
