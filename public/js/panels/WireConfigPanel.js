(function () {
  'use strict';
//todo fix the configs 
  class WireConfigPanel extends window.BasePanel {
    constructor() {
      super('wire-config-panel', {
        top: '60px',
        right: '10px',
        left: 'auto',
        transform: 'none',
        background: 'rgba(45, 55, 72, 0.98)',
        border: '2px solid #e4870eff',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
        maxWidth: '340px',
        maxHeight: '100vh',
        overflowY: 'auto',
        zIndex: '9999',
      });
    }

    generateHTML() {
      return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Wire Configuration</h3>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #a0aec0; font-size: 11px;">(ESC to close)</span>
                    <button id="close-config-btn" style="
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
            </div>
            <!-- Global Settings (apply to both modes) -->
            <div id="global-section" style="display: grid; grid-template-columns: 1fr 80px; gap: 8px; align-items: center; margin-bottom: 15px; padding: 12px; background: rgba(160, 174, 192, 0.1); border-radius: 6px; border-left: 3px solid #a0aec0;">
                <div style="grid-column: 1 / -1; margin-bottom: 8px; color: #a0aec0; font-weight: bold; font-size: 13px;">⚙️ Global Settings</div>
                <label style="color: #a0aec0;" title="Roundness of wire corners">Corner Radius:</label>
                <input type="number" id="corner-radius" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.CORNER_RADIUS : 15}" min="5" max="30" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="How far to go from the node">Wire Offset Increment:</label>
                <input type="number" id="wire-offset-increment" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.WIRE_OFFSET_INCREMENT : 500}" min="10" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Wire Routing Mode:</label>
                <select id="wire-routing-mode" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                    <option value="orthogonal" selected>Orthogonal</option>
                    <option value="bus">bus - WIP</option>
                </select>
            </div>

            <div id="group-section" style="display: grid; grid-template-columns: 1fr 80px; gap: 8px; align-items: center; margin-bottom: 15px; padding: 12px; background: rgba(160, 174, 192, 0.1); border-radius: 6px; border-left: 3px solid #a0aec0;">
                <div style="grid-column: 1 / -1; margin-bottom: 8px; color: #a0aec0; font-weight: bold; font-size: 13px;">📦 Group Settings</div>
                <label style="color: #a0aec0;" title="Horizontal gap between groups">Group Horizontal Gap:</label>
                <input type="number" id="group-horizontal-gap" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.GROUP_HORIZONTAL_GAP : 120}" min="50" max="200" step="
                    style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Vertical gap between groups">Group Vertical Gap:</label>
                <input type="number" id="group-vertical-gap" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.GROUP_VERTICAL_GAP : 80}" min="30" max="150" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
            </div>
            
            <div style="margin-top: 15px; display: flex; gap: 8px;">
                <button id="apply-config-btn" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: #e4870eff;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Apply</button>
                <button id="copy-config-btn" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: #22c55e;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Copy Settings</button>
                <button id="reset-config-btn" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: #4a5568;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Reset</button>
            </div>
        `;
    }

    afterCreate() {
      this.setupWireConfigEventHandlers();
      this.setupInputEventHandlers();

      const firstInput = this.panel.querySelector('input');
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
          firstInput.select();
        }, 100);
      }
    }

    setupWireConfigEventHandlers() {
      const closeBtn = this.panel.querySelector('#close-config-btn');
      if (closeBtn) {
        this.addEventListenerWithCleanup(closeBtn, 'click', () => this.remove());
      }

      const modeSelect = this.panel.querySelector('#wire-routing-mode');
      if (modeSelect) {
        this.addEventListenerWithCleanup(modeSelect, 'change', () => this.updateVisibleSections(), {
          passive: true,
        });
      }

      const applyBtn = this.panel.querySelector('#apply-config-btn');
      if (applyBtn) {
        this.addEventListenerWithCleanup(applyBtn, 'click', () => {
          if (window.applyWireConfig) window.applyWireConfig();
        });
      }

      const copyBtn = this.panel.querySelector('#copy-config-btn');
      if (copyBtn) {
        this.addEventListenerWithCleanup(copyBtn, 'click', () => {
          if (window.copySettingsToClipboard) window.copySettingsToClipboard();
        });
      }

      const resetBtn = this.panel.querySelector('#reset-config-btn');
      if (resetBtn) {
        this.addEventListenerWithCleanup(resetBtn, 'click', () => {
          if (window.resetWireConfig) window.resetWireConfig();
        });
      }

      this.updateVisibleSections();
    }

    updateVisibleSections() {
      const modeSelect = this.panel.querySelector('#wire-routing-mode');
      if (!modeSelect) return;
      const mode = modeSelect.value;
    }
  }

  window.WireConfigPanel = WireConfigPanel;
})();
