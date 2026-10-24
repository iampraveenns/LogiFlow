/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Full-Stack Express & Real-Time WebSocket Server
 * Connects RESTful logistics API, JWT authentication, and RFC 6455 WebSocket Live Chat Server on Port 3000.
 */

import http from 'http';
import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { JwtAuthService } from './src/backend/services/jwtAuthService.ts';
import { WebSocketChatHub, LOGISTICS_CHANNELS } from './src/backend/services/webSocketChatService.ts';
import { ApiController } from './src/backend/controllers/apiController.ts';
import { logger } from './src/packages/logger/index.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// CORS & Security Headers
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// ==========================================
// 1. HEALTH & METRICS ENDPOINTS
// ==========================================
app.get('/api/health', (_req: Request, res: Response) => {
  const hub = WebSocketChatHub.getInstance();
  res.json({
    status: 'HEALTHY',
    service: 'LogiFlow Enterprise Logistics API',
    uptimeSeconds: process.uptime(),
    activeWebSockets: hub.getConnectedClientsCount(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. JWT AUTHENTICATION REST ENDPOINTS
// ==========================================
app.post('/api/auth/signin', async (req: Request, res: Response) => {
  try {
    const result = await JwtAuthService.signIn(req.body);
    if (!result.success) {
      res.status(result.mfaRequired ? 403 : 401).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    logger.error('AUTH_ERROR', 'Sign in failed', err);
    res.status(500).json({ success: false, message: err.message || 'Authentication error' });
  }
});

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const result = await JwtAuthService.signUp(req.body);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (err: any) {
    logger.error('AUTH_ERROR', 'Sign up failed', err);
    res.status(500).json({ success: false, message: err.message || 'Registration error' });
  }
});

app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await JwtAuthService.refreshAccessToken(refreshToken);
    if (!result.success) {
      res.status(401).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    JwtAuthService.revokeToken(authHeader.slice(7));
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/demo-users', (_req: Request, res: Response) => {
  res.json({ users: JwtAuthService.listAvailableUsers() });
});

// ==========================================
// 3. LOGISTICS LIVE CHAT REST FALLBACKS
// ==========================================
app.get('/api/chat/channels', (_req: Request, res: Response) => {
  res.json({ channels: LOGISTICS_CHANNELS });
});

app.get('/api/chat/messages/:channelId', (req: Request, res: Response) => {
  const hub = WebSocketChatHub.getInstance();
  const messages = hub.getChannelMessages(req.params.channelId as any);
  res.json({ channelId: req.params.channelId, messages });
});

// ==========================================
// 4. CORE LOGISTICS DOMAIN ENDPOINTS
// ==========================================
app.get('/api/shipments', async (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string;
  const shipments = await ApiController.getShipments(tenantId);
  res.json({ shipments });
});

app.get('/api/telematics/vehicles', async (_req: Request, res: Response) => {
  const vehicles = await ApiController.getVehicles();
  res.json({ vehicles });
});

// Create native HTTP server
const server = http.createServer(app);

// ==========================================
// 5. WEBSOCKET SERVER ATTACHMENT
// ==========================================
const wss = new WebSocketServer({ server, path: '/ws/chat' });
const hub = WebSocketChatHub.getInstance();

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const token = url.searchParams.get('token') || undefined;
  const clientId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  logger.info('WS_SERVER', `New WebSocket client connection on /ws/chat (id: ${clientId})`);

  // Bridge client to WebSocketChatHub
  hub.handleConnection(
    clientId,
    (serverEvent) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(serverEvent));
      }
    },
    token
  );

  ws.on('message', (data: Buffer | string) => {
    try {
      const payloadStr = typeof data === 'string' ? data : data.toString('utf-8');
      const parsedEvent = JSON.parse(payloadStr);
      hub.handleClientEvent(clientId, parsedEvent);
    } catch (err: any) {
      logger.error('WS_SERVER', 'Error processing client message', err);
    }
  });

  ws.on('close', () => {
    hub.handleDisconnect(clientId);
  });

  ws.on('error', (err) => {
    logger.error('WS_SERVER', `WebSocket error on client ${clientId}`, err);
    hub.handleDisconnect(clientId);
  });
});

// In dev with Vite middleware:
if (process.env.NODE_ENV !== 'production') {
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then((vite) => {
      app.use(vite.middlewares);
      server.listen(PORT, '0.0.0.0', () => {
        logger.info('SERVER', `LogiFlow Enterprise full-stack dev server active at http://0.0.0.0:${PORT}`);
      });
    });
  });
} else {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info('SERVER', `LogiFlow Enterprise production server listening on port ${PORT}`);
  });
}

export { app, server };
