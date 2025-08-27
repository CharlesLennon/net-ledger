[Back to README](README.md)
# I. Project Overview
This document delineates the design and implementation blueprint for Net Ledger, a comprehensive system for network inventory and asset management. The foundational element of this project is a relational database engineered to meticulously track all physical and logical assets within a network infrastructure. A forthcoming phase will incorporate automated network discovery to enhance data accuracy and reduce manual entry, as well as peer-to-peer data sharing.
## Project Nomenclature
The designation Net Ledger was selected to precisely convey the system's core function: to serve as a verifiable, authoritative, and exhaustive repository of all network assets. "Net" denotes the network, while "Ledger" signifies a reliable book of record, thereby establishing a singular source of truth for all assets.
## Strategic Objectives:
*   **Precise Asset Tracking**: To establish a single, authoritative source for all network devices, cards, and interfaces.
*   **Hierarchical Location Management**: To facilitate the tracking of devices within a nested locational hierarchy (e.g., room > rack > rack unit).
*   **Automated Device Provisioning**: To enable the rapid addition of new devices using templates with predefined specifications.
*   **Connection Mapping**: To allow for the visualization and querying of physical and logical network connections among devices.
*   **Automated Network Discovery**: To implement a mechanism for automatically scanning the network to detect devices and retrieve their data, thereby enhancing the efficiency and accuracy of the inventory process.
*   **Peer-to-Peer Data Sharing**: To enable multiple instances of Net Ledger to discover each other and exchange asset data.
*   **Local Host Identification**: To automatically detect the IP address of the local device and represent it as a clearly identifiable, distinct node within the network visualization.
# II. Database Schema
The database will be structured in accordance with the finalized schema, which is well-suited for a relational database. The schema has been refined to accommodate the critical use case of components, such as PCIe cards, being removed from a device and placed in storage, in addition to supporting historical data tracking and multi-homed services.
## Entities
### Location 🏠
*   `location_id` (Primary Key)
*   `name`
*   `parent_location_id` (Foreign Key, references `location_id`)
### Device 💻
*   `serial_number` (Primary Key)
*   `model_name`
*   `location_id` (Foreign Key)
*   `template_id` (Foreign Key, references `Device_Template`)
### Device_Template 📜
*   `template_id` (Primary Key)
*   `model_name`
*   `manufacturer`
*   `form_factor`
*   `specifications_json` (Stores default configurations in JSON format)
### PCIe_Slot ⚙️
*   `slot_id` (Primary Key)
*   `device_serial_number` (Foreign Key)
*   `physical_lane_count`
*   `wired_lane_count`
### PCIe_Card 🔌
*   `card_serial_number` (Primary Key)
*   `model_name`
*   `type`
*   `slot_id` (FK) <-- Nullable, allowing for cards not installed in a device
*   `location_id` (FK) <-- Nullable, to track cards in storage
### Interface ↔️
*   `interface_id` (Primary Key)
*   `interface_type`
*   `label`
*   `device_serial_number` (Foreign Key)
*   `card_serial_number` (Foreign Key)
### Service ☁️
*   `service_id` (Primary Key)
*   `name`
### IP_Address 🌐
*   `ip_address_id` (Primary Key)
*   `ip_address` (string)
## Relational Tables
These tables are engineered to manage relationships between entities that are subject to temporal changes or are characterized as many-to-many.
### Connection 🔄
*   `connection_id` (Primary Key)
*   `source_interface_id` (Foreign Key)
*   `destination_interface_id` (Foreign Key)
*   `cable_type`
### Device_IP
*   `device_serial_number` (Foreign Key)
*   `ip_address_id` (Foreign Key)
This table links a device to its IP addresses, enabling a single device to have multiple IP addresses.
### Service_IP_Port
*   `service_id` (Foreign Key)
*   `ip_address_id` (Foreign Key)
*   `port_number` (integer)
This table links an IP address to a specific service and its corresponding port, enabling a single IP to host multiple services on different ports.
## Auditing and History
To ensure the traceability of historical changes, a new table will be implemented to log all modifications to key asset attributes.
### History 🕰️
*   `history_id` (Primary Key)
*   `entity_type` (e.g., 'Device', 'PCIe_Card', 'Interface')
*   `entity_id` (The primary key of the modified entity)
*   `attribute_changed` (e.g., 'location_id', 'slot_id', 'ip_address')
*   `old_value`
*   `new_value`
*   `timestamp`
## The JSON Field
The `specifications_json` field within the `Device_Template` table will contain a JSON object detailing all default components. This design facilitates the automated provisioning of new devices based upon a predefined template.
### Example JSON
```json
{
  "pcie_slots": [
    {
      "physical_lane_count": "x16",
      "wired_lane_count": "x8"
    }
  ],
  "interfaces": [
    {
      "label": "RJ45-1",
      "interface_type": "RJ45",
      "is_onboard": true
    },
    {
      "label": "USB-A",
      "interface_type": "USB 2.0",
      "is_onboard": true
    },
    {
      "label": "VGA",
      "interface_type": "VGA",
      "is_onboard": true
    }
  ]
}
```
# III. Task List and Milestones
## Phase 1: Database and Backend (Laravel)
### Milestone 1: Schema Implementation
*   To create migrations for all tables, defining primary and foreign key constraints.
*   To implement unique indexes where deemed necessary (e.g., on `serial_number`).
### Milestone 2: Eloquent Models & Relationships
*   To create Eloquent models for each respective table.
*   To define all model relationships (e.g., `hasMany`, `belongsTo`, `belongsToMany`).
### Milestone 3: Template Provisioning Logic
*   To establish a controller or service class to manage device creation.
*   To implement logic that reads the `specifications_json` from `Device_Template` and generates corresponding `PCIe_Slot` and `Interface` records.
## Phase 2: Frontend & UI (Livewire, Alpine.js, Tailwind CSS)
### Milestone 4: Livewire Components
*   To construct Livewire components for CRUD operations on each entity (e.g., `CreateDevice`, `EditLocation`, `ManageInterfaces`).
*   To utilize Alpine.js for interactive user interface elements (e.g., modal dialogs, dynamic form fields, dropdowns).
### Milestone 5: TALL Stack Integration
*   To employ Tailwind CSS for all styling and layout, ensuring a consistent and responsive design.
*   To implement Livewire's reactive data binding to handle form inputs and display changes without full-page reloads.
### Milestone 6: Network Visualization
To develop a Livewire component that fetches connection data and a JavaScript library to render a dynamic network graph. The library of choice is `litegraph.js`, which will be used to create an interactive node-based editor for the network topology.
**Rationale for `litegraph.js`**: This library was selected due to its flexibility and extensibility, which are essential for fulfilling the visualization requirements of this project. It provides core functionality for creating a network graph with customizable nodes and links, and it allows for the grouping of nodes.
**UI Representation**:
*   Each `Location` will be a distinct group in the `litegraph.js` editor, visually representing the physical hierarchy. The `LGraphGroup` class will be utilized for this purpose.
*   Each `Device` and `Service` will be a node within a group, using the `LGraphNode` class.
*   Connections between `IP_Address` and `Service` will be represented by color-coded wires, whose colors can be dynamically set based on the `ip_address` or service type.
### Milestone 6a: Local Host Identification
To implement a component that automatically detects the client's public IP address and represents it as a distinct, styled node in the `litegraph.js` editor. This node will be visually different to signify that it is the user's current viewing device.
To implement the `vis-timeline` to visualize the historical data from the `History` table. This functionality will enable users to observe how assets have been relocated or modified over time. The documentation for `vis-timeline` provides a comprehensive reference: https://visjs.github.io/vis-timeline/docs/timeline/
## Phase 3: Automated Network Discovery
This phase will introduce functionality for automated network scanning to streamline the asset inventory process.
### Milestone 7: Core Scanning Engine
*   To develop a backend service or integrate a third-party tool to perform network scans using protocols such as SNMP, LLDP, and ARP.
*   The service will be responsible for sending queries and receiving data from devices.
### Milestone 8: Data Normalization and Mapping
*   To implement logic that parses the raw data received from network scans.
*   The parsed data will be mapped to the `Device`, `PCIe_Card`, `Interface`, and `Location` database entities. This will require robust validation to ensure data integrity before it is added to the ledger.
### Milestone 9: User Interface for Discovery
*   To create a Livewire component that allows a user to initiate a network scan and monitor its progress.
*   The component will display a list of discovered devices for user review and approval before they are added or updated in the database.
## Phase 4: Peer-to-Peer Networking
This phase will introduce the capability for multiple instances of Net Ledger to discover and exchange asset data.
### Milestone 10: Host Discovery Protocol
*   To implement a discovery protocol (e.g., using multicast or broadcast messages) that allows Net Ledger instances to find each other on the local network.
### Milestone 11: Data Synchronization
*   To develop a synchronization mechanism that allows Net Ledger instances to share their local data. This will require logic to handle conflicts and merge data from different hosts.
### Milestone 12: User Interface for Peer-to-Peer
*   To add a visual indicator in the UI, such as a distinct node icon from Google Icons, to show the local Net Ledger instance and any other discovered Net Ledger hosts on the network.
*   The UI will allow users to initiate and manage data synchronization between hosts.
# IV. Technology Stack
*   **Backend Framework**: Laravel (for routing, Eloquent ORM, and database management).
*   **Frontend Stack**: TALL
    *   **Tailwind CSS**: For all styling.
    *   **Alpine.js**: For client-side interactivity.
    *   **Livewire**: For building dynamic interfaces with server-side rendering.
*   **Database**: SQLite
    *   **Note**: SQLite is an optimal choice for this project due to its file-based nature, which simplifies packaging and distribution without the need for a separate database server.
*   **Package Recommendations**:
    *   **Laravel Livewire**: The core of the frontend interactivity.
    *   **Laravel Spatie JSON API**: A potential package for advanced JSON API requirements.
    *   **Laravel Telescope**: For the purpose of debugging and monitoring application performance.
[Back to README](README.md)
