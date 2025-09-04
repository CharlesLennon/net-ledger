/**
 * Handles complex wire routing calculations and rendering with orthogonal paths
 */
class WireRenderer {
  constructor() {
    this.config = null; // Will be set from WIRE_ROUTING_CONFIG
  }

  setConfig(config) {
    this.config = config;
  }

  renderRoutedConnection(
    ctx,
    a,
    b,
    link,
    skip_border,
    flow,
    color,
    start_dir,
    end_dir,
    num_sublines
  ) {
    if (!link || !link.route_along_groups) {
      return false;
    }

    ctx.save();
    const connectionColor = link.color || color || '#10b981';
    const routingPoints = this.calculateWireRoute(
      a,
      b,
      start_dir,
      end_dir,
      link.wireIndex || 0,
      link
    );

    const isSelected = this.isLinkSelected(link);
    if (isSelected) {
      this.drawGlowingWire(ctx, routingPoints, connectionColor);
    }

    ctx.strokeStyle = connectionColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.drawRoundedPath(ctx, routingPoints);

    if (flow) {
      this.drawConnectionArrow(
        ctx,
        routingPoints[routingPoints.length - 2],
        routingPoints[routingPoints.length - 1],
        connectionColor
      );
    }

    // Let particle system handle particles if it exists
    if (
      window.particleSystem &&
      (isSelected || !window.particleSystem.config.SHOW_ONLY_ON_SELECTED)
    ) {
      window.particleSystem.createParticlesForLink(link, routingPoints);
      window.particleSystem.drawParticles(ctx, routingPoints, link);
    }

    ctx.restore();
    return true;
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

  drawGlowingWire(ctx, points, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.drawRoundedPath(ctx, points);
    ctx.restore();
  }

  drawRoundedPath(ctx, points) {
    if (points.length < 2) return;

    const cornerRadius = this.config ? this.config.CORNER_RADIUS : 15;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x;
      const dy2 = next.y - curr.y;

      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (len1 < cornerRadius * 2 || len2 < cornerRadius * 2) {
        ctx.lineTo(curr.x, curr.y);
        continue;
      }

      const ux1 = dx1 / len1;
      const uy1 = dy1 / len1;
      const ux2 = dx2 / len2;
      const uy2 = dy2 / len2;

      const cornerX = curr.x - ux1 * cornerRadius;
      const cornerY = curr.y - uy1 * cornerRadius;
      const nextX = curr.x + ux2 * cornerRadius;
      const nextY = curr.y + uy2 * cornerRadius;

      ctx.lineTo(cornerX, cornerY);
      const cpX = curr.x;
      const cpY = curr.y;
      ctx.quadraticCurveTo(cpX, cpY, nextX, nextY);
    }

    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  calculateWireRoute(startPos, endPos, startDir, endDir, wireIndex = 0, link = null) {
    // Check if external routing function exists
    if (window.calculateWireRoute && window.calculateWireRoute !== this.calculateWireRoute) {
      return window.calculateWireRoute(startPos, endPos, startDir, endDir, wireIndex, link);
    }

    // Simple fallback routing
    const points = [];
    points.push({ x: startPos[0], y: startPos[1] });
    const routingX = startPos[0] < endPos[0] ? endPos[0] - 100 : endPos[0] + 100;
    points.push({ x: routingX, y: startPos[1] });
    points.push({ x: routingX, y: endPos[1] });
    points.push({ x: endPos[0], y: endPos[1] });
    return points;
  }

  drawConnectionArrow(ctx, fromPoint, toPoint, color) {
    const headLength = 12;
    const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);

    ctx.strokeStyle = color || '#ffffff';
    ctx.fillStyle = color || '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(toPoint.x, toPoint.y);
    ctx.lineTo(
      toPoint.x - headLength * Math.cos(angle - Math.PI / 6),
      toPoint.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toPoint.x, toPoint.y);
    ctx.lineTo(
      toPoint.x - headLength * Math.cos(angle + Math.PI / 6),
      toPoint.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }
}

window.WireRenderer = WireRenderer;
