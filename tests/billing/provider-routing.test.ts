import assert from "node:assert/strict";
import { test } from "node:test";
import { getPaymentProviderForCountry } from "../../lib/billing/provider.ts";

test("uses Polar for all countries by default", () => {
  assert.equal(getPaymentProviderForCountry("ZA"), "polar");
  assert.equal(getPaymentProviderForCountry("US"), "polar");
  assert.equal(getPaymentProviderForCountry("GB"), "polar");
  assert.equal(getPaymentProviderForCountry("DE"), "polar");
  assert.equal(getPaymentProviderForCountry("XX"), "polar");
});
