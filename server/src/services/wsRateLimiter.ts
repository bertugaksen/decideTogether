import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';

export interface WsRateLimiterOptions {
  messageWindowMs?: number;
  maxMessagesPerWindow?: number;
  abuseMessageThreshold?: number;
  connectionWindowMs?: number;
  maxConnectionsPerWindow?: number;
  enabled?: boolean;
}

export interface WsMessageRateResult {
  allowed: boolean;
  count: number;
  closeConnection?: boolean;
  reason?: string;
}

export interface WsConnectionRateResult {
  allowed: boolean;
  count: number;
  reason?: string;
}

export class WsRateLimiter {
  private messageWindowMs: number;
  private maxMessagesPerWindow: number;
  private abuseMessageThreshold: number;
  private connectionWindowMs: number;
  private maxConnectionsPerWindow: number;
  private enabled: boolean;

  // Track timestamps per socket for message rate limiting
  private socketMessages: Map<WebSocket, number[]> = new Map();

  // Track connection timestamps per IP address
  private ipConnections: Map<string, number[]> = new Map();

  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: WsRateLimiterOptions = {}) {
    this.messageWindowMs = options.messageWindowMs ?? 1000;
    this.maxMessagesPerWindow =
      options.maxMessagesPerWindow ??
      (process.env.WS_MAX_MSG_PER_SEC ? parseInt(process.env.WS_MAX_MSG_PER_SEC, 10) : 50);
    this.abuseMessageThreshold =
      options.abuseMessageThreshold ??
      (process.env.WS_ABUSE_MSG_PER_SEC ? parseInt(process.env.WS_ABUSE_MSG_PER_SEC, 10) : 100);
    this.connectionWindowMs = options.connectionWindowMs ?? 60_000;
    this.maxConnectionsPerWindow =
      options.maxConnectionsPerWindow ??
      (process.env.WS_MAX_CONN_PER_MIN ? parseInt(process.env.WS_MAX_CONN_PER_MIN, 10) : 30);
    this.enabled = options.enabled ?? process.env.NODE_ENV !== 'test';

    // Prune stale connection timestamps every minute if not in test
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => {
        this.pruneStaleIpConnections();
      }, 60_000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Check whether an incoming WebSocket message is allowed under the rate limit.
   */
  public checkMessageRate(ws: WebSocket, now = Date.now()): WsMessageRateResult {
    if (!this.enabled) {
      return { allowed: true, count: 0 };
    }

    const cutoff = now - this.messageWindowMs;
    let timestamps = this.socketMessages.get(ws);

    if (!timestamps) {
      timestamps = [];
      this.socketMessages.set(ws, timestamps);
    }

    // Filter to keep only timestamps within the sliding window
    timestamps = timestamps.filter((ts) => ts > cutoff);
    timestamps.push(now);
    this.socketMessages.set(ws, timestamps);

    const count = timestamps.length;

    // Hard threshold violation: intentional flooding / DoS attack
    if (count > this.abuseMessageThreshold) {
      return {
        allowed: false,
        count,
        closeConnection: true,
        reason: 'abuse_limit_exceeded',
      };
    }

    // Soft threshold violation: client sending faster than permitted
    if (count > this.maxMessagesPerWindow) {
      return {
        allowed: false,
        count,
        closeConnection: false,
        reason: 'rate_limit_exceeded',
      };
    }

    return { allowed: true, count };
  }

  /**
   * Check whether a new connection from the given IP address is allowed.
   */
  public checkConnectionRate(ip: string, now = Date.now()): WsConnectionRateResult {
    if (!this.enabled) {
      return { allowed: true, count: 0 };
    }

    const cutoff = now - this.connectionWindowMs;
    let timestamps = this.ipConnections.get(ip) || [];

    timestamps = timestamps.filter((ts) => ts > cutoff);

    if (timestamps.length >= this.maxConnectionsPerWindow) {
      this.ipConnections.set(ip, timestamps);
      return {
        allowed: false,
        count: timestamps.length,
        reason: 'connection_rate_limit_exceeded',
      };
    }

    timestamps.push(now);
    this.ipConnections.set(ip, timestamps);

    return {
      allowed: true,
      count: timestamps.length,
    };
  }

  /**
   * Clean up tracking data when a socket disconnects.
   */
  public removeSocket(ws: WebSocket): void {
    this.socketMessages.delete(ws);
  }

  /**
   * Prune IPs that have no connections within the connection window.
   */
  public pruneStaleIpConnections(now = Date.now()): void {
    const cutoff = now - this.connectionWindowMs;
    for (const [ip, timestamps] of this.ipConnections.entries()) {
      const active = timestamps.filter((ts) => ts > cutoff);
      if (active.length === 0) {
        this.ipConnections.delete(ip);
      } else {
        this.ipConnections.set(ip, active);
      }
    }
  }

  /**
   * Reset all state (useful for tests).
   */
  public reset(): void {
    this.socketMessages.clear();
    this.ipConnections.clear();
  }

  /**
   * Stop background timer.
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get active tracked socket count.
   */
  public getTrackedSocketCount(): number {
    return this.socketMessages.size;
  }

  /**
   * Enable or disable rate limiting.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

/**
 * Helper to extract client IP address from WebSocket incoming HTTP upgrade request.
 */
export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

export const wsRateLimiter = new WsRateLimiter();
