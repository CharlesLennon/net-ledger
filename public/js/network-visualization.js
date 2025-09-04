/**
 * REFACTORED Network Visualization - Main Entry Point
 * This file has been significantly reduced by extracting functionality into classes
 */
(function () {
  // Constants - Keep these here as they're used across multiple areas
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

  // Wire configuration - delegated to WireConfig class but kept local reference
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
    WIRE_OFFSET_INCREMENT: 500,
    ENABLE_GROUP_AWARE_ROUTING: true,
    GROUP_EXIT_MARGIN: 10,
    GROUP_ROUTING_HEIGHT_OFFSET: 50,
    GROUP_WIRE_SPACING: 15,
    GROUP_POWER_WIRE_SPACING: 20,
    GROUP_HORIZONTAL_GAP: 150,
    GROUP_WIRE_OFFSET: 20,
  };

  // Class instances
  let canvasManager = null;
  let keyboardController = null;
  let particleSystem = null;
  let wireRenderer = null;
  let networkManager = null;

  // Wire config delegation functions (maintain compatibility)
  function loadWireConfig() {
    if (window.wireConfig) {
      window.wireConfig.loadConfig();
      WIRE_ROUTING_CONFIG = window.wireConfig.getConfig();
      window.WIRE_ROUTING_CONFIG = WIRE_ROUTING_CONFIG;
    }
  }

  function saveWireConfig() {
    if (window.wireConfig) {
      window.wireConfig.saveConfig();
    }
  }

  function resetWireConfig() {
    if (window.wireConfig) {
      window.wireConfig.resetConfig();
      WIRE_ROUTING_CONFIG = window.wireConfig.getConfig();
      window.WIRE_ROUTING_CONFIG = WIRE_ROUTING_CONFIG;
    }
  }

  function applyWireConfig() {
    if (window.wireConfig) {
      window.wireConfig.applyConfig();
      WIRE_ROUTING_CONFIG = window.wireConfig.getConfig();
      window.WIRE_ROUTING_CONFIG = WIRE_ROUTING_CONFIG;
    }
  }

  function initializeWireConfig() {
    if (window.wireConfig) {
      WIRE_ROUTING_CONFIG = window.wireConfig.getConfig();
    } else {
      loadWireConfig();
    }
    window.WIRE_ROUTING_CONFIG = WIRE_ROUTING_CONFIG;
  }

  function copySettingsToClipboard() {
    if (window.wireConfig) {
      window.wireConfig.copySettingsToClipboard();
    }
  }

  // Expose functions globally for compatibility
  window.applyWireConfig = applyWireConfig;
  window.resetWireConfig = resetWireConfig;
  window.copySettingsToClipboard = copySettingsToClipboard;

  initializeWireConfig();

  // Context menu handling - moved here since it's complex and UI-specific
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
        if (typeof NetworkUtils !== 'undefined') {
          link = NetworkUtils.getLinkAtPosition(canvas, event.canvasX, event.canvasY);
        } else {
          // Fallback - no link detection if NetworkUtils not loaded
          link = null;
        }
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
        const link =
          typeof NetworkUtils !== 'undefined'
            ? NetworkUtils.getLinkAtPosition(canvas, options.event.canvasX, options.event.canvasY)
            : null;

        switch (content) {
          case 'Edit Wire':
            if (link) {
              window.editWire(link);
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
            window.editNode(node);
            break;
          case 'Clone Node':
            var new_node = node.clone();
            if (new_node) {
              new_node.pos = [node.pos[0] + 20, node.pos[1] + 20];
              if (node.nodeType && node.nodeId) {
                window.enablePositionSaving(
                  new_node,
                  node.nodeType,
                  node.nodeId + '_clone_' + Date.now()
                );
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
            window.createNodeEditPanel('device', devicePos);
            break;
          case 'Add Service Node':
            const servicePos = canvas.convertEventToCanvasOffset(options.event);
            window.createNodeEditPanel('service', servicePos);
            break;
          case 'Clear Canvas':
            if (confirm('Are you sure you want to clear all nodes?')) {
              canvas.graph.clear();
            }
            break;
          case 'Wire Configuration':
            window.createWireConfigPanel();
            break;
        }
      }
      return false;
    };
  }

  // Main network visualization function - simplified using NetworkManager
  function createNetworkVisualization(graph) {
    if (!graph) {
      console.error('Graph is null or undefined');
      return;
    }

    if (!graph._groups) graph._groups = [];
    if (!graph._nodes) graph._nodes = [];
    if (!graph.links) graph.links = {};

    const { locations, devices, interfaces, connections, deviceIPs, pciSlots, pciCards } =
      networkManager.getJsonData();

    if (!locations || locations.length === 0) {
      console.error('No locations data available. PHP data may not be loaded yet.');
      return;
    }

    if (!locations.length && !devices.length) {
      window.showError(
        'No locations or devices found in the database. Please run `php artisan migrate:fresh --seed`.'
      );
      return;
    }

    const { rootLocations } = networkManager.buildLocationHierarchy(locations, devices);
    const nodeMap = new Map();
    const serviceNodes = [];
    let currentY = 50;

    rootLocations.forEach(rootLoc => {
      const rootLayoutDirection = rootLoc.layout_direction || 'vertical';
      const rootGroup = networkManager.createGroup(
        graph,
        rootLoc.name,
        [50, currentY],
        GROUP_ROOT_COLOR,
        rootLayoutDirection
      );
      if (!rootGroup) {
        console.error('Failed to create root group for location:', rootLoc.name);
        return;
      }

      const groupContentY = currentY + SPACING_CONFIG.GROUP_TITLE_HEIGHT;
      const contentDims = networkManager.processLocation(
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

    // Create connections using external functions
    window.createPhysicalConnections(graph, connections, interfaces, nodeMap);
    window.createLogicalServiceConnections(nodeMap, serviceNodes);
    window.createPciConnections(graph, pciCards, pciSlots, nodeMap);
  }

  // Custom rendering setup - simplified
  function initializeCustomRendering(canvas) {
    if (!canvas) return;

    function isPowerConnection(link) {
      if (!link || !link.origin_id || !link.target_id) return false;
      const graph = canvas.graph;
      if (!graph) return false;

      const sourceNode = graph.getNodeById(link.origin_id);
      const targetNode = graph.getNodeById(link.target_id);
      if (!sourceNode || !targetNode) return false;

      const sourceTitle = (sourceNode.title || '').toLowerCase();
      const targetTitle = (targetNode.title || '').toLowerCase();

      return (
        sourceTitle.includes('power') ||
        targetTitle.includes('power') ||
        sourceTitle.includes('apc') ||
        targetTitle.includes('apc') ||
        sourceTitle.includes('ups') ||
        targetTitle.includes('ups')
      );
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
      if (link && link.route_along_groups === true) {
        if (!link.hasOwnProperty('isPowerConnection') && isPowerConnection(link)) {
          link.isPowerConnection = true;
        }

        const customRendered = wireRenderer.renderRoutedConnection(
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

  // Livewire integration
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
    return typeof Livewire !== 'undefined' && Livewire;
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

  // Main initialization function - greatly simplified
  function initialize() {
    // Check if our refactored classes are loaded
    if (
      typeof NetworkUtils === 'undefined' ||
      typeof CanvasManager === 'undefined' ||
      typeof KeyboardController === 'undefined' ||
      typeof ParticleSystem === 'undefined' ||
      typeof WireRenderer === 'undefined' ||
      typeof NetworkManager === 'undefined'
    ) {
      console.log('Waiting for network classes to load...');
      setTimeout(initialize, 100);
      return;
    }

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

    // Initialize our class instances
    canvasManager = new CanvasManager();
    keyboardController = new KeyboardController();
    particleSystem = new ParticleSystem();
    wireRenderer = new WireRenderer();
    networkManager = new NetworkManager();

    // Set configuration
    wireRenderer.setConfig(WIRE_ROUTING_CONFIG);

    // Make instances globally available
    window.canvasManager = canvasManager;
    window.keyboardController = keyboardController;
    window.particleSystem = particleSystem;
    window.wireRenderer = wireRenderer;
    window.networkManager = networkManager;

    // Setup event listener polyfill for wheel events
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

    // Register node types
    window.LiteGraph.registerNodeType('network/device', DeviceNode);
    window.LiteGraph.registerNodeType('network/service', ServiceNode);
    window.LiteGraph.registerNodeType('network/pci-card', PciCardNode);

    // Create graph and canvas
    const graph = new window.LiteGraph.LGraph();
    const canvas = new window.LGraphCanvas('#mycanvas', graph);

    window.canvasInstance = canvas;
    window.graphInstance = graph;
    window.createNetworkVisualization = createNetworkVisualization;
    window.CONNECTION_COLORS = CONNECTION_COLORS;
    window.getJsonData = networkManager.getJsonData.bind(networkManager);

    // Initialize graph structures
    if (!graph._groups) graph._groups = [];
    if (!graph._nodes) graph._nodes = [];
    if (!graph.links) graph.links = {};

    // Setup components
    canvasManager.setupCanvas(canvas);
    canvasManager.setupResizeListener();
    keyboardController.setupEventListeners();
    customizeMouseEvents(canvas);

    // Start systems
    graph.start();
    createNetworkVisualization(graph);
    initializeCustomRendering(canvas);
    particleSystem.startAnimation();

    setTimeout(() => {
      canvas.setDirty(true, true);
      if (window.showKeyboardControls) {
        window.showKeyboardControls();
      }
    }, 500);
  }

  // Export main functions for compatibility
  window.networkVisualization = {
    createNetworkVisualization: createNetworkVisualization,
  };

  // Export utility functions that were moved to classes (with safety checks)
  window.makeDraggable = function (element) {
    if (typeof NetworkUtils !== 'undefined') {
      return NetworkUtils.makeDraggable(element);
    } else {
      console.warn('NetworkUtils not loaded yet, makeDraggable not available');
    }
  };

  window.preserveCanvasViewport = function (callback) {
    if (canvasManager) {
      canvasManager.preserveCanvasViewport(callback);
    } else if (callback) {
      callback(); // Fallback - just execute callback
    }
  };

  window.updateWireProperties = function (link, newCableType) {
    if (typeof NetworkUtils !== 'undefined') {
      return NetworkUtils.updateWireProperties(link, newCableType);
    } else {
      console.warn('NetworkUtils not loaded yet, updateWireProperties not available');
    }
  };

  window.addInterfaceToList = function (label, type, index) {
    if (typeof NetworkUtils !== 'undefined') {
      return NetworkUtils.addInterfaceToList(label, type, index);
    } else {
      console.warn('NetworkUtils not loaded yet, addInterfaceToList not available');
    }
  };

  // Initialize everything
  document.addEventListener('DOMContentLoaded', initialize);
  window.addEventListener('nodeClassesLoaded', function (event) {
    setTimeout(initialize, 50);
  });

  initializeLivewireIntegration();
})();
