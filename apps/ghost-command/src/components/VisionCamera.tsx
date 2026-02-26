'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useSage } from '@/context/SageContext';
import { useSensory } from '@/hooks/useSensory';
import { cn } from '@/lib/utils';

export const VisionCamera: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const { sendCommand } = useSage();
    const sensory = useSensory();

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);
        setStatus('idle');
        sensory.pulse();

        try {
            // SPATIAL PULSE: Immediate haptic feedback
            sensory.pulse();

            const fileName = `vision/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage
                .from('ghost-storage')
                .upload(fileName, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('ghost-storage')
                .getPublicUrl(fileName);

            // SYNERGY UPLINK: Notify Hive of spatial event
            await supabase.from('sentinel_logs').insert([{
                service: 'ghost-vision',
                level: 'info',
                message: `Spatial Uplink Initiated: ${file.name}`,
                metadata: { type: 'spatial_uplink', multi_frame: true }
            }]);

            sensory.success();
            setStatus('success');

            await sendCommand(`sage:see ${urlData.publicUrl}|Describe what you see in this image in high fidelity.`);

            setTimeout(() => {
                setPreview(null);
                setStatus('idle');
            }, 8000);

        } catch (err) {
            console.error('Vision Upload Failed:', err);
            sensory.error();
            setStatus('error');
            setTimeout(() => {
                setPreview(null);
                setStatus('idle');
            }, 4000);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative group">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleCapture}
            />

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-[#050505] relative overflow-hidden",
                    status === 'error' ? "border border-rose-500/40 text-rose-400" :
                        status === 'success' ? "border border-emerald-500/40 text-emerald-400" :
                            "border border-white/10 text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-500/40 shadow-2xl"
                )}
            >
                <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />

                <AnimatePresence mode="wait">
                    {preview ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={preview}
                                alt="Vision"
                                width={96}
                                height={96}
                                className={cn("w-full h-full object-cover", uploading && "opacity-40 animate-pulse")}
                                loader={({ src }) => src}
                                unoptimized
                            />
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 size={20} className="animate-spin text-cyan-400" />
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="icon"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative z-10"
                        >
                            <Camera size={20} className={status === 'idle' ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" : ""} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* INDUSTRIAL STATUS PIP */}
                {status !== 'idle' && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                            "absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-black z-20 shadow-lg",
                            status === 'success' ? "bg-emerald-500" : "bg-rose-500"
                        )}
                    />
                )}
            </motion.button>

            {/* FLOATING STATUS LABEL (DESKTOP) */}
            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-950 border border-white/5 rounded-lg whitespace-nowrap hidden sm:flex items-center gap-2 shadow-2xl z-[110]"
                    >
                        {status === 'success' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <AlertCircle size={10} className="text-rose-500" />}
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/60">
                            {status === 'success' ? "Uplink_Active" : "Fault_Detected"}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
