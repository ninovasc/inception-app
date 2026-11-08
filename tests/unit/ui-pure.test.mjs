// tests/unit/ui-pure.test.mjs - Unit tests for pure functions in ui.js
import '../mock-browser.mjs';
import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { toggleHelp, togglePanel } from '../../js/ui.js';

// Helper to create a fresh document mock for each test
function createDocumentMock() {
  const mockElements = new Map();
  
  return {
    getElementById: (id) => mockElements.get(id) || null,
    createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }, appendChild: () => {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    // Store elements
    _elements: mockElements,
    _setElement: (id, el) => mockElements.set(id, el),
    _clear: () => mockElements.clear(),
  };
}

describe('UI Pure Functions', () => {
  let originalState;
  let originalDocument;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
    originalDocument = global.document;
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
    global.document = originalDocument;
  });

  beforeEach(() => {
    // Create fresh document mock for each test
    global.document = createDocumentMock();
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  describe('toggleHelp', () => {
    it('toggles helpModal class when element exists', () => {
      let toggled = false;
      const mockEl = {
        classList: {
          toggle: (cls) => { 
            if (cls === 'open') toggled = true; 
          }
        }
      };
      
      // Set up mock element
      global.document._setElement('helpModal', mockEl);
      
      toggleHelp();
      
      assert.equal(toggled, true);
    });

    it('does nothing when helpModal not found', () => {
      global.document._clear();
      
      // Should not throw
      toggleHelp();
      
      assert.ok(true);
    });
  });

  describe('togglePanel', () => {
    it('toggles panel class and updates arrow', () => {
      let panelToggled = false;
      let arrowText = '';
      
      const mockArrow = {
        textContent: (val) => { arrowText = val; }
      };
      
      const mockPanel = {
        classList: {
          toggle: (cls) => { 
            if (cls === 'open') panelToggled = true; 
            return true; // isOpen
          }
        },
        previousElementSibling: {
          querySelector: (sel) => {
            // The actual code uses 'span:last-child'
            if (sel === 'span:last-child') return mockArrow;
            return null;
          }
        }
      };
      
      global.document._setElement('testPanel', mockPanel);
      
      togglePanel('testPanel');
      
      assert.equal(panelToggled, true);
      assert.equal(arrowText, '▼');
    });

    it('shows ▶ when panel closed', () => {
      let panelToggled = false;
      let arrowText = '';
      
      const mockArrow = {
        textContent: (val) => { arrowText = val; }
      };
      
      const mockPanel = {
        classList: {
          toggle: (cls) => { 
            if (cls === 'open') panelToggled = false; 
            return false; // isOpen
          }
        },
        previousElementSibling: {
          querySelector: (sel) => {
            // The actual code uses 'span:last-child'
            if (sel === 'span:last-child') return mockArrow;
            return null;
          }
        }
      };
      
      global.document._setElement('testPanel', mockPanel);
      
      togglePanel('testPanel');
      
      assert.equal(panelToggled, false);
      assert.equal(arrowText, '▶');
    });

    it('does nothing when panel not found', () => {
      global.document._clear();
      
      // Should not throw
      togglePanel('nonexistent');
      
      assert.ok(true);
    });
  });
});