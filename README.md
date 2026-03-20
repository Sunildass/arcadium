# 🎮 Arcadium — The Ultimate Browser Gaming Hub

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://play-arcadium.web.app/)
[![React 19](https://img.shields.io/badge/Built%20with-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite)](https://vite.dev/)

**Arcadium** is a high-performance, open-source multi-game platform featuring over **60+ games**. Built with a retro-neon/cyberpunk aesthetic, it provides a seamless, zero-latency arcade experience directly in the browser.

![Arcadium Landing Screen](public/screenshots/landing_screen.png)

## 🖼️ Visual Tour

| **Category Discovery** | **Game Library** |
| :---: | :---: |
| ![Categories](public/screenshots/categories_screen.png) | ![Library](public/screenshots/library_screen.png) |
| Search and explore games by category | Track wins and time played per game |

---

## 🏗️ Technical Architecture

Arcadium is designed with a **Pluggable Game Engine Architecture**. By decoupling the game logic from the UI and the platform's core, we ensure high maintainability and scalability.

### 🧩 Modular Game Logic
Each game in the `src/games/` directory follows a strict separation of concerns:
- **`index.tsx`**: React UI layer, handling rendering and user interaction.
- **`Engine.ts`**: Pure TypeScript logic implementing the `GameEngine` interface.
- **`AI.ts`**: Game-specific strategy engine for 1P modes.
- **`types.ts`**: Shared TypeScript definitions for state and moves.

### 📐 The GameEngine Interface
All games implement a standard contract that allows the `GameWrapper` to manage lifecycles uniformly:

```typescript
interface GameEngine<GameState, MoveType> {
  initialize(): GameState;
  update(state: GameState, move: MoveType): GameState;
  evaluateWin(state: GameState): GameResult | null;
  getAvailableMoves?(state: GameState): MoveType[];
}
```

---

## 🧠 Adaptive AI System

The "heart" of Arcadium is its real-time **Adaptive Difficulty Manager**. Unlike static AI, Arcadium monitors your performance across sessions to keep you in the "flow state."

### 📊 Real-time Metrics Profiled:
- **Win Rate:** Moving average of success in the current session.
- **Reaction Time:** Average milliseconds taken to commit a move.
- **Mistake Rate:** Calculated by tracking invalid move attempts and suboptimal strategies.

### 🧪 Difficulty Formula:
The AI dynamically adjusts its internal search depth or randomness based on a calculated `DifficultyScore`:
`difficultyScore = baseDifficulty + (winRateModifier * reactionTimeFactor) - (mistakeRateFactor)`

---

## 🎨 Dynamic Design System

Arcadium uses a **Hierarchical Theme Resolution** system (`Global -> Category -> Game`) that injects CSS variables into the document root at runtime.

- **Neon Immersion:** Custom shaders for `Scanline`, `Grain`, and `NeonGlow` effects.
- **Glassmorphism:** Built using Tailwind 4.0 utility-first tokens for high-performance transparency.
- **Font Orchestration:** Dynamic loading of high-impact fonts like *Bebas Neue*, *Orbitron*, and *Press Start 2P*.

---

## ⚙️ Performance Strategy

- **Granular Code Splitting:** 100% of game components are lazy-loaded via `React.lazy` and `Suspense`, ensuring the initial bundle remains extremely small.
- **Event Interception:** Global keyboard events are captured and suppressed during modals and overlays to prevent leaked input into background game engines.
- **60FPS Loop Target:** Game updates are managed within the React render cycle or via `requestAnimationFrame` for physics-heavy titles.

---

## 📂 Project Structure

```text
src/
 ├── core/         # AI Engine, Game Catalog, and Local Persistence
 ├── games/        # Individual game implementations (Board/Card/Arcade/etc)
 ├── theme/        # Global design system and theme registry
 ├── components/   # Reusable UI (Modals, Overlays, Layout)
 ├── store/        # Redux Toolkit state management
 └── pages/        # Main route views (Dashboard, GameWrapper)
```

---

## 🤝 Adding a New Game

Adding a game to Arcadium is straightforward:

1. **Create your game directory:** `src/games/category/YourGame/`
2. **Implement the logic:** Create an `Engine.ts` following the `GameEngine` interface.
3. **Register the game:** Add your metadata to `src/core/catalog.ts`.
4. **Define the theme:** (Optional) Add custom colors to `src/theme/theme.registry.ts`.
5. **Hook into Wrapper:** Add the lazy import to `src/pages/GameWrapper.tsx`.

---

## 💻 Development

```bash
npm install     # Install dependencies
npm run dev     # Launch Vite dev server
npm run build   # Production compile
```

---

Built with ❤️ by the **Arcadium Team**. Licensed under MIT.
