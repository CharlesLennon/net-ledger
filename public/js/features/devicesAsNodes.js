class DevicesAsNodes {

    static onInit() {
        class deviceNode extends LiteGraph.LGraphNode {
            horizontal = false;
            resizable = false;
            size = [100, 100];
            group_id = null;
            nodes = [];
            services = [];
            inputs = [];
            outputs = [];
            serial_number = null;
            

            constructor() {
                super();
                this.title = 'New Device';
            }

            render(){
                var width = this.title.length * 8 + 40;
                this.bgcolor = '#2d3748';
                this.title_color = '#e4870eff';
                this.title_text_color = '#FFFFFF';
                this.size[0] = Math.max(200, width);
                this.onNodeSizeOrPositionChanged();
                return this;
            }

            moveToGroup(margin = [40, 80]) {
                if (this.group_id) {
                    const group = window.canvasInstance.graph._groups.find(g => g.id === this.group_id);
                    if (group) {
                        group.nodes.push(this);
                        if (group.nodes.length > 1) {
                            const lastNode = group.nodes[group.nodes.length - 2];
                            this.pos = [lastNode.pos[0] + lastNode.size[0] + margin[0], lastNode.pos[1]];
                        } else {
                            this.pos = [group.pos[0] + margin[0], group.pos[1] + margin[1]];
                        }
                        this.onNodeSizeOrPositionChanged();
                        return true;
                    }
                }
            }

            growToFitIterfaces(marginBottom = 10) {
                const interfaceCount = Math.max(this.inputs.length, this.outputs.length);
                const minHeight = 5;
                const calculatedHeight = 20 * interfaceCount + marginBottom;
                this.size[1] = Math.max(minHeight, calculatedHeight);
                this.onNodeSizeOrPositionChanged();
                return this;
            }

            onNodeSizeOrPositionChanged() {
                const event = new CustomEvent("nodeSizeOrPositionChanged", { detail: { node: this } });
                window.dispatchEvent(event);
            }


        }
        LiteGraph.registerNodeType("basic/device", deviceNode);
    }

    static onDeviceSetup(canvas, data) {
        const customLinkTypeColors = {
            power: "#F77",
            rj45: "#4A90E2",
            rj11: "#50E3C2",
            sata: "#9013FE",
            usb: "#B8E986",
            display: "#F5A623",
            interface: "#7ED321",
        };

        canvas.default_connection_color_byType = {
            ...canvas.default_connection_color_byType,
            ...customLinkTypeColors,
        };

        const devices = this.getDevicesFromData(data || []);
        devices.forEach(device => {

            var node = LiteGraph.createNode("basic/device");

            node.title = device.display_name;
            node.pos = [Math.random() * 800, Math.random() * 600];
            node.group_id = device.location_id || null;
            node.serial_number = device.serial_number || null;
            node.moveToGroup();

            device.interfaces.forEach((intf, index) => {
                const interfaceName = `${intf.label} (${intf.interface_type})`;
                if (intf.interface_type === 'Power') {
                    node.addInput(interfaceName, intf.interface_type.toLowerCase(), { interface_id: intf.interface_id });
                } else {
                    node.addOutput(interfaceName, intf.interface_type.toLowerCase(), { interface_id: intf.interface_id });
                }
            });
            node.growToFitIterfaces();

            canvas.graph.add(node.render());
        });
    }

    static getDevicesFromData(data) {
        const devices = data.devices || [];
        const IPs = data.deviceIPs || [];
        const interfaces = data.interfaces || [];
        const pciCards = data.pciCards || [];

        return devices.map(device => {
            const deviceIPs = IPs.find(ip => ip.device_serial_number === device.serial_number);
            const deviceInterfaces = interfaces.filter(i => i.device_serial_number === device.serial_number);
            const devicePciCards = pciCards.filter(c => c.device_serial_number === device.serial_number);
            return {
                ...device,
                ips: deviceIPs || [],
                interfaces: deviceInterfaces || [],
                pciCards: devicePciCards || []
            };
        });
    
    }

    static onConnectionSetup(canvas, data) {
        const originalRenderLink = canvas.renderLink;
        canvas.renderLink = function(ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines) {
            let wireColor = color;
            if (link && link.type === 'power') { wireColor = "#F77"; }
            else if (link && link.type === 'rj45') { wireColor = "#4A90E2"; }
            else if (link && link.type === 'rj11') { wireColor = "#50E3C2"; }
            else if (link && link.type === 'sata') { wireColor = "#9013FE"; }
            else if (link && link.type === 'usb') { wireColor = "#B8E986"; }
            else if (link && link.type === 'display') { wireColor = "#F5A623"; }
            else if (link && link.type === 'interface') { wireColor = "#7ED321"; }
            return originalRenderLink.call(this, ctx, a, b, link, skip_border, flow, wireColor, start_dir, end_dir, num_sublines);
        };

        const connections = data.connections || [];
        connections.forEach(conn => {
            const source_interface_id = conn.source_interface_id;
            const destination_interface_id = conn.destination_interface_id;
            
            const source_interface = data.interfaces.find(intf => intf.interface_id === source_interface_id);
            const destination_interface = data.interfaces.find(intf => intf.interface_id === destination_interface_id);

            if (!source_interface || !destination_interface) {
                console.warn('Could not find interfaces for connection:', conn);
                return;
            }

            const sourceDevice = canvas.graph._nodes.find(n => n.serial_number === source_interface.device_serial_number);
            const destinationDevice = canvas.graph._nodes.find(n => n.serial_number === destination_interface.device_serial_number);

            if (sourceDevice && destinationDevice) {
                let sourceSlotIndex = -1;
                let destinationSlotIndex = -1;

                sourceDevice.outputs.forEach((output, index) => {
                    if (output.name.includes(source_interface.label)) {
                        sourceSlotIndex = index;
                    }
                });

                if (sourceSlotIndex === -1) {
                    const inputIndex = sourceDevice.inputs.findIndex(input => 
                        input.name.includes(source_interface.label)
                    );
                    
                    if (inputIndex >= 0) {
                        const inputSlot = sourceDevice.inputs[inputIndex];                        
                        sourceDevice.removeInput(inputIndex);
                        
                        sourceDevice.addOutput(inputSlot.name, inputSlot.type);
                        sourceSlotIndex = sourceDevice.outputs.length - 1; 
                        
                        if (typeof sourceDevice.growToFitIterfaces === 'function') {
                            sourceDevice.growToFitIterfaces();
                        }
                    }
                }

                destinationDevice.inputs.forEach((input, index) => {
                    if (input.name.includes(destination_interface.label)) {
                        destinationSlotIndex = index;
                    }
                });

                if (destinationSlotIndex === -1) {
                    const outputIndex = destinationDevice.outputs.findIndex(output => 
                        output.name.includes(destination_interface.label)
                    );
                    
                    if (outputIndex >= 0) {
                        const outputSlot = destinationDevice.outputs[outputIndex];                        
                        destinationDevice.removeOutput(outputIndex);
                        
                        destinationDevice.addInput(outputSlot.name, outputSlot.type);
                        destinationSlotIndex = destinationDevice.inputs.length - 1; 
                        
                        if (typeof destinationDevice.growToFitIterfaces === 'function') {
                            destinationDevice.growToFitIterfaces();
                        }
                    }
                }
                
                if (sourceSlotIndex >= 0 && destinationSlotIndex >= 0) {
                    const existingConnection = destinationDevice.inputs[destinationSlotIndex].link;
                    if (!existingConnection) {
                        const link = sourceDevice.connect(sourceSlotIndex, destinationDevice, destinationSlotIndex);
                        if (link) {
                            link.type = source_interface.interface_type.toLowerCase();
                        } else {
                            console.warn('Failed to create connection');
                        }
                    }
                } else {
                    console.warn(`Could not find slots: source=${sourceSlotIndex}, destination=${destinationSlotIndex}`);
                    console.warn('Source interface:', source_interface);
                    console.warn('Destination interface:', destination_interface);
                }
            } else {
                console.warn('Could not find devices for connection:', {
                    sourceDevice: source_interface.device_serial_number,
                    destinationDevice: destination_interface.device_serial_number
                });
            }
        });
        
        canvas.setDirty(true, true);
    }
}
if (typeof window !== 'undefined') {
    window.DevicesAsNodes = DevicesAsNodes;
}