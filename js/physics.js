/**
 * Physics.js - Physics system for collision detection and resolution
 */
(function (FPSGame) {
    // Create Physics namespace
    FPSGame.Physics = {};

    // Check if two circles collide
    FPSGame.Physics.circleCollision = function (x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    };

    // Check if a circle and a line segment collide
    FPSGame.Physics.circleSegmentCollision = function (cx, cy, radius, x1, y1, x2, y2) {
        // Calculate segment length squared
        const lengthSq = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);

        // If segment is a point, use circle-point collision
        if (lengthSq === 0) {
            return FPSGame.Physics.circlePointCollision(cx, cy, radius, x1, y1);
        }

        // Project circle center onto line segment
        const t = Math.max(0, Math.min(1, ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / lengthSq));
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);

        // Check if projection point is within radius of circle
        return FPSGame.Physics.circlePointCollision(cx, cy, radius, projX, projY);
    };

    // Check if a circle and a point collide
    FPSGame.Physics.circlePointCollision = function (cx, cy, radius, x, y) {
        const dx = x - cx;
        const dy = y - cy;
        return dx * dx + dy * dy <= radius * radius;
    };

    // Check if a circle and a rectangle collide
    FPSGame.Physics.circleRectCollision = function (cx, cy, radius, rx, ry, rw, rh) {
        // Find closest point in rectangle to circle
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));

        // Check if closest point is within circle
        return FPSGame.Physics.circlePointCollision(cx, cy, radius, closestX, closestY);
    };

    // Check if two rectangles collide
    FPSGame.Physics.rectCollision = function (r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
        return r1x < r2x + r2w && r1x + r1w > r2x && r1y < r2y + r2h && r1y + r1h > r2y;
    };

    // Calculate reflection vector
    FPSGame.Physics.reflect = function (dirX, dirY, normalX, normalY) {
        // Calculate dot product
        const dot = dirX * normalX + dirY * normalY;

        // Calculate reflection vector: R = D - 2(D·N)N
        return {
            x: dirX - 2 * dot * normalX,
            y: dirY - 2 * dot * normalY
        };
    };

    // Simple collision resolution between two circles
    FPSGame.Physics.resolveCircleCollision = function (c1, c2) {
        // Calculate distance vector
        const dx = c2.position.x - c1.position.x;
        const dy = c2.position.y - c1.position.y;

        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Skip if no collision
        if (distance >= c1.radius + c2.radius) return;

        // Calculate overlap
        const overlap = (c1.radius + c2.radius) - distance;

        // Calculate direction
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Calculate mass ratio (inverse mass is used for immovable objects)
        const totalMass = (c1.mass || 1) + (c2.mass || 1);
        const c1Ratio = (c2.mass || 1) / totalMass;
        const c2Ratio = (c1.mass || 1) / totalMass;

        // Apply position correction
        if (!c1.isStatic) {
            c1.position.x -= dirX * overlap * c1Ratio;
            c1.position.y -= dirY * overlap * c1Ratio;
        }

        if (!c2.isStatic) {
            c2.position.x += dirX * overlap * c2Ratio;
            c2.position.y += dirY * overlap * c2Ratio;
        }

        // Apply bounce if both objects have velocity
        if (c1.velocity && c2.velocity) {
            // Calculate relative velocity
            const velX = c1.velocity.x - c2.velocity.x;
            const velY = c1.velocity.y - c2.velocity.y;

            // Calculate velocity along normal
            const normalVel = velX * dirX + velY * dirY;

            // Don't apply bounce if objects are moving away from each other
            if (normalVel > 0) return;

            // Calculate bounce factor
            const bounceFactor = Math.min(c1.bounce || 0, c2.bounce || 0);

            // Calculate impulse scalar
            const impulseMag = -(1 + bounceFactor) * normalVel / totalMass;

            // Apply impulse
            if (!c1.isStatic) {
                c1.velocity.x += impulseMag * (c2.mass || 1) * dirX;
                c1.velocity.y += impulseMag * (c2.mass || 1) * dirY;
            }

            if (!c2.isStatic) {
                c2.velocity.x -= impulseMag * (c1.mass || 1) * dirX;
                c2.velocity.y -= impulseMag * (c1.mass || 1) * dirY;
            }
        }
    };

    // Raycast against a set of segments
    FPSGame.Physics.raycast = function (origin, direction, segments, maxDistance = Infinity) {
        let closestHit = null;
        let closestDist = maxDistance;

        for (const segment of segments) {
            const x1 = segment.start.x;
            const y1 = segment.start.y;
            const x2 = segment.end.x;
            const y2 = segment.end.y;

            // Ray direction
            const rayDirX = direction.x;
            const rayDirY = direction.y;

            // Ray origin
            const rayOrigX = origin.x;
            const rayOrigY = origin.y;

            // Calculate determinant
            const segDirX = x2 - x1;
            const segDirY = y2 - y1;

            const det = segDirX * rayDirY - segDirY * rayDirX;

            // If determinant is zero, lines are parallel
            if (det === 0) continue;

            // Calculate division only once
            const invDet = 1 / det;

            // Calculate relative vector from segment start to ray origin
            const relOrigX = rayOrigX - x1;
            const relOrigY = rayOrigY - y1;

            // Calculate parameters
            const t = (relOrigX * rayDirY - relOrigY * rayDirX) * invDet;
            const u = (segDirX * relOrigY - segDirY * relOrigX) * invDet;

            // Check if intersection is within segment and ray direction
            if (t >= 0 && t <= 1 && u >= 0 && u <= closestDist) {
                // Calculate intersection point
                const hitX = x1 + t * segDirX;
                const hitY = y1 + t * segDirY;

                // Calculate distance
                const dist = Math.sqrt((hitX - rayOrigX) * (hitX - rayOrigX) + (hitY - rayOrigY) * (hitY - rayOrigY));

                // Check if this is the closest hit
                if (dist < closestDist) {
                    closestDist = dist;

                    // Calculate wall normal (perpendicular to segment)
                    const normalX = -segDirY;
                    const normalY = segDirX;

                    // Normalize the normal
                    const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);
                    const normNormalX = normalX / normalLen;
                    const normNormalY = normalY / normalLen;

                    closestHit = {
                        point: { x: hitX, y: hitY },
                        distance: dist,
                        normal: { x: normNormalX, y: normNormalY },
                        segment: segment
                    };
                }
            }
        }

        return closestHit;
    };

    console.log("Physics module loaded");
})(window.FPSGame);