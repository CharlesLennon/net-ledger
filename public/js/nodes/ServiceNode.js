const SPACING_CONFIG = {
  SERVICE_NODE_MIN_HEIGHT: 35,
  SERVICE_HEIGHT_PER_INPUT: 10,
};

class ServiceNode extends window.BaseNetworkNode {
  constructor() {
    super();
    this.size = [180, 100];
    this.addInput('ip:port', 'interface');
    this.serviceData = null;
    this.ipAddress = null;
    this.portNumber = null;
  }

  setServiceData(serviceData, ipAddress, portNumber) {
    this.serviceData = serviceData;
    this.ipAddress = ipAddress;
    this.portNumber = portNumber;
    this.title = serviceData.name;

    if (this.inputs && this.inputs.length > 0) {
      this.inputs[0].label = `${ipAddress}:${portNumber}`;
      this.inputs[0].name = `${ipAddress}:${portNumber}`;
    }

    const textWidth = this.title.length * 8;
    const inputCount = this.inputs ? this.inputs.length : 1;
    this.size[0] = Math.max(160, textWidth + 30);
    this.size[1] = Math.max(
      SPACING_CONFIG.SERVICE_NODE_MIN_HEIGHT,
      25 + inputCount * SPACING_CONFIG.SERVICE_HEIGHT_PER_INPUT
    );
  }

  clone() {
    const clonedNode = new ServiceNode();
    if (this.serviceData) {
      const clonedServiceData = JSON.parse(JSON.stringify(this.serviceData));
      clonedServiceData.service_id = 'CLONE-' + Date.now();
      clonedServiceData.name = this.serviceData.name + ' (Clone)';

      const ipAddress = this.ipAddress || '192.168.1.100';
      const portNumber = this.portNumber || 80;

      clonedNode.setServiceData(clonedServiceData, ipAddress, portNumber);
    }
    return clonedNode;
  }

  static updateServiceNode(node, newName, newIP, newPort) {
    if (node.serviceData) {
      node.serviceData.name = newName;
    }
    node.ipAddress = newIP;
    node.portNumber = newPort;
    node.title = newName;
    if (node.inputs && node.inputs.length > 0) {
      node.inputs[0].label = `${newIP}:${newPort}`;
      node.inputs[0].name = `${newIP}:${newPort}`;
    }
    const textWidth = node.title.length * 8;
    const inputCount = node.inputs ? node.inputs.length : 1;
    node.size[0] = Math.max(160, textWidth + 30);
    node.size[1] = Math.max(
      SPACING_CONFIG.SERVICE_NODE_MIN_HEIGHT,
      25 + inputCount * SPACING_CONFIG.SERVICE_HEIGHT_PER_INPUT
    );
  }

  static createCustomServiceNode(serviceName, serviceIP, servicePort, position) {
    const serviceNode = new ServiceNode();
    const mockServiceData = {
      service_id: 'CUSTOM-' + Date.now(),
      name: serviceName,
    };
    serviceNode.setServiceData(mockServiceData, serviceIP, servicePort);
    serviceNode.pos = [position[0], position[1]];
    if (window.enablePositionSaving) {
      window.enablePositionSaving(serviceNode, 'service', mockServiceData.service_id);
    }
    window.canvasInstance.graph.add(serviceNode);
    return serviceNode;
  }
}

ServiceNode.title_color = '#e4870eff';
ServiceNode.title_text_color = '#FFFFFF';

if (typeof window !== 'undefined') {
  window.ServiceNode = ServiceNode;
  window.updateServiceNode = ServiceNode.updateServiceNode;
  window.createCustomServiceNode = ServiceNode.createCustomServiceNode;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceNode;
}
