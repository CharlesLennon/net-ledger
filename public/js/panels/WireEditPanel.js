(function () {
  'use strict';

  class WireEditPanel extends window.BasePanel {
    constructor(link) {
      super('wire-edit-panel', {
        top: '150px',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: '300px',
        maxWidth: '400px',
      });
      this.link = link;
    }

    generateHTML() {
      return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Edit Wire</h3>
                    <button id="close-wire-edit-btn" style="
                        background: none;
                        border: none;
                        color: #a0aec0;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                <div style="display: grid; gap: 12px;">
                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Cable Type:</label>
                        <select id="cable-type-select" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                            <option value="cat6">Cat 6</option>
                            <option value="cat5e">Cat 5e</option>
                            <option value="fiber">Fiber</option>
                            <option value="copper">Copper</option>
                            <option value="coaxial">Coaxial</option>
                            <option value="power">Power</option>
                        </select>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="color: #a0aec0;">Color Preview:</label>
                        <div id="color-preview" style="width: 20px; height: 20px; border-radius: 3px; border: 1px solid #4a5568;"></div>
                        <span id="color-name" style="color: #a0aec0; font-size: 11px;"></span>
                    </div>
                </div>
                <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="cancel-wire-btn" style="
                        padding: 8px 16px;
                        background: #4a5568;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Cancel</button>
                    <button id="update-wire-btn" style="
                        padding: 8px 16px;
                        background: #e4870eff;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Update Wire</button>
                </div>
            `;
    }

    afterCreate() {
      if (window.canvasInstance) {
        window.canvasInstance.allow_interaction = false;
        window.canvasInstance.allow_drag = false;
        window.canvasInstance.allow_reconnect_links = false;
      }

      this.setupWireEditEventHandlers();
      this.setupInputEventHandlers();
      this.updateColorPreview();

      const cableTypeSelect = this.panel.querySelector('#cable-type-select');
      if (cableTypeSelect) {
        cableTypeSelect.focus();
      }
    }

    setupWireEditEventHandlers() {
      const closeBtn = this.panel.querySelector('#close-wire-edit-btn');
      if (closeBtn) {
        this.addEventListenerWithCleanup(closeBtn, 'click', () => this.close());
      }

      const cancelBtn = this.panel.querySelector('#cancel-wire-btn');
      if (cancelBtn) {
        this.addEventListenerWithCleanup(cancelBtn, 'click', () => this.close());
      }

      const updateBtn = this.panel.querySelector('#update-wire-btn');
      if (updateBtn) {
        this.addEventListenerWithCleanup(updateBtn, 'click', () => this.updateWire());
      }

      const cableTypeSelect = this.panel.querySelector('#cable-type-select');
      if (cableTypeSelect) {
        this.addEventListenerWithCleanup(cableTypeSelect, 'change', () =>
          this.updateColorPreview()
        );
      }
    }

    updateColorPreview() {
      const cableTypeSelect = this.panel.querySelector('#cable-type-select');
      const colorPreview = this.panel.querySelector('#color-preview');
      const colorName = this.panel.querySelector('#color-name');

      if (!cableTypeSelect) return;

      const selectedCableType = cableTypeSelect.value;
      const color = window.getCableColor ? window.getCableColor(selectedCableType) : '#666';

      if (colorPreview) {
        colorPreview.style.backgroundColor = color;
      }

      if (colorName && window.CONNECTION_COLORS) {
        const colorNames = {
          [window.CONNECTION_COLORS.CABLE_CAT6]: 'Blue (Cat 6)',
          [window.CONNECTION_COLORS.CABLE_CAT5E]: 'Green (Cat 5e)',
          [window.CONNECTION_COLORS.CABLE_FIBER]: 'Orange (Fiber)',
          [window.CONNECTION_COLORS.CABLE_COPPER]: 'Gray (Copper)',
          [window.CONNECTION_COLORS.CABLE_COAXIAL]: 'Black (Coaxial)',
          [window.CONNECTION_COLORS.POWER]: 'Red (Power)',
        };
        colorName.textContent = colorNames[color] || 'Unknown';
      }
    }

    updateWire() {
      const cableTypeSelect = this.panel.querySelector('#cable-type-select');
      const newCableType = cableTypeSelect ? cableTypeSelect.value : 'cat6';

      if (window.updateWireProperties) {
        window.updateWireProperties(this.link, newCableType);
      }

      this.close();
    }

    close() {
      this.remove();
      if (window.canvasInstance) {
        window.canvasInstance.allow_interaction = true;
        window.canvasInstance.allow_drag = true;
        window.canvasInstance.allow_reconnect_links = true;
      }
    }
  }

  window.WireEditPanel = WireEditPanel;
})();
