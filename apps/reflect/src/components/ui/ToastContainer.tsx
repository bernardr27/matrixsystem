'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Toast } from '@/context/NotificationContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useNotifications();

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            pointerEvents: 'none'
        }}>
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, x: 20, filter: 'blur(5px)' }}
                        style={{
                            background: 'rgba(15, 15, 15, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : toast.type === 'alert' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                            padding: '1rem 1.6rem',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            minWidth: '240px',
                            pointerEvents: 'auto'
                        }}
                        onClick={() => removeToast(toast.id)}
                    >
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: toast.type === 'success' ? '#4ade80' : toast.type === 'alert' ? '#f87171' : '#60a5fa',
                            boxShadow: `0 0 10px ${toast.type === 'success' ? '#4ade80' : toast.type === 'alert' ? '#f87171' : '#60a5fa'}`
                        }} />
                        {toast.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
