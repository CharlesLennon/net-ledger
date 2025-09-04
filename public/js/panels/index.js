(function () {
  'use strict';

  if (typeof window === 'undefined') {
    console.error('Panel classes require a browser environment');
    return;
  }

  const panelFiles = [
    'BasePanel.js',
    'NodeEditPanel.js',
    'WireConfigPanel.js',
    'DeviceNodeEditPanel.js',
    'ServiceNodeEditPanel.js',
    'WireEditPanel.js',
    'KeyboardControlsPanel.js',
  ];

  let loadedCount = 0;
  const totalFiles = panelFiles.length;

  function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = function () {
      console.error(`Failed to load panel class: ${src}`);
    };
    document.head.appendChild(script);
  }

  function createImmediateLegacyWrappers() {
    window.createWireConfigPanel = function () {
      if (window.WireConfigPanel) {
        const existingPanel = document.getElementById('wire-config-panel');
        if (existingPanel) {
          existingPanel.remove();
          return;
        }

        const wirePanel = new window.WireConfigPanel();
        return wirePanel.create();
      } else {
        console.warn('WireConfigPanel not loaded yet, waiting for panel classes...');
        window.addEventListener(
          'panelClassesLoaded',
          () => {
            const existingPanel = document.getElementById('wire-config-panel');
            if (existingPanel) {
              existingPanel.remove();
              return;
            }

            const wirePanel = new window.WireConfigPanel();
            return wirePanel.create();
          },
          { once: true }
        );
      }
    };

    window.createNodeEditPanel = function (nodeType, position) {
      if (window.DeviceNodeEditPanel && window.ServiceNodeEditPanel) {
        const existingPanel = document.getElementById('node-edit-panel');
        if (existingPanel) {
          existingPanel.remove();
        }

        let panel;
        if (nodeType === 'device') {
          panel = new window.DeviceNodeEditPanel(position);
        } else if (nodeType === 'service') {
          panel = new window.ServiceNodeEditPanel(position);
        } else {
          console.error('Unknown node type:', nodeType);
          return;
        }

        return panel.create();
      } else {
        console.warn('Node edit panels not loaded yet, waiting for panel classes...');
        window.addEventListener(
          'panelClassesLoaded',
          () => {
            const existingPanel = document.getElementById('node-edit-panel');
            if (existingPanel) {
              existingPanel.remove();
            }

            let panel;
            if (nodeType === 'device') {
              panel = new window.DeviceNodeEditPanel(position);
            } else if (nodeType === 'service') {
              panel = new window.ServiceNodeEditPanel(position);
            } else {
              console.error('Unknown node type:', nodeType);
              return;
            }

            return panel.create();
          },
          { once: true }
        );
      }
    };

    window.setupWireEditPanel = function (link) {
      if (window.WireEditPanel) {
        const wireEditPanel = new window.WireEditPanel(link);
        return wireEditPanel.create();
      } else {
        console.warn('WireEditPanel not loaded yet, waiting for panel classes...');
        window.addEventListener(
          'panelClassesLoaded',
          () => {
            const wireEditPanel = new window.WireEditPanel(link);
            return wireEditPanel.create();
          },
          { once: true }
        );
      }
    };

    window.showKeyboardControls = function () {
      const existingPanel = document.getElementById('keyboard-controls-info');
      if (existingPanel) {
        console.log('Keyboard controls panel already visible');
        return;
      }

      if (window.KeyboardControlsPanel) {
        const controlsPanel = new window.KeyboardControlsPanel();
        return controlsPanel.create();
      } else {
        console.warn('KeyboardControlsPanel not loaded yet, waiting for panel classes...');
        window.addEventListener(
          'panelClassesLoaded',
          () => {
            const existingPanel = document.getElementById('keyboard-controls-info');
            if (existingPanel) {
              console.log('Keyboard controls panel already visible after loading');
              return;
            }
            const controlsPanel = new window.KeyboardControlsPanel();
            return controlsPanel.create();
          },
          { once: true }
        );
      }
    };

    window.setupDevicePanel = function (position) {
      console.warn('setupDevicePanel is deprecated. Use DeviceNodeEditPanel class instead.');
    };

    window.setupServicePanel = function (position) {
      console.warn('setupServicePanel is deprecated. Use ServiceNodeEditPanel class instead.');
    };
  }

  createImmediateLegacyWrappers();

  function loadNext() {
    if (loadedCount >= totalFiles) {
      window.dispatchEvent(
        new CustomEvent('panelClassesLoaded', {
          detail: {
            classes: [
              'BasePanel',
              'NodeEditPanel',
              'WireConfigPanel',
              'DeviceNodeEditPanel',
              'ServiceNodeEditPanel',
              'WireEditPanel',
              'KeyboardControlsPanel',
            ],
            message: 'All panel classes are now available',
          },
        })
      );
      return;
    }

    const fileName = panelFiles[loadedCount];
    const scriptPath = `/js/panels/${fileName}`;

    loadScript(scriptPath, function () {
      loadedCount++;
      loadNext();
    });
  }

  loadNext();

  window.PanelClassInfo = {
    classes: [
      'BasePanel',
      'NodeEditPanel',
      'WireConfigPanel',
      'DeviceNodeEditPanel',
      'ServiceNodeEditPanel',
      'WireEditPanel',
      'KeyboardControlsPanel',
    ],
    loadOrder: panelFiles,
    description: 'Panel UI classes for network visualization',
    status: 'loading',
  };

  window.addEventListener('panelClassesLoaded', function () {
    window.PanelClassInfo.status = 'loaded';
    console.log('✅ Panel classes loaded successfully');
  });
})();
