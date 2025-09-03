# Network Node Classes

This directory contains the individual node class files for the LiteGraph network visualization system.

## File Structure

```
nodes/
├── index.js              # Index and documentation of available classes
├── BaseNetworkNode.js    # Base class for all network nodes
├── DeviceNode.js         # Network devices (switches, routers, servers, PDUs)
├── ServiceNode.js        # Network services (web servers, databases, APIs)
└── PciCardNode.js        # PCI expansion cards (network cards, GPUs, storage)
```

## Loading Order

The node classes are now loaded automatically via `index.js` which handles the dependency order:

1. `BaseNetworkNode.js` - Must be loaded first (base class)
2. `DeviceNode.js` - Extends BaseNetworkNode
3. `ServiceNode.js` - Extends BaseNetworkNode  
4. `PciCardNode.js` - Extends BaseNetworkNode

The index file dynamically loads these in sequence and fires a `nodeClassesLoaded` event when complete.

## Class Hierarchy

```
LGraphNode (LiteGraph)
└── BaseNetworkNode
    ├── DeviceNode
    ├── ServiceNode
    └── PciCardNode
```

## Base Class Features

**BaseNetworkNode** provides:
- Common styling and colors
- Title width calculation utilities
- Template methods for cloning
- Standard node setup

## Individual Class Features

### DeviceNode
- Handles network devices (switches, routers, servers, PDUs)
- Manages power interfaces and connections
- Supports different device types (regular, PDU, main power source)
- Automatically configures inputs/outputs based on device type

### ServiceNode  
- Represents network services (web servers, databases, APIs)
- Displays IP:port information
- Dynamic sizing based on service count
- Service-specific connection logic

### PciCardNode
- Represents PCI expansion cards
- Supports multiple card types (Network, GPU, Storage, USB)
- Card-type specific interface configuration
- Blue color theme to distinguish from other nodes

## Adding New Node Types

To add a new node type:

1. Create a new file in this directory (e.g., `SwitchNode.js`)
2. Extend `BaseNetworkNode` 
3. Implement required methods (`clone()`)
4. Add specific functionality for your node type
5. Export to global scope via `window.YourNodeClass`
6. Update the `nodeFiles` array in `index.js`
7. Register the node type in the main visualization script

## Loading System

The `index.js` file:
- Dynamically loads all node class files in the correct order
- Handles dependency management automatically
- Provides loading status feedback via console
- Fires a custom `nodeClassesLoaded` event when complete
- Exports `NodeClassInfo` object with loading status

## Usage in HTML

**New simplified approach:**
```html
<!-- Load just the index file - it handles everything else -->
<script src="{{ asset('js/nodes/index.js') }}"></script>

<!-- Then load main visualization -->
<script src="{{ asset('js/network-visualization.js') }}"></script>
```

**Old approach (no longer needed):**
```html
<!-- Load in dependency order -->
<script src="{{ asset('js/nodes/BaseNetworkNode.js') }}"></script>
<script src="{{ asset('js/nodes/DeviceNode.js') }}"></script>
<script src="{{ asset('js/nodes/ServiceNode.js') }}"></script>
<script src="{{ asset('js/nodes/PciCardNode.js') }}"></script>
```

## Registration

Node types are registered in `network-visualization.js`:

```javascript
window.LiteGraph.registerNodeType("network/device", DeviceNode);
window.LiteGraph.registerNodeType("network/service", ServiceNode);  
window.LiteGraph.registerNodeType("network/pci-card", PciCardNode);
```
