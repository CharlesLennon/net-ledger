const NODE_TEXT_COLOR = '#FFFFFF';
const NODE_BG_COLOR = '#2d3748';
const NODE_TITLE_BG_COLOR = '#e4870eff';
const NODE_TITLE_TEXT_COLOR = '#FFFFFF';

class BaseNetworkNode extends window.LGraphNode {
  constructor() {
    super();
    this.color = NODE_TEXT_COLOR;
    this.bgcolor = NODE_BG_COLOR;
    this.resizable = false;
    this.title_color = NODE_TITLE_BG_COLOR;
    this.title_text_color = NODE_TITLE_TEXT_COLOR;
  }

  calculateTitleWidth(minWidth = 200, padding = 40) {
    const textWidth = this.title.length * 8;
    return Math.max(minWidth, textWidth + padding);
  }

  clone() {
    throw new Error('Clone method must be implemented by subclass');
  }
}

if (typeof window !== 'undefined') {
  window.BaseNetworkNode = BaseNetworkNode;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseNetworkNode;
}
