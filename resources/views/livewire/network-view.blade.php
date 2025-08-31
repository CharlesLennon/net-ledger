<script>
    // Assign PHP data to global window objects to be used by the external script.
    window.locationsJson = @json($locations);
    window.devicesJson = @json($devices);
    window.interfacesJson = @json($interfaces);
    window.connectionsJson = @json($connections);
    window.deviceIPsJson = @json($deviceIPs);
    window.servicesJson = @json($services);
    window.pciSlotsJson = @json($pciSlots);
    window.pciCardsJson = @json($pciCards);
</script>

<div class="fixed inset-0 w-full h-full bg-gray-900">
    <div class="fixed top-4 right-4 z-50">
        <button onclick="refreshDatabase()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Refresh Database
        </button>
        <button onclick="window.location.reload()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded ml-2">
            Reload Page
        </button>
    </div>
    <canvas id="mycanvas" class="w-full h-full block" style="border: 1px solid black;"></canvas>
</div>

<script>
    // Simple function to allow manual database refresh from the UI.
    function refreshDatabase() {
        fetch('/refresh-db', { method: 'POST' })
            .then(response => response.text())
            .then(data => {
                console.log('Database refresh initiated. Reloading page...');
                setTimeout(() => window.location.reload(), 500);
            })
            .catch(error => {
                console.error('Database refresh failed:', error);
            });
    }
</script>

{{-- Include the refactored and cleaned-up visualization script --}}
<script src="{{ asset('js/network-visualization.js') }}"></script>
