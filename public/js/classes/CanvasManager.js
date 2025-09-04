/**
 * Manages canvas setup, resizing, and viewport operations
 */
class CanvasManager {
  constructor() {
    this.canvas = null;
    this.graph = null;
  }

  setupCanvas(canvas) {
    canvas.background_image = null;
    canvas.render_connections_shadows = false;
    canvas.render_connection_arrows = true;
    canvas.highquality_render = true;
    canvas.use_gradients = true;
    this.resizeCanvas(canvas);
    this.canvas = canvas;
  }

  resizeCanvas(canvas) {
    const canvasElement = document.getElementById('mycanvas');
    if (!canvasElement || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvasElement.style.width = `${window.innerWidth}px`;
    canvasElement.style.height = `${window.innerHeight}px`;
    canvasElement.width = window.innerWidth * dpr;
    canvasElement.height = window.innerHeight * dpr;
    canvasElement.getContext('2d').scale(dpr, dpr);
    canvas.resize();
    canvasElement.tabIndex = 0;
    canvasElement.style.outline = 'none';
  }

  preserveCanvasViewport(callback) {
    if (!window.canvasInstance) {
      if (callback) callback();
      return;
    }

    const viewportState = {
      scale: window.canvasInstance.ds
        ? window.canvasInstance.ds.scale
        : window.canvasInstance.scale,
      offset: window.canvasInstance.ds ? [...window.canvasInstance.ds.offset] : [0, 0],
    };

    if (callback) callback();

    setTimeout(() => {
      if (window.canvasInstance) {
        if (window.canvasInstance.ds) {
          if (viewportState.scale !== undefined)
            window.canvasInstance.ds.scale = viewportState.scale;
          if (viewportState.offset) window.canvasInstance.ds.offset = viewportState.offset;
        } else if (viewportState.scale !== undefined) {
          window.canvasInstance.scale = viewportState.scale;
        }
        window.canvasInstance.setDirty(true, false);
      }
    }, 10);
  }

  setupResizeListener() {
    window.addEventListener('resize', () => this.resizeCanvas(window.canvasInstance));
  }
}

window.CanvasManager = CanvasManager;
