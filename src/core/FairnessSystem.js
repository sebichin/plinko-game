export default class FairnessSystem {
    constructor() {
        this.serverSeed = this.generateRandomString(32);
        this.clientSeed = 'plinko-player';
        this.nonce = 0;
        // Log seeds for user verification
        console.log(`%c[Fairness] Server Seed: ${this.serverSeed}`, 'color: #4ade80');
        console.log(`%c[Fairness] Client Seed: ${this.clientSeed}`, 'color: #3b82f6');
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = new Uint32Array(length);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    }

    async getNextFloat() {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(this.serverSeed);
        const key = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );

        const msg = `${this.clientSeed}:${this.nonce}`;
        const msgData = encoder.encode(msg);

        const signature = await crypto.subtle.sign('HMAC', key, msgData);
        const hashArray = new Uint8Array(signature);

        // Use first 4 bytes to generate float
        // Equivalent to parseInt(hex.slice(0, 8), 16) / 2^32
        const dataView = new DataView(hashArray.buffer);
        const intVal = dataView.getUint32(0, false); // Big-endian
        const floatVal = intVal / 4294967296;

        // console.log(`[Fairness] Nonce: ${this.nonce} -> Float: ${floatVal.toFixed(6)}`);

        this.nonce++;
        return floatVal;
    }

    setClientSeed(seed) {
        this.clientSeed = seed;
        this.nonce = 0;
        console.log(`[Fairness] Client Seed Updated: ${this.clientSeed}`);
    }

    rotateServerSeed() {
        this.serverSeed = this.generateRandomString(32);
        this.nonce = 0;
        console.log(`[Fairness] Server Seed Rotated: ${this.serverSeed}`);
    }
}
