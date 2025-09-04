(function () {
  'use strict';

  class DeviceNodeEditPanel extends window.NodeEditPanel {
    constructor(position) {
      super('device', position);
    }

    generateHTML() {
      return `
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
    }

    setupDeviceSpecificHandlers() {
      const addInterfaceBtn = this.panel.querySelector('#add-interface-btn');
      const createBtn = this.panel.querySelector('#create-node-btn');

      if (addInterfaceBtn) {
        this.addEventListenerWithCleanup(addInterfaceBtn, 'click', () => this.addInterface());
      }

      if (createBtn) {
        this.addEventListenerWithCleanup(createBtn, 'click', () => this.createDevice());
      }

      this.addInterface();
    }

    addInterface() {
      const interfacesList = this.panel.querySelector('#interfaces-list');
      const interfaceCount = this.interfaces.length;
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
      this.interfaces.push(interfaceDiv);
    }

    createDevice() {
      const deviceName = this.panel.querySelector('#device-name').value.trim();
      const deviceType = this.panel.querySelector('#device-type').value;

      if (!deviceName) {
        alert('Device name is required');
        return;
      }

      const interfaceData = [];
      const interfaceItems = this.panel.querySelectorAll('#interfaces-list > div');

      interfaceItems.forEach(item => {
        const label = item.querySelector('.interface-label').value.trim();
        const type = item.querySelector('.interface-type').value;
        if (label) {
          interfaceData.push({ label, type });
        }
      });

      if (window.createCustomDeviceNode) {
        window.createCustomDeviceNode(deviceName, deviceType, interfaceData, this.position);
      }

      this.close();
    }
  }

  window.DeviceNodeEditPanel = DeviceNodeEditPanel;
})();
