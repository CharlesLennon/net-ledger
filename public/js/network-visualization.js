(function () {
  const NODE_TEXT_COLOR = '#FFFFFF';
  const NODE_BG_COLOR = '#2d3748';
  const NODE_TITLE_BG_COLOR = '#e4870eff';
  const NODE_TITLE_TEXT_COLOR = '#FFFFFF';
  const GROUP_CHILD_COLOR = '#4a5568';
  const GROUP_ROOT_COLOR = '#2b6cb0';
  const CONNECTION_COLORS = {
    INTERFACE_PHYSICAL: '#10b981',
    INTERFACE_LOGICAL: '#3b82f6',
    POWER: '#ef4444',
    MANAGEMENT: '#f59e0b',
    DEFAULT: '#9ca3af',
    PCI_LANE: '#8b5cf6',
    CABLE_CAT6: '#8b5cf6',
    CABLE_CAT5E: '#06b6d4',
    CABLE_FIBER: '#f59e0b',
    CABLE_COPPER: '#10b981',
    CABLE_COAXIAL: '#ef4444',
  };
  const SPACING_CONFIG = {
    DEVICE_TO_SERVICE_HORIZONTAL: 120,
    SERVICE_VERTICAL_SPACING: 80,
    DEVICE_ROW_SPACING: 40,
    GROUP_VERTICAL_SPACING: 50,
    GROUP_PADDING: 10,
    GROUP_TITLE_HEIGHT: 80,
    SERVICE_NODE_MIN_HEIGHT: 35,
    SERVICE_HEIGHT_PER_INPUT: 10,
  };
  const KEYBOARD_CONFIG = {
    PAN_SPEED: 20,
    SMOOTH_PANNING: true,
    PAN_ACCELERATION: 1.5,
    ZOOM_SPEED: 0.1,
  };
  let WIRE_ROUTING_CONFIG = {
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
    WIRE_OFFSET_INCREMENT: 30,
    ENABLE_GROUP_AWARE_ROUTING: true,
    GROUP_EXIT_MARGIN: 10,
    GROUP_ROUTING_HEIGHT_OFFSET: 50,
    GROUP_WIRE_SPACING: 15,
    GROUP_POWER_WIRE_SPACING: 20,
    GROUP_HORIZONTAL_GAP: 150,
    GROUP_WIRE_OFFSET: 20,
  };
  function loadWireConfig() {
    const saved = localStorage.getItem('wireRoutingConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        WIRE_ROUTING_CONFIG = { ...WIRE_ROUTING_CONFIG, ...parsed };
      } catch (e) {
        console.warn('Failed to load wire config from localStorage:', e);
      }
    }
  }
  function saveWireConfig() {
    try {
      localStorage.setItem('wireRoutingConfig', JSON.stringify(WIRE_ROUTING_CONFIG));
    } catch (e) {
      console.warn('Failed to save wire config to localStorage:', e);
    }
  }
  
  function applyWireConfig() {
    // Update the global config from UI inputs
    WIRE_ROUTING_CONFIG.GROUP_HORIZONTAL_GAP = parseInt(document.getElementById('group-horizontal-gap').value) || 50;
    WIRE_ROUTING_CONFIG.GROUP_WIRE_OFFSET = parseInt(document.getElementById('group-wire-offset').value) || 20;
    WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_RIGHT = parseInt(document.getElementById('non-power-offset-right').value) || 600;
    WIRE_ROUTING_CONFIG.HORIZONTAL_OFFSET_LEFT = parseInt(document.getElementById('horizontal-offset-left').value) || 200;
    WIRE_ROUTING_CONFIG.HORIZONTAL_OFFSET_RIGHT = parseInt(document.getElementById('horizontal-offset-right').value) || 1020;
    WIRE_ROUTING_CONFIG.ENABLE_CHANNEL_ROUTING = document.getElementById('enable-channel-routing').checked;
    WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X = parseInt(document.getElementById('left-channel-x').value) || -300;
    WIRE_ROUTING_CONFIG.RIGHT_CHANNEL_X = parseInt(document.getElementById('right-channel-x').value) || 1250;
    WIRE_ROUTING_CONFIG.CHANNEL_SPACING = parseInt(document.getElementById('channel-spacing').value) || 30;
    WIRE_ROUTING_CONFIG.CHANNEL_WIDTH = parseInt(document.getElementById('channel-width').value) || 60;
    WIRE_ROUTING_CONFIG.POWER_CHANNEL_OFFSET = parseInt(document.getElementById('power-channel-offset').value) || 20;
    WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET = parseInt(document.getElementById('network-channel-offset').value) || 20;
    WIRE_ROUTING_CONFIG.WIRE_SPACING = parseInt(document.getElementById('wire-spacing').value) || 30;
    WIRE_ROUTING_CONFIG.LEFT_WIRE_SPACING = parseInt(document.getElementById('left-wire-spacing').value) || 25;
    WIRE_ROUTING_CONFIG.POWER_WIRE_SPACING = parseInt(document.getElementById('power-wire-spacing').value) || 60;
    WIRE_ROUTING_CONFIG.CORNER_RADIUS = parseInt(document.getElementById('corner-radius').value) || 15;
    WIRE_ROUTING_CONFIG.WIRE_OFFSET_INCREMENT = parseInt(document.getElementById('wire-offset-increment').value) || 30;
    
    // Save to localStorage
    saveWireConfig();
    
    // Force canvas redraw
    if (window.canvasInstance) {
      window.canvasInstance.setDirty(true, true);
    }
    
    alert('Wire configuration applied successfully!');
  }
  
  // Make it globally available
  window.applyWireConfig = applyWireConfig;
  loadWireConfig();
  function makeDraggable(element) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;
    const handleMouseDown = function (e) {
      if (
        e.target.tagName === 'H3' ||
        e.target.closest('h3') ||
        e.target.id === 'close-edit-panel-btn' ||
        e.target.closest('#close-edit-panel-btn')
      ) {
        return;
      }
      if (isDragging) {
        handleMouseUp();
        return;
      }
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = element.getBoundingClientRect();
      elementStartX = rect.left;
      elementStartY = rect.top;
      element.style.cursor = 'grabbing';
      e.preventDefault();
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
      document.addEventListener('mousedown', handleMouseDownDuringDrag, { passive: false });
      document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    };
    const handleMouseDownDuringDrag = function (e) {
      if (isDragging) {
        handleMouseUp();
      }
    };
    const handleMouseMove = function (e) {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      const newLeft = elementStartX + deltaX;
      const newTop = elementStartY + deltaY;
      const maxLeft = window.innerWidth - element.offsetWidth;
      const maxTop = window.innerHeight - element.offsetHeight;
      element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
      element.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
      element.style.right = 'auto';
      element.style.transform = 'none';
    };
    const handleMouseUp = function () {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleMouseDownDuringDrag);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
    const handleMouseLeave = function () {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleMouseDownDuringDrag);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
    element.addEventListener('mousedown', handleMouseDown, { passive: false });
    element._cleanupDrag = function () {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDownDuringDrag);
      document.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }
  function resetWireConfig() {
    const defaultConfig = {
      POWER_CHANNEL_OFFSET: 20,
      NON_POWER_OFFSET_LEFT: 600,
      NON_POWER_OFFSET_RIGHT: 600,
      POWER_OFFSET_LEFT: 200,
      POWER_OFFSET_RIGHT: 400,
      NETWORK_CHANNEL_OFFSET: 20,
      HORIZONTAL_OFFSET_LEFT: 200,
      HORIZONTAL_OFFSET_RIGHT: 1020,
      WIRE_SPACING: 30,
      LEFT_WIRE_SPACING: 25,
      POWER_WIRE_SPACING: 60,
      CORNER_RADIUS: 15,
      WIRE_OFFSET_INCREMENT: 30,
      ENABLE_CHANNEL_ROUTING: true,
      LEFT_CHANNEL_X: -300,
      RIGHT_CHANNEL_X: 1250,
      CHANNEL_SPACING: 30,
      CHANNEL_WIDTH: 60,
      GROUP_HORIZONTAL_GAP: 50,
      GROUP_WIRE_OFFSET: 20,
    };
    WIRE_ROUTING_CONFIG = { ...WIRE_ROUTING_CONFIG, ...defaultConfig };
    saveWireConfig();
    document.getElementById('power-channel-offset').value = defaultConfig.POWER_CHANNEL_OFFSET;
    document.getElementById('non-power-offset-left').value = defaultConfig.NON_POWER_OFFSET_LEFT;
    document.getElementById('non-power-offset-right').value = defaultConfig.NON_POWER_OFFSET_RIGHT;
    document.getElementById('power-offset-left').value = defaultConfig.POWER_OFFSET_LEFT;
    document.getElementById('power-offset-right').value = defaultConfig.POWER_OFFSET_RIGHT;
    document.getElementById('network-channel-offset').value = defaultConfig.NETWORK_CHANNEL_OFFSET;
    document.getElementById('horizontal-offset-left').value = defaultConfig.HORIZONTAL_OFFSET_LEFT;
    document.getElementById('horizontal-offset-right').value =
      defaultConfig.HORIZONTAL_OFFSET_RIGHT;
    document.getElementById('wire-spacing').value = defaultConfig.WIRE_SPACING;
    document.getElementById('left-wire-spacing').value = defaultConfig.LEFT_WIRE_SPACING;
    document.getElementById('power-wire-spacing').value = defaultConfig.POWER_WIRE_SPACING;
    document.getElementById('network-channel-offset').value = defaultConfig.NETWORK_CHANNEL_OFFSET;
    document.getElementById('corner-radius').value = defaultConfig.CORNER_RADIUS;
    document.getElementById('wire-offset-increment').value = defaultConfig.WIRE_OFFSET_INCREMENT;
    document.getElementById('enable-channel-routing').checked =
      defaultConfig.ENABLE_CHANNEL_ROUTING;
    document.getElementById('left-channel-x').value = defaultConfig.LEFT_CHANNEL_X;
    document.getElementById('right-channel-x').value = defaultConfig.RIGHT_CHANNEL_X;
    document.getElementById('channel-spacing').value = defaultConfig.CHANNEL_SPACING;
    document.getElementById('channel-width').value = defaultConfig.CHANNEL_WIDTH;
    document.getElementById('group-horizontal-gap').value = defaultConfig.GROUP_HORIZONTAL_GAP;
    document.getElementById('group-wire-offset').value = defaultConfig.GROUP_WIRE_OFFSET;
    if (window.canvasInstance) {
      window.canvasInstance.setDirty(true, true);
    }
  }

  function preserveCanvasViewport(callback) {
    if (!window.canvasInstance) {
      if (callback) callback();
      return;
    }
    const viewportState = {
      scale: window.canvasInstance.ds
        ? window.canvasInstance.ds.scale
        : window.canvasInstance.scale,
      offset: window.canvasInstance.ds ? [...window.canvasInstance.ds.offset] : [0, 0],
    };
    if (callback) callback();
    setTimeout(() => {
      if (window.canvasInstance) {
        if (window.canvasInstance.ds) {
          if (viewportState.scale !== undefined)
            window.canvasInstance.ds.scale = viewportState.scale;
          if (viewportState.offset) window.canvasInstance.ds.offset = viewportState.offset;
        } else if (viewportState.scale !== undefined) {
          window.canvasInstance.scale = viewportState.scale;
        }
        window.canvasInstance.setDirty(true, false);
      }
    }, 10);
  }
  function updateWireProperties(link, newCableType) {
    link.cable_type = newCableType;
    link.color = getCableColor(newCableType);
    if (link.id) {
      Livewire.dispatchTo('network-view', 'connection-updated', {
        connectionId: link.id,
        cableType: newCableType,
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      console.warn('Connection ID missing from link, changes not saved to database');
      alert('Connection ID missing. This wire may not be properly linked to the database.');
    }
  }
  function addInterfaceToList(label, type, index) {
    const interfacesList = document.getElementById('interfaces-list');
    if (!interfacesList) return;
    const interfaceItem = document.createElement('div');
    interfaceItem.className = 'interface-item';
    interfaceItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            padding: 6px;
            background: #1a202c;
            border-radius: 4px;
            border: 1px solid #2d3748;
        `;
    interfaceItem.innerHTML = `
            <input type="text" class="interface-label" value="${label}" placeholder="Interface label" style="
                flex: 1;
                padding: 4px;
                border-radius: 3px;
                border: 1px solid #4a5568;
                background: #2d3748;
                color: #fff;
                font-size: 11px;
            ">
            <select class="interface-type" style="
                padding: 4px;
                border-radius: 3px;
                border: 1px solid #4a5568;
                background: #2d3748;
                color: #fff;
                font-size: 11px;
            ">
                <option value="RJ45" ${type === 'RJ45' ? 'selected' : ''}>RJ45</option>
                <option value="SFP" ${type === 'SFP' ? 'selected' : ''}>SFP</option>
                <option value="SFP+" ${type === 'SFP+' ? 'selected' : ''}>SFP+</option>
                <option value="Power" ${type === 'Power' ? 'selected' : ''}>Power</option>
                <option value="USB" ${type === 'USB' ? 'selected' : ''}>USB</option>
                <option value="Serial" ${type === 'Serial' ? 'selected' : ''}>Serial</option>
                <option value="PCI" ${type === 'PCI' ? 'selected' : ''}>PCI</option>
            </select>
            <button class="remove-interface-btn" style="
                background: #e53e3e;
                color: #fff;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            ">Remove</button>
        `;
    const removeBtn = interfaceItem.querySelector('.remove-interface-btn');
    if (removeBtn) {
      removeBtn.onclick = () => {
        interfaceItem.remove();
      };
    }
    const inputs = interfaceItem.querySelectorAll('input, select');
    inputs.forEach(input => {
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
    });
    interfacesList.appendChild(interfaceItem);
  }

  function copySettingsToClipboard() {
    try {
      const configData = {
        POWER_CHANNEL_OFFSET: parseInt(document.getElementById('power-channel-offset').value),
        NON_POWER_OFFSET_LEFT: parseInt(document.getElementById('non-power-offset-left').value),
        NON_POWER_OFFSET_RIGHT: parseInt(document.getElementById('non-power-offset-right').value),
        POWER_OFFSET_LEFT: parseInt(document.getElementById('power-offset-left').value),
        POWER_OFFSET_RIGHT: parseInt(document.getElementById('power-offset-right').value),
        NETWORK_CHANNEL_OFFSET: parseInt(document.getElementById('network-channel-offset').value),
        HORIZONTAL_OFFSET_LEFT: parseInt(document.getElementById('horizontal-offset-left').value),
        HORIZONTAL_OFFSET_RIGHT: parseInt(document.getElementById('horizontal-offset-right').value),
        WIRE_SPACING: parseInt(document.getElementById('wire-spacing').value),
        LEFT_WIRE_SPACING: parseInt(document.getElementById('left-wire-spacing').value),
        POWER_WIRE_SPACING: parseInt(document.getElementById('power-wire-spacing').value),
        CORNER_RADIUS: parseInt(document.getElementById('corner-radius').value),
        WIRE_OFFSET_INCREMENT: parseInt(document.getElementById('wire-offset-increment').value),
        ENABLE_CHANNEL_ROUTING: document.getElementById('enable-channel-routing').checked,
        LEFT_CHANNEL_X: parseInt(document.getElementById('left-channel-x').value),
        RIGHT_CHANNEL_X: parseInt(document.getElementById('right-channel-x').value),
        CHANNEL_SPACING: parseInt(document.getElementById('channel-spacing').value),
        CHANNEL_WIDTH: parseInt(document.getElementById('channel-width').value),
        GROUP_HORIZONTAL_GAP: parseInt(document.getElementById('group-horizontal-gap').value),
        GROUP_WIRE_OFFSET: parseInt(document.getElementById('group-wire-offset').value),
      };
      const jsonString = JSON.stringify(configData, null, 2);
      navigator.clipboard
        .writeText(jsonString)
        .then(() => {
          const copyBtn = document.getElementById('copy-config-btn');
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          copyBtn.style.background = '#10b981';
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#22c55e';
          }, 1000);
        })
        .catch(err => {
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
            const copyBtn = document.getElementById('copy-config-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = '#10b981';
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = '#22c55e';
            }, 1000);
          } catch (fallbackErr) {
            console.error('Fallback copy method also failed:', fallbackErr);
            alert('Failed to copy settings to clipboard. Please try again.');
          } finally {
            document.body.removeChild(textArea);
          }
        });
    } catch (error) {
      console.error('Error copying settings to clipboard:', error);
      alert('An error occurred while copying settings. Please try again.');
    }
  }
  const PARTICLE_CONFIG = {
    SPEED: 1.5,
    SIZE: 4,
    SPACING: 80,
    COLOR: '#ffffff',
    TRAIL_LENGTH: 8,
    SHOW_ONLY_ON_SELECTED: true,
  };
  window.networkVisualization = {
    createNetworkVisualization: createNetworkVisualization,
  };
  let activeParticles = new Map();
  function customizeMouseEvents(canvas) {
    const canvasElement = document.getElementById('mycanvas');
    if (!canvasElement) {
      console.error(
        'Canvas element not found. Make sure the HTML contains a canvas with id="mycanvas"'
      );
      return;
    }
    canvasElement.addEventListener(
      'dblclick',
      function (e) {
        e.preventDefault();
        e.stopPropagation();
      },
      { passive: false }
    );
    canvas.processNodeDblClicked = function (node) {};
    canvas.processContextMenu = function (node, event) {
      var that = this;
      var canvas = window.canvasInstance;
      var ref_window = canvas.getCanvasWindow();
      var menu_info = null;
      var options = { event: event, callback: inner_option_clicked, extra: node };
      var slot = null;
      if (node) {
        slot = node.getSlotInPosition(event.canvasX, event.canvasY);
        window.LGraphCanvas.active_node = node;
      }
      var link = null;
      if (!node && !slot) {
        link = getLinkAtPosition(canvas, event.canvasX, event.canvasY);
      }
      if (link) {
        menu_info = [
          { content: 'Edit Wire', hasCallback: true },
          null,
          { content: 'Delete Wire', hasCallback: true },
        ];
      } else if (slot) {
        menu_info = [
          { content: 'Disconnect', hasCallback: true },
          null,
          { content: 'Properties', hasCallback: true },
        ];
      } else if (node) {
        menu_info = [
          { content: 'Node Info', hasCallback: true },
          null,
          { content: 'Edit Node', hasCallback: true },
          { content: 'Clone Node', hasCallback: true },
          null,
          { content: 'Delete Node', hasCallback: true },
        ];
      } else {
        menu_info = [
          { content: 'Add Device Node', hasCallback: true },
          { content: 'Add Service Node', hasCallback: true },
          null,
          { content: 'Clear Canvas', hasCallback: true },
          null,
          { content: 'Wire Configuration', hasCallback: true },
        ];
      }
      if (menu_info) {
        var menu = new window.LiteGraph.ContextMenu(menu_info, options, ref_window);
      }
      function inner_option_clicked(v, options, e) {
        if (!v || !v.hasCallback) return;
        const content = v.content;
        const node = options.extra;
        const link = getLinkAtPosition(canvas, options.event.canvasX, options.event.canvasY);
        switch (content) {
          case 'Edit Wire':
            if (link) {
              editWire(link);
            }
            break;
          case 'Delete Wire':
            if (link) {
              if (link.connection_id) {
                Livewire.dispatchTo('network-view', 'connection-deleted', {
                  connectionId: link.connection_id,
                });
              } else {
                console.warn('Connection ID missing from link, removing from canvas only');
                console.warn(
                  'Connection ID missing. Wire removed from canvas only. This wire may not be properly linked to the database.'
                );
                canvas.graph.removeLink(link.id);
                setTimeout(() => {
                  canvas.setDirty(true, false);
                }, 10);
              }
            }
            break;
          case 'Disconnect':
            if (slot.input) {
              node.disconnectInput(slot.slot);
            } else if (slot.output) {
              node.disconnectOutput(slot.slot);
            }
            break;
          case 'Properties':
            break;
          case 'Node Info':
            alert(
              `Node: ${node.title}\nType: ${node.constructor.name}\nPosition: (${node.pos[0].toFixed(0)}, ${node.pos[1].toFixed(0)})`
            );
            break;
          case 'Edit Node':
            editNode(node);
            break;
          case 'Clone Node':
            var new_node = node.clone();
            if (new_node) {
              new_node.pos = [node.pos[0] + 20, node.pos[1] + 20];
              if (node.nodeType && node.nodeId) {
                enablePositionSaving(new_node, node.nodeType, node.nodeId + '_clone_' + Date.now());
              }
              canvas.graph.add(new_node);
            } else {
              console.error('Failed to clone node');
              alert('Unable to clone this node type');
            }
            break;
          case 'Delete Node':
            canvas.graph.remove(node);
            break;
          case 'Add Device Node':
            const devicePos = canvas.convertEventToCanvasOffset(options.event);
            createNodeEditPanel('device', devicePos);
            break;
          case 'Add Service Node':
            const servicePos = canvas.convertEventToCanvasOffset(options.event);
            createNodeEditPanel('service', servicePos);
            break;
          case 'Clear Canvas':
            if (confirm('Are you sure you want to clear all nodes?')) {
              canvas.graph.clear();
            }
            break;
          case 'Wire Configuration':
            createWireConfigPanel();
            break;
        }
      }
      return false;
    };
  }
  function initialize() {
    if (typeof window.LiteGraph === 'undefined') {
      console.error('LiteGraph library not loaded. Please check your setup.');
      setTimeout(initialize, 100);
      return;
    }
    if (
      typeof window.LGraphNode === 'undefined' ||
      typeof window.LGraphCanvas === 'undefined' ||
      typeof window.LGraphGroup === 'undefined'
    ) {
      console.error('LiteGraph components not available. Please check your setup.');
      setTimeout(initialize, 100);
      return;
    }
    if (
      typeof window.BaseNetworkNode === 'undefined' ||
      typeof window.DeviceNode === 'undefined' ||
      typeof window.ServiceNode === 'undefined' ||
      typeof window.PciCardNode === 'undefined'
    ) {
      if (
        typeof window.NodeClassInfo !== 'undefined' &&
        window.NodeClassInfo.status === 'loading'
      ) {
        setTimeout(initialize, 200);
        return;
      } else {
        console.error(
          'Network node classes not loaded. Please check that nodes/index.js is included and working properly.'
        );
        setTimeout(initialize, 100);
        return;
      }
    }
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (type === 'wheel' || type === 'mousewheel') {
        if (this.id === 'mycanvas' || this.tagName === 'CANVAS') {
          if (!options) {
            options = { passive: false };
          } else if (typeof options === 'boolean') {
            options = { capture: options, passive: false };
          } else if (typeof options === 'object') {
            options.passive = false;
          }
        } else {
          if (!options) {
            options = { passive: true };
          } else if (typeof options === 'boolean') {
            options = { capture: options, passive: true };
          } else if (typeof options === 'object' && options.passive === undefined) {
            options.passive = true;
          }
        }
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    window.LiteGraph.registerNodeType('network/device', DeviceNode);
    window.LiteGraph.registerNodeType('network/service', ServiceNode);
    window.LiteGraph.registerNodeType('network/pci-card', PciCardNode);
    const graph = new window.LiteGraph.LGraph();
    const canvas = new window.LGraphCanvas('#mycanvas', graph);
    window.canvasInstance = canvas;
    window.graphInstance = graph;
    window.createNetworkVisualization = createNetworkVisualization;
    window.CONNECTION_COLORS = CONNECTION_COLORS;
    window.getJsonData = getJsonData;
    if (!graph._groups) graph._groups = [];
    if (!graph._nodes) graph._nodes = [];
    if (!graph.links) graph.links = {};
    setupCanvas(canvas);
    setupGlobalEventListeners();
    customizeMouseEvents(canvas);
    graph.start();
    createNetworkVisualization(graph);
    initializeCustomRendering(canvas);
    startParticleAnimation();
    setTimeout(() => {
      canvas.setDirty(true, true);
      showKeyboardControls();
    }, 500);
  }
  function setupCanvas(canvas) {
    canvas.background_image = null;
    canvas.render_connections_shadows = false;
    canvas.render_connection_arrows = true;
    canvas.highquality_render = true;
    canvas.use_gradients = true;
    resizeCanvas(canvas);
  }
  function setupGlobalEventListeners() {
    window.addEventListener('resize', () => resizeCanvas(window.canvasInstance));
    const canvasElement = document.getElementById('mycanvas');
    if (!canvasElement) {
      return;
    }
    canvasElement.tabIndex = 0;
    canvasElement.style.outline = 'none';
    const keysPressed = new Set();
    let animationFrameId = null;
    const handleKeyDown = event => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true')
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      keysPressed.add(key);
      if (key === '+' || key === '=') {
        event.preventDefault();
        zoomCanvas(1);
        return;
      }
      if (key === '-' || key === '_') {
        event.preventDefault();
        zoomCanvas(-1);
        return;
      }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
      }
      if (!animationFrameId) {
        startSmoothPanning();
      }
    };
    const handleKeyUp = event => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true')
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      keysPressed.delete(key);
      if (keysPressed.size === 0 && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    const zoomCanvas = direction => {
      const canvas = window.canvasInstance;
      if (!canvas) return;
      if (canvas.ds && canvas.ds.scale !== undefined) {
        const currentScale = canvas.ds.scale;
        const newScale = Math.max(
          0.1,
          Math.min(2.0, currentScale + direction * KEYBOARD_CONFIG.ZOOM_SPEED)
        );
        if (newScale !== currentScale) {
          canvas.ds.scale = newScale;
          setTimeout(() => canvas.setDirty(true, true), 0);
        }
      } else if (canvas.scale !== undefined) {
        const currentScale = canvas.scale;
        const newScale = Math.max(
          0.1,
          Math.min(2.0, currentScale + direction * KEYBOARD_CONFIG.ZOOM_SPEED)
        );
        if (newScale !== currentScale) {
          canvas.scale = newScale;
          setTimeout(() => canvas.setDirty(true, true), 0);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    const startSmoothPanning = () => {
      const canvas = window.canvasInstance;
      if (!canvas) return;
      const pan = () => {
        if (keysPressed.size === 0) return;
        let deltaX = 0;
        let deltaY = 0;
        let speed = KEYBOARD_CONFIG.PAN_SPEED;
        if (keysPressed.has('w') || keysPressed.has('arrowup')) deltaY += speed;
        if (keysPressed.has('s') || keysPressed.has('arrowdown')) deltaY -= speed;
        if (keysPressed.has('a') || keysPressed.has('arrowleft')) deltaX += speed;
        if (keysPressed.has('d') || keysPressed.has('arrowright')) deltaX -= speed;
        if (keysPressed.size > 1) {
          deltaX *= KEYBOARD_CONFIG.PAN_ACCELERATION;
          deltaY *= KEYBOARD_CONFIG.PAN_ACCELERATION;
        }
        if (canvas.ds && canvas.ds.offset !== undefined) {
          canvas.ds.offset[0] += deltaX;
          canvas.ds.offset[1] += deltaY;
        } else if (canvas.offset !== undefined) {
          canvas.offset[0] += deltaX;
          canvas.offset[1] += deltaY;
        }
        if (canvas.pan !== undefined && typeof canvas.pan === 'function') {
          canvas.pan(deltaX, deltaY);
        }
        if (!window.panRefreshTimeout) {
          window.panRefreshTimeout = setTimeout(() => {
            canvas.setDirty(true, true);
            window.panRefreshTimeout = null;
          }, 16);
        }
        animationFrameId = requestAnimationFrame(pan);
      };
      animationFrameId = requestAnimationFrame(pan);
    };
  }
  function createNetworkVisualization(graph) {
    if (!graph) {
      console.error('Graph is null or undefined');
      return;
    }
    if (!graph._groups) graph._groups = [];
    if (!graph._nodes) graph._nodes = [];
    if (!graph.links) graph.links = {};
    const { locations, devices, interfaces, connections, deviceIPs, pciSlots, pciCards } =
      getJsonData();
    if (!locations || locations.length === 0) {
      console.error('No locations data available. PHP data may not be loaded yet.');
      return;
    }
    if (!locations.length && !devices.length) {
      showError(
        'No locations or devices found in the database. Please run `php artisan migrate:fresh --seed`.'
      );
      return;
    }
    const { rootLocations } = buildLocationHierarchy(locations, devices);
    const nodeMap = new Map();
    const serviceNodes = [];
    let currentY = 50;
    rootLocations.forEach(rootLoc => {
      const rootGroup = createGroup(graph, rootLoc.name, [50, currentY], GROUP_ROOT_COLOR);
      if (!rootGroup) {
        console.error('Failed to create root group for location:', rootLoc.name);
        return;
      }
      const groupContentY = currentY + SPACING_CONFIG.GROUP_TITLE_HEIGHT;
      const contentDims = processLocation(
        graph,
        rootLoc,
        70,
        groupContentY,
        rootGroup,
        nodeMap,
        serviceNodes,
        pciCards
      );
      if (rootGroup.size) {
        rootGroup.size[0] = Math.max(800, contentDims.width + SPACING_CONFIG.GROUP_PADDING);
        rootGroup.size[1] = Math.max(
          200,
          contentDims.height + SPACING_CONFIG.GROUP_TITLE_HEIGHT + SPACING_CONFIG.GROUP_PADDING
        );
      }
      currentY +=
        (rootGroup.size ? rootGroup.size[1] : 200) + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
    });
    createPhysicalConnections(graph, connections, interfaces, nodeMap);
    createLogicalServiceConnections(nodeMap, serviceNodes);
    createPciConnections(graph, pciCards, pciSlots, nodeMap);
  }
  function processLocation(
    graph,
    location,
    startX,
    startY,
    parentGroup,
    nodeMap,
    serviceNodes,
    pciCards
  ) {
    let currentX = startX;
    let currentY = startY + 20;
    let maxWidth = 0;
    let totalWidth = 0;
    let totalHeight = 0;
    let maxChildHeight = 0;
    let initialX = startX;
    location.devices.forEach(device => {
      const { deviceNode, deviceWidth, deviceHeight } = createDeviceAndServiceNodes(
        graph,
        device,
        currentX,
        currentY,
        nodeMap,
        serviceNodes,
        pciCards
      );
      maxWidth = Math.max(maxWidth, deviceWidth);
      currentY += deviceHeight + SPACING_CONFIG.DEVICE_ROW_SPACING;
    });
    totalHeight = currentY - startY;
    location.children.forEach(childLoc => {
      const childGroup = createGroup(graph, childLoc.name, [currentX, currentY], GROUP_CHILD_COLOR);
      if (!childGroup) {
        console.error('Failed to create child group for location:', childLoc.name);
        return;
      }
      const childGroupContentY = currentY + SPACING_CONFIG.GROUP_TITLE_HEIGHT;
      const childDims = processLocation(
        graph,
        childLoc,
        currentX + 20,
        childGroupContentY,
        childGroup,
        nodeMap,
        serviceNodes,
        pciCards
      );
      if (childGroup.size) {
        childGroup.size[0] = Math.max(400, childDims.width + 40);
        childGroup.size[1] = Math.max(
          100,
          childDims.height + SPACING_CONFIG.GROUP_TITLE_HEIGHT + 40
        );
      }
      maxWidth = Math.max(maxWidth, childGroup.size ? childGroup.size[0] : 400);
      maxChildHeight = Math.max(maxChildHeight, childGroup.size ? childGroup.size[1] : 100);
      if (location.layout_direction === 'horizontal') {
        currentX +=
          (childGroup.size ? childGroup.size[0] : 400) + WIRE_ROUTING_CONFIG.GROUP_HORIZONTAL_GAP;
      } else {
        currentY +=
          (childGroup.size ? childGroup.size[1] : 100) + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
      }
    });
    if (location.layout_direction === 'horizontal' && location.children.length > 0) {
      totalWidth = currentX - initialX - WIRE_ROUTING_CONFIG.GROUP_HORIZONTAL_GAP;
    } else {
      totalWidth = maxWidth;
    }
    if (location.layout_direction === 'horizontal') {
      totalHeight = Math.max(totalHeight, maxChildHeight + SPACING_CONFIG.GROUP_TITLE_HEIGHT + 40);
    } else {
      totalHeight = currentY - startY;
    }
    return { width: totalWidth, height: totalHeight };
  }
  function createDeviceAndServiceNodes(graph, device, x, y, nodeMap, serviceNodes, pciCards) {
    const { interfaces, deviceIPs } = getJsonData();
    const deviceInterfaces = interfaces.filter(
      i => i.device_serial_number === device.serial_number
    );
    const deviceIPData = deviceIPs.find(d => d.device_serial_number === device.serial_number) || {
      ip_addresses: [],
    };
    const deviceNode = new DeviceNode();
    deviceNode.setDeviceData(device, deviceInterfaces);
    deviceNode.pos = [x, y];
    graph.add(deviceNode);
    nodeMap.set(device.serial_number, deviceNode);
    let serviceY = y;
    (deviceIPData.ip_addresses || []).forEach(ip => {
      (ip.services || []).forEach(service => {
        const serviceNode = new ServiceNode();
        serviceNode.setServiceData(service, ip.ip_address, service.port_number);
        const serviceX = x + deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL;
        serviceNode.pos = [serviceX, serviceY];
        graph.add(serviceNode);
        serviceNodes.push({
          node: serviceNode,
          deviceSerial: device.serial_number,
          service: service,
        });
        serviceY += SPACING_CONFIG.SERVICE_VERTICAL_SPACING;
      });
    });
    const deviceWidth = deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL + 200;
    const deviceHeight = Math.max(deviceNode.size[1], serviceY - y);
    const devicePciCards = pciCards.filter(
      card => card.device_serial_number === device.serial_number
    );
    devicePciCards.forEach((card, index) => {
      const pciCardNode = new PciCardNode();
      pciCardNode.setPciCardData(card);
      const pciX = x + deviceNode.size[0] + 300 + index * 200;
      pciCardNode.pos = [pciX, y + index * 80];
      graph.add(pciCardNode);
      nodeMap.set(card.card_serial_number, pciCardNode);
    });
    return {
      deviceNode,
      deviceWidth: Math.max(
        deviceWidth,
        devicePciCards.length > 0 ? deviceWidth + 300 + devicePciCards.length * 200 : deviceWidth
      ),
      deviceHeight,
    };
  }
  function renderRoutedConnection(
    ctx,
    a,
    b,
    link,
    skip_border,
    flow,
    color,
    start_dir,
    end_dir,
    num_sublines
  ) {
    if (!link || !link.route_along_groups) {
      return false;
    }
    ctx.save();
    const connectionColor = link.color || color || '#10b981';
    const routingPoints = calculateOrthogonalPath(
      a,
      b,
      start_dir,
      end_dir,
      link.wireIndex || 0,
      link
    );
    const isSelected = isLinkSelected(link);
    if (isSelected) {
      drawGlowingWire(ctx, routingPoints, connectionColor);
    }
    ctx.strokeStyle = connectionColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawRoundedPath(ctx, routingPoints);
    if (flow) {
      drawConnectionArrow(
        ctx,
        routingPoints[routingPoints.length - 2],
        routingPoints[routingPoints.length - 1],
        connectionColor
      );
    }
    if (isSelected || !PARTICLE_CONFIG.SHOW_ONLY_ON_SELECTED) {
      createParticlesForLink(link, routingPoints);
      drawParticles(ctx, routingPoints, link);
    }
    ctx.restore();
    return true;
  }
  function isLinkSelected(link) {
    if (!link || !window.canvasInstance || !window.canvasInstance.graph) return false;
    if (!window.canvasInstance.graph._nodes) window.canvasInstance.graph._nodes = [];
    if (!link.origin_id || !link.target_id) return false;
    const originNode = window.canvasInstance.graph.getNodeById(link.origin_id);
    const targetNode = window.canvasInstance.graph.getNodeById(link.target_id);
    if (!originNode || !targetNode) return false;
    return originNode.is_selected || targetNode.is_selected;
  }
  function createParticlesForLink(link, routingPoints) {
    if (!link || !routingPoints || routingPoints.length < 2) return;
    const linkId = `${link.origin_id}-${link.target_id}`;
    if (!activeParticles.has(linkId)) {
      activeParticles.set(linkId, []);
    }
    const particles = activeParticles.get(linkId);
    const pathLength = calculatePathLength(routingPoints);
    if (particles.length === 0 || pathLength / particles.length > PARTICLE_CONFIG.SPACING) {
      particles.push({
        position: 0,
        speed: PARTICLE_CONFIG.SPEED,
        pathLength: pathLength,
        routingPoints: routingPoints,
        trail: [],
      });
    }
  }
  function updateParticles(deltaTime) {
    activeParticles.forEach((particles, linkId) => {
      particles.forEach((particle, index) => {
        particle.position += particle.speed;
        if (particle.position >= particle.pathLength) {
          particle.position = 0;
          particle.trail = [];
        }
        const currentPos = getPositionAlongPath(
          particle.routingPoints,
          particle.position / particle.pathLength
        );
        particle.trail.push(currentPos);
        if (particle.trail.length > PARTICLE_CONFIG.TRAIL_LENGTH) {
          particle.trail.shift();
        }
      });
    });
  }
  function calculatePathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }
  function getPositionAlongPath(points, t) {
    const targetLength = t * calculatePathLength(points);
    let currentLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      if (currentLength + segmentLength >= targetLength) {
        const segmentT = (targetLength - currentLength) / segmentLength;
        return {
          x: points[i - 1].x + dx * segmentT,
          y: points[i - 1].y + dy * segmentT,
        };
      }
      currentLength += segmentLength;
    }
    return points[points.length - 1];
  }
  function drawParticles(ctx, routingPoints, link) {
    if (!routingPoints || routingPoints.length < 2) return;
    const linkId = `${link.origin_id}-${link.target_id}`;
    const particles = activeParticles.get(linkId);
    if (!particles) return;
    particles.forEach(particle => {
      if (particle.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = PARTICLE_CONFIG.COLOR;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        for (let i = 1; i < particle.trail.length; i++) {
          const alpha = i / particle.trail.length;
          ctx.globalAlpha = alpha * 0.6;
          ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        ctx.stroke();
        const currentPos = particle.trail[particle.trail.length - 1];
        ctx.globalAlpha = 1;
        ctx.fillStyle = PARTICLE_CONFIG.COLOR;
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, PARTICLE_CONFIG.SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }
  function cleanupUnselectedParticles() {
    const selectedLinkIds = new Set();
    if (window.canvasInstance && window.canvasInstance.graph) {
      const canvas = window.canvasInstance;
      if (!canvas.graph._nodes) {
        canvas.graph._nodes = [];
      }
      if (!canvas.graph.links) {
        canvas.graph.links = {};
      }
      if (Array.isArray(canvas.graph._nodes)) {
        canvas.graph._nodes.forEach(node => {
          if (node && node.outputs) {
            node.outputs.forEach(output => {
              if (output && output.links) {
                output.links.forEach(linkId => {
                  const link = canvas.graph.links[linkId];
                  if (link && isLinkSelected(link)) {
                    selectedLinkIds.add(`${link.origin_id}-${link.target_id}`);
                  }
                });
              }
            });
          }
        });
      }
    }
    for (const [linkId, particles] of activeParticles) {
      if (!selectedLinkIds.has(linkId)) {
        activeParticles.delete(linkId);
      }
    }
  }
  function drawGlowingWire(ctx, points, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawRoundedPath(ctx, points);
    ctx.restore();
  }
  function drawRoundedPath(ctx, points) {
    if (points.length < 2) return;
    const cornerRadius = WIRE_ROUTING_CONFIG.CORNER_RADIUS;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x;
      const dy2 = next.y - curr.y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (len1 < cornerRadius * 2 || len2 < cornerRadius * 2) {
        ctx.lineTo(curr.x, curr.y);
        continue;
      }
      const ux1 = dx1 / len1;
      const uy1 = dy1 / len1;
      const ux2 = dx2 / len2;
      const uy2 = dy2 / len2;
      const cornerX = curr.x - ux1 * cornerRadius;
      const cornerY = curr.y - uy1 * cornerRadius;
      const nextX = curr.x + ux2 * cornerRadius;
      const nextY = curr.y + uy2 * cornerRadius;
      ctx.lineTo(cornerX, cornerY);
      const cpX = curr.x;
      const cpY = curr.y;
      ctx.quadraticCurveTo(cpX, cpY, nextX, nextY);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }
  function calculateOrthogonalPath(startPos, endPos, startDir, endDir, wireIndex = 0, link = null) {
    // Delegate to the routing logic in connections.js
    if (window.calculateOrthogonalPath && window.calculateOrthogonalPath !== calculateOrthogonalPath) {
      return window.calculateOrthogonalPath(startPos, endPos, startDir, endDir, wireIndex, link);
    }
    
    // Fallback simple routing if connections.js routing is not available
    const points = [];
    points.push({ x: startPos[0], y: startPos[1] });
    const routingX = startPos[0] < endPos[0] ? endPos[0] - 100 : endPos[0] + 100;
    points.push({ x: routingX, y: startPos[1] });
    points.push({ x: routingX, y: endPos[1] });
    points.push({ x: endPos[0], y: endPos[1] });
    return points;
  }
  function drawConnectionArrow(ctx, fromPoint, toPoint, color) {
    const headLength = 12;
    const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
    ctx.strokeStyle = color || '#ffffff';
    ctx.fillStyle = color || '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(toPoint.x, toPoint.y);
    ctx.lineTo(
      toPoint.x - headLength * Math.cos(angle - Math.PI / 6),
      toPoint.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toPoint.x, toPoint.y);
    ctx.lineTo(
      toPoint.x - headLength * Math.cos(angle + Math.PI / 6),
      toPoint.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }
  function isNodeInGroup(node, group) {
    if (!node || !group) return false;
    const nodeX = node.pos[0];
    const nodeY = node.pos[1];
    const nodeWidth = node.size[0];
    const nodeHeight = node.size[1];
    const groupX = group.pos[0];
    const groupY = group.pos[1];
    const groupWidth = group.size ? group.size[0] : 200;
    const groupHeight = group.size ? group.size[1] : 100;
    return (
      nodeX >= groupX &&
      nodeX + nodeWidth <= groupX + groupWidth &&
      nodeY >= groupY &&
      nodeY + nodeHeight <= groupY + groupHeight
    );
  }
  function calculateGroupEdgeRouting(startPos, endPos, startGroup, endGroup, startDir, endDir) {
    const points = [];
    points.push({ x: startPos[0], y: startPos[1] });
    const startExit = getGroupEdgePoint(startPos, startGroup, startDir);
    points.push(startExit);
    const intermediatePoints = calculateIntermediateRouting(
      startExit,
      endPos,
      startGroup,
      endGroup
    );
    points.push(...intermediatePoints);
    const endEntry = getGroupEdgePoint(endPos, endGroup, endDir);
    points.push(endEntry);
    points.push({ x: endPos[0], y: endPos[1] });
    return points;
  }
  function getGroupEdgePoint(pos, group, direction) {
    const groupX = group.pos[0];
    const groupY = group.pos[1];
    const groupWidth = group.size ? group.size[0] : 200;
    const groupHeight = group.size ? group.size[1] : 100;
    switch (direction) {
      case LiteGraph.RIGHT:
        return { x: groupX + groupWidth, y: pos[1] };
      case LiteGraph.LEFT:
        return { x: groupX, y: pos[1] };
      case LiteGraph.DOWN:
        return { x: pos[0], y: groupY + groupHeight };
      case LiteGraph.UP:
        return { x: pos[0], y: groupY };
      default:
        return { x: pos[0], y: pos[1] };
    }
  }
  function calculateIntermediateRouting(startPoint, endPoint, startGroup, endGroup) {
    const points = [];
    const midY = (startPoint.y + endPoint.y) / 2;
    if (Math.abs(startGroup.pos[1] - endGroup.pos[1]) > 50) {
      points.push({ x: startPoint.x, y: midY });
      points.push({ x: endPoint.x, y: midY });
    } else {
      points.push({ x: (startPoint.x + endPoint.x) / 2, y: startPoint.y });
      points.push({ x: (startPoint.x + endPoint.x) / 2, y: endPoint.y });
    }
    return points;
  }

  // Group-aware routing helper functions
  function findNodeByPosition(pos) {
    if (
      !window.canvasInstance ||
      !window.canvasInstance.graph ||
      !window.canvasInstance.graph._nodes
    ) {
      return null;
    }

    let bestNode = null;
    let bestDistance = Infinity;

    // Find node that contains this position, or is closest to it
    for (const node of window.canvasInstance.graph._nodes) {
      if (node && node.pos && node.size) {
        const nodeLeft = node.pos[0];
        const nodeTop = node.pos[1];
        const nodeRight = nodeLeft + node.size[0];
        const nodeBottom = nodeTop + node.size[1];

        // First priority: Check if position is exactly within node bounds
        if (
          pos[0] >= nodeLeft &&
          pos[0] <= nodeRight &&
          pos[1] >= nodeTop &&
          pos[1] <= nodeBottom
        ) {
          return node; // Exact match - return immediately
        }

        // Second priority: Check with wire connection tolerance
        const tolerance = 80; // Larger tolerance for wire connection points at node edges
        if (
          pos[0] >= nodeLeft - tolerance &&
          pos[0] <= nodeRight + tolerance &&
          pos[1] >= nodeTop - tolerance &&
          pos[1] <= nodeBottom + tolerance
        ) {
          // Calculate distance to nearest edge of node for best match
          let distance;
          
          // Calculate distance to the closest point on the node rectangle
          const clampedX = Math.max(nodeLeft, Math.min(pos[0], nodeRight));
          const clampedY = Math.max(nodeTop, Math.min(pos[1], nodeBottom));
          distance = Math.sqrt(
            Math.pow(pos[0] - clampedX, 2) + Math.pow(pos[1] - clampedY, 2)
          );

          if (distance < bestDistance) {
            bestDistance = distance;
            bestNode = node;
          }
        }
      }
    }
    return bestNode;
  }

  function findNodeGroup(node) {
    if (
      !node ||
      !window.canvasInstance ||
      !window.canvasInstance.graph ||
      !window.canvasInstance.graph._groups
    ) {
      return null;
    }

    // Find the group that contains this node
    for (const group of window.canvasInstance.graph._groups) {
      if (group && isNodeInGroup(node, group)) {
        return group;
      }
    }
    return null;
  }

  function calculateGroupAwareRouting(
    startPos,
    endPos,
    sourceGroup,
    destGroup,
    startDir,
    endDir,
    wireIndex = 0,
    link = null
  ) {
    const points = [];
    const isPowerConnection = link && link.isPowerConnection;

    // Start point
    points.push({ x: startPos[0], y: startPos[1] });

    // Exit the source group
    const sourceExit = getGroupExitPoint(startPos, sourceGroup, startDir);
    points.push(sourceExit);

    // Calculate channel offset for multiple wires
    const channelOffset = isPowerConnection
      ? wireIndex * WIRE_ROUTING_CONFIG.GROUP_POWER_WIRE_SPACING
      : wireIndex * WIRE_ROUTING_CONFIG.GROUP_WIRE_SPACING;

    // Step 1: Route HORIZONTALLY until inline with destination group
    // Calculate the base routing position based on connection type and direction
    let routingX;

    if (isPowerConnection) {
      // Power connections use left side of target group
      routingX = destGroup.pos[0] - WIRE_ROUTING_CONFIG.GROUP_EXIT_MARGIN - channelOffset;
    } else {
      // Network connections adapt to start direction
      if (startDir === 3) {
        // LEFT direction - route to left side of target group
        routingX = destGroup.pos[0] - WIRE_ROUTING_CONFIG.GROUP_EXIT_MARGIN - channelOffset;
      } else {
        // RIGHT direction - route to right side of target group
        routingX =
          destGroup.pos[0] +
          (destGroup.size ? destGroup.size[0] : 200) +
          WIRE_ROUTING_CONFIG.GROUP_EXIT_MARGIN +
          channelOffset;
      }
    }

    points.push({ x: routingX, y: sourceExit.y });

    // Step 2: Route VERTICALLY to destination group level
    const destEntry = getGroupEntryPoint(endPos, destGroup, endDir);
    points.push({ x: routingX, y: destEntry.y });

    // Step 3: Enter the destination group
    points.push(destEntry);

    // Final point
    points.push({ x: endPos[0], y: endPos[1] });

    return points;
  }

  function getGroupExitPoint(pos, group, direction) {
    if (!group || !group.pos || !group.size) {
      return { x: pos[0], y: pos[1] };
    }

    const groupX = group.pos[0];
    const groupY = group.pos[1];
    const groupWidth = group.size[0] || 200;
    const groupHeight = group.size[1] || 100;
    const margin = WIRE_ROUTING_CONFIG.GROUP_EXIT_MARGIN;

    switch (direction) {
      case 3: // LEFT
        return { x: groupX - margin, y: pos[1] }; // Exit left side of group
      case 4: // RIGHT
        return { x: groupX + groupWidth + margin, y: pos[1] }; // Exit right side
      case 1: // UP
        return { x: pos[0], y: groupY - margin }; // Exit top
      case 2: // DOWN
        return { x: pos[0], y: groupY + groupHeight + margin }; // Exit bottom
      default:
        return { x: groupX - margin, y: pos[1] }; // Default to left
    }
  }

  function getGroupEntryPoint(pos, group, direction) {
    if (!group || !group.pos || !group.size) {
      return { x: pos[0], y: pos[1] };
    }

    const groupX = group.pos[0];
    const groupY = group.pos[1];
    const groupWidth = group.size[0] || 200;
    const groupHeight = group.size[1] || 100;
    const margin = WIRE_ROUTING_CONFIG.GROUP_EXIT_MARGIN;

    switch (direction) {
      case 3: // LEFT
        return { x: groupX - margin, y: pos[1] }; // Enter left side of group
      case 4: // RIGHT
        return { x: groupX + groupWidth + margin, y: pos[1] }; // Enter right side
      case 1: // UP
        return { x: pos[0], y: groupY - margin }; // Enter top
      case 2: // DOWN
        return { x: pos[0], y: groupY + groupHeight + margin }; // Enter bottom
      default:
        return { x: groupX - margin, y: pos[1] }; // Default to left
    }
  }

  function drawConnectionArrow(ctx, fromPoint, toPoint, color) {
    const headLength = 10;
    const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
    ctx.strokeStyle = color || '#ffffff';
    ctx.fillStyle = color || '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toPoint.x, toPoint.y);
    ctx.lineTo(
      toPoint.x - headLength * Math.cos(angle - Math.PI / 6),
      toPoint.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toPoint.x, toPoint.y);
    ctx.lineTo(
      toPoint.x - headLength * Math.cos(angle + Math.PI / 6),
      toPoint.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }
  function getJsonData() {
    return {
      locations: window.locationsJson || [],
      devices: window.devicesJson || [],
      interfaces: window.interfacesJson || [],
      connections: window.connectionsJson || [],
      deviceIPs: window.deviceIPsJson || [],
      services: window.servicesJson || [],
      pciSlots: window.pciSlotsJson || [],
      pciCards: window.pciCardsJson || [],
    };
  }
  function getLinkAtPosition(canvas, x, y) {
    if (!canvas || !canvas.graph) return null;
    if (!canvas.graph._nodes) canvas.graph._nodes = [];
    if (!canvas.graph.links) canvas.graph.links = {};
    for (let linkId in canvas.graph.links) {
      const link = canvas.graph.links[linkId];
      if (!link) continue;
      const originNode = canvas.graph.getNodeById(link.origin_id);
      const targetNode = canvas.graph.getNodeById(link.target_id);
      if (!originNode || !targetNode) continue;
      const originPos = originNode.getConnectionPos(false, link.origin_slot, [0, 0]);
      const targetPos = targetNode.getConnectionPos(true, link.target_slot, [0, 0]);
      if (link.route_along_groups) {
        const routingPoints = calculateOrthogonalPath(
          originPos,
          targetPos,
          link.start_dir || 4,
          link.end_dir || 3,
          link.wireIndex || 0,
          link
        );
        if (isPointNearPath(x, y, routingPoints, 12)) {
          return link;
        }
      } else {
        if (isPointNearLine(x, y, originPos[0], originPos[1], targetPos[0], targetPos[1], 12)) {
          return link;
        }
      }
    }
    return null;
  }
  function isPointNearPath(px, py, points, threshold) {
    if (!points || points.length < 2) return false;
    for (let i = 1; i < points.length; i++) {
      const x1 = points[i - 1].x;
      const y1 = points[i - 1].y;
      const x2 = points[i].x;
      const y2 = points[i].y;
      if (isPointNearLine(px, py, x1, y1, x2, y2, threshold)) {
        return true;
      }
    }
    return false;
  }
  function isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2) <= threshold;
    }
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    return distance <= threshold;
  }
  function buildLocationHierarchy(locations, devices) {
    const locationMap = new Map();
    locations.forEach(loc =>
      locationMap.set(loc.location_id, {
        ...loc,
        children: [],
        devices: devices.filter(d => d.location_id === loc.location_id),
      })
    );
    const rootLocations = [];
    locations.forEach(loc => {
      if (loc.parent_location_id) {
        locationMap.get(loc.parent_location_id)?.children.push(locationMap.get(loc.location_id));
      } else {
        rootLocations.push(locationMap.get(loc.location_id));
      }
    });
    return { rootLocations };
  }
  function createGroup(graph, title, pos, color) {
    if (!graph) {
      console.error('Graph is null or undefined');
      return null;
    }
    if (!graph._groups) {
      console.warn('Graph _groups array not available, creating it');
      graph._groups = [];
    }
    if (!graph._nodes) {
      console.warn('Graph _nodes array not available, creating it');
      graph._nodes = [];
    }
    if (!graph.links) {
      console.warn('Graph links object not available, creating it');
      graph.links = {};
    }
    const group = new window.LGraphGroup();
    if (!group) {
      console.error('Failed to create LGraphGroup');
      return null;
    }
    group.title = title;
    group.pos = pos;
    group.color = color;
    if (graph._groups && Array.isArray(graph._groups)) {
      graph._groups.push(group);
    } else {
      console.warn('Graph _groups is not an array, cannot add group');
      return null;
    }
    return group;
  }
  function resizeCanvas(canvas) {
    const canvasElement = document.getElementById('mycanvas');
    if (!canvasElement || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvasElement.style.width = `${window.innerWidth}px`;
    canvasElement.style.height = `${window.innerHeight}px`;
    canvasElement.width = window.innerWidth * dpr;
    canvasElement.height = window.innerHeight * dpr;
    canvasElement.getContext('2d').scale(dpr, dpr);
    canvas.resize();
    canvasElement.tabIndex = 0;
    canvasElement.style.outline = 'none';
  }
  document.addEventListener('DOMContentLoaded', initialize);
  window.addEventListener('nodeClassesLoaded', function (event) {
    setTimeout(initialize, 50);
  });
  function initializeCustomRendering(canvas) {
    if (!canvas) {
      return;
    }
    
    // Helper function to detect power connections by examining link endpoints
    function isPowerConnection(link) {
      if (!link || !link.origin_id || !link.target_id) {
        return false;
      }
      
      const graph = canvas.graph;
      if (!graph) return false;
      
      const sourceNode = graph.getNodeById(link.origin_id);
      const targetNode = graph.getNodeById(link.target_id);
      
      if (!sourceNode || !targetNode) return false;
      
      // Check if either node has "power" in its title (case insensitive)
      const sourceTitle = (sourceNode.title || '').toLowerCase();
      const targetTitle = (targetNode.title || '').toLowerCase();
      
      return sourceTitle.includes('power') || targetTitle.includes('power') || 
             sourceTitle.includes('apc') || targetTitle.includes('apc') ||
             sourceTitle.includes('ups') || targetTitle.includes('ups');
    }
    
    const originalRenderLink = canvas.renderLink;
    canvas.renderLink = function (
      ctx,
      a,
      b,
      link,
      skip_border,
      flow,
      color,
      start_dir,
      end_dir,
      num_sublines
    ) {
      // Only use custom routing for physical connections that explicitly set route_along_groups
      // Service and PCI connections should always use default LiteGraph routing
      if (link && link.route_along_groups === true) {
        // Set power connection property if not already set (for retroactive detection)
        if (!link.hasOwnProperty('isPowerConnection') && isPowerConnection(link)) {
          link.isPowerConnection = true;
        }
        
        const customRendered = renderRoutedConnection(
          ctx,
          a,
          b,
          link,
          skip_border,
          flow,
          color,
          start_dir,
          end_dir,
          num_sublines
        );
        if (customRendered) {
          return;
        }
      }
      
      // Use default LiteGraph routing for all other connections (services, PCI, etc.)
      originalRenderLink.call(
        this,
        ctx,
        a,
        b,
        link,
        skip_border,
        flow,
        color,
        start_dir,
        end_dir,
        num_sublines
      );
    };
  }
  function startParticleAnimation() {
    let lastTime = 0;
    function animate(currentTime) {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      if (deltaTime < 50) {
        updateParticles(deltaTime / 16.67);
        if (PARTICLE_CONFIG.SHOW_ONLY_ON_SELECTED) {
          cleanupUnselectedParticles();
        }
      }
      if (window.canvasInstance) {
        window.canvasInstance.setDirty(true, true);
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }
  function setupLivewireEventListeners() {
    Livewire.on('connection-update-response', data => {
      if (!data[0].success) {
        console.error(data);
        alert('Failed to save changes to database: ' + data[0].message);
        window.location.reload();
      }
    });
    Livewire.on('connection-delete-response', data => {
      if (data[0].success) {
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        console.error('Failed to delete connection from database:', data.message);
        alert('Failed to delete connection from database: ' + data.message);
      }
    });
  }
  function checkLivewireAvailability() {
    if (typeof Livewire !== 'undefined' && Livewire) {
      return true;
    }
    return false;
  }
  function initializeLivewireIntegration() {
    if (checkLivewireAvailability()) {
      setupLivewireEventListeners();
    } else {
      let attempts = 0;
      const maxAttempts = 50;
      const checkInterval = setInterval(() => {
        attempts++;
        if (checkLivewireAvailability()) {
          clearInterval(checkInterval);
          setupLivewireEventListeners();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.warn('Livewire integration failed to initialize - some features may not work');
        }
      }, 100);
    }
  }
  initializeLivewireIntegration();
})();
