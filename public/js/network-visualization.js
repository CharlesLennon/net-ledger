(function() {
    // --- CONFIGURATION ---
    const NODE_TEXT_COLOR = "#FFFFFF";
    const NODE_BG_COLOR = "#2d3748";
    const NODE_TITLE_COLOR = "#FFFFFF";
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
        SERVICE_NODE_MIN_HEIGHT: 35,
        SERVICE_HEIGHT_PER_INPUT: 10,
    };

    // --- CLASS DEFINITIONS ---
    class DeviceNode extends window.LGraphNode {
        constructor() {
            super();
            this.size = [200, 100];
            this.color = NODE_TEXT_COLOR;
            this.bgcolor = NODE_BG_COLOR;
            this.title_color = NODE_TITLE_COLOR;
            this.resizable = false;
            this.addInput("power", "power");
        }

        setDeviceData(deviceData, deviceInterfaces) {
            this.title = deviceData.display_name;
            const textWidth = this.title.length * 8;
            this.size[0] = Math.max(200, textWidth + 40);
            this.size[1] = 60;

            deviceInterfaces.forEach(interfaceData => {
                if (interfaceData.interface_type !== 'Power') {
                    const outputName = `${interfaceData.label} (${interfaceData.interface_type})`;
                    this.addOutput(outputName, "interface");
                }
            });
        }
    }

    class ServiceNode extends window.LGraphNode {
        constructor() {
            super();
            this.size = [180, 100];
            this.color = NODE_TEXT_COLOR;
            this.bgcolor = NODE_BG_COLOR;
            this.title_color = NODE_TITLE_COLOR;
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
        setupCanvas(canvas);
        setupGlobalEventListeners();

        createNetworkVisualization(graph);
        graph.start();
        
        setTimeout(() => canvas.setDirty(true, true), 500);
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
        window.addEventListener('resize', () => resizeCanvas(window.LGraphCanvas.instance));
        const canvasElement = document.getElementById('mycanvas');
        if (canvasElement) {
            canvasElement.addEventListener('click', () => canvasElement.focus());
            canvasElement.focus();
        }
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
            const contentDims = processLocation(graph, rootLoc, 70, currentY + 50, rootGroup, nodeMap, serviceNodes);
            
            rootGroup.size[0] = Math.max(800, contentDims.width + SPACING_CONFIG.GROUP_PADDING);
            rootGroup.size[1] = Math.max(200, contentDims.height + 100);
            currentY += rootGroup.size[1] + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
        });

        createPhysicalConnections(graph, connections, interfaces, nodeMap);
        createLogicalServiceConnections(nodeMap, serviceNodes);
    }

    function processLocation(graph, location, startX, startY, parentGroup, nodeMap, serviceNodes) {
        let currentX = startX;
        let currentY = startY;
        let maxWidth = 0;
        let totalHeight = 0;

        // Process devices in this location. Group association is handled by position, not properties.
        location.devices.forEach(device => {
            const { deviceNode, deviceWidth, deviceHeight } = createDeviceAndServiceNodes(graph, device, currentX, currentY, nodeMap, serviceNodes);
            maxWidth = Math.max(maxWidth, deviceWidth);
            currentY += deviceHeight + SPACING_CONFIG.DEVICE_ROW_SPACING;
        });
        totalHeight = currentY - startY;

        // Process child locations recursively
        location.children.forEach(childLoc => {
            const childGroup = createGroup(graph, childLoc.name, [currentX, currentY + 20], GROUP_CHILD_COLOR);
            
            const childDims = processLocation(graph, childLoc, currentX + 20, currentY + 50, childGroup, nodeMap, serviceNodes);
            
            childGroup.size[0] = Math.max(400, childDims.width + 40);
            childGroup.size[1] = Math.max(100, childDims.height + 60);
            
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
        connections.forEach(connection => {
            const sourceInterface = interfaces.find(i => i.interface_id === connection.source_interface_id);
            const destInterface = interfaces.find(i => i.interface_id === connection.destination_interface_id);
            if (!sourceInterface || !destInterface) return;

            const sourceDevice = nodeMap.get(sourceInterface.device_serial_number);
            const destDevice = nodeMap.get(destInterface.device_serial_number);
            if (!sourceDevice || !destDevice) return;

            const sourceSlot = sourceDevice.outputs.findIndex(o => o.name.includes(sourceInterface.label));
            if (sourceSlot < 0) return;

            let destSlot = destDevice.inputs.findIndex(i => i.name.includes(destInterface.label));
            if (destSlot < 0) {
                destDevice.addInput(`${destInterface.label} (${destInterface.interface_type})`, "interface");
                destSlot = destDevice.inputs.length - 1;
            }

            const link = sourceDevice.connect(sourceSlot, destDevice, destSlot);
            if (link) {
                // Use cable type to determine color, fallback to interface type
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

            const availableInterfaces = deviceNode.outputs.filter(o => o.name && !o.name.toLowerCase().includes('power'));
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
        graph._groups.push(group); // Add to the graph's internal groups array, not the nodes list.
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

    function showError(message) {
        console.error(message);
        const canvas = document.getElementById('mycanvas');
        if (canvas) canvas.style.display = 'none';
        document.body.innerHTML += `<div style="color: red; font-size: 24px; text-align: center; margin-top: 50px;">${message}</div>`;
    }

    // --- START ---
    document.addEventListener('DOMContentLoaded', initialize);

})();
