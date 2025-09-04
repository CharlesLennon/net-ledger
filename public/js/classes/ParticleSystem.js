/**
 * Manages animated particles that travel along wire connections
 */
class ParticleSystem {
  constructor() {
    this.activeParticles = new Map();
    this.config = {
      SPEED: 1.5,
      SIZE: 4,
      SPACING: 80,
      COLOR: '#ffffff',
      TRAIL_LENGTH: 8,
      SHOW_ONLY_ON_SELECTED: true,
    };
  }

  isLinkSelected(link) {
    if (!link || !window.canvasInstance || !window.canvasInstance.graph) return false;
    if (!window.canvasInstance.graph._nodes) window.canvasInstance.graph._nodes = [];
    if (!link.origin_id || !link.target_id) return false;

    const originNode = window.canvasInstance.graph.getNodeById(link.origin_id);
    const targetNode = window.canvasInstance.graph.getNodeById(link.target_id);

    if (!originNode || !targetNode) return false;
    return originNode.is_selected || targetNode.is_selected;
  }

  createParticlesForLink(link, routingPoints) {
    if (!link || !routingPoints || routingPoints.length < 2) return;

    const linkId = `${link.origin_id}-${link.target_id}`;
    if (!this.activeParticles.has(linkId)) {
      this.activeParticles.set(linkId, []);
    }

    const particles = this.activeParticles.get(linkId);
    const pathLength = this.calculatePathLength(routingPoints);

    if (particles.length === 0 || pathLength / particles.length > this.config.SPACING) {
      particles.push({
        position: 0,
        speed: this.config.SPEED,
        pathLength: pathLength,
        routingPoints: routingPoints,
        trail: [],
      });
    }
  }

  updateParticles(deltaTime) {
    this.activeParticles.forEach((particles, linkId) => {
      particles.forEach((particle, index) => {
        particle.position += particle.speed;
        if (particle.position >= particle.pathLength) {
          particle.position = 0;
          particle.trail = [];
        }

        const currentPos = this.getPositionAlongPath(
          particle.routingPoints,
          particle.position / particle.pathLength
        );
        particle.trail.push(currentPos);

        if (particle.trail.length > this.config.TRAIL_LENGTH) {
          particle.trail.shift();
        }
      });
    });
  }

  calculatePathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  getPositionAlongPath(points, t) {
    const targetLength = t * this.calculatePathLength(points);
    let currentLength = 0;

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (currentLength + segmentLength >= targetLength) {
        const segmentT = (targetLength - currentLength) / segmentLength;
        return {
          x: points[i - 1].x + dx * segmentT,
          y: points[i - 1].y + dy * segmentT,
        };
      }
      currentLength += segmentLength;
    }
    return points[points.length - 1];
  }

  drawParticles(ctx, routingPoints, link) {
    if (!routingPoints || routingPoints.length < 2) return;

    const linkId = `${link.origin_id}-${link.target_id}`;
    const particles = this.activeParticles.get(linkId);
    if (!particles) return;

    particles.forEach(particle => {
      if (particle.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = this.config.COLOR;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;

        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        for (let i = 1; i < particle.trail.length; i++) {
          const alpha = i / particle.trail.length;
          ctx.globalAlpha = alpha * 0.6;
          ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        ctx.stroke();

        const currentPos = particle.trail[particle.trail.length - 1];
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.config.COLOR;
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, this.config.SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  cleanupUnselectedParticles() {
    const selectedLinkIds = new Set();

    if (window.canvasInstance && window.canvasInstance.graph) {
      const canvas = window.canvasInstance;
      if (!canvas.graph._nodes) canvas.graph._nodes = [];
      if (!canvas.graph.links) canvas.graph.links = {};

      if (Array.isArray(canvas.graph._nodes)) {
        canvas.graph._nodes.forEach(node => {
          if (node && node.outputs) {
            node.outputs.forEach(output => {
              if (output && output.links) {
                output.links.forEach(linkId => {
                  const link = canvas.graph.links[linkId];
                  if (link && this.isLinkSelected(link)) {
                    selectedLinkIds.add(`${link.origin_id}-${link.target_id}`);
                  }
                });
              }
            });
          }
        });
      }
    }

    for (const [linkId, particles] of this.activeParticles) {
      if (!selectedLinkIds.has(linkId)) {
        this.activeParticles.delete(linkId);
      }
    }
  }

  startAnimation() {
    let lastTime = 0;
    const animate = currentTime => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (deltaTime < 50) {
        this.updateParticles(deltaTime / 16.67);
        if (this.config.SHOW_ONLY_ON_SELECTED) {
          this.cleanupUnselectedParticles();
        }
      }

      if (window.canvasInstance) {
        window.canvasInstance.setDirty(true, true);
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

window.ParticleSystem = ParticleSystem;
