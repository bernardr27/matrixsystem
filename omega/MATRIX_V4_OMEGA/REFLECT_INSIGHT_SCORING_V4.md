# ████████████████████████████████████████████████████
# REFLECT INSIGHT SCORING ENGINE — V4 OMEGA
# Module: REFLECT | Depends on: CONSTITUTION §6.2
# ████████████████████████████████████████████████████

> "An insight that cannot be proven is a guess. A guess presented as truth is a lie."

---

## OVERVIEW

REFLECT is the **human intelligence engine** of MATRIX. It transforms raw journal entries, behavioral patterns, and emotional signals into structured, evidence-backed insights that evolve like genuine human understanding.

V4 OMEGA introduces:
- **Dimensional Insight Vectors** — insights encoded in 8 dimensions, not just sentiment
- **Evidence Graph** — all insights linked to source data
- **Temporal Decay Functions** — three decay models, not just linear
- **Contradiction Resolution** — what happens when new evidence conflicts with established insights
- **Insight Lifecycle States** — from candidate to confirmed to archived
- **Cross-Dimensional Correlation** — insights that span multiple life areas
- **Adaptive Scoring Weights** — the system learns what matters to each user

---

## PART 1 — THE INSIGHT DATA MODEL

### 1.1 — Insight Structure

```typescript
interface Insight {
  // Identity
  id: string;                          // UUID v4
  version: number;                     // Increments on each update
  createdAt: number;                   // Unix ms
  updatedAt: number;                   // Unix ms
  
  // Content
  claim: string;                       // Human-readable statement
  claimVector: InsightVector;          // Machine-readable encoding
  
  // Evidence
  evidence: EvidenceNode[];            // All supporting data points
  evidenceGraph: EvidenceGraph;        // Relationships between evidence
  contradictions: Contradiction[];     // Conflicting evidence
  
  // Scoring
  score: InsightScore;                 // Current scored state
  scoreHistory: ScoredSnapshot[];      // Score over time
  
  // Lifecycle
  state: InsightLifecycleState;
  lifecycle: LifecycleTransition[];
  
  // Classification
  dimensions: DimensionalTag[];        // Which life areas this touches
  tags: string[];                      // Free-form semantic tags
  
  // User Relationship
  userValidations: UserValidation[];   // Explicit user feedback
  userContext: UserContextSnapshot;    // User state when insight was formed
}

type InsightLifecycleState =
  | 'CANDIDATE'      // Just created, not yet confirmed
  | 'EMERGING'       // 2+ evidence points, pending validation
  | 'CONFIRMED'      // User validated OR high-confidence auto-confirm
  | 'REINFORCED'     // Multiple validations, high confidence
  | 'CHALLENGED'     // New contradictory evidence found
  | 'REVISED'        // Updated after contradiction resolved
  | 'FADING'         // Low evidence density recently
  | 'DORMANT'        // Inactive but preserved
  | 'ARCHIVED'       // Long-term archive, very low decay
  | 'INVALIDATED';   // Evidence conclusively disproved
```

### 1.2 — The 8-Dimensional Insight Vector

```typescript
interface InsightVector {
  // Dimension 1: Emotional Valence (-1.0 to +1.0)
  // -1 = deeply negative, 0 = neutral, +1 = deeply positive
  emotionalValence: number;
  
  // Dimension 2: Behavioral Consistency (0.0 to 1.0)
  // How consistently this pattern appears across contexts
  behavioralConsistency: number;
  
  // Dimension 3: Temporal Stability (0.0 to 1.0)
  // How stable this pattern is over time
  temporalStability: number;
  
  // Dimension 4: Context Specificity (0.0 to 1.0)
  // 0 = universal (appears everywhere), 1 = highly specific to one context
  contextSpecificity: number;
  
  // Dimension 5: User Agency (-1.0 to +1.0)
  // -1 = fully reactive (external forces), +1 = fully proactive (user-driven)
  userAgency: number;
  
  // Dimension 6: Growth Orientation (-1.0 to +1.0)
  // -1 = regressive pattern, +1 = growth-oriented pattern
  growthOrientation: number;
  
  // Dimension 7: Relationship Index (-1.0 to +1.0)
  // -1 = isolating, +1 = relationship-building
  relationshipIndex: number;
  
  // Dimension 8: Authenticity Score (0.0 to 1.0)
  // How consistent this is with stated values vs. actual behavior
  authenticityScore: number;
}

// Vector distance function for finding similar insights
function vectorDistance(a: InsightVector, b: InsightVector): number {
  const dims: (keyof InsightVector)[] = [
    'emotionalValence', 'behavioralConsistency', 'temporalStability',
    'contextSpecificity', 'userAgency', 'growthOrientation',
    'relationshipIndex', 'authenticityScore',
  ];

  const sumSquares = dims.reduce((acc, dim) => {
    return acc + Math.pow(a[dim] - b[dim], 2);
  }, 0);

  return Math.sqrt(sumSquares / dims.length); // Normalized Euclidean distance
}
```

### 1.3 — Evidence Node

```typescript
interface EvidenceNode {
  id: string;
  type: EvidenceType;
  source: EvidenceSource;
  content: string;               // The raw content
  extractedClaims: string[];     // Parsed claims from content
  timestamp: number;
  weight: number;                // How much this evidence counts (0.0-1.0)
  confidence: number;            // How reliable this source is (0.0-1.0)
  context: EvidenceContext;
}

type EvidenceType =
  | 'JOURNAL_ENTRY'           // Direct journal text
  | 'BEHAVIORAL_OBSERVATION'  // Observed behavioral pattern
  | 'EMOTIONAL_SIGNAL'        // Explicit emotion rating
  | 'FREQUENCY_PATTERN'       // Statistical occurrence pattern
  | 'CROSS_SESSION_PATTERN'   // Pattern across multiple sessions
  | 'USER_STATEMENT'          // Direct user claim
  | 'CONTRADICTION_RESOLVED'  // Previously contradicted but resolved
  | 'EXTERNAL_TRIGGER'        // External event that triggered pattern
  | 'PHYSIOLOGICAL_SIGNAL';   // If device data available (heart rate, etc.)

type EvidenceSource =
  | 'JOURNAL_PIPELINE'
  | 'BEHAVIORAL_TRACKER'
  | 'EMOTION_CLASSIFIER'
  | 'PATTERN_DETECTOR'
  | 'USER_EXPLICIT'
  | 'USER_IMPLICIT'
  | 'CROSS_SESSION_ANALYZER';
```

---

## PART 2 — THE SCORING ENGINE

### 2.1 — Composite Insight Score

```typescript
interface InsightScore {
  // The headline number: 0.0 - 1.0
  composite: number;
  
  // Component scores
  evidenceStrength: number;     // How strong is the evidence?
  recurrenceFrequency: number;  // How often does this pattern occur?
  userValidation: number;       // Has the user confirmed this?
  temporalStability: number;    // Has this held over time?
  contradictionPenalty: number; // How much does counter-evidence hurt?
  contextBreadth: number;       // Across how many contexts does this appear?
  
  // Decay state
  decayedScore: number;         // Score after applying decay function
  lastDecayApplied: number;     // Timestamp of last decay calculation
  decayModel: DecayModel;       // Which model is being applied
  
  // Confidence interval
  confidenceLow: number;        // Lower bound (95% CI)
  confidenceHigh: number;       // Upper bound (95% CI)
  sampleSize: number;           // Number of evidence points
}

function computeCompositeScore(insight: Insight): InsightScore {
  const evidenceStrength = computeEvidenceStrength(insight.evidence, insight.contradictions);
  const recurrenceFrequency = computeRecurrenceFrequency(insight.evidence);
  const userValidation = computeUserValidationScore(insight.userValidations);
  const temporalStability = computeTemporalStability(insight.scoreHistory);
  const contradictionPenalty = computeContradictionPenalty(insight.contradictions);
  const contextBreadth = computeContextBreadth(insight.evidence);

  // Weighted combination
  const weights = {
    evidenceStrength: 0.30,
    recurrenceFrequency: 0.25,
    userValidation: 0.20,
    temporalStability: 0.15,
    contextBreadth: 0.10,
  };

  const rawComposite =
    evidenceStrength * weights.evidenceStrength +
    recurrenceFrequency * weights.recurrenceFrequency +
    userValidation * weights.userValidation +
    temporalStability * weights.temporalStability +
    contextBreadth * weights.contextBreadth;

  // Apply contradiction penalty (multiplicative)
  const penalizedComposite = rawComposite * (1 - contradictionPenalty);

  // Apply decay
  const decayModel = selectDecayModel(insight);
  const decayedScore = applyDecay(penalizedComposite, insight, decayModel);

  // Compute confidence interval
  const { low, high } = computeConfidenceInterval(decayedScore, insight.evidence.length);

  return {
    composite: penalizedComposite,
    evidenceStrength,
    recurrenceFrequency,
    userValidation,
    temporalStability,
    contradictionPenalty,
    contextBreadth,
    decayedScore,
    lastDecayApplied: Date.now(),
    decayModel,
    confidenceLow: low,
    confidenceHigh: high,
    sampleSize: insight.evidence.length,
  };
}
```

### 2.2 — Evidence Strength Calculation

```typescript
function computeEvidenceStrength(
  evidence: EvidenceNode[],
  contradictions: Contradiction[]
): number {
  if (evidence.length === 0) return 0;

  // Base strength from evidence count (diminishing returns via log)
  const countFactor = Math.log2(evidence.length + 1) / Math.log2(21); // Normalized: 20 evidence = 1.0

  // Weight by evidence type (some types are more reliable)
  const typeWeights: Record<EvidenceType, number> = {
    JOURNAL_ENTRY: 0.8,
    BEHAVIORAL_OBSERVATION: 1.0,
    EMOTIONAL_SIGNAL: 0.7,
    FREQUENCY_PATTERN: 0.9,
    CROSS_SESSION_PATTERN: 0.95,
    USER_STATEMENT: 0.6,          // Users can be unreliable narrators
    CONTRADICTION_RESOLVED: 1.1,  // Survived contradiction = stronger
    EXTERNAL_TRIGGER: 0.5,
    PHYSIOLOGICAL_SIGNAL: 1.0,
  };

  const weightedAvg = evidence.reduce((acc, e) => {
    return acc + (typeWeights[e.type] * e.weight * e.confidence);
  }, 0) / evidence.length;

  // Diversity bonus: evidence from multiple types is stronger
  const uniqueTypes = new Set(evidence.map(e => e.type)).size;
  const diversityBonus = uniqueTypes > 3 ? 1.15 : uniqueTypes > 1 ? 1.05 : 1.0;

  return Math.min(countFactor * weightedAvg * diversityBonus, 1.0);
}
```

### 2.3 — Recurrence Frequency Calculation

```typescript
function computeRecurrenceFrequency(evidence: EvidenceNode[]): number {
  if (evidence.length < 2) return 0;

  const timestamps = evidence.map(e => e.timestamp).sort((a, b) => a - b);
  const now = Date.now();
  const oldest = timestamps[0];
  const span = now - oldest;

  if (span === 0) return 0;

  // Events per week
  const spanWeeks = span / (7 * 24 * 60 * 60 * 1000);
  const eventsPerWeek = evidence.length / spanWeeks;

  // Score: 0.5 events/week = 0.5, 1/week = 0.7, 2/week = 0.85, 3+/week = 1.0
  const frequencyScore = Math.min(Math.log2(eventsPerWeek + 1) / Math.log2(4), 1.0);

  // Recency bonus: recent occurrences matter more
  const daysSinceLast = (now - timestamps[timestamps.length - 1]) / (24 * 60 * 60 * 1000);
  const recencyMultiplier = daysSinceLast < 7 ? 1.0
    : daysSinceLast < 14 ? 0.9
    : daysSinceLast < 30 ? 0.7
    : 0.5;

  // Regularity: evenly-spaced events suggest a true pattern
  const regularityScore = computeRegularity(timestamps);

  return Math.min(frequencyScore * recencyMultiplier * (0.7 + 0.3 * regularityScore), 1.0);
}

function computeRegularity(timestamps: number[]): number {
  if (timestamps.length < 3) return 0.5;

  const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((acc, i) => acc + Math.pow(i - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;

  // Low CV = regular pattern = high score
  return Math.max(0, 1 - coefficientOfVariation);
}
```

### 2.4 — User Validation Scoring

```typescript
interface UserValidation {
  id: string;
  type: ValidationType;
  strength: ValidationStrength;
  timestamp: number;
  context: string;           // What the user was doing when they validated
  override?: {               // If user explicitly corrected the insight
    correction: string;
    reason: string;
  };
}

type ValidationType =
  | 'EXPLICIT_CONFIRM'    // User said "yes, this is accurate"
  | 'EXPLICIT_DENY'       // User said "no, this is wrong"
  | 'ACTED_ON'            // User took action based on this insight
  | 'SAVED'               // User saved/starred this insight
  | 'SHARED'              // User shared this insight
  | 'DISMISSED'           // User dismissed without engaging
  | 'IMPLICIT_CONFIRM'    // User's subsequent behavior confirmed it
  | 'IMPLICIT_DENY';      // User's subsequent behavior contradicted it

type ValidationStrength = 'WEAK' | 'MODERATE' | 'STRONG' | 'DEFINITIVE';

function computeUserValidationScore(validations: UserValidation[]): number {
  if (validations.length === 0) return 0.5; // Neutral — no validation yet

  const typeScores: Record<ValidationType, number> = {
    EXPLICIT_CONFIRM: 0.9,
    EXPLICIT_DENY: -0.9,
    ACTED_ON: 0.8,
    SAVED: 0.6,
    SHARED: 0.5,
    DISMISSED: -0.2,
    IMPLICIT_CONFIRM: 0.4,
    IMPLICIT_DENY: -0.4,
  };

  const strengthMultipliers: Record<ValidationStrength, number> = {
    WEAK: 0.5,
    MODERATE: 0.75,
    STRONG: 0.90,
    DEFINITIVE: 1.0,
  };

  // Weight recent validations more heavily
  const now = Date.now();
  const weightedScore = validations.reduce((acc, v) => {
    const base = typeScores[v.type] * strengthMultipliers[v.strength];
    const ageMs = now - v.timestamp;
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const recencyWeight = Math.exp(-ageDays / 30); // Half-weight at 30 days
    
    return acc + base * recencyWeight;
  }, 0);

  const totalWeight = validations.reduce((acc, v) => {
    const ageMs = now - v.timestamp;
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    return acc + Math.exp(-ageDays / 30);
  }, 0);

  const normalized = weightedScore / Math.max(totalWeight, 1);
  
  // Map from [-1, 1] to [0, 1]
  return (normalized + 1) / 2;
}
```

---

## PART 3 — THE THREE DECAY MODELS

### 3.1 — Decay Model Selection

```typescript
type DecayModel = 'EXPONENTIAL' | 'LINEAR' | 'STEP' | 'PLATEAU';

function selectDecayModel(insight: Insight): DecayModel {
  const state = insight.state;
  const evidenceCount = insight.evidence.length;
  const hasUserValidation = insight.userValidations.some(v =>
    v.type === 'EXPLICIT_CONFIRM' || v.type === 'ACTED_ON'
  );

  // Strongly validated insights use plateau (very slow decay)
  if (hasUserValidation && evidenceCount > 10) return 'PLATEAU';

  // Reinforced insights use step (holds steady until evidence dries up)
  if (state === 'REINFORCED') return 'STEP';

  // Challenged or fading insights use exponential (fast decay)
  if (state === 'CHALLENGED' || state === 'FADING') return 'EXPONENTIAL';

  // Default: linear
  return 'LINEAR';
}
```

### 3.2 — Decay Functions

```typescript
function applyDecay(
  baseScore: number,
  insight: Insight,
  model: DecayModel
): number {
  const lastReinforcement = getLastReinforcementTime(insight);
  const daysSinceReinforcement = (Date.now() - lastReinforcement) / (24 * 60 * 60 * 1000);

  switch (model) {
    case 'EXPONENTIAL': {
      // Halves every 7 days without reinforcement
      // score(t) = base * 0.5^(t/7)
      const halfLifeDays = 7;
      return baseScore * Math.pow(0.5, daysSinceReinforcement / halfLifeDays);
    }

    case 'LINEAR': {
      // Loses 10% per 7 days
      // score(t) = base - (0.10/7) * t, floored at 0
      const ratePerDay = 0.10 / 7;
      return Math.max(baseScore - ratePerDay * daysSinceReinforcement, 0);
    }

    case 'STEP': {
      // Holds full value until threshold, then drops sharply
      // Stable for 30 days, then drops 25%, then gradual
      if (daysSinceReinforcement < 30) return baseScore;
      if (daysSinceReinforcement < 60) return baseScore * 0.75;
      if (daysSinceReinforcement < 90) return baseScore * 0.50;
      return baseScore * 0.25;
    }

    case 'PLATEAU': {
      // Very slow decay — for deeply confirmed insights
      // Loses only 5% per 30 days, floors at 40% of original
      const ratePerDay = 0.05 / 30;
      const minimum = baseScore * 0.4;
      return Math.max(baseScore - ratePerDay * daysSinceReinforcement, minimum);
    }
  }
}
```

---

## PART 4 — CONTRADICTION RESOLUTION

```typescript
interface Contradiction {
  id: string;
  insightId: string;           // Which insight is challenged
  contradictingEvidence: EvidenceNode[];
  detectedAt: number;
  severity: ContradictionSeverity;
  resolution?: ContradictionResolution;
  state: 'OPEN' | 'RESOLVED' | 'DISMISSED';
}

type ContradictionSeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'INVALIDATING';

interface ContradictionResolution {
  type: ResolutionType;
  resolvedAt: number;
  explanation: string;
  updatedInsight?: Partial<Insight>; // How the insight changed
}

type ResolutionType =
  | 'CONTEXT_DEPENDENT'    // Both are true in different contexts
  | 'TEMPORAL_SHIFT'       // Insight was true then, new evidence reflects change
  | 'EVIDENCE_QUALITY'     // Contradicting evidence was lower quality
  | 'INSIGHT_REFINED'      // Insight was too broad; now more precise
  | 'INSIGHT_INVALIDATED'  // New evidence definitively disproves insight
  | 'USER_RESOLVED';       // User manually resolved it

class ContradictionResolver {
  
  async detect(newEvidence: EvidenceNode, existingInsights: Insight[]): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = [];

    for (const insight of existingInsights) {
      const similarity = this.computeSimilarity(newEvidence, insight);
      
      if (similarity.topicMatch && similarity.sentiment < 0) {
        // Same topic, opposite sentiment — potential contradiction
        const severity = this.assessSeverity(newEvidence, insight, similarity);
        
        contradictions.push({
          id: crypto.randomUUID(),
          insightId: insight.id,
          contradictingEvidence: [newEvidence],
          detectedAt: Date.now(),
          severity,
          state: 'OPEN',
        });
      }
    }

    return contradictions;
  }

  async autoResolve(contradiction: Contradiction, insight: Insight): Promise<ContradictionResolution | null> {
    // Can we resolve this automatically?

    // Check for temporal shift (pattern changed over time)
    const evidenceTimestamps = insight.evidence.map(e => e.timestamp);
    const contradictionTime = contradiction.detectedAt;
    const oldestEvidence = Math.min(...evidenceTimestamps);
    
    if (contradictionTime - oldestEvidence > 90 * 24 * 60 * 60 * 1000) {
      // 90+ days gap — likely a temporal shift
      return {
        type: 'TEMPORAL_SHIFT',
        resolvedAt: Date.now(),
        explanation: 'Pattern appears to have changed over a 90+ day period. Insight updated to reflect current state.',
        updatedInsight: {
          claim: `${insight.claim} (Previously true; pattern has evolved)`,
          state: 'REVISED',
        },
      };
    }

    // Check if context is different
    const insightContext = insight.evidence.map(e => e.context.primaryContext);
    const contradictionContext = contradiction.contradictingEvidence[0].context.primaryContext;
    
    if (!insightContext.includes(contradictionContext)) {
      return {
        type: 'CONTEXT_DEPENDENT',
        resolvedAt: Date.now(),
        explanation: `Insight is context-specific. True in: ${[...new Set(insightContext)].join(', ')}. Different pattern in: ${contradictionContext}`,
        updatedInsight: {
          claimVector: { ...insight.claimVector, contextSpecificity: 0.9 },
        },
      };
    }

    // Can't auto-resolve — escalate to user
    return null;
  }

  private computeSimilarity(
    evidence: EvidenceNode,
    insight: Insight
  ): { topicMatch: boolean; sentiment: number } {
    // Topic matching via keyword overlap (production: use embedding similarity)
    const evidenceWords = new Set(evidence.content.toLowerCase().split(/\W+/));
    const insightWords = new Set(insight.claim.toLowerCase().split(/\W+/));
    
    const intersection = [...evidenceWords].filter(w => insightWords.has(w));
    const union = new Set([...evidenceWords, ...insightWords]);
    const topicSimilarity = intersection.length / union.size;
    
    const topicMatch = topicSimilarity > 0.3;
    
    // Sentiment: positive evidence vs negative insight = contradiction
    const sentiment = evidence.weight > 0 
      ? (insight.claimVector.emotionalValence > 0 ? 1 : -1)
      : -1;

    return { topicMatch, sentiment };
  }

  private assessSeverity(
    evidence: EvidenceNode,
    insight: Insight,
    similarity: { topicMatch: boolean; sentiment: number }
  ): ContradictionSeverity {
    const currentScore = insight.score.composite;
    const evidenceWeight = evidence.weight;
    
    if (evidenceWeight > 0.8 && currentScore > 0.8) return 'MAJOR';
    if (evidenceWeight > 0.6 && currentScore > 0.6) return 'MODERATE';
    return 'MINOR';
  }
}
```

---

## PART 5 — INSIGHT LIFECYCLE MANAGER

```typescript
class InsightLifecycleManager {
  
  private readonly PROMOTION_RULES: Record<InsightLifecycleState, PromotionRule[]> = {
    CANDIDATE: [
      {
        toState: 'EMERGING',
        condition: (i) => i.evidence.length >= 2,
        description: '2+ evidence points collected'
      }
    ],
    EMERGING: [
      {
        toState: 'CONFIRMED',
        condition: (i) => i.score.composite >= 0.6 && (
          i.userValidations.some(v => v.type === 'EXPLICIT_CONFIRM') ||
          i.evidence.length >= 5
        ),
        description: 'Score ≥ 0.6 with validation or 5+ evidence points'
      },
      {
        toState: 'INVALIDATED',
        condition: (i) => i.score.composite < 0.2 && i.evidence.length >= 3,
        description: 'Score < 0.2 with 3+ evidence points — insufficient foundation'
      }
    ],
    CONFIRMED: [
      {
        toState: 'REINFORCED',
        condition: (i) => i.score.composite >= 0.8 && i.userValidations.length >= 3,
        description: 'Score ≥ 0.8 with 3+ user validations'
      },
      {
        toState: 'CHALLENGED',
        condition: (i) => i.contradictions.some(c => c.state === 'OPEN' && c.severity !== 'MINOR'),
        description: 'Non-minor open contradiction detected'
      },
      {
        toState: 'FADING',
        condition: (i) => i.score.decayedScore < i.score.composite * 0.6,
        description: 'Decayed score is < 60% of base score'
      }
    ],
    REINFORCED: [
      {
        toState: 'CHALLENGED',
        condition: (i) => i.contradictions.some(c => c.state === 'OPEN' && c.severity === 'MAJOR'),
        description: 'Major open contradiction'
      },
      {
        toState: 'FADING',
        condition: (i) => {
          const lastEvidence = Math.max(...i.evidence.map(e => e.timestamp));
          const daysSince = (Date.now() - lastEvidence) / (24 * 60 * 60 * 1000);
          return daysSince > 60;
        },
        description: 'No new evidence in 60+ days'
      }
    ],
    CHALLENGED: [
      {
        toState: 'REVISED',
        condition: (i) => i.contradictions.every(c => c.state !== 'OPEN'),
        description: 'All contradictions resolved'
      },
      {
        toState: 'INVALIDATED',
        condition: (i) => i.contradictions.some(c => c.state === 'OPEN' && c.severity === 'INVALIDATING'),
        description: 'Invalidating contradiction found'
      }
    ],
    REVISED: [
      {
        toState: 'CONFIRMED',
        condition: (i) => i.score.composite >= 0.6,
        description: 'Post-revision score ≥ 0.6'
      }
    ],
    FADING: [
      {
        toState: 'CONFIRMED',
        condition: (i) => {
          const recentEvidence = i.evidence.filter(e => 
            Date.now() - e.timestamp < 14 * 24 * 60 * 60 * 1000
          );
          return recentEvidence.length >= 2;
        },
        description: '2+ evidence points in last 14 days — revived'
      },
      {
        toState: 'DORMANT',
        condition: (i) => i.score.decayedScore < 0.2,
        description: 'Decayed score < 0.2'
      }
    ],
    DORMANT: [
      {
        toState: 'FADING',
        condition: (i) => i.evidence.filter(e => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000).length > 0,
        description: 'New evidence found — awakening'
      }
    ],
    INVALIDATED: [],  // Terminal state — no promotions
    ARCHIVED: [],     // Terminal state — no promotions
  };

  async tick(insight: Insight): Promise<Insight> {
    const rules = this.PROMOTION_RULES[insight.state] ?? [];
    
    for (const rule of rules) {
      if (rule.condition(insight)) {
        const prevState = insight.state;
        const newInsight: Insight = {
          ...insight,
          state: rule.toState,
          updatedAt: Date.now(),
          lifecycle: [
            ...insight.lifecycle,
            {
              from: prevState,
              to: rule.toState,
              reason: rule.description,
              timestamp: Date.now(),
            }
          ],
          score: computeCompositeScore({
            ...insight,
            state: rule.toState,
          }),
        };

        // Notify via HERALD
        await AgentBus.send({
          type: 'INSIGHT_SCORED',
          from: 'REFLECT',
          to: 'HERALD',
          payload: {
            insightId: insight.id,
            transitionFrom: prevState,
            transitionTo: rule.toState,
            reason: rule.description,
            newScore: newInsight.score.composite,
          },
          priority: rule.toState === 'INVALIDATED' ? 1 : 2,
          timestamp: Date.now(),
        });

        return newInsight;
      }
    }

    // No state change — just recompute score
    return {
      ...insight,
      score: computeCompositeScore(insight),
      updatedAt: Date.now(),
    };
  }
}
```

---

## PART 6 — CROSS-DIMENSIONAL CORRELATION

```typescript
class CrossDimensionalCorrelator {
  
  // Find insights that are correlated across different life dimensions
  findCorrelations(insights: Insight[]): InsightCorrelation[] {
    const correlations: InsightCorrelation[] = [];
    
    // Compare each pair of confirmed+ insights
    const activeInsights = insights.filter(i =>
      ['CONFIRMED', 'REINFORCED', 'REVISED'].includes(i.state)
    );

    for (let i = 0; i < activeInsights.length; i++) {
      for (let j = i + 1; j < activeInsights.length; j++) {
        const a = activeInsights[i];
        const b = activeInsights[j];
        
        const correlation = this.computeCorrelation(a, b);
        
        if (Math.abs(correlation.strength) > 0.6) {
          correlations.push(correlation);
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
  }

  private computeCorrelation(a: Insight, b: Insight): InsightCorrelation {
    const distance = vectorDistance(a.claimVector, b.claimVector);
    const strength = 1 - distance; // High similarity = high correlation
    
    const type: CorrelationType = 
      a.claimVector.growthOrientation > 0 && b.claimVector.growthOrientation > 0 ? 'AMPLIFYING'
      : a.claimVector.emotionalValence * b.claimVector.emotionalValence < 0 ? 'COMPENSATING'
      : 'NEUTRAL';

    return {
      insightA: a.id,
      insightB: b.id,
      strength,
      type,
      sharedDimensions: this.findSharedDimensions(a, b),
      implications: this.deriveImplications(a, b, strength, type),
    };
  }

  private deriveImplications(
    a: Insight,
    b: Insight,
    strength: number,
    type: CorrelationType
  ): string[] {
    const implications: string[] = [];
    
    if (type === 'AMPLIFYING' && strength > 0.8) {
      implications.push(`These patterns reinforce each other. Improving one likely improves the other.`);
    }
    
    if (type === 'COMPENSATING') {
      implications.push(`These patterns may be in tension. Progress in one area could create friction in the other.`);
    }

    return implications;
  }
}
```

---

## PART 7 — THE REFLECT API

```typescript
class ReflectAPI {
  private insightStore: InsightStore;
  private lifecycleManager: InsightLifecycleManager;
  private contradictionResolver: ContradictionResolver;
  private correlator: CrossDimensionalCorrelator;

  // Process new journal entry and extract insights
  async processEntry(entry: JournalEntry): Promise<ProcessResult> {
    const extractedEvidence = await this.extractEvidence(entry);
    const affectedInsights: Insight[] = [];

    for (const evidence of extractedEvidence) {
      // Check for contradictions with existing insights
      const existing = await this.insightStore.getActive();
      const contradictions = await this.contradictionResolver.detect(evidence, existing);
      
      for (const contradiction of contradictions) {
        const resolution = await this.contradictionResolver.autoResolve(
          contradiction,
          existing.find(i => i.id === contradiction.insightId)!
        );
        
        if (resolution) {
          await this.insightStore.applyResolution(contradiction.insightId, resolution);
        } else {
          await this.insightStore.addContradiction(contradiction);
          // Escalate to user for manual resolution
        }
      }

      // Find or create matching insight
      const matchingInsight = await this.findOrCreateInsight(evidence);
      const updatedInsight = await this.addEvidence(matchingInsight, evidence);
      const tickedInsight = await this.lifecycleManager.tick(updatedInsight);
      
      await this.insightStore.save(tickedInsight);
      affectedInsights.push(tickedInsight);
    }

    return { processedEntry: entry, affectedInsights, extractedEvidence };
  }

  // Get insights ready for display (sorted by relevance + confidence)
  async getInsightsForDisplay(limit = 10): Promise<InsightDisplay[]> {
    const insights = await this.insightStore.getActive();
    
    return insights
      .filter(i => ['CONFIRMED', 'REINFORCED'].includes(i.state))
      .sort((a, b) => {
        // Sort by: recency-adjusted score + validation
        const scoreA = a.score.decayedScore * (1 + a.userValidations.length * 0.05);
        const scoreB = b.score.decayedScore * (1 + b.userValidations.length * 0.05);
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(insight => ({
        id: insight.id,
        claim: insight.claim,
        score: insight.score.composite,
        confidence: {
          low: insight.score.confidenceLow,
          high: insight.score.confidenceHigh,
        },
        evidenceCount: insight.evidence.length,
        lastReinforced: Math.max(...insight.evidence.map(e => e.timestamp)),
        state: insight.state,
        canValidate: insight.state !== 'INVALIDATED',
        decayWarning: insight.score.decayedScore < insight.score.composite * 0.7,
      }));
  }
}
```

---

## APPENDIX — INSIGHT QUALITY LADDER

```
Score Range  │  State        │  Display          │  User Action
─────────────┼───────────────┼───────────────────┼──────────────────
0.9 - 1.0    │ REINFORCED    │ Deep Insight      │ Archive / Share
0.8 - 0.9    │ CONFIRMED     │ Strong Insight    │ Validate / Act On
0.6 - 0.8    │ CONFIRMED     │ Insight           │ Validate
0.4 - 0.6    │ EMERGING      │ Emerging Pattern  │ Keep Journaling
0.2 - 0.4    │ CANDIDATE     │ Weak Signal       │ Continue
0.0 - 0.2    │ FADING        │ (hidden)          │ N/A — auto-decay
   N/A       │ INVALIDATED   │ (hidden)          │ N/A — removed
   N/A       │ CHALLENGED    │ ⚠ Under Review    │ Help Resolve
```

---

**MODULE VERSION: REFLECT-4.0.0**
**COMPATIBILITY: MATRIX V4 OMEGA**
**STATUS: ACTIVE**
