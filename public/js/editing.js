(function () {
  'use strict';
  function editNode(node) {
    if (node instanceof DeviceNode) {
      editDeviceNode(node);
    } else if (node instanceof ServiceNode) {
      editServiceNode(node);
    } else if (node instanceof PciCardNode) {
      editPciCardNode(node);
    }
  }
  function editDeviceNode(node) {
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
    panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Edit Device Node</h3>
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
                    <input type="text" id="device-name" placeholder="e.g. Cisco Switch 2960" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.deviceData ? node.deviceData.model_name : node.title}">
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
                <button id="update-node-btn" style="
                    padding: 8px 16px;
                    background: #e4870eff;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Update Node</button>
            </div>
        `;
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
    setupDeviceEditPanel(node);
  }
  function editServiceNode(node) {
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
    panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Edit Service Node</h3>
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
                    <input type="text" id="service-name" placeholder="e.g. Web Server" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.serviceData ? node.serviceData.name : node.title}">
                </div>
                <div>
                    <label style="color: #a0aec0; display: block; margin-bottom: 4px;">IP Address:</label>
                    <input type="text" id="service-ip" placeholder="192.168.1.100" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.ipAddress || '192.168.1.100'}">
                </div>
                <div>
                    <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Port:</label>
                    <input type="number" id="service-port" placeholder="80" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.portNumber || 80}" min="1" max="65535">
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
                <button id="update-node-btn" style="
                    padding: 8px 16px;
                    background: #e4870eff;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Update Node</button>
            </div>
        `;
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
    setupServiceEditPanel(node);
  }
  function editPciCardNode(node) {
    alert('PCI card editing is not yet implemented.');
  }
  function editWire(link) {
    const existingPanel = document.getElementById('wire-edit-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    const currentCableType = link.cable_type || 'cat6';
    const panel = document.createElement('div');
    panel.id = 'wire-edit-panel';
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
            min-width: 350px;
            max-width: 500px;
            pointer-events: auto;
        `;
    panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Edit Wire Properties</h3>
                <button id="close-wire-edit-panel-btn" style="
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
                        <option value="cat6" ${currentCableType === 'cat6' ? 'selected' : ''}>Cat 6 (Ethernet)</option>
                        <option value="cat5e" ${currentCableType === 'cat5e' ? 'selected' : ''}>Cat 5e (Ethernet)</option>
                        <option value="fiber" ${currentCableType === 'fiber' ? 'selected' : ''}>Fiber Optic</option>
                        <option value="copper" ${currentCableType === 'copper' ? 'selected' : ''}>Copper</option>
                        <option value="coaxial" ${currentCableType === 'coaxial' ? 'selected' : ''}>Coaxial</option>
                        <option value="power" ${currentCableType === 'power' ? 'selected' : ''}>Power</option>
                    </select>
                </div>
                <div style="background: #1a202c; padding: 8px; border-radius: 4px; border: 1px solid #2d3748;">
                    <div style="color: #a0aec0; font-size: 11px; margin-bottom: 4px;">Current Color:</div>
                    <div id="current-color-display" style="display: flex; align-items: center; gap: 8px;">
                        <div id="color-preview" style="width: 20px; height: 20px; border-radius: 3px; border: 1px solid #4a5568;"></div>
                        <span id="color-name" style="font-size: 11px; color: #e2e8f0;"></span>
                    </div>
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
    setupWireEditPanel(link);
    document.getElementById('close-wire-edit-panel-btn').onclick = () => {
      panel.remove();
      if (window.canvasInstance) {
        window.canvasInstance.canvas.style.pointerEvents = 'auto';
      }
    };
    document.getElementById('cancel-wire-btn').onclick = () => {
      panel.remove();
      if (window.canvasInstance) {
        window.canvasInstance.canvas.style.pointerEvents = 'auto';
      }
    };
  }
  function setupDeviceEditPanel(node) {
    const deviceNameInput = document.getElementById('device-name');
    const interfacesList = document.getElementById('interfaces-list');
    const addInterfaceBtn = document.getElementById('add-interface-btn');
    const updateBtn = document.getElementById('update-node-btn');
    if (deviceNameInput && node.deviceData) {
      deviceNameInput.value = node.deviceData.model_name || node.title;
    }
    if (interfacesList) {
      interfacesList.innerHTML = '';
    }
    if (node.deviceInterfaces && node.deviceInterfaces.length > 0) {
      node.deviceInterfaces.forEach((iface, index) => {
        if (window.addInterfaceToList) {
          window.addInterfaceToList(
            iface.label || `Interface ${index + 1}`,
            iface.interface_type || 'RJ45',
            index
          );
        }
      });
    }
    if (node.outputs) {
      node.outputs.forEach((output, index) => {
        if (output.name !== 'power') {
          if (window.addInterfaceToList) {
            window.addInterfaceToList(output.name, output.type || 'RJ45', index);
          }
        }
      });
    }
    if (addInterfaceBtn) {
      addInterfaceBtn.onclick = () => {
        const interfacesList = document.getElementById('interfaces-list');
        const interfaceCount = interfacesList.children.length;
        if (window.addInterfaceToList) {
          window.addInterfaceToList(`Interface ${interfaceCount + 1}`, 'RJ45', interfaceCount);
        }
      };
    }
    if (updateBtn) {
      updateBtn.onclick = () => {
        const newName = deviceNameInput.value.trim();
        if (!newName) {
          alert('Device name is required');
          return;
        }
        const newInterfaces = [];
        const interfaceItems = document.querySelectorAll('.interface-item');
        interfaceItems.forEach(item => {
          const label = item.querySelector('.interface-label').value.trim();
          const type = item.querySelector('.interface-type').value;
          if (label) {
            newInterfaces.push({ label, type });
          }
        });
        if (window.updateDeviceNode) {
          window.updateDeviceNode(node, newName, newInterfaces);
        }
        document.getElementById('node-edit-panel').remove();
        if (window.canvasInstance) {
          window.canvasInstance.canvas.style.pointerEvents = 'auto';
        }
      };
    }
    const inputs = [deviceNameInput];
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
    if (deviceNameInput) {
      setTimeout(() => {
        deviceNameInput.focus();
        deviceNameInput.select();
      }, 100);
    }
  }
  function setupServiceEditPanel(node) {
    const serviceNameInput = document.getElementById('service-name');
    const serviceIpInput = document.getElementById('service-ip');
    const servicePortInput = document.getElementById('service-port');
    const updateBtn = document.getElementById('update-node-btn');
    if (serviceNameInput) {
      serviceNameInput.value = node.serviceData ? node.serviceData.name : node.title;
    }
    if (serviceIpInput) {
      serviceIpInput.value = node.ipAddress || '192.168.1.100';
    }
    if (servicePortInput) {
      servicePortInput.value = node.portNumber || 80;
    }
    if (updateBtn) {
      updateBtn.onclick = () => {
        const newName = serviceNameInput.value.trim();
        const newIP = serviceIpInput.value.trim();
        const newPort = parseInt(servicePortInput.value);
        if (!newName) {
          alert('Service name is required');
          return;
        }
        if (!newIP) {
          alert('IP address is required');
          return;
        }
        if (!newPort || newPort < 1 || newPort > 65535) {
          alert('Valid port number (1-65535) is required');
          return;
        }
        if (window.updateServiceNode) {
          window.updateServiceNode(node, newName, newIP, newPort);
        }
        document.getElementById('node-edit-panel').remove();
        if (window.canvasInstance) {
          window.canvasInstance.canvas.style.pointerEvents = 'auto';
        }
      };
    }
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
  }
  function setupWireEditPanel(link) {
    const cableTypeSelect = document.getElementById('cable-type-select');
    const updateBtn = document.getElementById('update-wire-btn');
    const colorPreview = document.getElementById('color-preview');
    const colorName = document.getElementById('color-name');
    function updateColorPreview() {
      const selectedType = cableTypeSelect.value;
      const color = window.getCableColor ? window.getCableColor(selectedType) : '#9ca3af';
      if (colorPreview) {
        colorPreview.style.backgroundColor = color;
      }
      if (colorName) {
        colorName.textContent = selectedType.toUpperCase();
      }
    }
    updateColorPreview();
    if (cableTypeSelect) {
      cableTypeSelect.addEventListener('change', updateColorPreview, { passive: true });
    }
    if (updateBtn) {
      updateBtn.onclick = () => {
        const newCableType = cableTypeSelect.value;
        if (window.updateWireProperties) {
          window.updateWireProperties(link, newCableType);
        }
        document.getElementById('wire-edit-panel').remove();
        if (window.canvasInstance) {
          window.canvasInstance.canvas.style.pointerEvents = 'auto';
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
      }
    });
    if (cableTypeSelect) {
      setTimeout(() => {
        cableTypeSelect.focus();
      }, 100);
    }
  }
  window.editNode = editNode;
  window.editDeviceNode = editDeviceNode;
  window.editServiceNode = editServiceNode;
  window.editPciCardNode = editPciCardNode;
  window.editWire = editWire;
  window.setupDeviceEditPanel = setupDeviceEditPanel;
  window.setupServiceEditPanel = setupServiceEditPanel;
  window.setupWireEditPanel = setupWireEditPanel;
})();
