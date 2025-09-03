(function () {
  'use strict';
  function createWireConfigPanel() {
    const existingPanel = document.getElementById('wire-config-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }
    const panel = document.createElement('div');
    panel.id = 'wire-config-panel';
    panel.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: rgba(45, 55, 72, 0.98);
            color: #FFFFFF;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 9999;
            border: 2px solid #e4870eff;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            max-width: 340px;
            max-height: 100vh;
            overflow-y: auto;
        `;
    panel.innerHTML = `
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
                <label style="color: #a0aec0;" title="Offset increment for overlapping wires">Wire Offset Increment:</label>
                <input type="number" id="wire-offset-increment" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.WIRE_OFFSET_INCREMENT : 30}" min="10" max="50" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Wire Routing Mode:</label>
                <select id="wire-routing-mode" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                    <option value="channel">Channel Routing</option>
                    <option value="distance">Distance Based Routing</option>
                </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 80px; gap: 8px; align-items: center;">
                <!-- Power Settings Section -->
                <div id="power-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(228, 135, 14, 0.1); border-radius: 6px; border-left: 3px solid #e4870eff;">
                    <div style="color: #e4870eff; font-weight: bold; font-size: 13px; margin-bottom: 6px;">⚡ Power Wire Settings</div>
                </div>
                <label style="color: #a0aec0;" title="Distance between power wire channels">Channel Spacing:</label>
                <input type="number" id="power-channel-offset" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.POWER_CHANNEL_OFFSET : 20}" min="20" max="200" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Additional left offset for power wires beyond the base left offset (set to 0 to align with regular wires)">Left Offset:</label>
                <input type="number" id="power-offset-left" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.POWER_OFFSET_LEFT : 200}" min="50" max="400" step="25" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Additional right offset for power wires">Right Offset:</label>
                <input type="number" id="power-offset-right" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.POWER_OFFSET_RIGHT : 400}" min="50" max="400" step="25" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Spacing between power wires">Wire Spacing:</label>
                <input type="number" id="power-wire-spacing" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.POWER_WIRE_SPACING : 60}" min="20" max="150" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <!-- Left Side Settings Section -->
                <div id="left-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(74, 86, 104, 0.3); border-radius: 6px; border-left: 3px solid #4a5568;">
                    <div style="color: #4a5568; font-weight: bold; font-size: 13px; margin-bottom: 6px;">⬅️ Left Side Settings</div>
                </div>
                <label style="color: #a0aec0;" title="Base left offset for all wires (power wires use this as their base)">Left Offset:</label>
                <input type="number" id="non-power-offset-left" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT : 600}" min="100" max="600" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Spacing between network wire channels">Network Channel Offset:</label>
                <input type="number" id="network-channel-offset" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET || 20 : 20}" min="10" max="100" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Spacing between wires on the left side">Left Wire Spacing:</label>
                <input type="number" id="left-wire-spacing" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.LEFT_WIRE_SPACING : 25}" min="20" max="100" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="General spacing between wires">Wire Spacing:</label>
                <input type="number" id="wire-spacing" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.WIRE_SPACING : 30}" min="20" max="100" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <!-- Right Side Settings Section -->
                <div id="right-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(74, 86, 104, 0.3); border-radius: 6px; border-left: 3px solid #4a5568;">
                    <div style="color: #4a5568; font-weight: bold; font-size: 13px; margin-bottom: 6px;">➡️ Right Side Settings</div>
                </div>
                <label style="color: #a0aec0;" title="How far right non-power wires route">Right Offset:</label>
                <input type="number" id="non-power-offset-right" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_RIGHT : 600}" min="100" max="600" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <!-- Horizontal Positioning Section -->
                <div id="horizontal-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(66, 153, 225, 0.1); border-radius: 6px; border-left: 3px solid #4299e1;">
                    <div style="color: #4299e1; font-weight: bold; font-size: 13px; margin-bottom: 6px;">📍 Horizontal Positioning</div>
                </div>
                <label style="color: #a0aec0;" title="X position for left-side vertical wire channel">Left Channel Position:</label>
                <input type="number" id="horizontal-offset-left" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.HORIZONTAL_OFFSET_LEFT : 200}" min="200" max="800" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="X position for right-side vertical wire channel">Right Channel Position:</label>
                <input type="number" id="horizontal-offset-right" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.HORIZONTAL_OFFSET_RIGHT : 1020}" min="800" max="1500" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <!-- Channel-Based Routing Section -->
                <div id="channel-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; border-left: 3px solid #22c55e;">
                    <div style="color: #22c55e; font-weight: bold; font-size: 13px; margin-bottom: 6px;">🌐 Channel-Based Routing</div>
                </div>
                <label style="color: #a0aec0;" title="Enable channel-based routing instead of offset-based">Enable Channel Routing:</label>
                <input type="checkbox" id="enable-channel-routing" ${window.WIRE_ROUTING_CONFIG && window.WIRE_ROUTING_CONFIG.ENABLE_CHANNEL_ROUTING ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #22c55e;">
                <label style="color: #a0aec0;" title="Fixed X position for left-side vertical wire channel">Left Channel X:</label>
                <input type="number" id="left-channel-x" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X : -300}" min="-800" max="200" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Fixed X position for right-side vertical wire channel">Right Channel X:</label>
                <input type="number" id="right-channel-x" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.RIGHT_CHANNEL_X : 1250}" min="800" max="1500" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Spacing between wires within the same channel">Channel Spacing:</label>
                <input type="number" id="channel-spacing" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.CHANNEL_SPACING : 30}" min="20" max="100" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                <label style="color: #a0aec0;" title="Width of each routing channel">Channel Width:</label>
                <input type="number" id="channel-width" value="${window.WIRE_ROUTING_CONFIG ? window.WIRE_ROUTING_CONFIG.CHANNEL_WIDTH : 60}" min="30" max="150" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
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
    document.body.appendChild(panel);
    function updateVisibleSections() {
      const mode = document.getElementById('wire-routing-mode').value;
      const sectionMappings = {
        'power-section': 'channel',
        'left-section': 'channel',
        'right-section': 'channel',
        'horizontal-section': 'distance',
        'channel-section': 'channel',
      };
      let currentSection = null;
      let elementsInCurrentSection = [];
      const allElements = panel.querySelectorAll('*');
      allElements.forEach(element => {
        if (element.id && sectionMappings.hasOwnProperty(element.id)) {
          if (currentSection && elementsInCurrentSection.length > 0) {
            const shouldShow = sectionMappings[currentSection] === mode;
            elementsInCurrentSection.forEach(el => {
              el.style.display = shouldShow ? 'block' : 'none';
            });
          }
          currentSection = element.id;
          elementsInCurrentSection = [element];
        } else if (currentSection) {
          elementsInCurrentSection.push(element);
        }
      });
      if (currentSection) {
        const shouldShow = sectionMappings[currentSection] === mode;
        elementsInCurrentSection.forEach(el => {
          el.style.display = shouldShow ? 'block' : 'none';
        });
      }
    }
    document
      .getElementById('wire-routing-mode')
      .addEventListener('change', updateVisibleSections, { passive: true });
    updateVisibleSections();
    const wireConfigInputs = panel.querySelectorAll('input, select, button');
    wireConfigInputs.forEach((input, index) => {
      if (input) {
        input.addEventListener(
          'keydown',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'keyup',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'mousedown',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'mouseup',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'click',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.style.pointerEvents = 'auto';
        input.style.zIndex = '10001';
        if (input.tagName === 'INPUT') {
          input.addEventListener('focus', () => {}, { passive: true });
          input.addEventListener('blur', () => {}, { passive: true });
        }
      }
    });
    const firstInput = panel.querySelector('input');
    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
        firstInput.select();
      }, 100);
    }
    const handleEscape = e => {
      if (e.key === 'Escape') {
        panel.remove();
        document.removeEventListener('keydown', handleEscape);
        if (panel._cleanupDrag) {
          panel._cleanupDrag();
        }
        if (panel._cleanupClickOutside) {
          panel._cleanupClickOutside();
        }
      }
    };
    document.addEventListener('keydown', handleEscape, { passive: true });
    const closePanel = e => {
      if (e.target === panel) {
        panel.remove();
        document.removeEventListener('click', closePanel);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closePanel, { passive: true });
    }, 100);
    document.getElementById('apply-config-btn').onclick = window.applyWireConfig || function () {};
    document.getElementById('copy-config-btn').onclick =
      window.copySettingsToClipboard || function () {};
    document.getElementById('reset-config-btn').onclick = window.resetWireConfig || function () {};
    if (window.makeDraggable) {
      window.makeDraggable(panel);
    }
  }
  function createNodeEditPanel(nodeType, position) {
    const existingPanel = document.getElementById('node-edit-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    const panel = document.createElement('div');
    panel.id = 'node-edit-panel';
    panel.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(45, 55, 72, 0.95);
            color: #FFFFFF;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 10000;
            border: 1px solid #4a5568;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            min-width: 400px;
            max-width: 600px;
            pointer-events: auto;
        `;
    if (nodeType === 'device') {
      panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Create Device Node</h3>
                    <button id="close-edit-panel-btn" style="
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
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Device Name/Model:</label>
                        <input type="text" id="device-name" placeholder="e.g. Cisco Switch 2960" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                    </div>
                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Device Type:</label>
                        <select id="device-type" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                            <option value="switch">Network Switch</option>
                            <option value="router">Router</option>
                            <option value="firewall">Firewall</option>
                            <option value="server">Server</option>
                            <option value="workstation">Workstation</option>
                            <option value="printer">Printer</option>
                            <option value="access-point">Access Point</option>
                            <option value="storage">Storage Device</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div id="interfaces-section">
                        <label style="color: #a0aec0; display: block; margin-bottom: 8px;">Interfaces:</label>
                        <div id="interfaces-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 8px;">
                            <!-- Interfaces will be added here -->
                        </div>
                        <button id="add-interface-btn" style="
                            background: #4299e1;
                            color: #fff;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 11px;
                        ">Add Interface</button>
                    </div>
                </div>
                <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="cancel-node-btn" style="
                        padding: 8px 16px;
                        background: #4a5568;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Cancel</button>
                    <button id="create-node-btn" style="
                        padding: 8px 16px;
                        background: #e4870eff;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Create Device</button>
                </div>
            `;
    } else if (nodeType === 'service') {
      panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Create Service Node</h3>
                    <button id="close-edit-panel-btn" style="
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
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Service Name:</label>
                        <input type="text" id="service-name" placeholder="e.g. Web Server" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                    </div>
                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">IP Address:</label>
                        <input type="text" id="service-ip" placeholder="192.168.1.100" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                    </div>
                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Port:</label>
                        <input type="number" id="service-port" placeholder="80" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" min="1" max="65535">
                    </div>
                </div>
                <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="cancel-node-btn" style="
                        padding: 8px 16px;
                        background: #4a5568;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Cancel</button>
                    <button id="create-node-btn" style="
                        padding: 8px 16px;
                        background: #e4870eff;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Create Service</button>
                </div>
            `;
    }
    if (window.canvasInstance) {
      window.canvasInstance.canvas.style.pointerEvents = 'none';
    }
    panel.addEventListener(
      'mousedown',
      e => {
        e.stopPropagation();
      },
      { passive: true }
    );
    panel.addEventListener(
      'mouseup',
      e => {
        e.stopPropagation();
      },
      { passive: true }
    );
    panel.addEventListener(
      'click',
      e => {
        e.stopPropagation();
      },
      { passive: true }
    );
    document.body.appendChild(panel);
    if (window.makeDraggable) {
      window.makeDraggable(panel);
    }
    document.getElementById('close-edit-panel-btn').onclick = () => {
      panel.remove();
      if (window.canvasInstance) {
        window.canvasInstance.canvas.style.pointerEvents = 'auto';
      }
    };
    document.getElementById('cancel-node-btn').onclick = () => {
      panel.remove();
      if (window.canvasInstance) {
        window.canvasInstance.canvas.style.pointerEvents = 'auto';
      }
    };
    if (nodeType === 'device') {
      setupDevicePanel(position);
    } else if (nodeType === 'service') {
      setupServicePanel(position);
    }
  }
  function setupDevicePanel(position) {
    let interfaces = [];
    const addInterfaceBtn = document.getElementById('add-interface-btn');
    const interfacesList = document.getElementById('interfaces-list');
    const createBtn = document.getElementById('create-node-btn');
    function addInterface() {
      const interfaceCount = interfaces.length;
      const interfaceDiv = document.createElement('div');
      interfaceDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding: 6px;
                background: #1a202c;
                border-radius: 4px;
                border: 1px solid #2d3748;
            `;
      interfaceDiv.innerHTML = `
                <input type="text" placeholder="Interface ${interfaceCount + 1}" style="
                    flex: 1;
                    padding: 4px;
                    border-radius: 3px;
                    border: 1px solid #4a5568;
                    background: #2d3748;
                    color: #fff;
                    font-size: 11px;
                " class="interface-label">
                <select style="
                    padding: 4px;
                    border-radius: 3px;
                    border: 1px solid #4a5568;
                    background: #2d3748;
                    color: #fff;
                    font-size: 11px;
                " class="interface-type">
                    <option value="RJ45">RJ45</option>
                    <option value="SFP">SFP</option>
                    <option value="SFP+">SFP+</option>
                    <option value="Power">Power</option>
                    <option value="USB">USB</option>
                    <option value="Serial">Serial</option>
                    <option value="PCI">PCI</option>
                </select>
                <button style="
                    background: #e53e3e;
                    color: #fff;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                " onclick="this.parentNode.remove();">Remove</button>
            `;
      interfacesList.appendChild(interfaceDiv);
      interfaces.push(interfaceDiv);
    }
    if (addInterfaceBtn) {
      addInterfaceBtn.onclick = addInterface;
    } else {
      console.error('Add interface button not found');
    }
    addInterface();
    if (createBtn) {
      createBtn.onclick = () => {
        const deviceName = document.getElementById('device-name').value.trim();
        const deviceType = document.getElementById('device-type').value;
        if (!deviceName) {
          alert('Device name is required');
          return;
        }
        const interfaceData = [];
        const interfaceItems = document.querySelectorAll('#interfaces-list > div');
        interfaceItems.forEach(item => {
          const label = item.querySelector('.interface-label').value.trim();
          const type = item.querySelector('.interface-type').value;
          if (label) {
            interfaceData.push({ label, type });
          }
        });
        if (window.createCustomDeviceNode) {
          window.createCustomDeviceNode(deviceName, deviceType, interfaceData, position);
        }
        document.getElementById('node-edit-panel').remove();
        if (window.canvasInstance) {
          window.canvasInstance.canvas.style.pointerEvents = 'auto';
        }
      };
    } else {
      console.error('Create button not found');
    }
  }
  function setupServicePanel(position) {
    const createBtn = document.getElementById('create-node-btn');
    const serviceNameInput = document.getElementById('service-name');
    const serviceIpInput = document.getElementById('service-ip');
    const servicePortInput = document.getElementById('service-port');
    const inputs = [serviceNameInput, serviceIpInput, servicePortInput];
    inputs.forEach(input => {
      if (input) {
        input.addEventListener(
          'keydown',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'keyup',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
      }
    });
    if (serviceNameInput) {
      setTimeout(() => {
        serviceNameInput.focus();
        serviceNameInput.select();
      }, 100);
    }
    if (createBtn) {
      createBtn.onclick = () => {
        const serviceName = serviceNameInput.value.trim();
        const serviceIP = serviceIpInput.value.trim();
        const servicePort = parseInt(servicePortInput.value);
        if (!serviceName) {
          alert('Service name is required');
          return;
        }
        if (!serviceIP) {
          alert('IP address is required');
          return;
        }
        if (!servicePort || servicePort < 1 || servicePort > 65535) {
          alert('Valid port number (1-65535) is required');
          return;
        }
        if (window.createCustomServiceNode) {
          window.createCustomServiceNode(serviceName, serviceIP, servicePort, position);
        }
        document.getElementById('node-edit-panel').remove();
        if (window.canvasInstance) {
          window.canvasInstance.canvas.style.pointerEvents = 'auto';
        }
      };
    } else {
      console.error('Create button not found');
    }
  }
  function setupWireEditPanel(link) {
    const cableTypeSelect = document.getElementById('cable-type-select');
    const updateBtn = document.getElementById('update-wire-btn');
    const colorPreview = document.getElementById('color-preview');
    const colorName = document.getElementById('color-name');
    function updateColorPreview() {
      const selectedCableType = cableTypeSelect.value;
      const color = getCableColor(selectedCableType);
      if (colorPreview) {
        colorPreview.style.backgroundColor = color;
      }
      if (colorName) {
        const colorNames = {
          [CONNECTION_COLORS.CABLE_CAT6]: 'Blue (Cat 6)',
          [CONNECTION_COLORS.CABLE_CAT5E]: 'Green (Cat 5e)',
          [CONNECTION_COLORS.CABLE_FIBER]: 'Orange (Fiber)',
          [CONNECTION_COLORS.CABLE_COPPER]: 'Gray (Copper)',
          [CONNECTION_COLORS.CABLE_COAXIAL]: 'Black (Coaxial)',
          [CONNECTION_COLORS.POWER]: 'Red (Power)',
        };
        colorName.textContent = colorNames[color] || 'Unknown';
      }
    }
    updateColorPreview();
    if (cableTypeSelect) {
      cableTypeSelect.addEventListener('change', updateColorPreview);
    }
    if (updateBtn) {
      updateBtn.onclick = () => {
        const newCableType = cableTypeSelect ? cableTypeSelect.value : 'cat6';
        updateWireProperties(link, newCableType);
        document.getElementById('wire-edit-panel').remove();
        if (
          document.getElementById('wire-edit-panel') &&
          document.getElementById('wire-edit-panel')._cleanupDrag
        ) {
          document.getElementById('wire-edit-panel')._cleanupDrag();
        }
        if (window.canvasInstance) {
          window.canvasInstance.allow_interaction = true;
          window.canvasInstance.allow_drag = true;
          window.canvasInstance.allow_reconnect_links = true;
        }
      };
    }
    const inputs = [cableTypeSelect];
    inputs.forEach(input => {
      if (input) {
        input.addEventListener(
          'keydown',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'keyup',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'mousedown',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'mouseup',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.addEventListener(
          'click',
          e => {
            e.stopPropagation();
          },
          { passive: true }
        );
        input.style.pointerEvents = 'auto';
        input.style.zIndex = '10001';
      }
    });
    if (cableTypeSelect) {
      cableTypeSelect.focus();
    }
  }
  function showKeyboardControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'keyboard-controls-info';
    controlsDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(45, 55, 72, 0.9);
            color: #FFFFFF;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            border: 1px solid #4a5568;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 200px;
        `;
    controlsDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: #e4870eff;">Navigation</div>
            <div style="margin-bottom: 4px;"><kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">WASD</kbd> or <kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">↑←↓→</kbd></div>
            <div style="margin-bottom: 8px; color: #a0aec0; font-size: 11px;">Hold for smooth panning</div>
            <div style="font-weight: bold; margin-bottom: 4px; color: #e4870eff;">Zoom</div>
            <div style="margin-bottom: 4px;"><kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">+</kbd> <kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">-</kbd></div>
            <div style="color: #a0aec0; font-size: 11px;">Zoom in/out</div>
        `;
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
    closeButton.onclick = () => controlsDiv.remove();
    controlsDiv.appendChild(closeButton);
    document.body.appendChild(controlsDiv);
    setTimeout(() => {
      if (controlsDiv.parentNode) {
        controlsDiv.remove();
      }
    }, 10000);
  }

  window.createWireConfigPanel = createWireConfigPanel;
  window.createNodeEditPanel = createNodeEditPanel;
  window.setupDevicePanel = setupDevicePanel;
  window.setupServicePanel = setupServicePanel;
  window.showKeyboardControls = showKeyboardControls;
})();
