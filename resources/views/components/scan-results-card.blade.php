@props(['scanResults', 'that', 'showCommitOptions', 'portScanning', 'selectedHosts', 'showUnresponsiveIPs', 'customPorts', 'customPortInput', 'scanning', 'selectedHostsForPortScan', 'portScanProgress', 'portScanResults'])
@if(!empty($scanResults))
    <x-card>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white text-center flex-1">📊 Scan Results ({{ collect($scanResults)->where('responsive', '=', true)->count() }} hosts found)</h2>
                @if($showCommitOptions)
                    <div class="flex items-center space-x-3">
                        <button wire:click="selectAllHosts"
                                class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            Select All
                        </button>
                        <span class="text-gray-300">|</span>
                        <button wire:click="deselectAllHosts"
                                class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            Deselect All
                        </button>
                    </div>
                @endif
            </div>

            <!-- Show/Hide Non-Responsive Toggle -->
            @if($that->getUnresponsiveCount() > 0)
                <div class="mb-4 flex justify-center">
                    <button wire:click="toggleUnresponsiveIPs"
                            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {{ $showUnresponsiveIPs
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' }}">
                        @if($showUnresponsiveIPs)
                            👁️ Hide {{ $that->getUnresponsiveCount() }} Non-Responsive IPs
                        @else
                            🚫 Show {{ $that->getUnresponsiveCount() }} Non-Responsive IPs
                        @endif
                    </button>
                </div>
            @endif

            <!-- Bulk Port Scanning Controls -->
            <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div class="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        🔍 Port Scanning: Scan all {{ count($scanResults) }} hosts
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button wire:click="scanAllHostsCommon"
                                @if($portScanning) disabled @endif
                                @if($portScanning) title="Please wait for scan to finish" @endif
                                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 {{ $portScanning ? 'cursor-not-allowed opacity-60' : '' }}">
                            @if($portScanning)
                                <span class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Scanning...
                                </span>
                            @else
                                Common Ports
                            @endif
                        </button>
                        <button wire:click="scanAllHostsExtended"
                                @if($portScanning) disabled @endif
                                @if($portScanning) title="Please wait for scan to finish" @endif
                                class="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 {{ $portScanning ? 'cursor-not-allowed opacity-60' : '' }}">
                            Extended Ports
                        </button>
                        <button wire:click="scanAllHostsCustom"
                                @if($portScanning) disabled @endif
                                @if($portScanning) title="Please wait for scan to finish" @endif
                                class="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 {{ $portScanning ? 'cursor-not-allowed opacity-60' : '' }}">
                            Custom Scan
                        </button>
                    </div>
                </div>
            </div>

            @if($showCommitOptions)
                <div class="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div class="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                        <div class="text-center sm:text-left">
                            <p class="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                Review and select hosts to add to your inventory
                            </p>
                            <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                {{ count($selectedHosts) }} of {{ count($scanResults) }} hosts selected
                            </p>
                        </div>
                        <button wire:click="commitSelectedHosts"
                                class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
                                @if(empty($selectedHosts)) disabled @endif>
                            📝 Commit {{ count($selectedHosts) }} Selected Hosts
                        </button>
                    </div>
                </div>
            @endif

            <div class="space-y-4">
                @foreach($that->getVisibleScanResults() as $index => $host)
                    @php
                        $isResponsive = isset($host['responsive']) ? $host['responsive'] : true;
                        $hostClasses = '';

                        // Base styling for responsive hosts
                        if ($isResponsive) {
                            $hostClasses = $showCommitOptions && in_array($index, $selectedHosts)
                                ? 'border border-blue-300 dark:border-blue-700 rounded-xl p-6 bg-blue-50 dark:bg-blue-900/10 shadow-md transition-all duration-200'
                                : 'border border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:shadow-md transition-all duration-200';
                        } else {
                            // Red background styling for non-responsive hosts
                            $hostClasses = 'border border-red-200 dark:border-red-700 rounded-xl px-6 py-2 bg-red-50 dark:bg-red-900/20 opacity-90 transition-all duration-200';
                        }
                    @endphp
                    <div class="{{ $hostClasses }}">
                        <div class="flex items-start justify-between">
                            <div class="flex items-start space-x-4 flex-1">
                                @if($showCommitOptions && $isResponsive)
                                <div class="flex items-center h-5 mt-1">
                                    <input wire:click="toggleHostSelection({{ $index }})"
                                        type="checkbox"
                                        @if(in_array($index, $selectedHosts)) checked @endif
                                        class="w-4 h-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                </div>
                                @elseif($showCommitOptions && !$isResponsive)
                                <div class="flex items-center h-5 mt-1">
                                    <span class="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                        <span class="text-xs text-gray-500">✕</span>
                                    </span>
                                </div>
                                @endif

                                <div class="flex-1">
                                    <div class="flex items-center space-x-3 mb-3">
                                        <h3 class="text-lg font-semibold {{ $isResponsive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400' }}">{{ $host['ip'] }}</h3>

                                        @if(!$isResponsive)
                                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                ❌ No Response
                                            </span>
                                            <span class="text-xs text-gray-500 dark:text-gray-500 font-medium ml-4">Re-test:</span>
                                            <button wire:click="testSingleHost('{{ $host['ip'] }}')"
                                                    @if($scanning) disabled @endif
                                                    class="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors duration-200">
                                                Ping
                                            </button>
                                            <button wire:click="testSingleHost('{{ $host['ip'] }}')"
                                                    @if($scanning) disabled @endif
                                                    class="px-2 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors duration-200">
                                                ARP
                                            </button>
                                        @else
                                            @if(isset($host['hostname']) && $host['hostname'] && $host['hostname'] !== 'No Response')
                                                <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">({{ $host['hostname'] }})</span>
                                            @endif
                                            @if(isset($host['discovery_method']) && $host['discovery_method'])
                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                    {{ $host['discovery_method'] }}
                                                </span>
                                            @endif
                                            @if(isset($host['os_info']) && $host['os_info'])
                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {{ $host['os_info'] }}
                                                </span>
                                            @endif
                                        @endif
                                    </div>

                                    @if($isResponsive)
                                        @if(isset($host['mac']) && $host['mac'])
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 font-mono">MAC: {{ $host['mac'] }}</p>
                                        @endif

                                        @if(!empty($host['services']))
                                            <div class="mb-3">
                                                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services ({{ count($host['services']) }}):</h4>
                                                <div class="flex flex-wrap gap-2">
                                                    @foreach($host['services'] as $service)
                                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                            {{ $service['name'] }}:{{ $service['port'] }}
                                                        </span>
                                                    @endforeach
                                                </div>
                                            </div>
                                        @else
                                            <div class="mb-3">
                                                <p class="text-sm text-gray-500 dark:text-gray-400 italic">No services detected</p>
                                            </div>
                                        @endif

                                        <!-- Port Scanning Buttons (Only for responsive hosts, only after scan is done) -->
                                        @if(!$scanning)
                                        <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                                            <span class="text-xs text-gray-600 dark:text-gray-400 font-medium self-center mr-2">Port Scan:</span>
                                            <button wire:click="scanSingleHostCommon({{ $index }})"
                                                    class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors duration-200">
                                                Common
                                            </button>
                                            <button wire:click="scanSingleHostExtended({{ $index }})"
                                                    class="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors duration-200">
                                                Extended
                                            </button>
                                            <button wire:click="scanSingleHostCustom({{ $index }})"
                                                    class="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-colors duration-200">
                                                Custom
                                            </button>

                                            @if(isset($portScanResults[$host['ip']]) && !empty($portScanResults[$host['ip']]))
                                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
                                                    ✓ {{ count($portScanResults[$host['ip']]) }} open ports
                                                </span>
                                            @endif
                                        </div>
                                        @endif
                                    @endif
                                </div>
                            </div>

                        <div class="text-xs text-gray-500 dark:text-gray-400 ml-4">
                            {{ $host['discovered_at'] ?? 'Unknown' }}
                        </div>
                    </div>
                </div>
                @endforeach
            </div>

            @if($showCommitOptions && !empty($selectedHosts))
                <div class="mt-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <div class="flex flex-col space-y-4">
                        <div class="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            ⚠️ Ready to commit selected hosts to the database
                        </div>
                        <div class="text-xs text-yellow-700 dark:text-yellow-300">
                            that will create device entries and associate IP addresses. that action cannot be undone.
                        </div>
                        <div class="flex justify-center">
                            <button wire:click="commitSelectedHosts"
                                    class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200">
                                📝 Commit {{ count($selectedHosts) }} Selected Hosts to Database
                            </button>
                        </div>
                    </div>
                </div>
            @endif

            <!-- Port Scan Controls -->
            @if(!empty($scanResults) && !$scanning)
                <div class="mt-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div class="mb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Port Scanning Options</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan open ports on discovered hosts to identify running services</p>

                    <!-- Port Selection Mode -->
                    <div class="mb-4">
                        <div class="flex flex-wrap gap-3 mb-3">
                            <label class="flex items-center">
                                <input type="radio" wire:model="customPorts" value="common" class="mr-2" @if($portScanning) disabled @endif @if($portScanning) title="Please wait for scan to finish" @endif>
                                <span class="text-sm text-gray-700 dark:text-gray-300">Common ports ({{ count($that->getPortsByType('common')) }})</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" wire:model="customPorts" value="extended" class="mr-2" @if($portScanning) disabled @endif @if($portScanning) title="Please wait for scan to finish" @endif>
                                <span class="text-sm text-gray-700 dark:text-gray-300">Extended scan ({{ count($that->getPortsByType('extended')) }} ports)</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" wire:model="customPorts" value="custom" class="mr-2" @if($portScanning) disabled @endif @if($portScanning) title="Please wait for scan to finish" @endif>
                                <span class="text-sm text-gray-700 dark:text-gray-300">Custom ports</span>
                            </label>
                        </div>

                        @if($customPorts === 'custom')
                        <div class="mb-3">
                            <input type="text"
                                wire:model.defer="customPortInput"
                                placeholder="Enter ports: 22,80,443,8080 or ranges: 80-90,443,8000-8080\n• Mixed: 22,80,443,8000-8010"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                                @if($portScanning) disabled @endif @if($portScanning) title="Please wait for scan to finish" @endif>
                        </div>
                        @endif
                    </div>

                    <!-- Host Selection -->
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Select hosts to scan:</span>
                            <div class="flex space-x-2">
                                <button wire:click="selectAllForPortScan"
                                        class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        @if($portScanning) disabled @endif @if($portScanning) title="Please wait for scan to finish" @endif>
                                    Select All
                                </button>
                                <button wire:click="clearPortScanSelection"
                                        class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        @if($portScanning) disabled @endif @if($portScanning) title="Please wait for scan to finish" @endif>
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            @foreach(collect($scanResults)->where('responsive', '=', true) as $index => $host)
                                <label class="flex items-center p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 {{ in_array($index, $selectedHostsForPortScan) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : '' }} transition-colors duration-200">
                                    <input type="checkbox"
                                        wire:click="togglePortScanHost({{ $index }})"
                                        @if(in_array($index, $selectedHostsForPortScan)) checked @endif
                                        class="mr-2 w-4 h-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        @if($portScanning) disabled @endif @if($portScanning) title="Please wait for scan to finish" @endif>
                                    <span class="text-xs font-mono text-gray-700 dark:text-gray-300">{{ $host['ip'] }}</span>
                                </label>
                            @endforeach
                        </div>

                        @if(!empty($selectedHostsForPortScan))
                        <div class="flex justify-center">
                            <button wire:click="startPortScan"
                                    @if($portScanning) disabled @endif
                                    @if($portScanning) title="Please wait for scan to finish" @endif
                                    class="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors duration-200 {{ $portScanning ? 'cursor-not-allowed opacity-60' : '' }}">
                                @if($portScanning)
                                    <span class="flex items-center">
                                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Scanning Ports...
                                    </span>
                                @else
                                    Start Port Scan ({{ count($selectedHostsForPortScan) }} hosts)
                                @endif
                            </button>
                        </div>
                        @endif
                    </div>

                    <!-- Port Scan Progress -->
                    @if($portScanning && !empty($portScanProgress))
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="flex-shrink-0">
                                <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">{{ $portScanProgress['phase'] ?? 'Port Scanning' }}</h4>
                                @if(isset($portScanProgress['data']['current_host']) && isset($portScanProgress['data']['current_port']))
                                    <p class="text-sm text-blue-600 dark:text-blue-300">
                                        Current: {{ $portScanProgress['data']['current_host'] }}:{{ $portScanProgress['data']['current_port'] }}
                                    </p>
                                @else
                                    <p class="text-sm text-blue-600 dark:text-blue-300">{{ $portScanProgress['target'] ?? '' }}</p>
                                @endif
                            </div>
                        </div>

                        @if(isset($portScanProgress['data']))
                            @if(isset($portScanProgress['data']['scanned']) && isset($portScanProgress['data']['total']))
                            <div class="mb-6">
                                <div class="flex justify-between text-sm text-blue-600 dark:text-blue-400 mb-2">
                                    <span>Port Scan Progress</span>
                                    <span>{{ $portScanProgress['data']['percentage'] ?? 0 }}%</span>
                                </div>
                                <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                                    <div class="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-300"
                                        style="width: {{ $portScanProgress['data']['percentage'] ?? 0 }}%"></div>
                                </div>
                                <div class="flex justify-between text-xs text-blue-500 dark:text-blue-400 mt-2">
                                    <span>{{ $portScanProgress['data']['scanned'] ?? 0 }}/{{ $portScanProgress['data']['total'] ?? 0 }} port scans</span>
                                    <span>{{ count($portScanResults) }} open ports found</span>
                                </div>
                            </div>
                            @if(isset($portScanProgress['data']['hosts']) && isset($portScanProgress['data']['ports']))
                                <div class="text-center">
                                    <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        Scanning {{ $portScanProgress['data']['hosts'] }} hosts × {{ $portScanProgress['data']['ports'] }} ports
                                    </span>
                                </div>
                            @endif
                            @endif
                        @endif
                    </div>
                    @endif

                    <!-- Port Scan Results -->
                    @if(!empty($portScanResults))
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Port Scan Results</h3>

                        @foreach($portScanResults as $ip => $ports)
                            <div class="mb-6 last:mb-0">
                                <div class="flex items-center space-x-3 mb-3">
                                    <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200">{{ $ip }}</h4>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        {{ count($ports) }} open ports
                                    </span>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    @foreach($ports as $port)
                                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ $port['port'] }}/{{ $port['protocol'] }}</span>
                                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {{ $port['service'] }}
                                                </span>
                                            </div>

                                            @if(isset($port['version']) && $port['version'])
                                                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Version: {{ $port['version'] }}</p>
                                            @endif

                                            @if(isset($port['banner']) && $port['banner'])
                                                <div class="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono overflow-hidden">
                                                    {{ Str::limit($port['banner'], 100) }}
                                                </div>
                                            @endif
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endforeach

                        <!-- Individual Host Port Scan Buttons (only after scan is done) -->
                        @if(!$scanning)
                        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Port Scan</h4>
                            <div class="flex flex-wrap gap-2">
                                @foreach($scanResults as $index => $host)
                                    <button wire:click="scanSingleHostPorts({{ $index }})"
                                            class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200">
                                        {{ $host['ip'] }}
                                    </button>
                                @endforeach
                            </div>
                        </div>
                        @endif
                    </div>
                    @endif
                </div>
            @endif
            </div>
    </x-card>
@endif
