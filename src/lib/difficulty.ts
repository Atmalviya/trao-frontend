import type { Badge } from "@/components/ui/badge";
import type { ComponentProps } from "react";

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
];

export const DIFFICULTY_BADGE_TONES: Record<
  Difficulty,
  NonNullable<ComponentProps<typeof Badge>["tone"]>
> = {
  1: "success",
  2: "warning",
  3: "danger",
};

export function normalizeDifficulty(value: number): Difficulty {
  if (value <= 1) return 1;
  if (value >= 3) return 3;
  return value as Difficulty;
}

export function difficultyLabel(value: number) {
  return DIFFICULTY_LABELS[normalizeDifficulty(value)];
}

export function difficultyBadgeTone(value: number) {
  return DIFFICULTY_BADGE_TONES[normalizeDifficulty(value)];
}
