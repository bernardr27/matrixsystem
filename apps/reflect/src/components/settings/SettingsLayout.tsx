'use client';

import React from 'react';
import Image from 'next/image';
import styles from './settings.module.css';
import { motion } from 'framer-motion';

interface SettingsLayoutProps {
    children: React.ReactNode;
    userName: string;
    tier: string;
    avatarUrl?: string;
}

export default function SettingsLayout({ children, userName, tier, avatarUrl }: SettingsLayoutProps) {
    return (
        <main className={styles.container}>
            <div className={styles.inner}>
                {/* Neural Identity Hero */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.hero}
                >
                    <div className={styles.avatarContainer}>
                        <Image
                            src="/reflect_logo_v4.png" // Fallback to logo for premium feel
                            alt="Identity"
                            width={128}
                            height={128}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.8)' }}
                        />
                    </div>
                    <div className={styles.identityMeta}>
                        <div className={styles.userTier}>
                            <div className={styles.tierDot} />
                            {tier} PROXIMITY
                        </div>
                        <h1 className={styles.userName}>{userName}</h1>
                    </div>
                </motion.section>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </main>
    );
}
