/**
 * Utility functions for geometry calculations, collision detection, and drag handling
 */
class NetworkUtils {
  static makeDraggable(element) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;

    const handleMouseDown = function (e) {
      if (
        e.target.tagName === 'H3' ||
        e.target.closest('h3') ||
        e.target.id === 'close-edit-panel-btn' ||
        e.target.closest('#close-edit-panel-btn')
      ) {
        return;
      }

      if (isDragging) {
        handleMouseUp();
        return;
      }

      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = element.getBoundingClientRect();
      elementStartX = rect.left;
      elementStartY = rect.top;
      element.style.cursor = 'grabbing';
      e.preventDefault();

      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
      document.addEventListener('mousedown', handleMouseDownDuringDrag, { passive: false });
      document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    };

    const handleMouseDownDuringDrag = function (e) {
      if (isDragging) {
        handleMouseUp();
      }
    };

    const handleMouseMove = function (e) {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      const newLeft = elementStartX + deltaX;
      const newTop = elementStartY + deltaY;
      const maxLeft = window.innerWidth - element.offsetWidth;
      const maxTop = window.innerHeight - element.offsetHeight;

      element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
      element.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
      element.style.right = 'auto';
      element.style.transform = 'none';
    };

    const handleMouseUp = function () {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleMouseDownDuringDrag);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    const handleMouseLeave = function () {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleMouseDownDuringDrag);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    element.addEventListener('mousedown', handleMouseDown, { passive: false });

    element._cleanupDrag = function () {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDownDuringDrag);
      document.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }

  static findNodeByPosition(pos) {
    if (
      !window.canvasInstance ||
      !window.canvasInstance.graph ||
      !window.canvasInstance.graph._nodes
    ) {
      return null;
    }

    let bestNode = null;
    let bestDistance = Infinity;

    for (const node of window.canvasInstance.graph._nodes) {
      if (node && node.pos && node.size) {
        const nodeLeft = node.pos[0];
        const nodeTop = node.pos[1];
        const nodeRight = nodeLeft + node.size[0];
        const nodeBottom = nodeTop + node.size[1];

        if (
          pos[0] >= nodeLeft &&
          pos[0] <= nodeRight &&
          pos[1] >= nodeTop &&
          pos[1] <= nodeBottom
        ) {
          return node; // Exact match - return immediately
        }

        const tolerance = 80; // Larger tolerance for wire connection points at node edges
        if (
          pos[0] >= nodeLeft - tolerance &&
          pos[0] <= nodeRight + tolerance &&
          pos[1] >= nodeTop - tolerance &&
          pos[1] <= nodeBottom + tolerance
        ) {
          const clampedX = Math.max(nodeLeft, Math.min(pos[0], nodeRight));
          const clampedY = Math.max(nodeTop, Math.min(pos[1], nodeBottom));
          const distance = Math.sqrt(
            Math.pow(pos[0] - clampedX, 2) + Math.pow(pos[1] - clampedY, 2)
          );

          if (distance < bestDistance) {
            bestDistance = distance;
            bestNode = node;
          }
        }
      }
    }
    return bestNode;
  }

  static findNodeGroup(node) {
    if (
      !node ||
      !window.canvasInstance ||
      !window.canvasInstance.graph ||
      !window.canvasInstance.graph._groups
    ) {
      return null;
    }

    for (const group of window.canvasInstance.graph._groups) {
      if (group && NetworkUtils.isNodeInGroup(node, group)) {
        return group;
      }
    }
    return null;
  }

  static isNodeInGroup(node, group) {
    if (!node || !group) return false;

    const nodeX = node.pos[0];
    const nodeY = node.pos[1];
    const nodeWidth = node.size[0];
    const nodeHeight = node.size[1];
    const groupX = group.pos[0];
    const groupY = group.pos[1];
    const groupWidth = group.size ? group.size[0] : 200;
    const groupHeight = group.size ? group.size[1] : 100;

    return (
      nodeX >= groupX &&
      nodeX + nodeWidth <= groupX + groupWidth &&
      nodeY >= groupY &&
      nodeY + nodeHeight <= groupY + groupHeight
    );
  }

  static getLinkAtPosition(canvas, x, y) {
    if (!canvas || !canvas.graph) return null;
    if (!canvas.graph._nodes) canvas.graph._nodes = [];
    if (!canvas.graph.links) canvas.graph.links = {};

    for (let linkId in canvas.graph.links) {
      const link = canvas.graph.links[linkId];
      if (!link) continue;

      const originNode = canvas.graph.getNodeById(link.origin_id);
      const targetNode = canvas.graph.getNodeById(link.target_id);
      if (!originNode || !targetNode) continue;

      const originPos = originNode.getConnectionPos(false, link.origin_slot, [0, 0]);
      const targetPos = targetNode.getConnectionPos(true, link.target_slot, [0, 0]);

      if (link.route_along_groups) {
        // Use wire renderer if available
        const routingPoints = window.wireRenderer
          ? window.wireRenderer.calculateWireRoute(
              originPos,
              targetPos,
              link.start_dir || 4,
              link.end_dir || 3,
              link.wireIndex || 0,
              link
            )
          : [
              { x: originPos[0], y: originPos[1] },
              { x: targetPos[0], y: targetPos[1] },
            ];

        if (NetworkUtils.isPointNearPath(x, y, routingPoints, 12)) {
          return link;
        }
      } else {
        if (
          NetworkUtils.isPointNearLine(
            x,
            y,
            originPos[0],
            originPos[1],
            targetPos[0],
            targetPos[1],
            12
          )
        ) {
          return link;
        }
      }
    }
    return null;
  }

  static isPointNearPath(px, py, points, threshold) {
    if (!points || points.length < 2) return false;

    for (let i = 1; i < points.length; i++) {
      const x1 = points[i - 1].x;
      const y1 = points[i - 1].y;
      const x2 = points[i].x;
      const y2 = points[i].y;

      if (NetworkUtils.isPointNearLine(px, py, x1, y1, x2, y2, threshold)) {
        return true;
      }
    }
    return false;
  }

  static isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2) <= threshold;
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

    return distance <= threshold;
  }

  static updateWireProperties(link, newCableType) {
    link.cable_type = newCableType;
    link.color = window.getCableColor ? window.getCableColor(newCableType) : '#9ca3af';

    const connectionId = link.connection_id || link.id;
    if (connectionId) {
      Livewire.dispatchTo('network-view', 'connection-updated', {
        connectionId: connectionId,
        cableType: newCableType,
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      console.warn('Connection ID missing from link, changes not saved to database');
      alert('Connection ID missing. This wire may not be properly linked to the database.');
    }
  }

  static addInterfaceToList(label, type, index) {
    const interfacesList = document.getElementById('interfaces-list');
    if (!interfacesList) return;

    const interfaceItem = document.createElement('div');
    interfaceItem.className = 'interface-item';
    interfaceItem.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding: 6px;
      background: #1a202c;
      border-radius: 4px;
      border: 1px solid #2d3748;
    `;

    interfaceItem.innerHTML = `
      <input type="text" class="interface-label" value="${label}" placeholder="Interface label" style="
        flex: 1;
        padding: 4px;
        border-radius: 3px;
        border: 1px solid #4a5568;
        background: #2d3748;
        color: #fff;
        font-size: 11px;
      ">
      <select class="interface-type" style="
        padding: 4px;
        border-radius: 3px;
        border: 1px solid #4a5568;
        background: #2d3748;
        color: #fff;
        font-size: 11px;
      ">
        <option value="RJ45" ${type === 'RJ45' ? 'selected' : ''}>RJ45</option>
        <option value="SFP" ${type === 'SFP' ? 'selected' : ''}>SFP</option>
        <option value="SFP+" ${type === 'SFP+' ? 'selected' : ''}>SFP+</option>
        <option value="Power" ${type === 'Power' ? 'selected' : ''}>Power</option>
        <option value="USB" ${type === 'USB' ? 'selected' : ''}>USB</option>
        <option value="Serial" ${type === 'Serial' ? 'selected' : ''}>Serial</option>
        <option value="PCI" ${type === 'PCI' ? 'selected' : ''}>PCI</option>
      </select>
      <button class="remove-interface-btn" style="
        background: #e53e3e;
        color: #fff;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
      ">Remove</button>
    `;

    const removeBtn = interfaceItem.querySelector('.remove-interface-btn');
    if (removeBtn) {
      removeBtn.onclick = () => {
        interfaceItem.remove();
      };
    }

    const inputs = interfaceItem.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('keydown', e => e.stopPropagation(), { passive: true });
      input.addEventListener('keyup', e => e.stopPropagation(), { passive: true });
      input.addEventListener('mousedown', e => e.stopPropagation(), { passive: true });
      input.addEventListener('mouseup', e => e.stopPropagation(), { passive: true });
      input.addEventListener('click', e => e.stopPropagation(), { passive: true });
      input.style.pointerEvents = 'auto';
      input.style.zIndex = '10001';
    });

    interfacesList.appendChild(interfaceItem);
  }
}

window.NetworkUtils = NetworkUtils;
