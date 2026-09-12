import type { CardProgress, Flashcard, PracticeStats } from "./types";

/** Mirror of backend practiceStats — keeps coverage UI in sync with progress. */
export function computePracticeStats(
  cards: Flashcard[],
  progress: Record<string, CardProgress>,
): PracticeStats {
  const byConfidence: PracticeStats["byConfidence"] = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let seen = 0;
  let confidenceSum = 0;

  for (const card of cards) {
    const p = progress[card.id];
    if (!p) continue;
    seen++;
    const level = p.confidence as 1 | 2 | 3 | 4;
    byConfidence[level] += 1;
    confidenceSum += p.confidence;
  }

  return {
    total: cards.length,
    seen,
    unseen: cards.length - seen,
    byConfidence,
    averageConfidence: seen > 0 ? confidenceSum / seen : null,
  };
}

function applyConfidenceRating(
  progress: Record<string, CardProgress>,
  cardId: string,
  confidence: number,
): Record<string, CardProgress> {
  const existing = progress[cardId];
  return {
    ...progress,
    [cardId]: {
      cardId,
      confidence,
      timesSeen: (existing?.timesSeen ?? 0) + 1,
      lastSeenAt: new Date().toISOString(),
    },
  };
}

export function applyPracticeRating(
  data: { cards: Flashcard[]; progress: Record<string, CardProgress> },
  cardId: string,
  confidence: number,
): { progress: Record<string, CardProgress>; stats: PracticeStats } {
  const progress = applyConfidenceRating(data.progress, cardId, confidence);
  return { progress, stats: computePracticeStats(data.cards, progress) };
}
