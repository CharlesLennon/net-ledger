@php
    // Convert PHP arrays to JSON for JavaScript
    $locationsJson = json_encode($locations);
    $devicesJson = json_encode($devices);
    $interfacesJson = json_encode($interfaces);
    $connectionsJson = json_encode($connections);
    $deviceIPsJson = json_encode($deviceIPs);
    $servicesJson = json_encode($services);
@endphp

<div class="w-full h-screen bg-gray-900">
    <canvas id="mycanvas" width="1024" height="720" style="border: 1px solid black;"></canvas>
</div>

<script type="module">
    import { LiteGraph, LGraphCanvas, LGraphNode, LGraphGroup } from "https://cdn.skypack.dev/litegraph.js";
    
    // Initialize LiteGraph
    const graph = new LiteGraph.LGraph();
    const canvas = new LGraphCanvas("#mycanvas", graph);
    canvas.background_image = null;
    
    // Parse data from PHP
    const locations = @json($locations);
    const devices = @json($devices);
    const interfaces = @json($interfaces);
    const connections = @json($connections);
    const deviceIPs = @json($deviceIPs);
    const services = @json($services);
    
    console.log('Database Data:', { locations, devices, interfaces, connections, deviceIPs, services });

    // Enhanced Device Node Class - now with interfaces as connection points
    class DeviceNode extends LGraphNode {
        constructor() {
            super();
            this.size = [200, 100];
            this.color = "#1a1a1a";
            this.bgcolor = "#1a1a1a";
            this.title = "Device";
            this.title_color = "#FFFFFF";
            this.resizable = false;
            
            // Device properties
            this.device_data = null;
            this.device_interfaces = [];
            this.device_ips = [];
            
            // Add power input (always present)
            this.addInput("power", "power");
        }
        
        setDeviceData(deviceData, deviceInterfaces, deviceIPs) {
            this.device_data = deviceData;
            this.device_interfaces = deviceInterfaces;
            this.device_ips = deviceIPs;
            this.title = deviceData.display_name;
            
            // Calculate node size based on content
            const textWidth = this.title.length * 8;
            const interfaceCount = deviceInterfaces.filter(i => i.interface_type !== 'Power').length;
            const ipCount = deviceIPs.ip_addresses ? deviceIPs.ip_addresses.length : 0;
            
            this.size[0] = Math.max(220, textWidth + 40);
            this.size[1] = Math.max(100, 60 + (interfaceCount * 20) + (ipCount * 15));
            
            // Clear existing outputs and add interface outputs
            this.outputs = [];
            this.device_interfaces.forEach((interfaceData, index) => {
                if (interfaceData.interface_type !== 'Power') {
                    this.addOutput(interfaceData.label, "interface");
                }
            });
        }
        
        onDrawForeground(ctx) {
            if (!this.device_data) return;
            
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "12px Arial";
            
            let yOffset = 35;
            
            // Draw device model
            ctx.fillText(`Model: ${this.device_data.model_name}`, 10, yOffset);
            yOffset += 20;
            
            // Draw interfaces section
            if (this.device_interfaces.length > 1) { // > 1 because power is always there
                ctx.fillStyle = "#CCCCCC";
                ctx.fillText("Interfaces:", 10, yOffset);
                yOffset += 15;
                
                ctx.fillStyle = "#FFFFFF";
                this.device_interfaces.forEach(interfaceData => {
                    if (interfaceData.interface_type !== 'Power') {
                        ctx.fillText(`• ${interfaceData.label} (${interfaceData.interface_type})`, 15, yOffset);
                        yOffset += 15;
                    }
                });
                yOffset += 5;
            }
            
            // Draw IP addresses section
            if (this.device_ips.ip_addresses && this.device_ips.ip_addresses.length > 0) {
                ctx.fillStyle = "#CCCCCC";
                ctx.fillText("IP Addresses:", 10, yOffset);
                yOffset += 15;
                
                ctx.fillStyle = "#FFFFFF";
                this.device_ips.ip_addresses.forEach(ip => {
                    ctx.fillText(`• ${ip.ip_address}`, 15, yOffset);
                    yOffset += 12;
                });
            }
        }
    }
    
    // Service Node Class - shows services bound to IPs
    class ServiceNode extends LGraphNode {
        constructor() {
            super();
            this.size = [160, 80];
            this.color = "#0a4a0a";
            this.bgcolor = "#0a4a0a";
            this.title = "Service";
            this.title_color = "#FFFFFF";
            this.resizable = false;
            
            this.service_data = null;
            this.ip_address = null;
            this.port_number = null;
        }
        
        setServiceData(serviceData, ipAddress, portNumber) {
            this.service_data = serviceData;
            this.ip_address = ipAddress;
            this.port_number = portNumber;
            this.title = `${serviceData.name}:${portNumber}`;
            
            // Calculate size based on content
            const textWidth = this.title.length * 8;
            this.size[0] = Math.max(160, textWidth + 40);
        }
        
        onDrawForeground(ctx) {
            if (!this.service_data) return;
            
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "12px Arial";
            
            let yOffset = 35;
            ctx.fillText(`Service: ${this.service_data.name}`, 10, yOffset);
            yOffset += 15;
            ctx.fillText(`IP: ${this.ip_address}`, 10, yOffset);
            yOffset += 15;
            ctx.fillText(`Port: ${this.port_number}`, 10, yOffset);
        }
    }
    
    // Register node types
    LiteGraph.registerNodeType("network/device", DeviceNode);
    LiteGraph.registerNodeType("network/service", ServiceNode);
    
    // Build location hierarchy for groups
    function buildLocationHierarchy() {
        const locationMap = new Map();
        const rootLocations = [];
        
        // Create location objects
        locations.forEach(loc => {
            locationMap.set(loc.location_id, {
                ...loc,
                children: [],
                devices: devices.filter(d => d.location_id === loc.location_id)
            });
        });
        
        // Build hierarchy
        locations.forEach(loc => {
            if (loc.parent_location_id) {
                const parent = locationMap.get(loc.parent_location_id);
                if (parent) {
                    parent.children.push(locationMap.get(loc.location_id));
                }
            } else {
                rootLocations.push(locationMap.get(loc.location_id));
            }
        });
        
        return { locationMap, rootLocations };
    }
    
    // Create and position groups and nodes
    function createNetworkVisualization() {
        const { locationMap, rootLocations } = buildLocationHierarchy();
        const nodeMap = new Map(); // Map device serial numbers to nodes
        const serviceNodes = []; // Track service nodes for connections
        
        let currentY = 50;
        
        // Process each root location
        rootLocations.forEach(rootLoc => {
            const rootGroup = new LGraphGroup();
            rootGroup.title = rootLoc.name;
            rootGroup.color = "#444444";
            rootGroup.pos = [50, currentY];
            rootGroup.size = [800, 100]; // Will be resized
            graph.add(rootGroup);
            
            let groupContentHeight = processLocationRecursively(rootLoc, 70, currentY + 30, rootGroup, nodeMap, serviceNodes);
            rootGroup.size[1] = groupContentHeight + 60;
            currentY += groupContentHeight + 100;
        });
        
        // Create interface-to-interface connections
        createConnections(nodeMap);
        
        return { nodeMap, serviceNodes };
    }
    
    // Recursively process locations and create groups/nodes
    function processLocationRecursively(location, startX, startY, parentGroup, nodeMap, serviceNodes) {
        let currentX = startX;
        let currentY = startY;
        let maxHeight = 0;
        
        // Process child locations first
        location.children.forEach(childLoc => {
            const childGroup = new LGraphGroup();
            childGroup.title = childLoc.name;
            childGroup.color = "#666666";
            childGroup.pos = [currentX, currentY];
            childGroup.size = [300, 100]; // Will be resized
            graph.add(childGroup);
            
            const childContentHeight = processLocationRecursively(childLoc, currentX + 20, currentY + 30, childGroup, nodeMap, serviceNodes);
            childGroup.size[1] = childContentHeight + 60;
            
            currentY += childContentHeight + 80;
            maxHeight = Math.max(maxHeight, childContentHeight + 80);
        });
        
        // Process devices in this location
        if (location.devices.length > 0) {
            location.devices.forEach((device, index) => {
                // Create device node
                const deviceNode = new DeviceNode();
                
                // Get interfaces for this device
                const deviceInterfaces = interfaces.filter(i => i.device_serial_number === device.serial_number);
                
                // Get IPs for this device
                const deviceIPData = deviceIPs.find(d => d.device_serial_number === device.serial_number) || { ip_addresses: [] };
                
                deviceNode.setDeviceData(device, deviceInterfaces, deviceIPData);
                deviceNode.pos = [currentX, currentY];
                graph.add(deviceNode);
                nodeMap.set(device.serial_number, deviceNode);
                
                // Create service nodes for each IP address
                let serviceX = currentX + deviceNode.size[0] + 50;
                if (deviceIPData.ip_addresses) {
                    deviceIPData.ip_addresses.forEach(ip => {
                        if (ip.services && ip.services.length > 0) {
                            ip.services.forEach((service, serviceIndex) => {
                                const serviceNode = new ServiceNode();
                                serviceNode.setServiceData(service, ip.ip_address, service.port_number);
                                serviceNode.pos = [serviceX, currentY + (serviceIndex * 90)];
                                graph.add(serviceNode);
                                serviceNodes.push({
                                    node: serviceNode,
                                    deviceSerial: device.serial_number,
                                    ipAddress: ip.ip_address,
                                    service: service
                                });
                            });
                            serviceX += 180;
                        }
                    });
                }
                
                currentY += deviceNode.size[1] + 50;
                maxHeight = Math.max(maxHeight, deviceNode.size[1] + 50);
            });
        }
        
        return Math.max(maxHeight, currentY - startY);
    }
    
    // Create interface-to-interface connections
    function createConnections(nodeMap) {
        connections.forEach(connection => {
            // Find source and destination interfaces
            const sourceInterface = interfaces.find(i => i.interface_id === connection.source_interface_id);
            const destInterface = interfaces.find(i => i.interface_id === connection.destination_interface_id);
            
            if (sourceInterface && destInterface) {
                const sourceDevice = nodeMap.get(sourceInterface.device_serial_number);
                const destDevice = nodeMap.get(destInterface.device_serial_number);
                
                if (sourceDevice && destDevice) {
                    // Find the output slot for source interface
                    const sourceSlot = sourceDevice.outputs.findIndex(output => 
                        output.name === sourceInterface.label);
                    
                    // Find the output slot for destination interface  
                    const destSlot = destDevice.outputs.findIndex(output => 
                        output.name === destInterface.label);
                    
                    if (sourceSlot >= 0 && destSlot >= 0) {
                        // Connect the interfaces
                        sourceDevice.connect(sourceSlot, destDevice, destSlot);
                        console.log(`Connected ${sourceInterface.label} to ${destInterface.label}`);
                    }
                }
            }
        });
    }
    
    // Initialize the visualization
    console.log('Creating network visualization...');
    const { nodeMap, serviceNodes } = createNetworkVisualization();
    
    // Start the graph
    graph.start();
    
    // Log completion
    console.log('Network visualization created successfully!');
    console.log('Nodes created:', nodeMap.size);
    console.log('Services created:', serviceNodes.length);
    console.log('Connections:', connections.length);
</script>
