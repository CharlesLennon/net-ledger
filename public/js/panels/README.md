# Panel Classes

This directory contains the panel UI classes for the network visualization application. The panel system provides a modular, class-based approach to creating and managing UI panels.

## Architecture

### Base Classes

- **`BasePanel`** - Foundation class providing common panel functionality
- **`NodeEditPanel`** - Base class for node editing panels (extends BasePanel)

### Specialized Panels

- **`WireConfigPanel`** - Wire routing configuration panel
- **`DeviceNodeEditPanel`** - Device creation/editing panel
- **`ServiceNodeEditPanel`** - Service creation/editing panel  
- **`WireEditPanel`** - Wire property editing panel
- **`KeyboardControlsPanel`** - Keyboard shortcuts help panel

## Usage

### Loading the Panel System

The panel classes are automatically loaded when you include the index file:

```html
<script src="/js/panels/index.js"></script>
```

### Creating Panels

#### Using New Class-Based API

```javascript
// Create a wire configuration panel
const wirePanel = new WireConfigPanel();
wirePanel.create();

// Create a device edit panel
const devicePanel = new DeviceNodeEditPanel({ x: 100, y: 100 });
devicePanel.create();

// Create a service edit panel
const servicePanel = new ServiceNodeEditPanel({ x: 200, y: 200 });
servicePanel.create();

// Create a wire edit panel
const wireEditPanel = new WireEditPanel(linkObject);
wireEditPanel.create();

// Show keyboard controls
const controlsPanel = new KeyboardControlsPanel();
controlsPanel.create();
```

#### Using Legacy Functions (for backwards compatibility)

```javascript
// These still work for existing code
createWireConfigPanel();
createNodeEditPanel('device', position);
createNodeEditPanel('service', position);
setupWireEditPanel(link);
showKeyboardControls();
```

### Creating Custom Panels

Extend `BasePanel` to create custom panels:

```javascript
class MyCustomPanel extends BasePanel {
    constructor() {
        super('my-custom-panel', {
            // Custom configuration
            top: '100px',
            left: '100px',
            background: 'rgba(30, 41, 59, 0.95)',
            minWidth: '300px'
        });
    }

    generateHTML() {
        return `
            <div>
                <h3>My Custom Panel</h3>
                <button id="my-button">Click Me</button>
            </div>
        `;
    }

    afterCreate() {
        this.setupInputEventHandlers();
        
        const button = this.panel.querySelector('#my-button');
        this.addEventListenerWithCleanup(button, 'click', () => {
            alert('Button clicked!');
            this.remove();
        });
    }
}

// Use your custom panel
const customPanel = new MyCustomPanel();
customPanel.create();
```

## BasePanel Features

### Automatic Features

- **Event Management**: Automatic cleanup of event listeners
- **Escape Key Handling**: Close panels with ESC key
- **Click Outside to Close**: Close panels by clicking outside
- **Draggable Support**: Integration with existing drag functionality
- **CSS Generation**: Automatic CSS from configuration object
- **Input Event Handling**: Proper event propagation for form elements

### Configuration Options

The `BasePanel` constructor accepts a configuration object:

```javascript
{
    position: 'fixed',           // CSS position
    top: '100px',               // Top position
    left: '50%',                // Left position
    transform: 'translateX(-50%)', // CSS transform
    background: 'rgba(45, 55, 72, 0.95)', // Background color
    color: '#FFFFFF',           // Text color
    padding: '20px',            // Padding
    borderRadius: '12px',       // Border radius
    fontFamily: 'Arial, sans-serif', // Font family
    fontSize: '12px',           // Font size
    zIndex: '10000',            // Z-index
    border: '1px solid #4a5568', // Border
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', // Box shadow
    minWidth: '400px',          // Minimum width
    maxWidth: '600px',          // Maximum width
    pointerEvents: 'auto'       // Pointer events
}
```

### Methods

- **`create()`** - Create and display the panel
- **`remove()`** - Remove the panel and clean up
- **`generateHTML()`** - Override to provide panel content (virtual method)
- **`afterCreate()`** - Override for post-creation setup (virtual method)
- **`setupInputEventHandlers()`** - Setup event handlers for form elements
- **`addEventListenerWithCleanup()`** - Add event listener with automatic cleanup

## File Structure

```
panels/
├── index.js                    # Main loader and legacy wrappers
├── BasePanel.js               # Base panel class
├── NodeEditPanel.js           # Base node edit panel class
├── WireConfigPanel.js         # Wire configuration panel
├── DeviceNodeEditPanel.js     # Device creation panel  
├── ServiceNodeEditPanel.js    # Service creation panel
├── WireEditPanel.js           # Wire editing panel
├── KeyboardControlsPanel.js   # Keyboard controls help panel
└── README.md                  # This file
```

## Events

The panel system dispatches a `panelClassesLoaded` event when all classes are loaded:

```javascript
window.addEventListener('panelClassesLoaded', function(event) {
    console.log('Panel classes loaded:', event.detail.classes);
    // All panel classes are now available
});
```

## Migration from Legacy System

The new class-based system is fully backwards compatible. Existing code using functions like `createWireConfigPanel()` will continue to work without changes.

### Benefits of New System

- **Better Organization**: Related functionality grouped in classes
- **Reusability**: BasePanel provides common functionality
- **Extensibility**: Easy to create new panel types
- **Memory Management**: Automatic event listener cleanup
- **Type Safety**: Better IDE support and debugging
- **Maintainability**: Cleaner separation of concerns

### Migration Example

**Old way:**
```javascript
function createMyPanel() {
    const panel = document.createElement('div');
    // Manual setup...
    document.body.appendChild(panel);
    // Manual event handling...
}
```

**New way:**
```javascript
class MyPanel extends BasePanel {
    generateHTML() { return '<div>...</div>'; }
    afterCreate() { /* setup */ }
}
const panel = new MyPanel().create();
```
