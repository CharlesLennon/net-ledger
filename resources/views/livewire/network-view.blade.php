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
    <div class="fixed inset-0 w-full h-full bg-gray-900">
        <div class="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
            <div id="top-nav" class="flex items-center space-x-2">
                <button onclick="refreshDatabase()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Refresh Database
                </button>
                <button onclick="window.location.reload()" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                    Reload Page
                </button>
                <!-- DotMapper DLC will add its buttons here via onInit() -->
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
                setTimeout(() => window.location.reload(), 500);
            })
            .catch(error => {
                console.error('Database refresh failed:', error);
            });
        }
    </script>
    <script src="{{ asset('js/features.js') }}?v={{ time() . rand(1000, 9999) }}"></script>
    <script>
        document.addEventListener('allFeaturesInitialized', function(event) {       
            
            if (FEATURE_LOADER.loadedModules.length != 0) {
                console.table(FEATURE_LOADER.loadedModules);
            }

            window.CONFIG = [];
            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
                if (featureModule.Available === '✅') {
                    window.CONFIG = runFeatureFunctionIfExists(featureModule.FeatureName, 'onConfigLoad', window.CONFIG);
                }
            }
            
		    const canvas = new window.LGraphCanvas('#mycanvas', new window.LiteGraph.LGraph());
            window.canvasInstance = canvas;

            canvas.background_image = safeGetConfig('canvas.background_image', null);
            canvas.render_connections_shadows = safeGetConfig('canvas.render_connections_shadows', false);
            canvas.render_connection_arrows = safeGetConfig('canvas.render_connection_arrows', true);
            canvas.highquality_render = safeGetConfig('canvas.highquality_render', true);
            canvas.use_gradients = safeGetConfig('canvas.use_gradients', true);

            const canvasElement = document.getElementById('mycanvas');
            if (!canvasElement || !canvas) return;

            const dpr = window.devicePixelRatio || 1;
            canvasElement.style.width = `${window.innerWidth}px`;
            canvasElement.style.height = `${window.innerHeight}px`;
            canvasElement.width = window.innerWidth * dpr;
            canvasElement.height = window.innerHeight * dpr;
            canvasElement.getContext('2d').scale(dpr, dpr);
            canvas.resize();
            canvasElement.tabIndex = 0;
            canvasElement.style.outline = 'none';
            if (!canvas.graph._groups) canvas.graph._groups = [];
            if (!canvas.graph._nodes) canvas.graph._nodes = [];
            if (!canvas.graph.links) canvas.graph.links = {};

            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
                runFeatureFunctionIfExists(featureModule.FeatureName, 'onCanvasSetup', canvas);
            }

            window.data = {
                locations: @json($locations),
                devices: @json($devices),
                interfaces: @json($interfaces),
                connections: @json($connections),
                deviceIPs: @json($deviceIPs),
                services: @json($services),
                pciSlots: @json($pciSlots),
                pciCards: @json($pciCards),
            };

            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
                window.data = runFeatureFunctionIfExists(featureModule.FeatureName, 'onDataLoad', window.data);
            }

            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
               runFeatureFunctionIfExists(featureModule.FeatureName, 'onGroupSetup', window.canvasInstance, window.data);
            }

            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
               runFeatureFunctionIfExists(featureModule.FeatureName, 'onDeviceSetup', window.canvasInstance, window.data);
            }

            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
               runFeatureFunctionIfExists(featureModule.FeatureName, 'onServiceSetup', window.canvasInstance, window.data);
            }

            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
               runFeatureFunctionIfExists(featureModule.FeatureName, 'onPCISetup', window.canvasInstance, window.data);
            }

            for (const featureModule of window.FEATURE_LOADER.loadedModules) {
               runFeatureFunctionIfExists(featureModule.FeatureName, 'onConnectionSetup', window.canvasInstance, window.data);
            }
            console.log("Data:", window.data);
            console.log("Final Canvas State:", canvas);

        });

        function runFeatureFunctionIfExists(featureName, functionName, ...args) {
            var result = args[0];
            const FeatureClass = window[FEATURE_LOADER.getClassName(featureName)];
            if (FeatureClass && typeof FeatureClass[functionName] === 'function') {
                const functionResult = FeatureClass[functionName](...args);
                if (functionResult !== undefined) {
                    result = functionResult;
                }
            }
            return result;
        }

        function safeGetConfig(variableName, defaultValue = null) {
            const parts = variableName.split('.');
            if (parts.length !== 2) {
                console.warn(`Invalid variable name format: ${variableName}. Expected format 'featureName.variableName'.`);
                return defaultValue;
            }
            const [featureName, varName] = parts;
            if (window.CONFIG) {
                for (const featureConfig of window.CONFIG) {
                    if (featureConfig.feature === featureName && featureConfig.variables) {
                        for (const variable of featureConfig.variables) {
                            if (variable.name === varName) {
                                return variable.hasOwnProperty('value') ? variable.value : variable.default;
                            }
                        }
                    }
                }
            }
            return defaultValue;
        }
    </script>

</div>
