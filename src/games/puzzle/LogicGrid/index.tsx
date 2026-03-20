import React, { useState } from 'react';

// --- Static Logic Grid Puzzle data ---
// A logic grid puzzle: match people/items to attributes
interface LogicPuzzle {
    title: string;
    categories: { name: string; items: string[] }[];
    clues: string[];
    solution: Record<string, Record<string, string>>; // e.g. { Alice: { color: 'Red', pet: 'Cat' } }
}

const PUZZLES: LogicPuzzle[] = [
    {
        title: 'Who has which pet?',
        categories: [
            { name: 'Person', items: ['Alice', 'Bob', 'Carol'] },
            { name: 'Pet', items: ['Cat', 'Dog', 'Fish'] },
            { name: 'Color', items: ['Red', 'Blue', 'Green'] }
        ],
        clues: [
            '1. Alice does not have the Cat.',
            '2. The person with the Dog wears Blue.',
            '3. Carol wears Green.',
            '4. Bob does not wear Red.',
            '5. The person with the Fish wears Red.',
        ],
        solution: {
            Alice: { Pet: 'Dog', Color: 'Blue' },
            Bob:   { Pet: 'Fish', Color: 'Red' },
            Carol: { Pet: 'Cat', Color: 'Green' }
        }
    },
    {
        title: 'Match the jobs!',
        categories: [
            { name: 'Person', items: ['Emma', 'Liam', 'Nina'] },
            { name: 'Job', items: ['Doctor', 'Chef', 'Teacher'] },
            { name: 'City', items: ['NYC', 'LA', 'Chicago'] }
        ],
        clues: [
            '1. Emma is not a Doctor.',
            '2. The Chef lives in LA.',
            '3. Liam lives in Chicago.',
            '4. Nina is not a Teacher.',
            '5. The Doctor lives in NYC.',
        ],
        solution: {
            Emma:  { Job: 'Chef', City: 'LA' },
            Liam:  { Job: 'Teacher', City: 'Chicago' },
            Nina:  { Job: 'Doctor', City: 'NYC' }
        }
    }
];

export default function LogicGrid() {
    const [puzzleIdx] = useState(() => Math.floor(Math.random() * PUZZLES.length));
    const puzzle = PUZZLES[puzzleIdx];

    const people = puzzle.categories[0].items;
    const otherCats = puzzle.categories.slice(1);

    // selections[personIdx][catIdx] = item string or ''
    const [selections, setSelections] = useState<string[][]>(() =>
        people.map(() => otherCats.map(() => ''))
    );
    const [submitted, setSubmitted] = useState(false);
    const [correct, setCorrect] = useState<boolean | null>(null);

    const handleChange = (pi: number, ci: number, val: string) => {
        if (submitted) return;
        setSelections(prev => {
            const next = prev.map(r => [...r]);
            next[pi][ci] = val;
            return next;
        });
    };

    const handleSubmit = () => {
        let allCorrect = true;
        for (let pi = 0; pi < people.length; pi++) {
            const person = people[pi];
            for (let ci = 0; ci < otherCats.length; ci++) {
                const cat = otherCats[ci].name;
                if (selections[pi][ci] !== puzzle.solution[person]?.[cat]) {
                    allCorrect = false;
                }
            }
        }
        setCorrect(allCorrect);
        setSubmitted(true);
    };

    const reset = () => {
        setSelections(people.map(() => otherCats.map(() => '')));
        setSubmitted(false);
        setCorrect(null);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-emerald-950 to-zinc-950 text-zinc-100 font-sans gap-6">
            
            <h1 className="text-4xl font-black tracking-widest uppercase text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">Logic Grid</h1>
            <h2 className="text-lg font-bold text-zinc-300 -mt-3">{puzzle.title}</h2>

            {/* Clue Panel */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 max-w-lg w-full">
                <div className="text-xs text-emerald-400 uppercase tracking-widest font-bold mb-3">Clues</div>
                {puzzle.clues.map((clue, i) => (
                    <div key={i} className="text-sm text-zinc-300 mb-1">{clue}</div>
                ))}
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto w-full max-w-lg">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="bg-zinc-900 border border-zinc-700 p-2 text-emerald-400 text-xs uppercase tracking-widest text-left">Person</th>
                            {otherCats.map(cat => (
                                <th key={cat.name} className="bg-zinc-900 border border-zinc-700 p-2 text-emerald-400 text-xs uppercase tracking-widest">{cat.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {people.map((person, pi) => (
                            <tr key={person}>
                                <td className="bg-zinc-800 border border-zinc-700 px-3 py-2 font-bold text-zinc-200">{person}</td>
                                {otherCats.map((cat, ci) => {
                                    const val = selections[pi][ci];
                                    const isCorrect = submitted && val === puzzle.solution[person]?.[cat.name];
                                    const isWrong = submitted && val !== puzzle.solution[person]?.[cat.name];
                                    return (
                                        <td key={cat.name} className="bg-zinc-900 border border-zinc-700 p-2 text-center">
                                            <select
                                                value={val}
                                                onChange={e => handleChange(pi, ci, e.target.value)}
                                                disabled={submitted}
                                                className={`bg-zinc-800 border rounded px-2 py-1 text-sm font-bold outline-none transition-colors ${
                                                    isCorrect ? 'border-green-500 text-green-400' :
                                                    isWrong   ? 'border-red-500 text-red-400' :
                                                                'border-zinc-600 text-zinc-200 hover:border-emerald-600'
                                                }`}
                                            >
                                                <option value="">—</option>
                                                {cat.items.map(item => (
                                                    <option key={item} value={item}>{item}</option>
                                                ))}
                                            </select>
                                            {submitted && <span className="ml-1 text-sm">{isCorrect ? '✅' : '❌'}</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Result */}
            {submitted && (
                <div className={`text-xl font-black uppercase tracking-widest ${correct ? 'text-green-400' : 'text-red-400'}`}>
                    {correct ? '🏆 Solved! All correct!' : '❌ Not quite — check the clues again!'}
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
                {!submitted ? (
                    <button onClick={handleSubmit}
                        className="px-10 py-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                        ✅ Check Solution
                    </button>
                ) : (
                    <button onClick={reset}
                        className="px-10 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                        🔄 Reset
                    </button>
                )}
            </div>
        </div>
    );
}
