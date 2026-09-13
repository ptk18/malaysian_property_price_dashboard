export const money = (value: number | null, decimals = 0) =>
  value === null
    ? "Not available"
    : `RM ${value.toLocaleString("en-MY", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}`;
export const count = (value: number | null) =>
  value === null
    ? "Not available"
    : value.toLocaleString("en-MY", { maximumFractionDigits: 0 });
export function bedroomTradeoff(delta: number) {
  return delta === 0
    ? "Exact bedrooms"
    : `${Math.abs(delta)} ${delta < 0 ? "fewer" : "more"} bedroom`;
}
export function priceTradeoff(delta: number) {
  if (delta === 0) return "At target budget";
  const magnitude = Math.abs(delta);
  return `${magnitude < 0.1 ? "<0.1" : magnitude.toFixed(1)}% ${delta > 0 ? "above" : "below"} target`;
}
