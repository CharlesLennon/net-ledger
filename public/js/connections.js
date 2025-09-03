(function () {
  'use strict';
  function createPhysicalConnections(graph, connections, interfaces, nodeMap) {
    const wireIndices = new Map();
    const powerWireIndices = new Map();
    connections.forEach((connection, index) => {
      const sourceInterface = interfaces.find(
        i => i.interface_id === connection.source_interface_id
      );
      const destInterface = interfaces.find(
        i => i.interface_id === connection.destination_interface_id
      );
      if (!sourceInterface || !destInterface) return;
      const sourceDevice = nodeMap.get(sourceInterface.device_serial_number);
      const destDevice = nodeMap.get(destInterface.device_serial_number);
      if (!sourceDevice || !destDevice) return;
      const nodePairKey = `${sourceInterface.device_serial_number}-${destInterface.device_serial_number}`;
      const reverseKey = `${destInterface.device_serial_number}-${sourceInterface.device_serial_number}`;
      if (!wireIndices.has(nodePairKey) && !wireIndices.has(reverseKey)) {
        wireIndices.set(nodePairKey, 0);
      }
      const currentIndex = wireIndices.get(nodePairKey) || wireIndices.get(reverseKey) || 0;
      wireIndices.set(nodePairKey, currentIndex + 1);
      let powerIndex = null;
      if (sourceInterface.interface_type === 'Power') {
        const powerKey = `${connection.source_interface_id}-${connection.destination_interface_id}`;
        if (!powerWireIndices.has(powerKey)) {
          powerWireIndices.set(powerKey, powerWireIndices.size);
        }
        powerIndex = powerWireIndices.get(powerKey);
      }
      const sourceSlot = sourceDevice.outputs.findIndex(o => {
        const outputName = o.name || '';
        if (sourceInterface.interface_type === 'Power') {
          if (outputName === `${sourceInterface.label} (${sourceInterface.interface_type})`)
            return true;
          if (
            sourceInterface.label.startsWith('outlet-') &&
            outputName.includes(sourceInterface.label)
          )
            return true;
          if (
            sourceInterface.label.startsWith('main-power-') &&
            outputName.includes(sourceInterface.label)
          )
            return true;
          return outputName.includes('power') && outputName !== 'power';
        }
        return (
          outputName.includes(sourceInterface.label) ||
          sourceInterface.label.includes(outputName.split(' ')[0])
        );
      });
      if (sourceSlot < 0) {
        if (
          sourceInterface.interface_type === 'Power' &&
          sourceInterface.label.startsWith('outlet-')
        ) {
          sourceDevice.addOutput(
            `${sourceInterface.label} (${sourceInterface.interface_type})`,
            'interface'
          );
          const newSourceSlot = sourceDevice.outputs.length - 1;
          let destSlot = destDevice.inputs.findIndex(i => {
            const inputName = i.name || '';
            if (inputName === `${destInterface.label} (${destInterface.interface_type})`)
              return true;
            if (
              inputName.includes(destInterface.label) &&
              inputName.includes(destInterface.interface_type)
            )
              return true;
            return inputName.includes('power') && inputName !== 'power';
          });
          if (destSlot < 0) {
            destDevice.addInput(
              `${destInterface.label} (${destInterface.interface_type})`,
              'interface'
            );
            destSlot = destDevice.inputs.length - 1;
          }
          const link = sourceDevice.connect(newSourceSlot, destDevice, destSlot);
          if (link) {
            const cableColor = window.getCableColor
              ? window.getCableColor(connection.cable_type)
              : null;
            link.color =
              cableColor || (window.CONNECTION_COLORS ? window.CONNECTION_COLORS.POWER : '#ef4444');
            if (typeof LiteGraph !== 'undefined') {
              link.start_dir = LiteGraph.LEFT;
              link.end_dir = LiteGraph.LEFT;
            } else {
              link.start_dir = 3;
              link.end_dir = 3;
            }
            link.isPowerConnection = true;
            link.route_along_groups = true;
            link.wireIndex = powerIndex !== null ? powerIndex : currentIndex;
            if (powerIndex !== null) {
              link.powerChannelIndex = powerIndex;
            }
            link.connection_id = connection.connection_id;
          }
          return;
        }
        return;
      }
      let destSlot = destDevice.inputs.findIndex(i => {
        const inputName = i.name || '';
        if (destInterface.interface_type === 'Power') {
          if (inputName === `${destInterface.label} (${destInterface.interface_type})`) return true;
          if (
            inputName.includes(destInterface.label) &&
            inputName.includes(destInterface.interface_type)
          )
            return true;
          return inputName.includes('power') && inputName !== 'power';
        }
        return (
          inputName.includes(destInterface.label) ||
          destInterface.label.includes(inputName.split(' ')[0])
        );
      });
      if (destSlot < 0) {
        if (destInterface.interface_type === 'Power') {
          destDevice.addInput(
            `${destInterface.label} (${destInterface.interface_type})`,
            'interface'
          );
          destSlot = destDevice.inputs.length - 1;
        } else {
          destDevice.addInput(
            `${destInterface.label} (${destInterface.interface_type})`,
            'interface'
          );
          destSlot = destDevice.inputs.length - 1;
        }
      }
      const link = sourceDevice.connect(sourceSlot, destDevice, destSlot);
      if (link) {
        // Set routing properties on the link object
        const isPowerConnection = sourceInterface.interface_type === 'Power';
        link.isPowerConnection = isPowerConnection;
        link.route_along_groups = isPowerConnection; // Enable group routing for power connections
        
        const cableColor = window.getCableColor
          ? window.getCableColor(connection.cable_type)
          : null;
        const defaultColor =
          sourceInterface.interface_type === 'Power'
            ? window.CONNECTION_COLORS
              ? window.CONNECTION_COLORS.POWER
              : '#ef4444'
            : window.CONNECTION_COLORS
              ? window.CONNECTION_COLORS.INTERFACE_PHYSICAL
              : '#10b981';
        link.color = cableColor || defaultColor;
        if (typeof LiteGraph !== 'undefined') {
          if (sourceInterface.interface_type === 'Power') {
            link.start_dir = LiteGraph.LEFT;
            link.end_dir = LiteGraph.LEFT;
            link.isPowerConnection = true;
          } else {
            link.start_dir = LiteGraph.RIGHT;
            link.end_dir = LiteGraph.LEFT;
          }
        } else {
          if (sourceInterface.interface_type === 'Power') {
            link.start_dir = 3;
            link.end_dir = 3;
            link.isPowerConnection = true;
          } else {
            link.start_dir = 4;
            link.end_dir = 3;
          }
        }
        link.route_along_groups = true;
        link.wireIndex = powerIndex !== null ? powerIndex : currentIndex;
        if (powerIndex !== null) {
          link.powerChannelIndex = powerIndex;
        }
        if (!link.isPowerConnection) {
          link.networkChannelIndex = powerIndex !== null ? powerIndex : currentIndex;
        }
        link.connection_id = connection.connection_id;
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
      const device = window.getJsonData
        ? window.getJsonData().devices.find(d => d.serial_number === deviceSerial)
        : null;
      const isPDU = device && device.model_name && device.model_name.toLowerCase().includes('pdu');
      const isMainPower =
        device &&
        device.model_name &&
        device.model_name.toLowerCase().includes('main-power-source');
      if (isPDU || isMainPower) {
        return;
      }
      const availableInterfaces = isPDU
        ? deviceNode.outputs.filter(o => o.name && o.name.toLowerCase().includes('power'))
        : deviceNode.outputs.filter(o => o.name && !o.name.toLowerCase().includes('power'));
      if (!availableInterfaces.length) return;
      services.forEach((serviceData, index) => {
        const outputSlotObject = availableInterfaces[index % availableInterfaces.length];
        const actualOutputSlot = deviceNode.outputs.findIndex(
          o => o.name === outputSlotObject.name
        );
        if (actualOutputSlot !== -1) {
          const link = deviceNode.connect(actualOutputSlot, serviceData.node, 0);
          if (link) {
            link.color = window.CONNECTION_COLORS
              ? window.CONNECTION_COLORS.INTERFACE_LOGICAL
              : '#3b82f6';
          }
        }
      });
    });
  }
  function createPciConnections(graph, pciCards, pciSlots, nodeMap) {
    pciCards.forEach(card => {
      const deviceNode = nodeMap.get(card.device_serial_number);
      const pciCardNode = nodeMap.get(card.card_serial_number);
      if (!deviceNode || !pciCardNode) return;
      const slot = pciSlots.find(s => s.slot_id === card.slot_id);
      if (!slot) return;
      const pciOutputIndex = deviceNode.outputs.findIndex(
        output => output.name && output.name.toLowerCase().includes('pci')
      );
      if (pciOutputIndex === -1) {
        deviceNode.addOutput(`PCI Lane (${slot.wired_lane_count}x)`, 'pci_lane');
        const newPciOutputIndex = deviceNode.outputs.length - 1;
        const link = deviceNode.connect(newPciOutputIndex, pciCardNode, 0);
        if (link) {
          link.color = window.CONNECTION_COLORS
            ? window.CONNECTION_COLORS.INTERFACE_LOGICAL
            : '#3b82f6';
        }
      } else {
        const link = deviceNode.connect(pciOutputIndex, pciCardNode, 0);
        if (link) {
          link.color = window.CONNECTION_COLORS
            ? window.CONNECTION_COLORS.INTERFACE_LOGICAL
            : '#3b82f6';
        }
      }
      if (card.type === 'Network') {
        const rj45Outputs = pciCardNode.outputs.filter(
          output => output.name && output.name.startsWith('RJ45')
        );
        rj45Outputs.forEach((rj45Output, index) => {
          const allDeviceNodes = Array.from(nodeMap.values()).filter(
            node =>
              node &&
              node.title &&
              typeof node.title === 'string' &&
              (node.title.toLowerCase().includes('switch') ||
                node.title.toLowerCase().includes('cisco') ||
                node.title.toLowerCase().includes('netgear') ||
                node.title.includes('SW001234') ||
                node.title.includes('SW002345') ||
                (node.deviceData &&
                  node.deviceData.model_name &&
                  node.deviceData.model_name.toLowerCase().includes('switch')))
          );
          if (allDeviceNodes.length > 0 && index < allDeviceNodes.length) {
            const switchNode = allDeviceNodes[index];
            const interfaceName = `eth${index + 1} (RJ45)`;
            let interfaceInputIndex = switchNode.inputs.findIndex(
              input => input.name && input.name === interfaceName
            );
            if (interfaceInputIndex === -1) {
              switchNode.addInput(interfaceName, 'interface');
              interfaceInputIndex = switchNode.inputs.length - 1;
            }
            const rj45OutputIndex = pciCardNode.outputs.findIndex(output => output === rj45Output);
            if (rj45OutputIndex !== -1 && interfaceInputIndex !== -1) {
              const link = pciCardNode.connect(rj45OutputIndex, switchNode, interfaceInputIndex);
              if (link) {
                let cableType = 'cat6';
                if (card.model_name && card.model_name.toLowerCase().includes('10gbe')) {
                  cableType = 'cat6';
                } else if (card.model_name && card.model_name.toLowerCase().includes('fiber')) {
                  cableType = 'fiber';
                }
                link.color = window.getCableColor ? window.getCableColor(cableType) : '#8b5cf6';
                link.type = 'copper';
                link.route_along_groups = true;
                link.wireIndex = index;
                if (!link.isPowerConnection) {
                  link.networkChannelIndex = index;
                }
              }
            }
          }
        });
      }
    });
  }
  function getCableColor(cableType) {
    const CONNECTION_COLORS = window.CONNECTION_COLORS || {
      CABLE_CAT6: '#8b5cf6',
      CABLE_CAT5E: '#06b6d4',
      CABLE_FIBER: '#f59e0b',
      CABLE_COPPER: '#10b981',
      CABLE_COAXIAL: '#ef4444',
      POWER: '#ef4444',
      INTERFACE_PHYSICAL: '#10b981',
    };
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
      case 'power':
        return CONNECTION_COLORS.POWER;
      default:
        return CONNECTION_COLORS.INTERFACE_PHYSICAL;
    }
  }
  
  // Group-aware routing functions
  function calculateOrthogonalPath(startPos, endPos, startDir, endDir, wireIndex = 0, link = null) {
    const points = [];
    const startX = startPos[0];
    const startY = startPos[1];
    const endX = endPos[0];
    const endY = endPos[1];
    
    points.push({ x: startX, y: startY });

    // Check if this connection should use group-aware routing
    const useGroupRouting = link && link.route_along_groups === true;
    
    if (!useGroupRouting) {
      // Default simple routing for service connections and non-group connections
      const routingX = startX < endX ? endX - 100 : endX + 100;
      points.push({ x: routingX, y: startY });
      points.push({ x: routingX, y: endY });
      points.push({ x: endX, y: endY });
      return points;
    }

    // Get routing config from global scope
    const config = window.WIRE_ROUTING_CONFIG || {
      GROUP_HORIZONTAL_GAP: 300,
      GROUP_WIRE_OFFSET: 20
    };

    // Find the target group - prefer the smallest/most specific group
    const allGroups = window.canvasInstance?.graph?._groups || [];
    let destGroup = null;
    let smallestGroupSize = Infinity;
    
    // Try to find destination group by position - prefer smallest group
    for (const group of allGroups) {
      if (isPositionInGroup(endPos, group)) {
        const groupSize = (group.size ? group.size[0] * group.size[1] : 40000);
        if (groupSize < smallestGroupSize) {
          destGroup = group;
          smallestGroupSize = groupSize;
        }
      }
    }

    // If no group found, try to find by nearby position with tolerance - prefer smallest group
    if (!destGroup) {
      smallestGroupSize = Infinity;
      for (const group of allGroups) {
        if (isPositionNearGroup(endPos, group, 200)) {
          const groupSize = (group.size ? group.size[0] * group.size[1] : 40000);
          if (groupSize < smallestGroupSize) {
            destGroup = group;
            smallestGroupSize = groupSize;
          }
        }
      }
    }

    if (destGroup) {
      // Group-aware routing: horizontal TOWARD target first, then vertical
      const groupX = destGroup.pos[0];
      const groupWidth = destGroup.size ? destGroup.size[0] : 200;
      const isPowerConnection = link && link.isPowerConnection;
      
      // FIXED: Route toward the target group horizontally first
      let routingX;
      
      // Determine if we're routing from left to right or right to left
      const isRoutingRightward = startX < endX;
      
      if (isRoutingRightward) {
        // Routing toward the group from the left - go to the appropriate edge of target group
        if (isPowerConnection) {
          routingX = groupX - config.GROUP_HORIZONTAL_GAP - (wireIndex * config.GROUP_WIRE_OFFSET);
        } else {
          routingX = groupX + groupWidth + config.GROUP_HORIZONTAL_GAP + (wireIndex * config.GROUP_WIRE_OFFSET);
        }
      } else {
        // Routing toward the group from the right - go to the appropriate edge of target group  
        if (isPowerConnection) {
          routingX = groupX - config.GROUP_HORIZONTAL_GAP - (wireIndex * config.GROUP_WIRE_OFFSET);
        } else {
          routingX = groupX - config.GROUP_HORIZONTAL_GAP - (wireIndex * config.GROUP_WIRE_OFFSET);
        }
      }
      
      // Route horizontally first
      points.push({ x: routingX, y: startY });
      
      // Then route vertically
      points.push({ x: routingX, y: endY });
    } else {
      // Fallback: still use horizontal-first routing
      const routingX = startX < endX ? endX - 100 : endX + 100;
      points.push({ x: routingX, y: startY });
      points.push({ x: routingX, y: endY });
    }

    // Final connection to destination
    points.push({ x: endX, y: endY });
    return points;
  }

  function isPositionInGroup(pos, group) {
    if (!group || !group.pos || !group.size) {
      return false;
    }
    
    const groupX = group.pos[0];
    const groupY = group.pos[1];
    const groupWidth = group.size[0] || 200;
    const groupHeight = group.size[1] || 100;
    
    return (
      pos[0] >= groupX &&
      pos[0] <= groupX + groupWidth &&
      pos[1] >= groupY &&
      pos[1] <= groupY + groupHeight
    );
  }

  function isPositionNearGroup(pos, group, tolerance = 100) {
    if (!group || !group.pos || !group.size) {
      return false;
    }
    
    const groupX = group.pos[0];
    const groupY = group.pos[1];
    const groupWidth = group.size[0] || 200;
    const groupHeight = group.size[1] || 100;
    
    return (
      pos[0] >= groupX - tolerance &&
      pos[0] <= groupX + groupWidth + tolerance &&
      pos[1] >= groupY - tolerance &&
      pos[1] <= groupY + groupHeight + tolerance
    );
  }

  window.createPhysicalConnections = createPhysicalConnections;
  window.createLogicalServiceConnections = createLogicalServiceConnections;
  window.createPciConnections = createPciConnections;
  window.getCableColor = getCableColor;
  window.calculateOrthogonalPath = calculateOrthogonalPath;
})();
