import type { Difficulty, QTable } from "./types";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 2.0,
  hard: 3.0,
};

export function computeReward(correct: boolean, difficulty: Difficulty): number {
  const weight = DIFFICULTY_WEIGHT[difficulty];
  return correct ? weight : -0.5 * weight;
}

export function emptyQTable(): QTable {
  return {
    easy: { easy: 0, medium: 0, hard: 0 },
    medium: { easy: 0, medium: 0, hard: 0 },
    hard: { easy: 0, medium: 0, hard: 0 },
  };
}

export class TabularQLearner {
  q: QTable;
  alpha: number;
  gamma: number;
  epsilon: number;

  constructor(
    q?: QTable,
    alpha = 0.3,
    gamma = 0.9,
    epsilon = 0.2,
  ) {
    this.q = q ?? emptyQTable();
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
  }

  chooseAction(state: Difficulty): Difficulty {
    if (Math.random() < this.epsilon) {
      return DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
    }
    const values = this.q[state];
    const best = Math.max(...DIFFICULTIES.map((a) => values[a]));
    const tied = DIFFICULTIES.filter((a) => values[a] === best);
    return tied[Math.floor(Math.random() * tied.length)];
  }

  update(
    state: Difficulty,
    action: Difficulty,
    reward: number,
    nextState: Difficulty,
  ): void {
    const old = this.q[state][action];
    const bootstrap = Math.max(...DIFFICULTIES.map((a) => this.q[nextState][a]));
    this.q[state][action] =
      old + this.alpha * (reward + this.gamma * bootstrap - old);
  }

  snapshot(): QTable {
    return structuredClone(this.q);
  }
}
