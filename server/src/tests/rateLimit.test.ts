import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { WsRateLimiter, getClientIp } from '../services/wsRateLimiter.js';
import {
  generalApiLimiter,
  locationResolveLimiter,
  photoProxyLimiter,
} from '../middleware/rateLimiter.js';

test('WsRateLimiter - allows normal message traffic under threshold', () => {
  const limiter = new WsRateLimiter({
    maxMessagesPerWindow: 50,
    abuseMessageThreshold: 100,
    messageWindowMs: 1000,
    enabled: true,
  });

  const mockWs = {} as WebSocket;
  const now = 10000;

  // Send 15 messages (normal rapid tapping duel scenario)
  for (let i = 0; i < 15; i++) {
    const result = limiter.checkMessageRate(mockWs, now + i * 20);
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.closeConnection, undefined);
  }
});

test('WsRateLimiter - blocks when soft message rate limit is exceeded', () => {
  const limiter = new WsRateLimiter({
    maxMessagesPerWindow: 10,
    abuseMessageThreshold: 20,
    messageWindowMs: 1000,
    enabled: true,
  });

  const mockWs = {} as WebSocket;
  const now = 10000;

  // Send 10 messages within window -> all allowed
  for (let i = 0; i < 10; i++) {
    const result = limiter.checkMessageRate(mockWs, now);
    assert.strictEqual(result.allowed, true);
  }

  // 11th message -> soft limit exceeded
  const rejectedResult = limiter.checkMessageRate(mockWs, now);
  assert.strictEqual(rejectedResult.allowed, false);
  assert.strictEqual(rejectedResult.closeConnection, false);
  assert.strictEqual(rejectedResult.reason, 'rate_limit_exceeded');
});

test('WsRateLimiter - signals connection close when hard abuse threshold is exceeded', () => {
  const limiter = new WsRateLimiter({
    maxMessagesPerWindow: 10,
    abuseMessageThreshold: 20,
    messageWindowMs: 1000,
    enabled: true,
  });

  const mockWs = {} as WebSocket;
  const now = 10000;

  // Send up to 20 messages
  for (let i = 0; i < 20; i++) {
    limiter.checkMessageRate(mockWs, now);
  }

  // 21st message -> hard abuse limit exceeded
  const abuseResult = limiter.checkMessageRate(mockWs, now);
  assert.strictEqual(abuseResult.allowed, false);
  assert.strictEqual(abuseResult.closeConnection, true);
  assert.strictEqual(abuseResult.reason, 'abuse_limit_exceeded');
});

test('WsRateLimiter - sliding window recovers after window elapsed', () => {
  const limiter = new WsRateLimiter({
    maxMessagesPerWindow: 5,
    abuseMessageThreshold: 10,
    messageWindowMs: 1000,
    enabled: true,
  });

  const mockWs = {} as WebSocket;
  const t0 = 10000;

  for (let i = 0; i < 5; i++) {
    assert.strictEqual(limiter.checkMessageRate(mockWs, t0).allowed, true);
  }

  // 6th message at t0 fails
  assert.strictEqual(limiter.checkMessageRate(mockWs, t0).allowed, false);

  // After 1001ms, previous messages expire from sliding window
  const t1 = t0 + 1001;
  const recoveredResult = limiter.checkMessageRate(mockWs, t1);
  assert.strictEqual(recoveredResult.allowed, true);
  assert.strictEqual(recoveredResult.count, 1);
});

test('WsRateLimiter - removes socket tracking on disconnect', () => {
  const limiter = new WsRateLimiter({ enabled: true });
  const mockWs1 = {} as WebSocket;
  const mockWs2 = {} as WebSocket;

  limiter.checkMessageRate(mockWs1);
  limiter.checkMessageRate(mockWs2);
  assert.strictEqual(limiter.getTrackedSocketCount(), 2);

  limiter.removeSocket(mockWs1);
  assert.strictEqual(limiter.getTrackedSocketCount(), 1);

  limiter.removeSocket(mockWs2);
  assert.strictEqual(limiter.getTrackedSocketCount(), 0);
});

test('WsRateLimiter - throttles per-IP connections and prunes stale IPs', () => {
  const limiter = new WsRateLimiter({
    connectionWindowMs: 60_000,
    maxConnectionsPerWindow: 3,
    enabled: true,
  });

  const testIp = '192.168.1.100';
  const t0 = 50000;

  // 3 connections allowed
  assert.strictEqual(limiter.checkConnectionRate(testIp, t0).allowed, true);
  assert.strictEqual(limiter.checkConnectionRate(testIp, t0 + 100).allowed, true);
  assert.strictEqual(limiter.checkConnectionRate(testIp, t0 + 200).allowed, true);

  // 4th connection blocked
  const blocked = limiter.checkConnectionRate(testIp, t0 + 300);
  assert.strictEqual(blocked.allowed, false);
  assert.strictEqual(blocked.reason, 'connection_rate_limit_exceeded');

  // After 60_001ms, allowed again
  const t1 = t0 + 60_001;
  assert.strictEqual(limiter.checkConnectionRate(testIp, t1).allowed, true);

  // Pruning after expiration removes IP
  limiter.pruneStaleIpConnections(t1 + 60_001);
  // Re-check after prune allows clean connection
  assert.strictEqual(limiter.checkConnectionRate(testIp, t1 + 60_002).allowed, true);
});

test('getClientIp - extracts IP from x-forwarded-for or socket remote address', () => {
  const reqWithForwarded = {
    headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as IncomingMessage;

  assert.strictEqual(getClientIp(reqWithForwarded), '203.0.113.195');

  const reqWithDirectSocket = {
    headers: {},
    socket: { remoteAddress: '10.0.0.5' },
  } as unknown as IncomingMessage;

  assert.strictEqual(getClientIp(reqWithDirectSocket), '10.0.0.5');

  const reqFallback = {
    headers: {},
    socket: {},
  } as unknown as IncomingMessage;

  assert.strictEqual(getClientIp(reqFallback), '127.0.0.1');
});

test('HTTP Rate Limiters - middleware functions exported and configured', () => {
  assert.strictEqual(typeof generalApiLimiter, 'function');
  assert.strictEqual(typeof locationResolveLimiter, 'function');
  assert.strictEqual(typeof photoProxyLimiter, 'function');
});
