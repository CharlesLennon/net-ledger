(function () {
  'use strict';

  if (typeof window === 'undefined') {
    console.error('Node classes require a browser environment');
    return;
  }

  const nodeFiles = ['BaseNetworkNode.js', 'DeviceNode.js', 'ServiceNode.js', 'PciCardNode.js'];

  let loadedCount = 0;
  const totalFiles = nodeFiles.length;

  function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = function () {
      console.error(`Failed to load node class: ${src}`);
    };
    document.head.appendChild(script);
  }

  function loadNext() {
    if (loadedCount >= totalFiles) {
      window.dispatchEvent(
        new CustomEvent('nodeClassesLoaded', {
          detail: {
            classes: ['BaseNetworkNode', 'DeviceNode', 'ServiceNode', 'PciCardNode'],
            message: 'All node classes are now available',
          },
        })
      );
      window.NodeClassInfo.status = 'loaded';
      console.log('✅ Node classes loaded successfully');
      return;
    }

    const fileName = nodeFiles[loadedCount];
    const scriptPath = `/js/nodes/${fileName}`;

    loadScript(scriptPath, function () {
      loadedCount++;
      loadNext();
    });
  }

  window.NodeClassInfo = {
    classes: ['BaseNetworkNode', 'DeviceNode', 'ServiceNode', 'PciCardNode'],
    loadOrder: nodeFiles,
    description: 'Node classes for network visualization',
    status: 'loading',
  };

  loadNext();
})();
