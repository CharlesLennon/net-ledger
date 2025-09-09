# NetworkManager Lifecycle System Documentation

## Overview

The NetworkManager has been completely refactored to use a clear lifecycle-based architecture with feature hooks. This makes it much easier to understand what happens when and allows optional features to plug into specific stages of the network visualization process.

## Lifecycle Stages

### 1. onMount(graph)
**Purpose**: Initialize the network manager and prepare basic structures  
**What it does**:
- Validates the graph parameter
- Initializes graph._groups, graph._nodes, and graph.links arrays
- Calls feature onMount hooks for initialization

**Feature Hook**: Features can implement `static onMount(context)` to initialize themselves

### 2. onPreRender()
**Purpose**: Prepare data before any rendering begins  
**What it does**:
- Loads JSON data from window globals
- Builds location hierarchy from flat location data
- Calls feature onPreRender hooks

**Feature Hook**: Features can implement `static onPreRender(context)` to prepare data

### 3. onCreateGroups(graph, rootLocations)
**Purpose**: Create location-based groups on the canvas  
**What it does**:
- Creates LGraphGroup instances for each location
- Handles hierarchical location relationships
- Positions groups horizontally with spacing
- Calls feature onCreateGroups hooks

**Feature Hook**: Features can implement `static onCreateGroups(context)` to modify group creation

### 4. onCreateNodes(graph)
**Purpose**: Create device and service nodes  
**What it does**:
- Creates DeviceNode instances for all devices
- Creates ServiceNode instances for services associated with devices
- Uses simple grid-based positioning
- Calls feature onCreateNodes hooks

**Feature Hook**: Features can implement `static onCreateNodes(context)` to enhance node creation

### 5. onCreateConnections(graph)
**Purpose**: Create physical and logical connections between nodes  
**What it does**:
- Creates physical connections from database connection data
- Creates logical service connections between devices and services
- Creates PCI card connections
- Calls feature onCreateConnections hooks

**Feature Hook**: Features can implement `static onCreateConnections(context)` to add connection types

### 6. onRender(graph)
**Purpose**: Final rendering phase for advanced features  
**What it does**:
- Calls feature onRender hooks for advanced rendering
- This is where features like DotMapper create navigation networks

**Feature Hook**: Features can implement `static onRender(context)` for advanced rendering

### 7. onPostRender(graph)
**Purpose**: Cleanup and finalization  
**What it does**:
- Calls feature onPostRender hooks
- Logs final statistics
- Performs any cleanup needed

**Feature Hook**: Features can implement `static onPostRender(context)` for cleanup

## How to Use

### Basic Usage
```javascript
// Create network manager
const networkManager = new NetworkManager();

// Create complete network visualization
const result = networkManager.createNetworkVisualization(graph);

if (result.success) {
    console.log(`Created ${result.groups} groups, ${result.nodes} nodes, ${result.connections} connections`);
} else {
    console.error('Failed to create visualization:', result.error);
}
```

### Manual Lifecycle Control
```javascript
const networkManager = new NetworkManager();

// Run lifecycle stages manually
networkManager.onMount(graph);
const hierarchy = networkManager.onPreRender();
const groups = networkManager.onCreateGroups(graph, hierarchy.rootLocations);
const nodes = networkManager.onCreateNodes(graph);
const connections = networkManager.onCreateConnections(graph);
networkManager.onRender(graph);
networkManager.onPostRender(graph);
```

## How to Create Features

### Feature Requirements
Features must be classes with static methods that follow this interface:

```javascript
class MyFeature {
    // Optional: Initialize during mount phase
    static onMount(context) {
        // context = { graph, manager }
        console.log('MyFeature initializing...');
        return { initialized: true };
    }

    // Optional: Prepare data during pre-render
    static onPreRender(context) {
        // context = { jsonData, locationHierarchy, manager }
        return { ready: true };
    }

    // Optional: Modify group creation
    static onCreateGroups(context) {
        // context = { graph, groups, rootLocations, manager }
        return { groupsModified: 0 };
    }

    // Optional: Enhance node creation
    static onCreateNodes(context) {
        // context = { graph, createdNodes, nodeMap, serviceNodes, manager }
        return { nodesEnhanced: 0 };
    }

    // Optional: Add connection types
    static onCreateConnections(context) {
        // context = { graph, connections, jsonData, manager }
        return { connectionsAdded: 0 };
    }

    // Optional: Advanced rendering
    static onRender(context) {
        // context = { graph, manager }
        return { renderingComplete: true };
    }

    // Optional: Cleanup
    static onPostRender(context) {
        // context = { graph, manager }
        return { cleanupComplete: true };
    }
}
```

### Feature Registration
Features are automatically discovered through the FEATURE_LOADER system:

1. Add your feature to the `features.js` file
2. Create a static method for each lifecycle hook you want to use
3. The NetworkManager will automatically call your methods during the appropriate lifecycle stage

### Example: DotMapper Feature
The DotMapper is a perfect example of how features integrate with the lifecycle:

```javascript
class DotMapper {
    // Initialize during mount
    static onMount(context) {
        if (!window.dotMapper) {
            window.dotMapper = new DotMapper();
        }
        return { initialized: true };
    }

    // Create navigation network during render
    static onRender(context) {
        const { graph } = context;
        
        // Collect group boundaries
        const boundaries = window.dotMapper.collectGroupBoundaries(graph);
        
        // Create navigation dots
        window.dotMapper.createNavigationNetwork(gaps, boundaries, canvasBounds);
        
        return { success: true, dotsCreated: window.dotMapper.navigationDots.length };
    }
}
```

## Key Benefits

1. **Clear Entry Points**: Each lifecycle stage has a specific purpose
2. **Feature Isolation**: Features don't need to know about each other
3. **Optional Enhancement**: Features can enhance specific stages without affecting others
4. **Easy Debugging**: You can run lifecycle stages individually
5. **Modular Architecture**: Add/remove features without changing core code

## Utility Methods

The NetworkManager also provides utility methods that can be used by features:

- `calculatePath(from, to, options)` - Simple path calculation
- `initializeGraph(graph)` - Ensure graph has required structures
- `buildLocationHierarchy(locations, devices)` - Build hierarchy from flat data
- `getJsonData()` - Get JSON data from window globals

## Migration from Old System

The old complex `processLocation` method has been replaced by the clear lifecycle stages. Instead of one monolithic method that did everything, we now have:

- Group creation is handled in `onCreateGroups`
- Node creation is handled in `onCreateNodes`
- Connection creation is handled in `onCreateConnections`
- Advanced features like navigation dots are handled in `onRender`

This makes the code much easier to understand and modify.
