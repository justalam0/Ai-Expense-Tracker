const PALETTE = ["#4338ca", "#0ea5e9", "#f59e0b", "#dc2626", "#10b981", "#8b5cf6", "#ec4899", "#0d9488"];

export function getCategoryColor(category, type = "expense") {
  if (type === "income") return "#10b981"; // green color for all incomes
  
  if (!category) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export { PALETTE };