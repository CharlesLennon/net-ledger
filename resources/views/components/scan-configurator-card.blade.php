@props([])
<x-card>
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Configure Network Scan</h2>
    <form wire:submit.prevent="startChunkedScan" class="space-y-6">
        {{ $slot }}
    </form>
</x-card>
