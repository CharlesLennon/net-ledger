<?php

namespace App\Livewire;

use App\Services\NetworkScannerManager;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Livewire\Component;
use Livewire\Attributes\On;
use Livewire\WithFileUploads;

use App\Livewire\Traits\ScanTrait;
use App\Livewire\Traits\PortScanTrait;
use App\Livewire\Traits\HostManagementTrait;
use App\Livewire\Traits\ImportExportTrait;
use App\Livewire\Traits\UtilityTrait;

class NetworkScanManager extends Component
{
    use WithFileUploads;
    use ScanTrait;
    use PortScanTrait;
    use HostManagementTrait;
    use ImportExportTrait;
    use UtilityTrait;

    public function boot(NetworkScannerManager $scannerManager): void
    {
        $this->scannerManager = $scannerManager;
    }

    public function mount(): void
    {
        $this->loadLocalNetworkInfo();
        $this->loadScanHistory();

        // Update available methods based on what scanners are actually available
        $availableScanners = $this->scannerManager->getAvailableScanners();
        Log::info('Available scanners on mount:', $availableScanners);

        // Filter scan methods to only include available ones
        $this->scanMethods = array_intersect($this->scanMethods, $availableScanners);
        if (empty($this->scanMethods)) {
            $this->scanMethods = $availableScanners; // Use all available if none selected
        }
    }
}
