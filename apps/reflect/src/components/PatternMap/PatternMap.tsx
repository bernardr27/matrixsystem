'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './PatternMap.module.css';

interface Pattern {
  id: string;
  session_id: string;
  pattern_type: string;
  pattern_name: string;
  confidence: number;
  created_at: string;
}

interface Session {
  id: string;
  question: string;
  created_at: string;
  mode?: string;
}

interface Node {
  id: string;
  label: string;
  type: 'session' | 'pattern';
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
}

export default function PatternMap() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch recent sessions
      const sessionsRes = await fetch('/api/sessions');
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions.slice(0, 20)); // Last 20 sessions from the .sessions array
      }

      // Fetch patterns from Supabase
      const patternsRes = await fetch('/api/patterns');
      if (patternsRes.ok) {
        const patternsData = await patternsRes.json();
        setPatterns(patternsData);
      }
    } catch (error) {
      console.error('Failed to fetch pattern data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pattern map...</div>
      </div>
    );
  }

  // Build graph data
  const { nodes, edges } = buildGraph(sessions, patterns);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Pattern Connections</h2>
        <p>Visual map of cognitive patterns across your reflections</p>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.sessionDot}`}></div>
          <span>Session</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.patternDot}`}></div>
          <span>Pattern</span>
        </div>
      </div>

      <svg className={styles.graph} viewBox="0 0 800 600">
        {/* Draw edges first (so they appear behind nodes) */}
        {edges.map((edge, i) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={i}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              className={styles.edge}
            />
          );
        })}

        {/* Draw nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.type === 'session' ? 8 : 12}
              className={node.type === 'session' ? styles.sessionNode : styles.patternNode}
            />
            <text
              x={node.x}
              y={node.y - 15}
              className={styles.nodeLabel}
              textAnchor="middle"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {patterns.length === 0 && (
        <div className={styles.empty}>
          <p>No patterns detected yet.</p>
          <p>Complete more reflections to see pattern connections.</p>
        </div>
      )}

      <div className={styles.patternList}>
        <h3>Detected Patterns</h3>
        {groupPatternsByType(patterns).map(group => (
          <div key={group.type} className={styles.patternGroup}>
            <div className={styles.patternHeader}>
              <strong>{group.name}</strong>
              <span className={styles.patternCount}>{group.count}×</span>
            </div>
            <div className={styles.patternSessions}>
              {group.sessions.map(sessionId => {
                const session = sessions.find(s => s.id === sessionId);
                return session ? (
                  <Link key={sessionId} href={`/journal#${sessionId}`} className={styles.sessionLink}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildGraph(sessions: Session[], patterns: Pattern[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Group patterns by type
  const patternsByType = new Map<string, Pattern[]>();
  patterns.forEach(pattern => {
    if (!patternsByType.has(pattern.pattern_type)) {
      patternsByType.set(pattern.pattern_type, []);
    }
    patternsByType.get(pattern.pattern_type)!.push(pattern);
  });

  // Create pattern nodes (center)
  const patternTypes = Array.from(patternsByType.keys());
  const centerX = 400;
  const centerY = 300;
  const patternRadius = 120;

  patternTypes.forEach((type, i) => {
    const angle = (i / patternTypes.length) * 2 * Math.PI;
    const x = Number((centerX + Math.cos(angle) * patternRadius).toFixed(2));
    const y = Number((centerY + Math.sin(angle) * patternRadius).toFixed(2));

    const patternsOfType = patternsByType.get(type)!;
    nodes.push({
      id: `pattern-${type}`,
      label: patternsOfType[0].pattern_name,
      type: 'pattern',
      x,
      y
    });

    // Create session nodes (around patterns)
    const sessionIds = [...new Set(patternsOfType.map(p => p.session_id))];
    const sessionRadius = 80;

    sessionIds.forEach((sessionId, j) => {
      const sessionAngle = angle + (j / sessionIds.length) * Math.PI / 2 - Math.PI / 4;
      const sx = Number((x + Math.cos(sessionAngle) * sessionRadius).toFixed(2));
      const sy = Number((y + Math.sin(sessionAngle) * sessionRadius).toFixed(2));

      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        nodes.push({
          id: `session-${sessionId}`,
          label: new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          type: 'session',
          x: sx,
          y: sy
        });

        // Create edge
        edges.push({
          from: `pattern-${type}`,
          to: `session-${sessionId}`
        });
      }
    });
  });

  return { nodes, edges };
}

function groupPatternsByType(patterns: Pattern[]): Array<{
  type: string;
  name: string;
  count: number;
  sessions: string[];
}> {
  const groups = new Map<string, { name: string; sessions: Set<string> }>();

  patterns.forEach(pattern => {
    if (!groups.has(pattern.pattern_type)) {
      groups.set(pattern.pattern_type, {
        name: pattern.pattern_name,
        sessions: new Set()
      });
    }
    groups.get(pattern.pattern_type)!.sessions.add(pattern.session_id);
  });

  return Array.from(groups.entries())
    .map(([type, data]) => ({
      type,
      name: data.name,
      count: data.sessions.size,
      sessions: Array.from(data.sessions)
    }))
    .sort((a, b) => b.count - a.count);
}
