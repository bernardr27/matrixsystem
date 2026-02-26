'use client';

import React from 'react';
import { IntegrationHub } from '@/components/integrations/IntegrationHub';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function IntegrationsPage() {
    return (
        <main className="min-h-screen bg-black text-white pt-12 pb-32 px-4 sm:px-8 relative overflow-hidden font-mono selection:bg-cyan-500/20">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-cyan-500/[0.03] blur-[150px] -z-10 rounded-full" />

            <div className="relative z-10 max-w-7xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="relative pt-12">
                    <div className="flex items-center gap-5">
                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.1, x: -5 }}
                                className="p-4 rounded-[2rem] bg-white/[0.03] border border-white/10 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-2xl backdrop-blur-md"
                            >
                                <ArrowLeft size={24} />
                            </motion.button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-white drop-shadow-2xl break-all sm:break-normal">Neural_Extensions</h1>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5 italic opacity-80 pl-1">Integration_Management_Console v4.3 [AUTHORIZED]</p>
                        </div>
                    </div>
                </div>

                {/* Main Hub */}
                <NeuralSurface
                    variant="glass"
                    className="p-1 rounded-[3rem] border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden"
                >
                    <IntegrationHub />
                </NeuralSurface>
            </div>
        </main>
    );
}
