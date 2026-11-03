# Ownership map v1

```js
resolveOwnership(paths, { schemaVersion: 1, rules: [
  { id: 'explicit-core', glob: 'app/src/core/**', owner: 'core', priority: 10 }
] }, { clusters: [{ id: 'cycle-id', members: paths }], edges: [] });
```

이 map은 입력 형식 예시이며 실제 도메인 소유권을 선언하지 않는다. 명시 소유권이
없는 호출은 `{schemaVersion:1,rules:[]}`를 전달한다. 실제 map의 내용은 호출자 권위다.
검증은 root에서 `node --test <skill>/scripts/ownership.test.cjs`.

중첩 glob은 priority 내림차순, 동률은 rule id의 UTF-16 code-unit 오름차순으로
결정한다. specificity나 입력 배열 순서에 의존하지 않는다. matchedRules는 이 순서의
모든 일치 규칙이며 첫 규칙이 권위다. id는 유일해야 하고 priority는 정수다.
glob은 저장소 상대 경로의 literal, 한 segment 내 `*`/`?`, 전체 segment `**`만
지원한다. `**/`는 0개 이상 디렉터리다. braces/classes/extglob은 오류로 반환한다.

미등록 경로는 package-layer-feature-v1을 사용한다. 파일명을 제거한 디렉터리에서
첫 segment가 package이고 rust는 앞 두 segment를 package로 쓴다. 나머지에서 src를
제거한 첫 두 segment가 layer/feature이며 없는 값은 root다. 소유자는
`package:layer:feature`이고 package/layer/feature와 fallback:true를 함께 반환한다.
이는 경로상 분류이며 실제 도메인 의미를 추정하지 않는다.

cluster는 모든 member path의 owner 집합을 중복 제거·정렬해 반환한다. edges는
source/target의 owner와 crossOwner를 반환한다. 멤버가 입력 files에 없으면 명시적으로
실패한다. 이후 selection은 cluster owner 전체의 quota를 소비해야 한다.

mapIdentity는 정규화한 map의 SHA-256이며 rules 배열의 순서는 영향을 주지 않는다.
map 변경은 후속 rejected 재검토 입력이다. schema/필드/중복/지원하지 않는 glob은
ownership map의 오류 위치와 함께 실패하며 fallback으로 덮지 않는다.
