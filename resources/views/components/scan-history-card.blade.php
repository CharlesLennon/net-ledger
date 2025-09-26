@props([
    'scanHistory' => []
])
@if(!empty($scanHistory))
    <x-card>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">📝 Recent Scan History</h2>
        <div class="space-y-4 mt-4">
            @foreach($scanHistory as $scan)
                <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                            Scan on {{ \Carbon\Carbon::parse($scan['scanned_at'])->format('F j, Y, g:i a') }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ count($scan['responsive_hosts'] ?? []) }} hosts found
                        </div>
                    </div>
                    @if(!empty($scan['responsive_hosts']))
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        @foreach($scan['responsive_hosts'] as $host)
                            <div class="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div class="flex items-center space-x-2">
                                    <span class="inline-flex items-center px-2 py-1 rounded text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {{ $host['ip_address'] }}
                                    </span>
                                    @if(!empty($host['hostname']))
                                        <span class="text-sm text-gray-600 dark:text-gray-400">({{ $host['hostname'] }})</span>
                                    @endif
                                    @if(!empty($host['mac_address']))
                                        <span class="text-sm text-gray-600 dark:text-gray-400">- {{ $host['mac_address'] }}</span>
                                    @endif
                                    @if(!empty($host['vendor']))
                                        <span class="text-sm text-gray-600 dark:text-gray-400">- {{ $host['vendor'] }}</span>
                                    @endif
                                    @if(!empty($host['open_ports']) && is_array($host['open_ports']))
                                        <div class="ml-auto">
                                            <span class="inline-flex items-center px-2 py-1 rounded text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                {{ count($host['open_ports']) }} open port{{ count($host['open_ports']) > 1 ? 's' : '' }}
                                            </span>
                                        </div>
                                    @endif
                                </div>
                                @if(!empty($host['discovered_at']))
                                    <div class="text-xs text-gray-500 dark:text-gray-400 ml-4">
                                        Discovered at: {{ \Carbon\Carbon::parse($host['discovered_at'])->format('F j, Y, g:i a') }}
                                    </div>
                                @endif
                            </div>
                        @endforeach
                        </div>
                    @else
                        <p class="text-gray-500 dark:text-gray-400">No responsive hosts found during this scan.</p>
                    @endif
                </div>
            @endforeach
        </div>
    </x-card>
@endif
