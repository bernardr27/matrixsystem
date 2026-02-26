'use client';

import { useEffect, useState } from 'react';
import { apiCache } from '@/lib/cache';
import styles from './PersonalizedPrompts.module.css';

interface PersonalizedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  currentMode?: string;
}

interface PromptData {
  prompt: string;
  context: {
    topPatterns: string[];
    recentModes: string[];
  };
}

export default function PersonalizedPrompts({ onSelectPrompt, currentMode }: PersonalizedPromptsProps) {
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalizedPrompt();
  }, []);

  async function fetchPersonalizedPrompt() {
    setLoading(true);
    setError(null);

    // Check cache first (cache for 10 minutes)
    const cacheKey = 'personalized-prompt';
    const cached = apiCache.get(cacheKey);
    if (cached) {
      setPromptData(cached);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/prompts/personalized');

      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in, don't show error
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch prompt');
      }

      const data = await response.json();
      setPromptData(data);

      // Cache the result
      apiCache.set(cacheKey, data, 10 * 60 * 1000); // 10 minutes
    } catch (err) {
      console.error('Personalized prompt error:', err);
      setError('Could not load personalized prompt');
    } finally {
      setLoading(false);
    }
  }

  async function refreshPrompt() {
    await fetchPersonalizedPrompt();
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Crafting your prompt...</span>
        </div>
      </div>
    );
  }

  if (error || !promptData) {
    return null; // Silently hide if error or no data
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>✨</span>
          <span className={styles.badgeText}>Personalized for you</span>
        </div>
        {promptData.context.topPatterns.length > 0 && (
          <div className={styles.context}>
            Based on your {promptData.context.topPatterns[0].toLowerCase()} patterns
          </div>
        )}
      </div>

      <div className={styles.promptCard}>
        <p className={styles.promptText}>{promptData.prompt}</p>
        
        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={() => onSelectPrompt(promptData.prompt)}
          >
            Use this prompt
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={refreshPrompt}
          >
            🔄 Generate another
          </button>
        </div>
      </div>

      {promptData.context.topPatterns.length > 0 && (
        <div className={styles.insights}>
          <div className={styles.insightsLabel}>Your recent patterns:</div>
          <div className={styles.patternTags}>
            {promptData.context.topPatterns.slice(0, 3).map((pattern, i) => (
              <span key={i} className={styles.patternTag}>
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
