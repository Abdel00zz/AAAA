

import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Fix: Add 'warning' to NotificationType to support warning notifications.
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    addNotification: (message: string, type?: NotificationType) => void;
    notifications: Notification[];
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((message: string, type: NotificationType = 'success') => {
        const id = uuidv4();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeNotification(id);
        }, 4000);
    }, [removeNotification]);

    return (
        <NotificationContext.Provider value={{ addNotification, notifications, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};