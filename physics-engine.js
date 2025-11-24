/**
 * Advanced Physics Engine for Plinko Game
 * Implements Semi-Implicit Euler integration, impulse-based collision resolution,
 * and spatial partitioning for optimal performance.
 * 
 * Based on principles of:
 * - Rigid body dynamics
 * - Symplectic integration for energy conservation
 * - Fixed timestep accumulator for deterministic simulation
 * - Impulse-based collision response
 */

class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    mul(s) {
        return new Vec2(this.x * s, this.y * s);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }

    length() {
        return Math.sqrt(this.lengthSquared());
    }

    normalize() {
        const len = this.length();
        return len > 0 ? new Vec2(this.x / len, this.y / len) : new Vec2(0, 0);
    }

    perpendicular() {
        // Returns perpendicular vector (for 2D cross product)
        return new Vec2(-this.y, this.x);
    }

    static distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class RigidBody {
    /**
     * Represents a rigid body with position, velocity, and physical properties
     * State vector: {position, velocity, angle, angularVelocity}
     */
    constructor(shape, x, y, options = {}) {
        // Shape: 'circle' or 'rectangle'
        this.shape = shape;
        
        // State variables
        this.position = new Vec2(x, y);
        this.velocity = new Vec2(0, 0);
        this.angle = 0;
        this.angularVelocity = 0;
        
        // Physical properties
        this.radius = options.radius || 10;
        this.width = options.width || 20;
        this.height = options.height || 20;
        this.mass = options.mass || 1;
        this.density = options.density || 0.008; // Metal density for realistic behavior
        this.restitution = options.restitution !== undefined ? options.restitution : 0.7;
        this.friction = options.friction !== undefined ? options.friction : 0.08;
        this.frictionAir = options.frictionAir !== undefined ? options.frictionAir : 0.005;
        
        // Calculate mass based on density if not explicitly set
        if (options.density && !options.mass) {
            if (shape === 'circle') {
                const area = Math.PI * this.radius * this.radius;
                this.mass = area * this.density;
            } else if (shape === 'rectangle') {
                const area = this.width * this.height;
                this.mass = area * this.density;
            }
        }
        
        // Moment of inertia (resistance to rotation)
        if (shape === 'circle') {
            this.inertia = 0.5 * this.mass * this.radius * this.radius;
        } else {
            this.inertia = (this.mass * (this.width * this.width + this.height * this.height)) / 12;
        }
        
        // Static bodies don't move
        this.isStatic = options.isStatic || false;
        this.isSensor = options.isSensor || false;
        
        // Label and custom data
        this.label = options.label || '';
        this.plugin = options.plugin || {};
        
        // Rendering properties
        this.render = options.render || {
            fillStyle: '#ffffff',
            strokeStyle: '#000000',
            lineWidth: 1
        };
        
        // Collision filter
        this.collisionFilter = options.collisionFilter || { group: 0 };
        
        // Previous state for interpolation
        this.prevPosition = new Vec2(x, y);
        this.prevAngle = 0;
    }

    /**
     * Apply force to the body (adds to acceleration)
     */
    applyForce(force) {
        if (this.isStatic) return;
        // F = ma => a = F/m
        const acceleration = force.mul(1 / this.mass);
        this.velocity = this.velocity.add(acceleration);
    }

    /**
     * Apply impulse (instantaneous velocity change)
     * J = Δp = m * Δv => Δv = J/m
     */
    applyImpulse(impulse, contactPoint = null) {
        if (this.isStatic) return;
        
        // Linear impulse
        this.velocity = this.velocity.add(impulse.mul(1 / this.mass));
        
        // Angular impulse if contact point is provided
        if (contactPoint) {
            const r = contactPoint.sub(this.position);
            const torque = r.x * impulse.y - r.y * impulse.x; // 2D cross product
            this.angularVelocity += torque / this.inertia;
        }
    }

    /**
     * Get velocity at a specific point on the body
     */
    getPointVelocity(point) {
        if (this.isStatic) return new Vec2(0, 0);
        
        const r = point.sub(this.position);
        // v_point = v_com + ω × r
        const tangentialVel = new Vec2(-this.angularVelocity * r.y, this.angularVelocity * r.x);
        return this.velocity.add(tangentialVel);
    }

    /**
     * Check if a point is inside the body
     * Note: Rectangle check assumes axis-aligned bounding box (no rotation support)
     */
    containsPoint(point) {
        if (this.shape === 'circle') {
            return Vec2.distance(this.position, point) <= this.radius;
        } else if (this.shape === 'rectangle') {
            // Simple AABB check (axis-aligned, ignoring rotation)
            // For rotated rectangles, a more complex check would be needed
            const halfW = this.width / 2;
            const halfH = this.height / 2;
            return Math.abs(point.x - this.position.x) <= halfW &&
                   Math.abs(point.y - this.position.y) <= halfH;
        }
        return false;
    }
}

class SpatialHash {
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

class PhysicsEngine {
    /**
     * Main physics engine implementing Semi-Implicit Euler integration
     * and fixed timestep accumulator
     */
    constructor(options = {}) {
        this.bodies = [];
        this.gravity = new Vec2(0, options.gravity || 0.98);
        
        // Fixed timestep for deterministic simulation
        this.fixedDeltaTime = 1 / 60; // 60 FPS
        this.accumulator = 0;
        this.maxSubSteps = 5; // Prevent spiral of death
        
        // Spatial partitioning for broad-phase collision detection
        this.spatialHash = new SpatialHash(50);
        
        // Collision callbacks
        this.collisionCallbacks = [];
        
        // Performance tracking
        this.lastTime = performance.now();
        
        // Body ID counter
        this.nextBodyId = 0;
    }

    /**
     * Add a body to the simulation
     */
    addBody(body) {
        body.id = this.nextBodyId++;
        this.bodies.push(body);
        return body;
    }

    /**
     * Remove a body from the simulation
     */
    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
        }
    }

    /**
     * Register collision callback
     */
    onCollision(callback) {
        this.collisionCallbacks.push(callback);
    }

    /**
     * Update physics simulation with fixed timestep accumulator
     */
    update(deltaTime) {
        // Add frame time to accumulator
        this.accumulator += deltaTime;
        
        // Consume fixed timesteps from accumulator
        let subSteps = 0;
        while (this.accumulator >= this.fixedDeltaTime && subSteps < this.maxSubSteps) {
            this.step(this.fixedDeltaTime);
            this.accumulator -= this.fixedDeltaTime;
            subSteps++;
        }
        
        // Calculate interpolation factor for smooth rendering
        const alpha = this.accumulator / this.fixedDeltaTime;
        return alpha;
    }

    /**
     * Single physics step using Semi-Implicit Euler integration
     */
    step(dt) {
        // Store previous state for interpolation
        this.bodies.forEach(body => {
            body.prevPosition = new Vec2(body.position.x, body.position.y);
            body.prevAngle = body.angle;
        });
        
        // 1. Apply forces and update velocities (Semi-Implicit Euler: velocity first)
        this.bodies.forEach(body => {
            if (body.isStatic) return;
            
            // Apply gravity
            const gravityForce = this.gravity.mul(body.mass * dt);
            body.velocity = body.velocity.add(gravityForce.mul(1 / body.mass));
            
            // Apply air resistance (drag)
            const drag = 1 - body.frictionAir;
            body.velocity = body.velocity.mul(drag);
            body.angularVelocity *= drag;
        });
        
        // 2. Update positions using new velocities (Semi-Implicit Euler)
        this.bodies.forEach(body => {
            if (body.isStatic) return;
            
            // x_{t+Δt} = x_t + v_{t+Δt} * Δt
            body.position = body.position.add(body.velocity.mul(dt));
            body.angle += body.angularVelocity * dt;
        });
        
        // 3. Detect and resolve collisions
        this.detectAndResolveCollisions();
    }

    /**
     * Broad phase: Find potential collision pairs using spatial hash
     * Narrow phase: Check actual collisions and resolve
     */
    detectAndResolveCollisions() {
        const potentialPairs = this.spatialHash.getPotentialPairs(this.bodies);
        
        potentialPairs.forEach(({ bodyA, bodyB }) => {
            // Skip if both are static or sensors
            if (bodyA.isStatic && bodyB.isStatic) return;
            
            // Skip if same collision group and group is negative
            if (bodyA.collisionFilter.group === bodyB.collisionFilter.group && 
                bodyA.collisionFilter.group < 0) return;
            
            // Narrow phase: Check actual collision
            const collision = this.checkCollision(bodyA, bodyB);
            
            if (collision) {
                // Notify collision callbacks
                this.collisionCallbacks.forEach(callback => {
                    callback({ bodyA, bodyB, collision });
                });
                
                // Resolve collision with impulse-based response
                if (!bodyA.isSensor && !bodyB.isSensor) {
                    this.resolveCollision(bodyA, bodyB, collision);
                }
            }
        });
    }

    /**
     * Narrow phase collision detection
     */
    checkCollision(bodyA, bodyB) {
        // Circle-Circle collision
        if (bodyA.shape === 'circle' && bodyB.shape === 'circle') {
            const distance = Vec2.distance(bodyA.position, bodyB.position);
            const minDist = bodyA.radius + bodyB.radius;
            
            if (distance < minDist) {
                const normal = bodyB.position.sub(bodyA.position).normalize();
                const penetration = minDist - distance;
                const contactPoint = bodyA.position.add(normal.mul(bodyA.radius));
                
                return { normal, penetration, contactPoint };
            }
        }
        
        // Circle-Rectangle collision (simplified AABB)
        if ((bodyA.shape === 'circle' && bodyB.shape === 'rectangle') ||
            (bodyA.shape === 'rectangle' && bodyB.shape === 'circle')) {
            
            const circle = bodyA.shape === 'circle' ? bodyA : bodyB;
            const rect = bodyA.shape === 'rectangle' ? bodyA : bodyB;
            
            // Find closest point on rectangle to circle center
            const halfW = rect.width / 2;
            const halfH = rect.height / 2;
            
            const closestX = Math.max(rect.position.x - halfW, 
                            Math.min(circle.position.x, rect.position.x + halfW));
            const closestY = Math.max(rect.position.y - halfH, 
                            Math.min(circle.position.y, rect.position.y + halfH));
            
            const closestPoint = new Vec2(closestX, closestY);
            const distance = Vec2.distance(circle.position, closestPoint);
            
            if (distance < circle.radius) {
                // Handle edge case where circle center is at closest point
                let normal;
                if (distance < 0.001) {
                    // Use a default normal pointing from rect center to circle
                    normal = circle.position.sub(rect.position).normalize();
                    if (normal.length() === 0) {
                        normal = new Vec2(0, -1);  // Default to upward
                    }
                } else {
                    normal = circle.position.sub(closestPoint).normalize();
                }
                
                const penetration = circle.radius - distance;
                const contactPoint = closestPoint;
                
                // Adjust normal direction based on which body is which
                const finalNormal = bodyA.shape === 'circle' ? normal : normal.mul(-1);
                
                return { normal: finalNormal, penetration, contactPoint };
            }
        }
        
        return null;
    }

    /**
     * Impulse-based collision resolution
     * Implements the constraint: relative velocity along normal should be zero after collision
     */
    resolveCollision(bodyA, bodyB, collision) {
        const { normal, penetration, contactPoint } = collision;
        
        // Separate bodies to prevent overlap
        if (penetration > 0) {
            const totalMass = bodyA.isStatic ? bodyB.mass : 
                             bodyB.isStatic ? bodyA.mass : 
                             bodyA.mass + bodyB.mass;
            
            if (!bodyA.isStatic) {
                const moveA = normal.mul(-penetration * (bodyB.mass / totalMass));
                bodyA.position = bodyA.position.add(moveA);
            }
            
            if (!bodyB.isStatic) {
                const moveB = normal.mul(penetration * (bodyA.mass / totalMass));
                bodyB.position = bodyB.position.add(moveB);
            }
        }
        
        // Calculate relative velocity at contact point
        const velA = bodyA.getPointVelocity(contactPoint);
        const velB = bodyB.getPointVelocity(contactPoint);
        const relativeVel = velB.sub(velA);
        
        // Velocity along collision normal
        const velAlongNormal = relativeVel.dot(normal);
        
        // Don't resolve if velocities are separating
        if (velAlongNormal > 0) return;
        
        // Calculate restitution (bounciness)
        const restitution = Math.min(bodyA.restitution, bodyB.restitution);
        
        // Calculate impulse scalar
        // j = -(1 + e) * v_rel · n / (1/m_a + 1/m_b)
        const invMassA = bodyA.isStatic ? 0 : 1 / bodyA.mass;
        const invMassB = bodyB.isStatic ? 0 : 1 / bodyB.mass;
        
        let impulseScalar = -(1 + restitution) * velAlongNormal;
        impulseScalar /= (invMassA + invMassB);
        
        // Apply impulse
        const impulse = normal.mul(impulseScalar);
        
        if (!bodyA.isStatic) {
            bodyA.applyImpulse(impulse.mul(-1), contactPoint);
        }
        
        if (!bodyB.isStatic) {
            bodyB.applyImpulse(impulse, contactPoint);
        }
        
        // Apply friction
        this.applyFriction(bodyA, bodyB, normal, contactPoint, impulseScalar);
    }

    /**
     * Apply tangential friction impulse
     */
    applyFriction(bodyA, bodyB, normal, contactPoint, normalImpulse) {
        // Get relative velocity
        const velA = bodyA.getPointVelocity(contactPoint);
        const velB = bodyB.getPointVelocity(contactPoint);
        const relativeVel = velB.sub(velA);
        
        // Get tangent vector (perpendicular to normal)
        const tangent = new Vec2(-normal.y, normal.x);
        
        // Velocity along tangent
        const velAlongTangent = relativeVel.dot(tangent);
        
        // Calculate friction coefficient
        const friction = (bodyA.friction + bodyB.friction) / 2;
        
        // Coulomb friction: F_friction <= μ * F_normal
        let frictionImpulse = -velAlongTangent;
        const invMassA = bodyA.isStatic ? 0 : 1 / bodyA.mass;
        const invMassB = bodyB.isStatic ? 0 : 1 / bodyB.mass;
        frictionImpulse /= (invMassA + invMassB);
        
        // Clamp friction impulse by Coulomb's law
        const maxFriction = Math.abs(normalImpulse * friction);
        frictionImpulse = Math.max(-maxFriction, Math.min(maxFriction, frictionImpulse));
        
        const frictionVector = tangent.mul(frictionImpulse);
        
        // Apply friction impulse
        if (!bodyA.isStatic) {
            bodyA.applyImpulse(frictionVector.mul(-1), contactPoint);
        }
        
        if (!bodyB.isStatic) {
            bodyB.applyImpulse(frictionVector, contactPoint);
        }
    }

    /**
     * Get interpolated position for smooth rendering
     */
    getInterpolatedPosition(body, alpha) {
        return new Vec2(
            body.prevPosition.x + (body.position.x - body.prevPosition.x) * alpha,
            body.prevPosition.y + (body.position.y - body.prevPosition.y) * alpha
        );
    }

    /**
     * Get interpolated angle for smooth rendering
     */
    getInterpolatedAngle(body, alpha) {
        return body.prevAngle + (body.angle - body.prevAngle) * alpha;
    }

    /**
     * Clear all bodies
     */
    clear() {
        this.bodies = [];
    }
}

// Export for use in the game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhysicsEngine, RigidBody, Vec2 };
} else if (typeof window !== 'undefined') {
    // Browser global exports
    window.PhysicsEngine = PhysicsEngine;
    window.RigidBody = RigidBody;
    window.Vec2 = Vec2;
}
