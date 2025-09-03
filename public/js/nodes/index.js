(function () {
  'use strict';
  if (typeof window === 'undefined') {
    console.error('Node classes require a browser environment');
    return;
  }
  if (typeof window.LGraphNode === 'undefined') {
    console.error('LiteGraph must be loaded before node classes');
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
      console.error(`Failed to load: ${src}`);
    };
    document.head.appendChild(script);
  }
  function loadNext() {
    if (loadedCount >= totalFiles) {
      window.dispatchEvent(
        new CustomEvent('nodeClassesLoaded', {
          detail: {
            classes: ['BaseNetworkNode', 'DeviceNode', 'ServiceNode', 'PciCardNode'],
            message: 'All network node classes are now available',
          },
        })
      );
      return;
    }
    const fileName = nodeFiles[loadedCount];
    const scriptPath = `/js/nodes/${fileName}`;
    loadScript(scriptPath, function () {
      loadedCount++;
      loadNext();
    });
  }
  loadNext();
  window.NodeClassInfo = {
    classes: ['BaseNetworkNode', 'DeviceNode', 'ServiceNode', 'PciCardNode'],
    loadOrder: nodeFiles,
    description: 'Network visualization node classes for LiteGraph',
    status: 'loading',
  };
  window.addEventListener('nodeClassesLoaded', function () {
    window.NodeClassInfo.status = 'loaded';
  });
})();
