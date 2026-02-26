'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'achievement' | 'system' | 'trash' | 'success' | 'alert';
    timestamp: number;
    read: boolean;
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'alert' | 'info';
}

interface NotificationContextType {
    notifications: Notification[];
    toasts: Toast[];
    unreadCount: number;
    trashCount: number;
    addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    addToast: (message: string, type?: 'success' | 'alert' | 'info') => void;
    removeToast: (id: string) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    deleteNotification: (id: string) => void;
    incrementTrash: () => void;
    emptyTrash: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [trashCount, setTrashCount] = useState(0);
    const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Cleanup all toast timeouts on unmount
    useEffect(() => {
        const timeouts = toastTimeoutsRef.current;
        return () => {
            timeouts.forEach(t => clearTimeout(t));
            timeouts.clear();
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotif: Notification = {
            ...notif,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const existing = toastTimeoutsRef.current.get(id);
        if (existing) {
            clearTimeout(existing);
            toastTimeoutsRef.current.delete(id);
        }
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'alert' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        const timeout = setTimeout(() => removeToast(id), 5000);
        toastTimeoutsRef.current.set(id, timeout);
    }, [removeToast]);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const deleteNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const incrementTrash = useCallback(() => setTrashCount(prev => prev + 1), []);
    const emptyTrash = useCallback(() => setTrashCount(0), []);

    // Initial Welcome Notification
    useEffect(() => {
        if (notifications.length === 0) {
            addNotification({
                title: 'NEURAL_SYSTEM_ACTIVE',
                message: 'Your reflective interface is now synchronized.',
                type: 'system'
            });
        }
    }, [addNotification, notifications.length]);

    const contextValue = useMemo(() => ({
        notifications,
        toasts,
        unreadCount,
        trashCount,
        addNotification,
        addToast,
        removeToast,
        markAsRead,
        clearAll,
        deleteNotification,
        incrementTrash,
        emptyTrash
    }), [notifications, toasts, unreadCount, trashCount, addNotification, addToast, removeToast, markAsRead, clearAll, deleteNotification, incrementTrash, emptyTrash]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
