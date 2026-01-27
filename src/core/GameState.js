class GameState extends EventTarget {
    constructor() {
        super();
        this._balance = 10000;
        this.rowCount = 12;
        this.betAmount = 100;
        this.autoSpeed = 10;
        this.ballSizePercent = 0.35;
        this.ballType = 'STANDARD';
        this.histogramData = [];
    }

    static getInstance() {
        if (!GameState.instance) {
            GameState.instance = new GameState();
        }
        return GameState.instance;
    }

    get balance() { return this._balance; }
    set balance(val) {
        this._balance = val;
        this.dispatchEvent(new Event('balanceChange'));
    }

    resetHistogram(numBuckets) {
        this.histogramData = new Array(numBuckets).fill(0);
    }

    updateHistogram(bucketIndex) {
        if (bucketIndex >= 0 && bucketIndex < this.histogramData.length) {
            this.histogramData[bucketIndex]++;
        }
    }
}

export default GameState;
