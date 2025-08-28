<div style="width: 100%; height: 500px; border: 1px solid black;">
    <canvas id="mycanvas" width="1024" height="768" style="border: 1px solid;"></canvas>
</div>

<script type="module">
    import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';

    document.addEventListener('livewire:load', function () {
        var graph = new LGraph();
        var canvas = new LGraphCanvas("#mycanvas", graph);

        // Access data passed from Livewire
        const locations = @json($locations);
        const devices = @json($devices);
        const services = @json($services);
        const connections = @json($connections);
        const ipAddresses = @json($ipAddresses);

        console.log('Locations:', locations);
        console.log('Devices:', devices);
        console.log('Services:', services);
        console.log('Connections:', connections);
        console.log('IP Addresses:', ipAddresses);

        // Clear existing nodes and groups if any
        graph.clear();

        // Store nodes by ID for easy access when creating connections
        const nodeMap = new Map();

        // 1. Create Groups for Locations
        locations.forEach(location => {
            // LiteGraph does not have a direct "group" concept like LGraphGroup for visual grouping.
            // LGraphGroup is for logical grouping of nodes within the graph.
            // For visual grouping, we might need to draw rectangles or use custom nodes.
            // For now, let's just create nodes for devices and services and position them.
            // We will revisit visual grouping later if needed.
        });

        // 2. Create Nodes for Devices and Services
        // Helper to create a node and add it to the graph
        function createAndAddNode(id, title, type, position) {
            const node = LiteGraph.createNode(type || "basic/const", title);
            node.pos = position || [0, 0];
            node.id = id; // Assign a unique ID to the node
            graph.add(node);
            nodeMap.set(id, node);
            return node;
        }

        // Create nodes for Devices
        devices.forEach(device => {
            // Assign a unique ID for the node, e.g., 'device_' + serial_number
            const nodeId = 'device_' + device.serial_number;
            createAndAddNode(nodeId, device.model_name, "basic/device", [Math.random() * 800, Math.random() * 600]);
        });

        // Create nodes for Services
        services.forEach(service => {
            // Assign a unique ID for the node, e.g., 'service_' + service.service_id
            const nodeId = 'service_' + service.service_id;
            createAndAddNode(nodeId, service.name, "basic/service", [Math.random() * 800, Math.random() * 600]);
        });

        // 3. Create Connections (Wires)
        // This part is more complex as it requires understanding how IP Addresses and Services are connected.
        // Based on the schema, Connection table links source_interface_id and destination_interface_id.
        // Service_IP_Port links service_id, ip_address_id, and port_number.
        // We need to map these to nodes.

        // For now, let's just add a placeholder for connections.
        // This will require more detailed logic to map interfaces/IPs to nodes.
        connections.forEach(connection => {
            // TODO: Logic to create wires between nodes based on connection data
        });

        // 4. Local Host Identification
        // This will require fetching the client's IP address (e.g., via a public API)
        // and then creating a distinct node for it.
        // TODO: Implement local host identification

        graph.start();
    });
</script>