const Logic = require('./logic');

describe('initializePlayerTracking', () => {
    test('initializes all players with zero counts and empty pairings', () => {
        const counts = {};
        const pairings = {};
        Logic.initializePlayerTracking(['Alice', 'Bob', 'Charlie'], counts, pairings);
        expect(counts).toEqual({ Alice: 0, Bob: 0, Charlie: 0 });
        expect(pairings).toEqual({ Alice: {}, Bob: {}, Charlie: {} });
    });

    test('handles empty player list', () => {
        const counts = {};
        const pairings = {};
        Logic.initializePlayerTracking([], counts, pairings);
        expect(counts).toEqual({});
        expect(pairings).toEqual({});
    });

    test('overwrites existing data for same players', () => {
        const counts = { Alice: 5 };
        const pairings = { Alice: { Bob: 3 } };
        Logic.initializePlayerTracking(['Alice'], counts, pairings);
        expect(counts.Alice).toBe(0);
        expect(pairings.Alice).toEqual({});
    });
});

describe('updateMatchTracking', () => {
    test('increments match counts for all players in a match', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Charlie', 'Dave'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        expect(counts.Alice).toBe(1);
        expect(counts.Bob).toBe(1);
        expect(counts.Charlie).toBe(1);
        expect(counts.Dave).toBe(1);
    });

    test('tracks teammate pairings correctly (not opponents)', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Charlie', 'Dave'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        // Alice and Bob were teammates
        expect(pairings.Alice.Bob).toBe(1);
        expect(pairings.Bob.Alice).toBe(1);
        // Charlie and Dave were teammates
        expect(pairings.Charlie.Dave).toBe(1);
        expect(pairings.Dave.Charlie).toBe(1);
        // Opponents should NOT be tracked
        expect(pairings.Alice.Charlie).toBeUndefined();
        expect(pairings.Alice.Dave).toBeUndefined();
        expect(pairings.Bob.Charlie).toBeUndefined();
        expect(pairings.Charlie.Alice).toBeUndefined();
    });

    test('accumulates counts across multiple matches', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Charlie', 'Dave'] },
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Eve', 'Frank'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        expect(counts.Alice).toBe(2);
        expect(counts.Bob).toBe(2);
        expect(pairings.Alice.Bob).toBe(2);
    });

    test('handles multiple courts', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['A', 'B'], teamTwo: ['C', 'D'] },
            { court: 2, teamOne: ['E', 'F'], teamTwo: ['G', 'H'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        expect(Object.keys(counts)).toHaveLength(8);
        expect(pairings.A.B).toBe(1);
        expect(pairings.E.F).toBe(1);
        // No cross-court pairings
        expect(pairings.A.E).toBeUndefined();
    });
});

describe('sortPlayersByMatchCounts', () => {
    test('sorts players by ascending match count', () => {
        const counts = { Alice: 3, Bob: 1, Charlie: 2 };
        const result = Logic.sortPlayersByMatchCounts(['Alice', 'Bob', 'Charlie'], counts);
        expect(result).toEqual(['Bob', 'Charlie', 'Alice']);
    });

    test('preserves relative order for equal counts', () => {
        const counts = { Alice: 1, Bob: 1, Charlie: 1 };
        const result = Logic.sortPlayersByMatchCounts(['Alice', 'Bob', 'Charlie'], counts);
        expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('treats missing counts as 0', () => {
        const counts = { Alice: 2 };
        const result = Logic.sortPlayersByMatchCounts(['Alice', 'Bob'], counts);
        expect(result).toEqual(['Bob', 'Alice']);
    });

    test('does not mutate original array', () => {
        const counts = { Alice: 2, Bob: 1 };
        const original = ['Alice', 'Bob'];
        Logic.sortPlayersByMatchCounts(original, counts);
        expect(original).toEqual(['Alice', 'Bob']);
    });
});

describe('shuffleArray', () => {
    test('preserves all elements', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const copy = [...arr];
        Logic.shuffleArray(arr);
        expect(arr.sort()).toEqual(copy.sort());
    });

    test('preserves array length', () => {
        const arr = [1, 2, 3, 4, 5];
        Logic.shuffleArray(arr);
        expect(arr).toHaveLength(5);
    });

    test('handles empty array', () => {
        const arr = [];
        Logic.shuffleArray(arr);
        expect(arr).toEqual([]);
    });

    test('handles single element', () => {
        const arr = [42];
        Logic.shuffleArray(arr);
        expect(arr).toEqual([42]);
    });
});

describe('formatPlayerName', () => {
    test('uppercases first name and keeps surname as-is', () => {
        expect(Logic.formatPlayerName('John Smith')).toBe('JOHN Smith');
    });

    test('handles single name by uppercasing entirely', () => {
        expect(Logic.formatPlayerName('Madonna')).toBe('MADONNA');
    });

    test('handles multiple surnames', () => {
        expect(Logic.formatPlayerName('John van der Berg')).toBe('JOHN van der Berg');
    });

    test('handles already uppercased name', () => {
        expect(Logic.formatPlayerName('ALICE BOB')).toBe('ALICE BOB');
    });
});

describe('compareArrays', () => {
    test('returns true for identical arrays', () => {
        expect(Logic.compareArrays([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    test('returns false for different arrays', () => {
        expect(Logic.compareArrays([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    test('returns false for different lengths', () => {
        expect(Logic.compareArrays([1, 2], [1, 2, 3])).toBe(false);
    });

    test('returns true for empty arrays', () => {
        expect(Logic.compareArrays([], [])).toBe(true);
    });

    test('returns true for string arrays', () => {
        expect(Logic.compareArrays(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    test('is order-sensitive', () => {
        expect(Logic.compareArrays([1, 2], [2, 1])).toBe(false);
    });

    test('handles null comparison via JSON', () => {
        expect(Logic.compareArrays(null, null)).toBe(true);
    });
});

describe('calculateAverageMatchCount', () => {
    test('returns average of positive counts', () => {
        expect(Logic.calculateAverageMatchCount({ A: 2, B: 4, C: 6 })).toBe(4);
    });

    test('ignores zero counts', () => {
        expect(Logic.calculateAverageMatchCount({ A: 0, B: 4, C: 6 })).toBe(5);
    });

    test('returns 0 for all-zero counts', () => {
        expect(Logic.calculateAverageMatchCount({ A: 0, B: 0 })).toBe(0);
    });

    test('returns 0 for empty object', () => {
        expect(Logic.calculateAverageMatchCount({})).toBe(0);
    });

    test('rounds to nearest integer', () => {
        expect(Logic.calculateAverageMatchCount({ A: 3, B: 4 })).toBe(4); // 3.5 rounds to 4
    });
});

describe('initializeNewPlayers', () => {
    test('new players get average match count', () => {
        const counts = { Alice: 4, Bob: 6 };
        const pairings = { Alice: {}, Bob: {} };
        Logic.initializeNewPlayers(['Alice', 'Bob', 'Charlie'], counts, pairings);
        expect(counts.Charlie).toBe(5); // average of 4 and 6
        expect(pairings.Charlie).toEqual({});
    });

    test('does not overwrite existing player counts', () => {
        const counts = { Alice: 4, Bob: 6 };
        const pairings = { Alice: { Bob: 2 }, Bob: { Alice: 2 } };
        Logic.initializeNewPlayers(['Alice', 'Bob'], counts, pairings);
        expect(counts.Alice).toBe(4);
        expect(counts.Bob).toBe(6);
        expect(pairings.Alice.Bob).toBe(2);
    });

    test('new players get 0 when no one has played', () => {
        const counts = {};
        const pairings = {};
        Logic.initializeNewPlayers(['Alice', 'Bob'], counts, pairings);
        expect(counts.Alice).toBe(0);
        expect(counts.Bob).toBe(0);
    });

    test('new players get 0 when existing players all have 0', () => {
        const counts = { Alice: 0, Bob: 0 };
        const pairings = { Alice: {}, Bob: {} };
        Logic.initializeNewPlayers(['Alice', 'Bob', 'Charlie'], counts, pairings);
        expect(counts.Charlie).toBe(0);
    });
});

describe('generateMatches', () => {
    test('creates correct number of matches for 8 players', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(2);
        expect(restingPlayers).toHaveLength(0);
    });

    test('puts remaining players in resting for non-multiple-of-4', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(1);
        expect(restingPlayers).toHaveLength(2);
    });

    test('assigns court numbers starting from 1', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches } = Logic.generateMatches(players, counts, pairings);
        expect(matches[0].court).toBe(1);
        expect(matches[1].court).toBe(2);
    });

    test('each match has two teams of two', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches } = Logic.generateMatches(players, counts, pairings);
        expect(matches[0].teamOne).toHaveLength(2);
        expect(matches[0].teamTwo).toHaveLength(2);
    });

    test('all players appear exactly once across matches and resting', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        const allAssigned = [
            ...matches.flatMap(m => [...m.teamOne, ...m.teamTwo]),
            ...restingPlayers
        ];
        expect(allAssigned.sort()).toEqual(players.sort());
    });

    test('avoids repeat teammate pairings when possible', () => {
        const counts = { A: 1, B: 1, C: 1, D: 1 };
        const pairings = { A: { B: 1 }, B: { A: 1 }, C: {}, D: {} };
        // A and B have been teammates before, algorithm should try to separate them
        const { matches } = Logic.generateMatches(['A', 'B', 'C', 'D'], counts, pairings);
        const match = matches[0];
        // A and B should not be on the same team
        const aTeam = match.teamOne.includes('A') ? match.teamOne : match.teamTwo;
        expect(aTeam).not.toContain('B');
    });

    test('handles fewer than 4 players (all rest)', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(0);
        expect(restingPlayers).toHaveLength(3);
    });

    test('handles exactly 4 players', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(1);
        expect(restingPlayers).toHaveLength(0);
    });

    test('handles empty player list', () => {
        const { matches, restingPlayers } = Logic.generateMatches([], {}, {});
        expect(matches).toHaveLength(0);
        expect(restingPlayers).toHaveLength(0);
    });

    test('prioritizes players with fewer matches', () => {
        const counts = { A: 0, B: 0, C: 0, D: 0, E: 5 };
        const pairings = { A: {}, B: {}, C: {}, D: {}, E: {} };
        const { matches, restingPlayers } = Logic.generateMatches(
            ['A', 'B', 'C', 'D', 'E'], counts, pairings
        );
        // E has the most matches, should be resting
        expect(restingPlayers).toContain('E');
    });
});

describe('validatePlayerName', () => {
    test('rejects empty name', () => {
        const result = Logic.validatePlayerName('', ['Alice'], '');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('empty');
    });

    test('rejects whitespace-only name', () => {
        const result = Logic.validatePlayerName('   ', ['Alice'], '');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('empty');
    });

    test('rejects null name', () => {
        const result = Logic.validatePlayerName(null, ['Alice'], '');
        expect(result.valid).toBe(false);
    });

    test('rejects duplicate name (case-insensitive)', () => {
        const result = Logic.validatePlayerName('alice', ['Alice', 'Bob'], '');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('already exists');
    });

    test('allows same name when editing that player', () => {
        const result = Logic.validatePlayerName('Alice', ['Alice', 'Bob'], '0');
        expect(result.valid).toBe(true);
    });

    test('rejects duplicate when editing a different player', () => {
        const result = Logic.validatePlayerName('Bob', ['Alice', 'Bob'], '0');
        expect(result.valid).toBe(false);
    });

    test('accepts valid unique name', () => {
        const result = Logic.validatePlayerName('Charlie', ['Alice', 'Bob'], '');
        expect(result.valid).toBe(true);
    });
});

describe('parsePlayerList', () => {
    test('splits by newlines and trims', () => {
        expect(Logic.parsePlayerList('Alice\nBob\nCharlie')).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('filters empty lines', () => {
        expect(Logic.parsePlayerList('Alice\n\nBob\n\n')).toEqual(['Alice', 'Bob']);
    });

    test('trims whitespace from names', () => {
        expect(Logic.parsePlayerList('  Alice  \n  Bob  ')).toEqual(['Alice', 'Bob']);
    });

    test('handles single player', () => {
        expect(Logic.parsePlayerList('Alice')).toEqual(['Alice']);
    });

    test('handles empty string', () => {
        expect(Logic.parsePlayerList('')).toEqual([]);
    });

    test('handles Windows-style line endings', () => {
        expect(Logic.parsePlayerList('Alice\r\nBob\r\nCharlie')).toEqual(['Alice', 'Bob', 'Charlie']);
    });
});

describe('Integration: mid-session player fairness', () => {
    test('new players joining mid-session do not dominate match creation', () => {
        const counts = {};
        const pairings = {};
        const originalPlayers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        Logic.initializePlayerTracking(originalPlayers, counts, pairings);

        // Simulate 3 rounds of matches
        for (let round = 0; round < 3; round++) {
            const result = Logic.generateMatches(originalPlayers, counts, pairings);
            Logic.updateMatchTracking(result.matches, counts, pairings);
        }

        // Now add 2 new players mid-session
        const allPlayers = [...originalPlayers, 'NewPlayer1', 'NewPlayer2'];
        Logic.initializeNewPlayers(allPlayers, counts, pairings);

        // New players should have the average count, not 0
        expect(counts.NewPlayer1).toBe(3); // average of 3 matches each
        expect(counts.NewPlayer2).toBe(3);

        // Generate matches — new players should NOT always be picked first
        const result = Logic.generateMatches(allPlayers, counts, pairings);
        const playingPlayers = result.matches.flatMap(m => [...m.teamOne, ...m.teamTwo]);

        // With avg count = 3, new players are on equal footing — they won't always play
        // At least verify the result is valid
        const allAssigned = [...playingPlayers, ...result.restingPlayers];
        expect(allAssigned.sort()).toEqual(allPlayers.sort());
    });
});
