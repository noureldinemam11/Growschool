import { Server } from 'http';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { log } from './vite';

let wss: WebSocketServer | null = null;

// Initialize WebSocket server
export function initWebSocket(server: Server) {
  // Create WebSocket server on a separate port to avoid conflicts with Vite's WebSocket
  wss = new WebSocketServer({ port: 5001 });
  
  wss.on('connection', (ws: WSWebSocket) => {
    log('WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connection',
      message: 'Connected to school behavior management system'
    }));
    
    // Use the ws .on method for events
    ws.addEventListener('message', (event) => {
      log(`Received WebSocket message: ${event.data}`);
    });
    
    ws.addEventListener('close', () => {
      log('WebSocket client disconnected');
    });
  });
  
  log('WebSocket server initialized');
  return wss;
}

// Broadcast an event to all connected clients
export function broadcastEvent(eventType: string, data: any) {
  if (!wss) {
    log('WebSocket server not initialized');
    return;
  }
  
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
  
  log(`Broadcasting event: ${eventType}`);
  
  wss.clients.forEach((client: WSWebSocket) => {
    if (client.readyState === WSWebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Event types
export const EventTypes = {
  POINTS_UPDATED: 'points-updated',
  POD_UPDATED: 'pod-updated',
  CLASS_UPDATED: 'class-updated',
  HOUSE_UPDATED: 'house-updated'
};