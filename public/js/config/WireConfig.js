class WireConfig {
  constructor() {
    this.config = {
      HORIZONTAL_OFFSET_RIGHT: 1020,
      HORIZONTAL_OFFSET_LEFT: 200,
      NON_POWER_OFFSET_LEFT: 600,
      NON_POWER_OFFSET_RIGHT: 600,
      POWER_CHANNEL_OFFSET: 20,
      POWER_OFFSET_LEFT: 200,
      POWER_OFFSET_RIGHT: 400,
      NETWORK_CHANNEL_OFFSET: 20,
      ENABLE_CHANNEL_ROUTING: true,
      LEFT_CHANNEL_X: -300,
      RIGHT_CHANNEL_X: 1250,
      CHANNEL_SPACING: 30,
      CHANNEL_WIDTH: 60,
      VERTICAL_OFFSET: 5,
      MIN_DISTRIBUTED_DISTANCE: 100,
      MIN_VERTICAL_DISTANCE: 50,
      WIRE_SPACING: 30,
      LEFT_WIRE_SPACING: 25,
      POWER_WIRE_SPACING: 60,
      CORNER_RADIUS: 15,
      MAX_WIRES_PER_CHANNEL: 1,
      WIRE_OFFSET_INCREMENT: 500,
      ENABLE_GROUP_AWARE_ROUTING: true,
      GROUP_EXIT_MARGIN: 10,
      GROUP_ROUTING_HEIGHT_OFFSET: 50,
      GROUP_WIRE_SPACING: 15,
      GROUP_POWER_WIRE_SPACING: 20,
      GROUP_HORIZONTAL_GAP: 150,
      GROUP_WIRE_OFFSET: 20,
    };

    this.defaultConfig = { ...this.config };
    this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem('wireRoutingConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      } catch (e) {
        console.warn('Failed to load wire config from localStorage:', e);
      }
    }
  }

  saveConfig() {
    try {
      localStorage.setItem('wireRoutingConfig', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save wire config to localStorage:', e);
    }
  }

  applyConfig() {
    this.config.GROUP_HORIZONTAL_GAP =
      parseInt(document.getElementById('group-horizontal-gap')?.value) || 300;
    this.config.GROUP_WIRE_OFFSET =
      parseInt(document.getElementById('group-wire-offset')?.value) || 20;
    this.config.NON_POWER_OFFSET_RIGHT =
      parseInt(document.getElementById('non-power-offset-right')?.value) || 600;
    this.config.HORIZONTAL_OFFSET_LEFT =
      parseInt(document.getElementById('horizontal-offset-left')?.value) || 200;
    this.config.HORIZONTAL_OFFSET_RIGHT =
      parseInt(document.getElementById('horizontal-offset-right')?.value) || 1020;
    this.config.ENABLE_CHANNEL_ROUTING =
      document.getElementById('enable-channel-routing')?.checked ?? true;
    this.config.LEFT_CHANNEL_X = parseInt(document.getElementById('left-channel-x')?.value) || -300;
    this.config.RIGHT_CHANNEL_X =
      parseInt(document.getElementById('right-channel-x')?.value) || 1250;
    this.config.CHANNEL_SPACING = parseInt(document.getElementById('channel-spacing')?.value) || 30;
    this.config.CHANNEL_WIDTH = parseInt(document.getElementById('channel-width')?.value) || 60;
    this.config.POWER_CHANNEL_OFFSET =
      parseInt(document.getElementById('power-channel-offset')?.value) || 20;
    this.config.NETWORK_CHANNEL_OFFSET =
      parseInt(document.getElementById('network-channel-offset')?.value) || 20;
    this.config.WIRE_SPACING = parseInt(document.getElementById('wire-spacing')?.value) || 30;
    this.config.LEFT_WIRE_SPACING =
      parseInt(document.getElementById('left-wire-spacing')?.value) || 25;
    this.config.POWER_WIRE_SPACING =
      parseInt(document.getElementById('power-wire-spacing')?.value) || 60;
    this.config.CORNER_RADIUS = parseInt(document.getElementById('corner-radius')?.value) || 15;
    this.config.WIRE_OFFSET_INCREMENT =
      parseInt(document.getElementById('wire-offset-increment')?.value) || 30;

    this.saveConfig();

    if (window.canvasInstance) {
      window.canvasInstance.setDirty(true, true);
    }

    alert('Wire configuration applied successfully!');
  }

  resetConfig() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();

    this.updateFormElements();

    if (window.canvasInstance) {
      window.canvasInstance.setDirty(true, true);
    }
  }

  updateFormElements() {
    const elements = [
      { id: 'power-channel-offset', value: this.config.POWER_CHANNEL_OFFSET },
      { id: 'non-power-offset-left', value: this.config.NON_POWER_OFFSET_LEFT },
      { id: 'non-power-offset-right', value: this.config.NON_POWER_OFFSET_RIGHT },
      { id: 'power-offset-left', value: this.config.POWER_OFFSET_LEFT },
      { id: 'power-offset-right', value: this.config.POWER_OFFSET_RIGHT },
      { id: 'network-channel-offset', value: this.config.NETWORK_CHANNEL_OFFSET },
      { id: 'horizontal-offset-left', value: this.config.HORIZONTAL_OFFSET_LEFT },
      { id: 'horizontal-offset-right', value: this.config.HORIZONTAL_OFFSET_RIGHT },
      { id: 'wire-spacing', value: this.config.WIRE_SPACING },
      { id: 'left-wire-spacing', value: this.config.LEFT_WIRE_SPACING },
      { id: 'power-wire-spacing', value: this.config.POWER_WIRE_SPACING },
      { id: 'corner-radius', value: this.config.CORNER_RADIUS },
      { id: 'wire-offset-increment', value: this.config.WIRE_OFFSET_INCREMENT },
      { id: 'left-channel-x', value: this.config.LEFT_CHANNEL_X },
      { id: 'right-channel-x', value: this.config.RIGHT_CHANNEL_X },
      { id: 'channel-spacing', value: this.config.CHANNEL_SPACING },
      { id: 'channel-width', value: this.config.CHANNEL_WIDTH },
      { id: 'group-horizontal-gap', value: this.config.GROUP_HORIZONTAL_GAP },
      { id: 'group-wire-offset', value: this.config.GROUP_WIRE_OFFSET },
    ];

    elements.forEach(({ id, value }) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
      }
    });

    const enableChannelRouting = document.getElementById('enable-channel-routing');
    if (enableChannelRouting) {
      enableChannelRouting.checked = this.config.ENABLE_CHANNEL_ROUTING;
    }
  }

  copySettingsToClipboard() {
    try {
      const configData = {
        POWER_CHANNEL_OFFSET:
          parseInt(document.getElementById('power-channel-offset')?.value) ||
          this.config.POWER_CHANNEL_OFFSET,
        NON_POWER_OFFSET_LEFT:
          parseInt(document.getElementById('non-power-offset-left')?.value) ||
          this.config.NON_POWER_OFFSET_LEFT,
        NON_POWER_OFFSET_RIGHT:
          parseInt(document.getElementById('non-power-offset-right')?.value) ||
          this.config.NON_POWER_OFFSET_RIGHT,
        POWER_OFFSET_LEFT:
          parseInt(document.getElementById('power-offset-left')?.value) ||
          this.config.POWER_OFFSET_LEFT,
        POWER_OFFSET_RIGHT:
          parseInt(document.getElementById('power-offset-right')?.value) ||
          this.config.POWER_OFFSET_RIGHT,
        NETWORK_CHANNEL_OFFSET:
          parseInt(document.getElementById('network-channel-offset')?.value) ||
          this.config.NETWORK_CHANNEL_OFFSET,
        HORIZONTAL_OFFSET_LEFT:
          parseInt(document.getElementById('horizontal-offset-left')?.value) ||
          this.config.HORIZONTAL_OFFSET_LEFT,
        HORIZONTAL_OFFSET_RIGHT:
          parseInt(document.getElementById('horizontal-offset-right')?.value) ||
          this.config.HORIZONTAL_OFFSET_RIGHT,
        WIRE_SPACING:
          parseInt(document.getElementById('wire-spacing')?.value) || this.config.WIRE_SPACING,
        LEFT_WIRE_SPACING:
          parseInt(document.getElementById('left-wire-spacing')?.value) ||
          this.config.LEFT_WIRE_SPACING,
        POWER_WIRE_SPACING:
          parseInt(document.getElementById('power-wire-spacing')?.value) ||
          this.config.POWER_WIRE_SPACING,
        CORNER_RADIUS:
          parseInt(document.getElementById('corner-radius')?.value) || this.config.CORNER_RADIUS,
        WIRE_OFFSET_INCREMENT:
          parseInt(document.getElementById('wire-offset-increment')?.value) ||
          this.config.WIRE_OFFSET_INCREMENT,
        ENABLE_CHANNEL_ROUTING:
          document.getElementById('enable-channel-routing')?.checked ??
          this.config.ENABLE_CHANNEL_ROUTING,
        LEFT_CHANNEL_X:
          parseInt(document.getElementById('left-channel-x')?.value) || this.config.LEFT_CHANNEL_X,
        RIGHT_CHANNEL_X:
          parseInt(document.getElementById('right-channel-x')?.value) ||
          this.config.RIGHT_CHANNEL_X,
        CHANNEL_SPACING:
          parseInt(document.getElementById('channel-spacing')?.value) ||
          this.config.CHANNEL_SPACING,
        CHANNEL_WIDTH:
          parseInt(document.getElementById('channel-width')?.value) || this.config.CHANNEL_WIDTH,
        GROUP_HORIZONTAL_GAP:
          parseInt(document.getElementById('group-horizontal-gap')?.value) ||
          this.config.GROUP_HORIZONTAL_GAP,
        GROUP_WIRE_OFFSET:
          parseInt(document.getElementById('group-wire-offset')?.value) ||
          this.config.GROUP_WIRE_OFFSET,
      };

      const jsonString = JSON.stringify(configData, null, 2);

      navigator.clipboard
        .writeText(jsonString)
        .then(() => {
          this.showCopySuccess();
        })
        .catch(err => {
          this.fallbackCopy(jsonString);
        });
    } catch (error) {
      console.error('Error copying settings to clipboard:', error);
      alert('An error occurred while copying settings. Please try again.');
    }
  }

  showCopySuccess() {
    const copyBtn = document.getElementById('copy-config-btn');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = '#10b981';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#22c55e';
      }, 1000);
    }
  }

  fallbackCopy(jsonString) {
    const textArea = document.createElement('textarea');
    textArea.value = jsonString;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showCopySuccess();
    } catch (fallbackErr) {
      console.error('Fallback copy method also failed:', fallbackErr);
      alert('Failed to copy settings to clipboard. Please try again.');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  getConfig() {
    return { ...this.config };
  }

  setConfigValue(key, value) {
    if (this.config.hasOwnProperty(key)) {
      this.config[key] = value;
      this.saveConfig();
    }
  }

  getConfigValue(key) {
    return this.config[key];
  }
}

window.wireConfig = new WireConfig();
