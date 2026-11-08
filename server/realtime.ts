import { Response } from 'express';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
}

// Set of connected SSE clients
const sseClients = new Map<Response, { admin: boolean; visitorId?: string }>();

/**
 * Register a new SSE client
 */
export function registerSSEClient(res: Response, audience: { admin: boolean; visitorId?: string }): () => void {
  sseClients.set(res, audience);

  // Send initial connected ping
  try {
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clients: sseClients.size, time: Date.now() })}\n\n`);
  } catch (err) {
    // ignore
  }

  // Return unregister callback
  return () => {
    sseClients.delete(res);
  };
}

/**
 * Broadcast an event to all connected SSE clients instantly
 */
export function broadcastRealtime(eventType: string, data: any): void {
  const payload: RealtimeEvent = {
    type: eventType,
    data,
    timestamp: Date.now(),
  };

  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const [client, audience] of sseClients) {
    const isPublic = ['settings:updated', 'services:updated', 'seo:updated', 'chat:status'].includes(eventType);
    const isOwnChat = audience.visitorId && audience.visitorId === data.visitorId;
    if (!audience.admin && !isPublic && !isOwnChat) continue;
    try {
      client.write(message);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

/**
 * Get number of currently connected realtime clients
 */
export function getConnectedClientCount(): number {
  return sseClients.size;
}

// Keep-alive heartbeat every 20 seconds to prevent proxies/mobile timeouts
setInterval(() => {
  if (sseClients.size === 0) return;
  const ping = `: heartbeat ${Date.now()}\n\n`;
  for (const client of sseClients.keys()) {
    try {
      client.write(ping);
    } catch {
      sseClients.delete(client);
    }
  }
}, 20000);
