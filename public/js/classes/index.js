/**
 * Centralized loading point for all network visualization classes
 * This file marks classes as loaded after they've been included in HTML
 */

(function () {
  // Mark classes as loaded for other scripts
  window.NetworkClassesInfo = {
    status: 'loaded',
    classes: [
      'NetworkUtils',
      'CanvasManager',
      'KeyboardController',
      'ParticleSystem',
      'WireRenderer',
      'NetworkManager',
    ],
    timestamp: new Date().toISOString(),
  };

  console.log('✅ Network classes marked as loaded:', window.NetworkClassesInfo.classes);
})();
