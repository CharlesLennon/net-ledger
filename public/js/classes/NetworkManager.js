/**
 * Handles location hierarchy, groups, and node management
 */
class NetworkManager {
  constructor() {
    this.nodeMap = new Map();
    this.serviceNodes = [];
  }

  buildLocationHierarchy(locations, devices) {
    const locationMap = new Map();
    locations.forEach(loc =>
      locationMap.set(loc.location_id, {
        ...loc,
        children: [],
        devices: devices.filter(d => d.location_id === loc.location_id),
      })
    );

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

  createGroup(graph, title, pos, color, layout_direction = 'vertical', parentGroup = null) {
    if (!graph) {
      console.error('Graph is null or undefined');
      return null;
    }

    if (!graph._groups) {
      console.warn('Graph _groups array not available, creating it');
      graph._groups = [];
    }
    if (!graph._nodes) {
      console.warn('Graph _nodes array not available, creating it');
      graph._nodes = [];
    }
    if (!graph.links) {
      console.warn('Graph links object not available, creating it');
      graph.links = {};
    }

    const group = new window.LGraphGroup();
    if (!group) {
      console.error('Failed to create LGraphGroup');
      return null;
    }

    group.title = title;
    group.pos = pos;
    group.color = color;
    group.layout_direction = layout_direction;

    // Add unique ID and parent relationship
    group.id = graph._groups.length + 1; // Simple incremental ID
    if (parentGroup) {
      group.parent_id = parentGroup.id;
    }

    if (graph._groups && Array.isArray(graph._groups)) {
      graph._groups.push(group);
    } else {
      console.warn('Graph _groups is not an array, cannot add group');
      return null;
    }

    return group;
  }

  processLocation(graph, location, startX, startY, parentGroup, nodeMap, serviceNodes, pciCards) {
    const SPACING_CONFIG = {
      DEVICE_TO_SERVICE_HORIZONTAL: 120,
      SERVICE_VERTICAL_SPACING: 80,
      DEVICE_ROW_SPACING: 40,
      GROUP_VERTICAL_SPACING: 50,
      GROUP_PADDING: 10,
      GROUP_TITLE_HEIGHT: 80,
    };

    let currentX = startX;
    let currentY = startY + 20;
    let maxWidth = 0;
    let totalWidth = 0;
    let totalHeight = 0;
    let maxChildHeight = 0;
    let initialX = startX;

    location.devices.forEach(device => {
      const { deviceNode, deviceWidth, deviceHeight } = this.createDeviceAndServiceNodes(
        graph,
        device,
        currentX,
        currentY,
        nodeMap,
        serviceNodes,
        pciCards
      );
      maxWidth = Math.max(maxWidth, deviceWidth);
      currentY += deviceHeight + SPACING_CONFIG.DEVICE_ROW_SPACING;
    });

    totalHeight = currentY - startY;

    location.children.forEach(childLoc => {
      const GROUP_CHILD_COLOR = '#4a5568';
      const childLayoutDirection = childLoc.layout_direction || 'vertical';
      const childGroup = this.createGroup(
        graph,
        childLoc.name,
        [currentX, currentY],
        GROUP_CHILD_COLOR,
        childLayoutDirection,
        parentGroup
      );

      if (!childGroup) {
        console.error('Failed to create child group for location:', childLoc.name);
        return;
      }

      const childGroupContentY = currentY + SPACING_CONFIG.GROUP_TITLE_HEIGHT;
      const childDims = this.processLocation(
        graph,
        childLoc,
        currentX + 20,
        childGroupContentY,
        childGroup,
        nodeMap,
        serviceNodes,
        pciCards
      );

      if (childGroup.size) {
        childGroup.size[0] = Math.max(400, childDims.width + 40);
        childGroup.size[1] = Math.max(
          100,
          childDims.height + SPACING_CONFIG.GROUP_TITLE_HEIGHT + 40
        );
      }

      maxWidth = Math.max(maxWidth, childGroup.size ? childGroup.size[0] : 400);
      maxChildHeight = Math.max(maxChildHeight, childGroup.size ? childGroup.size[1] : 100);

      if (location.layout_direction === 'horizontal') {
        const GROUP_HORIZONTAL_GAP = window.WIRE_ROUTING_CONFIG
          ? window.WIRE_ROUTING_CONFIG.GROUP_HORIZONTAL_GAP
          : 150;
        currentX += (childGroup.size ? childGroup.size[0] : 400) + GROUP_HORIZONTAL_GAP;
      } else {
        currentY +=
          (childGroup.size ? childGroup.size[1] : 100) + SPACING_CONFIG.GROUP_VERTICAL_SPACING;
      }
    });

    if (location.layout_direction === 'horizontal' && location.children.length > 0) {
      const GROUP_HORIZONTAL_GAP = window.WIRE_ROUTING_CONFIG
        ? window.WIRE_ROUTING_CONFIG.GROUP_HORIZONTAL_GAP
        : 150;
      totalWidth = currentX - initialX - GROUP_HORIZONTAL_GAP;
    } else {
      totalWidth = maxWidth;
    }

    if (location.layout_direction === 'horizontal') {
      totalHeight = Math.max(totalHeight, maxChildHeight + SPACING_CONFIG.GROUP_TITLE_HEIGHT + 40);
    } else {
      totalHeight = currentY - startY;
    }

    return { width: totalWidth, height: totalHeight };
  }

  createDeviceAndServiceNodes(graph, device, x, y, nodeMap, serviceNodes, pciCards) {
    const { interfaces, deviceIPs } = this.getJsonData();

    const deviceInterfaces = interfaces.filter(
      i => i.device_serial_number === device.serial_number
    );

    const deviceIPData = deviceIPs.find(d => d.device_serial_number === device.serial_number) || {
      ip_addresses: [],
    };

    const deviceNode = new DeviceNode();
    deviceNode.setDeviceData(device, deviceInterfaces);
    deviceNode.pos = [x, y];
    graph.add(deviceNode);
    nodeMap.set(device.serial_number, deviceNode);

    const SPACING_CONFIG = {
      DEVICE_TO_SERVICE_HORIZONTAL: 120,
      SERVICE_VERTICAL_SPACING: 80,
    };

    let serviceY = y;
    (deviceIPData.ip_addresses || []).forEach(ip => {
      (ip.services || []).forEach(service => {
        const serviceNode = new ServiceNode();
        serviceNode.setServiceData(service, ip.ip_address, service.port_number);
        const serviceX = x + deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL;
        serviceNode.pos = [serviceX, serviceY];
        graph.add(serviceNode);
        serviceNodes.push({
          node: serviceNode,
          deviceSerial: device.serial_number,
          service: service,
        });
        serviceY += SPACING_CONFIG.SERVICE_VERTICAL_SPACING;
      });
    });

    const deviceWidth = deviceNode.size[0] + SPACING_CONFIG.DEVICE_TO_SERVICE_HORIZONTAL + 200;
    const deviceHeight = Math.max(deviceNode.size[1], serviceY - y);

    const devicePciCards = pciCards.filter(
      card => card.device_serial_number === device.serial_number
    );

    devicePciCards.forEach((card, index) => {
      const pciCardNode = new PciCardNode();
      pciCardNode.setPciCardData(card);
      const pciX = x + deviceNode.size[0] + 300 + index * 200;
      pciCardNode.pos = [pciX, y + index * 80];
      graph.add(pciCardNode);
      nodeMap.set(card.card_serial_number, pciCardNode);
    });

    return {
      deviceNode,
      deviceWidth: Math.max(
        deviceWidth,
        devicePciCards.length > 0 ? deviceWidth + 300 + devicePciCards.length * 200 : deviceWidth
      ),
      deviceHeight,
    };
  }

  getJsonData() {
    return {
      locations: window.locationsJson || [],
      devices: window.devicesJson || [],
      interfaces: window.interfacesJson || [],
      connections: window.connectionsJson || [],
      deviceIPs: window.deviceIPsJson || [],
      services: window.servicesJson || [],
      pciSlots: window.pciSlotsJson || [],
      pciCards: window.pciCardsJson || [],
    };
  }
}

window.NetworkManager = NetworkManager;
