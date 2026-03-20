export function getComingSoonMessage(gameName: string, categoryId: string): string {
    const playTheme = [
        `The pieces for ${gameName} are still being carved!`,
        `${gameName} is warming up backstage. Check back soon!`,
        `Our developers are battling bugs in ${gameName} right now...`,
        `Hold onto your controllers, ${gameName} is dropping soon!`,
        `We're still laying the foundation for ${gameName}.`,
    ];

    const categoryJokes: Record<string, string[]> = {
        'board': [
            `The board for ${gameName} is still being sanded and varnished.`,
            `We lost the dice for ${gameName}... finding replacements soon!`,
            `${gameName} pieces are still strategizing their entrance.`,
        ],
        'cards': [
            `Shuffling the deck for ${gameName}... it takes a while!`,
            `The dealer for ${gameName} is currently on a coffee break.`,
            `${gameName} is keeping its cards close to the chest right now.`
        ],
        'puzzle': [
            `We're still figuring out the solution to building ${gameName}.`,
            `The pieces of ${gameName} haven't quite clicked into place yet.`,
            `${gameName} remains a mystery... for now.`
        ],
        'arcade': [
            `Inserting more coins for ${gameName}... please wait!`,
            `The high score table for ${gameName} is being polished.`,
            `${gameName} is currently stuck on Level 1. We're working on it!`
        ],
        'relax': [
            `Take a deep breath. ${gameName} is meditating right now.`,
            `${gameName} is currently soaking in a warm digital bath.`,
            `Patience is key. ${gameName} is blooming slowly.`
        ]
    };

    const jokes = categoryJokes[categoryId] || playTheme;
    const jokeIndex = Math.floor(Math.random() * jokes.length);
    return jokes[jokeIndex];
}
