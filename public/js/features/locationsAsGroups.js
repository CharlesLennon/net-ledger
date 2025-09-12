class LocationsAsGroups {
    static onInit() {
        window.addEventListener("groupDeleted", (event) => {
           //remove from canvas
           //tell all nodes in group to remove group_id and reposition 
           //tell livewire to remove from db
        });
        
    }

    
    static onConfigLoad(config) {
        config.push([
            {
                name: 'locationGroupSpacingVertical',
                value: 400,
                type: 'number'
            },
        ]);
        config.push([ 
            {
                name: 'locationGroupSpacingHorizontal',
                value: 1600,
                type: 'number'
            }
        ]);
        return config;
    }

    static onDataLoad(data) {
        const locations = this.convertToNestedLocations(data.locations) || [];
        const canvas = window.canvasInstance;
        
        let x = 50;
        let y = 50;
        const spacingVertical = safeGetConfig('LocationsAsGroups.locationGroupSpacingVertical', 400);
        const spacingHorizontal = safeGetConfig('LocationsAsGroups.locationGroupSpacingHorizontal', 1300);

        for (const location of locations) {
            this.createGroupRecursively(location, canvas, x, y, spacingVertical, spacingHorizontal);
        }

        canvas.setDirty(true, true);

        return data;
    }

    static convertToNestedLocations(locations) {
        const locationMap = {};
        const rootLocations = [];
        locations.forEach(loc => {
            loc.children = [];
            locationMap[loc.location_id] = loc;
        });
        locations.forEach(loc => {
            if (loc.parent_location_id && locationMap[loc.parent_location_id]) {
                locationMap[loc.parent_location_id].children.push(loc);
            } else {
                rootLocations.push(loc);
            }
        });
        return rootLocations;
    }

    static createGroupRecursively(location, canvas, x, y, spacingVertical, spacingHorizontal) {
        const group = new window.LiteGraph.LGraphGroup();
        group.getMenuOptions = (options) => {
            options.push(null,{
                content: 'Group: ' + group.title,
                has_submenu: true,
                submenu: {
                    options: [
                        {
                            content: 'Edit',
                            has_submenu: true,
                            submenu: {
                                options: [
                                    {
                                        content: 'Title',
                                        callback: () => Livewire.dispatch('on-location-title-changed', { id: group.id, current: group.title, new: null })
                                    },
                                    {
                                        content: 'Parent',
                                        callback: () => Livewire.dispatch('on-location-parent-changed', { id: group.id, current: group.parent_location_id, new: null })
                                    },
                                    {
                                        content: 'Switch Direction',
                                        callback: () => Livewire.dispatch('on-location-direction-inverted', { location_id: group.id })
                                    },
                                ]
                            }
                        },
                        null,
                        {
                            content: 'Clone',
                            callback: () => Livewire.dispatch('on-location-cloned', { location_id: group.id })
                        },
                        {
                            content: 'Delete',
                            callback: () => Livewire.dispatch('on-location-deleted', { location_id: group.id })
                        },
                        {
                            content: 'Dump',
                            callback: () => console.table(group)
                        },
                        
                    ]
                }
            });
            return options;
        };
        group.collapsed = [];
        group.nodes = [];
        group.title = location.name;
        group.pos = [x, y];
        group.size = [200, 100];
        group.collapsed = false;
        group.location_id = location.location_id;
        group.parent_location_id = location.parent_location_id;
        group.color = location.color || '#AAAAAA'; 
        group.id = canvas.graph._groups.length + 1;
        group.layout_direction = location.layout_direction || 'vertical'; 
        canvas.graph._groups.push(group);

        let childX = x + 100; 
        let childY = y + 40;
        
        location.children.forEach((childLoc, index) => {
            if (group.layout_direction === 'horizontal') {
                this.createGroupRecursively(childLoc, canvas, childX + (index * spacingHorizontal), childY, spacingVertical);
            } else {
                this.createGroupRecursively(childLoc, canvas, childX, childY + (index * spacingVertical), spacingVertical);
            }
        });

        group.children = canvas.graph._groups.filter(group => group.parent_location_id === location.location_id);

        this.makeGroupFitToChildrenGroups(group);
        this.addMarginToGroup(group);

        if (!location.parent_location_id) {
            if (!window.rootGroups) { window.rootGroups = []; }
            window.rootGroups.push(group);
        }
                
        return group;
    }

    static makeGroupFitToChildrenGroups(group) {
        if (group.children.length > 0) {
            let minX = group.children[0].pos[0];
            let minY = group.children[0].pos[1];
            let maxX = group.children[0].pos[0] + group.children[0].size[0];
            let maxY = group.children[0].pos[1] + group.children[0].size[1];
            group.children.forEach(child => {
                if (child.pos[0] < minX) minX = child.pos[0];
                if (child.pos[1] < minY) minY = child.pos[1];
                if (child.pos[0] + child.size[0] > maxX) maxX = child.pos[0] + child.size[0];
                if (child.pos[1] + child.size[1] > maxY) maxY = child.pos[1] + child.size[1];
            });
            group.pos = [minX, minY];
            group.size = [maxX - minX, maxY - minY];
        }
    }

    static addMarginToGroup(group, margin = 40) {
        group.pos[0] -= margin;
        group.pos[1] -= margin;
        group.size[0] += margin * 2;
        group.size[1] += margin * 2;
    }

    static nodeSizeOrPositionChanged(event) {
        const node = event.detail.node;
        if (node.group_id) {
            const group = window.canvasInstance.graph._groups.find(g => g.id === node.group_id);
            if (group) {
                this.makeGroupFitToNodes(group, node);
                this.upDateParentGroupsRecursively(group);
                window.canvasInstance.setDirty(true, true);
            }
        }
    }

    static upDateParentGroupsRecursively(group) {
        this.makeGroupFitToChildrenGroups(group);
        this.addMarginToGroup(group);
        if (group.parent_location_id) {
            const parentGroup = window.canvasInstance.graph._groups.find(g => g.location_id === group.parent_location_id);
            if (parentGroup) {
                this.upDateParentGroupsRecursively(parentGroup);
            }
        }
    }

    static makeGroupFitToNodes(group, changedNode = null) {
        if (changedNode && !group.nodes.includes(changedNode)) { group.nodes.push(changedNode); }
        if (!group.nodes || group.nodes.length === 0) { return; }
        
        let minX = null;
        let minY = null;
        let maxX = null;
        let maxY = null;

        group.nodes.forEach(node => {
            if (minX === null || node.pos[0] < minX) { minX = node.pos[0]; }
            if (minY === null || node.pos[1] < minY) { minY = node.pos[1]; }
            if (maxX === null || (node.pos[0] + node.size[0]) > maxX) { maxX = node.pos[0] + node.size[0]; }
            if (maxY === null || (node.pos[1] + node.size[1]) > maxY) { maxY = node.pos[1] + node.size[1]; }
        });

        if (minX !== null && minY !== null && maxX !== null && maxY !== null) {
            group.pos = [minX, minY]; 
            group.size = [maxX - minX, maxY - minY];
        }

        this.addMarginToGroup(group);
    }

    

}

if (typeof window !== 'undefined') {
    window.LocationsAsGroups = LocationsAsGroups;
    window.addEventListener("nodeSizeOrPositionChanged", (event) => {
        window.LocationsAsGroups.nodeSizeOrPositionChanged(event);
    });
}



