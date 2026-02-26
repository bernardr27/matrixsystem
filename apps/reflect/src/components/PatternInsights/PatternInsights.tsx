'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './PatternInsights.module.css';

interface PatternInsightsProps {
  sessionId?: string;
  text?: string;
}

interface DetectedPattern {
  id: string;
  name: string;
  description: string;
  confidence: number;
  evidence: string[];
}

export default function PatternInsights({ sessionId, text }: PatternInsightsProps) {
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [loading, setLoading] = useState(false);

  const detectPatterns = useCallback(async (content: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/patterns/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, sessionId })
      });

      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error('Pattern detection failed:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (text && text.length > 20) {
      detectPatterns(text);
    }
  }, [text, detectPatterns]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>Analyzing your thinking patterns...</span>
        </div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return null;
  }

  // Sort patterns by confidence, show top 2 most relevant
  const topPatterns = patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>🧠</span>
        <h3>Thinking Patterns Detected</h3>
        <span className={styles.subtitle}>
          These patterns often show up in your reflections
        </span>
      </div>

      <div className={styles.patterns}>
        {topPatterns.map((pattern, index) => (
          <div key={pattern.id} className={`${styles.pattern} ${styles[`pattern${index + 1}`]}`}>
            <div className={styles.patternHeader}>
              <div className={styles.patternMeta}>
                <span className={styles.patternName}>{pattern.name}</span>
                <div className={styles.confidenceBar}>
                  <div
                    className={styles.confidenceFill}
                    style={{ width: `${pattern.confidence * 100}%` }}
                  ></div>
                </div>
                <span className={styles.confidenceText}>
                  {Math.round(pattern.confidence * 100)}% match
                </span>
              </div>
              <div className={styles.patternIcon}>
                {getPatternIcon(pattern.name)}
              </div>
            </div>

            <p className={styles.description}>{pattern.description}</p>

            {pattern.evidence.length > 0 && (
              <div className={styles.evidence}>
                <span className={styles.evidenceLabel}>Found in your words:</span>
                <div className={styles.keywords}>
                  {pattern.evidence.slice(0, 3).map((word, i) => (
                    <span key={i} className={styles.keyword}>
                      "{word}"
                    </span>
                  ))}
                  {pattern.evidence.length > 3 && (
                    <span className={styles.moreKeywords}>
                      +{pattern.evidence.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className={styles.suggestion}>
              <span className={styles.suggestionLabel}>Try asking:</span>
              <span className={styles.suggestionText}>
                {getPatternSuggestion(pattern.name)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Link href="/patterns" className={styles.viewAll}>
          <span>See full pattern map</span>
          <span className={styles.arrow}>→</span>
        </Link>
        <Link href="/sage" className={styles.talkToSage}>
          <span>Talk to Sage about this</span>
          <span className={styles.arrow}>💬</span>
        </Link>
      </div>
    </div>
  );
}

function getPatternIcon(patternName: string): string {
  const icons: Record<string, string> = {
    'Catastrophizing': '🌩️',
    'All-or-Nothing Thinking': '⚫',
    'Overgeneralization': '🔍',
    'Mind Reading': '🧠',
    'Fortune Telling': '🔮',
    'Should Statements': '📜',
    'Personalization': '👤',
    'Emotional Reasoning': '💭',
    'Mental Filter': '🔎',
    'Discounting Positives': '👎'
  };

  return icons[patternName] || '🧠';
}

function getPatternSuggestion(patternName: string): string {
  const suggestions: Record<string, string> = {
    'Catastrophizing': '"What\'s one neutral outcome that could happen?"',
    'All-or-Nothing Thinking': '"Where\'s the middle ground here?"',
    'Overgeneralization': '"Is this always true, or just sometimes?"',
    'Mind Reading': '"What do I actually know vs. what am I assuming?"',
    'Fortune Telling': '"What\'s one alternative future I haven\'t considered?"',
    'Should Statements': '"What do I actually want, separate from expectations?"',
    'Personalization': '"What other factors might be at play?"',
    'Emotional Reasoning': '"What facts exist independent of how I feel?"',
    'Mental Filter': '"What positives am I overlooking?"',
    'Discounting Positives': '"How did I contribute to this success?"'
  };

  return suggestions[patternName] || '"What\'s another way to look at this?"';
}
