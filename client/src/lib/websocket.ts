import { globalEventBus } from './queryClient';

// WebSocket connection
let socket: WebSocket | null = null;

// Function to initialize the WebSocket connection
export function initWebSocket(): WebSocket | null {
  // Close existing socket if it exists
  if (socket) {
    socket.close();
  }
  
  // Determine the WebSocket URL based on the current host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use port 5001 for our custom WebSocket server
  const host = window.location.hostname;
  const wsUrl = `${protocol}//${host}:5001`;
  
  try {
    // Create new WebSocket connection
    socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      // Try to reconnect after 3 seconds
      setTimeout(initWebSocket, 3000);
    });
    
    // Connection error - use a more graceful error handling approach
    socket.addEventListener('error', () => {
      console.log('WebSocket connection error - will attempt reconnect');
      // Don't try to reconnect too aggressively - wait 5 seconds
      setTimeout(initWebSocket, 5000);
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
    
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    // Try again after 5 seconds
    setTimeout(initWebSocket, 5000);
    return null;
  }
  
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
export function sendWebSocketMessage(type: string, data: any): void {
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