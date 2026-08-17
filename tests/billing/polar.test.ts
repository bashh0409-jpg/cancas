import assert from "node:assert/strict";
import { test } from "node:test";
import { selectPriceIdFromProduct } from "../../lib/billing/polar";

test("selects a monthly or annual price from a Polar product payload", () => {
  const product = {
    id: "prod_123",
    prices: [
      { id: "price_monthly", recurring_interval: "month", recurring_interval_count: 1 },
      { id: "price_annual", recurring_interval: "year", recurring_interval_count: 1 },
    ],
  };

  assert.equal(selectPriceIdFromProduct(product, "monthly"), "price_monthly");
  assert.equal(selectPriceIdFromProduct(product, "annual"), "price_annual");
  assert.equal(selectPriceIdFromProduct({ id: "prod_123", prices: [] }, "monthly"), undefined);
});
