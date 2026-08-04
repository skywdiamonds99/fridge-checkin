import OpenAI from "openai";

// 모델 호출은 서버 쪽 코드에서만 하고, 키는 환경변수로 넣는다 (PRD 7장).
// 이 파일은 Route Handler이므로 클라이언트 번들에 절대 포함되지 않는다.
// 클라이언트는 요청이 들어올 때(런타임) 생성한다 — 모듈 최상단에서 만들면
// 키가 아직 없을 때 빌드(next build)의 정적 분석 단계에서부터 실패한다.
function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
const MODEL = process.env.OPENAI_RECEIPT_MODEL || "gpt-4o-mini";

const RECEIPT_SCHEMA = {
  name: "receipt_extraction",
  schema: {
    type: "object",
    properties: {
      purchaseDateTime: {
        type: ["string", "null"],
        description: "영수증에 인쇄된 구매 날짜와 시각. ISO 8601 형식(예: 2026-08-01T14:23:00). 전혀 읽을 수 없으면 null.",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "브랜드·제품명을 포함해 영수증에 인쇄된 그대로" },
            quantity: { type: ["number", "null"], description: "수량이 안 보이면 null" },
            unreadable: { type: "boolean", description: "글자가 흐릿하거나 읽을 수 없으면 true" },
          },
          required: ["name", "quantity", "unreadable"],
          additionalProperties: false,
        },
      },
    },
    required: ["purchaseDateTime", "items"],
    additionalProperties: false,
  },
  strict: true,
};

const SYSTEM_PROMPT = `너는 한국 마트 영수증 사진을 읽는 도우미다. 규칙:
- 여러 장이 주어지면 같은 영수증의 연속된 부분이니 하나의 목록으로 합쳐라.
- 품목명은 영수증에 인쇄된 브랜드·제품명을 그대로 옮겨라. 요약하거나 정리하지 마라.
- 카드번호, 승인번호, 매장명, 지점명, 합계·결제금액 같은 결제 정보는 items에 절대 포함하지 마라.
- 구매 일시는 영수증에 인쇄된 날짜와 시각을 그대로 읽어라. 시각까지 읽어야 한다.
- 글자가 흐릿하거나 확신할 수 없는 줄은 unreadable을 true로 표시하라.`;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const images = Array.isArray(body?.images) ? body.images : [];
  if (images.length === 0 || !images.every((img) => typeof img === "string" && img.startsWith("data:image/"))) {
    return Response.json({ error: "영수증 이미지가 없습니다." }, { status: 400 });
  }

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "이 영수증 사진에서 품목 목록과 구매 일시를 읽어줘." },
            ...images.map((url) => ({ type: "image_url", image_url: { url } })),
          ],
        },
      ],
      response_format: { type: "json_schema", json_schema: RECEIPT_SCHEMA },
    });

    // 이미지는 여기서 응답만 만들고 버린다 — 서버 어디에도 저장하지 않는다 (PRD 8장).
    const parsed = JSON.parse(response.choices[0].message.content);

    if (!parsed.purchaseDateTime) {
      return Response.json(
        { error: "구매 일시를 읽지 못했습니다. 다시 촬영해주세요." },
        { status: 422 }
      );
    }

    return Response.json({
      purchaseDateTime: parsed.purchaseDateTime,
      items: parsed.items.map((item) => ({
        name: item.name,
        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1, // 수량 미기재 시 1개로 본다 (PRD 4장 72줄)
        unreadable: Boolean(item.unreadable),
      })),
    });
  } catch (error) {
    console.error("영수증 인식 실패:", error.message);
    return Response.json({ error: "영수증을 인식하지 못했습니다. 다시 시도해주세요." }, { status: 502 });
  }
}
