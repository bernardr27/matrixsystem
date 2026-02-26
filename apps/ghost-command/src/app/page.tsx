'use client';

import { useState, useCallback } from 'react';
import { GlobalNeuralErrorBoundary } from '@/components/debug/GlobalNeuralErrorBoundary';
import IndustrialConsole from '@/components/console/IndustrialConsole';
import { GhostBootScreen } from '@/components/boot/GhostBootScreen';

export default function Home() {
  const [booted, setBooted] = useState(false);
  const handleBootComplete = useCallback(() => setBooted(true), []);

  return (
    <GlobalNeuralErrorBoundary>
      {!booted && <GhostBootScreen onComplete={handleBootComplete} />}
      <IndustrialConsole />
    </GlobalNeuralErrorBoundary>
  );
}
