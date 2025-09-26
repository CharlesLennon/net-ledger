@props([
    'scanning' => false,
    'progressText' => null,
    'currentProgress' => [],
])
@if($scanning && ($progressText || $currentProgress))
    <x-card>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">Scan Progress</h3>
        {!! $progressText ? "<p class='text-center mb-4'>$progressText</p>" : '' !!}
        @if($currentProgress)
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mb-4">
                <div class="bg-blue-600 h-6 rounded-full transition-all duration-500 ease-in-out" style="width: {{ $currentProgress['percentage'] ?? 0 }}%;"></div>
            </div>
            <div class="text-center text-sm text-gray-700 dark:text-gray-300">
                <p>Phase: {{ ucfirst($currentProgress['phase'] ?? 'N/A') }}</p>
                <p>Scanned: {{ $currentProgress['scanned'] ?? 0 }} / {{ $currentProgress['total'] ?? 0 }} ({{ $currentProgress['percentage'] ?? 0 }}%)</p>
            </div>
        @endif
    </x-card>
@endif
