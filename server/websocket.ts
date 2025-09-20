import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import url from 'url';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

const connectedUsers = new Map<string, AuthenticatedWebSocket>();

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient: (info: { req: IncomingMessage }) => {
      try {
        const parsedUrl = url.parse(info.req.url || '', true);
        const token = parsedUrl.query.token as string;

        if (!token) return false;

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
        return !!decoded.sub;
      } catch {
        return false;
      }
    }
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    try {
      const parsedUrl = url.parse(req.url || '', true);
      const token = parsedUrl.query.token as string;

      if (!token) {
        ws.close();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      ws.userId = decoded.sub;
      ws.isAlive = true;

      // Store user connection
      connectedUsers.set(ws.userId, ws);
      console.log(`User ${ws.userId} connected via WebSocket`);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }));

      // Handle ping/pong for connection health
      ws.on('pong', () => {
        if (ws.userId) {
          ws.isAlive = true;
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          connectedUsers.delete(ws.userId);
          console.log(`User ${ws.userId} disconnected from WebSocket`);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (ws.userId) {
          connectedUsers.delete(ws.userId);
        }
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close();
    }
  });

  // Ping clients every 30 seconds to keep connections alive
  const interval = setInterval(() => {
    for (const [userId, ws] of connectedUsers.entries()) {
      if (!ws.isAlive) {
        connectedUsers.delete(userId);
        ws.terminate();
        continue;
      }

      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

// Send message to specific user
export function sendMessageToUser(userId: string, message: any) {
  const ws = connectedUsers.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log(`Message sent to user ${userId}:`, message.type);
    return true;
  }
  console.log(`User ${userId} not connected via WebSocket`);
  return false;
}

// Send message to all connected users
export function broadcastMessage(message: any) {
  let sentCount = 0;
  for (const [userId, ws] of connectedUsers.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      sentCount++;
    }
  }
  console.log(`Broadcast message sent to ${sentCount} users`);
  return sentCount;
}

// Get connected users
export function getConnectedUsers(): string[] {
  return Array.from(connectedUsers.keys());
}