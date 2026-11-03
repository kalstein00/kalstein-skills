# Ranking v1

텍스트 보고서의 `선정 기여`는 저장된 coupling group의 최대 percentile과 같은 signals를
원시 metric(name/cohort/source/percentile)에 연결한다. 동률은 모두 표시하며 순위를
재계산하지 않는다. 유효/관측 표본 수와 비교군은 원본 필드이고 누락 시 확인 불가다.
근거 분류 요약은 **관측 그래프 전체**의 수치로 표시한다. 후보 자체의 의존 수와
혼동하지 않으며 partial/누락/판정 불가 이유를 보존한다. 기존 보고서에 근거가 없으면
새 confirmed 의미를 소급해 부여하지 않는다.

`rankMetrics(metricRecords)`는 schema-v1 metric을 받아 순수 계산한다. cohort는 명시된
`language:item-kind`이며 file/symbol/cluster/violation kind만 허용한다. 비교 집합 key는
metric name + cohort + unit + direction + source다. 서로 다른 단위/출처/언어/kind의
원시 값을 섞지 않는다. 중복 item/name/cohort는 오류다. observedPopulation과 validPopulation을
원본 population과 별도로 보존한다. 유효 비교 표본이 3개 미만이면 순위는 unavailable이다.

위험 방향 value는 higher이면 그대로, lower이면 부호를 뒤집는다. N개 유효 표본에서
본인보다 낮은 위험 값의 수를 L, 같은 값의 수를 E라 하면 percentile은
`100 * (L + (E - 1) / 2) / (N - 1)`이다. 동률은 같은 값이고 전부 동률이면 50이다.
원본 unavailable/failed는 N에서도 제외하며 percentile:null과 이유를 남긴다.
작은 cohort나 미지원 수집값을 0점으로 선발 경쟁에 넣지 않는다.

신호군 순서는 structure → coupling → size → interface → history → test-linkage다.
각 metric 소속은 Module의 GROUP_METRICS v1 목록으로 고정한다. 미배정 metric은 ungrouped
이유를 반환한다. group 안의 item 위치는 해당 item이 가진 metric percentile의 최댓값,
동률은 ID의 UTF-16 오름차순이다. signals에 원래 metric/cohort/출처/percentile을 보존한다.
이는 서로 다른 원시 cohort를 합친 percentile이나 단일 종합 결함 점수가 아니다.
각 cohort 안에서의 상대 위치를 사용한 신호군별 검토 순서다.

overlap은 억제 적용 전 각 신호군 Top5에 나타나는 ID와 group 목록이다. accepted/rejected
eligibility 적용 후의 Top5와 최종 quota 선발은 후속 selection Module이 계산한다.
metric 목록·group 순위·ID tie-break·overlap은 입력 열거 순서와 무관하다. 최소 표본 때문에
희소 cluster/violation이 순위 밖이어도 원시 metric과 unavailable 이유는 결과에 남는다.

검증: `node --test <skill>/scripts/ranking.test.cjs`.
