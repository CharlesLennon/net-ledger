class PciCardNode extends window.BaseNetworkNode {
  constructor() {
    super();
    this.size = [180, 80];
    this.bgcolor = '#1a365d';
    this.title_color = '#2b6cb0';
    this.addInput('PCI Lane', 'pci_lane');
    this.cardData = null;
  }

  setPciCardData(cardData) {
    this.cardData = cardData;
    this.title = cardData.model_name;
    const textWidth = this.title.length * 7;
    this.size[0] = Math.max(180, textWidth + 40);
    this.size[1] = 60;

    if (cardData.type === 'Network') {
      this.addOutput('RJ45-1', 'interface');
      this.addOutput('RJ45-2', 'interface');
      this.addOutput('RJ45-3', 'interface');
      this.addOutput('RJ45-4', 'interface');
      this.size[1] = 100;
    } else if (cardData.type === 'GPU') {
      this.addOutput('Display', 'display');
    } else if (cardData.type === 'Storage') {
      this.addOutput('SATA-1', 'interface');
      this.addOutput('SATA-2', 'interface');
      this.addOutput('SATA-3', 'interface');
      this.addOutput('SATA-4', 'interface');
      this.size[1] = 100;
    } else if (cardData.type === 'USB') {
      this.addOutput('USB-1', 'interface');
      this.addOutput('USB-2', 'interface');
      this.addOutput('USB-3', 'interface');
      this.addOutput('USB-4', 'interface');
      this.size[1] = 100;
    }
  }

  clone() {
    const clonedNode = new PciCardNode();
    if (this.cardData) {
      const clonedCardData = JSON.parse(JSON.stringify(this.cardData));
      clonedCardData.card_serial_number = 'CLONE-' + Date.now();
      clonedCardData.model_name = this.cardData.model_name + ' (Clone)';
      clonedNode.setPciCardData(clonedCardData);
    }
    return clonedNode;
  }
}

PciCardNode.title_color = '#2b6cb0';
PciCardNode.title_text_color = '#FFFFFF';

if (typeof window !== 'undefined') {
  window.PciCardNode = PciCardNode;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PciCardNode;
}
