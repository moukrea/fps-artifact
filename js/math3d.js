/**
 * 3D Math utilities for the game engine
 */
(function (MyApp) {
    // Dependencies
    const Utils = MyApp.Utils;

    /**
     * 3D Vector class
     */
    class Vector3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        /**
         * Create a copy of the vector
         * @returns {Vector3} New vector with same values
         */
        clone() {
            return new Vector3(this.x, this.y, this.z);
        }

        /**
         * Set vector components
         * @param {number} x - X component
         * @param {number} y - Y component
         * @param {number} z - Z component
         * @returns {Vector3} This vector for chaining
         */
        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        /**
         * Copy values from another vector
         * @param {Vector3} v - Vector to copy from
         * @returns {Vector3} This vector for chaining
         */
        copy(v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }

        /**
         * Add a vector to this vector
         * @param {Vector3} v - Vector to add
         * @returns {Vector3} This vector for chaining
         */
        add(v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }

        /**
         * Subtract a vector from this vector
         * @param {Vector3} v - Vector to subtract
         * @returns {Vector3} This vector for chaining
         */
        subtract(v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        }

        /**
         * Multiply this vector by a scalar
         * @param {number} scalar - Scalar value
         * @returns {Vector3} This vector for chaining
         */
        multiplyScalar(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;
            return this;
        }

        /**
         * Divide this vector by a scalar
         * @param {number} scalar - Scalar value
         * @returns {Vector3} This vector for chaining
         */
        divideScalar(scalar) {
            if (scalar !== 0) {
                this.x /= scalar;
                this.y /= scalar;
                this.z /= scalar;
            } else {
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }
            return this;
        }

        /**
         * Calculate the length (magnitude) of this vector
         * @returns {number} Vector length
         */
        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        /**
         * Calculate squared length (avoids square root)
         * @returns {number} Squared length
         */
        lengthSquared() {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }

        /**
         * Normalize this vector (make unit length)
         * @returns {Vector3} This vector for chaining
         */
        normalize() {
            return this.divideScalar(this.length() || 1);
        }

        /**
         * Calculate dot product with another vector
         * @param {Vector3} v - Other vector
         * @returns {number} Dot product
         */
        dot(v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        }

        /**
         * Calculate cross product with another vector
         * @param {Vector3} v - Other vector
         * @returns {Vector3} New vector representing cross product
         */
        cross(v) {
            const x = this.y * v.z - this.z * v.y;
            const y = this.z * v.x - this.x * v.z;
            const z = this.x * v.y - this.y * v.x;
            return new Vector3(x, y, z);
        }

        /**
         * Linear interpolation to another vector
         * @param {Vector3} v - Target vector
         * @param {number} t - Interpolation factor (0-1)
         * @returns {Vector3} This vector for chaining
         */
        lerp(v, t) {
            this.x = Utils.lerp(this.x, v.x, t);
            this.y = Utils.lerp(this.y, v.y, t);
            this.z = Utils.lerp(this.z, v.z, t);
            return this;
        }

        /**
         * Distance to another vector
         * @param {Vector3} v - Other vector
         * @returns {number} Distance
         */
        distanceTo(v) {
            return Math.sqrt(this.distanceToSquared(v));
        }

        /**
         * Squared distance to another vector
         * @param {Vector3} v - Other vector
         * @returns {number} Squared distance
         */
        distanceToSquared(v) {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            return dx * dx + dy * dy + dz * dz;
        }

        /**
         * Check if this vector equals another
         * @param {Vector3} v - Vector to compare with
         * @returns {boolean} True if vectors are equal
         */
        equals(v) {
            return this.x === v.x && this.y === v.y && this.z === v.z;
        }

        /**
         * Get array representation
         * @returns {Array} Array [x, y, z]
         */
        toArray() {
            return [this.x, this.y, this.z];
        }

        /**
         * String representation
         * @returns {string} String representation
         */
        toString() {
            return `Vector3(${this.x}, ${this.y}, ${this.z})`;
        }
    }

    /**
     * 2D Vector class
     */
    class Vector2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }

        clone() {
            return new Vector2(this.x, this.y);
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

        multiplyScalar(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        }

        divideScalar(scalar) {
            if (scalar !== 0) {
                this.x /= scalar;
                this.y /= scalar;
            } else {
                this.x = 0;
                this.y = 0;
            }
            return this;
        }

        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        lengthSquared() {
            return this.x * this.x + this.y * this.y;
        }

        normalize() {
            return this.divideScalar(this.length() || 1);
        }

        dot(v) {
            return this.x * v.x + this.y * v.y;
        }

        cross(v) {
            return this.x * v.y - this.y * v.x;
        }

        lerp(v, t) {
            this.x = Utils.lerp(this.x, v.x, t);
            this.y = Utils.lerp(this.y, v.y, t);
            return this;
        }

        distanceTo(v) {
            return Math.sqrt(this.distanceToSquared(v));
        }

        distanceToSquared(v) {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            return dx * dx + dy * dy;
        }

        equals(v) {
            return this.x === v.x && this.y === v.y;
        }

        toArray() {
            return [this.x, this.y];
        }

        toString() {
            return `Vector2(${this.x}, ${this.y})`;
        }
    }

    /**
     * Ray class for raycasting
     */
    class Ray {
        constructor(origin = new Vector3(), direction = new Vector3(0, 0, 1)) {
            this.origin = origin;
            this.direction = direction.normalize();
        }

        /**
         * Get point at a distance along the ray
         * @param {number} t - Distance along ray
         * @returns {Vector3} Point at distance t
         */
        at(t) {
            return new Vector3().copy(this.direction).multiplyScalar(t).add(this.origin);
        }

        /**
         * Cast the ray against a plane
         * @param {Plane} plane - Plane to test
         * @returns {number|null} Distance to intersection or null if no hit
         */
        intersectPlane(plane) {
            const denominator = plane.normal.dot(this.direction);

            if (denominator === 0) {
                // Ray is parallel to the plane
                return null;
            }

            const t = (plane.constant - plane.normal.dot(this.origin)) / denominator;

            return t >= 0 ? t : null;
        }

        /**
         * Cast against an axis-aligned bounding box
         * @param {Object} box - Box with min and max Vector3 properties
         * @returns {number|null} Distance to intersection or null if no hit
         */
        intersectBox(box) {
            let tmin, tmax, tYmin, tYmax, tZmin, tZmax;

            const invDirX = 1 / this.direction.x;
            const invDirY = 1 / this.direction.y;
            const invDirZ = 1 / this.direction.z;

            if (invDirX >= 0) {
                tmin = (box.min.x - this.origin.x) * invDirX;
                tmax = (box.max.x - this.origin.x) * invDirX;
            } else {
                tmin = (box.max.x - this.origin.x) * invDirX;
                tmax = (box.min.x - this.origin.x) * invDirX;
            }

            if (invDirY >= 0) {
                tYmin = (box.min.y - this.origin.y) * invDirY;
                tYmax = (box.max.y - this.origin.y) * invDirY;
            } else {
                tYmin = (box.max.y - this.origin.y) * invDirY;
                tYmax = (box.min.y - this.origin.y) * invDirY;
            }

            if (tmin > tYmax || tYmin > tmax) return null;

            if (tYmin > tmin) tmin = tYmin;
            if (tYmax < tmax) tmax = tYmax;

            if (invDirZ >= 0) {
                tZmin = (box.min.z - this.origin.z) * invDirZ;
                tZmax = (box.max.z - this.origin.z) * invDirZ;
            } else {
                tZmin = (box.max.z - this.origin.z) * invDirZ;
                tZmax = (box.min.z - this.origin.z) * invDirZ;
            }

            if (tmin > tZmax || tZmin > tmax) return null;

            if (tZmin > tmin) tmin = tZmin;
            if (tZmax < tmax) tmax = tZmax;

            if (tmax < 0) return null;

            return tmin >= 0 ? tmin : tmax;
        }
    }

    /**
     * Plane class
     */
    class Plane {
        constructor(normal = new Vector3(0, 1, 0), constant = 0) {
            this.normal = normal;
            this.constant = constant;
        }

        /**
         * Set from normal and point on the plane
         * @param {Vector3} normal - Plane normal
         * @param {Vector3} point - Point on the plane
         * @returns {Plane} This plane for chaining
         */
        setFromNormalAndPoint(normal, point) {
            this.normal.copy(normal).normalize();
            this.constant = -point.dot(this.normal);
            return this;
        }

        /**
         * Distance from a point to the plane
         * @param {Vector3} point - Point to test
         * @returns {number} Signed distance
         */
        distanceToPoint(point) {
            return this.normal.dot(point) + this.constant;
        }
    }

    /**
     * Matrix4 class for 3D transforms
     */
    class Matrix4 {
        constructor() {
            // Column-major format, same as WebGL
            this.elements = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
        }

        /**
         * Set to identity matrix
         * @returns {Matrix4} This matrix for chaining
         */
        identity() {
            this.elements = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
            return this;
        }

        /**
         * Create translation matrix
         * @param {Vector3|number} x - Vector3 or x value
         * @param {number} y - Y value
         * @param {number} z - Z value
         * @returns {Matrix4} This matrix for chaining
         */
        makeTranslation(x, y, z) {
            if (x instanceof Vector3) {
                y = x.y;
                z = x.z;
                x = x.x;
            }

            this.elements = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, z, 1
            ];

            return this;
        }

        /**
         * Create rotation matrix around X axis
         * @param {number} angle - Angle in radians
         * @returns {Matrix4} This matrix for chaining
         */
        makeRotationX(angle) {
            const c = Math.cos(angle);
            const s = Math.sin(angle);

            this.elements = [
                1, 0, 0, 0,
                0, c, s, 0,
                0, -s, c, 0,
                0, 0, 0, 1
            ];

            return this;
        }

        /**
         * Create rotation matrix around Y axis
         * @param {number} angle - Angle in radians
         * @returns {Matrix4} This matrix for chaining
         */
        makeRotationY(angle) {
            const c = Math.cos(angle);
            const s = Math.sin(angle);

            this.elements = [
                c, 0, -s, 0,
                0, 1, 0, 0,
                s, 0, c, 0,
                0, 0, 0, 1
            ];

            return this;
        }

        /**
         * Create rotation matrix around Z axis
         * @param {number} angle - Angle in radians
         * @returns {Matrix4} This matrix for chaining
         */
        makeRotationZ(angle) {
            const c = Math.cos(angle);
            const s = Math.sin(angle);

            this.elements = [
                c, s, 0, 0,
                -s, c, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];

            return this;
        }

        /**
         * Create a perspective projection matrix
         * @param {number} fovy - Field of view in Y direction in radians
         * @param {number} aspect - Aspect ratio (width / height)
         * @param {number} near - Near clipping plane
         * @param {number} far - Far clipping plane
         * @returns {Matrix4} This matrix for chaining
         */
        makePerspective(fovy, aspect, near, far) {
            const f = 1.0 / Math.tan(fovy / 2);
            const nf = 1 / (near - far);

            this.elements = [
                f / aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (far + near) * nf, -1,
                0, 0, 2 * far * near * nf, 0
            ];

            return this;
        }

        /**
         * Multiply this matrix by another
         * @param {Matrix4} m - Matrix to multiply by
         * @returns {Matrix4} This matrix for chaining
         */
        multiply(m) {
            return this.multiplyMatrices(this, m);
        }

        /**
         * Multiply a matrix from the right
         * @param {Matrix4} m - Matrix to multiply by
         * @returns {Matrix4} This matrix for chaining
         */
        premultiply(m) {
            return this.multiplyMatrices(m, this);
        }

        /**
         * Set this matrix to a multiplication of two matrices
         * @param {Matrix4} a - First matrix
         * @param {Matrix4} b - Second matrix
         * @returns {Matrix4} This matrix for chaining
         */
        multiplyMatrices(a, b) {
            const ae = a.elements;
            const be = b.elements;
            const te = this.elements;

            const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
            const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
            const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
            const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

            const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
            const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
            const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
            const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

            te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

            return this;
        }

        /**
         * Transform a vector by this matrix
         * @param {Vector3} v - Vector to transform
         * @returns {Vector3} Transformed vector
         */
        transformVector(v) {
            const e = this.elements;
            const x = v.x, y = v.y, z = v.z;

            const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

            const resultX = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
            const resultY = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
            const resultZ = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

            return new Vector3(resultX, resultY, resultZ);
        }

        /**
         * Look at target from position
         * @param {Vector3} eye - Camera position
         * @param {Vector3} target - Target position to look at
         * @param {Vector3} up - Up vector (usually 0,1,0)
         * @returns {Matrix4} This matrix for chaining
         */
        lookAt(eye, target, up) {
            const z = new Vector3().copy(eye).subtract(target);

            if (z.lengthSquared() === 0) {
                z.z = 1;
            }

            z.normalize();
            const x = new Vector3().copy(up).cross(z);

            if (x.lengthSquared() === 0) {
                z.x += 0.0001;
                x.copy(up).cross(z);
            }

            x.normalize();
            const y = new Vector3().copy(z).cross(x);

            this.elements[0] = x.x;
            this.elements[1] = y.x;
            this.elements[2] = z.x;
            this.elements[3] = 0;

            this.elements[4] = x.y;
            this.elements[5] = y.y;
            this.elements[6] = z.y;
            this.elements[7] = 0;

            this.elements[8] = x.z;
            this.elements[9] = y.z;
            this.elements[10] = z.z;
            this.elements[11] = 0;

            this.elements[12] = -x.dot(eye);
            this.elements[13] = -y.dot(eye);
            this.elements[14] = -z.dot(eye);
            this.elements[15] = 1;

            return this;
        }

        /**
         * Clone this matrix
         * @returns {Matrix4} New matrix with same values
         */
        clone() {
            const matrix = new Matrix4();
            matrix.elements = [...this.elements];
            return matrix;
        }
    }

    /**
     * Convert Euler angles to a Direction vector
     * @param {number} pitch - Pitch in radians (x rotation)
     * @param {number} yaw - Yaw in radians (y rotation)
     * @returns {Vector3} Direction vector
     */
    function eulerToDirection(pitch, yaw) {
        // Convert Euler angles to direction vector
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        return new Vector3(sinYaw * cosPitch, -sinPitch, cosYaw * cosPitch).normalize();
    }

    /**
     * Convert direction vector to Euler angles
     * @param {Vector3} dir - Direction vector (normalized)
     * @returns {Object} Euler angles {pitch, yaw} in radians
     */
    function directionToEuler(dir) {
        const pitch = -Math.asin(dir.y);
        const yaw = Math.atan2(dir.x, dir.z);

        return { pitch, yaw };
    }

    // Export the public API
    MyApp.Math3D = {
        Vector2,
        Vector3,
        Ray,
        Plane,
        Matrix4,
        eulerToDirection,
        directionToEuler
    };

    console.log('Math3D module loaded');
})(window.MyApp || (window.MyApp = {}));