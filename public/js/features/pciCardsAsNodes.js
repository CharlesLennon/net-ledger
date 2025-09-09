class PciCardsAsNodes {
    
    static onInit() {
        class pciCardNode extends LiteGraph.LGraphNode {
            horizontal = false;
            resizable = false;
            size = [100, 100];
            group_id = null;
            pci_type = null;

            constructor() {
                super();
                this.title = 'New Card';
            }

            render(){
                var width = this.title.length * 15 ;
                this.size[0] = width;
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
                            const isLastNodeService = lastNode.type === "basic/pci_card";
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
        }
        LiteGraph.registerNodeType("basic/pci_card", pciCardNode);
    }

    static onPCISetup(canvas, data) {
        const customLinkTypeColors = {
            pci_lane: "#e4200eff",
        };

        canvas.default_connection_color_byType = {
            ...canvas.default_connection_color_byType,
            ...customLinkTypeColors,
        };

        const pciSlotsToAddToDevices = data.pciSlots || [];
        const pciCards = data.pciCards || [];

        pciCards.forEach(card => {
            var targetDevice = canvas.graph._nodes.find(n => n.serial_number === card.device_serial_number);
            const group_id = targetDevice ? targetDevice.group_id : null;

            var pciNode = LiteGraph.createNode("basic/pci_card");
            pciNode.title = card.model_name + " " + card.card_serial_number;
            pciNode.group_id = group_id;
            pciNode.device_serial_number = card.device_serial_number;
            pciNode.pci_type = card.type;
            pciNode.moveToGroup();
            canvas.graph.add(pciNode.render());

            pciNode.addInput("PCI Lane", "pci_lane");
            if(pciNode.pci_type === 'Network') {
                //tmporary hardcoded outputs for network cards
                pciNode.addOutput('RJ45-1', 'rj45');
                pciNode.addOutput('RJ45-2', 'rj45');
                pciNode.addOutput('RJ45-3', 'rj45');
                pciNode.addOutput('RJ45-4', 'rj45');
            }


            if (targetDevice) {
                if (!targetDevice.pciCards) {
                    targetDevice.pciCards = [];
                }
                targetDevice.pciCards.push(card);
            }
        });

        pciSlotsToAddToDevices.forEach(slot => {
            var targetDevice = canvas.graph._nodes.find(n => n.serial_number === slot.device_serial_number);
            if (targetDevice) {
                if (!targetDevice.pciSlots) {
                    targetDevice.pciSlots = [];
                }
                targetDevice.addOutput('x' + slot.physical_lane_count + ' ( x' + slot.wired_lane_count + ' wired )', 'pci_lane');
            }
        });
    }

    static onConnectionSetup(canvas, data) {
        const originalRenderLink = canvas.renderLink;
        canvas.renderLink = function(ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, num_sublines) {
            let wireColor = color;
            if (link && link.type === 'pci_lane') { wireColor = "#e4200eff"; }
            return originalRenderLink.call(this, ctx, a, b, link, skip_border, flow, wireColor, start_dir, end_dir, num_sublines);
        };
        const pciCards = data.pciCards || [];

        pciCards.forEach(card => {
            var targetDevice = canvas.graph._nodes.find(n => n.serial_number === card.device_serial_number);
            var pciCardNode = canvas.graph._nodes.find(n => n.device_serial_number === card.device_serial_number && n.type === "basic/pci_card");
            if (targetDevice && pciCardNode) {
                const targetDeviceSlotIndex = targetDevice.outputs.findIndex(output => output.type === 'pci_lane');
                const pciCardSlotIndex = pciCardNode.inputs.findIndex(input => input.type === 'pci_lane');
                targetDevice.connect(targetDeviceSlotIndex, pciCardNode, pciCardSlotIndex);
                canvas.setDirty(true, true);
            }
        });
    }

}

if (typeof window !== 'undefined') {
    window.PciCardsAsNodes = PciCardsAsNodes;
}