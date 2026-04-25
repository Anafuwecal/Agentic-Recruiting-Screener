import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;
const clients = new Set<WebSocket>();

export function initWebSocket(port: number) {
  wss = new WebSocketServer({ port });
  
  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WS] Client disconnected');
    });
  });
  
  console.log(`[WS] WebSocket server running on port ${port}`);
}

export function broadcastToEmployer(event: string, data: any) {
  const message = JSON.stringify({ event, data });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}