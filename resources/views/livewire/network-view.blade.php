<div>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
    </style>
    <script>
        window.locationsJson = @json($locations);
        window.devicesJson = @json($devices);
        window.interfacesJson = @json($interfaces);
        window.connectionsJson = @json($connections);
        window.deviceIPsJson = @json($deviceIPs);
        window.servicesJson = @json($services);
        window.pciSlotsJson = @json($pciSlots);
        window.pciCardsJson = @json($pciCards);
        window.selectedViewId = @json($selectedViewId);
    </script>

    <div class="fixed inset-0 w-full h-full bg-gray-900">
        <div class="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <button onclick="refreshDatabase()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Refresh Database
                </button>
                <button onclick="window.location.reload()" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                    Reload Page
                </button>
            </div>
        </div>
        <canvas id="mycanvas" class="w-full h-full block" style="border: 1px solid black;"></canvas>
    </div>

    <script>
        function refreshDatabase() {
            fetch('/refresh-db', { 
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.text())
            .then(data => {
                console.log('Database refresh successful:', data);
                setTimeout(() => window.location.reload(), 500);
            })
            .catch(error => {
                console.error('Database refresh failed:', error);
            });
        }
    </script>

    <script src="{{ asset('js/config/WireConfig.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/config/index.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    
    <!-- Load refactored classes in dependency order -->
    <script src="{{ asset('js/classes/NetworkUtils.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/classes/CanvasManager.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/classes/KeyboardController.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/classes/ParticleSystem.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/classes/WireRenderer.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/classes/NetworkManager.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    
    <script src="{{ asset('js/nodes/index.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/panels/index.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/editing.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/connections.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script src="{{ asset('js/network-visualization.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
</div>
