# AST metric source v2

`collectAstMetrics([{path,source}, ...])`는 graph/Git 없이 고정 TypeScript 5.3.3으로
TS/TSX/MTS/CTS 및 JS/JSX/MJS/CJS를 파싱한다. 입력 경로 중복은 실패이며 경로 순서가
출력에 영향을 주지 않는다. inputIdentity는 경로와 전체 source를 포함한다.

규칙:

- loc: 물리적 줄 수. CRLF/LF/CR 구분을 지원하고 마지막 개행으로 빈 줄을 추가하지 않는다.
- functionLength: 구현 body가 있는 named 함수/메서드의 시작 token부터 마지막 token까지
  inclusive 줄 수. 주석 앞부분은 시작에 포함하지 않고 내부 주석/빈 줄은 포함한다.
- complexity: 1 + if, for/for-in/for-of, while/do, non-default case, catch, ternary,
  그리고 &&/||/?? 각각의 개수. else/default/optional-chain은 더하지 않는다.
- nested named 함수의 decision은 해당 함수만 소유한다. 이름이 없는 callback은 가장
  가까운 named 함수에 귀속하며 없으면 파일의 topLevelComplexity에 포함한다.
  anonymousAttributions는 귀속 owner ID를 보존하며 익명 줄 범위 ID를 만들지 않는다.
- 클래스/namespace/중첩 함수 이름을 연결한 qualifiedName과 symbolKind를 사용한다.
  선언 이름 또는 variable/property의 이름을 가진 함수 표현식도 named로 취급한다.
  named class expression도 클래스 scope를 보존하고, 함수 initializer의 괄호 및
  as/type assertion/satisfies/non-null wrapper는 이름 귀속에 영향을 주지 않는다.
  구분할 수 없는 중복 symbol key는 충돌한 symbol 전부를 omittedSymbols에 ID/이름/개수/이유로
  기록하고 metric에서 제외한다. 파싱에 성공한 파일 LOC/topLevelComplexity와 고유 symbol은
  유지한다. 제외된 owner의 익명 귀속도 omittedAttributions에 남기며 임의의 줄 ID나 병합으로
  복원하지 않는다. 충돌이 있으면 전체 status는 partial이다.

각 metric은 단위/방향/출처/validity와 language:item-kind cohort의 입력 item 개수를
포함한다. unsupported/구문 오류는 diagnostics와 unavailable:null로 보고한다.
모호한 symbol은 위의 명시적 누락 증거로 구별한다. 지원되더라도 실제 Depth, 품질,
테스트 충실도 또는 결함으로 확정하지 않는다.
collector는 syntactic diagnostics만 검사하며 타입 검사나 외부 import 추론을 하지 않는다.
값이 없는 metric을 0으로 대체하지 않는다. ranking Module이 전역 cohort를 재구성한다.

검증: `node --test <skill>/scripts/ast-metrics.test.cjs`.

## 외부 API 근거

copied pin packageVersion 5.3.3 / snapshot legacy-7.0.2-3b0dbf4d3996는 서로 다른
버전이다. library-docs search 1회는 ENGINE_INCOMPATIBLE(엔진 미준비)로 실패했고 get은
0회다. 실패 응답에 search tokenUsage는 없었다. repo fallback 순서에 따라
[Microsoft Compiler API 안내](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)의
createSourceFile/forEachChild/Program 설명과 설치된 5.3.3 typescript.d.ts의
createCompilerHost 및 getSyntacticDiagnostics 선언을 확인했다. copied snapshot을
5.3.3 API의 release 근거로 해석하지 않았다.
