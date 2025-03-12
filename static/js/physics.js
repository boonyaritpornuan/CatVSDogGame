class Physics {
    static calculateTrajectory(initialX, initialY, power, angle, gravity = 9.81) {
        const angleRad = angle * Math.PI / 180;
        const velocity = power * 0.5; // Scale power to reasonable velocity

        const vx = velocity * Math.cos(angleRad);
        const vy = -velocity * Math.sin(angleRad); // Negative because y-axis is inverted in canvas

        return {vx, vy};
    }

    static updateProjectile(obj) {
        // Update position
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Apply gravity (simplified)
        obj.vy += 0.5;

        return {
            x: obj.x,
            y: obj.y,
            vy: obj.vy
        };
    }

    static checkCollision(objA, objB) {
        const dx = objA.x - objB.x;
        const dy = objA.y - objB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (objA.radius + objB.radius);
    }
}