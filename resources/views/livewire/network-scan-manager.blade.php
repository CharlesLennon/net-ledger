<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div class="flex flex-wrap justify-center gap-6 mx-auto w-full">
        <x-header-card :scanning="$scanning" />
        <x-schedule-card />
        <x-local-network-info-card :localIPs="$localIPs" :detectedSubnet="$detectedSubnet" :scanning="$scanning" />
        <x-scan-configurator-card>
            <!-- Subnet Input -->
            <div class="text-center space-y-6">
                <div class="flex items-center justify-center mb-3">
                    <label for="subnet" class="text-sm font-medium text-gray-700 dark:text-gray-300">Network Subnet (CIDR)</label>
                    <div class="relative ml-2 group">
                        <svg class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
                        </svg>
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[800px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                            <div class="flex p-4 text-xs max-h-96 overflow-y-auto gap-3">
                                <div class="font-semibold text-gray-900 dark:text-white mb-3 text-center">CIDR Reference Guide</div>
                                <!-- Add your CIDR reference content here -->
                            </div>
                            <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-center">
                    <input
                        type="text"
                        id="subnet"
                        wire:model.defer="subnet"
                        placeholder="192.168.1.0/24"
                        class="block w-full max-w-md px-4 py-3 text-center border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-lg"
                        {{ $scanning ? 'disabled' : '' }}
                    >
                </div>
                @error('subnet')
                    <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                @enderror

                <!-- Scan Type Selector -->
                <div class="flex items-center justify-center gap-6">
                    <label class="flex items-center gap-2">
                        <input type="radio" wire:model="scanType" value="auto" class="form-radio text-blue-600" {{ $scanning ? 'disabled' : '' }}>
                        <span class="text-sm text-gray-700 dark:text-gray-300">ARP & Ping</span>
                    </label>
                    <label class="flex items-center gap-2">
                        <input type="radio" wire:model="scanType" value="arp" class="form-radio text-blue-600" {{ $scanning ? 'disabled' : '' }}>
                        <span class="text-sm text-gray-700 dark:text-gray-300">ARP Only</span>
                    </label>
                    <label class="flex items-center gap-2">
                        <input type="radio" wire:model="scanType" value="ping" class="form-radio text-blue-600" {{ $scanning ? 'disabled' : '' }}>
                        <span class="text-sm text-gray-700 dark:text-gray-300">Ping Only</span>
                    </label>
                </div>

                <!-- Start Scan Button -->
                <div class="flex justify-center mt-4">
                    <button type="submit" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200" {{ $scanning ? 'disabled' : '' }}>
                        @if($scanning)
                            <span class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Scanning...
                            </span>
                        @else
                            Start Scan
                        @endif
                    </button>
                </div>
            </div>
        </x-scan-configurator-card>

        <x-scan-progress-card :progressText="$progressText" :currentProgress="$currentProgress" :scanning="$scanning" />
        <x-import-scan-card />
        <x-scan-results-card :scanResults="$scanResults" :that="$this" :showCommitOptions="$showCommitOptions" :portScanning="$portScanning" :selectedHosts="$selectedHosts" :showUnresponsiveIPs="$showUnresponsiveIPs" :customPorts="$customPorts" :customPortInput="$customPortInput" :scanning="$scanning" :selectedHostsForPortScan="$selectedHostsForPortScan" :portScanProgress="$portScanProgress" :portScanResults="$portScanResults" />
        @if(!$scanning && !empty($scanResults))
            <div class="flex justify-center mt-4">
                <button wire:click="exportScanResults" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200">
                    Export Results as JSON
                </button>
            </div>
        @endif
        <x-port-scanning-card :scanResults="$scanResults" :showCommitOptions="$showCommitOptions" :portScanning="$portScanning" :selectedHostsForPortScan="$selectedHostsForPortScan" :portScanProgress="$portScanProgress" :portScanResults="$portScanResults" />
        <x-scan-history-card :scanHistory="$scanHistory" />
    </div>

    <script>
        let scanPollInterval = null;

        document.addEventListener('livewire:init', function() {
            Livewire.on('scan-completed', function(message) {
                clearInterval(scanPollInterval);
            });

            Livewire.on('scan-failed', function(message) {
                clearInterval(scanPollInterval);
            });


            // Port scanning events
            Livewire.on('port-scan-completed', function(message) {
                alert('🔍 ' + message);
            });

            Livewire.on('port-scan-failed', function(message) {
                alert('❌ ' + message);
            });

            // Custom port prompt handling
            Livewire.on('prompt-custom-ports-all', function() {
                const portString = prompt('Enter custom ports to scan ALL hosts:\n\nExamples:\n• Individual ports: 80,443,22\n• Port ranges: 80-90,443,8000-8080\n• Mixed: 22,80,443,8000-8010', '80,443,22,8080');

                if (portString !== null && portString.trim() !== '') {
                    @this.call('handleCustomPortsAllHosts', portString.trim());
                }
            });

            Livewire.on('prompt-custom-ports-single', function() {
                const portString = prompt('Enter custom ports to scan this host:\n\nExamples:\n• Individual ports: 80,443,22\n• Port ranges: 80-90,443,8000-8080\n• Mixed: 22,80,443,8000-8010', '80,443,22,8080');

                if (portString !== null && portString.trim() !== '') {
                    @this.call('handleCustomPortsSingleHost', portString.trim());
                }
            });

            // Listen for progress updates and trigger component refresh
            Livewire.on('progress-updated', function(data) {
                console.log('Progress update:', data);
            });

            Livewire.on('start-polling', function() {
                if (scanPollInterval) { clearInterval(scanPollInterval); }

                function processNextChunk() {
                    if (@this.scanInProgress) {
                        @this.call('processScanChunk').then(function() {
                            if (@this.scanInProgress) {
                                setTimeout(processNextChunk, 1000); // 1 second delay between IPs for thoroughness
                            } else {
                                clearInterval(scanPollInterval);
                                scanPollInterval = null;
                            }
                        }).catch(function(error) {
                            clearInterval(scanPollInterval);
                            scanPollInterval = null;
                        });
                    } else {
                        clearInterval(scanPollInterval);
                        scanPollInterval = null;
                    }
                }

                processNextChunk();

                scanPollInterval = setInterval(function() {
                    if (@this.scanInProgress) {
                        @this.call('getScanStatus');
                    } else {
                        clearInterval(scanPollInterval);
                        scanPollInterval = null;
                    }
                }, 2000);
            });

            Livewire.on('start-port-polling', function() {
                if (scanPollInterval) { clearInterval(scanPollInterval);}

                function processNextPortChunk() {
                    if (@this.portScanInProgress) {
                        @this.call('processPortScanChunk').then(function() {
                            if (@this.portScanInProgress) {
                                setTimeout(processNextPortChunk, 200); // 200ms delay between ports for speed
                            } else {
                                clearInterval(scanPollInterval);
                                scanPollInterval = null;
                            }
                        }).catch(function(error) {
                            console.error('Error processing port scan chunk:', error);
                            clearInterval(scanPollInterval);
                            scanPollInterval = null;
                        });
                    } else {
                        clearInterval(scanPollInterval);
                        scanPollInterval = null;
                    }
                }

                processNextPortChunk();

                scanPollInterval = setInterval(function() {
                    if (@this.portScanInProgress) {
                        console.log('Port scan status update');
                    } else {
                        clearInterval(scanPollInterval);
                        scanPollInterval = null;
                    }
                }, 1000);
            });

            Livewire.on('download-json', function( event) {
                const json = event[0].json;
                const filename = event[0].filename || 'scan-results.json';

                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        });
    </script>
</div>
