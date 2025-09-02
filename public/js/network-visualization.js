(function() {
    
    
    
    const NODE_TEXT_COLOR = "#FFFFFF";          
    const NODE_BG_COLOR = "#2d3748";            
    const NODE_TITLE_BG_COLOR = "#e4870eff";    
    const NODE_TITLE_TEXT_COLOR = "#FFFFFF";    
    
    
    const GROUP_CHILD_COLOR = "#4a5568";        
    const GROUP_ROOT_COLOR = "#2b6cb0";         

    
    const CONNECTION_COLORS = {
        
        INTERFACE_PHYSICAL: "#10b981",      
        INTERFACE_LOGICAL: "#3b82f6",       
        POWER: "#ef4444",                   
        MANAGEMENT: "#f59e0b",              
        DEFAULT: "#9ca3af",                 
        PCI_LANE: "#8b5cf6",               
        
        
        CABLE_CAT6: "#8b5cf6",             
        CABLE_CAT5E: "#06b6d4",            
        CABLE_FIBER: "#f59e0b",            
        CABLE_COPPER: "#10b981",           
        CABLE_COAXIAL: "#ef4444",          
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

    
    const KEYBOARD_CONFIG = {
        PAN_SPEED: 20,                  
        SMOOTH_PANNING: true,           
        PAN_ACCELERATION: 1.5,          
        ZOOM_SPEED: 0.1,               
    };

    
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
        WIRE_OFFSET_INCREMENT: 30,              
    };

    
    function loadWireConfig() {
        const saved = localStorage.getItem('wireRoutingConfig');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                WIRE_ROUTING_CONFIG = { ...WIRE_ROUTING_CONFIG, ...parsed };
            } catch (e) {
                console.warn('Failed to load wire config from localStorage:', e);
            }
        }
    }

    
    function saveWireConfig() {
        try {
            localStorage.setItem('wireRoutingConfig', JSON.stringify(WIRE_ROUTING_CONFIG));
        } catch (e) {
            console.warn('Failed to save wire config to localStorage:', e);
        }
    }

    
    loadWireConfig();

    
    function makeDraggable(element) {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let elementStartX = 0;
        let elementStartY = 0;

        const handleMouseDown = function(e) {
            
            if (e.target.tagName === 'H3' || e.target.closest('h3') || e.target.id === 'close-edit-panel-btn' || e.target.closest('#close-edit-panel-btn')) {
                return; 
            }

            
            if (isDragging) {
                handleMouseUp();
                return;
            }

            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            const rect = element.getBoundingClientRect();
            elementStartX = rect.left;
            elementStartY = rect.top;

            element.style.cursor = 'grabbing';
            e.preventDefault();

            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mousedown', handleMouseDownDuringDrag);
            document.addEventListener('mouseleave', handleMouseLeave);
        };

        const handleMouseDownDuringDrag = function(e) {
            
            if (isDragging) {
                handleMouseUp();
            }
        };

        const handleMouseMove = function(e) {
            if (!isDragging) return;

            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            const newLeft = elementStartX + deltaX;
            const newTop = elementStartY + deltaY;

            
            const maxLeft = window.innerWidth - element.offsetWidth;
            const maxTop = window.innerHeight - element.offsetHeight;

            element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
            element.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
            element.style.right = 'auto'; 
            element.style.transform = 'none'; 
        };

        const handleMouseUp = function() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'default';

                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('mousedown', handleMouseDownDuringDrag);
                document.removeEventListener('mouseleave', handleMouseLeave);
            }
        };

        const handleMouseLeave = function() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'default';

                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('mousedown', handleMouseDownDuringDrag);
                document.removeEventListener('mouseleave', handleMouseLeave);
            }
        };

        
        element.addEventListener('mousedown', handleMouseDown);

        
        element._cleanupDrag = function() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDownDuringDrag);
            document.removeEventListener('mouseleave', handleMouseLeave);
            element.removeEventListener('mousedown', handleMouseDown);
        };
    }

    
    function createWireConfigPanel() {
        
        const existingPanel = document.getElementById('wire-config-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'wire-config-panel';
        panel.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: rgba(45, 55, 72, 0.95);
            color: #FFFFFF;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            border: 1px solid #4a5568;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            max-width: 340px;
            max-height: 100vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Wire Configuration</h3>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #a0aec0; font-size: 11px;">(ESC to close)</span>
                    <button id="close-config-btn" style="
                        background: none;
                        border: none;
                        color: #a0aec0;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
            </div>

            <!-- Global Settings (apply to both modes) -->
            <div id="global-section" style="display: grid; grid-template-columns: 1fr 80px; gap: 8px; align-items: center; margin-bottom: 15px; padding: 12px; background: rgba(160, 174, 192, 0.1); border-radius: 6px; border-left: 3px solid #a0aec0;">
                <div style="grid-column: 1 / -1; margin-bottom: 8px; color: #a0aec0; font-weight: bold; font-size: 13px;">⚙️ Global Settings</div>
                <label style="color: #a0aec0;" title="Roundness of wire corners">Corner Radius:</label>
                <input type="number" id="corner-radius" value="${WIRE_ROUTING_CONFIG.CORNER_RADIUS}" min="5" max="30" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Offset increment for overlapping wires">Wire Offset Increment:</label>
                <input type="number" id="wire-offset-increment" value="${WIRE_ROUTING_CONFIG.WIRE_OFFSET_INCREMENT}" min="10" max="50" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Wire Routing Mode:</label>
                <select id="wire-routing-mode" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                    <option value="channel">Channel Routing</option>
                    <option value="distance">Distance Based Routing</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 80px; gap: 8px; align-items: center;">
                <!-- Power Settings Section -->
                <div id="power-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(228, 135, 14, 0.1); border-radius: 6px; border-left: 3px solid #e4870eff;">
                    <div style="color: #e4870eff; font-weight: bold; font-size: 13px; margin-bottom: 6px;">⚡ Power Wire Settings</div>
                </div>
                <label style="color: #a0aec0;" title="Distance between power wire channels">Channel Spacing:</label>
                <input type="number" id="power-channel-offset" value="${WIRE_ROUTING_CONFIG.POWER_CHANNEL_OFFSET}" min="20" max="200" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Additional left offset for power wires beyond the base left offset (set to 0 to align with regular wires)">Left Offset:</label>
                <input type="number" id="power-offset-left" value="${WIRE_ROUTING_CONFIG.POWER_OFFSET_LEFT}" min="50" max="400" step="25" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Additional right offset for power wires">Right Offset:</label>
                <input type="number" id="power-offset-right" value="${WIRE_ROUTING_CONFIG.POWER_OFFSET_RIGHT}" min="50" max="400" step="25" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Spacing between power wires">Wire Spacing:</label>
                <input type="number" id="power-wire-spacing" value="${WIRE_ROUTING_CONFIG.POWER_WIRE_SPACING}" min="20" max="150" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <!-- Left Side Settings Section -->
                <div id="left-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(74, 86, 104, 0.3); border-radius: 6px; border-left: 3px solid #4a5568;">
                    <div style="color: #4a5568; font-weight: bold; font-size: 13px; margin-bottom: 6px;">⬅️ Left Side Settings</div>
                </div>
                <label style="color: #a0aec0;" title="Base left offset for all wires (power wires use this as their base)">Left Offset:</label>
                <input type="number" id="non-power-offset-left" value="${WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT}" min="100" max="600" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Spacing between network wire channels">Network Channel Offset:</label>
                <input type="number" id="network-channel-offset" value="${WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET || 20}" min="10" max="100" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Spacing between wires on the left side">Left Wire Spacing:</label>
                <input type="number" id="left-wire-spacing" value="${WIRE_ROUTING_CONFIG.LEFT_WIRE_SPACING}" min="20" max="100" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="General spacing between wires">Wire Spacing:</label>
                <input type="number" id="wire-spacing" value="${WIRE_ROUTING_CONFIG.WIRE_SPACING}" min="20" max="100" step="5" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <!-- Right Side Settings Section -->
                <div id="right-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(74, 86, 104, 0.3); border-radius: 6px; border-left: 3px solid #4a5568;">
                    <div style="color: #4a5568; font-weight: bold; font-size: 13px; margin-bottom: 6px;">➡️ Right Side Settings</div>
                </div>
                <label style="color: #a0aec0;" title="How far right non-power wires route">Right Offset:</label>
                <input type="number" id="non-power-offset-right" value="${WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_RIGHT}" min="100" max="600" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <!-- Horizontal Positioning Section -->
                <div id="horizontal-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(66, 153, 225, 0.1); border-radius: 6px; border-left: 3px solid #4299e1;">
                    <div style="color: #4299e1; font-weight: bold; font-size: 13px; margin-bottom: 6px;">📍 Horizontal Positioning</div>
                </div>
                <label style="color: #a0aec0;" title="X position for left-side vertical wire channel">Left Channel Position:</label>
                <input type="number" id="horizontal-offset-left" value="${WIRE_ROUTING_CONFIG.HORIZONTAL_OFFSET_LEFT}" min="200" max="800" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="X position for right-side vertical wire channel">Right Channel Position:</label>
                <input type="number" id="horizontal-offset-right" value="${WIRE_ROUTING_CONFIG.HORIZONTAL_OFFSET_RIGHT}" min="800" max="1500" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <!-- Channel-Based Routing Section -->
                <div id="channel-section" style="grid-column: 1 / -1; margin: 12px 0 8px 0; padding: 8px 12px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; border-left: 3px solid #22c55e;">
                    <div style="color: #22c55e; font-weight: bold; font-size: 13px; margin-bottom: 6px;">🌐 Channel-Based Routing</div>
                </div>
                <label style="color: #a0aec0;" title="Enable channel-based routing instead of offset-based">Enable Channel Routing:</label>
                <input type="checkbox" id="enable-channel-routing" ${WIRE_ROUTING_CONFIG.ENABLE_CHANNEL_ROUTING ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #22c55e;">

                <label style="color: #a0aec0;" title="Fixed X position for left-side vertical wire channel">Left Channel X:</label>
                <input type="number" id="left-channel-x" value="${WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X}" min="-800" max="200" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Fixed X position for right-side vertical wire channel">Right Channel X:</label>
                <input type="number" id="right-channel-x" value="${WIRE_ROUTING_CONFIG.RIGHT_CHANNEL_X}" min="800" max="1500" step="50" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Spacing between wires within the same channel">Channel Spacing:</label>
                <input type="number" id="channel-spacing" value="${WIRE_ROUTING_CONFIG.CHANNEL_SPACING}" min="20" max="100" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">

                <label style="color: #a0aec0;" title="Width of each routing channel">Channel Width:</label>
                <input type="number" id="channel-width" value="${WIRE_ROUTING_CONFIG.CHANNEL_WIDTH}" min="30" max="150" step="10" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
            </div>

            <div style="margin-top: 15px; display: flex; gap: 8px;">
                <button id="apply-config-btn" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: #e4870eff;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Apply</button>
                <button id="copy-config-btn" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: #22c55e;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Copy Settings</button>
                <button id="reset-config-btn" style="
                    flex: 1;
                    padding: 8px 12px;
                    background: #4a5568;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Reset</button>
            </div>
        `;

        document.body.appendChild(panel);

        
        function updateVisibleSections() {
            const mode = document.getElementById('wire-routing-mode').value;
            
            const grid = panel.querySelector('div[style*="grid-template-columns"]:not(#global-section)');
            if (!grid) {
                console.error('Could not find main grid container for sections');
                return;
            }
            const allElements = Array.from(grid.children);
            
            
            const sectionMappings = {
                'power-section': 'distance',
                'left-section': 'distance', 
                'right-section': 'distance',
                'horizontal-section': 'distance',
                'channel-section': 'channel'
            };
            
            let currentSection = null;
            let elementsInCurrentSection = [];
            
            allElements.forEach(element => {
                if (element.id && element.id.endsWith('-section')) {
                    
                    if (currentSection) {
                        
                        const shouldShow = sectionMappings[currentSection] === mode;
                        elementsInCurrentSection.forEach(el => {
                            el.style.display = shouldShow ? 'block' : 'none';
                        });
                    }
                    
                    
                    currentSection = element.id;
                    elementsInCurrentSection = [element];
                } else if (currentSection) {
                    
                    elementsInCurrentSection.push(element);
                }
            });
            
            
            if (currentSection) {
                const shouldShow = sectionMappings[currentSection] === mode;
                elementsInCurrentSection.forEach(el => {
                    el.style.display = shouldShow ? 'block' : 'none';
                });
            }
        }

        
        document.getElementById('wire-routing-mode').addEventListener('change', updateVisibleSections);

        
        updateVisibleSections();

        
        const wireConfigInputs = panel.querySelectorAll('input, select, button');
        console.log('Found', wireConfigInputs.length, 'inputs/buttons in wire config panel');
        wireConfigInputs.forEach((input, index) => {
            if (input) {
                console.log(`Configuring input ${index}:`, input.id || input.tagName, input.type || 'button');
                
                input.addEventListener('keydown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('keyup', (e) => {
                    e.stopPropagation();
                });

                
                input.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mouseup', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                
                input.style.pointerEvents = 'auto';
                input.style.zIndex = '10001'; 

                
                if (input.tagName === 'INPUT') {
                    input.addEventListener('focus', () => {
                        console.log('Input focused:', input.id);
                    });
                    input.addEventListener('blur', () => {
                        console.log('Input blurred:', input.id);
                    });
                }
            }
        });

        
        const firstInput = panel.querySelector('input');
        if (firstInput) {
            console.log('Attempting to focus first input:', firstInput.id);
            setTimeout(() => {
                firstInput.focus();
                firstInput.select();
                console.log('First input focused and selected');
            }, 100);
        }

        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                panel.remove();
                document.removeEventListener('keydown', handleEscape);
                if (panel._cleanupDrag) {
                    panel._cleanupDrag();
                }
                if (panel._cleanupClickOutside) {
                    panel._cleanupClickOutside();
                }
            }
        };
        document.addEventListener('keydown', handleEscape);

        
        const closePanel = (e) => {
            if (e.target === panel) {
                panel.remove();
                document.removeEventListener('click', closePanel);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closePanel);
            
            panel._cleanupClickOutside = () => {
                document.removeEventListener('click', closePanel);
                document.removeEventListener('keydown', handleEscape);
            };
        }, 100);
        document.getElementById('apply-config-btn').onclick = applyWireConfig;
        document.getElementById('copy-config-btn').onclick = copySettingsToClipboard;
        document.getElementById('reset-config-btn').onclick = resetWireConfig;

        
        makeDraggable(panel);
    }

    
    function applyWireConfig() {
        const newConfig = {
            POWER_CHANNEL_OFFSET: parseInt(document.getElementById('power-channel-offset').value),
            NON_POWER_OFFSET_LEFT: parseInt(document.getElementById('non-power-offset-left').value),
            NON_POWER_OFFSET_RIGHT: parseInt(document.getElementById('non-power-offset-right').value),
            POWER_OFFSET_LEFT: parseInt(document.getElementById('power-offset-left').value),
            POWER_OFFSET_RIGHT: parseInt(document.getElementById('power-offset-right').value),
            NETWORK_CHANNEL_OFFSET: parseInt(document.getElementById('network-channel-offset').value),
            HORIZONTAL_OFFSET_LEFT: parseInt(document.getElementById('horizontal-offset-left').value),
            HORIZONTAL_OFFSET_RIGHT: parseInt(document.getElementById('horizontal-offset-right').value),
            WIRE_SPACING: parseInt(document.getElementById('wire-spacing').value),
            LEFT_WIRE_SPACING: parseInt(document.getElementById('left-wire-spacing').value),
            POWER_WIRE_SPACING: parseInt(document.getElementById('power-wire-spacing').value),
            CORNER_RADIUS: parseInt(document.getElementById('corner-radius').value),
            WIRE_OFFSET_INCREMENT: parseInt(document.getElementById('wire-offset-increment').value),
            
            ENABLE_CHANNEL_ROUTING: document.getElementById('enable-channel-routing').checked,
            LEFT_CHANNEL_X: parseInt(document.getElementById('left-channel-x').value),
            RIGHT_CHANNEL_X: parseInt(document.getElementById('right-channel-x').value),
            CHANNEL_SPACING: parseInt(document.getElementById('channel-spacing').value),
            CHANNEL_WIDTH: parseInt(document.getElementById('channel-width').value),
        };

        WIRE_ROUTING_CONFIG = { ...WIRE_ROUTING_CONFIG, ...newConfig };
        saveWireConfig();

        
        if (window.canvasInstance) {
            window.canvasInstance.setDirty(true, true);
        }

        
        const applyBtn = document.getElementById('apply-config-btn');
        const originalText = applyBtn.textContent;
        applyBtn.textContent = 'Applied!';
        applyBtn.style.background = '#10b981';
        setTimeout(() => {
            applyBtn.textContent = originalText;
            applyBtn.style.background = '#e4870eff';
        }, 1000);
    }

    
    function resetWireConfig() {
        const defaultConfig = {
            POWER_CHANNEL_OFFSET: 20,
            NON_POWER_OFFSET_LEFT: 600,
            NON_POWER_OFFSET_RIGHT: 600,
            POWER_OFFSET_LEFT: 200,
            POWER_OFFSET_RIGHT: 400,
            NETWORK_CHANNEL_OFFSET: 20,
            HORIZONTAL_OFFSET_LEFT: 200,
            HORIZONTAL_OFFSET_RIGHT: 1020,
            WIRE_SPACING: 30,
            LEFT_WIRE_SPACING: 25,
            POWER_WIRE_SPACING: 60,
            CORNER_RADIUS: 15,
            WIRE_OFFSET_INCREMENT: 30,
            
            ENABLE_CHANNEL_ROUTING: true,
            LEFT_CHANNEL_X: -300,
            RIGHT_CHANNEL_X: 1250,
            CHANNEL_SPACING: 30,
            CHANNEL_WIDTH: 60,
        };

        WIRE_ROUTING_CONFIG = { ...WIRE_ROUTING_CONFIG, ...defaultConfig };
        saveWireConfig();

        
        document.getElementById('power-channel-offset').value = defaultConfig.POWER_CHANNEL_OFFSET;
        document.getElementById('non-power-offset-left').value = defaultConfig.NON_POWER_OFFSET_LEFT;
        document.getElementById('non-power-offset-right').value = defaultConfig.NON_POWER_OFFSET_RIGHT;
        document.getElementById('power-offset-left').value = defaultConfig.POWER_OFFSET_LEFT;
        document.getElementById('power-offset-right').value = defaultConfig.POWER_OFFSET_RIGHT;
        document.getElementById('network-channel-offset').value = defaultConfig.NETWORK_CHANNEL_OFFSET;
        document.getElementById('horizontal-offset-left').value = defaultConfig.HORIZONTAL_OFFSET_LEFT;
        document.getElementById('horizontal-offset-right').value = defaultConfig.HORIZONTAL_OFFSET_RIGHT;
        document.getElementById('wire-spacing').value = defaultConfig.WIRE_SPACING;
        document.getElementById('left-wire-spacing').value = defaultConfig.LEFT_WIRE_SPACING;
        document.getElementById('power-wire-spacing').value = defaultConfig.POWER_WIRE_SPACING;
        document.getElementById('network-channel-offset').value = defaultConfig.NETWORK_CHANNEL_OFFSET;
        document.getElementById('corner-radius').value = defaultConfig.CORNER_RADIUS;
        document.getElementById('wire-offset-increment').value = defaultConfig.WIRE_OFFSET_INCREMENT;
        
        document.getElementById('enable-channel-routing').checked = defaultConfig.ENABLE_CHANNEL_ROUTING;
        document.getElementById('left-channel-x').value = defaultConfig.LEFT_CHANNEL_X;
        document.getElementById('right-channel-x').value = defaultConfig.RIGHT_CHANNEL_X;
        document.getElementById('channel-spacing').value = defaultConfig.CHANNEL_SPACING;
        document.getElementById('channel-width').value = defaultConfig.CHANNEL_WIDTH;

        
        if (window.canvasInstance) {
            window.canvasInstance.setDirty(true, true);
        }
    }

    
    function createNodeEditPanel(nodeType, position) {
        
        const existingPanel = document.getElementById('node-edit-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'node-edit-panel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(45, 55, 72, 0.95);
            color: #FFFFFF;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 10000;
            border: 1px solid #4a5568;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            min-width: 400px;
            max-width: 600px;
            pointer-events: auto;
        `;

        if (nodeType === 'device') {
            panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Create Device Node</h3>
                    <button id="close-edit-panel-btn" style="
                        background: none;
                        border: none;
                        color: #a0aec0;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>

                <div style="display: grid; gap: 12px;">
                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Device Name/Model:</label>
                        <input type="text" id="device-name" placeholder="e.g. Cisco Switch 2960" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="New Device">
                    </div>

                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Device Type:</label>
                        <select id="device-type" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;">
                            <option value="switch">Network Switch</option>
                            <option value="router">Router</option>
                            <option value="server">Server</option>
                            <option value="pdu">Power Distribution Unit</option>
                            <option value="ups">UPS</option>
                            <option value="firewall">Firewall</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div id="interfaces-section">
                        <label style="color: #a0aec0; display: block; margin-bottom: 8px;">Interfaces:</label>
                        <div id="interfaces-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 8px;">
                            <!-- Interfaces will be added here -->
                        </div>
                        <button id="add-interface-btn" style="
                            background: #4299e1;
                            color: #fff;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 11px;
                        ">Add Interface</button>
                    </div>
                </div>

                <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="cancel-node-btn" style="
                        padding: 8px 16px;
                        background: #4a5568;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Cancel</button>
                    <button id="create-node-btn" style="
                        padding: 8px 16px;
                        background: #e4870eff;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Create Node</button>
                </div>
            `;
        } else if (nodeType === 'service') {
            panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Create Service Node</h3>
                    <button id="close-edit-panel-btn" style="
                        background: none;
                        border: none;
                        color: #a0aec0;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>

                <div style="display: grid; gap: 12px;">
                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Service Name:</label>
                        <input type="text" id="service-name" placeholder="e.g. Web Server" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="New Service">
                    </div>

                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">IP Address:</label>
                        <input type="text" id="service-ip" placeholder="192.168.1.100" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="192.168.1.100">
                    </div>

                    <div>
                        <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Port:</label>
                        <input type="number" id="service-port" placeholder="80" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="80" min="1" max="65535">
                    </div>
                </div>

                <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="cancel-node-btn" style="
                        padding: 8px 16px;
                        background: #4a5568;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Cancel</button>
                    <button id="create-node-btn" style="
                        padding: 8px 16px;
                        background: #e4870eff;
                        color: #fff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Create Node</button>
                </div>
            `;
        }

        
        if (window.canvasInstance) {
            window.canvasInstance.allow_interaction = false;
            window.canvasInstance.allow_drag = false;
            window.canvasInstance.allow_reconnect_links = false;
        }

        
        panel.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        panel.addEventListener('mouseup', (e) => {
            e.stopPropagation();
        });
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.body.appendChild(panel);

        
        makeDraggable(panel);

        
        document.getElementById('close-edit-panel-btn').onclick = () => {
            panel.remove();
            
            if (panel._cleanupDrag) {
                panel._cleanupDrag();
            }
            
            if (window.canvasInstance) {
                window.canvasInstance.allow_interaction = true;
                window.canvasInstance.allow_drag = true;
                window.canvasInstance.allow_reconnect_links = true;
            }
        };
        document.getElementById('cancel-node-btn').onclick = () => {
            panel.remove();
            
            if (panel._cleanupDrag) {
                panel._cleanupDrag();
            }
            
            if (window.canvasInstance) {
                window.canvasInstance.allow_interaction = true;
                window.canvasInstance.allow_drag = true;
                window.canvasInstance.allow_reconnect_links = true;
            }
        };

        if (nodeType === 'device') {
            setupDevicePanel(position);
        } else if (nodeType === 'service') {
            setupServicePanel(position);
        }
    }

    
    function setupDevicePanel(position) {
        console.log('Setting up device panel...');
        let interfaces = [];

        const addInterfaceBtn = document.getElementById('add-interface-btn');
        const interfacesList = document.getElementById('interfaces-list');
        const createBtn = document.getElementById('create-node-btn');

        console.log('addInterfaceBtn found:', addInterfaceBtn);
        console.log('interfacesList found:', interfacesList);
        console.log('createBtn found:', createBtn);

        function addInterface() {
            console.log('addInterface called');
            const interfaceDiv = document.createElement('div');
            interfaceDiv.style.cssText = `
                display: flex;
                gap: 8px;
                align-items: center;
                margin-bottom: 8px;
                padding: 8px;
                background: rgba(74, 86, 104, 0.3);
                border-radius: 4px;
            `;

            const interfaceId = Date.now() + Math.random();
            interfaceDiv.innerHTML = `
                <select class="interface-type" style="flex: 1; padding: 4px; border-radius: 3px; border: 1px solid #4a5568; background: #2d3748; color: #fff; font-size: 11px;">
                    <option value="RJ45">RJ45 (Ethernet)</option>
                    <option value="SFP">SFP (Fiber)</option>
                    <option value="Power">Power</option>
                    <option value="USB">USB</option>
                    <option value="Console">Console</option>
                    <option value="PCI">PCI</option>
                </select>
                <input type="text" class="interface-label" placeholder="Port 1" style="flex: 2; padding: 4px; border-radius: 3px; border: 1px solid #4a5568; background: #2d3748; color: #fff; font-size: 11px;" value="Port ${interfaces.length + 1}">
                <button class="remove-interface-btn" style="
                    background: #e53e3e;
                    color: #fff;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 10px;
                ">×</button>
            `;

            interfacesList.appendChild(interfaceDiv);

            
            interfaceDiv.querySelector('.remove-interface-btn').onclick = () => {
                console.log('Remove interface clicked');
                interfaceDiv.remove();
                interfaces = interfaces.filter(i => i.id !== interfaceId);
            };

            interfaces.push({
                id: interfaceId,
                type: 'RJ45',
                label: `Port ${interfaces.length + 1}`,
                direction: 'output'
            });

            
            interfaceDiv.querySelector('.interface-type').onchange = (e) => {
                console.log('Interface type changed:', e.target.value);
                const interface = interfaces.find(i => i.id === interfaceId);
                if (interface) {
                    interface.type = e.target.value;
                    
                    if (e.target.value === 'Power') {
                        interface.direction = 'input';
                    } else {
                        interface.direction = 'output';
                    }
                }
            };

            interfaceDiv.querySelector('.interface-label').onchange = (e) => {
                console.log('Interface label changed:', e.target.value);
                const interface = interfaces.find(i => i.id === interfaceId);
                if (interface) {
                    interface.label = e.target.value;
                }
            };
        }

        if (addInterfaceBtn) {
            addInterfaceBtn.onclick = () => {
                console.log('Add Interface button clicked');
                addInterface();
            };
            console.log('Add Interface button event listener attached');
        } else {
            console.error('Add Interface button not found!');
        }

        
        addInterface();

        if (createBtn) {
            createBtn.onclick = () => {
                console.log('Create button clicked');
                const deviceName = document.getElementById('device-name').value;
                const deviceType = document.getElementById('device-type').value;

                console.log('Device name:', deviceName);
                console.log('Device type:', deviceType);

                if (!deviceName.trim()) {
                    alert('Please enter a device name');
                    return;
                }

                createCustomDeviceNode(deviceName, deviceType, interfaces, position);
                document.getElementById('node-edit-panel').remove();
                
                if (document.getElementById('node-edit-panel') && document.getElementById('node-edit-panel')._cleanupDrag) {
                    document.getElementById('node-edit-panel')._cleanupDrag();
                }
                
                if (window.canvasInstance) {
                    window.canvasInstance.allow_interaction = true;
                    window.canvasInstance.allow_drag = true;
                    window.canvasInstance.allow_reconnect_links = true;
                }
            };
            console.log('Create button event listener attached');
        } else {
            console.error('Create button not found!');
        }
    }

    
    function setupServicePanel(position) {
        console.log('Setting up service panel...');
        const createBtn = document.getElementById('create-node-btn');
        const serviceNameInput = document.getElementById('service-name');
        const serviceIpInput = document.getElementById('service-ip');
        const servicePortInput = document.getElementById('service-port');

        console.log('Service createBtn found:', createBtn);
        console.log('Service name input found:', serviceNameInput);
        console.log('Service IP input found:', serviceIpInput);
        console.log('Service port input found:', servicePortInput);

        
        const inputs = [serviceNameInput, serviceIpInput, servicePortInput];
        inputs.forEach(input => {
            if (input) {
                
                input.addEventListener('keydown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('keyup', (e) => {
                    e.stopPropagation();
                });

                
                input.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mouseup', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                
                input.style.pointerEvents = 'auto';
                input.style.zIndex = '10001'; 
            }
        });

        
        if (serviceNameInput) {
            serviceNameInput.focus();
            serviceNameInput.select();
            console.log('Service name input focused and selected');
        }

        if (createBtn) {
            createBtn.onclick = () => {
                console.log('Service Create button clicked');
                const serviceName = serviceNameInput ? serviceNameInput.value : '';
                const serviceIP = serviceIpInput ? serviceIpInput.value : '';
                const servicePort = servicePortInput ? servicePortInput.value : '';

                console.log('Service name:', serviceName);
                console.log('Service IP:', serviceIP);
                console.log('Service port:', servicePort);

                if (!serviceName.trim()) {
                    alert('Please enter a service name');
                    return;
                }

                if (!serviceIP.trim()) {
                    alert('Please enter an IP address');
                    return;
                }

                if (!servicePort || servicePort < 1 || servicePort > 65535) {
                    alert('Please enter a valid port number (1-65535)');
                    return;
                }

                createCustomServiceNode(serviceName, serviceIP, servicePort, position);
                document.getElementById('node-edit-panel').remove();
                
                if (document.getElementById('node-edit-panel') && document.getElementById('node-edit-panel')._cleanupDrag) {
                    document.getElementById('node-edit-panel')._cleanupDrag();
                }
                
                if (window.canvasInstance) {
                    window.canvasInstance.allow_interaction = true;
                    window.canvasInstance.allow_drag = true;
                    window.canvasInstance.allow_reconnect_links = true;
                }
            };
            console.log('Service Create button event listener attached');
        } else {
            console.error('Service Create button not found!');
        }
    }

    
    function createCustomDeviceNode(deviceName, deviceType, interfaces, position) {
        console.log('Creating custom device node:', deviceName, deviceType, interfaces);

        const deviceNode = new DeviceNode();

        
        const mockDeviceData = {
            model_name: deviceName,
            serial_number: 'CUSTOM-' + Date.now(),
            device_type: deviceType
        };

        
        const mockInterfaces = interfaces.map((iface, index) => ({
            interface_id: 'CUSTOM-IFACE-' + Date.now() + '-' + index,
            device_serial_number: mockDeviceData.serial_number,
            interface_type: iface.type,
            label: iface.label
        }));

        deviceNode.setDeviceData(mockDeviceData, mockInterfaces);
        deviceNode.pos = [position[0], position[1]];

        
        enablePositionSaving(deviceNode, 'device', mockDeviceData.serial_number);

        window.canvasInstance.graph.add(deviceNode);
        console.log('Custom device node created and added to canvas');
    }

    
    function createCustomServiceNode(serviceName, serviceIP, servicePort, position) {
        console.log('Creating custom service node:', serviceName, serviceIP, servicePort);

        const serviceNode = new ServiceNode();

        
        const mockServiceData = {
            service_id: 'CUSTOM-' + Date.now(),
            name: serviceName
        };

        serviceNode.setServiceData(mockServiceData, serviceIP, servicePort);
        serviceNode.pos = [position[0], position[1]];

        
        enablePositionSaving(serviceNode, 'service', mockServiceData.service_id);

        window.canvasInstance.graph.add(serviceNode);
        console.log('Custom service node created and added to canvas');
    }

    
    function editNode(node) {
        console.log('Editing node:', node);

        if (node instanceof DeviceNode) {
            editDeviceNode(node);
        } else if (node instanceof ServiceNode) {
            editServiceNode(node);
        } else if (node instanceof PciCardNode) {
            editPciCardNode(node);
        } else {
            alert('This node type cannot be edited.');
        }
    }

    
    function editDeviceNode(node) {
        console.log('Editing device node:', node.title);

        
        const existingPanel = document.getElementById('node-edit-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'node-edit-panel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(45, 55, 72, 0.95);
            color: #FFFFFF;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 10000;
            border: 1px solid #4a5568;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            min-width: 400px;
            max-width: 600px;
            pointer-events: auto;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Edit Device Node</h3>
                <button id="close-edit-panel-btn" style="
                    background: none;
                    border: none;
                    color: #a0aec0;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>

            <div style="display: grid; gap: 12px;">
                <div>
                    <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Device Name/Model:</label>
                    <input type="text" id="device-name" placeholder="e.g. Cisco Switch 2960" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.deviceData ? node.deviceData.model_name : node.title}">
                </div>

                <div id="interfaces-section">
                    <label style="color: #a0aec0; display: block; margin-bottom: 8px;">Interfaces:</label>
                    <div id="interfaces-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 8px;">
                        <!-- Interfaces will be added here -->
                    </div>
                    <button id="add-interface-btn" style="
                        background: #4299e1;
                        color: #fff;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">Add Interface</button>
                </div>
            </div>

            <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button id="cancel-node-btn" style="
                    padding: 8px 16px;
                    background: #4a5568;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Cancel</button>
                <button id="update-node-btn" style="
                    padding: 8px 16px;
                    background: #e4870eff;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Update Node</button>
            </div>
        `;

        
        if (window.canvasInstance) {
            window.canvasInstance.allow_interaction = false;
            window.canvasInstance.allow_drag = false;
            window.canvasInstance.allow_reconnect_links = false;
        }

        
        panel.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        panel.addEventListener('mouseup', (e) => {
            e.stopPropagation();
        });
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.body.appendChild(panel);

        
        makeDraggable(panel);

        
        document.getElementById('close-edit-panel-btn').onclick = () => {
            panel.remove();
            
            if (panel._cleanupDrag) {
                panel._cleanupDrag();
            }
            
            if (window.canvasInstance) {
                window.canvasInstance.allow_interaction = true;
                window.canvasInstance.allow_drag = true;
                window.canvasInstance.allow_reconnect_links = true;
            }
        };
        document.getElementById('cancel-node-btn').onclick = () => {
            panel.remove();
            
            if (panel._cleanupDrag) {
                panel._cleanupDrag();
            }
            
            if (window.canvasInstance) {
                window.canvasInstance.allow_interaction = true;
                window.canvasInstance.allow_drag = true;
                window.canvasInstance.allow_reconnect_links = true;
            }
        };

        
        setupDeviceEditPanel(node);
    }

    
    function editServiceNode(node) {
        console.log('Editing service node:', node.title);

        
        const existingPanel = document.getElementById('node-edit-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'node-edit-panel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(45, 55, 72, 0.95);
            color: #FFFFFF;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 10000;
            border: 1px solid #4a5568;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            min-width: 400px;
            max-width: 600px;
            pointer-events: auto;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #e4870eff; font-size: 14px;">Edit Service Node</h3>
                <button id="close-edit-panel-btn" style="
                    background: none;
                    border: none;
                    color: #a0aec0;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>

            <div style="display: grid; gap: 12px;">
                <div>
                    <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Service Name:</label>
                    <input type="text" id="service-name" placeholder="e.g. Web Server" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.serviceData ? node.serviceData.name : node.title}">
                </div>

                <div>
                    <label style="color: #a0aec0; display: block; margin-bottom: 4px;">IP Address:</label>
                    <input type="text" id="service-ip" placeholder="192.168.1.100" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.ipAddress || '192.168.1.100'}">
                </div>

                <div>
                    <label style="color: #a0aec0; display: block; margin-bottom: 4px;">Port:</label>
                    <input type="number" id="service-port" placeholder="80" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid #4a5568; background: #2d3748; color: #fff;" value="${node.portNumber || 80}" min="1" max="65535">
                </div>
            </div>

            <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button id="cancel-node-btn" style="
                    padding: 8px 16px;
                    background: #4a5568;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Cancel</button>
                <button id="update-node-btn" style="
                    padding: 8px 16px;
                    background: #e4870eff;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Update Node</button>
            </div>
        `;

        
        if (window.canvasInstance) {
            window.canvasInstance.allow_interaction = false;
            window.canvasInstance.allow_drag = false;
            window.canvasInstance.allow_reconnect_links = false;
        }

        
        panel.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        panel.addEventListener('mouseup', (e) => {
            e.stopPropagation();
        });
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.body.appendChild(panel);

        
        makeDraggable(panel);

        
        document.getElementById('close-edit-panel-btn').onclick = () => {
            panel.remove();
            
            if (panel._cleanupDrag) {
                panel._cleanupDrag();
            }
            
            if (window.canvasInstance) {
                window.canvasInstance.allow_interaction = true;
                window.canvasInstance.allow_drag = true;
                window.canvasInstance.allow_reconnect_links = true;
            }
        };
        document.getElementById('cancel-node-btn').onclick = () => {
            panel.remove();
            
            if (panel._cleanupDrag) {
                panel._cleanupDrag();
            }
            
            if (window.canvasInstance) {
                window.canvasInstance.allow_interaction = true;
                window.canvasInstance.allow_drag = true;
                window.canvasInstance.allow_reconnect_links = true;
            }
        };

        
        setupServiceEditPanel(node);
    }

    
    function editPciCardNode(node) {
        console.log('Editing PCI card node:', node.title);
        alert('PCI card editing is not yet implemented.');
    }

    
    function setupDeviceEditPanel(node) {
        console.log('Setting up device edit panel for node:', node.title);

        const deviceNameInput = document.getElementById('device-name');
        const interfacesList = document.getElementById('interfaces-list');
        const addInterfaceBtn = document.getElementById('add-interface-btn');
        const updateBtn = document.getElementById('update-node-btn');

        
        if (deviceNameInput && node.deviceData) {
            deviceNameInput.value = node.deviceData.model_name || node.title;
        }

        
        if (interfacesList) {
            interfacesList.innerHTML = '';
        }

        
        if (node.deviceInterfaces && node.deviceInterfaces.length > 0) {
            node.deviceInterfaces.forEach((iface, index) => {
                addInterfaceToList(iface.label, iface.interface_type, index);
            });
        }

        
        if (node.outputs) {
            node.outputs.forEach((output, index) => {
                if (output && output.name && output.name.toLowerCase().includes('pci')) {
                    
                    const outputName = output.name;
                    const label = outputName;
                    const type = 'PCI';
                    addInterfaceToList(label, type, node.deviceInterfaces ? node.deviceInterfaces.length + index : index);
                }
            });
        }

        
        if (addInterfaceBtn) {
            addInterfaceBtn.onclick = () => {
                addInterfaceToList('eth' + (node.deviceInterfaces ? node.deviceInterfaces.length + 1 : 1), 'RJ45');
            };
        }

        
        if (updateBtn) {
            updateBtn.onclick = () => {
                const newName = deviceNameInput ? deviceNameInput.value.trim() : '';

                if (!newName) {
                    alert('Please enter a device name');
                    return;
                }

                
                const interfaceItems = interfacesList.querySelectorAll('.interface-item');
                const newInterfaces = [];

                interfaceItems.forEach(item => {
                    const labelInput = item.querySelector('.interface-label');
                    const typeSelect = item.querySelector('.interface-type');

                    if (labelInput && typeSelect) {
                        const label = labelInput.value.trim();
                        const type = typeSelect.value;

                        if (label) {
                            newInterfaces.push({
                                label: label,
                                type: type
                            });
                        }
                    }
                });

                
                updateDeviceNode(node, newName, newInterfaces);

                
                document.getElementById('node-edit-panel').remove();
                
                if (document.getElementById('node-edit-panel') && document.getElementById('node-edit-panel')._cleanupDrag) {
                    document.getElementById('node-edit-panel')._cleanupDrag();
                }
                
                if (window.canvasInstance) {
                    window.canvasInstance.allow_interaction = true;
                    window.canvasInstance.allow_drag = true;
                    window.canvasInstance.allow_reconnect_links = true;
                }
            };
        }

        
        const inputs = [deviceNameInput];
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('keyup', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mouseup', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                input.style.pointerEvents = 'auto';
                input.style.zIndex = '10001';
            }
        });

        
        if (deviceNameInput) {
            deviceNameInput.focus();
            deviceNameInput.select();
        }
    }

    
    function setupServiceEditPanel(node) {
        console.log('Setting up service edit panel for node:', node.title);

        const serviceNameInput = document.getElementById('service-name');
        const serviceIpInput = document.getElementById('service-ip');
        const servicePortInput = document.getElementById('service-port');
        const updateBtn = document.getElementById('update-node-btn');

        
        if (serviceNameInput) {
            serviceNameInput.value = node.serviceData ? node.serviceData.name : node.title;
        }

        if (serviceIpInput) {
            serviceIpInput.value = node.ipAddress || '192.168.1.100';
        }

        if (servicePortInput) {
            servicePortInput.value = node.portNumber || 80;
        }

        
        if (updateBtn) {
            updateBtn.onclick = () => {
                const newName = serviceNameInput ? serviceNameInput.value.trim() : '';
                const newIP = serviceIpInput ? serviceIpInput.value.trim() : '';
                const newPort = servicePortInput ? parseInt(servicePortInput.value) : 80;

                if (!newName) {
                    alert('Please enter a service name');
                    return;
                }

                if (!newIP) {
                    alert('Please enter an IP address');
                    return;
                }

                if (!newPort || newPort < 1 || newPort > 65535) {
                    alert('Please enter a valid port number (1-65535)');
                    return;
                }

                
                updateServiceNode(node, newName, newIP, newPort);

                
                document.getElementById('node-edit-panel').remove();
                
                if (document.getElementById('node-edit-panel') && document.getElementById('node-edit-panel')._cleanupDrag) {
                    document.getElementById('node-edit-panel')._cleanupDrag();
                }
                
                if (window.canvasInstance) {
                    window.canvasInstance.allow_interaction = true;
                    window.canvasInstance.allow_drag = true;
                    window.canvasInstance.allow_reconnect_links = true;
                }
            };
        }

        
        const inputs = [serviceNameInput, serviceIpInput, servicePortInput];
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('keyup', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('mouseup', (e) => {
                    e.stopPropagation();
                });
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                input.style.pointerEvents = 'auto';
                input.style.zIndex = '10001';
            }
        });

        
        if (serviceNameInput) {
            serviceNameInput.focus();
            serviceNameInput.select();
        }
    }

    
    function addInterfaceToList(label, type, index) {
        const interfacesList = document.getElementById('interfaces-list');
        if (!interfacesList) return;

        const interfaceItem = document.createElement('div');
        interfaceItem.className = 'interface-item';
        interfaceItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            padding: 6px;
            background: #1a202c;
            border-radius: 4px;
            border: 1px solid #2d3748;
        `;

        interfaceItem.innerHTML = `
            <input type="text" class="interface-label" value="${label}" placeholder="Interface label" style="
                flex: 1;
                padding: 4px;
                border-radius: 3px;
                border: 1px solid #4a5568;
                background: #2d3748;
                color: #fff;
                font-size: 11px;
            ">
            <select class="interface-type" style="
                padding: 4px;
                border-radius: 3px;
                border: 1px solid #4a5568;
                background: #2d3748;
                color: #fff;
                font-size: 11px;
            ">
                <option value="RJ45" ${type === 'RJ45' ? 'selected' : ''}>RJ45</option>
                <option value="SFP" ${type === 'SFP' ? 'selected' : ''}>SFP</option>
                <option value="SFP+" ${type === 'SFP+' ? 'selected' : ''}>SFP+</option>
                <option value="Power" ${type === 'Power' ? 'selected' : ''}>Power</option>
                <option value="USB" ${type === 'USB' ? 'selected' : ''}>USB</option>
                <option value="Serial" ${type === 'Serial' ? 'selected' : ''}>Serial</option>
                <option value="PCI" ${type === 'PCI' ? 'selected' : ''}>PCI</option>
            </select>
            <button class="remove-interface-btn" style="
                background: #e53e3e;
                color: #fff;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            ">Remove</button>
        `;

        
        const removeBtn = interfaceItem.querySelector('.remove-interface-btn');
        if (removeBtn) {
            removeBtn.onclick = () => {
                interfaceItem.remove();
            };
        }

        
        const inputs = interfaceItem.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                e.stopPropagation();
            });
            input.addEventListener('keyup', (e) => {
                e.stopPropagation();
            });
            input.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            input.addEventListener('mouseup', (e) => {
                e.stopPropagation();
            });
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            input.style.pointerEvents = 'auto';
            input.style.zIndex = '10001';
        });

        interfacesList.appendChild(interfaceItem);
    }

    
    function updateDeviceNode(node, newName, newInterfaces) {
        console.log('Updating device node:', node.title, 'to:', newName, newInterfaces);

        
        if (node.deviceData) {
            node.deviceData.model_name = newName;
        }

        
        node.title = newName;

        
        node.inputs = [];
        node.outputs = [];

        
        node.addInput("power", "power");

        
        newInterfaces.forEach(iface => {
            const mockInterface = {
                interface_id: 'EDIT-' + Date.now() + '-' + Math.random(),
                device_serial_number: node.deviceData ? node.deviceData.serial_number : 'EDIT-' + Date.now(),
                interface_type: iface.type,
                label: iface.label
            };

            if (iface.type === 'Power') {
                node.addInput(`${iface.label} (${iface.type})`, "interface");
            } else {
                node.addOutput(`${iface.label} (${iface.type})`, "interface");
            }
        });

        
        node.deviceInterfaces = newInterfaces.map(iface => ({
            interface_id: 'EDIT-' + Date.now() + '-' + Math.random(),
            device_serial_number: node.deviceData ? node.deviceData.serial_number : 'EDIT-' + Date.now(),
            interface_type: iface.type,
            label: iface.label
        }));

        
        const textWidth = node.title.length * 8;
        node.size[0] = Math.max(200, textWidth + 40);
        node.size[1] = 60;

        
        if (window.canvasInstance) {
            window.canvasInstance.setDirty(true, true);
        }

        console.log('Device node updated successfully');
    }

    
    function updateServiceNode(node, newName, newIP, newPort) {
        console.log('Updating service node:', node.title, 'to:', newName, newIP, newPort);

        
        if (node.serviceData) {
            node.serviceData.name = newName;
        }

        
        node.ipAddress = newIP;
        node.portNumber = newPort;

        
        node.title = newName;

        
        if (node.inputs && node.inputs.length > 0) {
            node.inputs[0].label = `${newIP}:${newPort}`;
            node.inputs[0].name = `${newIP}:${newPort}`;
        }

        
        const textWidth = node.title.length * 8;
        const inputCount = node.inputs ? node.inputs.length : 1;
        node.size[0] = Math.max(160, textWidth + 30);
        node.size[1] = Math.max(SPACING_CONFIG.SERVICE_NODE_MIN_HEIGHT, 25 + (inputCount * SPACING_CONFIG.SERVICE_HEIGHT_PER_INPUT));

        
        if (window.canvasInstance) {
            window.canvasInstance.setDirty(true, true);
        }

        console.log('Service node updated successfully');
    }

    
    function copySettingsToClipboard() {
        try {
            
            const configData = {
                POWER_CHANNEL_OFFSET: parseInt(document.getElementById('power-channel-offset').value),
                NON_POWER_OFFSET_LEFT: parseInt(document.getElementById('non-power-offset-left').value),
                NON_POWER_OFFSET_RIGHT: parseInt(document.getElementById('non-power-offset-right').value),
                POWER_OFFSET_LEFT: parseInt(document.getElementById('power-offset-left').value),
                POWER_OFFSET_RIGHT: parseInt(document.getElementById('power-offset-right').value),
                NETWORK_CHANNEL_OFFSET: parseInt(document.getElementById('network-channel-offset').value),
                HORIZONTAL_OFFSET_LEFT: parseInt(document.getElementById('horizontal-offset-left').value),
                HORIZONTAL_OFFSET_RIGHT: parseInt(document.getElementById('horizontal-offset-right').value),
                WIRE_SPACING: parseInt(document.getElementById('wire-spacing').value),
                LEFT_WIRE_SPACING: parseInt(document.getElementById('left-wire-spacing').value),
                POWER_WIRE_SPACING: parseInt(document.getElementById('power-wire-spacing').value),
                CORNER_RADIUS: parseInt(document.getElementById('corner-radius').value),
                WIRE_OFFSET_INCREMENT: parseInt(document.getElementById('wire-offset-increment').value),
                
                ENABLE_CHANNEL_ROUTING: document.getElementById('enable-channel-routing').checked,
                LEFT_CHANNEL_X: parseInt(document.getElementById('left-channel-x').value),
                RIGHT_CHANNEL_X: parseInt(document.getElementById('right-channel-x').value),
                CHANNEL_SPACING: parseInt(document.getElementById('channel-spacing').value),
                CHANNEL_WIDTH: parseInt(document.getElementById('channel-width').value),
            };

            
            const jsonString = JSON.stringify(configData, null, 2);

            
            navigator.clipboard.writeText(jsonString).then(() => {
                
                const copyBtn = document.getElementById('copy-config-btn');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.style.background = '#10b981'; 
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '#22c55e'; 
                }, 1000);

                console.log('Wire configuration settings copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy settings to clipboard:', err);
                
                const textArea = document.createElement('textarea');
                textArea.value = jsonString;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    document.execCommand('copy');
                    
                    const copyBtn = document.getElementById('copy-config-btn');
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    copyBtn.style.background = '#10b981';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.style.background = '#22c55e';
                    }, 1000);
                } catch (fallbackErr) {
                    console.error('Fallback copy method also failed:', fallbackErr);
                    alert('Failed to copy settings to clipboard. Please try again.');
                } finally {
                    document.body.removeChild(textArea);
                }
            });
        } catch (error) {
            console.error('Error copying settings to clipboard:', error);
            alert('An error occurred while copying settings. Please try again.');
        }
    }

    
    const PARTICLE_CONFIG = {
        SPEED: 1.5,                            
        SIZE: 4,                               
        SPACING: 80,                           
        COLOR: "#ffffff",                      
        TRAIL_LENGTH: 8,                       
        SHOW_ONLY_ON_SELECTED: true,           
    };

    
    let savePositionMode = false;
    let savedPositions = {};

    
    window.networkVisualization = {
        setSaveMode: function(enabled) {
            savePositionMode = enabled;
        },
        createNetworkVisualization: createNetworkVisualization
    };

    
    function loadSavedPositions() {
        if (window.savedPositions) {
            savedPositions = window.savedPositions;
        }
    }

    
    function applySavedPosition(node, nodeType, nodeId) {
        
        node.nodeType = nodeType;
        node.nodeId = nodeId;
        
        const positionKey = nodeType + '_' + nodeId;
        if (savedPositions[positionKey]) {
            const position = savedPositions[positionKey];
            node.pos[0] = position.x;
            node.pos[1] = position.y;
        }
    }

    
    function saveNodePosition(node, nodeType, nodeId) {
        if (!savePositionMode || !window.saveNodePosition) return;
        
        
        window.saveNodePosition(nodeType, nodeId, node.pos[0], node.pos[1]);
    }

    
    function enablePositionSaving(node, nodeType, nodeId) {
        
        node.nodeType = nodeType;
        node.nodeId = nodeId;
        
        const originalOnNodeMoved = node.onNodeMoved;
        
        node.onNodeMoved = function() {
            if (originalOnNodeMoved) {
                originalOnNodeMoved.call(this);
            }
            saveNodePosition(this, nodeType, nodeId);
        };
    }

    
    let activeParticles = new Map();            

    class DeviceNode extends window.LGraphNode {
        constructor() {
            super();
            this.size = [200, 100];
            this.color = NODE_TEXT_COLOR;
            this.bgcolor = NODE_BG_COLOR;
            this.resizable = false;
            this.addInput("power", "power");
        }

        setDeviceData(deviceData, deviceInterfaces) {
            this.deviceData = deviceData; 
            this.deviceInterfaces = deviceInterfaces; 
            this.title = deviceData.model_name;
            const textWidth = this.title.length * 8;
            this.size[0] = Math.max(200, textWidth + 40);
            this.size[1] = 60;

            const isPDU = deviceData.model_name && (
                deviceData.model_name.toLowerCase().includes('pdu') ||
                deviceData.model_name.toLowerCase().includes('apc') ||
                deviceData.model_name.toLowerCase().includes('power')
            );

            const isMainPower = deviceData.model_name && deviceData.model_name.toLowerCase().includes('main-power-source');

            const hasPowerInterfaces = deviceInterfaces.some(i => i.interface_type === 'Power');
            if (hasPowerInterfaces) {
                this.inputs = this.inputs.filter(input => input.name !== 'power');
            }

            deviceInterfaces.forEach(interfaceData => {
                if (isMainPower) {
                    const outputName = `${interfaceData.label} (${interfaceData.interface_type})`;
                    this.addOutput(outputName, "interface");
                } else if (isPDU) {
                    if (interfaceData.label === 'power-in') {
                        const inputName = `${interfaceData.label} (${interfaceData.interface_type})`;
                        this.addInput(inputName, "interface");
                    } else {
                        const outputName = `${interfaceData.label} (${interfaceData.interface_type})`;
                        this.addOutput(outputName, "interface");
                    }
                } else {
                    if (interfaceData.interface_type === 'Power') {
                        const inputName = `${interfaceData.label} (${interfaceData.interface_type})`;
                        this.addInput(inputName, "interface");
                    } else {
                        const outputName = `${interfaceData.label} (${interfaceData.interface_type})`;
                        this.addOutput(outputName, "interface");
                    }
                }
            });
        }

        clone() {
            const clonedNode = new DeviceNode();
            if (this.deviceData) {
                
                const clonedDeviceData = JSON.parse(JSON.stringify(this.deviceData));
                
                clonedDeviceData.serial_number = 'CLONE-' + Date.now();
                clonedDeviceData.model_name = this.deviceData.model_name + ' (Clone)';

                
                const clonedInterfaces = this.deviceInterfaces ? JSON.parse(JSON.stringify(this.deviceInterfaces)) : [];

                clonedNode.setDeviceData(clonedDeviceData, clonedInterfaces);
                clonedNode.deviceInterfaces = clonedInterfaces; 
            }
            return clonedNode;
        }
    }

    DeviceNode.title_color = NODE_TITLE_BG_COLOR;
    DeviceNode.title_text_color = NODE_TITLE_TEXT_COLOR;

    class ServiceNode extends window.LGraphNode {
        constructor() {
            super();
            this.size = [180, 100];
            this.color = NODE_TEXT_COLOR;
            this.bgcolor = NODE_BG_COLOR;
            this.resizable = false;
            this.addInput('ip:port', "interface");
        }

        setServiceData(serviceData, ipAddress, portNumber) {
            this.serviceData = serviceData; 
            this.ipAddress = ipAddress; 
            this.portNumber = portNumber; 
            this.title = serviceData.name;
            if (this.inputs && this.inputs.length > 0) {
                this.inputs[0].label = `${ipAddress}:${portNumber}`;
                this.inputs[0].name = `${ipAddress}:${portNumber}`;
            }
            const textWidth = this.title.length * 8;
            const inputCount = this.inputs ? this.inputs.length : 1;
            this.size[0] = Math.max(160, textWidth + 30);
            this.size[1] = Math.max(SPACING_CONFIG.SERVICE_NODE_MIN_HEIGHT, 25 + (inputCount * SPACING_CONFIG.SERVICE_HEIGHT_PER_INPUT));
        }

        clone() {
            const clonedNode = new ServiceNode();
            if (this.serviceData) {
                
                const clonedServiceData = JSON.parse(JSON.stringify(this.serviceData));
                
                clonedServiceData.service_id = 'CLONE-' + Date.now();
                clonedServiceData.name = this.serviceData.name + ' (Clone)';

                
                const ipAddress = this.ipAddress || '192.168.1.100';
                const portNumber = this.portNumber || 80;

                clonedNode.setServiceData(clonedServiceData, ipAddress, portNumber);
            }
            return clonedNode;
        }
    }

    ServiceNode.title_color = NODE_TITLE_BG_COLOR;
    ServiceNode.title_text_color = NODE_TITLE_TEXT_COLOR;

    class PciCardNode extends window.LGraphNode {
        constructor() {
            super();
            this.size = [180, 80];
            this.color = NODE_TEXT_COLOR;
            this.bgcolor = "#1a365d"; 
            this.resizable = false;
            this.addInput("PCI Lane", "pci_lane");
        }

        setPciCardData(cardData) {
            this.cardData = cardData;
            this.title = cardData.model_name;
            const textWidth = this.title.length * 7;
            this.size[0] = Math.max(180, textWidth + 40);
            this.size[1] = 60;

            if (cardData.type === 'Network') {
                
                this.addOutput("RJ45-1", "interface");
                this.addOutput("RJ45-2", "interface");
                this.addOutput("RJ45-3", "interface");
                this.addOutput("RJ45-4", "interface");
                
                this.size[1] = 100;
            } else if (cardData.type === 'GPU') {
                this.addOutput("Display", "display");
            }
        }

        clone() {
            const clonedNode = new PciCardNode();
            if (this.cardData) {
                
                const clonedCardData = JSON.parse(JSON.stringify(this.cardData));
                
                clonedCardData.card_serial_number = 'CLONE-' + Date.now();
                clonedCardData.model_name = this.cardData.model_name + ' (Clone)';

                clonedNode.setPciCardData(clonedCardData);
            }
            return clonedNode;
        }
    }

    PciCardNode.title_color = "#2b6cb0"; 
    PciCardNode.title_text_color = NODE_TITLE_TEXT_COLOR;

    function customizeMouseEvents(canvas) {
        
        const canvasElement = document.getElementById('mycanvas');
        
        
        canvasElement.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Double-click prevented');
        });

        
        canvas.processNodeDblClicked = function(node) {
            
            console.log('Double-click disabled for node:', node.title);
        };

        
        canvas.processContextMenu = function(node, event) {
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

            if (slot) {
                
                menu_info = [
                    { content: "Disconnect", hasCallback: true },
                    null, 
                    { content: "Properties", hasCallback: true }
                ];
            } else if (node) {
                
                menu_info = [
                    { content: "Node Info", hasCallback: true },
                    null, 
                    { content: "Edit Node", hasCallback: true },
                    { content: "Clone Node", hasCallback: true },
                    null, 
                    { content: "Delete Node", hasCallback: true }
                ];
            } else {
                
                menu_info = [
                    { content: "Add Device Node", hasCallback: true },
                    { content: "Add Service Node", hasCallback: true },
                    null, 
                    { content: "Clear Canvas", hasCallback: true },
                    null, 
                    { content: "Wire Configuration", hasCallback: true }
                ];
            }

            
            if (menu_info) {
                var menu = new window.LiteGraph.ContextMenu(menu_info, options, ref_window);
            }

            function inner_option_clicked(v, options, e) {
                if (!v || !v.hasCallback) return;

                const content = v.content;
                const node = options.extra;

                switch (content) {
                    case "Disconnect":
                        if (slot.input) {
                            node.disconnectInput(slot.slot);
                        } else if (slot.output) {
                            node.disconnectOutput(slot.slot);
                        }
                        break;

                    case "Properties":
                        console.log('Slot properties:', slot);
                        
                        break;

                    case "Node Info":
                        alert(`Node: ${node.title}\nType: ${node.constructor.name}\nPosition: (${node.pos[0].toFixed(0)}, ${node.pos[1].toFixed(0)})`);
                        break;

                    case "Edit Node":
                        console.log('Editing node:', node.title);
                        editNode(node);
                        break;

                    case "Clone Node":
                        var new_node = node.clone();
                        if (new_node) {
                            new_node.pos = [node.pos[0] + 20, node.pos[1] + 20];
                            
                            if (node.nodeType && node.nodeId) {
                                enablePositionSaving(new_node, node.nodeType, node.nodeId + '_clone_' + Date.now());
                            }
                            canvas.graph.add(new_node);
                            console.log('Node cloned successfully');
                        } else {
                            console.error('Failed to clone node');
                            alert('Unable to clone this node type');
                        }
                        break;

                    case "Delete Node":
                        canvas.graph.remove(node);
                        break;

                    case "Add Device Node":
                        console.log('Opening device node editor...');
                        const devicePos = canvas.convertEventToCanvasOffset(options.event);
                        createNodeEditPanel('device', devicePos);
                        break;

                    case "Add Service Node":
                        console.log('Opening service node editor...');
                        const servicePos = canvas.convertEventToCanvasOffset(options.event);
                        createNodeEditPanel('service', servicePos);
                        break;

                    case "Clear Canvas":
                        if (confirm('Are you sure you want to clear all nodes?')) {
                            canvas.graph.clear();
                        }
                        break;

                    case "Wire Configuration":
                        console.log('Opening wire configuration panel...');
                        createWireConfigPanel();
                        console.log('Wire configuration panel should be open');
                        break;
                }
            }

            return false;
        };
    }

    function initialize() {
        if (typeof window.LiteGraph === 'undefined') {
            showError('LiteGraph library not loaded. Please check your setup.');
            return;
        }

        
        loadSavedPositions();

        window.LiteGraph.registerNodeType("network/device", DeviceNode);
        window.LiteGraph.registerNodeType("network/service", ServiceNode);
        window.LiteGraph.registerNodeType("network/pci-card", PciCardNode);

        const graph = new window.LiteGraph.LGraph();
        const canvas = new window.LGraphCanvas("#mycanvas", graph);
        
        window.canvasInstance = canvas;
        window.graphInstance = graph;
        window.createNetworkVisualization = createNetworkVisualization;
        
        setupCanvas(canvas);
        setupGlobalEventListeners();

        
        customizeMouseEvents(canvas);

        createNetworkVisualization(graph);
        graph.start();
        initializeCustomRendering(canvas);
        startParticleAnimation();
        
        setTimeout(() => {
            canvas.setDirty(true, true);
            showKeyboardControls();
        }, 500);
    }

    function setupCanvas(canvas) {
        canvas.background_image = null;
        canvas.render_connections_shadows = false;
        canvas.render_connection_arrows = true;
        canvas.highquality_render = true;
        canvas.use_gradients = true;
        resizeCanvas(canvas);
    }

    function setupGlobalEventListeners() {
        window.addEventListener('resize', () => resizeCanvas(window.canvasInstance));
        const canvasElement = document.getElementById('mycanvas');

        if (!canvasElement) {
            return;
        }

        canvasElement.tabIndex = 0;
        canvasElement.style.outline = 'none';

        const keysPressed = new Set();
        let animationFrameId = null;

        const handleKeyDown = (event) => {
            
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true')) {
                return;
            }

            const key = event.key.toLowerCase();
            keysPressed.add(key);

            if (key === '+' || key === '=') {
                event.preventDefault();
                zoomCanvas(1);
                return;
            }
            if (key === '-' || key === '_') {
                event.preventDefault();
                zoomCanvas(-1);
                return;
            }
            if (key === 'c' || key === 'C') {
                event.preventDefault();
                createWireConfigPanel();
                return;
            }

            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                event.preventDefault();
            }

            if (!animationFrameId) {
                startSmoothPanning();
            }
        };

        const handleKeyUp = (event) => {
            
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true')) {
                return;
            }

            const key = event.key.toLowerCase();
            keysPressed.delete(key);

            if (keysPressed.size === 0 && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        const zoomCanvas = (direction) => {
            const canvas = window.canvasInstance;
            if (!canvas) return;

            if (canvas.ds && canvas.ds.scale !== undefined) {
                const currentScale = canvas.ds.scale;
                const newScale = Math.max(0.1, Math.min(2.0, currentScale + (direction * KEYBOARD_CONFIG.ZOOM_SPEED)));

                if (newScale !== currentScale) {
                    canvas.ds.scale = newScale;
                    canvas.setDirty(true, true);
                }
            } else if (canvas.scale !== undefined) {
                const currentScale = canvas.scale;
                const newScale = Math.max(0.1, Math.min(2.0, currentScale + (direction * KEYBOARD_CONFIG.ZOOM_SPEED)));

                if (newScale !== currentScale) {
                    canvas.scale = newScale;
                    canvas.setDirty(true, true);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        const startSmoothPanning = () => {
            const canvas = window.canvasInstance;
            if (!canvas) return;

            const pan = () => {
                if (keysPressed.size === 0) return;

                let deltaX = 0;
                let deltaY = 0;
                let speed = KEYBOARD_CONFIG.PAN_SPEED;

                if (keysPressed.has('w') || keysPressed.has('arrowup')) deltaY += speed;
                if (keysPressed.has('s') || keysPressed.has('arrowdown')) deltaY -= speed;
                if (keysPressed.has('a') || keysPressed.has('arrowleft')) deltaX += speed;
                if (keysPressed.has('d') || keysPressed.has('arrowright')) deltaX -= speed;

                if (keysPressed.size > 1) {
                    deltaX *= KEYBOARD_CONFIG.PAN_ACCELERATION;
                    deltaY *= KEYBOARD_CONFIG.PAN_ACCELERATION;
                }

                if (canvas.ds && canvas.ds.offset !== undefined) {
                    canvas.ds.offset[0] += deltaX;
                    canvas.ds.offset[1] += deltaY;
                } else if (canvas.offset !== undefined) {
                    canvas.offset[0] += deltaX;
                    canvas.offset[1] += deltaY;
                } else if (canvas.pan !== undefined && typeof canvas.pan === 'function') {
                    canvas.pan(deltaX, deltaY);
                }

                canvas.setDirty(true, true);
                animationFrameId = requestAnimationFrame(pan);
            };

            animationFrameId = requestAnimationFrame(pan);
        };
    }

    function createNetworkVisualization(graph) {
        const { locations, devices, interfaces, connections, deviceIPs, pciSlots, pciCards } = getJsonData();
        
        
        if (!locations || locations.length === 0) {
            console.error('No locations data available. PHP data may not be loaded yet.');
            return;
        }
        
        if (!locations.length && !devices.length) {
            showError('No locations or devices found in the database. Please run `php artisan migrate:fresh --seed`.');
            return;
        }

        const { rootLocations } = buildLocationHierarchy(locations, devices);
        
        const nodeMap = new Map();
        const serviceNodes = [];
        
        let currentY = 50;
        rootLocations.forEach(rootLoc => {
            const rootGroup = createGroup(graph, rootLoc.name, [50, currentY], GROUP_ROOT_COLOR);
            const groupContentY = currentY + SPACING_CONFIG.GROUP_TITLE_HEIGHT;
            const contentDims = processLocation(graph, rootLoc, 70, groupContentY, rootGroup, nodeMap, serviceNodes, pciCards);
            
            rootGroup.size[0] = Math.max(800, contentDims.width + SPACING_CONFIG.GROUP_PADDING);
            rootGroup.size[1] = Math.max(200, contentDims.height + SPACING_CONFIG.GROUP_TITLE_HEIGHT + SPACING_CONFIG.GROUP_PADDING);
            currentY += rootGroup.size[1] + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
        });

        createPhysicalConnections(graph, connections, interfaces, nodeMap);
        createLogicalServiceConnections(nodeMap, serviceNodes);
        createPciConnections(graph, pciCards, pciSlots, nodeMap);
    }

    function processLocation(graph, location, startX, startY, parentGroup, nodeMap, serviceNodes, pciCards) {
        let currentX = startX;
        let currentY = startY + 20;
        let maxWidth = 0;
        let totalWidth = 0;
        let totalHeight = 0;
        let maxChildHeight = 0;
        let initialX = startX;

        location.devices.forEach(device => {
            const { deviceNode, deviceWidth, deviceHeight } = createDeviceAndServiceNodes(graph, device, currentX, currentY, nodeMap, serviceNodes, pciCards);
            maxWidth = Math.max(maxWidth, deviceWidth);
            currentY += deviceHeight + SPACING_CONFIG.DEVICE_ROW_SPACING;
        });
        totalHeight = currentY - startY;

        location.children.forEach(childLoc => {
            const childGroup = createGroup(graph, childLoc.name, [currentX, currentY], GROUP_CHILD_COLOR);
            const childGroupContentY = currentY + SPACING_CONFIG.GROUP_TITLE_HEIGHT;
            const childDims = processLocation(graph, childLoc, currentX + 20, childGroupContentY, childGroup, nodeMap, serviceNodes, pciCards);
            
            childGroup.size[0] = Math.max(400, childDims.width + 40);
            childGroup.size[1] = Math.max(100, childDims.height + SPACING_CONFIG.GROUP_TITLE_HEIGHT + 40);
            
            maxWidth = Math.max(maxWidth, childGroup.size[0]);
            maxChildHeight = Math.max(maxChildHeight, childGroup.size[1]);
            
            
            if (location.layout_direction === 'horizontal') {
                
                currentX += childGroup.size[0] + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
            } else {
                
                currentY += childGroup.size[1] + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
            }
        });
        
        
        if (location.layout_direction === 'horizontal' && location.children.length > 0) {
            totalWidth = currentX - initialX - SPACING_CONFIG.GROUP_VERTICAL_SPACING; 
        } else {
            totalWidth = maxWidth;
        }
        
        
        if (location.layout_direction === 'horizontal') {
            totalHeight = Math.max(totalHeight, maxChildHeight + SPACING_CONFIG.GROUP_TITLE_HEIGHT + 40);
        } else {
            totalHeight = currentY - startY;
        }

        return { width: totalWidth, height: totalHeight };
    }

    function createDeviceAndServiceNodes(graph, device, x, y, nodeMap, serviceNodes, pciCards) {
        const { interfaces, deviceIPs } = getJsonData();
        const deviceInterfaces = interfaces.filter(i => i.device_serial_number === device.serial_number);
        const deviceIPData = deviceIPs.find(d => d.device_serial_number === device.serial_number) || { ip_addresses: [] };

        const deviceNode = new DeviceNode();
        deviceNode.setDeviceData(device, deviceInterfaces);
        deviceNode.pos = [x, y];
        
        
        applySavedPosition(deviceNode, 'device', device.serial_number);
        
        
        enablePositionSaving(deviceNode, 'device', device.serial_number);
        
        graph.add(deviceNode);
        nodeMap.set(device.serial_number, deviceNode);

        let serviceY = y;
        (deviceIPData.ip_addresses || []).forEach(ip => {
            (ip.services || []).forEach(service => {
                const serviceNode = new ServiceNode();
                serviceNode.setServiceData(service, ip.ip_address, service.port_number);
                const serviceX = x + deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL;
                serviceNode.pos = [serviceX, serviceY];
                
                
                applySavedPosition(serviceNode, 'service', service.service_id);
                
                
                enablePositionSaving(serviceNode, 'service', service.service_id);
                
                graph.add(serviceNode);
                serviceNodes.push({ node: serviceNode, deviceSerial: device.serial_number, service: service });
                serviceY += SPACING_CONFIG.SERVICE_VERTICAL_SPACING;
            });
        });

        const deviceWidth = deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL + 200;
        const deviceHeight = Math.max(deviceNode.size[1], serviceY - y);

        
        const devicePciCards = pciCards.filter(card => card.device_serial_number === device.serial_number);
        devicePciCards.forEach((card, index) => {
            const pciCardNode = new PciCardNode();
            pciCardNode.setPciCardData(card);
            const pciX = x + deviceNode.size[0] + 300 + (index * 200);
            pciCardNode.pos = [pciX, y + (index * 80)];
            
            
            applySavedPosition(pciCardNode, 'pci_card', card.card_serial_number);
            
            
            enablePositionSaving(pciCardNode, 'pci_card', card.card_serial_number);
            
            graph.add(pciCardNode);
            nodeMap.set(card.card_serial_number, pciCardNode);
        });

        return { deviceNode, deviceWidth: Math.max(deviceWidth, devicePciCards.length > 0 ? deviceWidth + 300 + (devicePciCards.length * 200) : deviceWidth), deviceHeight };
    }

    function createPhysicalConnections(graph, connections, interfaces, nodeMap) {
        const wireIndices = new Map();
        const powerWireIndices = new Map(); 

        connections.forEach((connection, index) => {
            const sourceInterface = interfaces.find(i => i.interface_id === connection.source_interface_id);
            const destInterface = interfaces.find(i => i.interface_id === connection.destination_interface_id);

            if (!sourceInterface || !destInterface) return;

            const sourceDevice = nodeMap.get(sourceInterface.device_serial_number);
            const destDevice = nodeMap.get(destInterface.device_serial_number);
            if (!sourceDevice || !destDevice) return;

            const nodePairKey = `${sourceInterface.device_serial_number}-${destInterface.device_serial_number}`;
            const reverseKey = `${destInterface.device_serial_number}-${sourceInterface.device_serial_number}`;

            if (!wireIndices.has(nodePairKey) && !wireIndices.has(reverseKey)) {
                wireIndices.set(nodePairKey, 0);
            }

            const currentIndex = wireIndices.get(nodePairKey) || wireIndices.get(reverseKey) || 0;
            wireIndices.set(nodePairKey, currentIndex + 1);

            
            let powerIndex = null;
            if (sourceInterface.interface_type === 'Power') {
                const powerKey = `${connection.source_interface_id}-${connection.destination_interface_id}`;
                if (!powerWireIndices.has(powerKey)) {
                    powerWireIndices.set(powerKey, powerWireIndices.size);
                }
                powerIndex = powerWireIndices.get(powerKey);
                
            }

            const sourceSlot = sourceDevice.outputs.findIndex(o => {
                const outputName = o.name || '';
                if (sourceInterface.interface_type === 'Power') {
                    if (outputName === `${sourceInterface.label} (${sourceInterface.interface_type})`) return true;
                    if (sourceInterface.label.startsWith('outlet-') && outputName.includes(sourceInterface.label)) return true;
                    if (sourceInterface.label.startsWith('main-power-') && outputName.includes(sourceInterface.label)) return true;
                    return outputName.includes('power') && outputName !== 'power';
                }
                return outputName.includes(sourceInterface.label) || sourceInterface.label.includes(outputName.split(' ')[0]);
            });

            if (sourceSlot < 0) {
                if (sourceInterface.interface_type === 'Power' && sourceInterface.label.startsWith('outlet-')) {
                    sourceDevice.addOutput(`${sourceInterface.label} (${sourceInterface.interface_type})`, "interface");
                    const newSourceSlot = sourceDevice.outputs.length - 1;

                    let destSlot = destDevice.inputs.findIndex(i => {
                        const inputName = i.name || '';
                        if (inputName === `${destInterface.label} (${destInterface.interface_type})`) return true;
                        if (inputName.includes(destInterface.label) && inputName.includes(destInterface.interface_type)) return true;
                        return inputName.includes('power') && inputName !== 'power';
                    });
                    if (destSlot < 0) {
                        destDevice.addInput(`${destInterface.label} (${destInterface.interface_type})`, "interface");
                        destSlot = destDevice.inputs.length - 1;
                    }

                    const link = sourceDevice.connect(newSourceSlot, destDevice, destSlot);
                    if (link) {
                        const cableColor = getCableColor(connection.cable_type);
                        link.color = cableColor || CONNECTION_COLORS.POWER;

                        if (typeof LiteGraph !== 'undefined') {
                            link.start_dir = LiteGraph.LEFT;
                            link.end_dir = LiteGraph.LEFT;
                        } else {
                            link.start_dir = 3;
                            link.end_dir = 3;
                        }
                        link.isPowerConnection = true;
                        link.route_along_groups = true;
                        link.wireIndex = powerIndex !== null ? powerIndex : currentIndex;
                        if (powerIndex !== null) {
                            link.powerChannelIndex = powerIndex; 
                        }
                    }
                    return;
                }
                return;
            }

            let destSlot = destDevice.inputs.findIndex(i => {
                const inputName = i.name || '';
                if (destInterface.interface_type === 'Power') {
                    if (inputName === `${destInterface.label} (${destInterface.interface_type})`) return true;
                    if (inputName.includes(destInterface.label) && inputName.includes(destInterface.interface_type)) return true;
                    return inputName.includes('power') && inputName !== 'power';
                }
                return inputName.includes(destInterface.label) || destInterface.label.includes(inputName.split(' ')[0]);
            });

            if (destSlot < 0) {
                if (destInterface.interface_type === 'Power') {
                    destDevice.addInput(`${destInterface.label} (${destInterface.interface_type})`, "interface");
                    destSlot = destDevice.inputs.length - 1;
                } else {
                    destDevice.addInput(`${destInterface.label} (${destInterface.interface_type})`, "interface");
                    destSlot = destDevice.inputs.length - 1;
                }
            }

            const link = sourceDevice.connect(sourceSlot, destDevice, destSlot);
            if (link) {
                const cableColor = getCableColor(connection.cable_type);
                link.color = cableColor || (sourceInterface.interface_type === 'Power' ? CONNECTION_COLORS.POWER : CONNECTION_COLORS.INTERFACE_PHYSICAL);

                if (typeof LiteGraph !== 'undefined') {
                    if (sourceInterface.interface_type === 'Power') {
                        link.start_dir = LiteGraph.LEFT;
                        link.end_dir = LiteGraph.LEFT;
                        link.isPowerConnection = true;
                    } else {
                        link.start_dir = LiteGraph.RIGHT;
                        link.end_dir = LiteGraph.LEFT;
                    }
                } else {
                    if (sourceInterface.interface_type === 'Power') {
                        link.start_dir = 3;
                        link.end_dir = 3;
                        link.isPowerConnection = true;
                    } else {
                        link.start_dir = 4;
                        link.end_dir = 3;
                    }
                }
                link.route_along_groups = true;
                link.wireIndex = powerIndex !== null ? powerIndex : currentIndex;
                if (powerIndex !== null) {
                    link.powerChannelIndex = powerIndex; 
                }
                
                if (!link.isPowerConnection) {
                    link.networkChannelIndex = powerIndex !== null ? powerIndex : currentIndex;
                }
            }
        });
    }

    function createLogicalServiceConnections(nodeMap, serviceNodes) {
        const servicesByDevice = new Map();
        serviceNodes.forEach(sn => {
            if (!servicesByDevice.has(sn.deviceSerial)) servicesByDevice.set(sn.deviceSerial, []);
            servicesByDevice.get(sn.deviceSerial).push(sn);
        });

        servicesByDevice.forEach((services, deviceSerial) => {
            const deviceNode = nodeMap.get(deviceSerial);
            if (!deviceNode || !deviceNode.outputs.length) return;

            const device = getJsonData().devices.find(d => d.serial_number === deviceSerial);
            const isPDU = device && device.model_name && device.model_name.toLowerCase().includes('pdu');
            const isMainPower = device && device.model_name && device.model_name.toLowerCase().includes('main-power-source');

            if (isPDU || isMainPower) {
                return;
            }

            const availableInterfaces = isPDU
                ? deviceNode.outputs.filter(o => o.name && o.name.toLowerCase().includes('power'))
                : deviceNode.outputs.filter(o => o.name && !o.name.toLowerCase().includes('power'));

            if (!availableInterfaces.length) return;

            services.forEach((serviceData, index) => {
                const outputSlotObject = availableInterfaces[index % availableInterfaces.length];
                const actualOutputSlot = deviceNode.outputs.findIndex(o => o.name === outputSlotObject.name);

                if (actualOutputSlot !== -1) {
                    const link = deviceNode.connect(actualOutputSlot, serviceData.node, 0);
                    if (link) {
                        link.color = CONNECTION_COLORS.INTERFACE_LOGICAL;
                    }
                }
            });
        });
    }

    function createPciConnections(graph, pciCards, pciSlots, nodeMap) {
        pciCards.forEach(card => {
            const deviceNode = nodeMap.get(card.device_serial_number);
            const pciCardNode = nodeMap.get(card.card_serial_number);

            if (!deviceNode || !pciCardNode) return;

            
            const slot = pciSlots.find(s => s.slot_id === card.slot_id);
            if (!slot) return;

            
            const pciOutputIndex = deviceNode.outputs.findIndex(output => 
                output.name && output.name.toLowerCase().includes('pci')
            );

            if (pciOutputIndex === -1) {
                
                deviceNode.addOutput(`PCI Lane (${slot.wired_lane_count}x)`, "pci_lane");
                const newPciOutputIndex = deviceNode.outputs.length - 1;

                
                const link = deviceNode.connect(newPciOutputIndex, pciCardNode, 0);
                if (link) {
                    link.color = CONNECTION_COLORS.INTERFACE_LOGICAL;
                }
            } else {
                
                const link = deviceNode.connect(pciOutputIndex, pciCardNode, 0);
                if (link) {
                    link.color = CONNECTION_COLORS.INTERFACE_LOGICAL;
                }
            }

            if (card.type === 'Network') {
                const rj45Outputs = pciCardNode.outputs.filter(output => output.name && output.name.startsWith("RJ45"));
                
                rj45Outputs.forEach((rj45Output, index) => {
                    const allDeviceNodes = Array.from(nodeMap.values()).filter(node => 
                        node && node.title && typeof node.title === 'string' && (
                            node.title.toLowerCase().includes("switch") || 
                            node.title.toLowerCase().includes("cisco") || 
                            node.title.toLowerCase().includes("netgear") || 
                            node.title.includes("SW001234") || 
                            node.title.includes("SW002345") ||
                            
                            (node.deviceData && node.deviceData.model_name && 
                             node.deviceData.model_name.toLowerCase().includes("switch"))
                        )
                    );

                    if (allDeviceNodes.length > 0 && index < allDeviceNodes.length) {
                        const switchNode = allDeviceNodes[index];
                        
                        
                        const interfaceName = `eth${index + 1} (RJ45)`;
                        let interfaceInputIndex = switchNode.inputs.findIndex(input => 
                            input.name && input.name === interfaceName
                        );
                        
                        if (interfaceInputIndex === -1) {
                            switchNode.addInput(interfaceName, "interface");
                            interfaceInputIndex = switchNode.inputs.length - 1;
                        }
                        
                        const rj45OutputIndex = pciCardNode.outputs.findIndex(output => output === rj45Output);
                        
                        if (rj45OutputIndex !== -1 && interfaceInputIndex !== -1) {
                            const link = pciCardNode.connect(rj45OutputIndex, switchNode, interfaceInputIndex);
                            if (link) {
                                let cableType = 'cat6';
                                if (card.model_name && card.model_name.toLowerCase().includes('10gbe')) {
                                    cableType = 'cat6';
                                } else if (card.model_name && card.model_name.toLowerCase().includes('fiber')) {
                                    cableType = 'fiber';
                                }
                                
                                link.color = getCableColor(cableType);
                                link.type = "copper";
                                link.route_along_groups = true;
                                link.wireIndex = index;
                                
                                if (!link.isPowerConnection) {
                                    link.networkChannelIndex = index;
                                }
                            }
                        }
                    }
                });
            }
        });
    }

    function renderRoutedConnection(ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines) {
        if (!link || !link.route_along_groups) {
            return false;
        }

        ctx.save();

        const connectionColor = link.color || color || "#10b981";
        const routingPoints = calculateOrthogonalPath(a, b, start_dir, end_dir, link.wireIndex || 0, link);

        const isSelected = isLinkSelected(link);
        if (isSelected) {
            drawGlowingWire(ctx, routingPoints, connectionColor);
        }

        ctx.strokeStyle = connectionColor;
        ctx.lineWidth = 2; 
        ctx.setLineDash([8, 4]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        drawRoundedPath(ctx, routingPoints);

        if (flow) {
            drawConnectionArrow(ctx, routingPoints[routingPoints.length - 2], routingPoints[routingPoints.length - 1], connectionColor);
        }

        if (isSelected || !PARTICLE_CONFIG.SHOW_ONLY_ON_SELECTED) {
            createParticlesForLink(link, routingPoints);
            drawParticles(ctx, routingPoints, link);
        }

        ctx.restore();

        return true;
    }

    function isLinkSelected(link) {
        if (!link || !window.canvasInstance) return false;

        const canvas = window.canvasInstance;

        if (!link.origin_id || !link.target_id) return false;

        const originNode = canvas.graph.getNodeById(link.origin_id);
        const targetNode = canvas.graph.getNodeById(link.target_id);

        if (!originNode || !targetNode) return false;

        return originNode.is_selected || targetNode.is_selected;
    }

    function createParticlesForLink(link, routingPoints) {
        if (!link || !routingPoints || routingPoints.length < 2) return;

        const linkId = `${link.origin_id}-${link.target_id}`;
        if (!activeParticles.has(linkId)) {
            activeParticles.set(linkId, []);
        }

        const particles = activeParticles.get(linkId);
        const pathLength = calculatePathLength(routingPoints);

        if (particles.length === 0 || pathLength / particles.length > PARTICLE_CONFIG.SPACING) {
            particles.push({
                position: 0,
                speed: PARTICLE_CONFIG.SPEED,
                pathLength: pathLength,
                routingPoints: routingPoints,
                trail: []
            });
        }
    }

    function updateParticles(deltaTime) {
        activeParticles.forEach((particles, linkId) => {
            particles.forEach((particle, index) => {
                particle.position += particle.speed;

                if (particle.position >= particle.pathLength) {
                    particle.position = 0;
                    particle.trail = [];
                }

                const currentPos = getPositionAlongPath(particle.routingPoints, particle.position / particle.pathLength);
                particle.trail.push(currentPos);

                if (particle.trail.length > PARTICLE_CONFIG.TRAIL_LENGTH) {
                    particle.trail.shift();
                }
            });
        });
    }

    function calculatePathLength(points) {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    function getPositionAlongPath(points, t) {
        const targetLength = t * calculatePathLength(points);
        let currentLength = 0;

        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);

            if (currentLength + segmentLength >= targetLength) {
                const segmentT = (targetLength - currentLength) / segmentLength;
                return {
                    x: points[i - 1].x + dx * segmentT,
                    y: points[i - 1].y + dy * segmentT
                };
            }

            currentLength += segmentLength;
        }

        return points[points.length - 1];
    }

    function drawParticles(ctx, routingPoints, link) {
        if (!routingPoints || routingPoints.length < 2) return;

        const linkId = `${link.origin_id}-${link.target_id}`;
        const particles = activeParticles.get(linkId);

        if (!particles) return;

        particles.forEach(particle => {
            if (particle.trail.length > 1) {
                ctx.save();

                ctx.strokeStyle = PARTICLE_CONFIG.COLOR;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.globalAlpha = 0.8;

                ctx.beginPath();
                ctx.moveTo(particle.trail[0].x, particle.trail[0].y);

                for (let i = 1; i < particle.trail.length; i++) {
                    const alpha = i / particle.trail.length;
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                }

                ctx.stroke();

                const currentPos = particle.trail[particle.trail.length - 1];
                ctx.globalAlpha = 1;
                ctx.fillStyle = PARTICLE_CONFIG.COLOR;
                ctx.beginPath();
                ctx.arc(currentPos.x, currentPos.y, PARTICLE_CONFIG.SIZE, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        });
    }

    function cleanupUnselectedParticles() {
        const selectedLinkIds = new Set();

        if (window.canvasInstance && window.canvasInstance.graph && window.canvasInstance.graph._nodes) {
            const canvas = window.canvasInstance;
            const allLinks = [];

            canvas.graph._nodes.forEach(node => {
                if (node && node.outputs) {
                    node.outputs.forEach(output => {
                        if (output && output.links) {
                            output.links.forEach(linkId => {
                                const link = canvas.graph.links[linkId];
                                if (link && isLinkSelected(link)) {
                                    selectedLinkIds.add(`${link.origin_id}-${link.target_id}`);
                                }
                            });
                        }
                    });
                }
            });
        }

        for (const [linkId, particles] of activeParticles) {
            if (!selectedLinkIds.has(linkId)) {
                activeParticles.delete(linkId);
            }
        }
    }

    function drawGlowingWire(ctx, points, color) {
        ctx.save();

        ctx.strokeStyle = color;
        ctx.lineWidth = 6; 
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        drawRoundedPath(ctx, points);

        ctx.restore();
    }

    function drawRoundedPath(ctx, points) {
        if (points.length < 2) return;

        const cornerRadius = WIRE_ROUTING_CONFIG.CORNER_RADIUS;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            if (len1 < cornerRadius * 2 || len2 < cornerRadius * 2) {
                ctx.lineTo(curr.x, curr.y);
                continue;
            }

            const ux1 = dx1 / len1;
            const uy1 = dy1 / len1;
            const ux2 = dx2 / len2;
            const uy2 = dy2 / len2;

            const cornerX = curr.x - ux1 * cornerRadius;
            const cornerY = curr.y - uy1 * cornerRadius;
            const nextX = curr.x + ux2 * cornerRadius;
            const nextY = curr.y + uy2 * cornerRadius;

            ctx.lineTo(cornerX, cornerY);

            const cpX = curr.x;
            const cpY = curr.y;
            ctx.quadraticCurveTo(cpX, cpY, nextX, nextY);
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
    }

    function calculateOrthogonalPath(startPos, endPos, startDir, endDir, wireIndex = 0, link = null) {
        const points = [];
        const startX = startPos[0];
        const startY = startPos[1];
        const endX = endPos[0];
        const endY = endPos[1];

        points.push({ x: startX, y: startY });

        const deltaX = endX - startX;
        const deltaY = endY - startY;

        const isPowerConnection = link && link.isPowerConnection;
        const isNetworkConnection = link && !link.isPowerConnection && link.wireType !== 'power';

        const wireOffset = 0;
        const wireDirection = wireIndex % 2 === 0 ? 1 : -1;

        
        let spacingValue = WIRE_ROUTING_CONFIG.WIRE_SPACING;
        if (isPowerConnection) {
            spacingValue = WIRE_ROUTING_CONFIG.POWER_WIRE_SPACING;
        } else if (startDir === (LiteGraph?.LEFT || 3)) {
            spacingValue = WIRE_ROUTING_CONFIG.LEFT_WIRE_SPACING;
        }

        const channelOffset = wireIndex * spacingValue;
        const totalOffset = Math.max((wireOffset * wireDirection) + channelOffset, wireIndex * 4); 

        if (Math.abs(deltaX) > WIRE_ROUTING_CONFIG.MIN_DISTRIBUTED_DISTANCE) {
            if (WIRE_ROUTING_CONFIG.ENABLE_CHANNEL_ROUTING) {
                
                if (isPowerConnection) {
                    
                    const channelIndex = link.powerChannelIndex || 0;
                    const channelOffset = channelIndex * WIRE_ROUTING_CONFIG.CHANNEL_SPACING;
                    const routingX = WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X + channelOffset;
                    
                    points.push({ x: routingX, y: startY });
                    points.push({ x: routingX, y: endY });
                    points.push({ x: endX, y: endY });
                } else {
                    
                    const channelIndex = link.networkChannelIndex || wireIndex;
                    const channelOffset = channelIndex * WIRE_ROUTING_CONFIG.CHANNEL_SPACING;
                    
                    
                    const shouldRouteLeft = (startDir === (LiteGraph?.LEFT || 3) && endDir === (LiteGraph?.LEFT || 3)) ||
                                           (startDir === (LiteGraph?.RIGHT || 4) && endDir === (LiteGraph?.LEFT || 3) && Math.abs(deltaX) < 200);

                    if (shouldRouteLeft) {
                        
                        const routingX = WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X + channelOffset;
                        points.push({ x: routingX, y: startY });
                        points.push({ x: routingX, y: endY });
                        points.push({ x: endX, y: endY });
                    } else {
                        
                        const routingX = WIRE_ROUTING_CONFIG.RIGHT_CHANNEL_X + channelOffset + wireOffset;
                        points.push({ x: routingX, y: startY });
                        points.push({ x: routingX, y: endY });
                        points.push({ x: endX, y: endY });
                    }
                }
            } else {
                
                if (isPowerConnection) {
                    
                    const powerChannelIndex = link.powerChannelIndex || 0;
                    const routingX = startX - WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT - WIRE_ROUTING_CONFIG.POWER_OFFSET_LEFT - (powerChannelIndex * WIRE_ROUTING_CONFIG.POWER_CHANNEL_OFFSET);

                    points.push({ x: routingX, y: startY });
                    points.push({ x: routingX, y: endY });  
                    points.push({ x: endX, y: endY });      
                } else {
                    
                    const networkChannelIndex = link.networkChannelIndex || wireIndex;

                    
                    const shouldRouteLeft = (startDir === (LiteGraph?.LEFT || 3) && endDir === (LiteGraph?.LEFT || 3)) ||
                                           (startDir === (LiteGraph?.RIGHT || 4) && endDir === (LiteGraph?.LEFT || 3) && Math.abs(deltaX) < 200);

                    if (shouldRouteLeft) {
                        
                        const routingX = startX - WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT - (networkChannelIndex * WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET);
                        points.push({ x: routingX, y: startY });
                        points.push({ x: routingX, y: endY });
                        points.push({ x: endX, y: endY });
                    } else {
                        
                        const routingX = startX + WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_RIGHT + (networkChannelIndex * WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET) + wireOffset;
                        points.push({ x: routingX, y: startY });
                        points.push({ x: routingX, y: endY });
                        points.push({ x: endX, y: endY });
                    }
                }
            }
        } else {
            if (Math.abs(deltaY) > WIRE_ROUTING_CONFIG.MIN_VERTICAL_DISTANCE) {
                if (WIRE_ROUTING_CONFIG.ENABLE_CHANNEL_ROUTING) {
                    
                    if (isPowerConnection) {
                        
                        const channelIndex = link.powerChannelIndex || 0;
                        const channelOffset = channelIndex * WIRE_ROUTING_CONFIG.CHANNEL_SPACING;
                        const routingX = WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X + channelOffset;
                        
                        points.push({ x: routingX, y: startY });
                        points.push({ x: routingX, y: endY });
                        points.push({ x: endX, y: endY });
                    } else {
                        
                        const channelIndex = link.networkChannelIndex || wireIndex;
                        const channelOffset = channelIndex * WIRE_ROUTING_CONFIG.CHANNEL_SPACING;
                        
                        
                        const shouldRouteLeft = (startDir === (LiteGraph?.LEFT || 3) && endDir === (LiteGraph?.LEFT || 3)) ||
                                               (startDir === (LiteGraph?.RIGHT || 4) && endDir === (LiteGraph?.LEFT || 3) && Math.abs(deltaX) < 200);

                        if (shouldRouteLeft) {
                            
                            const routingX = WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X + channelOffset;
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        } else {
                            
                            const routingX = WIRE_ROUTING_CONFIG.RIGHT_CHANNEL_X + channelOffset + wireOffset;
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        }
                    }
                } else {
                    
                    if (isPowerConnection) {
                        
                        const powerChannelIndex = link.powerChannelIndex || 0;
                        const routingX = startX - WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT - WIRE_ROUTING_CONFIG.POWER_OFFSET_LEFT - (powerChannelIndex * WIRE_ROUTING_CONFIG.POWER_CHANNEL_OFFSET);

                        points.push({ x: routingX, y: startY });
                        points.push({ x: routingX, y: endY });  
                        points.push({ x: endX, y: endY });      
                    } else {
                        
                        const networkChannelIndex = link.networkChannelIndex || wireIndex;

                        
                        const shouldRouteLeft = (startDir === (LiteGraph?.LEFT || 3) && endDir === (LiteGraph?.LEFT || 3)) ||
                                               (startDir === (LiteGraph?.RIGHT || 4) && endDir === (LiteGraph?.LEFT || 3) && Math.abs(deltaX) < 200);

                        if (shouldRouteLeft) {
                            
                            const routingX = startX - WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT - (networkChannelIndex * WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET);
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        } else {
                            
                            const routingX = startX + WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_RIGHT + (networkChannelIndex * WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET) + wireOffset;
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        }
                    }
                }
            } else {
                if (WIRE_ROUTING_CONFIG.ENABLE_CHANNEL_ROUTING) {
                    
                    if (isPowerConnection) {
                        
                        const channelIndex = link.powerChannelIndex || 0;
                        const channelOffset = channelIndex * WIRE_ROUTING_CONFIG.CHANNEL_SPACING;
                        const routingX = WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X + channelOffset;
                        
                        points.push({ x: routingX, y: startY });
                        points.push({ x: routingX, y: endY });
                        points.push({ x: endX, y: endY });
                    } else {
                        
                        const channelIndex = link.networkChannelIndex || wireIndex;
                        const channelOffset = channelIndex * WIRE_ROUTING_CONFIG.CHANNEL_SPACING;
                        
                        
                        const shouldRouteLeft = (startDir === (LiteGraph?.LEFT || 3) && endDir === (LiteGraph?.LEFT || 3)) ||
                                               (startDir === (LiteGraph?.RIGHT || 4) && endDir === (LiteGraph?.LEFT || 3) && Math.abs(deltaX) < 200);

                        if (shouldRouteLeft) {
                            
                            const routingX = WIRE_ROUTING_CONFIG.LEFT_CHANNEL_X + channelOffset;
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        } else {
                            
                            const routingX = WIRE_ROUTING_CONFIG.RIGHT_CHANNEL_X + channelOffset + wireOffset;
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        }
                    }
                    } else {
                        
                        if (isPowerConnection) {
                            
                            const powerChannelIndex = link.powerChannelIndex || 0;
                            const routingX = startX - WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT - WIRE_ROUTING_CONFIG.POWER_OFFSET_LEFT - (powerChannelIndex * WIRE_ROUTING_CONFIG.POWER_CHANNEL_OFFSET);

                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });  
                            points.push({ x: endX, y: endY });      
                        } else {
                            
                            const networkChannelIndex = link.networkChannelIndex || wireIndex;                        
                        const shouldRouteLeft = (startDir === (LiteGraph?.LEFT || 3) && endDir === (LiteGraph?.LEFT || 3)) ||
                                               (startDir === (LiteGraph?.RIGHT || 4) && endDir === (LiteGraph?.LEFT || 3) && Math.abs(deltaX) < 200);

                        if (shouldRouteLeft) {
                            
                            const routingX = startX - WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_LEFT - (networkChannelIndex * WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET);
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        } else {
                            
                            const routingX = startX + WIRE_ROUTING_CONFIG.NON_POWER_OFFSET_RIGHT + (networkChannelIndex * WIRE_ROUTING_CONFIG.NETWORK_CHANNEL_OFFSET) + wireOffset;
                            points.push({ x: routingX, y: startY });
                            points.push({ x: routingX, y: endY });
                            points.push({ x: endX, y: endY });
                        }
                    }
                }
            }
        }

        points.push({ x: endX, y: endY });

        return points;
    }

    function drawConnectionArrow(ctx, fromPoint, toPoint, color) {
        const headLength = 12;
        const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);

        ctx.strokeStyle = color || "#ffffff";
        ctx.fillStyle = color || "#ffffff";
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(toPoint.x, toPoint.y);
        ctx.lineTo(
            toPoint.x - headLength * Math.cos(angle - Math.PI / 6),
            toPoint.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toPoint.x, toPoint.y);
        ctx.lineTo(
            toPoint.x - headLength * Math.cos(angle + Math.PI / 6),
            toPoint.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    function isNodeInGroup(node, group) {
        if (!node || !group) return false;

        const nodeX = node.pos[0];
        const nodeY = node.pos[1];
        const nodeWidth = node.size[0];
        const nodeHeight = node.size[1];

        const groupX = group.pos[0];
        const groupY = group.pos[1];
        const groupWidth = group.size ? group.size[0] : 200;
        const groupHeight = group.size ? group.size[1] : 100;

        return nodeX >= groupX && nodeX + nodeWidth <= groupX + groupWidth &&
               nodeY >= groupY && nodeY + nodeHeight <= groupY + groupHeight;
    }

    function calculateGroupEdgeRouting(startPos, endPos, startGroup, endGroup, startDir, endDir) {
        const points = [];

        points.push({ x: startPos[0], y: startPos[1] });

        const startExit = getGroupEdgePoint(startPos, startGroup, startDir);
        points.push(startExit);

        const intermediatePoints = calculateIntermediateRouting(startExit, endPos, startGroup, endGroup);
        points.push(...intermediatePoints);

        const endEntry = getGroupEdgePoint(endPos, endGroup, endDir);
        points.push(endEntry);

        points.push({ x: endPos[0], y: endPos[1] });

        return points;
    }

    function getGroupEdgePoint(pos, group, direction) {
        const groupX = group.pos[0];
        const groupY = group.pos[1];
        const groupWidth = group.size ? group.size[0] : 200;
        const groupHeight = group.size ? group.size[1] : 100;

        switch (direction) {
            case LiteGraph.RIGHT:
                return { x: groupX + groupWidth, y: pos[1] };
            case LiteGraph.LEFT:
                return { x: groupX, y: pos[1] };
            case LiteGraph.DOWN:
                return { x: pos[0], y: groupY + groupHeight };
            case LiteGraph.UP:
                return { x: pos[0], y: groupY };
            default:
                return { x: pos[0], y: pos[1] };
        }
    }

    function calculateIntermediateRouting(startPoint, endPoint, startGroup, endGroup) {
        const points = [];

        const midY = (startPoint.y + endPoint.y) / 2;

        if (Math.abs(startGroup.pos[1] - endGroup.pos[1]) > 50) {
            points.push({ x: startPoint.x, y: midY });
            points.push({ x: endPoint.x, y: midY });
        } else {
            points.push({ x: (startPoint.x + endPoint.x) / 2, y: startPoint.y });
            points.push({ x: (startPoint.x + endPoint.x) / 2, y: endPoint.y });
        }

        return points;
    }

    function drawConnectionArrow(ctx, fromPoint, toPoint, color) {
        const headLength = 10;
        const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);

        ctx.strokeStyle = color || "#ffffff";
        ctx.fillStyle = color || "#ffffff";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(toPoint.x, toPoint.y);
        ctx.lineTo(
            toPoint.x - headLength * Math.cos(angle - Math.PI / 6),
            toPoint.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toPoint.x, toPoint.y);
        ctx.lineTo(
            toPoint.x - headLength * Math.cos(angle + Math.PI / 6),
            toPoint.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    function getJsonData() {
        return {
            locations: window.locationsJson || [],
            devices: window.devicesJson || [],
            interfaces: window.interfacesJson || [],
            connections: window.connectionsJson || [],
            deviceIPs: window.deviceIPsJson || [],
            services: window.servicesJson || [],
            pciSlots: window.pciSlotsJson || [],
            pciCards: window.pciCardsJson || []
        };
    }

    function getCableColor(cableType) {
        switch (cableType?.toLowerCase()) {
            case 'cat6':
                return CONNECTION_COLORS.CABLE_CAT6;
            case 'cat5e':
                return CONNECTION_COLORS.CABLE_CAT5E;
            case 'fiber':
            case 'fiber optic':
                return CONNECTION_COLORS.CABLE_FIBER;
            case 'copper':
                return CONNECTION_COLORS.CABLE_COPPER;
            case 'coaxial':
            case 'coax':
                return CONNECTION_COLORS.CABLE_COAXIAL;
            case 'power':
                return CONNECTION_COLORS.POWER;
            default:
                return CONNECTION_COLORS.INTERFACE_PHYSICAL;
        }
    }

    function buildLocationHierarchy(locations, devices) {
        const locationMap = new Map();
        locations.forEach(loc => locationMap.set(loc.location_id, { ...loc, children: [], devices: devices.filter(d => d.location_id === loc.location_id) }));
        
        const rootLocations = [];
        locations.forEach(loc => {
            if (loc.parent_location_id) {
                locationMap.get(loc.parent_location_id)?.children.push(locationMap.get(loc.location_id));
            } else {
                rootLocations.push(locationMap.get(loc.location_id));
            }
        });
        return { rootLocations };
    }

    function createGroup(graph, title, pos, color) {
        const group = new window.LGraphGroup();
        group.title = title;
        group.pos = pos;
        group.color = color;
        graph._groups.push(group);
        return group;
    }

    function resizeCanvas(canvas) {
        const canvasElement = document.getElementById('mycanvas');
        if (!canvasElement || !canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvasElement.style.width = `${window.innerWidth}px`;
        canvasElement.style.height = `${window.innerHeight}px`;
        canvasElement.width = window.innerWidth * dpr;
        canvasElement.height = window.innerHeight * dpr;
        canvasElement.getContext('2d').scale(dpr, dpr);
        canvas.resize();
        canvasElement.tabIndex = 0;
        canvasElement.style.outline = 'none';
    }

    function showKeyboardControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'keyboard-controls-info';
        controlsDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(45, 55, 72, 0.9);
            color: #FFFFFF;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            border: 1px solid #4a5568;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 200px;
        `;

        controlsDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: #e4870eff;">Navigation</div>
            <div style="margin-bottom: 4px;"><kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">WASD</kbd> or <kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">↑←↓→</kbd></div>
            <div style="margin-bottom: 8px; color: #a0aec0; font-size: 11px;">Hold for smooth panning</div>
            <div style="font-weight: bold; margin-bottom: 4px; color: #e4870eff;">Zoom</div>
            <div style="margin-bottom: 4px;"><kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">+</kbd> <kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">-</kbd></div>
            <div style="color: #a0aec0; font-size: 11px;">Zoom in/out</div>
            <div style="margin-top: 12px; border-top: 1px solid #4a5568; padding-top: 8px;">
                <div style="margin-bottom: 4px;"><kbd style="background: #2d3748; padding: 2px 6px; border-radius: 3px; font-size: 11px;">C</kbd></div>
                <div style="color: #a0aec0; font-size: 11px; margin-bottom: 8px;">Toggle wire config</div>
                <button id="wire-config-toggle" style="
                    width: 100%;
                    padding: 6px 8px;
                    background: #e4870eff;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    margin-bottom: 4px;
                ">⚙️ Wire Config</button>
            </div>
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 4px;
            right: 8px;
            background: none;
            border: none;
            color: #a0aec0;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeButton.onclick = () => controlsDiv.remove();
        controlsDiv.appendChild(closeButton);

        
        setTimeout(() => {
            const wireConfigBtn = document.getElementById('wire-config-toggle');
            if (wireConfigBtn) {
                wireConfigBtn.onclick = createWireConfigPanel;
            }
        }, 100);

        document.body.appendChild(controlsDiv);

        setTimeout(() => {
            if (controlsDiv.parentNode) {
                controlsDiv.remove();
            }
        }, 10000);
    }

    document.addEventListener('DOMContentLoaded', initialize);

    function initializeCustomRendering(canvas) {
        if (!canvas) {
            return;
        }

        const originalRenderLink = canvas.renderLink;

        canvas.renderLink = function(ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines) {
            if (link && link.route_along_groups) {
                const customRendered = renderRoutedConnection(ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines);
                if (customRendered) {
                    return;
                }
            }

            originalRenderLink.call(this, ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines);
        };
    }

    function startParticleAnimation() {
        let lastTime = 0;

        function animate(currentTime) {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            if (deltaTime < 50) {
                updateParticles(deltaTime / 16.67);
                if (PARTICLE_CONFIG.SHOW_ONLY_ON_SELECTED) {
                    cleanupUnselectedParticles();
                }
            }

            if (window.canvasInstance) {
                window.canvasInstance.setDirty(true, true);
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

})();
