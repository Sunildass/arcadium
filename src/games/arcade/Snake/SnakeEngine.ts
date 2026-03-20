import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type Coordinate = { x: number; y: number };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface SnakeState {
  snake: Coordinate[];
  food: Coordinate;
  direction: Direction;
  isGameOver: boolean;
  score: number;
}

export const GRID_SIZE = 20; // 20x20 grid

export class SnakeEngine implements GameEngine<SnakeState, Direction> {
  private startTimeMs: number = 0;

  initialize(): SnakeState {
    this.startTimeMs = Date.now();
    return {
      snake: [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 },
      ],
      food: this.generateFood([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]),
      direction: 'UP',
      isGameOver: false,
      score: 0,
    };
  }

  // Update runs on every tick (interval)
  // We process direction input independently.
  update(state: SnakeState, newDirection: Direction): SnakeState {
    if (state.isGameOver) return state;

    // Prevent reverse gear
    if (state.direction === 'UP' && newDirection === 'DOWN') newDirection = state.direction;
    if (state.direction === 'DOWN' && newDirection === 'UP') newDirection = state.direction;
    if (state.direction === 'LEFT' && newDirection === 'RIGHT') newDirection = state.direction;
    if (state.direction === 'RIGHT' && newDirection === 'LEFT') newDirection = state.direction;

    const head = { ...state.snake[0] };

    switch (newDirection) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check collision with walls
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return { ...state, isGameOver: true };
    }

    // Check collision with self
    for (const segment of state.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        return { ...state, isGameOver: true };
      }
    }

    const newSnake = [head, ...state.snake];
    let newScore = state.score;
    let newFood = state.food;

    // Check food collision
    if (head.x === state.food.x && head.y === state.food.y) {
      newScore += 10;
      newFood = this.generateFood(newSnake);
    } else {
      newSnake.pop(); // Remove tail
    }

    return {
      snake: newSnake,
      food: newFood,
      direction: newDirection,
      isGameOver: false,
      score: newScore,
    };
  }

  evaluateWin(state: SnakeState): GameResult | null {
    if (!state.isGameOver) return null;

    return {
      winner: 'Player1',
      score: state.score,
      playTimeMs: Date.now() - this.startTimeMs,
      difficulty: 'Adaptive',
    };
  }

  private generateFood(snake: Coordinate[]): Coordinate {
    let newFood: Coordinate;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      
      let collision = false;
      for (const segment of snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          collision = true;
          break;
        }
      }
      if (!collision) return newFood;
    }
  }
}
