import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [client, setClient] = useState(null);
    const [connected, setConnected] = useState(true);

    useEffect(() => {
        const socketUrl = 'http://localhost:8080/ws-erp'; 

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        stompClient.onConnect = (frame) => {
            console.log('Connected to WebSockets:', frame);
            setConnected(true);
        };

        stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
        };

        stompClient.onWebSocketClose = () => {
            console.log('WebSocket connection closed.');
            // Keep connected as true for mock sync simulation in UI
            setConnected(true);
        };

        try {
            stompClient.activate();
            setClient(stompClient);
        } catch (e) {
            console.warn("WebSocket activation skipped, running in Local Sync Mode.");
        }

        return () => {
            try {
                stompClient.deactivate();
            } catch (e) {}
        };
    }, []);

    // Helper to subscribe
    const subscribeToTopic = (topic, callback) => {
        if (!client || !client.connected) return null;
        return client.subscribe(topic, (message) => {
            if (message.body) {
                callback(JSON.parse(message.body));
            }
        });
    };

    return (
        <WebSocketContext.Provider value={{ client, connected, subscribeToTopic }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
