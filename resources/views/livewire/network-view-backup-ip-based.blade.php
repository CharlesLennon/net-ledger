<div wire:ignore style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1000; background: #1e1e1e;">
    <canvas id="mycanvas" style="width: 100%; height: 100%; display: block;"></canvas>
</div>

@push('scripts')
<script type="module">
    console.log('Script block executed!');

    // Wait for LiteGraph to be available
    function initializeNetworkView() {
        console.log('Livewire loaded!');

        // Device node definition
        class DeviceNode extends LiteGraph.LGraphNode {
            static title = "Device";
            
            constructor() {
                super();
                this.size = [180, 80]; // Wider for better text display
                this.addInput("mgmt", "");
                this.addOutput("mgmt", "");
                this.properties = { ips: [] };
            }

            addIPConnection(ip) {
                this.addOutput(ip, "");
                if (!this.properties.ips) this.properties.ips = [];
                this.properties.ips.push(ip);
                this.size[1] = Math.max(80, 40 + this.outputs.length * 20);
            }
        }

        class BasicDeviceNode {
            static title = "Device";
            static path = "basic/device";
            constructor() {
                this.addInput("power", "");
                // No mgmt output - will only have IP outputs
                this.size = [280, 30]; // Minimal initial height
                this.color = "#FFFFFF"; // White text for better readability
                this.bgcolor = "#1a1a1a"; // Dark background
                this.properties = { ips: [] };
            }

            addIPConnection(ip) {
                this.addOutput(ip, "");
                if (!this.properties.ips) this.properties.ips = [];
                this.properties.ips.push(ip);
                // Dynamic sizing: 30px base + 18px per output with better spacing
                this.size[1] = Math.max(40, 30 + this.outputs.length * 18);
            }
        }
        LiteGraph.registerNodeType(BasicDeviceNode.path, BasicDeviceNode);

        class BasicServiceNode {
            static title = "Service";
            static path = "basic/service";
            constructor() {
                this.addInput(":80", ""); // Default port, will be updated
                // No output - services are endpoints
                this.size = [140, 40]; // Slightly wider for port numbers
                this.color = "#FFFFFF"; // White text for better readability
                this.bgcolor = "#1a1a1a"; // Dark background
            }

            setPort(port) {
                if (this.inputs && this.inputs.length > 0) {
                    this.inputs[0].name = ":" + port;
                }
            }
        }
        LiteGraph.registerNodeType(BasicServiceNode.path, BasicServiceNode);

        // IP Address node definition
        class IPAddressNode extends LiteGraph.LGraphNode {
            static title = "IP Address";
            
            constructor() {
                super();
                this.size = [140, 60];
                this.addInput("device", "");
                this.addOutput("services", "");
            }
        }

        class BasicIPAddressNode {
            static title = "IP Address";
            static path = "basic/ip_address";
            constructor() {
                this.addInput("device", "");
                this.addOutput("services", "");
                this.size = [140, 35]; // Minimal padding
                this.color = "#FFFFFF"; // White text for better readability
                this.bgcolor = "#1a1a1a"; // Dark background
            }
        }
        LiteGraph.registerNodeType(BasicIPAddressNode.path, BasicIPAddressNode);

        class BasicLocalHostNode {
            static title = "Local Host";
            static path = "basic/local_host";
            constructor() {
                this.addInput("network", "");
                this.addOutput("internet", "");
                this.size = [160, 35]; // Minimal padding
                this.color = "#000000"; // Black text on gold background for contrast
                this.bgcolor = "#FFD700"; // Gold background
            }
        }
        LiteGraph.registerNodeType(BasicLocalHostNode.path, BasicLocalHostNode);

        // Access data passed from Livewire
        const locations = @json($locations);
        const devices = @json($devices);
        const services = @json($services);
        const connections = @json($connections);
        const ipAddresses = @json($ipAddresses);
        const deviceIPs = @json($deviceIPs);
        const serviceIPPorts = @json($serviceIPPorts);

        console.log('Locations:', locations);
        console.log('Raw location data with parent_location_id:');
        locations.forEach(loc => {
            console.log(`  ${loc.name}: ID=${loc.location_id}, Parent=${loc.parent_location_id}`);
        });
        
        console.log('Devices:', devices);
        console.log('Services:', services);
        console.log('Connections:', connections);
        console.log('IP Addresses:', ipAddresses);
        console.log('Device IPs:', deviceIPs);
        console.log('Service IP Ports:', serviceIPPorts);
        
        // Add some mock data for testing if arrays are empty
        if (ipAddresses.length === 0) {
            console.log('🔧 Adding mock IP data for testing...');
            ipAddresses.push(
                // Web Server 01 - 3 IPs
                { ip_address_id: 1, ip_address: '192.168.2.10' }, // Management
                { ip_address_id: 2, ip_address: '192.168.2.11' }, // Data/Web
                { ip_address_id: 3, ip_address: '10.0.1.10' },   // Internal
                // Database Server 02 - 3 IPs  
                { ip_address_id: 4, ip_address: '192.168.2.20' }, // Management
                { ip_address_id: 5, ip_address: '192.168.2.21' }, // Database
                { ip_address_id: 6, ip_address: '10.0.1.20' },   // Backup
                // Core Switch - 2 IPs
                { ip_address_id: 7, ip_address: '192.168.2.30' }, // Management
                { ip_address_id: 8, ip_address: '192.168.2.31' }, // VLAN
                // Security Firewall - 3 IPs
                { ip_address_id: 9, ip_address: '192.168.2.40' },  // WAN
                { ip_address_id: 10, ip_address: '192.168.2.41' }, // LAN
                { ip_address_id: 11, ip_address: '192.168.2.42' }, // DMZ
                // Edge Router - 2 IPs
                { ip_address_id: 12, ip_address: '192.168.2.50' }, // Management
                { ip_address_id: 13, ip_address: '203.0.113.1' },   // Public
                // Original device SN12345 - 2 IPs
                { ip_address_id: 14, ip_address: '192.168.1.100' }, // Management
                { ip_address_id: 15, ip_address: '192.168.1.101' }  // Data
            );
            deviceIPs.push(
                // Web Server 01 connections
                { device_serial_number: 'SRV-001', ip_address_id: 1 },
                { device_serial_number: 'SRV-001', ip_address_id: 2 },
                { device_serial_number: 'SRV-001', ip_address_id: 3 },
                // Database Server 02 connections
                { device_serial_number: 'SRV-002', ip_address_id: 4 },
                { device_serial_number: 'SRV-002', ip_address_id: 5 },
                { device_serial_number: 'SRV-002', ip_address_id: 6 },
                // Core Switch connections
                { device_serial_number: 'SW-001', ip_address_id: 7 },
                { device_serial_number: 'SW-001', ip_address_id: 8 },
                // Security Firewall connections
                { device_serial_number: 'FW-001', ip_address_id: 9 },
                { device_serial_number: 'FW-001', ip_address_id: 10 },
                { device_serial_number: 'FW-001', ip_address_id: 11 },
                // Edge Router connections
                { device_serial_number: 'RTR-001', ip_address_id: 12 },
                { device_serial_number: 'RTR-001', ip_address_id: 13 },
                // Original device SN12345 connections  
                { device_serial_number: 'SN12345', ip_address_id: 14 },
                { device_serial_number: 'SN12345', ip_address_id: 15 }
            );
        }
        
        if (devices.length <= 1) {
            console.log('🔧 Adding mock devices for U2 testing...');
            devices.push(
                { serial_number: 'SRV-001', display_name: 'Web Server 01', location_id: 4 }, // U2
                { serial_number: 'SRV-002', display_name: 'Database Server 02', location_id: 4 }, // U2
                { serial_number: 'SW-001', display_name: 'Core Switch', location_id: 4 }, // U2
                { serial_number: 'FW-001', display_name: 'Security Firewall', location_id: 4 }, // U2
                { serial_number: 'RTR-001', display_name: 'Edge Router', location_id: 4 } // U2
            );
        }
        
        if (services.length === 0) {
            console.log('🔧 Adding mock service data for testing...');
            services.push(
                // Web services
                { service_id: 1, name: 'SSH' },
                { service_id: 2, name: 'HTTP' },
                { service_id: 3, name: 'HTTPS' },
                { service_id: 4, name: 'FTP' },
                // Database services
                { service_id: 5, name: 'MySQL' },
                { service_id: 6, name: 'PostgreSQL' },
                { service_id: 7, name: 'Redis' },
                // Network services
                { service_id: 8, name: 'SNMP' },
                { service_id: 9, name: 'Telnet' },
                { service_id: 10, name: 'DHCP' },
                { service_id: 11, name: 'DNS' },
                // Additional specialized services
                { service_id: 12, name: 'Internal Web' },
                { service_id: 13, name: 'Backup Service' },
                { service_id: 14, name: 'VLAN Config' },
                { service_id: 15, name: 'Firewall Admin' },
                { service_id: 16, name: 'BGP' }
            );
            serviceIPPorts.push(
                // Web Server 01 services (3 IPs with multiple services each)
                { service_id: 1, ip_address_id: 1, port_number: 22 },   // SSH on mgmt
                { service_id: 8, ip_address_id: 1, port_number: 161 },  // SNMP on mgmt
                { service_id: 2, ip_address_id: 2, port_number: 80 },   // HTTP on web
                { service_id: 3, ip_address_id: 2, port_number: 443 },  // HTTPS on web
                { service_id: 4, ip_address_id: 2, port_number: 21 },   // FTP on web
                { service_id: 1, ip_address_id: 3, port_number: 22 },   // SSH on internal
                { service_id: 12, ip_address_id: 3, port_number: 8080 }, // Internal Web on internal
                
                // Database Server 02 services (3 IPs with multiple services each)
                { service_id: 1, ip_address_id: 4, port_number: 22 },   // SSH on mgmt
                { service_id: 8, ip_address_id: 4, port_number: 161 },  // SNMP on mgmt
                { service_id: 5, ip_address_id: 5, port_number: 3306 }, // MySQL on database
                { service_id: 6, ip_address_id: 5, port_number: 5432 }, // PostgreSQL on database
                { service_id: 7, ip_address_id: 5, port_number: 6379 }, // Redis on database
                { service_id: 13, ip_address_id: 6, port_number: 8443 }, // Backup Service on backup
                { service_id: 1, ip_address_id: 6, port_number: 22 },   // SSH on backup
                
                // Core Switch services (2 IPs)
                { service_id: 8, ip_address_id: 7, port_number: 161 },  // SNMP on mgmt
                { service_id: 9, ip_address_id: 7, port_number: 23 },   // Telnet on mgmt
                { service_id: 1, ip_address_id: 7, port_number: 22 },   // SSH on mgmt
                { service_id: 14, ip_address_id: 8, port_number: 8021 }, // VLAN Config on vlan
                
                // Security Firewall services (3 IPs)
                { service_id: 8, ip_address_id: 9, port_number: 161 },  // SNMP on WAN
                { service_id: 1, ip_address_id: 9, port_number: 22 },   // SSH on WAN
                { service_id: 15, ip_address_id: 10, port_number: 8443 }, // Firewall Admin on LAN
                { service_id: 1, ip_address_id: 10, port_number: 22 },  // SSH on LAN
                { service_id: 2, ip_address_id: 11, port_number: 80 },  // HTTP on DMZ
                { service_id: 3, ip_address_id: 11, port_number: 443 }, // HTTPS on DMZ
                
                // Edge Router services (2 IPs)
                { service_id: 10, ip_address_id: 12, port_number: 67 }, // DHCP on mgmt
                { service_id: 11, ip_address_id: 12, port_number: 53 }, // DNS on mgmt
                { service_id: 1, ip_address_id: 12, port_number: 22 },  // SSH on mgmt
                { service_id: 16, ip_address_id: 13, port_number: 179 }, // BGP on public
                
                // Original device SN12345 services (2 IPs)
                { service_id: 1, ip_address_id: 14, port_number: 22 },  // SSH on mgmt
                { service_id: 8, ip_address_id: 14, port_number: 161 }, // SNMP on mgmt
                { service_id: 2, ip_address_id: 15, port_number: 80 },  // HTTP on data
                { service_id: 3, ip_address_id: 15, port_number: 443 }  // HTTPS on data
            );
            
            console.log('🔧 Mock data summary:');
            console.log('  Devices:', devices.length);
            console.log('  Services:', services.length);
            console.log('  IP Addresses:', ipAddresses.length);
            console.log('  Service-IP-Port mappings:', serviceIPPorts.length);
        }

        var graph = new window.LGraph();
        var canvas = new window.LGraphCanvas("#mycanvas", graph);
        
        // Make canvas responsive
        function resizeCanvas() {
            const canvasElement = document.getElementById('mycanvas');
            if (canvasElement) {
                canvasElement.width = window.innerWidth;
                canvasElement.height = window.innerHeight;
                if (canvas) {
                    canvas.resize();
                }
            }
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Clear existing nodes and groups if any
        graph.clear();

        // Store nodes by ID for easy access when creating connections
        const nodeMap = new Map();
        const locationGroups = new Map();
        const locationNodeCounts = new Map();

        // Build location hierarchy
        const locationHierarchy = new Map();
        const rootLocations = [];
        
        // First pass: create all location objects
        locations.forEach(location => {
            locationHierarchy.set(location.location_id, {
                ...location,
                children: [],
                level: 0 // Will be recalculated
            });
        });

        // Second pass: build parent-child relationships
        locations.forEach(location => {
            if (location.parent_location_id) {
                const parent = locationHierarchy.get(location.parent_location_id);
                const child = locationHierarchy.get(location.location_id);
                if (parent && child) {
                    parent.children.push(child);
                    child.parent = parent;
                }
            } else {
                // This is a root location
                rootLocations.push(locationHierarchy.get(location.location_id));
            }
        });

        // Third pass: calculate correct levels recursively
        function calculateLevels(locationObj, level = 0) {
            locationObj.level = level;
            locationObj.children.forEach(child => {
                calculateLevels(child, level + 1);
            });
        }

        rootLocations.forEach(rootLocation => {
            calculateLevels(rootLocation, 0);
        });

        console.log('📊 Location hierarchy built:');
        locationHierarchy.forEach((loc, id) => {
            const indent = '  '.repeat(loc.level);
            console.log(`${indent}Level ${loc.level}: ${loc.name} (ID: ${id}) - ${loc.children.length} children`);
        });

        // Count devices per location (including inherited from children)
        function countDevicesInLocation(locationId, includeChildren = true) {
            let count = devices.filter(device => device.location_id === locationId).length;
            
            if (includeChildren) {
                const location = locationHierarchy.get(locationId);
                if (location) {
                    location.children.forEach(child => {
                        count += countDevicesInLocation(child.location_id, true);
                    });
                }
            }
            
            return count;
        }

        locations.forEach(location => {
            locationNodeCounts.set(location.location_id, countDevicesInLocation(location.location_id, false));
        });

        // Create Groups for Locations with dynamic nested space management
        function createLocationGroups() {
            const groupSpacing = 30;
            const titleHeight = 40;
            const minGroupWidth = 300;
            const minGroupHeight = 120;
            let currentRootX = 50;
            
            // Group metadata for dynamic resizing
            const groupMetadata = new Map();
            
            // Helper function to update parent group sizes recursively
            function updateParentGroupSizes(locationId) {
                const location = locationHierarchy.get(locationId);
                if (!location || !location.parent_location_id) return;
                
                const parentGroup = locationGroups.get(location.parent_location_id);
                if (!parentGroup) return;
                
                console.log(`Updating parent group sizes for location ${location.name} (ID: ${locationId})`);
                
                // Calculate required space for all children (vertical stacking)
                const parentLocation = locationHierarchy.get(location.parent_location_id);
                let maxChildWidth = 0;
                let totalChildHeight = 0;
                
                parentLocation.children.forEach(child => {
                    const childGroup = locationGroups.get(child.location_id);
                    if (childGroup) {
                        maxChildWidth = Math.max(maxChildWidth, childGroup.size[0]);
                        totalChildHeight += childGroup.size[1] + groupSpacing;
                    }
                });
                
                // Remove extra spacing
                if (totalChildHeight > 0) {
                    totalChildHeight -= groupSpacing;
                }
                
                // Calculate space needed for parent's own devices
                const parentDeviceCount = locationNodeCounts.get(location.parent_location_id) || 0;
                const deviceWidth = Math.max(minGroupWidth, parentDeviceCount * 300 + 60);
                const deviceHeight = Math.ceil(parentDeviceCount / Math.max(1, Math.floor(deviceWidth / 300))) * 60;
                
                // Calculate new parent size (width = max of device width and child width, height = device + stacked children)
                const newWidth = Math.max(
                    deviceWidth,
                    maxChildWidth + groupSpacing * 2,
                    minGroupWidth
                );
                
                const newHeight = Math.max(
                    deviceHeight + titleHeight + groupSpacing,
                    totalChildHeight > 0 ? deviceHeight + titleHeight + totalChildHeight + groupSpacing * 3 : minGroupHeight
                );
                
                console.log(`Parent group ${parentLocation.name}: Old size [${parentGroup.size[0]}, ${parentGroup.size[1]}] -> New size [${newWidth}, ${newHeight}]`);
                
                // Update parent group size if it needs to grow
                if (newWidth > parentGroup.size[0] || newHeight > parentGroup.size[1]) {
                    parentGroup.size[0] = newWidth;
                    parentGroup.size[1] = newHeight;
                    
                    console.log(`✓ Expanded parent group ${parentLocation.name} to [${newWidth}, ${newHeight}]`);
                    
                    // Recursively update grandparent
                    updateParentGroupSizes(location.parent_location_id);
                    
                    // Reposition siblings to fit in the new space
                    repositionChildGroups(location.parent_location_id);
                }
            }
            
            // Helper function to reposition child groups within a parent
            function repositionChildGroups(parentLocationId) {
                const parentLocation = locationHierarchy.get(parentLocationId);
                const parentGroup = locationGroups.get(parentLocationId);
                
                if (!parentLocation || !parentGroup || !parentLocation.children.length) return;
                
                console.log(`Repositioning ${parentLocation.children.length} child groups in ${parentLocation.name}`);
                
                const baseX = parentGroup.pos[0] + groupSpacing;
                let currentY = parentGroup.pos[1] + titleHeight + groupSpacing * 2;
                
                // Calculate space reserved for parent's own devices
                const parentDeviceCount = locationNodeCounts.get(parentLocationId) || 0;
                const deviceRowHeight = parentDeviceCount > 0 ? Math.ceil(parentDeviceCount / Math.max(1, Math.floor((parentGroup.size[0] - 40) / 160))) * 60 : 0;
                const childStartY = currentY + deviceRowHeight + (deviceRowHeight > 0 ? groupSpacing : 0);
                currentY = childStartY;
                
                parentLocation.children.forEach((child, index) => {
                    const childGroup = locationGroups.get(child.location_id);
                    if (childGroup) {
                        const oldPos = [childGroup.pos[0], childGroup.pos[1]];
                        
                        childGroup.pos[0] = baseX;
                        childGroup.pos[1] = currentY;
                        
                        console.log(`  Child ${child.name}: [${oldPos[0]}, ${oldPos[1]}] -> [${childGroup.pos[0]}, ${childGroup.pos[1]}]`);
                        
                        // Move down for next sibling (vertical stacking)
                        currentY += childGroup.size[1] + groupSpacing;
                        
                        // Ensure child doesn't exceed parent bounds
                        const maxY = parentGroup.pos[1] + parentGroup.size[1] - childGroup.size[1] - groupSpacing;
                        if (childGroup.pos[1] > maxY) {
                            childGroup.pos[1] = maxY;
                            console.log(`  ⚠ Adjusted child ${child.name} position to fit in parent bounds: [${childGroup.pos[0]}, ${childGroup.pos[1]}]`);
                        }
                    }
                });
            }
            
            // Create groups level by level (breadth-first to ensure parents exist before children)
            function createGroupsAtLevel(locationList, level = 0) {
                console.log(`Creating ${locationList.length} groups at level ${level}:`, locationList.map(l => `${l.name} (actual level: ${l.level})`));
                
                locationList.forEach((location, index) => {
                    const group = new window.LiteGraph.LGraphGroup();
                    
                    // Use the location's actual level, not the parameter
                    const actualLevel = location.level;
                    
                    // Set color and styling based on hierarchy level
                    const colors = ["#4a5568", "#2d3748", "#1a202c", "#171923"];
                    group.color = colors[Math.min(actualLevel, colors.length - 1)];
                    
                    // Add visual distinction for hierarchy levels
                    if (actualLevel === 0) {
                        group.title = `🏢 ${location.name}`;  // Building icon for root
                    } else if (actualLevel === 1) {
                        group.title = `🏬 ${location.name}`;  // Department icon
                    } else if (actualLevel === 2) {
                        group.title = `🏪 ${location.name}`;  // Room icon
                    } else {
                        group.title = `📍 ${location.name}`;  // Location pin for deeper levels
                    }
                    
                    // Calculate initial size based on devices and services side by side
                    const directDeviceCount = locationNodeCounts.get(location.location_id) || 0;
                    
                    // Count actual services that will be created for this location
                    const devicesInLocation = devices.filter(d => d.location_id === location.location_id);
                    let serviceCount = 0;
                    devicesInLocation.forEach(device => {
                        const deviceIPsForDevice = deviceIPs.filter(dip => dip.device_serial_number === device.serial_number);
                        deviceIPsForDevice.forEach(deviceIP => {
                            serviceCount += serviceIPPorts.filter(sip => sip.ip_address_id === deviceIP.ip_address_id).length;
                        });
                    });
                    
                    const deviceWidth = 290; // Device width
                    const serviceWidth = 140; // Service width
                    const deviceServiceSpacing = 60; // Spacing between device and services
                    
                    // Width = device width + spacing + service width + padding
                    const minWidthForContent = deviceWidth + deviceServiceSpacing + serviceWidth + 80;
                    const groupWidth = Math.max(minGroupWidth, minWidthForContent);
                    
                    // Height calculation - estimate based on IPs per device for more accurate sizing
                    let estimatedDeviceHeight = 0;
                    devicesInLocation.forEach(device => {
                        const deviceIPCount = deviceIPs.filter(dip => dip.device_serial_number === device.serial_number).length;
                        const estimatedSingleDeviceHeight = Math.max(40, 30 + deviceIPCount * 18); // Match device sizing logic
                        estimatedDeviceHeight += estimatedSingleDeviceHeight + 40; // Add margin between devices (increased from 20px)
                    });
                    
                    const serviceStackHeight = serviceCount * 110; // 110px per service
                    const contentHeight = Math.max(estimatedDeviceHeight, serviceStackHeight);
                    
                    group.size = [
                        groupWidth,
                        Math.max(minGroupHeight, contentHeight + titleHeight + groupSpacing + 25)
                    ];
                    
                    console.log(`  Created group ${location.name} (level ${actualLevel}) with initial size [${group.size[0]}, ${group.size[1]}] for ${directDeviceCount} devices`);
                    
                    // Position group
                    if (location.parent_location_id) {
                        const parentGroup = locationGroups.get(location.parent_location_id);
                        if (parentGroup) {
                            // Initial position within parent - will be adjusted by repositioning
                            group.pos = [
                                parentGroup.pos[0] + groupSpacing,
                                parentGroup.pos[1] + titleHeight + groupSpacing * 2
                            ];
                            console.log(`  Positioned ${location.name} as child of parent at [${group.pos[0]}, ${group.pos[1]}]`);
                        } else {
                            console.warn(`  ⚠ Parent group not found for ${location.name} (parent ID: ${location.parent_location_id})`);
                        }
                    } else {
                        // Root level positioning
                        group.pos = [currentRootX, 50];
                        currentRootX += group.size[0] + 80; // Larger spacing between root groups
                        console.log(`  Positioned ${location.name} as root at [${group.pos[0]}, ${group.pos[1]}]`);
                    }
                    
                    // Add to graph and store reference
                    graph.add(group);
                    locationGroups.set(location.location_id, group);
                    
                    // Store metadata
                    groupMetadata.set(location.location_id, {
                        level: actualLevel,
                        directDeviceCount: directDeviceCount,
                        hasChildren: location.children.length > 0
                    });
                    
                    // Update parent sizes to accommodate this new child
                    if (location.parent_location_id) {
                        console.log(`  Updating parent for ${location.name}`);
                        updateParentGroupSizes(location.location_id);
                    }
                });
                
                // Create children at next level
                const childLocations = locationList.flatMap(loc => loc.children);
                if (childLocations.length > 0) {
                    createGroupsAtLevel(childLocations, level + 1);
                }
            }
            
            // Start creating groups from root level
            console.log('🏗️ Starting dynamic nested group creation...');
            createGroupsAtLevel(rootLocations);
            
            // Final positioning pass to ensure all groups are properly positioned
            console.log('📐 Final positioning pass...');
            rootLocations.forEach(rootLocation => {
                repositionChildGroups(rootLocation.location_id);
            });
            
            // Log final group structure
            console.log('✅ Final group structure:');
            locationGroups.forEach((group, locationId) => {
                const location = locationHierarchy.get(locationId);
                const actualLevel = location?.level || 0;
                const indent = '  '.repeat(actualLevel);
                console.log(`${indent}${group.title}: Position [${group.pos[0]}, ${group.pos[1]}], Size [${group.size[0]}, ${group.size[1]}] (Level ${actualLevel})`);
            });
        }

        // Create all location groups
        createLocationGroups();

        // Helper to create a node and add it to the graph with improved positioning
        function createAndAddNode(id, title, type, locationId = null) {
            const node = window.LiteGraph.createNode(type || "basic/const", title);
            node.id = id;
            
            if (locationId && locationGroups.has(locationId)) {
                const group = locationGroups.get(locationId);
                
                // Separate devices and services in this group
                const existingNodes = Array.from(nodeMap.values()).filter(n => n.locationId === locationId);
                const deviceNodes = existingNodes.filter(n => n.type === "basic/device");
                const serviceNodes = existingNodes.filter(n => n.type === "basic/service");
                
                // Calculate available space for nodes in this group
                const location = locationHierarchy.get(locationId);
                const hasChildren = location && location.children.length > 0;
                
                // Calculate space reserved for child groups
                let childGroupsHeight = 0;
                if (hasChildren) {
                    const childGroups = location.children.map(child => locationGroups.get(child.location_id)).filter(g => g);
                    if (childGroups.length > 0) {
                        childGroupsHeight = Math.max(...childGroups.map(g => g.size[1])) + 30; // Max child height + spacing
                    }
                }
                
                // Available space for devices (before child groups)
                const availableWidth = group.size[0] - 30; // Minimal padding
                const deviceAreaHeight = Math.max(50, group.size[1] - 50 - childGroupsHeight - 15); // Minimal spacing
                
                if (type === "basic/device") {
                    // Position devices on the left side with dynamic spacing based on device content
                    const deviceWidth = 290;
                    let deviceSpacing = 80; // Base spacing
                    
                    // Calculate cumulative spacing based on previous devices' actual heights
                    let cumulativeY = 0;
                    for (let i = 0; i < deviceNodes.length; i++) {
                        const prevDevice = deviceNodes[i];
                        if (prevDevice && prevDevice.size) {
                            cumulativeY += Math.max(deviceSpacing, prevDevice.size[1] + 80); // Device height + 80px margin (increased from 40px)
                        } else {
                            cumulativeY += deviceSpacing; // Fallback spacing
                        }
                    }
                    
                    node.pos = [
                        group.pos[0] + 15, // Left side
                        group.pos[1] + 70 + cumulativeY // Dynamic spacing based on previous devices
                    ];
                } else if (type === "basic/service") {
                    // Position services on the right side, stacked vertically for ALL services in this location
                    const serviceWidth = 140;
                    const serviceHeight = 110;
                    
                    // Count all services already created in this location (across all devices)
                    const allServicesInLocation = Array.from(nodeMap.values()).filter(n => 
                        n.locationId === locationId && n.type === "basic/service"
                    );
                    const serviceRow = allServicesInLocation.length;
                    
                    node.pos = [
                        group.pos[0] + 350, // Right side positioning
                        group.pos[1] + 70 + serviceRow * serviceHeight // Stack all services vertically
                    ];
                } else {
                    // Default positioning for other node types
                    const nodeWidth = 200;
                    const nodeHeight = 50;
                    const nodeRow = existingNodes.length;
                    
                    node.pos = [
                        group.pos[0] + 15,
                        group.pos[1] + 45 + nodeRow * nodeHeight
                    ];
                }
                
                // Ensure node stays within the device area of the group
                const maxX = group.pos[0] + group.size[0] - 150;
                const maxY = group.pos[1] + 45 + deviceAreaHeight - 50;
                
                if (node.pos[0] > maxX) {
                    node.pos[0] = maxX;
                }
                if (node.pos[1] > maxY) {
                    node.pos[1] = maxY;
                }
                
                // Store location reference for filtering
                node.locationId = locationId;
            } else {
                // Position nodes without location in a separate area
                const nodesWithoutLocation = Array.from(nodeMap.values()).filter(n => !n.locationId).length;
                const col = nodesWithoutLocation % 5;
                const row = Math.floor(nodesWithoutLocation / 5);
                
                node.pos = [50 + col * 180, window.innerHeight - 200 + row * 80];
            }
            
            graph.add(node);
            nodeMap.set(id, node);
            return node;
        }

        // Create nodes for Devices and their associated Services
        devices.forEach(device => {
            const nodeId = 'device_' + device.serial_number;
            console.log('Creating device node:', device.display_name, 'ID:', nodeId);
            const deviceNode = createAndAddNode(nodeId, device.display_name, "basic/device", device.location_id);
            
            // Find all IPs for this device and add them as outputs (not separate nodes)
            const deviceIPsForDevice = deviceIPs.filter(dip => dip.device_serial_number === device.serial_number);
            console.log('Device IPs for', device.serial_number, ':', deviceIPsForDevice);
            deviceIPsForDevice.forEach(deviceIP => {
                const ip = ipAddresses.find(ip => ip.ip_address_id === deviceIP.ip_address_id);
                console.log('Adding IP output connection:', ip);
                if (ip && deviceNode.addIPConnection) {
                    deviceNode.addIPConnection(ip.ip_address);
                }
            });
            
            // Create services connected to this device's IPs in the same location group
            deviceIPsForDevice.forEach(deviceIP => {
                const connectedServices = serviceIPPorts.filter(sip => sip.ip_address_id === deviceIP.ip_address_id);
                connectedServices.forEach(serviceIPPort => {
                    const service = services.find(s => s.service_id === serviceIPPort.service_id);
                    if (service) {
                        const serviceNodeId = 'service_' + service.service_id + '_device_' + device.serial_number;
                        console.log('Creating service node in same group:', service.name, 'with port:', serviceIPPort.port_number, 'ID:', serviceNodeId);
                        const serviceNode = createAndAddNode(serviceNodeId, service.name, "basic/service", device.location_id);
                        
                        // Set the port as the input label
                        if (serviceNode && serviceNode.setPort) {
                            serviceNode.setPort(serviceIPPort.port_number);
                        }
                    }
                });
            });
        });

        // Skip creating separate IP address nodes - IPs are now device outputs

        // Create connections between Device IP outputs and Services
        serviceIPPorts.forEach(serviceIPPort => {
            // Find the device that has this IP address
            const deviceIP = deviceIPs.find(dip => dip.ip_address_id === serviceIPPort.ip_address_id);
            const ip = ipAddresses.find(ip => ip.ip_address_id === serviceIPPort.ip_address_id);
            
            if (deviceIP && ip) {
                const deviceNode = nodeMap.get('device_' + deviceIP.device_serial_number);
                const service = services.find(s => s.service_id === serviceIPPort.service_id);
                const serviceNode = nodeMap.get('service_' + serviceIPPort.service_id + '_device_' + deviceIP.device_serial_number);
                
                if (deviceNode && serviceNode && service) {
                    console.log('Connecting device IP output to service:', ip.ip_address, '->', serviceNode.title);
                    
                    // Find the output slot for this specific IP on the device
                    let outputSlot = 0; // Default to first output
                    if (deviceNode.outputs && ip) {
                        const ipOutputIndex = deviceNode.outputs.findIndex(output => output.name === ip.ip_address);
                        if (ipOutputIndex !== -1) {
                            outputSlot = ipOutputIndex;
                        }
                    }
                    
                    // Create the connection with color (Device IP output to service input)
                    const link = deviceNode.connect(outputSlot, serviceNode, 0);
                    if (link && service) {
                        switch (service.name.toLowerCase()) {
                            case "ssh":
                                link.color = "#00FF00";
                                break;
                            case "http":
                            case "web":
                                link.color = "#FF0000";
                                break;
                            case "database":
                                link.color = "#0000FF";
                                break;
                            default:
                                link.color = "#FFA500";
                                break;
                        }
                    }
                }
            }
        });

        // Create physical connections from the connections table
        connections.forEach(connection => {
            console.log('Processing connection:', connection);
            // Note: This would need interface data to map source_interface_id and destination_interface_id
            // to specific devices. For now, we'll skip this until interface data is available.
        });

        // Local Host Identification
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                const localIp = data.ip;
                console.log('Local IP Address:', localIp);

                const localHostNode = createAndAddNode('local_host_' + localIp, 'Local Host: ' + localIp, "basic/local_host");
                localHostNode.color = "#FFD700";
                localHostNode.bgcolor = "#444";
                localHostNode.boxcolor = "#FFD700";
            })
            .catch(error => {
                console.error('Error fetching local IP address:', error);
            });

        // Dynamic group expansion function
        function expandGroupForNewNode(locationId) {
            const group = locationGroups.get(locationId);
            if (!group) return;
            
            const currentDeviceCount = Array.from(nodeMap.values()).filter(n => n.locationId === locationId).length;
            const location = locationHierarchy.get(locationId);
            
            // Calculate if group needs expansion
            const currentWidth = group.size[0];
            const currentHeight = group.size[1];
            
            // Calculate required space for devices
            const nodeWidth = 160;
            const nodeHeight = 70;
            const availableWidth = currentWidth - 40;
            const nodesPerRow = Math.max(1, Math.floor(availableWidth / nodeWidth));
            const requiredRows = Math.ceil(currentDeviceCount / nodesPerRow);
            const requiredDeviceHeight = requiredRows * nodeHeight + 40; // Title space
            
            // Calculate space for child groups
            let childGroupsHeight = 0;
            if (location && location.children.length > 0) {
                const childGroups = location.children.map(child => locationGroups.get(child.location_id)).filter(g => g);
                if (childGroups.length > 0) {
                    childGroupsHeight = Math.max(...childGroups.map(g => g.size[1])) + 30;
                }
            }
            
            const minRequiredHeight = requiredDeviceHeight + childGroupsHeight + 30;
            
            // Expand if necessary
            if (minRequiredHeight > currentHeight) {
                group.size[1] = minRequiredHeight;
                
                // Update parent groups recursively
                if (location && location.parent_location_id) {
                    updateParentGroupSizes(locationId);
                }
                
                // Reposition child groups
                if (location && location.children.length > 0) {
                    repositionChildGroups(locationId);
                }
                
                // Mark canvas for redraw
                canvas.setDirty(true, true);
            }
        }
        
        // Expose function for external use (e.g., when adding new devices dynamically)
        window.expandGroupForNewNode = expandGroupForNewNode;

        // Start the graph
        graph.start();
        
        // Force a redraw
        setTimeout(() => {
            canvas.setDirty(true, true);
        }, 100);
    }

    // Initialize when DOM is ready
    if (typeof LiteGraph !== 'undefined') {
        initializeNetworkView();
    } else {
        // Wait for LiteGraph to load
        window.addEventListener('load', initializeNetworkView);
    }
</script>
@endpush