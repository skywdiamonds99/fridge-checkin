// 소비기한 표준 기준표 — 자주 사는 품목부터 시작해 넓혀간다 (PRD 4장 66줄).
// 국내 기준(식약처 소비기한 참고값)을 우선하고, 국내에 없는 품목만 해외 기준(USDA FoodKeeper)을 참고한다 (PRD 4장 65줄).

// 같은 품목명이라도 가공 형태에 따라 소비기한이 100배 넘게 차이 나는 경우가 있다.
// (예: `오뚜기 사골곰탕`은 레토르트 실온 1년, `한우 국거리`는 생육 냉장 3일 — PRD 4장 67줄)
// 브랜드·제품명으로 가공 형태가 분명히 드러나는 조합만 여기서 판정한다.
const DISAMBIGUATED = [
  {
    name: "레토르트 국/탕/찌개",
    pattern: /레토르트|오뚜기|청정원|비비고|동원.*(곰탕|사골|국|탕|찌개|카레)/,
    storage: "실온",
    days: 365,
  },
  {
    name: "생육 국거리/찌개감/불고기감",
    pattern: /(한우|생|국내산).*(국거리|찌개감|불고기감)|(국거리|찌개감|불고기감).*(한우|생)/,
    storage: "냉장",
    days: 3,
  },
  {
    name: "즉석/컵 죽",
    pattern: /(즉석|컵|레토르트|본죽|오뚜기).*죽|죽.*(즉석|컵|레토르트)/,
    storage: "실온",
    days: 365,
  },
];

// 곰탕/국거리/찌개감처럼 가공 형태를 모르면 확신할 수 없는 품목의 어근.
// 위 DISAMBIGUATED에서 해석되지 않으면 자동 등록하지 않고 확인 필요로 보낸다 (PRD 4장 68줄).
const AMBIGUOUS_ROOTS = /곰탕|국거리|찌개감|불고기감|탕$|죽$/;

// 가공 형태 구분이 필요 없는 일반 품목. altStorage가 있으면 요청된 보관 구분에 따라 일수가 달라진다.
const GENERIC = [
  { pattern: /우유|밀크/, storage: "냉장", days: 7 },
  { pattern: /계란|달걀/, storage: "냉장", days: 21 },
  { pattern: /두부/, storage: "냉장", days: 5 },
  { pattern: /김치/, storage: "냉장", days: 90 },
  { pattern: /대파|쪽파/, storage: "냉장", days: 14 },
  { pattern: /양파/, storage: "실온", days: 30 },
  { pattern: /감자/, storage: "실온", days: 60 },
  { pattern: /고구마/, storage: "실온", days: 30 },
  { pattern: /당근/, storage: "냉장", days: 21 },
  { pattern: /사과/, storage: "냉장", days: 30 },
  { pattern: /바나나/, storage: "실온", days: 5 },
  { pattern: /삼겹살|목살|돼지고기/, storage: "냉장", days: 3, altStorage: { 냉동: 90 } },
  { pattern: /소고기|한우(구이|스테이크)?$/, storage: "냉장", days: 3, altStorage: { 냉동: 90 } },
  { pattern: /닭고기|닭가슴살|닭다리|통닭/, storage: "냉장", days: 2, altStorage: { 냉동: 90 } },
  { pattern: /만두/, storage: "냉동", days: 180 },
  { pattern: /즉석밥|햇반/, storage: "실온", days: 365 },
  { pattern: /라면/, storage: "실온", days: 180 },
  { pattern: /두유/, storage: "실온", days: 180 },
  { pattern: /요거트|요구르트/, storage: "냉장", days: 14 },
  { pattern: /치즈/, storage: "냉장", days: 30 },
  { pattern: /버터/, storage: "냉장", days: 60 },
  { pattern: /어묵/, storage: "냉장", days: 10 },
  { pattern: /소시지/, storage: "냉장", days: 14 },
  { pattern: /^햄|슬라이스햄/, storage: "냉장", days: 14 },
  { pattern: /참치캔|참치\s*캔/, storage: "실온", days: 730 },
  { pattern: /카레/, storage: "실온", days: 365 },
  { pattern: /콩나물/, storage: "냉장", days: 5 },
  { pattern: /시금치/, storage: "냉장", days: 5 },
  { pattern: /상추/, storage: "냉장", days: 7 },
  { pattern: /오이/, storage: "냉장", days: 10 },
  { pattern: /토마토/, storage: "냉장", days: 14 },
  { pattern: /딸기/, storage: "냉장", days: 5 },
  { pattern: /포도/, storage: "냉장", days: 10 },
  { pattern: /귤/, storage: "냉장", days: 21 },
  { pattern: /새우/, storage: "냉동", days: 180 },
  { pattern: /오징어/, storage: "냉동", days: 180 },
  { pattern: /고등어/, storage: "냉장", days: 2, altStorage: { 냉동: 90 } },
  { pattern: /맥주/, storage: "실온", days: 180 },
  { pattern: /와인/, storage: "실온", days: 730 },
  // "빵"을 포함하는 더 구체적인 편의점 빵류는 아래 일반 /식빵|빵/ 패턴보다 먼저 와야 한다.
  // lookupReferenceItem은 배열 순서대로 검사해 첫 매칭에서 멈추기 때문이다.
  { pattern: /호빵|찐빵/, storage: "냉장", days: 3, altStorage: { 냉동: 90 } },
  { pattern: /크림빵|롤케이크|카스테라/, storage: "냉장", days: 5 },
  { pattern: /계란빵/, storage: "냉장", days: 3 },
  { pattern: /식빵|빵/, storage: "실온", days: 3, altStorage: { 냉장: 7 } },
  { pattern: /떡/, storage: "냉장", days: 3, altStorage: { 냉동: 30 } },
  { pattern: /양배추/, storage: "냉장", days: 14 },
  { pattern: /버섯/, storage: "냉장", days: 7 },

  // 편의점에서 흔히 파는 품목 (CU·GS25·세븐일레븐 등)
  { pattern: /삼각김밥|김밥/, storage: "냉장", days: 1 },
  { pattern: /도시락/, storage: "냉장", days: 1 },
  { pattern: /샌드위치/, storage: "냉장", days: 2 },
  { pattern: /핫바/, storage: "냉장", days: 10 },
  { pattern: /컵라면|사발면|즉석라면|우동\s*컵/, storage: "실온", days: 180 },
  // 미개봉 탄산음료·생수는 냉장 보관해도 화학적 소비기한이 거의 같으므로 두 보관 구분 모두 인정한다.
  { pattern: /콜라|사이다|환타|스프라이트|탄산음료/, storage: "실온", days: 270, altStorage: { 냉장: 270 } },
  { pattern: /삼다수|생수|이온음료|게토레이|파워에이드|비타500/, storage: "실온", days: 365, altStorage: { 냉장: 365 } },
  { pattern: /캔커피|컵커피|조지아|레쓰비|바리스타|라떼/, storage: "냉장", days: 30, altStorage: { 실온: 270 } },
  { pattern: /아이스크림|하겐다즈|메로나|스크류바|월드콘/, storage: "냉동", days: 365 },
  { pattern: /핫도그/, storage: "냉동", days: 90, altStorage: { 냉장: 5 } },
  { pattern: /초콜릿|초코볼|과자|스낵|쿠키|비스킷/, storage: "실온", days: 180, altStorage: { 냉장: 180 } },
];

/**
 * 품목명과 (인식된 경우) 보관 구분으로 기준표를 조회한다.
 * 매칭되면 { matched: true, storage, days }를, 불확실하면 { matched: false }를 반환한다.
 */
export function lookupReferenceItem(rawName, requestedStorage) {
  const name = (rawName || "").trim();
  if (!name) return { matched: false };

  for (const entry of DISAMBIGUATED) {
    if (entry.pattern.test(name)) {
      return { matched: true, storage: entry.storage, days: entry.days };
    }
  }

  if (AMBIGUOUS_ROOTS.test(name)) {
    return { matched: false };
  }

  for (const entry of GENERIC) {
    if (!entry.pattern.test(name)) continue;

    if (requestedStorage && requestedStorage !== entry.storage) {
      if (entry.altStorage && entry.altStorage[requestedStorage] != null) {
        return { matched: true, storage: requestedStorage, days: entry.altStorage[requestedStorage] };
      }
      // 인식된 보관 구분이 기준표와 다르면 임의로 맞추지 않고 확인 필요로 보낸다
      return { matched: false };
    }

    return { matched: true, storage: entry.storage, days: entry.days };
  }

  return { matched: false };
}
