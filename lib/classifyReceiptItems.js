import { isExcludedCategory } from "./excludedCategories.js";
import { lookupReferenceItem } from "./referenceTable.js";

function generateKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// 인식된 원시 품목을 제외/자동등록/확인필요 3갈래로 분류한다 (DESIGN.md 흐름 A).
export function classifyReceiptItems(rawItems) {
  const autoItems = [];
  const needsConfirmation = [];

  for (const raw of rawItems) {
    if (raw.unreadable) {
      needsConfirmation.push({
        key: generateKey(),
        rawName: raw.name || "",
        quantity: raw.quantity,
        reason: "unreadable",
      });
      continue;
    }

    if (isExcludedCategory(raw.name)) {
      continue; // 제외 카테고리는 조용히 버린다 (PRD 4장 61~63줄)
    }

    const match = lookupReferenceItem(raw.name);
    if (match.matched) {
      autoItems.push({
        name: raw.name,
        quantity: raw.quantity,
        storageType: match.storage,
        days: match.days,
      });
    } else {
      needsConfirmation.push({
        key: generateKey(),
        rawName: raw.name,
        quantity: raw.quantity,
        reason: "not_in_table",
      });
    }
  }

  return { autoItems, needsConfirmation };
}
