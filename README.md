# Net Ledger

[View Project Plan](projectPlan.md)

A comprehensive network inventory and asset management system, serving as a single source of truth for all network devices, services, and connections.

✨ Features

*   **Precise Asset Tracking**: Meticulously track and manage all network devices, cards, and interfaces.
*   **Hierarchical Location Management**: Organize devices within a logical, nested location hierarchy (e.g., room > rack > rack unit).
*   **Automated Device Provisioning**: Rapidly add new devices using predefined templates.
*   **Dynamic Network Visualization**: Visualize network topology in an interactive graph, with color-coded connections and locations represented as groups. The user's local device is a clearly distinct node.
*   **Automated Discovery**: Automatically scan the network using protocols like SNMP, LLDP, and ARP to discover and onboard new assets.
*   **Peer-to-Peer Data Sharing**: Enable multiple instances of Net Ledger to discover each other and synchronize data.

🏛️ Architecture

### Database Schema

Net Ledger is built on a relational database schema designed for flexibility and scalability. Key relationships include:

*   A `Device` can have multiple `IP_Address` entries.
*   An `IP_Address` can host multiple `Service` instances on different ports.
*   A central `History` table logs all changes to assets for auditing purposes.

### Network Visualization

The frontend uses a powerful node-based editor, `litegraph.js`, to render the network topology.

*   **Groups** represent physical `Locations`.
*   **Nodes** represent `Devices` and `Services`.
*   **Color-coded wires** visually distinguish connections between `IP_Address` and `Service` nodes.

🚀 Technology Stack

*   **Backend**: Laravel
*   **Frontend**: TALL Stack (Tailwind CSS, Alpine.js, Livewire)
*   **Database**: SQLite
*   **Visualization**: litegraph.js, vis-timeline

🛠️ Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   PHP >= 8.0
*   Composer
*   Node.js & npm
*   SQLite3

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/net-ledger.git
    cd net-ledger
    ```
2.  Install backend dependencies:
    ```sh
    composer install
    ```
3.  Install frontend dependencies:
    ```sh
    npm install
    ```
4.  Set up your environment:
    ```sh
    cp .env.example .env
    php artisan key:generate
    ```
5.  Run database migrations and seed data:
    ```sh
    php artisan migrate --seed
    ```
6.  Start the local development server:
    ```sh
    npm run dev & php artisan serve
    ```

Your application will be available at http://localhost:8000.

🗺️ Roadmap

*   **Phase 1: Backend & Database**: Implement the core database schema and provisioning logic.
*   **Phase 2: Frontend & UI**: Build the user interface with the TALL stack and integrate the interactive network visualization.
*   **Phase 3: Automated Discovery**: Develop and integrate network scanning capabilities to automate data entry.
*   **Phase 4: Peer-to-Peer Networking**: Implement host discovery and data synchronization features for collaborative use.

🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

📄 License

Distributed under the MIT License. See `LICENSE` for more information.

[View Project Plan](projectPlan.md)
