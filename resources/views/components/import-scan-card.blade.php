@props([])
<x-card>
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">📥 Import Scan Results</h2>
    <form wire:submit.prevent="importScanResults" enctype="multipart/form-data" class="space-y-4">
        <div class="flex flex-col items-center justify-center">
            <input type="file" wire:model="importFile" accept="application/json" class="mb-2" />
            @error('importFile')
                <span class="text-sm text-red-600 dark:text-red-400">{{ $message }}</span>
            @enderror
        </div>
        <div class="flex justify-center">
            <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
                Import JSON
            </button>
        </div>
    </form>
    @if(session('importStatus'))
        <div class="mt-4 text-center text-green-600 dark:text-green-400">
            {{ session('importStatus') }}
        </div>
    @endif
</x-card>
