'use client';

import AuthForm from '@/components/AuthForm';
import { CognitiveGateway } from '@/components/ui/CognitiveGateway';
import { motion } from 'framer-motion';

export default function LoginPage() {
    return (
        <CognitiveGateway
            phase="authenticating"
            title="Welcome Home"
            description="Re-establish your neural uplink to continue your journey."
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full flex flex-col gap-6"
            >
                <AuthForm />
                
                {/* Footer Message */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-xs text-white/30 tracking-wide"
                >
                    Your data is locally-encrypted and architecturally secure.
                </motion.p>
            </motion.div>
        </CognitiveGateway>
    );
}
