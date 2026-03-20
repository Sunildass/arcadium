import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface MathQuestion {
    question: string;
    answer: number;
    options: number[];
}

export interface MathDuelState {
    currentQuestion: MathQuestion;
    score: number;
    streak: number;
    lives: number;
    totalAnswered: number;
    totalCorrect: number;
    isGameOver: boolean;
    lastResult: 'correct' | 'wrong' | null;
    message: string;
    timeLeft: number; // seconds per question
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type MathDuelAction =
  | { type: 'ANSWER'; value: number }
  | { type: 'TICK' }; // countdown tick

function generateQuestion(difficulty: 'Easy' | 'Medium' | 'Hard'): MathQuestion {
    const ops = difficulty === 'Easy' ? ['+', '-'] :
                difficulty === 'Medium' ? ['+', '-', '×'] : ['+', '-', '×', '÷'];

    const op = ops[Math.floor(Math.random() * ops.length)];

    let a: number, b: number, answer: number, question: string;

    if (op === '+') {
        const max = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 50 : 100;
        a = Math.floor(Math.random() * max) + 1;
        b = Math.floor(Math.random() * max) + 1;
        answer = a + b;
        question = `${a} + ${b}`;
    } else if (op === '-') {
        const max = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 50 : 100;
        a = Math.floor(Math.random() * max) + 5;
        b = Math.floor(Math.random() * a) + 1;
        answer = a - b;
        question = `${a} − ${b}`;
    } else if (op === '×') {
        const max = difficulty === 'Medium' ? 12 : 15;
        a = Math.floor(Math.random() * max) + 1;
        b = Math.floor(Math.random() * max) + 1;
        answer = a * b;
        question = `${a} × ${b}`;
    } else {
        // Division — always produces whole numbers
        b = Math.floor(Math.random() * 11) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        a = b * answer;
        question = `${a} ÷ ${b}`;
    }

    // Generate 3 wrong options close to the answer
    const wrongSet = new Set<number>();
    while (wrongSet.size < 3) {
        const delta = Math.floor(Math.random() * 10) + 1;
        const wrong = Math.random() > 0.5 ? answer + delta : answer - delta;
        if (wrong !== answer && wrong >= 0) wrongSet.add(wrong);
    }

    const options = [answer, ...Array.from(wrongSet)].sort(() => Math.random() - 0.5);

    return { question, answer, options };
}

export class MathDuelEngine implements GameEngine<MathDuelState, MathDuelAction> {
    private startTimeMs = 0;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.difficulty = difficulty;
    }

    initialize(): MathDuelState {
        this.startTimeMs = Date.now();
        const timeLeft = this.difficulty === 'Easy' ? 15 : this.difficulty === 'Medium' ? 10 : 7;
        return {
            currentQuestion: generateQuestion(this.difficulty),
            score: 0,
            streak: 0,
            lives: 3,
            totalAnswered: 0,
            totalCorrect: 0,
            isGameOver: false,
            lastResult: null,
            message: 'Select the correct answer!',
            timeLeft,
            difficulty: this.difficulty
        };
    }

    update(state: MathDuelState, action: MathDuelAction): MathDuelState {
        if (state.isGameOver) return state;

        const baseTime = state.difficulty === 'Easy' ? 15 : state.difficulty === 'Medium' ? 10 : 7;
        const s = { ...state };

        if (action.type === 'TICK') {
            s.timeLeft = s.timeLeft - 1;
            if (s.timeLeft <= 0) {
                // Time's up — count as wrong
                s.lives--;
                s.streak = 0;
                s.totalAnswered++;
                s.lastResult = 'wrong';
                s.message = `⏰ Time's up! Answer was ${s.currentQuestion.answer}`;
                if (s.lives <= 0) {
                    s.isGameOver = true;
                    s.message = `Game Over! Score: ${s.score}`;
                } else {
                    s.currentQuestion = generateQuestion(s.difficulty);
                    s.timeLeft = baseTime;
                    s.lastResult = null;
                }
            }
            return s;
        }

        if (action.type === 'ANSWER') {
            const correct = action.value === s.currentQuestion.answer;
            s.totalAnswered++;

            if (correct) {
                s.streak++;
                s.totalCorrect++;
                const pts = 100 + (s.streak > 1 ? (s.streak - 1) * 25 : 0) + (s.timeLeft * 5);
                s.score += pts;
                s.lastResult = 'correct';
                s.message = `✅ Correct! +${pts} pts${s.streak > 1 ? ` (${s.streak}× streak!)` : ''}`;
            } else {
                s.streak = 0;
                s.lives--;
                s.lastResult = 'wrong';
                s.message = `❌ Wrong! Answer was ${s.currentQuestion.answer}`;
                if (s.lives <= 0) {
                    s.isGameOver = true;
                    s.message = `Game Over! Score: ${s.score}`;
                    return s;
                }
            }

            s.currentQuestion = generateQuestion(s.difficulty);
            s.timeLeft = baseTime;
            return s;
        }

        return state;
    }

    evaluateWin(state: MathDuelState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: 'Player1',
            score: state.score,
            difficulty: state.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
