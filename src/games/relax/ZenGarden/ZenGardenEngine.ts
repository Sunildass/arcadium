import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface ZenObject {
    id: string;
    type: 'rock1' | 'rock2' | 'rock3' | 'bonsai' | 'lantern';
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

export type ZenTool = 'rake' | 'rock1' | 'rock2' | 'rock3' | 'bonsai' | 'lantern' | 'eraser';

export interface ZenGardenState {
    width: number;
    height: number;
    resolution: number; // size of each sand "pixel" or cell
    sandAngles: number[][]; // -1 null, 0-180 angle
    objects: ZenObject[];
    activeTool: ZenTool;
    isGameOver: false; // Never ends
}

export type ZenGardenAction = 
  | { type: 'RAKE'; x: number; y: number; dx: number; dy: number }
  | { type: 'PLACE'; x: number; y: number }
  | { type: 'SET_TOOL'; tool: ZenTool }
  | { type: 'CLEAR' };

export class ZenGardenEngine implements GameEngine<ZenGardenState, ZenGardenAction> {
    
    // Fixed logical size
    public readonly width = 800;
    public readonly height = 600;
    public readonly resolution = 8; // 8x8 squares for sand

    constructor() {}

    initialize(): ZenGardenState {
        const cols = Math.ceil(this.width / this.resolution);
        const rows = Math.ceil(this.height / this.resolution);
        
        const sandAngles = Array(rows).fill(null).map(() => Array(cols).fill(-1));

        return {
            width: this.width,
            height: this.height,
            resolution: this.resolution,
            sandAngles,
            objects: [],
            activeTool: 'rake',
            isGameOver: false
        };
    }

    update(state: ZenGardenState, action: ZenGardenAction): ZenGardenState {
        const s = { ...state };

        const cols = Math.ceil(this.width / this.resolution);
        const rows = Math.ceil(this.height / this.resolution);

        if (action.type === 'SET_TOOL') {
             s.activeTool = action.tool;
             return s;
        }

        if (action.type === 'CLEAR') {
             s.sandAngles = Array(rows).fill(null).map(() => Array(cols).fill(-1));
             s.objects = [];
             return s;
        }

        if (action.type === 'RAKE' && (s.activeTool === 'rake' || s.activeTool === 'eraser')) {
             if (action.dx === 0 && action.dy === 0) return state; // No movement

             s.sandAngles = s.sandAngles.map(row => [...row]);

             // Calculate angle of movement
             let angle = Math.atan2(action.dy, action.dx);
             // Normalize to 0 - PI (180 deg) because raking left-to-right looks the same as right-to-left
             if (angle < 0) angle += Math.PI;

             // Map x, y to grid
             const cx = Math.floor(action.x / this.resolution);
             const cy = Math.floor(action.y / this.resolution);

             // Radius of rake
             const rakeRadius = s.activeTool === 'eraser' ? 4 : 3;

             for (let r = cy - rakeRadius; r <= cy + rakeRadius; r++) {
                 for (let c = cx - rakeRadius; c <= cx + rakeRadius; c++) {
                      if (r >= 0 && r < rows && c >= 0 && c < cols) {
                           // Distance check for circular brush
                           const dist = Math.sqrt((r - cy)**2 + (c - cx)**2);
                           if (dist <= rakeRadius) {
                                if (s.activeTool === 'eraser') {
                                    s.sandAngles[r][c] = -1;
                                } else {
                                    // Mix angle slightly based on distance to center for texture
                                    s.sandAngles[r][c] = angle;
                                }
                           }
                      }
                 }
             }
             return s;
        }

        // Object placement map
        const objTypes = ['rock1', 'rock2', 'rock3', 'bonsai', 'lantern'];
        
        if (action.type === 'PLACE' && objTypes.includes(s.activeTool)) {
             s.objects = [...s.objects];
             s.objects.push({
                 id: `obj-${Date.now()}`,
                 type: s.activeTool as any,
                 x: action.x,
                 y: action.y,
                 rotation: Math.random() * 360,
                 scale: 0.8 + Math.random() * 0.4
             });
             return s;
        }

        return state;
    }

    evaluateWin(state: ZenGardenState): GameResult | null {
        // Zen sandbox never has a win or score
        return null;
    }
}
