<div>
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
        window.savedPositions = @json($savedPositions);
        window.selectedViewId = @json($selectedViewId);
    </script>

    <div class="fixed inset-0 w-full h-full bg-gray-900">
        <!-- Top Control Bar -->
        <div class="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
            <!-- View Management - COMMENTED OUT -->
            {{-- <div class="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
                <label class="text-white text-sm font-medium">View:</label>
                <select wire:model.live="selectedViewId" 
                        class="bg-gray-700 text-white rounded px-3 py-1 text-sm">
                    @if(!$selectedViewId)
                        <option value="">Select View</option>
                    @endif
                    @foreach($availableViews as $view)
                        <option value="{{ $view['view_id'] }}">{{ $view['name'] }}</option>
                    @endforeach
                </select>
                
                <button onclick="showCreateViewModal()" 
                        class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                    New View
                </button>
                
                @if($selectedViewId)
                    <button onclick="deleteCurrentView()" 
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                        Delete View
                    </button>
                @endif
            </div> --}}

            <!-- Action Buttons -->
            <div class="flex items-center space-x-2">
                <button id="savePositionBtn" onclick="toggleSaveMode()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Save Positions
                </button>
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

        <!-- Position Save Status -->
        <div id="saveStatus" class="fixed top-20 right-4 z-50 hidden">
            <div class="bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
                <span id="saveStatusText">Position save mode enabled. Move nodes and they will be saved automatically.</span>
            </div>
        </div>

        <canvas id="mycanvas" class="w-full h-full block" style="border: 1px solid black;"></canvas>
    </div>

    {{-- Create View Modal - COMMENTED OUT --}}
    {{-- <div id="createViewModal" class="fixed inset-0 z-50 hidden">
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="fixed inset-0 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 class="text-white text-lg font-semibold mb-4">Create New View</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-white text-sm font-medium mb-2">View Name</label>
                        <input type="text" id="newViewName" 
                               class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                               placeholder="Enter view name">
                    </div>
                    <div>
                        <label class="block text-white text-sm font-medium mb-2">Description (Optional)</label>
                        <textarea id="newViewDescription" 
                                  class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm h-20"
                                  placeholder="Enter view description"></textarea>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button onclick="hideCreateViewModal()" 
                            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">
                        Cancel
                    </button>
                    <button onclick="createNewView()" 
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                        Create View
                    </button>
                </div>
            </div>
        </div>
    </div> --}}

    <script>
        let saveMode = false;
        let livewireComponent = null;

        // Initialize Livewire component reference
        document.addEventListener('livewire:init', () => {
            livewireComponent = Livewire.getByName('network-view')[0];
        });

        // Toggle save position mode
        function toggleSaveMode() {
            saveMode = !saveMode;
            const btn = document.getElementById('savePositionBtn');
            const status = document.getElementById('saveStatus');
            
            if (saveMode) {
                btn.textContent = 'Exit Save Mode';
                btn.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded';
                status.classList.remove('hidden');
            } else {
                btn.textContent = 'Save Positions';
                btn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded';
                status.classList.add('hidden');
            }
            
            // Notify the visualization script
            if (window.networkVisualization) {
                window.networkVisualization.setSaveMode(saveMode);
            }
        }

        // Save node position via Livewire
        function saveNodePosition(nodeType, nodeId, x, y) {
            if (!saveMode || !livewireComponent) return;
            
            livewireComponent.call('saveNodePosition', nodeType, nodeId, x, y)
                .then(result => {
                    if (result && !result.success) {
                        console.error('Failed to save position:', result.message);
                    }
                })
                .catch(error => {
                    console.error('Error saving position:', error);
                });
        }

        // View management functions - COMMENTED OUT
        /*
        function showCreateViewModal() {
            document.getElementById('createViewModal').classList.remove('hidden');
        }

        function hideCreateViewModal() {
            document.getElementById('createViewModal').classList.add('hidden');
            document.getElementById('newViewName').value = '';
            document.getElementById('newViewDescription').value = '';
        }

        function createNewView() {
            const name = document.getElementById('newViewName').value.trim();
            const description = document.getElementById('newViewDescription').value.trim();
            
            if (!name) {
                alert('Please enter a view name');
                return;
            }

            if (livewireComponent) {
                livewireComponent.call('createNewView', name, description || null)
                    .then(result => {
                        if (result && result.success) {
                            hideCreateViewModal();
                            // Refresh to show new view
                            location.reload();
                        } else {
                            alert(result ? result.message : 'Failed to create view');
                        }
                    })
                    .catch(error => {
                        console.error('Error creating view:', error);
                        alert('Failed to create view');
                    });
            }
        }

        function deleteCurrentView() {
            if (!window.selectedViewId) {
                alert('No view selected');
                return;
            }

            if (confirm('Are you sure you want to delete this view? This action cannot be undone.')) {
                if (livewireComponent) {
                    livewireComponent.call('deleteView', window.selectedViewId)
                        .then(result => {
                            if (result && result.success) {
                                location.reload();
                            } else {
                                alert(result ? result.message : 'Failed to delete view');
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting view:', error);
                            alert('Failed to delete view');
                        });
                }
            }
        }
        */

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

        // Listen for view switches - COMMENTED OUT
        /*
        document.addEventListener('livewire:init', () => {
            Livewire.on('viewSwitched', (data) => {
                console.log('View switch event received:', data);
                
                // Handle both array and direct value cases for viewId
                let viewId, savedPositions;
                
                if (Array.isArray(data)) {
                    // Data comes as [viewId, savedPositions]
                    viewId = data[0];
                    savedPositions = data[1] || {};
                } else {
                    // Fallback for older format
                    viewId = data;
                    savedPositions = {};
                }
                
                console.log('View switched to:', viewId);
                console.log('New saved positions:', savedPositions);
                
                // Update the global variables
                window.selectedViewId = viewId;
                window.savedPositions = savedPositions;
                
                // Apply new positions to existing nodes if visualization is loaded
                if (window.graphInstance && window.canvasInstance) {
                    console.log('Re-rendering graph with new positions');
                    
                    // Update the global saved positions first
                    window.savedPositions = savedPositions;
                    
                    // Stop the graph to prevent processing during cleanup
                    window.graphInstance.stop();
                    
                    // Clear all nodes and connections safely
                    try {
                        // Remove all connections first
                        if (window.graphInstance.links) {
                            Object.keys(window.graphInstance.links).forEach(linkId => {
                                delete window.graphInstance.links[linkId];
                            });
                        }
                        
                        // Remove all nodes
                        const nodesToRemove = [...(window.graphInstance._nodes || [])];
                        nodesToRemove.forEach(node => {
                            if (node && window.graphInstance.remove) {
                                window.graphInstance.remove(node);
                            }
                        });
                        
                        // Clear any remaining references
                        window.graphInstance._nodes = [];
                        window.graphInstance._groups = [];
                        window.graphInstance.links = {};
                        
                    } catch (e) {
                        console.error('Error during graph cleanup:', e);
                    }
                    
                    // Small delay to let cleanup complete
                    setTimeout(() => {
                        try {
                            // Re-create the network visualization with the new positions
                            if (window.createNetworkVisualization) {
                                window.createNetworkVisualization(window.graphInstance);
                                
                                // Restart the graph
                                window.graphInstance.start();
                                
                                // Force canvas redraw
                                window.canvasInstance.setDirty(true, true);
                            } else {
                                console.log('createNetworkVisualization function not available, reloading page');
                                location.reload();
                            }
                        } catch (e) {
                            console.error('Error during graph recreation:', e);
                            location.reload();
                        }
                    }, 100);
                    
                } else {
                    console.log('Graph or canvas instance not available, reloading page');
                    // If visualization isn't loaded yet, reload the page as fallback
                    setTimeout(() => location.reload(), 100);
                }
            });
        });
        */
    </script>

    {{-- Include the refactored and cleaned-up visualization script --}}
    <script src="{{ asset('js/network-visualization.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
</div>
