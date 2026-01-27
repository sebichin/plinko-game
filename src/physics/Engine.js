import Vec2 from './Vec2.js';
import SpatialHash from './SpatialHash.js';

export default class PhysicsEngine {
    /**
     * Main physics engine implementing Semi-Implicit Euler integration
     * and fixed timestep accumulator
     */
    constructor(options = {}) {
        this.bodies = [];
        // Gravity in pixels/second² for realistic physics
        // 980 pixels/s² approximates Earth gravity (9.8 m/s²) at ~100 pixels/meter scale
        this.gravity = new Vec2(0, options.gravity || 980);
        
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
        if (body.id === undefined) {
            body.id = this.nextBodyId++;
        }
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
            
            // Apply gravity: a = g, so Δv = g * dt
            // gravity is in pixels/second², dt is in seconds
            body.velocity = body.velocity.add(this.gravity.mul(dt));
            
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
