/**
 * Math.js - Math utilities for the FPS game
 */
(function (FPSGame) {
    // Create Math namespace
    FPSGame.Math = {};

    // Vector2 class
    FPSGame.Math.Vector2 = class Vector2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }

        set(x, y) {
            this.x = x;
            this.y = y;
            return this;
        }

        copy(v) {
            this.x = v.x;
            this.y = v.y;
            return this;
        }

        clone() {
            return new FPSGame.Math.Vector2(this.x, this.y);
        }

        add(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }

        subtract(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }

        multiply(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        }

        divide(scalar) {
            if (scalar !== 0) {
                this.x /= scalar;
                this.y /= scalar;
            }
            return this;
        }

        magnitude() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        normalize() {
            const length = this.magnitude();
            if (length > 0) {
                this.x /= length;
                this.y /= length;
            }
            return this;
        }

        distance(v) {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        dot(v) {
            return this.x * v.x + this.y * v.y;
        }

        angle() {
            return Math.atan2(this.y, this.x);
        }

        rotate(angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = this.x * cos - this.y * sin;
            const y = this.x * sin + this.y * cos;
            this.x = x;
            this.y = y;
            return this;
        }

        lerp(v, t) {
            this.x += (v.x - this.x) * t;
            this.y += (v.y - this.y) * t;
            return this;
        }
    };

    // Ray class for raycasting
    FPSGame.Math.Ray = class Ray {
        constructor(origin, direction) {
            this.origin = origin || new FPSGame.Math.Vector2();
            this.direction = direction || new FPSGame.Math.Vector2(1, 0);
        }

        cast(segment) {
            // Line segment points
            const x1 = segment.start.x;
            const y1 = segment.start.y;
            const x2 = segment.end.x;
            const y2 = segment.end.y;

            // Ray points
            const x3 = this.origin.x;
            const y3 = this.origin.y;
            const x4 = this.origin.x + this.direction.x;
            const y4 = this.origin.y + this.direction.y;

            // Calculate denominator
            const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

            // If denominator is 0, lines are parallel
            if (den === 0) {
                return null;
            }

            // Calculate parameters
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

            // Check if intersection is within segments
            if (t > 0 && t < 1 && u > 0) {
                const intersection = new FPSGame.Math.Vector2(
                    x1 + t * (x2 - x1),
                    y1 + t * (y2 - y1)
                );

                return {
                    point: intersection,
                    distance: this.origin.distance(intersection),
                    normal: segment.normal,
                    segment: segment
                };
            }

            return null;
        }
    };

    // Line segment class
    FPSGame.Math.Segment = class Segment {
        constructor(x1, y1, x2, y2, texture = null) {
            this.start = new FPSGame.Math.Vector2(x1, y1);
            this.end = new FPSGame.Math.Vector2(x2, y2);
            this.texture = texture;
            this.calculateNormal();
        }

        calculateNormal() {
            // Calculate normal (perpendicular to segment)
            const dx = this.end.x - this.start.x;
            const dy = this.end.y - this.start.y;

            this.normal = new FPSGame.Math.Vector2(-dy, dx).normalize();
        }

        length() {
            return this.start.distance(this.end);
        }

        intersects(segment) {
            const x1 = this.start.x;
            const y1 = this.start.y;
            const x2 = this.end.x;
            const y2 = this.end.y;

            const x3 = segment.start.x;
            const y3 = segment.start.y;
            const x4 = segment.end.x;
            const y4 = segment.end.y;

            const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (den === 0) {
                return null; // Lines are parallel
            }

            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                const px = x1 + t * (x2 - x1);
                const py = y1 + t * (y2 - y1);
                return new FPSGame.Math.Vector2(px, py);
            }

            return null;
        }
    };

    // Rectangle class
    FPSGame.Math.Rect = class Rect {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        containsPoint(x, y) {
            return x >= this.x && x <= this.x + this.width &&
                y >= this.y && y <= this.y + this.height;
        }

        intersects(rect) {
            return this.x < rect.x + rect.width &&
                this.x + this.width > rect.x &&
                this.y < rect.y + rect.height &&
                this.y + this.height > rect.y;
        }

        intersection(rect) {
            const x = Math.max(this.x, rect.x);
            const y = Math.max(this.y, rect.y);
            const width = Math.min(this.x + this.width, rect.x + rect.width) - x;
            const height = Math.min(this.y + this.height, rect.y + rect.height) - y;

            if (width <= 0 || height <= 0) {
                return null;
            }

            return new FPSGame.Math.Rect(x, y, width, height);
        }

        toSegments() {
            const x1 = this.x;
            const y1 = this.y;
            const x2 = this.x + this.width;
            const y2 = this.y + this.height;

            return [
                new FPSGame.Math.Segment(x1, y1, x2, y1), // Top
                new FPSGame.Math.Segment(x2, y1, x2, y2), // Right
                new FPSGame.Math.Segment(x2, y2, x1, y2), // Bottom
                new FPSGame.Math.Segment(x1, y2, x1, y1)  // Left
            ];
        }
    };

    console.log("Math module loaded");
})(window.FPSGame);