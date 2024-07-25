class Player {
    socketId: string;
    name: string;
    role: 'spectator' | 'player';
    readiness: boolean;

    constructor(socketId: string, name: string) {
        this.socketId = socketId;
        this.name = name;
        this.role = 'spectator';
        this.readiness = false;
    }
}


class Scoreboard {
    player: Player;
    ones: number | null;
    twos: number | null;
    threes: number | null;
    fours: number | null;
    fives: number | null;
    sixes: number | null;
    bonus: number | null;
    threeOfAKind: number | null;
    fourOfAKind: number | null;
    fullHouse: number | null;
    smallStraight: number | null;
    largeStraight: number | null;
    yahtzee: number | null;
    chance: number | null;
    total: number | null;

    constructor(player: Player) {
        this.player = player;
        this.ones = null;
        this.twos = null;
        this.threes = null;
        this.fours = null;
        this.fives = null;
        this.sixes = null;
        this.bonus = null;
        this.threeOfAKind = null;
        this.fourOfAKind = null;
        this.fullHouse = null;
        this.smallStraight = null;
        this.largeStraight = null;
        this.yahtzee = null;
        this.chance = null;
        this.total = null;
    }

    currentScore(category: string) {
        switch (category) {
            case 'ones': return this.ones;
            case 'twos': return this.twos;
            case 'threes': return this.threes;
            case 'fours': return this.fours;
            case 'fives': return this.fives;
            case 'sixes': return this.sixes;
            case 'bonus': return this.bonus;
            case 'threeOfAKind': return this.threeOfAKind;
            case 'fourOfAKind': return this.fourOfAKind;
            case 'fullHouse': return this.fullHouse;
            case 'smallStraight': return this.smallStraight;
            case 'largeStraight': return this.largeStraight;
            case 'yahtzee': return this.yahtzee;
            case 'chance': return this.chance;
            case 'total': return this.total;
            default: return null;
        }
    }

    setScore(category: string, score: number) {
        switch (category) {
            case 'ones': this.ones = score; break;
            case 'twos': this.twos = score; break;
            case 'threes': this.threes = score; break;
            case 'fours': this.fours = score; break;
            case 'fives': this.fives = score; break;
            case 'sixes': this.sixes = score; break;
            case 'bonus': this.bonus = score; break;
            case 'threeOfAKind': this.threeOfAKind = score; break;
            case 'fourOfAKind': this.fourOfAKind = score; break;
            case 'fullHouse': this.fullHouse = score; break;
            case 'smallStraight': this.smallStraight = score; break;
            case 'largeStraight': this.largeStraight = score; break;
            case 'yahtzee': this.yahtzee = score; break;
            case 'chance': this.chance = score; break;
            case 'total': this.total = score; break;
        }
    }

    settleScores() {
        const upperScore = this.ones! + this.twos! + this.threes! + this.fours! + this.fives! + this.sixes!;
        this.bonus = upperScore >= 63 ? 35 : 0;
        const lowerScore = this.threeOfAKind! + this.fourOfAKind! + this.fullHouse! + this.smallStraight! + this.largeStraight! + this.yahtzee! + this.chance!;
        this.total = upperScore + this.bonus! + lowerScore;
    }
}

class Game {
    dice: number[];
    kept: number[];
    rollsLeft: number;
    scoreboards: Scoreboard[];
    suggestions: Scoreboard[];
    sequence: Player[];

    constructor() {
        this.dice = [0, 0, 0, 0, 0];
        this.kept = [];
        this.rollsLeft = 3;
        this.scoreboards = [];
        this.suggestions = [];
        this.sequence = [];
    }

    addPlayer(player: Player) {
        this.scoreboards.push(new Scoreboard(player));
        this.suggestions.push(new Scoreboard(player));
        this.sequence = Array(13).fill([...this.sequence.slice(0, Math.floor(this.sequence.length / 13)), player]).flat();
    }

    removePlayer(socketId: string) {
        this.scoreboards = this.scoreboards.filter(s => s.player.socketId !== socketId);
        this.suggestions = this.suggestions.filter(s => s.player.socketId !== socketId);
        this.sequence = this.sequence.filter(p => p.socketId !== socketId);
    }

    ended() {
        return this.sequence.length === 0;
    }

    currentPlayer() {
        return this.sequence[0] || null;
    }

    reroll() {
        if (this.rollsLeft === 0) {
            return;
        } else if (this.rollsLeft === 3) {
            this.dice = this._reroll(this.dice, []);
        } else {
            if (this.kept.length > 5 || this.kept.find(k => k < 0 || k > 4)) {
                return;
            }
            this.dice = this._reroll(this.dice, this.kept);
        }
        this.rollsLeft--;
        this._updateSuggestions();
    }

    score(category: string) {
        if (this.rollsLeft === 3) {
            return;
        }

        if (this.scoreboards.find(s => s.player === this.currentPlayer())!.currentScore(category) !== null) {
            return;
        }

        const currentScore = this._categoryScore(category);
        this.scoreboards.find(s => s.player === this.currentPlayer())!.setScore(category, currentScore);
        this._clearSuggestions();
        this.sequence.shift();
        this.rollsLeft = 3;
        // this.dice = [0, 0, 0, 0, 0];
        this.kept = [];
    }

    private _reroll(dice: number[], kept: number[]) {
        return dice.map((d, i) => kept.includes(i) ? d : Math.floor(Math.random() * 6) + 1);
    }

    private _categoryScore(category: string) {
        const diceCounts = this.dice.reduce((acc, d) => {
            acc[d]++;
            return acc;
        }, [0, 0, 0, 0, 0, 0, 0]);
        const diceSum = this.dice.reduce((acc, d) => acc + d, 0);
        diceCounts[0] = 0;

        switch (category) {
            case 'ones': return diceCounts[1] * 1;
            case 'twos': return diceCounts[2] * 2;
            case 'threes': return diceCounts[3] * 3;
            case 'fours': return diceCounts[4] * 4;
            case 'fives': return diceCounts[5] * 5;
            case 'sixes': return diceCounts[6] * 6;
            case 'threeOfAKind': return diceCounts.some(c => c >= 3) ? diceSum : 0;
            case 'fourOfAKind': return diceCounts.some(c => c >= 4) ? diceSum : 0;
            case 'fullHouse': return diceCounts.some(c => c === 2) && diceCounts.some(c => c === 3) ? 25 : 0;
            case 'smallStraight': return diceCounts.slice(1, 5).every(c => c >= 1) || diceCounts.slice(2, 6).every(c => c >= 1) ? 30 : 0;
            case 'largeStraight': return diceCounts.slice(1, 6).every(c => c >= 1) ? 40 : 0;
            case 'yahtzee': return diceCounts.some(c => c === 5) ? 50 : 0;
            case 'chance': return diceSum;
            default: return 0;
        }
    }

    private _clearSuggestions() {
        this.suggestions.forEach(s => {
            s.ones = null;
            s.twos = null;
            s.threes = null;
            s.fours = null;
            s.fives = null;
            s.sixes = null;
            s.bonus = null;
            s.threeOfAKind = null;
            s.fourOfAKind = null;
            s.fullHouse = null;
            s.smallStraight = null;
            s.largeStraight = null;
            s.yahtzee = null;
            s.chance = null;
            s.total = null;
        });
    }

    private _updateSuggestions() {
        const currentPlayer = this.currentPlayer();
        const currentSuggestions = this.suggestions.find(s => s.player === currentPlayer)!;
        currentSuggestions.ones = this._categoryScore('ones');
        currentSuggestions.twos = this._categoryScore('twos');
        currentSuggestions.threes = this._categoryScore('threes');
        currentSuggestions.fours = this._categoryScore('fours');
        currentSuggestions.fives = this._categoryScore('fives');
        currentSuggestions.sixes = this._categoryScore('sixes');
        currentSuggestions.threeOfAKind = this._categoryScore('threeOfAKind');
        currentSuggestions.fourOfAKind = this._categoryScore('fourOfAKind');
        currentSuggestions.fullHouse = this._categoryScore('fullHouse');
        currentSuggestions.smallStraight = this._categoryScore('smallStraight');
        currentSuggestions.largeStraight = this._categoryScore('largeStraight');
        currentSuggestions.yahtzee = this._categoryScore('yahtzee');
        currentSuggestions.chance = this._categoryScore('chance');
    }    


}

class Room {
    messages: string[];
    players: Player[];
    game: Game;
    active: boolean;

    constructor() {
        this.messages = [];
        this.players = [];
        this.active = false;
        this.game = new Game();
    }

    join(player: Player) {
        if (this.players.find(p => p.socketId === player.socketId)) {
            return;
        }

        if (this.players.find(p => p.name === player.name)) {
            return;
        }

        this.players.push(player);
        this.messages.push(`${player.name} joined the room`);
    }

    leave(socketId: string) {
        const playerName = this.players.find(p => p.socketId === socketId)!.name;
        this.players = this.players.filter(p => p.socketId !== socketId);
        this.game.removePlayer(socketId);

        if (this.players.length === 0) {
            this.active = false;
            this.game = new Game();
        } else if (this.game.ended()) {
            this.active = false;
            this.setAllPlayersUnready();
            this.game.scoreboards.forEach(s => s.settleScores());
        }

        this.messages.push(`${playerName} left the room`);
    }

    myPlayer(socketId: string) {
        return this.players.find(p => p.socketId === socketId);
    }

    switchRole(socketId: string) {
        if (this.active) {
            return;
        }

        const player = this.players.find(p => p.socketId === socketId)!;
        player.role = player.role === 'player' ? 'spectator' : 'player';

        player.readiness = false;
    }

    ready(socketId: string) {
        if (this.active) {
            return;
        }

        const player = this.players.find(p => p.socketId === socketId)!;
        if (player.role === 'spectator') {
            return;
        }

        player.readiness = !player.readiness;

        if (this.allPlayersReady()) {
            this.active = true;
            this.messages.push('Game is starting');
            this.game = new Game();
            this.players.filter(p => p.role === 'player').forEach(p => this.game.addPlayer(p));
        }
    }

    keep(socketId: string, idx: number) {
        if (!this.active) {
            return;
        }

        const player = this.players.find(p => p.socketId === socketId)!;
        if (player !== this.game.currentPlayer()) {
            return;
        }

        if (this.game.rollsLeft === 3) {
            return;
        }

        console.log('keeping/unkeeping', idx);

        const kept = this.game.kept;
        if (kept.includes(idx)) {
            this.game.kept = kept.filter(k => k !== idx);
        } else {
            this.game.kept = [...kept, idx];
        }
    }

    reroll(socketId: string) {
        if (!this.active) {
            return;
        }

        const player = this.players.find(p => p.socketId === socketId)!;
        if (player !== this.game.currentPlayer()) {
            return;
        }

        this.game.reroll();
    }

    score(socketId: string, category: string) {
        if (!this.active) {
            return;
        }

        const player = this.players.find(p => p.socketId === socketId)!;
        if (player !== this.game.currentPlayer()) {
            return;
        }
        
        this.game.score(category);

        if (this.game.ended()) {
            this.messages.push('Game has ended');
            this.setAllPlayersUnready();
            this.active = false;
            this.game.scoreboards.forEach(s => s.settleScores());
        }
    }

    private allPlayersReady() {
        const players = this.players.filter(p => p.role === 'player');
        return players.every(p => p.readiness);
    }

    private setAllPlayersUnready() {
        this.players.forEach(p => p.readiness = false);
    }

}



export { Player, Scoreboard, Game, Room };