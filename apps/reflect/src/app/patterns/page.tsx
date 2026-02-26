'use client';

import React from 'react';
import PatternsClient from '@/components/patterns/PatternsClient';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

export default function CognitiveArchetypes() {
  return (
    <StandardPageLayout title="Cognitive Patterns">
      <PatternsClient />
    </StandardPageLayout>
  );
}
