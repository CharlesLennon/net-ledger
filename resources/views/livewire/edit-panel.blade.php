<div>
    @if($showPanel)
        <!-- Overlay -->
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" wire:click="abort"></div>
        
        <!-- Edit Panel -->
        <div class="fixed inset-0 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                <!-- Header -->
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ $title }}
                    </h3>
                    <button 
                        wire:click="abort"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Form -->
                <form wire:submit="save">
                    <div class="mb-4">
                        <label for="newValue" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {{ $label }}
                        </label>
                        <input 
                            type="text" 
                            id="newValue"
                            wire:model="newValue"
                            placeholder="{{ $placeholder }}"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                            autofocus
                        />
                        @error('newValue')
                            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Current Value Display -->
                    <div class="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Current value:</strong> {{ $currentValue }}
                        </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 justify-end">
                        <button 
                            type="button"
                            wire:click="abort"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            wire:loading.attr="disabled"
                        >
                            <span wire:loading.remove>Save</span>
                            <span wire:loading>Saving...</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
