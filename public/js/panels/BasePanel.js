(function () {
  'use strict';

  class BasePanel {
    constructor(id, config = {}) {
      this.id = id;
      this.config = {
        position: 'fixed',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(45, 55, 72, 0.95)',
        color: '#FFFFFF',
        padding: '20px',
        borderRadius: '12px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        zIndex: '10000',
        border: '1px solid #4a5568',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        minWidth: '400px',
        maxWidth: '600px',
        pointerEvents: 'auto',
        ...config,
      };
      this.panel = null;
      this.eventListeners = [];
    }

    create() {
      this.remove();

      this.panel = document.createElement('div');
      this.panel.id = this.id;
      this.panel.style.cssText = this.generateCSS();

      this.panel.innerHTML = this.generateHTML();
      this.setupEventListeners();

      document.body.appendChild(this.panel);

      if (window.makeDraggable) {
        window.makeDraggable(this.panel);
      }

      this.afterCreate();
      return this.panel;
    }

    generateCSS() {
      return Object.entries(this.config)
        .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
        .join('; ');
    }

    camelToKebab(str) {
      return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    generateHTML() {
      return '';
    }

    setupEventListeners() {
      this.addEventListenerWithCleanup(this.panel, 'mousedown', e => e.stopPropagation(), {
        passive: true,
      });
      this.addEventListenerWithCleanup(this.panel, 'mouseup', e => e.stopPropagation(), {
        passive: true,
      });
      this.addEventListenerWithCleanup(this.panel, 'click', e => e.stopPropagation(), {
        passive: true,
      });

      const handleEscape = e => {
        if (e.key === 'Escape') {
          this.remove();
        }
      };
      this.addEventListenerWithCleanup(document, 'keydown', handleEscape, { passive: true });

      const closeOnClickOutside = e => {
        if (e.target === this.panel) {
          this.remove();
        }
      };
      setTimeout(() => {
        this.addEventListenerWithCleanup(document, 'click', closeOnClickOutside, { passive: true });
      }, 100);
    }

    addEventListenerWithCleanup(element, event, handler, options) {
      element.addEventListener(event, handler, options);
      this.eventListeners.push({ element, event, handler, options });
    }

    afterCreate() {}

    remove() {
      if (this.panel) {
        this.panel.remove();
        this.panel = null;
      }

      this.eventListeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this.eventListeners = [];

      if (this.panel && this.panel._cleanupDrag) {
        this.panel._cleanupDrag();
      }
      if (this.panel && this.panel._cleanupClickOutside) {
        this.panel._cleanupClickOutside();
      }
    }

    setupInputEventHandlers(inputSelector = 'input, select, button') {
      const inputs = this.panel.querySelectorAll(inputSelector);
      inputs.forEach(input => {
        if (input) {
          ['keydown', 'keyup', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
            this.addEventListenerWithCleanup(input, eventType, e => e.stopPropagation(), {
              passive: true,
            });
          });

          input.style.pointerEvents = 'auto';
          input.style.zIndex = '10001';

          if (input.tagName === 'INPUT') {
            this.addEventListenerWithCleanup(input, 'focus', () => {}, { passive: true });
            this.addEventListenerWithCleanup(input, 'blur', () => {}, { passive: true });
          }
        }
      });
    }
  }

  window.BasePanel = BasePanel;
})();
