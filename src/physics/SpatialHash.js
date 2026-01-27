export default class SpatialHash {
    /**
     * Spatial partitioning for efficient broad-phase collision detection
     * Divides space into uniform grid cells and hashes them
     */
    constructor(cellSize = 50) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    /**
     * Hash function to convert 2D cell coordinates to 1D key
     * Uses a combination of prime number multiplication for better distribution
     */
    hashKey(x, y) {
        // Use prime numbers for better distribution
        const p1 = 73856093;
        const p2 = 19349663;
        // Use bitwise OR to convert to integer, but handle potential overflow
        // by taking modulo with a large prime first
        const hash = (x * p1 + y * p2);
        return hash | 0;  // Convert to 32-bit integer
    }

    /**
     * Get cell coordinates for a point
     */
    getCellCoords(x, y) {
        return {
            x: Math.floor(x / this.cellSize),
            y: Math.floor(y / this.cellSize)
        };
    }

    /**
     * Insert a body into the spatial hash
     */
    insert(body) {
        const cells = this.getCellsForBody(body);
        cells.forEach(key => {
            if (!this.cells.has(key)) {
                this.cells.set(key, []);
            }
            this.cells.get(key).push(body);
        });
    }

    /**
     * Get all cells that a body occupies
     */
    getCellsForBody(body) {
        const keys = new Set();

        // Ensure body has a valid ID (should be set by addBody)
        if (body.id === undefined) {
            console.warn('Body without ID in spatial hash');
            return Array.from(keys);
        }

        if (body.shape === 'circle') {
            // Get bounding box of circle
            const minX = body.position.x - body.radius;
            const maxX = body.position.x + body.radius;
            const minY = body.position.y - body.radius;
            const maxY = body.position.y + body.radius;

            const minCell = this.getCellCoords(minX, minY);
            const maxCell = this.getCellCoords(maxX, maxY);

            for (let x = minCell.x; x <= maxCell.x; x++) {
                for (let y = minCell.y; y <= maxCell.y; y++) {
                    keys.add(this.hashKey(x, y));
                }
            }
        } else if (body.shape === 'rectangle') {
            const halfW = body.width / 2;
            const halfH = body.height / 2;
            const minX = body.position.x - halfW;
            const maxX = body.position.x + halfW;
            const minY = body.position.y - halfH;
            const maxY = body.position.y + halfH;

            const minCell = this.getCellCoords(minX, minY);
            const maxCell = this.getCellCoords(maxX, maxY);

            for (let x = minCell.x; x <= maxCell.x; x++) {
                for (let y = minCell.y; y <= maxCell.y; y++) {
                    keys.add(this.hashKey(x, y));
                }
            }
        }

        return Array.from(keys);
    }

    /**
     * Get potential collision pairs (broad phase)
     */
    getPotentialPairs(bodies) {
        this.clear();

        // Insert all bodies
        bodies.forEach(body => this.insert(body));

        // Find pairs
        const pairs = [];
        const checked = new Set();

        this.cells.forEach(cellBodies => {
            for (let i = 0; i < cellBodies.length; i++) {
                for (let j = i + 1; j < cellBodies.length; j++) {
                    const bodyA = cellBodies[i];
                    const bodyB = cellBodies[j];

                    // Create unique pair ID
                    const pairId = bodyA.id < bodyB.id
                        ? `${bodyA.id}-${bodyB.id}`
                        : `${bodyB.id}-${bodyA.id}`;

                    if (!checked.has(pairId)) {
                        checked.add(pairId);
                        pairs.push({ bodyA, bodyB });
                    }
                }
            }
        });

        return pairs;
    }

    /**
     * Clear all cells
     */
    clear() {
        this.cells.clear();
    }
}
