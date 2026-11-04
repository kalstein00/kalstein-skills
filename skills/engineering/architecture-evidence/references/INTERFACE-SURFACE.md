# Declaration surface v1

`collectInterfaceSurface([{path, source}, ...])`는 고정 TypeScript 5.3.3의
declaration emit을 사용한다. TS/TSX/MTS/CTS만 지원하며 입력은 독립된 가상 source
집합이다. 상대 import는 제공된 입력에서만 해석하고 표준 lib는 설치된 고정 TS에서
읽는다. 프로젝트 tsconfig, node_modules, 외부 파일을 암묵적으로 보충하지 않는다.
필요한 타입/의존성이 없거나 구문·타입·선언 출력 오류가 있으면 unavailable과 이유를
반환한다. 이미 작성된 d.ts 입력도 emit 결과가 없으므로 unavailable이다.
입력 집합의 compiler 진단을 먼저 검사하므로 오류가 있는 의존성의 추론이 `any`로
전파되어도 유효하다고 판정하지 않는다. 이 경우 전체 입력의 fingerprint가 unavailable이다.
대소문자만 다른 경로는 OS와 무관하게 충돌 오류로 거부한다. JSX는 Preserve 모드다.

fingerprint는 schema 출처와 compiler가 생성한 선언 문자열의 SHA-256이다.
주석 제거, compiler formatting, LF 정규화를 적용한다. 선언 순서와 overload 순서는
보존한다. 입력 파일 순서만 정렬하며 선언의 재배치는 fingerprint를 변경할 수 있다.
명시된 공개 타입을 유지한 함수 body 변경은 fingerprint를 바꾸지 않는다. 추론된 반환
타입이나 const literal 타입이 달라지면 공개 선언 변화이므로 fingerprint도 바뀐다.
compiler가 공개 선언을 표현하는 데 필요한 local type 및 private marker도 포함한다.

exportSurface는 직접 export 선언 entry 수다. 변수 선언은 binding별, named re-export는
specifier별, export star/namespace/default assignment는 각각 1로 센다. overload는 선언별
1이다. re-export의 원본 이름/alias/module 문자열은 선언 출력에 보존하지만 원본 Module의
전체 surface를 재귀적으로 펼치지 않는다. 그 Module은 별도 file evidence로 측정한다.
global script의 비-export 선언은 fingerprint에 포함하지만 exportSurface는 0이다.

2026-09-27: file.breakdown은 기존 총합을 보존하면서 typeDeclarations(interface/type),
valueDeclarations(function/class/enum/namespace/variable 등), typeReExports,
valueCapableReExports, typeLocalExports, valueCapableLocalExports, exportAssignments로
entry를 나눈다. re-export/local export는 선언 또는 specifier의 명시 type 표기를 따른다.
표기가 없는 이름은 실제 값인지 추측하지 않고 valueCapable로 남긴다. class/enum은
타입 역할도 하지만 값 선언에 한 번만 센다. 합계는 exportSurface와 동일하며,
실제 런타임 API 개수나 재수출된 전체 symbol 개수를 뜻하지 않는다. 추출 실패는 breakdown:null이다.

이번 구분의 외부 근거: typescript pin 5.3.3 / copied snapshot
`legacy-7.0.2-3b0dbf4d3996`, Modules - Reference의 type-only 절(ref
`www.typescriptlang.org/docs/handbook/modules/reference.html-5d5a350660.md:30-68`,
[원문](https://www.typescriptlang.org/docs/handbook/modules/reference.html)).
hybrid search 1회/945 tokens, get 1회/622 tokens. 설치된 5.3.3 AST의 isTypeOnly 선언과
transpileModule fixture로 inline type import의 모듈 효과 보존도 확인했다.

이는 추출 가능한 선언 근거다. 실행 순서·error semantics·동적 export·실제 Interface의
전체 의미 또는 Depth를 검증했다는 뜻이 아니다. unsupported/failed fingerprint는 null이고
metric은 unavailable:null이다. 실패를 정상적인 빈 surface나 0으로 바꾸지 않는다.

검증: `node --test <skill>/scripts/interface-surface.test.cjs`.
외부 API 근거는 AST-METRICS.md의 같은 세션 library-docs 실패 및 공식 Microsoft
Compiler API fallback 기록을 공유한다. 설치된 5.3.3 Program.emit/getSemanticDiagnostics와
CompilerHost 선언을 확인했다. declaration/emitDeclarationOnly/removeComments 옵션은
해당 compiler 자체를 사용한 위 fixture로 검증한다.

## 명시 프로젝트 mode

`project-surface.cjs`의 `prepareProjectInput(root, configPath)`는 명시한 repository-relative
tsconfig를 고정 5.3.3 Compiler API로 해석한다. `collectProjectSurface(root, configPath, targets)`는
그 프로젝트의 root file 중 지정된 TS 파일만 출력하며 선택 밖의 의존성도 타입 검사에 사용한다.
프로젝트 compiler options/extends/type/module 해석을 사용하고 선언 출력에 필요한
noEmit=false, declaration/emitDeclarationOnly/removeComments=true,
incremental/composite=false, noEmitOnError=true를 명시적으로 적용한다. 디스크에 emit하지 않는다.
outFile 번들은 파일별 선언이 아니므로 config 단계에서 명시적으로 거부한다.
출처는 `typescript@5.3.3:project-declaration-surface-v1`로 독립 mode와 구별한다.

input에는 config/options와 compiler가 읽은 파일 내용 hash, 파일/디렉터리 존재 여부,
directory enumeration 및 realpath 관측을 포함한다. `verifyProjectInput(input)`은 이 관측을
다시 읽어 source/type/package/config 변경, 새 해석 후보 파일 등의 drift를 검사한다.
Windows에서 같은 경로의 대소문자 차이는 같은 관측으로 정규화한다. 수집 중 동일 입력을
서로 다른 값으로 읽어도 실패한다. 입력에는 프로젝트/type 외부 경로가 포함될 수 있으므로
raw report는 ignored 로컬 경로에 둔다. 순서 있는 surfaceProjects 설정의 파일 귀속은 scanner가 소유한다.

2026-09-27: 준비와 수집은 모두 프로젝트 root files 전체의 진단 및 메모리 내 선언 추출을
같은 순서로 수행한 뒤 input을 확정한다. 선언 타입을 표현하면서 추가로 조회하는 package
subpath도 준비 snapshot에 포함되므로, 정상적인 추가 조회를 source drift로 오인하지 않는다.
수집 결과와 metric population은 요청한 targets로 제한하지만 input identity는 targets 선택에
따라 달라지지 않는다. 준비도 선언 분석 비용을 지불하며 디스크에는 출력하지 않는다.
동일 identity 비교와 관측 재검증은 유지한다. 기존 파일 내용 변경뿐 아니라 이전에 없던
타입 해석 후보 파일이 생긴 경우도 snapshot을 무효화한다. collector bytes 변경으로 기존
보고서의 reuse는 새 측정을 요구한다.

compiler 오류는 공유 diagnostics 배열에 한 번 저장한다. 각 파일은 짧은 reason으로 그 배열을
참조하고 fingerprint는 unavailable이다. 진단을 잘라내거나 any fingerprint를 정상 처리하지 않는다.
명시 프로젝트 외 source의 독립 mode에도 같은 공통 진단 저장을 적용한다.

검증: `node --test <skill>/scripts/project-surface.test.cjs`.
2026-09-06 library-docs typescript 검색은 ENGINE_INCOMPATIBLE(엔진 미준비)로 실패했다.
복사본 legacy-7.0.2와 설치5.3.3을 동일 release로 간주하지 않았다.
[공식 Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)의
Program/CompilerHost/declaration emit 설명과 설치5.3.3 typescript.d.ts의
getParsedCommandLineOfConfigFile/createProgram 정의를 확인한 뒤 fixture로 검증했다.

2026-09-27 근거: typescript package pin 5.3.3, copied snapshot
`legacy-7.0.2-3b0dbf4d3996`에 hybrid search 1회 성공(searchResponseTokens 1528,
get 0회/0 tokens; 초기 INDEX_MISSING 조회 제외). 검색 결과에는 이번 Compiler API
실행 순서의 직접 근거가 없어 공식 Compiler API의 Program/CompilerHost 및 메모리 내
declaration emit 예제와 설치된 5.3.3 `typescript.d.ts`의 Program.emit 정의를 확인했다.
복사 문서 snapshot을 TypeScript 5.3.3 release 문서로 간주하지 않는다.

같은 날짜의 소스 프로젝트 검증 기록(HEAD `0208a059`, 당시 수정 포함 working tree):
- package subpath의 추론 선언 fixture는 수정 전 identity 불일치로 RED였고, 수정 후
  target 선택과 무관한 identity, 디스크 출력 없음, 새 해석 후보 생성 감지가 GREEN이다.
- 패키지 테스트: 115/115 PASS, skip 0.
- 소스 프로젝트 전체 scan 실행: 294485 ms, `snapshotVerified: true`, `partial`.
  필수 metric 15843개 중 누락 0, unavailable 62. 미지원 production 언어 파일 153개와
  미분류 33개, 외부 symbol graph 미지원은 계속 명시한다. `project input drift`는 재현되지 않았다.
- 패키지에 포함되지 않은 소스 프로젝트 통합 테스트: 0/2 PASS.
  scripts 프로젝트의 기존 compiler diagnostics 80개와 app-local `tsx` 고정 경로 부재로
  실패했다. 수정 전 cached collector에서도 scripts 선언 결과 `partial`/진단 80개를
  재현했다. 이 통합 테스트 실패를 이번 수정의 GREEN이나 전체 측정 완료로 계산하지 않는다.

위 수치는 과거 검증 기록이며 대상 프로젝트의 실행 명령이나 필수 fixture가 아니다.
현재 대상 저장소와 설정은 [execution.md](execution.md)를 따른다.
