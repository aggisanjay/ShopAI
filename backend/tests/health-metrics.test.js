import test from 'node:test';
import assert from 'node:assert/strict';
import { redactSensitive } from '../src/utils/logger.js';
import { register } from '../src/observability/metrics.js';

test('Observability: Sensitive field redaction masks secrets, passwords, and tokens', () => {
  const sensitivePayload = {
    username: 'john_doe',
    password: 'supersecretpassword',
    token: 'jwt.token.string',
    nested: {
      clientSecret: 'secret_live_123',
      creditCard: '4111111111111111',
      regularField: 'safe_value',
    },
  };

  const redacted = redactSensitive(sensitivePayload);

  assert.equal(redacted.username, 'john_doe');
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.token, '[REDACTED]');
  assert.equal(redacted.nested.clientSecret, '[REDACTED]');
  assert.equal(redacted.nested.creditCard, '[REDACTED]');
  assert.equal(redacted.nested.regularField, 'safe_value');
});

test('Observability: Prometheus registry exposes core ShopAI metric names', async () => {
  const metricsOutput = await register.metrics();

  assert.ok(metricsOutput.includes('shopai_http_requests_total'), 'Should contain http_requests_total');
  assert.ok(metricsOutput.includes('shopai_http_request_duration_seconds'), 'Should contain request duration');
  assert.ok(metricsOutput.includes('shopai_mongodb_connected'), 'Should contain mongodb_connected');
  assert.ok(metricsOutput.includes('shopai_redis_connected'), 'Should contain redis_connected');
  assert.ok(metricsOutput.includes('shopai_orders_created_total'), 'Should contain orders_created_total');
});
