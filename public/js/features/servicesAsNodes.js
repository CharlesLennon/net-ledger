class ServicesAsNodes {
    
    static onInit() {
        class serviceNode extends LiteGraph.LGraphNode {
            horizontal = false;
            resizable = false;
            size = [100, 100];
            group_id = null;

            constructor() {
                super();
                this.title = 'New Service';
            }

            render(){
                var width = this.title.length * 10 ;
                this.size[0] = Math.max(100, width);
                this.bgcolor = '#2d3748';
                this.title_color = '#e4870eff';
                this.title_text_color = '#FFFFFF';
                this.onNodeSizeOrPositionChanged();
                return this;
            }

            moveToGroup(margin = [40, 80]) {
                if (this.group_id) {
                    const group = window.canvasInstance.graph._groups.find(g => g.id === this.group_id);
                    if (group) {
                        if (!group.nodes) { group.nodes = []; }
                        if (!group.nodes.includes(this)) { group.nodes.push(this); }
                        
                        if (group.nodes.length > 1) {
                            const lastNode = group.nodes[group.nodes.length - 2];                            
                            const isLastNodeService = lastNode.type === "basic/service";
                            if (isLastNodeService) {
                                this.pos = [lastNode.pos[0], lastNode.pos[1] + lastNode.size[1] + 50];
                            } else {
                                this.pos = [lastNode.pos[0] + lastNode.size[0] + margin[0], lastNode.pos[1]];
                            }
                        } else {
                            this.pos = [group.pos[0] + margin[0], group.pos[1] + margin[1]];
                        }
                        this.onNodeSizeOrPositionChanged();
                        return true;
                    }
                }
                return false;
            }

            onNodeSizeOrPositionChanged() {
                const event = new CustomEvent("nodeSizeOrPositionChanged", { detail: { node: this } });
                window.dispatchEvent(event);
            }

            getMenuOptions(options) {
                if (!options) { options = []; }
                options.push(null,{
                    content: 'Service: ' + this.title,
                    has_submenu: true,
                    submenu: {
                        options: [
                            {
                                content: 'Dump',
                                callback: () => console.table(this)
                            },
                        ]
                    }
                });
                return options;
            }
        }
        LiteGraph.registerNodeType("basic/service", serviceNode);
    }

    static onServiceSetup(canvas, data) {
        const customLinkTypeColors = {
            service: "#e4870eff",
        };

        canvas.default_connection_color_byType = {
            ...canvas.default_connection_color_byType,
            ...customLinkTypeColors,
        };
        const services = data.deviceIPs || [];
        
        services.forEach(service => {
            var targetDevice = canvas.graph._nodes.find(n => n.serial_number === service.device_serial_number);
            if (targetDevice) {
                if (!targetDevice.services) {
                    targetDevice.services = [];
                }
                
                service.ip_addresses.forEach((ipObj, index) => {
                    const IP = ipObj.ip_address;
                    ipObj.services.forEach(svc => {
                        var serviceNode = LiteGraph.createNode("basic/service");
                        serviceNode.title = svc.name + '://' + IP + ':' + svc.port_number;
                        serviceNode.group_id = targetDevice.group_id;
                        serviceNode.device_serial_number = service.device_serial_number;
                        serviceNode.service_ip = IP;
                        serviceNode.service_port = svc.port_number;
                        
                        canvas.graph.add(serviceNode);
                        serviceNode.moveToGroup();
                        serviceNode.addInput(IP + ':' + svc.port_number, 'service');
                        serviceNode.render();
                        
                        targetDevice.services.push(serviceNode);
                    });
                });
            }
        });
    }
    
    static onConnectionSetup(canvas, data) {
        const originalRenderLink = canvas.renderLink;
        canvas.renderLink = function(ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines) {
            let wireColor = color;
            if (link && link.type === 'service') { wireColor = "#e4870e"; }
            return originalRenderLink.call(this, ctx, a, b, link, skip_border, flow, wireColor, start_dir, end_dir, num_sublines);
        };
        
        const services = data.deviceIPs || [];
        services.forEach(deviceData => {
            const targetDevice = canvas.graph._nodes.find(n => n.serial_number === deviceData.device_serial_number);
            if (!targetDevice) return;
            
            if (!targetDevice.outputs.some(output => output.type === 'service')) {
                targetDevice.addOutput('services', 'service');
            }
            const deviceSlotIndex = targetDevice.outputs.findIndex(output => output.type === 'service');
            
            deviceData.ip_addresses.forEach(ipObj => {
                ipObj.services.forEach(svc => {
                    const serviceNode = canvas.graph._nodes.find(n => 
                        n.device_serial_number === deviceData.device_serial_number && 
                        n.type === "basic/service" &&
                        n.service_ip === ipObj.ip_address &&
                        n.service_port === svc.port_number
                    );
                    
                    if (serviceNode) {
                        const serviceSlotIndex = serviceNode.inputs.findIndex(input => input.type === 'service');
                        
                        if (serviceSlotIndex >= 0 && deviceSlotIndex >= 0) {
                            const existingConnection = serviceNode.inputs[serviceSlotIndex].link;
                            if (!existingConnection) {
                                targetDevice.connect(deviceSlotIndex, serviceNode, serviceSlotIndex);
                            }
                        }
                    }
                });
            });
            
            canvas.setDirty(true, true);
        });
    }
}

if (typeof window !== 'undefined') {
    window.ServicesAsNodes = ServicesAsNodes;
}