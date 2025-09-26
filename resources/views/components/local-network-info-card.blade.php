@props(['localIPs', 'detectedSubnet', 'scanning'])
<x-card>
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📡 Local Network Information</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Local IP Addresses:</h3>
            <div class="space-y-1">
                @forelse($localIPs as $ip)
                    <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2 py-1 rounded text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {{ $ip }}
                        </span>
                        <button wire:click="testSingleHost('{{ $ip }}')" 
                                class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                @if($scanning) disabled @endif>
                            Test
                        </button>
                    </div>
                @empty
                    <p class="text-gray-500 dark:text-gray-400">No local IPs detected</p>
                @endforelse
            </div>
        </div>
        <div>
            <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Detected Subnet:</h3>
            <span class="inline-flex items-center px-3 py-1 rounded-md text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {{ $detectedSubnet }}
            </span>
        </div>
    </div>
</x-card>
