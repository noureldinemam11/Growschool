import { Server } from 'http';
import WebSocket from 'ws';
import { log } from './vite';

let wss: WebSocket.Server | null = null;

// Initialize WebSocket server
export function initWebSocket(server: Server) {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    log('WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connection',
      message: 'Connected to school behavior management system'
    }));
    
    ws.on('message', (message) => {
      log(`Received WebSocket message: ${message}`);
    });
    
    ws.on('close', () => {
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
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
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