export const INCOME_TAX_RATE = 0.07;

export function computeIncomeTaxAmount(gross: number): number {
  return Math.round(gross * INCOME_TAX_RATE * 100) / 100;
}

export function incomeTaxDescription(): string {
  return "Податок 7% від нарахування";
}
