(function () {
  'use strict';

  class ServiceNodeEditPanel extends window.NodeEditPanel {
    constructor(position) {
      super('service', position);
    }

    generateHTML() {
      return `
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

    setupServiceSpecificHandlers() {
      const createBtn = this.panel.querySelector('#create-node-btn');
      const serviceNameInput = this.panel.querySelector('#service-name');
      const serviceIpInput = this.panel.querySelector('#service-ip');
      const servicePortInput = this.panel.querySelector('#service-port');

      const inputs = [serviceNameInput, serviceIpInput, servicePortInput];

      inputs.forEach(input => {
        if (input) {
          this.addEventListenerWithCleanup(input, 'keydown', e => e.stopPropagation(), {
            passive: true,
          });
          this.addEventListenerWithCleanup(input, 'keyup', e => e.stopPropagation(), {
            passive: true,
          });
        }
      });

      if (serviceNameInput) {
        setTimeout(() => {
          serviceNameInput.focus();
          serviceNameInput.select();
        }, 100);
      }

      if (createBtn) {
        this.addEventListenerWithCleanup(createBtn, 'click', () => this.createService());
      }
    }

    createService() {
      const serviceName = this.panel.querySelector('#service-name').value.trim();
      const serviceIP = this.panel.querySelector('#service-ip').value.trim();
      const servicePort = parseInt(this.panel.querySelector('#service-port').value);

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
        window.createCustomServiceNode(serviceName, serviceIP, servicePort, this.position);
      }

      this.close();
    }
  }

  window.ServiceNodeEditPanel = ServiceNodeEditPanel;
})();
