(function () {
  'use strict';

  class KeyboardControlsPanel extends window.BasePanel {
    constructor() {
      super('keyboard-controls-info', {
        top: '10px',
        right: '10px',
        left: 'auto',
        transform: 'none',
        background: 'rgba(45, 55, 72, 0.9)',
        border: '1px solid #4a5568',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '200px',
        zIndex: '1000',
      });
    }

    generateHTML() {
      return `
            <div style="font-weight: bold; margin-bottom: 8px; color: #e4870eff;">Navigation</div>
            <div style="margin-bottom: 4px;"><kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">WASD</kbd> or <kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">↑←↓→</kbd></div>
            <div style="margin-bottom: 8px; color: #a0aec0; font-size: 11px;">Hold for smooth panning</div>
            <div style="font-weight: bold; margin-bottom: 4px; color: #e4870eff;">Zoom</div>
            <div style="margin-bottom: 4px;"><kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">+</kbd> <kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">-</kbd></div>
            <div style="color: #a0aec0; font-size: 11px;">Zoom in/out</div>
        `;
    }

    afterCreate() {
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.cssText = `
            position: absolute;
            top: 4px;
            right: 8px;
            background: none;
            border: none;
            color: #a0aec0;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

      this.addEventListenerWithCleanup(closeButton, 'click', () => this.remove());
      this.panel.appendChild(closeButton);

      setTimeout(() => {
        if (this.panel && this.panel.parentNode) {
          this.remove();
        }
      }, 10000);
    }
  }

  window.KeyboardControlsPanel = KeyboardControlsPanel;
})();
