(function() {
    // --- CONFIGURATION ---
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
        // Cable type colors
        CABLE_CAT6: "#8b5cf6",      // Purple
        CABLE_CAT5E: "#06b6d4",     // Cyan
        CABLE_FIBER: "#f59e0b",     // Amber
        CABLE_COPPER: "#10b981",    // Green
        CABLE_COAXIAL: "#ef4444",   // Red
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
            this.title = deviceData.display_name;
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
    }

    // Set static title colors for DeviceNode
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
    }

    // Set static title colors for ServiceNode
    ServiceNode.title_color = NODE_TITLE_BG_COLOR;
    ServiceNode.title_text_color = NODE_TITLE_TEXT_COLOR;

    // --- INITIALIZATION ---
    function initialize() {
        if (typeof window.LiteGraph === 'undefined') {
            showError('LiteGraph library not loaded. Please check your setup.');
            return;
        }

        window.LiteGraph.registerNodeType("network/device", DeviceNode);
        window.LiteGraph.registerNodeType("network/service", ServiceNode);

        const graph = new window.LiteGraph.LGraph();
        const canvas = new window.LGraphCanvas("#mycanvas", graph);
        
        window.canvasInstance = canvas;
        
        setupCanvas(canvas);
        setupGlobalEventListeners();

        createNetworkVisualization(graph);
        graph.start();
        
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
            console.error('Canvas element not found!');
            return;
        }

        canvasElement.tabIndex = 0;
        canvasElement.style.outline = 'none';

        const keysPressed = new Set();
        let animationFrameId = null;

        const handleKeyDown = (event) => {
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

            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                event.preventDefault();
            }

            if (!animationFrameId) {
                startSmoothPanning();
            }
        };

        const handleKeyUp = (event) => {
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

    // --- CORE LOGIC ---
    function createNetworkVisualization(graph) {
        const { locations, devices, interfaces, connections, deviceIPs } = getJsonData();
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
            const contentDims = processLocation(graph, rootLoc, 70, groupContentY, rootGroup, nodeMap, serviceNodes);
            
            rootGroup.size[0] = Math.max(800, contentDims.width + SPACING_CONFIG.GROUP_PADDING);
            rootGroup.size[1] = Math.max(200, contentDims.height + SPACING_CONFIG.GROUP_TITLE_HEIGHT + SPACING_CONFIG.GROUP_PADDING);
            currentY += rootGroup.size[1] + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
        });

        createPhysicalConnections(graph, connections, interfaces, nodeMap);
        createLogicalServiceConnections(nodeMap, serviceNodes);
    }

    function processLocation(graph, location, startX, startY, parentGroup, nodeMap, serviceNodes) {
        let currentX = startX;
        let currentY = startY + 20; // Additional offset for nodes within groups
        let maxWidth = 0;
        let totalHeight = 0;

        location.devices.forEach(device => {
            const { deviceNode, deviceWidth, deviceHeight } = createDeviceAndServiceNodes(graph, device, currentX, currentY, nodeMap, serviceNodes);
            maxWidth = Math.max(maxWidth, deviceWidth);
            currentY += deviceHeight + SPACING_CONFIG.DEVICE_ROW_SPACING;
        });
        totalHeight = currentY - startY;

        location.children.forEach(childLoc => {
            const childGroup = createGroup(graph, childLoc.name, [currentX, currentY], GROUP_CHILD_COLOR);
            const childGroupContentY = currentY + SPACING_CONFIG.GROUP_TITLE_HEIGHT;
            const childDims = processLocation(graph, childLoc, currentX + 20, childGroupContentY, childGroup, nodeMap, serviceNodes);
            
            childGroup.size[0] = Math.max(400, childDims.width + 40);
            childGroup.size[1] = Math.max(100, childDims.height + SPACING_CONFIG.GROUP_TITLE_HEIGHT + 40);
            
            maxWidth = Math.max(maxWidth, childGroup.size[0]);
            currentY += childGroup.size[1] + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
        });
        totalHeight = currentY - startY;

        return { width: maxWidth, height: totalHeight };
    }

    function createDeviceAndServiceNodes(graph, device, x, y, nodeMap, serviceNodes) {
        const { interfaces, deviceIPs } = getJsonData();
        const deviceInterfaces = interfaces.filter(i => i.device_serial_number === device.serial_number);
        const deviceIPData = deviceIPs.find(d => d.device_serial_number === device.serial_number) || { ip_addresses: [] };

        const deviceNode = new DeviceNode();
        deviceNode.setDeviceData(device, deviceInterfaces);
        deviceNode.pos = [x, y];
        graph.add(deviceNode);
        nodeMap.set(device.serial_number, deviceNode);

        let serviceY = y;
        (deviceIPData.ip_addresses || []).forEach(ip => {
            (ip.services || []).forEach(service => {
                const serviceNode = new ServiceNode();
                serviceNode.setServiceData(service, ip.ip_address, service.port_number);
                const serviceX = x + deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL;
                serviceNode.pos = [serviceX, serviceY];
                graph.add(serviceNode);
                serviceNodes.push({ node: serviceNode, deviceSerial: device.serial_number, service: service });
                serviceY += SPACING_CONFIG.SERVICE_VERTICAL_SPACING;
            });
        });

        const deviceWidth = deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL + 200;
        const deviceHeight = Math.max(deviceNode.size[1], serviceY - y);
        return { deviceNode, deviceWidth, deviceHeight };
    }

    function createPhysicalConnections(graph, connections, interfaces, nodeMap) {
        connections.forEach((connection, index) => {
            const sourceInterface = interfaces.find(i => i.interface_id === connection.source_interface_id);
            const destInterface = interfaces.find(i => i.interface_id === connection.destination_interface_id);

            if (!sourceInterface || !destInterface) return;

            const sourceDevice = nodeMap.get(sourceInterface.device_serial_number);
            const destDevice = nodeMap.get(destInterface.device_serial_number);
            if (!sourceDevice || !destDevice) return;

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

    // --- HELPERS ---
    function getJsonData() {
        return {
            locations: window.locationsJson || [],
            devices: window.devicesJson || [],
            interfaces: window.interfacesJson || [],
            connections: window.connectionsJson || [],
            deviceIPs: window.deviceIPsJson || [],
            services: window.servicesJson || []
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
                return CONNECTION_COLORS.INTERFACE_PHYSICAL; // Default fallback
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

        document.body.appendChild(controlsDiv);

        setTimeout(() => {
            if (controlsDiv.parentNode) {
                controlsDiv.remove();
            }
        }, 10000);
    }

    // --- START ---
    document.addEventListener('DOMContentLoaded', initialize);

})();
