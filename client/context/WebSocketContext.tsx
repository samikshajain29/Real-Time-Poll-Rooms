"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

const WEBSOCKET_URL = "wss://real-time-poll-rooms-server.onrender.com";

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: MessageEvent | null;
  sendMessage: (message: object) => void;
  userId: string;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const userId = React.useMemo(() => {
    if (typeof window !== "undefined") {
      let storedUserId = localStorage.getItem("poll_user_id");
      if (!storedUserId) {
        storedUserId =
          "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("poll_user_id", storedUserId);
      }
      return storedUserId;
    }
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }, []);

  const connect = useCallback(() => {
    if (
      ws.current?.readyState === WebSocket.OPEN ||
      ws.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    console.log("Connecting to WebSocket...");
    const socket = new WebSocket(WEBSOCKET_URL);
    ws.current = socket;

    socket.onopen = () => {
      console.log(" WebSocket connected");
      setIsConnected(true);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    socket.onclose = (event) => {
      console.log(" WebSocket closed", event.code, event.reason);
      setIsConnected(false);
      ws.current = null;

      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          console.log("Reconnecting...");
          reconnectTimeout.current = null;
          connect();
        }, 3000);
      }
    };

    socket.onerror = (err) => {
      console.error(" WebSocket error:", err);
      socket.close();
    };

    socket.onmessage = (event) => setLastMessage(event);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error(
        "WebSocket is not connected. Message queued or dropped:",
        message,
      );
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ isConnected, lastMessage, sendMessage, userId }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a WebSocketProvider");
  }
  return context;
}
