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
  // For Replit environment, we need to use the same hostname but with the proper port
  const host = window.location.hostname;
  
  // On Replit, use the main domain with the special WebSocket path
  // This is more reliable than trying to use a separate port which may be blocked
  const wsUrl = `${protocol}//${host}/ws`;
  
  try {
    // Create new WebSocket connection
    socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      // Publish an event when WebSocket connects/reconnects
      globalEventBus.publish('websocket-connected');
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
    
    // Listen for messages with debouncing to prevent excessive updates
    let debounceTimers: Record<string, number> = {};
    
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.type;
        
        // Skip processing if no valid event type
        if (!eventType) return;
        
        // Clear any pending timers for this event type
        if (debounceTimers[eventType]) {
          clearTimeout(debounceTimers[eventType]);
        }
        
        // Set a debounce timer for this event type (100ms)
        debounceTimers[eventType] = window.setTimeout(() => {
          console.log(`WebSocket ${eventType} event received`);
          
          // Dispatch events to the event bus based on message type
          globalEventBus.publish(eventType);
          
          // Also invalidate specific student queries if student ID is provided
          if (data.data && data.data.studentId && eventType === 'points-updated') {
            globalEventBus.publish(`student-${data.data.studentId}-updated`);
          }
          
          // Clear the timer reference
          delete debounceTimers[eventType];
        }, 100);
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