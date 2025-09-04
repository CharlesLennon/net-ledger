(function () {
  'use strict';

  class NodeEditPanel extends window.BasePanel {
    constructor(nodeType, position) {
      super('node-edit-panel');
      this.nodeType = nodeType;
      this.position = position;
      this.interfaces = [];
    }

    afterCreate() {
      if (window.canvasInstance) {
        window.canvasInstance.canvas.style.pointerEvents = 'none';
      }

      this.setupCommonEventHandlers();

      if (this.nodeType === 'device') {
        this.setupDeviceSpecificHandlers();
      } else if (this.nodeType === 'service') {
        this.setupServiceSpecificHandlers();
      }
    }

    setupCommonEventHandlers() {
      const closeBtn = this.panel.querySelector('#close-edit-panel-btn');
      if (closeBtn) {
        this.addEventListenerWithCleanup(closeBtn, 'click', () => this.close());
      }

      const cancelBtn = this.panel.querySelector('#cancel-node-btn');
      if (cancelBtn) {
        this.addEventListenerWithCleanup(cancelBtn, 'click', () => this.close());
      }
    }

    close() {
      this.remove();
      if (window.canvasInstance) {
        window.canvasInstance.canvas.style.pointerEvents = 'auto';
      }
    }

    remove() {
      super.remove();
      if (window.canvasInstance) {
        window.canvasInstance.canvas.style.pointerEvents = 'auto';
      }
    }

    setupDeviceSpecificHandlers() {}

    setupServiceSpecificHandlers() {}
  }

  window.NodeEditPanel = NodeEditPanel;
})();
