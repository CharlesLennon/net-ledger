class CustomMenus {
    static onInit() {

        class CustomLGraphCanvas extends window.LGraphCanvas {
            // Custom functionality can be added here
            // getMenuOptions
            getDefaultMenuOptions(options) {
                if (!options) { options = []; }
                options.push({
                    content: 'example menu item',
                    has_submenu: true,
                    submenu: { 
                        options: [
                            { 
                                content: 'subitem 1',
                                callback: () => alert('subitem 1') 
                            },
                            { 
                                content: 'subitem 2',
                                has_submenu: true,
                                submenu: {
                                    options: [
                                        { content: 'subitem 2.1', callback: () => alert('subitem 2.1') },
                                        { content: 'subitem 2.2', callback: () => alert('subitem 2.2') },
                                    ]
                                }
                            },
                        ]
                    },
                });
                return options;
            }

            safeGetNodeAt(x = null, y = null) {
                let node = null;
                if (this.graph && this.graph.getNodeOnPos && x && y) {
                    node = this.graph.getNodeOnPos(x, y);
                }
                return node;
            }

            getNodeMenuOptions(options, node = null, x = null, y = null) {
                if (!options) { options = []; }
                if(!node){ node = this.safeGetNodeAt(x, y); }
                if(node) {
                    if (node.getMenuOptions) {
                        options = node.getMenuOptions(options);
                    }else{
                        options.push(null,{
                            content: 'Node: ' + node.title,
                            has_submenu: true,
                            submenu: {
                                options: [
                                    {
                                        content: 'Dump',
                                        callback: () => console.table(node)
                                    },
                                ]
                            }
                        });
                    }
                }
                return options;
            }

            safeGetSlotAt(node = null, x = null, y = null) {
                let slot = null;
                if(!node){
                    node = this.safeGetNodeAt(x, y);
                }
                if (node && node.getSlotInPosition && x && y) {
                    slot = node.getSlotInPosition(x, y);
                    LGraphCanvas.active_node = node;
                }
                return slot;
            }

            getSlotMenuOptions(options, slot = null, node = null, x = null, y = null) {
                if (!options) { options = []; }
                if(!slot){ slot = this.safeGetSlotAt(node, x, y); }
                if (slot) {
                    options.push(null); //separator
                    options.push({
                        content: 'example slot item',
                        callback: () => console.log(slot)
                    });
                }
                return options;
            }

            safeGetGroupAt(x = null, y = null) {
                let group = null;
                if (this.graph && this.graph.getGroupOnPos && x && y) {
                    group = this.graph.getGroupOnPos(x, y);
                }
                return group;
            }

            getGroupMenuOptions(options, group = null, x = null, y = null) {
                if (!options) { options = []; }
                if(!group){ group = this.safeGetGroupAt(x, y); }
                if (group) {
                    if(group.getMenuOptions){
                        options = group.getMenuOptions(options);
                    }else{
                        options.push(null,{
                            content: 'Group: ' + group.title,
                            has_submenu: true,
                            submenu: {
                                options: [
                                    {
                                        content: 'Dump',
                                        callback: () => console.table(group)
                                    },
                                ]
                            }
                        });
                    }
                }
                return options;
            }

            

            processContextMenu(node, event) {
                let options = [];
                options = this.getDefaultMenuOptions(options);
                options = this.getGroupMenuOptions(options, this.safeGetGroupAt(event.canvasX, event.canvasY));
                options = this.getNodeMenuOptions(options, node || this.safeGetNodeAt(event.canvasX, event.canvasY));
                options = this.getSlotMenuOptions(options, this.safeGetSlotAt(node, event.canvasX, event.canvasY));

                if (options.length === 0) { return false; }
               
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                var settings = {
                    event: event,
                    callback: super.inner_option_clicked,
                    extra: node,
                    title : 'Options'
                };
                return new LiteGraph.ContextMenu(options, settings, LGraphCanvas.active_canvas.getCanvasWindow());
                
            }   
        }
        window.LGraphCanvas = CustomLGraphCanvas;

        //remove graphcanvas.constructor != LGraphCanvas as it prevents custom canvases
        window.LGraph.prototype.attachCanvas = function(graphcanvas) {
            if (graphcanvas.graph && graphcanvas.graph != this) {
                graphcanvas.graph.detachCanvas(graphcanvas);
            }
            graphcanvas.graph = this;

            if (!this.list_of_graphcanvas) { this.list_of_graphcanvas = []; }
            this.list_of_graphcanvas.push(graphcanvas);
        };

        window.addEventListener("on-location-deleted", (event) => {
            //for now we just let LW do the hard work
            console.log('location deleted', event.detail);
        });
    }

}

if (typeof window !== 'undefined') {
    window.CustomMenus = CustomMenus;
}