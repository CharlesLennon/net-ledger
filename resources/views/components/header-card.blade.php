@props(['scanning'])
<x-card>
    <div class="mb-4 text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">🔍 Network Discovery Scanner</h1>
        <p class="text-gray-600 dark:text-gray-400">Automatically discover and inventory network devices</p>
    </div>
    <div class="flex items-center justify-center space-x-2">
        @if($scanning)
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span class="text-blue-600 dark:text-blue-400 font-medium">Scanning...</span>
        @else
            <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Ready to Scan
            </span>
        @endif
    </div>
</x-card>
