import Vec2 from './Vec2.js';

export default class RigidBody {
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
