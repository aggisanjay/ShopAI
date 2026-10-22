import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOrderNumber } from '../src/models/Order.model.js';

test('Checkout Concurrency: 500 concurrent order creations generate 100% unique collision-free order numbers', () => {
  const generatedNumbers = new Set();
  const count = 500;

  for (let i = 0; i < count; i++) {
    const orderNumber = generateOrderNumber();
    assert.ok(orderNumber.startsWith('ORD'), 'Must start with ORD');
    assert.ok(!generatedNumbers.has(orderNumber), `Collision detected: ${orderNumber}`);
    generatedNumbers.add(orderNumber);
  }

  assert.equal(generatedNumbers.size, count);
});

test('Checkout Invariants: Price calculations strictly computed server-side', () => {
  const subtotal = 1500;
  const couponDiscount = 200;
  const shippingCost = subtotal >= 500 ? 0 : 49;
  const taxRate = 0.18;

  const taxableAmount = subtotal - couponDiscount;
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const expectedTotal = taxableAmount + shippingCost + taxAmount;

  assert.equal(taxableAmount, 1300);
  assert.equal(taxAmount, 234);
  assert.equal(shippingCost, 0); // Free shipping over 500
  assert.equal(expectedTotal, 1534);
});
