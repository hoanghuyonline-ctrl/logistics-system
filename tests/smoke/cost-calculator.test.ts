import { describe, it, expect } from "vitest";
import { calculateOrderCost } from "@/lib/cost-calculator";

describe("calculateOrderCost", () => {
  const baseInput = {
    unitPriceCNY: 100,
    quantity: 2,
    exchangeRate: 3500,
    serviceFeePercent: 5,
    chinaShippingFee: 50000,
    internationalShippingRate: 35000,
    vietnamDeliveryFee: 30000,
  };

  it("returns correct breakdown for a standard order", () => {
    const result = calculateOrderCost(baseInput);

    expect(result.totalPriceCNY).toBe(200);
    expect(result.totalPriceVND).toBe(700000);
    expect(result.serviceFeeVND).toBe(35000);
    expect(result.chinaShippingFee).toBe(50000);
    expect(result.internationalShippingFee).toBe(0);
    expect(result.vietnamDeliveryFee).toBe(30000);
    expect(result.totalCostVND).toBe(815000);
  });

  it("includes international shipping when weightKg is provided", () => {
    const result = calculateOrderCost({ ...baseInput, weightKg: 2 });

    expect(result.internationalShippingFee).toBe(70000);
    expect(result.totalCostVND).toBe(885000);
  });

  it("handles single-item order", () => {
    const result = calculateOrderCost({ ...baseInput, quantity: 1 });

    expect(result.totalPriceCNY).toBe(100);
    expect(result.totalPriceVND).toBe(350000);
  });

  it("handles zero service fee", () => {
    const result = calculateOrderCost({ ...baseInput, serviceFeePercent: 0 });

    expect(result.serviceFeeVND).toBe(0);
    expect(result.totalCostVND).toBe(780000);
  });
});
