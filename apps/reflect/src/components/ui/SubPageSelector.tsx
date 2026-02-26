'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface SubPageTab {
    id: string;
    label: string;
    icon?: string;
}

interface SubPageSelectorProps {
    tabs: SubPageTab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    accentColor?: string;
}

export default function SubPageSelector({
    tabs,
    activeTab,
    onTabChange,
    accentColor = 'var(--accent)'
}: SubPageSelectorProps) {
    return (
        <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '0.5rem',
            width: '100%',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            position: 'sticky',
            top: 'calc(var(--header-height) + 1rem)',
            zIndex: 800,
            background: 'var(--background)'
        }}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.3)',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        letterSpacing: '0.2em',
                        padding: '0.8rem 0',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'color 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {tab.icon && <span style={{ fontSize: '0.9rem', opacity: activeTab === tab.id ? 1 : 0.5 }}>{tab.icon}</span>}
                    <span>{tab.label.toUpperCase()}</span>

                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="subTabIndicator"
                            style={{
                                position: 'absolute',
                                bottom: '-0.5rem',
                                left: 0,
                                right: 0,
                                height: '2px',
                                background: accentColor,
                                boxShadow: `0 0 10px ${accentColor}40`
                            }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
