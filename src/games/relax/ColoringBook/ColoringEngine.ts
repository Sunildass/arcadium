import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface ColoringState {
    activeColor: string;
    colors: string[];
    paths: { id: string; d: string; fill: string; }[];
    scene: string;
    scenes: string[];
    isGameOver: false;
}

export type ColoringAction =
  | { type: 'SELECT_COLOR'; color: string }
  | { type: 'FILL_PATH'; pathId: string }
  | { type: 'CLEAR' }
  | { type: 'CHANGE_SCENE'; scene: string };

// ─── Shared palette ───────────────────────────────────────────────────────────
const COLORS = [
    '#ffffff','#000000','#94a3b8','#ef4444','#f97316',
    '#f59e0b','#84cc16','#22c55e','#06b6d4','#3b82f6',
    '#6366f1','#a855f7','#ec4899','#f43f5e',
];

// ─── Path builders ───────────────────────────────────────────────────────────

function p2c(cx: number, cy: number, r: number, a: number) {
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arc(cx: number, cy: number, r: number, a1: number, a2: number) {
    const s = p2c(cx, cy, r, a1);
    const e = p2c(cx, cy, r, a2);
    const large = a2 - a1 <= Math.PI ? '0' : '1';
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function arcRev(cx: number, cy: number, r: number, a1: number, a2: number) {
    const s = p2c(cx, cy, r, a1);
    const large = a2 - a1 <= Math.PI ? '0' : '1';
    return `A ${r} ${r} 0 ${large} 0 ${s.x} ${s.y}`;
}

// ─── SCENE: Mandala ───────────────────────────────────────────────────────────
function buildMandala(): { id: string; d: string; fill: string }[] {
    const paths: { id: string; d: string; fill: string }[] = [];
    const cx = 400, cy = 300;
    let n = 0;
    const W = 12, r0 = 50, r1 = 130, r2 = 230; // ring widths

    // Outer background circle
    paths.push({ id: `p${n++}`, d: `M ${cx} ${cy - 250} A 250 250 0 1 1 ${cx - 0.1} ${cy - 250} Z`, fill: '#fff' });

    for (let i = 0; i < W; i++) {
        const a1 = (i / W) * Math.PI * 2, a2 = ((i + 1) / W) * Math.PI * 2;
        paths.push({ id: `p${n++}`, d: arc(cx, cy, r0, a1, a2) + ` L ${p2c(cx, cy, r1, a2).x} ${p2c(cx, cy, r1, a2).y} ` + arcRev(cx, cy, r1, a1, a2) + ' Z', fill: '#fff' });
        paths.push({ id: `p${n++}`, d: arc(cx, cy, r1, a1, a2) + ` L ${p2c(cx, cy, r2, a2).x} ${p2c(cx, cy, r2, a2).y} ` + arcRev(cx, cy, r2, a1, a2) + ' Z', fill: '#fff' });
    }
    // Center octagram
    paths.push({ id: `p${n++}`, d: `M ${cx} ${cy - 45} L ${cx + 18} ${cy - 18} L ${cx + 45} ${cy} L ${cx + 18} ${cy + 18} L ${cx} ${cy + 45} L ${cx - 18} ${cy + 18} L ${cx - 45} ${cy} L ${cx - 18} ${cy - 18} Z`, fill: '#fff' });
    // Corner diamonds
    [{ x: cx - 320, y: cy - 220 }, { x: cx + 320, y: cy - 220 }, { x: cx - 320, y: cy + 220 }, { x: cx + 320, y: cy + 220 }].forEach(c => {
        paths.push({ id: `p${n++}`, d: `M ${c.x} ${c.y - 36} L ${c.x + 28} ${c.y} L ${c.x} ${c.y + 36} L ${c.x - 28} ${c.y} Z`, fill: '#fff' });
    });
    return paths;
}

// ─── SCENE: Garden (flowers + leaves + butterflies) ──────────────────────────
function buildGarden(): { id: string; d: string; fill: string }[] {
    const paths: { id: string; d: string; fill: string }[] = [];
    let n = 0;

    // Sky band
    paths.push({ id: `p${n++}`, d: 'M 0 0 H 800 V 220 H 0 Z', fill: '#fff' });
    // Ground band
    paths.push({ id: `p${n++}`, d: 'M 0 220 H 800 V 600 H 0 Z', fill: '#fff' });

    // Helper: flower at (fx, fy)
    function flower(fx: number, fy: number, pr: number, cr: number, petals: number) {
        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2;
            const px = fx + (pr + cr) * Math.cos(a), py = fy + (pr + cr) * Math.sin(a);
            paths.push({ id: `p${n++}`, d: `M ${px} ${py} m -${cr} 0 a ${cr} ${cr} 0 1 0 ${cr * 2} 0 a ${cr} ${cr} 0 1 0 -${cr * 2} 0`, fill: '#fff' });
        }
        // Center
        paths.push({ id: `p${n++}`, d: `M ${fx - pr} ${fy} A ${pr} ${pr} 0 1 0 ${fx + pr} ${fy} A ${pr} ${pr} 0 1 0 ${fx - pr} ${fy} Z`, fill: '#fff' });
        // Stem
        paths.push({ id: `p${n++}`, d: `M ${fx - 5} ${fy + pr} L ${fx - 5} ${fy + pr + 80} L ${fx + 5} ${fy + pr + 80} L ${fx + 5} ${fy + pr} Z`, fill: '#fff' });
        // Leaf
        paths.push({ id: `p${n++}`, d: `M ${fx} ${fy + pr + 40} Q ${fx + 40} ${fy + pr + 20} ${fx + 40} ${fy + pr + 50} Q ${fx + 20} ${fy + pr + 70} ${fx} ${fy + pr + 40} Z`, fill: '#fff' });
    }

    flower(130, 310, 28, 22, 6);
    flower(320, 280, 32, 26, 7);
    flower(540, 300, 28, 22, 5);
    flower(700, 290, 35, 28, 8);
    flower(230, 350, 24, 18, 6);
    flower(450, 330, 26, 20, 6);

    // Sun
    const sx = 680, sy = 80, sr = 45;
    paths.push({ id: `p${n++}`, d: `M ${sx - sr} ${sy} A ${sr} ${sr} 0 1 0 ${sx + sr} ${sy} A ${sr} ${sr} 0 1 0 ${sx - sr} ${sy} Z`, fill: '#fff' });
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x1 = sx + (sr + 8) * Math.cos(a), y1 = sy + (sr + 8) * Math.sin(a);
        const x2 = sx + (sr + 26) * Math.cos(a), y2 = sy + (sr + 26) * Math.sin(a);
        paths.push({ id: `p${n++}`, d: `M ${x1 - 4 * Math.sin(a)} ${y1 + 4 * Math.cos(a)} L ${x2} ${y2} L ${x1 + 4 * Math.sin(a)} ${y1 - 4 * Math.cos(a)} Z`, fill: '#fff' });
    }

    // Cloud
    [{ x: 120, y: 90 }, { x: 160, y: 70 }, { x: 200, y: 90 }, { x: 240, y: 90 }].forEach(c =>
        paths.push({ id: `p${n++}`, d: `M ${c.x - 35} ${c.y} A 35 35 0 1 0 ${c.x + 35} ${c.y} A 35 35 0 1 0 ${c.x - 35} ${c.y} Z`, fill: '#fff' })
    );

    // Butterfly wings (2 butterflies)
    [[190, 200], [560, 180]].forEach(([bx, by]) => {
        paths.push({ id: `p${n++}`, d: `M ${bx} ${by} Q ${bx - 60} ${by - 50} ${bx - 50} ${by + 20} Q ${bx - 30} ${by + 50} ${bx} ${by} Z`, fill: '#fff' });
        paths.push({ id: `p${n++}`, d: `M ${bx} ${by} Q ${bx + 60} ${by - 50} ${bx + 50} ${by + 20} Q ${bx + 30} ${by + 50} ${bx} ${by} Z`, fill: '#fff' });
        paths.push({ id: `p${n++}`, d: `M ${bx - 3} ${by - 10} L ${bx + 3} ${by + 40} Z`, fill: '#fff' });
    });

    return paths;
}

// ─── SCENE: Ocean (waves + fish + coral + starfish) ──────────────────────────
function buildOcean(): { id: string; d: string; fill: string }[] {
    const paths: { id: string; d: string; fill: string }[] = [];
    let n = 0;

    // Sky
    paths.push({ id: `p${n++}`, d: 'M 0 0 H 800 V 180 H 0 Z', fill: '#fff' });
    // Deep ocean background
    paths.push({ id: `p${n++}`, d: 'M 0 180 H 800 V 600 H 0 Z', fill: '#fff' });
    // Wave layers
    ['M 0 180 Q 100 155 200 180 Q 300 205 400 180 Q 500 155 600 180 Q 700 205 800 180 V 220 H 0 Z',
     'M 0 250 Q 120 225 240 250 Q 360 275 480 250 Q 600 225 800 250 V 290 H 0 Z',
    ].forEach(d => paths.push({ id: `p${n++}`, d, fill: '#fff' }));

    // Sand bottom
    paths.push({ id: `p${n++}`, d: 'M 0 510 Q 200 490 400 510 Q 600 530 800 510 V 600 H 0 Z', fill: '#fff' });

    // Fish helper
    function fish(fx: number, fy: number, size: number, flip = false) {
        const s = flip ? -1 : 1;
        paths.push({ id: `p${n++}`, d: `M ${fx} ${fy} Q ${fx + s * size * 1.2} ${fy - size * 0.6} ${fx + s * size * 2} ${fy} Q ${fx + s * size * 1.2} ${fy + size * 0.6} ${fx} ${fy} Z`, fill: '#fff' });
        paths.push({ id: `p${n++}`, d: `M ${fx} ${fy} L ${fx - s * size * 0.6} ${fy - size * 0.7} L ${fx - s * size * 0.6} ${fy + size * 0.7} Z`, fill: '#fff' });
        paths.push({ id: `p${n++}`, d: `M ${fx + s * size * 1.3} ${fy - size * 0.2} A ${size * 0.2} ${size * 0.2} 0 1 0 ${fx + s * size * 1.3 + 1} ${fy - size * 0.2} Z`, fill: '#fff' });
    }
    fish(200, 330, 35); fish(600, 380, 28); fish(400, 290, 40); fish(550, 460, 22, true); fish(120, 440, 30, true);

    // Coral
    function coral(cx: number) {
        [0, -22, 22].forEach(ox => {
            const h = 50 + Math.random() * 40;
            paths.push({ id: `p${n++}`, d: `M ${cx + ox - 8} 520 L ${cx + ox - 8} ${520 - h} Q ${cx + ox} ${520 - h - 20} ${cx + ox + 8} ${520 - h} L ${cx + ox + 8} 520 Z`, fill: '#fff' });
        });
    }
    [150, 380, 620, 740].forEach(coral);

    // Starfish
    function starfish(sx: number, sy: number) {
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const a2 = a + Math.PI / 5;
            const ox = sx + 25 * Math.cos(a), oy = sy + 25 * Math.sin(a);
            const ix = sx + 10 * Math.cos(a2), iy = sy + 10 * Math.sin(a2);
            if (i === 0) paths.push({ id: `p${n++}`, d: `M ${ox} ${oy} L ${ix} ${iy}`, fill: '#fff' });
        }
        // body as single star path
        let d = '';
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const a2 = a + Math.PI / 5;
            const ox = sx + 26 * Math.cos(a), oy = sy + 26 * Math.sin(a);
            const ix = sx + 11 * Math.cos(a2), iy = sy + 11 * Math.sin(a2);
            d += (i === 0 ? `M ` : `L `) + `${ox} ${oy} L ${ix} ${iy} `;
        }
        paths.push({ id: `p${n++}`, d: d + 'Z', fill: '#fff' });
    }
    starfish(300, 540); starfish(520, 565); starfish(680, 535);

    return paths;
}

// ─── SCENE: Fantasy Castle ────────────────────────────────────────────────────
function buildCastle(): { id: string; d: string; fill: string }[] {
    const paths: { id: string; d: string; fill: string }[] = [];
    let n = 0;

    // Sky
    paths.push({ id: `p${n++}`, d: 'M 0 0 H 800 V 600 H 0 Z', fill: '#fff' });
    // Ground
    paths.push({ id: `p${n++}`, d: 'M 0 480 H 800 V 600 H 0 Z', fill: '#fff' });

    // Moon
    const mx = 680, my = 70;
    paths.push({ id: `p${n++}`, d: `M ${mx - 40} ${my} A 40 40 0 1 0 ${mx + 40} ${my} A 40 40 0 1 0 ${mx - 40} ${my} Z`, fill: '#fff' });

    // Stars (small diamonds)
    [[100, 80], [200, 40], [300, 100], [450, 60], [580, 90], [150, 160], [520, 30]].forEach(([sx, sy]) => {
        paths.push({ id: `p${n++}`, d: `M ${sx} ${sy - 10} L ${sx + 6} ${sy} L ${sx} ${sy + 10} L ${sx - 6} ${sy} Z`, fill: '#fff' });
    });

    // Main keep
    paths.push({ id: `p${n++}`, d: 'M 300 480 H 500 V 200 H 300 Z', fill: '#fff' });
    // Battlements on keep
    [310, 340, 370, 400, 430, 460].forEach(bx =>
        paths.push({ id: `p${n++}`, d: `M ${bx} 200 H ${bx + 20} V 175 H ${bx} Z`, fill: '#fff' })
    );

    // Left tower
    paths.push({ id: `p${n++}`, d: 'M 200 480 H 300 V 260 H 200 Z', fill: '#fff' });
    paths.push({ id: `p${n++}`, d: 'M 190 260 L 250 210 L 310 260 Z', fill: '#fff' }); // roof
    [200, 225, 255, 280].forEach(bx =>
        paths.push({ id: `p${n++}`, d: `M ${bx} 260 H ${bx + 18} V 238 H ${bx} Z`, fill: '#fff' })
    );

    // Right tower
    paths.push({ id: `p${n++}`, d: 'M 500 480 H 600 V 260 H 500 Z', fill: '#fff' });
    paths.push({ id: `p${n++}`, d: 'M 490 260 L 550 210 L 610 260 Z', fill: '#fff' });
    [500, 525, 555, 580].forEach(bx =>
        paths.push({ id: `p${n++}`, d: `M ${bx} 260 H ${bx + 18} V 238 H ${bx} Z`, fill: '#fff' })
    );

    // Gate arch
    paths.push({ id: `p${n++}`, d: 'M 360 480 H 440 V 380 A 40 40 0 0 0 360 380 Z', fill: '#fff' });
    // Drawbridge
    paths.push({ id: `p${n++}`, d: 'M 355 480 H 445 V 510 H 355 Z', fill: '#fff' });

    // Windows (arched)
    [[250, 350], [250, 400], [550, 350], [550, 400], [390, 280], [390, 330]].forEach(([wx, wy]) =>
        paths.push({ id: `p${n++}`, d: `M ${wx - 12} ${wy} A 12 12 0 0 1 ${wx + 12} ${wy} V ${wy + 20} H ${wx - 12} Z`, fill: '#fff' })
    );

    // Flag on main tower
    paths.push({ id: `p${n++}`, d: 'M 400 175 V 120', fill: '#fff' });
    paths.push({ id: `p${n++}`, d: 'M 400 120 L 440 135 L 400 150 Z', fill: '#fff' });

    // Rolling hills
    ['M 0 480 Q 150 450 300 480 Q 450 510 600 480 Q 700 460 800 480 V 600 H 0 Z',
     'M 0 510 Q 100 490 200 510 Q 350 535 500 510 Q 650 485 800 510 V 600 H 0 Z'
    ].forEach(d => paths.push({ id: `p${n++}`, d, fill: '#fff' }));

    return paths;
}

// ─── SCENE: Space ─────────────────────────────────────────────────────────────
function buildSpace(): { id: string; d: string; fill: string }[] {
    const paths: { id: string; d: string; fill: string }[] = [];
    let n = 0;

    // Background
    paths.push({ id: `p${n++}`, d: 'M 0 0 H 800 V 600 H 0 Z', fill: '#fff' });

    // Ringed planet
    const px = 580, py = 120, pr = 70;
    paths.push({ id: `p${n++}`, d: `M ${px - pr} ${py} A ${pr} ${pr} 0 1 0 ${px + pr} ${py} A ${pr} ${pr} 0 1 0 ${px - pr} ${py} Z`, fill: '#fff' });
    // Ring (ellipse represented as arc path)
    paths.push({ id: `p${n++}`, d: `M ${px - 110} ${py} A 110 28 0 0 1 ${px + 110} ${py} A 110 28 0 0 1 ${px - 110} ${py} Z`, fill: '#fff' });

    // Moon
    paths.push({ id: `p${n++}`, d: `M ${150 - 35} 90 A 35 35 0 1 0 ${150 + 35} 90 A 35 35 0 1 0 ${150 - 35} 90 Z`, fill: '#fff' });
    // Moon craters
    [[140, 80], [165, 100], [150, 115]].forEach(([cx, cy]) =>
        paths.push({ id: `p${n++}`, d: `M ${cx - 8} ${cy} A 8 8 0 1 0 ${cx + 8} ${cy} A 8 8 0 1 0 ${cx - 8} ${cy} Z`, fill: '#fff' })
    );

    // Rocket ship
    const rx = 380, ry = 200;
    paths.push({ id: `p${n++}`, d: `M ${rx} ${ry - 80} L ${rx + 25} ${ry + 40} L ${rx - 25} ${ry + 40} Z`, fill: '#fff' }); // body
    paths.push({ id: `p${n++}`, d: `M ${rx} ${ry - 80} Q ${rx + 12} ${ry - 110} ${rx} ${ry - 130} Q ${rx - 12} ${ry - 110} ${rx} ${ry - 80} Z`, fill: '#fff' }); // nose
    paths.push({ id: `p${n++}`, d: `M ${rx - 25} ${ry + 20} L ${rx - 50} ${ry + 50} L ${rx - 25} ${ry + 40} Z`, fill: '#fff' }); // left wing
    paths.push({ id: `p${n++}`, d: `M ${rx + 25} ${ry + 20} L ${rx + 50} ${ry + 50} L ${rx + 25} ${ry + 40} Z`, fill: '#fff' }); // right wing
    paths.push({ id: `p${n++}`, d: `M ${rx - 10} ${ry - 30} A 10 10 0 1 0 ${rx + 10} ${ry - 30} A 10 10 0 1 0 ${rx - 10} ${ry - 30} Z`, fill: '#fff' }); // window
    // Flame
    paths.push({ id: `p${n++}`, d: `M ${rx - 15} ${ry + 40} Q ${rx} ${ry + 100} ${rx + 15} ${ry + 40} Z`, fill: '#fff' });

    // Stars (varied sizes)
    [[60, 40], [200, 20], [450, 50], [700, 60], [100, 200], [300, 100], [620, 250], [720, 150], [480, 300], [50, 350]].forEach(([sx, sy]) => {
        const r = 3 + Math.floor((sx * sy) % 5);
        paths.push({ id: `p${n++}`, d: `M ${sx} ${sy - r} L ${sx + r * 0.4} ${sy - r * 0.4} L ${sx + r} ${sy} L ${sx + r * 0.4} ${sy + r * 0.4} L ${sx} ${sy + r} L ${sx - r * 0.4} ${sy + r * 0.4} L ${sx - r} ${sy} L ${sx - r * 0.4} ${sy - r * 0.4} Z`, fill: '#fff' });
    });

    // Alien planet (bottom)
    paths.push({ id: `p${n++}`, d: 'M 0 480 Q 200 440 400 480 Q 600 520 800 480 V 600 H 0 Z', fill: '#fff' });
    // Craters on planet surface
    [[120, 520], [300, 500], [550, 525], [700, 510]].forEach(([cx, cy]) =>
        paths.push({ id: `p${n++}`, d: `M ${cx - 25} ${cy} A 25 10 0 0 1 ${cx + 25} ${cy} A 25 10 0 0 1 ${cx - 25} ${cy} Z`, fill: '#fff' })
    );

    // Satellite
    paths.push({ id: `p${n++}`, d: 'M 260 50 H 320 V 70 H 260 Z', fill: '#fff' }); // body
    paths.push({ id: `p${n++}`, d: 'M 220 55 H 260 V 65 H 220 Z', fill: '#fff' }); // left panel
    paths.push({ id: `p${n++}`, d: 'M 320 55 H 360 V 65 H 320 Z', fill: '#fff' }); // right panel

    return paths;
}

// ─── SCENE: Animal Faces ──────────────────────────────────────────────────────
function buildAnimals(): { id: string; d: string; fill: string }[] {
    const paths: { id: string; d: string; fill: string }[] = [];
    let n = 0;
    // Background
    paths.push({ id: `p${n++}`, d: 'M 0 0 H 800 V 600 H 0 Z', fill: '#fff' });

    // Lion face
    function lion(cx: number, cy: number) {
        // Mane (outer ring)
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const mx = cx + 100 * Math.cos(a), my = cy + 100 * Math.sin(a);
            paths.push({ id: `p${n++}`, d: `M ${cx + 75 * Math.cos(a)} ${cy + 75 * Math.sin(a)} L ${mx - 10 * Math.sin(a)} ${my + 10 * Math.cos(a)} L ${mx} ${my} L ${mx + 10 * Math.sin(a)} ${my - 10 * Math.cos(a)} Z`, fill: '#fff' });
        }
        // Face
        paths.push({ id: `p${n++}`, d: `M ${cx - 75} ${cy} A 75 75 0 1 0 ${cx + 75} ${cy} A 75 75 0 1 0 ${cx - 75} ${cy} Z`, fill: '#fff' });
        // Eyes
        [[-28, -20], [28, -20]].forEach(([ox, oy]) => {
            paths.push({ id: `p${n++}`, d: `M ${cx + ox - 14} ${cy + oy} A 14 14 0 1 0 ${cx + ox + 14} ${cy + oy} A 14 14 0 1 0 ${cx + ox - 14} ${cy + oy} Z`, fill: '#fff' });
        });
        // Nose (triangle)
        paths.push({ id: `p${n++}`, d: `M ${cx} ${cy + 10} L ${cx - 16} ${cy + 32} L ${cx + 16} ${cy + 32} Z`, fill: '#fff' });
        // Mouth
        const mouthD = `M ${cx - 25} ${cy + 35} Q ${cx - 10} ${cy + 50} ${cx} ${cy + 42} Q ${cx + 10} ${cy + 50} ${cx + 25} ${cy + 35}`;
        paths.push({ id: `p${n++}`, d: mouthD, fill: '#fff' });
        // Ears
        [[-65, -55], [65, -55]].forEach(([ox, oy]) => {
            paths.push({ id: `p${n++}`, d: `M ${cx + ox} ${cy + oy} L ${cx + ox - 15 * Math.sign(ox)} ${cy + oy - 25} L ${cx + ox + 15 * Math.sign(ox)} ${cy + oy - 25} Z`, fill: '#fff' });
        });
        // Whisker lines (as thin rects)
        [[-75, -8], [-75, 8], [-75, 24], [75, -8], [75, 8], [75, 24]].forEach(([ox, oy]) =>
            paths.push({ id: `p${n++}`, d: `M ${cx} ${cy + oy} L ${cx + ox} ${cy + oy - 2} L ${cx + ox} ${cy + oy + 2} Z`, fill: '#fff' })
        );
    }

    // Owl face
    function owl(cx: number, cy: number) {
        // Body
        paths.push({ id: `p${n++}`, d: `M ${cx - 60} ${cy + 50} Q ${cx - 70} ${cy + 150} ${cx} ${cy + 160} Q ${cx + 70} ${cy + 150} ${cx + 60} ${cy + 50} A 60 100 0 0 0 ${cx - 60} ${cy + 50} Z`, fill: '#fff' });
        // Head
        paths.push({ id: `p${n++}`, d: `M ${cx - 60} ${cy + 50} A 60 60 0 1 1 ${cx + 60} ${cy + 50} Z`, fill: '#fff' });
        // Ear tufts
        paths.push({ id: `p${n++}`, d: `M ${cx - 40} ${cy - 10} L ${cx - 55} ${cy - 45} L ${cx - 20} ${cy - 20} Z`, fill: '#fff' });
        paths.push({ id: `p${n++}`, d: `M ${cx + 40} ${cy - 10} L ${cx + 55} ${cy - 45} L ${cx + 20} ${cy - 20} Z`, fill: '#fff' });
        // Eyes (big circles)
        [[-22, 0], [22, 0]].forEach(([ox, oy]) => {
            paths.push({ id: `p${n++}`, d: `M ${cx + ox - 20} ${cy + oy} A 20 20 0 1 0 ${cx + ox + 20} ${cy + oy} A 20 20 0 1 0 ${cx + ox - 20} ${cy + oy} Z`, fill: '#fff' });
        });
        // Beak
        paths.push({ id: `p${n++}`, d: `M ${cx} ${cy + 18} L ${cx - 12} ${cy + 30} L ${cx + 12} ${cy + 30} Z`, fill: '#fff' });
        // Wings
        [[-1, 1], [1, 1]].forEach(([sx]) =>
            paths.push({ id: `p${n++}`, d: `M ${cx + sx * 60} ${cy + 60} Q ${cx + sx * 100} ${cy + 100} ${cx + sx * 85} ${cy + 145} Q ${cx + sx * 50} ${cy + 155} ${cx + sx * 20} ${cy + 130} Z`, fill: '#fff' })
        );
        // Feet
        [[-20, 0], [20, 0]].forEach(([ox]) => {
            for (let t = -1; t <= 1; t++) {
                paths.push({ id: `p${n++}`, d: `M ${cx + ox} ${cy + 160} L ${cx + ox + t * 12} ${cy + 185} L ${cx + ox + t * 12 + 4} ${cy + 185} L ${cx + ox + 4} ${cy + 160} Z`, fill: '#fff' });
            }
        });
    }

    lion(210, 230);
    owl(590, 220);

    // Ground / tree branch
    paths.push({ id: `p${n++}`, d: 'M 450 430 H 800 V 450 Q 700 450 650 430 Q 600 410 550 430 Z', fill: '#fff' });
    paths.push({ id: `p${n++}`, d: 'M 0 450 H 200 V 600 H 0 Z', fill: '#fff' }); // left ground

    return paths;
}

// ─── Scenes registry ──────────────────────────────────────────────────────────
const SCENES: Record<string, () => { id: string; d: string; fill: string }[]> = {
    'Mandala':  buildMandala,
    'Garden':   buildGarden,
    'Ocean':    buildOcean,
    'Castle':   buildCastle,
    'Space':    buildSpace,
    'Animals':  buildAnimals,
};
const SCENE_NAMES = Object.keys(SCENES);

// ─── Engine ───────────────────────────────────────────────────────────────────
export class ColoringEngine implements GameEngine<ColoringState, ColoringAction> {
    constructor() {}

    initialize(): ColoringState {
        const scene = SCENE_NAMES[0];
        return {
            activeColor: COLORS[3],
            colors: COLORS,
            paths: SCENES[scene](),
            scene,
            scenes: SCENE_NAMES,
            isGameOver: false
        };
    }

    update(state: ColoringState, action: ColoringAction): ColoringState {
        const s = { ...state, paths: state.paths.map(p => ({ ...p })) };

        if (action.type === 'SELECT_COLOR') s.activeColor = action.color;

        if (action.type === 'FILL_PATH') {
            const path = s.paths.find(p => p.id === action.pathId);
            if (path) path.fill = s.activeColor;
        }

        if (action.type === 'CLEAR') s.paths.forEach(p => p.fill = '#ffffff');

        if (action.type === 'CHANGE_SCENE') {
            s.scene = action.scene;
            s.paths = SCENES[action.scene]();
        }

        return s;
    }

    evaluateWin(_state: ColoringState): GameResult | null { return null; }
}
