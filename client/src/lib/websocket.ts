import { globalEventBus } from './queryClient';

// WebSocket connection
let socket: WebSocket | null = null;

// Function to initialize the WebSocket connection
export function initWebSocket() {
  // Close existing socket if it exists
  if (socket) {
    socket.close();
  }
  
  // Determine the WebSocket URL based on the current host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use port 5001 for our custom WebSocket server
  const host = window.location.hostname;
  const wsUrl = `${protocol}//${host}:5001`;
  
  // Create new WebSocket connection
  socket = new WebSocket(wsUrl);
  
  // Connection opened
  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection established');
  });
  
  // Connection closed
  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
    // Try to reconnect after 3 seconds
    setTimeout(initWebSocket, 3000);
  });
  
  // Connection error
  socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
  });
  
  // Listen for messages
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Dispatch events to the event bus based on message type
      if (data.type === 'points-updated') {
        console.log('WebSocket points updated event received:', data);
        globalEventBus.publish('points-updated');
        
        // Also invalidate specific student queries if student ID is provided
        if (data.data && data.data.studentId) {
          globalEventBus.publish(`student-${data.data.studentId}-updated`);
        }
      } else if (data.type === 'pod-updated') {
        console.log('WebSocket pod updated event received:', data);
        globalEventBus.publish('pod-updated');
      } else if (data.type === 'class-updated') {
        console.log('WebSocket class updated event received:', data);
        globalEventBus.publish('class-updated');
      } else if (data.type === 'house-updated') {
        console.log('WebSocket house updated event received:', data);
        globalEventBus.publish('house-updated');
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  return socket;
}

// Get the current WebSocket connection or initialize if not exists
export function getWebSocket(): WebSocket {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    initWebSocket();
  }
  return socket!;
}

// Send message to the server
export function sendWebSocketMessage(type: string, data: any) {
  const ws = getWebSocket();
  
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    }));
  } else {
    console.warn('WebSocket is not connected. Message not sent:', { type, data });
  }
}