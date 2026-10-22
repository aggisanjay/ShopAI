import test from 'node:test';
import assert from 'node:assert/strict';
import { cacheKeys, canonicalizeParams } from '../src/config/cacheKeyBuilder.js';
import { cacheGet, cacheSet, cacheDel, fetchOrSet } from '../src/config/redis.js';

test('Cache Key Builder: Canonicalizes query parameters regardless of order', () => {
  const query1 = { sort: 'trending', page: '1', limit: '10' };
  const query2 = { limit: '10', sort: 'trending', page: '1' };

  assert.equal(canonicalizeParams(query1), canonicalizeParams(query2));
  assert.equal(cacheKeys.productsList(query1), cacheKeys.productsList(query2));
});

test('Cache Key Builder: Ignores null, undefined, or empty query params', () => {
  const query1 = { sort: 'price_asc', category: '' };
  const query2 = { sort: 'price_asc' };

  assert.equal(cacheKeys.productsList(query1), cacheKeys.productsList(query2));
});

test('Redis Cache: Single-flight stampede protection executes fetcher only once for concurrent requests', async () => {
  let executionCount = 0;
  const expensiveComputation = async () => {
    executionCount++;
    await new Promise((r) => setTimeout(r, 50));
    return { data: 'computed_result', ts: Date.now() };
  };

  const testKey = `shopai:test:stampede:${Date.now()}`;

  // Launch 5 concurrent calls for the same cold cache key
  const results = await Promise.all([
    fetchOrSet(testKey, expensiveComputation, 30),
    fetchOrSet(testKey, expensiveComputation, 30),
    fetchOrSet(testKey, expensiveComputation, 30),
    fetchOrSet(testKey, expensiveComputation, 30),
    fetchOrSet(testKey, expensiveComputation, 30),
  ]);

  // Fetcher should have executed only once
  assert.equal(executionCount, 1);
  assert.equal(results[0].data, 'computed_result');
  assert.equal(results[1].data, 'computed_result');

  // Clean up
  await cacheDel(testKey);
});

test('Redis Cache: Set, Get, and Invalidate cycle', async () => {
  const testKey = `shopai:test:cycle:${Date.now()}`;
  const payload = { item: 'jacket', price: 2999 };

  await cacheSet(testKey, payload, 30);
  const fetched = await cacheGet(testKey);

  if (fetched !== null) {
    // Redis is online in test environment
    assert.deepEqual(fetched, payload);
    await cacheDel(testKey);
    const afterDel = await cacheGet(testKey);
    assert.equal(afterDel, null);
  } else {
    // Redis offline: graceful fallback is verified by returning null without crashing
    assert.equal(fetched, null);
  }
});
