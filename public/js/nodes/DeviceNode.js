class DeviceNode extends window.BaseNetworkNode {
  constructor() {
    super();
    this.size = [200, 100];
    this.addInput('power', 'power');
    this.deviceData = null;
    this.deviceInterfaces = [];
  }

  setDeviceData(deviceData, deviceInterfaces) {
    this.deviceData = deviceData;
    this.deviceInterfaces = deviceInterfaces;
    this.title = deviceData.model_name;
    this.size[0] = this.calculateTitleWidth(200, 40);
    this.size[1] = 60;

    const isPDU =
      deviceData.model_name &&
      (deviceData.model_name.toLowerCase().includes('pdu') ||
        deviceData.model_name.toLowerCase().includes('apc') ||
        deviceData.model_name.toLowerCase().includes('power'));

    const isMainPower =
      deviceData.model_name && deviceData.model_name.toLowerCase().includes('main-power-source');

    const hasPowerInterfaces = deviceInterfaces.some(i => i.interface_type === 'Power');

    if (hasPowerInterfaces) {
      this.inputs = this.inputs.filter(input => input.name !== 'power');
    }

    deviceInterfaces.forEach(interfaceData => {
      const interfaceName = `${interfaceData.label} (${interfaceData.interface_type})`;

      if (isMainPower) {
        this.addOutput(interfaceName, 'interface');
      } else if (isPDU) {
        if (interfaceData.label === 'power-in') {
          this.addInput(interfaceName, 'interface');
        } else {
          this.addOutput(interfaceName, 'interface');
        }
      } else {
        if (interfaceData.interface_type === 'Power') {
          this.addInput(interfaceName, 'interface');
        } else {
          this.addOutput(interfaceName, 'interface');
        }
      }
    });
  }

  clone() {
    const clonedNode = new DeviceNode();
    if (this.deviceData) {
      const clonedDeviceData = JSON.parse(JSON.stringify(this.deviceData));
      clonedDeviceData.serial_number = 'CLONE-' + Date.now();
      clonedDeviceData.model_name = this.deviceData.model_name + ' (Clone)';

      const clonedInterfaces = this.deviceInterfaces
        ? JSON.parse(JSON.stringify(this.deviceInterfaces))
        : [];

      clonedNode.setDeviceData(clonedDeviceData, clonedInterfaces);
      clonedNode.deviceInterfaces = clonedInterfaces;
    }
    return clonedNode;
  }

  static updateDeviceNode(node, newName, newInterfaces) {
    if (node.deviceData) {
      node.deviceData.model_name = newName;
    }
    node.title = newName;
    node.deviceInterfaces = newInterfaces || [];

    // Clear existing outputs and inputs (except power input)
    node.outputs = [];
    node.inputs = node.inputs.filter(input => input.name === 'power');

    // Recalculate size and interfaces
    node.size[0] = node.calculateTitleWidth(200, 40);
    node.size[1] = 60;

    const isPDU =
      newName &&
      (newName.toLowerCase().includes('pdu') ||
        newName.toLowerCase().includes('apc') ||
        newName.toLowerCase().includes('power'));

    const isMainPower = newName && newName.toLowerCase().includes('main-power-source');

    const hasPowerInterfaces = newInterfaces.some(i => i.interface_type === 'Power');

    if (hasPowerInterfaces) {
      node.inputs = node.inputs.filter(input => input.name !== 'power');
    }

    newInterfaces.forEach(interfaceData => {
      const interfaceName = `${interfaceData.label} (${interfaceData.interface_type})`;

      if (isMainPower) {
        node.addOutput(interfaceName, 'interface');
      } else if (isPDU) {
        if (interfaceData.label === 'power-in') {
          node.addInput(interfaceName, 'interface');
        } else {
          node.addOutput(interfaceName, 'interface');
        }
      } else {
        if (interfaceData.interface_type === 'Power') {
          node.addInput(interfaceName, 'interface');
        } else {
          node.addOutput(interfaceName, 'interface');
        }
      }
    });
  }

  static createCustomDeviceNode(deviceName, deviceType, interfaceData, position) {
    const deviceNode = new DeviceNode();
    const mockDeviceData = {
      device_id: 'CUSTOM-' + Date.now(),
      model_name: deviceName,
      device_type: deviceType,
    };
    deviceNode.setDeviceData(mockDeviceData, interfaceData || []);
    deviceNode.pos = [position[0], position[1]];
    if (window.enablePositionSaving) {
      window.enablePositionSaving(deviceNode, 'device', mockDeviceData.device_id);
    }
    window.canvasInstance.graph.add(deviceNode);
    return deviceNode;
  }
}

DeviceNode.title_color = '#e4870eff';
DeviceNode.title_text_color = '#FFFFFF';

if (typeof window !== 'undefined') {
  window.DeviceNode = DeviceNode;
  window.updateDeviceNode = DeviceNode.updateDeviceNode;
  window.createCustomDeviceNode = DeviceNode.createCustomDeviceNode;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceNode;
}
