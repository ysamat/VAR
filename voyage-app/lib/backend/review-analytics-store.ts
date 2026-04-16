type GapInfo = { category: string; description: string; priority: number };

type GapFillOutcome = {
  filled: boolean;
  evidenceScore: number;
  evidenceSnippet: string;
  reason: string;
};

type VerificationOutcome = {
  status: "verified" | "contradicted" | "unclear";
  polarityDetected: "positive" | "negative" | "neutral";
  conflictsWithHistoricalStatement: boolean;
  reason: string;
};

export type ReviewQualityEvent = {
  id: string;
  propertyId: string;
  createdAt: string;
  gapQuestion?: string;
  verificationQuestion?: string;
  verificationType?: "positive" | "negative" | string;
  selectedGap: {
    category: string;
    description: string;
    priority: number;
  };
  missingInfoAreas: GapInfo[];
  selectedVerification: {
    topic: string;
    excerpt: string;
    weight: number;
    severity: number;
    score: number;
  };
  raw: {
    gapAnswer: string;
    verificationAnswer: string;
    text: string;
  };
  enriched: {
    title: string;
    body: string;
    text: string;
  };
  outcomes: {
    gapFill: GapFillOutcome;
    verification: VerificationOutcome;
  };
};

type QualitySummary = {
  totals: {
    events: number;
    gapFillRate: number;
    contradictionResolutionRate: number;
    verifiedCount: number;
    contradictedCount: number;
    unclearCount: number;
  };
  filledGaps: Array<{
    eventId: string;
    propertyId: string;
    category: string;
    description: string;
    priority: number;
    evidenceScore: number;
    evidenceSnippet: string;
  }>;
  openGaps: Array<{
    eventId: string;
    propertyId: string;
    category: string;
    description: string;
    priority: number;
    reason: string;
  }>;
  verificationDecisions: Array<{
    eventId: string;
    propertyId: string;
    statement: string;
    topic: string;
    score: number;
    status: "verified" | "contradicted" | "unclear";
    reason: string;
    answer: string;
  }>;
  events: ReviewQualityEvent[];
};

declare global {
  // eslint-disable-next-line no-var
  var __reviewQualityEvents__: ReviewQualityEvent[] | undefined;
}

const store: ReviewQualityEvent[] = globalThis.__reviewQualityEvents__ ?? [];
if (!globalThis.__reviewQualityEvents__) {
  globalThis.__reviewQualityEvents__ = store;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function tokenizeSet(text: string): Set<string> {
  return new Set(toWords(text).filter((w) => w.length > 2));
}

function overlapRatio(source: string, candidate: string): number {
  const a = tokenizeSet(source);
  if (a.size === 0) return 0;
  const b = tokenizeSet(candidate);
  let hit = 0;
  for (const token of a) {
    if (b.has(token)) hit += 1;
  }
  return hit / a.size;
}

function scoreVerification(weight: number, severity: number): number {
  return clampScore(Math.min(100, weight * severity * 25));
}

function extractSnippet(text: string, maxLen = 140): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLen) return compact;
  return `${compact.slice(0, maxLen - 3)}...`;
}

function detectPolarity(text: string): "positive" | "negative" | "neutral" {
  const normalized = text.toLowerCase();
  const tokens = toWords(text);
  const positiveWords = new Set([
    "clean",
    "great",
    "good",
    "excellent",
    "amazing",
    "friendly",
    "quiet",
    "comfortable",
    "helpful",
    "smooth",
    "easy",
    "fast",
    "pleasant",
    "spacious",
    "love",
    "loved",
    "perfect",
  ]);
  const negativeWords = new Set([
    "dirty",
    "bad",
    "terrible",
    "awful",
    "noisy",
    "slow",
    "rude",
    "broken",
    "crowded",
    "uncomfortable",
    "late",
    "worst",
    "poor",
    "smell",
    "smelly",
    "disappointing",
    "unsafe",
    "issue",
    "problem",
    "not",
    "never",
  ]);

  const strongPositivePhrases = [
    "very clean",
    "super clean",
    "really good",
    "worked great",
    "highly recommend",
    "would stay again",
    "no issues",
    "not noisy",
  ];
  const strongNegativePhrases = [
    "very dirty",
    "really bad",
    "very noisy",
    "would not stay again",
    "not clean",
    "not good",
    "not great",
    "did not work",
    "never again",
    "too noisy",
  ];

  let pos = 0.0;
  let neg = 0.0;
  for (const token of tokens) {
    if (positiveWords.has(token)) pos += 1;
    if (negativeWords.has(token)) neg += 1.1;
  }

  for (const phrase of strongPositivePhrases) {
    if (normalized.includes(phrase)) pos += 2.5;
  }
  for (const phrase of strongNegativePhrases) {
    if (normalized.includes(phrase)) neg += 2.5;
  }

  // Simple polarity hints from concise answers.
  if (/^(yes|yep|yeah)\b/.test(normalized)) pos += 0.75;
  if (/^(no|nope)\b/.test(normalized)) neg += 0.75;

  const delta = pos - neg;
  if (Math.abs(delta) < 0.25) {
    // If lexical signal is weak, use minimal directional hint.
    if (tokens.length >= 4) {
      return delta >= 0 ? "positive" : "negative";
    }
    return "neutral";
  }

  return delta > 0 ? "positive" : "negative";
}

function evaluateGapFill(input: {
  targetGap?: string;
  gapDescription?: string;
  gapAnswer: string;
}): GapFillOutcome {
  const gapFocusText = [input.targetGap, input.gapDescription].filter(Boolean).join(" ");
  const answer = input.gapAnswer ?? "";
  const words = toWords(answer);
  const overlap = overlapRatio(gapFocusText, answer) * 100;
  const lengthScore = Math.min(100, (words.length / 25) * 100);
  // Lower threshold so concise but relevant answers can still close a gap.
  const evidenceScore = clampScore(overlap * 0.55 + lengthScore * 0.45);
  const filled = words.length >= 6 && evidenceScore >= 22;

  return {
    filled,
    evidenceScore,
    evidenceSnippet: extractSnippet(answer),
    reason: filled
      ? "Answer is detailed and overlaps with the selected information gap."
      : "Answer is too short or not specific to the selected gap topic.",
  };
}

function evaluateVerification(input: {
  verificationType?: string;
  verificationAnswer: string;
  verificationExcerpt?: string;
  verificationTopic?: string;
}): VerificationOutcome {
  const polarity = detectPolarity(input.verificationAnswer ?? "");
  const expected = input.verificationType === "negative" ? "negative" : "positive";
  const normalizedAnswer = (input.verificationAnswer ?? "").toLowerCase();
  const contradictionCues = [
    "not",
    "never",
    "no",
    "however",
    "but",
    "except",
    "although",
    "despite",
    "instead",
    "worse",
  ];
  const hasContradictionCue = contradictionCues.some((cue) => normalizedAnswer.includes(cue));

  const answerLength = toWords(input.verificationAnswer ?? "").length;
  if (polarity === "neutral" && answerLength < 3) {
    return {
      status: "unclear",
      polarityDetected: polarity,
      conflictsWithHistoricalStatement: false,
      reason: "Answer is too short to determine direction confidently.",
    };
  }

  if (polarity === "neutral") {
    // If neutral but contradiction language appears, mark as contradiction.
    if (hasContradictionCue && expected === "positive") {
      return {
        status: "contradicted",
        polarityDetected: "neutral",
        conflictsWithHistoricalStatement: true,
        reason: `Conflict with historical statement on ${input.verificationTopic ?? "the selected topic"}: answer contains reversal language against "${input.verificationExcerpt ?? "prior review excerpt"}".`,
      };
    }

    if (hasContradictionCue && expected === "negative") {
      return {
        status: "verified",
        polarityDetected: "neutral",
        conflictsWithHistoricalStatement: false,
        reason: "Answer uses mixed language but still aligns with a historically negative statement.",
      };
    }

    return {
      status: "verified",
      polarityDetected: "neutral",
      conflictsWithHistoricalStatement: false,
      reason: "Answer is mixed, but contains enough context to treat the prior statement as supported.",
    };
  }

  const status = polarity === expected ? "verified" : "contradicted";
  return {
    status,
    polarityDetected: polarity,
    conflictsWithHistoricalStatement: status === "contradicted",
    reason:
      status === "verified"
        ? "Detected sentiment matches the historical statement direction."
        : `Conflict with historical statement on ${input.verificationTopic ?? "the selected topic"}: detected ${polarity} sentiment contradicts "${input.verificationExcerpt ?? "prior review excerpt"}".`,
  };
}

function normalizeLegacyEvent(event: ReviewQualityEvent): ReviewQualityEvent {
  if (event.outcomes) return event;

  const gapFill = evaluateGapFill({
    targetGap: event.selectedGap?.category,
    gapDescription: event.selectedGap?.description,
    gapAnswer: event.raw?.gapAnswer ?? "",
  });
  const verification = evaluateVerification({
    verificationType: event.verificationType,
    verificationAnswer: event.raw?.verificationAnswer ?? "",
    verificationExcerpt: event.selectedVerification?.excerpt,
    verificationTopic: event.selectedVerification?.topic,
  });

  return {
    ...event,
    selectedGap: event.selectedGap ?? {
      category: "overall experience",
      description: "general impressions of the stay",
      priority: 50,
    },
    missingInfoAreas: event.missingInfoAreas ?? [],
    selectedVerification: event.selectedVerification ?? {
      topic: "overall experience",
      excerpt: "",
      weight: 0,
      severity: 0,
      score: 0,
    },
    outcomes: {
      gapFill,
      verification,
    },
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function recordReviewQualityEvent(input: {
  propertyId: string;
  gapAnswer: string;
  verificationAnswer: string;
  gapQuestion?: string;
  verificationQuestion?: string;
  verificationType?: "positive" | "negative" | string;
  targetGap?: string;
  gapPriority?: number;
  gapDescription?: string;
  missingInfoAreas?: GapInfo[];
  verificationTopic?: string;
  verificationExcerpt?: string;
  verificationWeight?: number;
  verificationSeverity?: number;
  verificationScore?: number;
  reviewTitle: string;
  reviewBody: string;
}) {
  const rawText = [input.gapAnswer, input.verificationAnswer].filter(Boolean).join(" ");
  const enrichedText = [input.reviewTitle, input.reviewBody].filter(Boolean).join(". ");
  const verificationScoreBefore = clampScore(
    input.verificationScore ?? scoreVerification(input.verificationWeight ?? 0, input.verificationSeverity ?? 0)
  );
  const gapFill = evaluateGapFill({
    targetGap: input.targetGap,
    gapDescription: input.gapDescription,
    gapAnswer: input.gapAnswer,
  });
  const verification = evaluateVerification({
    verificationType: input.verificationType,
    verificationAnswer: input.verificationAnswer,
    verificationExcerpt: input.verificationExcerpt,
    verificationTopic: input.verificationTopic,
  });

  const event: ReviewQualityEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    propertyId: input.propertyId,
    createdAt: new Date().toISOString(),
    gapQuestion: input.gapQuestion,
    verificationQuestion: input.verificationQuestion,
    verificationType: input.verificationType,
    selectedGap: {
      category: input.targetGap ?? "overall experience",
      description: input.gapDescription ?? "general impressions of the stay",
      priority: clampScore((input.gapPriority ?? 0.5) * 100),
    },
    missingInfoAreas: input.missingInfoAreas ?? [],
    selectedVerification: {
      topic: input.verificationTopic ?? "overall experience",
      excerpt: input.verificationExcerpt ?? "",
      weight: clampScore(input.verificationWeight ?? 0),
      severity: clampScore(input.verificationSeverity ?? 0),
      score: verificationScoreBefore,
    },
    raw: {
      gapAnswer: input.gapAnswer,
      verificationAnswer: input.verificationAnswer,
      text: rawText,
    },
    enriched: {
      title: input.reviewTitle,
      body: input.reviewBody,
      text: enrichedText,
    },
    outcomes: {
      gapFill,
      verification,
    },
  };

  store.unshift(event);
  if (store.length > 250) {
    store.length = 250;
  }
}

export function getReviewQualitySummary(limit = 25): QualitySummary {
  const events = store.slice(0, limit).map((e) => normalizeLegacyEvent(e));
  const safeCount = Math.max(events.length, 1);
  const filled = events.filter((e) => e.outcomes.gapFill.filled);
  const verified = events.filter((e) => e.outcomes.verification.status === "verified");
  const contradicted = events.filter((e) => e.outcomes.verification.status === "contradicted");
  const unclear = events.filter((e) => e.outcomes.verification.status === "unclear");
  const resolvedCount = verified.length + contradicted.length;

  return {
    totals: {
      events: events.length,
      gapFillRate: round2((filled.length / safeCount) * 100),
      contradictionResolutionRate: round2((resolvedCount / safeCount) * 100),
      verifiedCount: verified.length,
      contradictedCount: contradicted.length,
      unclearCount: unclear.length,
    },
    filledGaps: filled.map((e) => ({
      eventId: e.id,
      propertyId: e.propertyId,
      category: e.selectedGap.category,
      description: e.selectedGap.description,
      priority: e.selectedGap.priority,
      evidenceScore: e.outcomes.gapFill.evidenceScore,
      evidenceSnippet: e.outcomes.gapFill.evidenceSnippet,
    })),
    openGaps: events
      .filter((e) => !e.outcomes.gapFill.filled)
      .map((e) => ({
        eventId: e.id,
        propertyId: e.propertyId,
        category: e.selectedGap.category,
        description: e.selectedGap.description,
        priority: e.selectedGap.priority,
        reason: e.outcomes.gapFill.reason,
      })),
    verificationDecisions: events.map((e) => ({
      eventId: e.id,
      propertyId: e.propertyId,
      statement: e.selectedVerification.excerpt || "No historical statement available",
      topic: e.selectedVerification.topic,
      score: e.selectedVerification.score,
      status: e.outcomes.verification.status,
      reason: e.outcomes.verification.reason,
      answer: extractSnippet(e.raw.verificationAnswer),
    })),
    events,
  };
}
