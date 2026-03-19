import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type { WSEvent, AgentState, EndpointStats } from './types.js';

const clients = new Set<WebSocket>();

let totalRequests = 0;
let blockedAttempts = 0;
let revenueProtected = 0;

export function registerWSRoute(app: FastifyInstance): void {
  app.get('/ws/events', { websocket: true }, (socket) => {
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });
}

export function broadcast(event: WSEvent): void {
  const msg = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}

export function incrementTotalRequests(): void {
  totalRequests++;
}

export function incrementBlockedAttempts(): void {
  blockedAttempts++;
}

export function addRevenueProtected(amount: number): void {
  revenueProtected += amount;
}

export function startFleetTicker(getAgents: () => AgentState[]): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const agents = getAgents();
    const activeAgents = agents.filter((a) => !a.blocked && a.requestCount > 0).length;

    broadcast({
      type: 'fleet_tick',
      totalRequests,
      activeAgents,
      blockedAttempts,
      revenueProtected: parseFloat(revenueProtected.toFixed(4)),
      timestamp: new Date().toISOString(),
    });
  }, 2000);
}

export function startEndpointTicker(getEndpoints: () => EndpointStats[]): ReturnType<typeof setInterval> {
  return setInterval(() => {
    broadcast({
      type: 'endpoint_update',
      endpoints: getEndpoints(),
      timestamp: new Date().toISOString(),
    });
  }, 3000);
}

export function getStats() {
  return { totalRequests, blockedAttempts, revenueProtected };
}
