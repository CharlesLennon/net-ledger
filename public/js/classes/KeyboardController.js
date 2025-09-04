/**
 * Handles keyboard controls, zoom, and panning functionality
 */
class KeyboardController {
  constructor() {
    this.config = {
      PAN_SPEED: 20,
      SMOOTH_PANNING: true,
      PAN_ACCELERATION: 1.5,
      ZOOM_SPEED: 0.1,
    };
    this.keysPressed = new Set();
    this.animationFrameId = null;
  }

  setupEventListeners() {
    const canvasElement = document.getElementById('mycanvas');
    if (!canvasElement) return;

    canvasElement.tabIndex = 0;
    canvasElement.style.outline = 'none';

    document.addEventListener('keydown', event => this.handleKeyDown(event));
    document.addEventListener('keyup', event => this.handleKeyUp(event));
  }

  handleKeyDown(event) {
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true')
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    this.keysPressed.add(key);

    if (key === '+' || key === '=') {
      event.preventDefault();
      this.zoomCanvas(1);
      return;
    }

    if (key === '-' || key === '_') {
      event.preventDefault();
      this.zoomCanvas(-1);
      return;
    }

    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
    }

    if (!this.animationFrameId) {
      this.startSmoothPanning();
    }
  }

  handleKeyUp(event) {
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true')
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    this.keysPressed.delete(key);

    if (this.keysPressed.size === 0 && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  zoomCanvas(direction) {
    const canvas = window.canvasInstance;
    if (!canvas) return;

    if (canvas.ds && canvas.ds.scale !== undefined) {
      const currentScale = canvas.ds.scale;
      const newScale = Math.max(
        0.1,
        Math.min(2.0, currentScale + direction * this.config.ZOOM_SPEED)
      );
      if (newScale !== currentScale) {
        canvas.ds.scale = newScale;
        setTimeout(() => canvas.setDirty(true, true), 0);
      }
    } else if (canvas.scale !== undefined) {
      const currentScale = canvas.scale;
      const newScale = Math.max(
        0.1,
        Math.min(2.0, currentScale + direction * this.config.ZOOM_SPEED)
      );
      if (newScale !== currentScale) {
        canvas.scale = newScale;
        setTimeout(() => canvas.setDirty(true, true), 0);
      }
    }
  }

  startSmoothPanning() {
    const canvas = window.canvasInstance;
    if (!canvas) return;

    const pan = () => {
      if (this.keysPressed.size === 0) return;

      let deltaX = 0;
      let deltaY = 0;
      let speed = this.config.PAN_SPEED;

      if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) deltaY += speed;
      if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) deltaY -= speed;
      if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) deltaX += speed;
      if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) deltaX -= speed;

      if (this.keysPressed.size > 1) {
        deltaX *= this.config.PAN_ACCELERATION;
        deltaY *= this.config.PAN_ACCELERATION;
      }

      if (canvas.ds && canvas.ds.offset !== undefined) {
        canvas.ds.offset[0] += deltaX;
        canvas.ds.offset[1] += deltaY;
      } else if (canvas.offset !== undefined) {
        canvas.offset[0] += deltaX;
        canvas.offset[1] += deltaY;
      }

      if (canvas.pan !== undefined && typeof canvas.pan === 'function') {
        canvas.pan(deltaX, deltaY);
      }

      if (!window.panRefreshTimeout) {
        window.panRefreshTimeout = setTimeout(() => {
          canvas.setDirty(true, true);
          window.panRefreshTimeout = null;
        }, 16);
      }

      this.animationFrameId = requestAnimationFrame(pan);
    };

    this.animationFrameId = requestAnimationFrame(pan);
  }
}

window.KeyboardController = KeyboardController;
