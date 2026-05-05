interface CostInput {
  unitPriceCNY: number;
  quantity: number;
  exchangeRate: number;
  serviceFeePercent: number;
  chinaShippingFee: number;
  weightKg?: number;
  internationalShippingRate: number;
  vietnamDeliveryFee: number;
}

interface CostBreakdown {
  totalPriceCNY: number;
  totalPriceVND: number;
  serviceFeeVND: number;
  chinaShippingFee: number;
  internationalShippingFee: number;
  vietnamDeliveryFee: number;
  totalCostVND: number;
}

export function calculateOrderCost(input: CostInput): CostBreakdown {
  const totalPriceCNY = Math.round(input.unitPriceCNY * input.quantity * 100) / 100;
  const totalPriceVND = Math.round(totalPriceCNY * input.exchangeRate * 100) / 100;
  const serviceFeeVND = Math.round(totalPriceCNY * (input.serviceFeePercent / 100) * input.exchangeRate * 100) / 100;
  const chinaShippingFee = input.chinaShippingFee;
  const internationalShippingFee = input.weightKg
    ? Math.round(input.weightKg * input.internationalShippingRate * 100) / 100
    : 0;
  const vietnamDeliveryFee = input.vietnamDeliveryFee;

  const totalCostVND = Math.round(
    (totalPriceVND + serviceFeeVND + chinaShippingFee + internationalShippingFee + vietnamDeliveryFee) * 100
  ) / 100;

  return {
    totalPriceCNY,
    totalPriceVND,
    serviceFeeVND,
    chinaShippingFee,
    internationalShippingFee,
    vietnamDeliveryFee,
    totalCostVND,
  };
}
