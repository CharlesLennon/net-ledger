<?php

namespace App\Livewire\Traits;

trait PortScanTrait
{
    public bool $portScanEnabled = false;

    public string $commonPorts = '22,23,25,53,80,110,143,443,993,995,8080,8443,3389,5432,3306,1433,27017';

    public array $customPorts = [];

    public bool $scanAllHosts = false;

    public array $selectedHostsForPortScan = [];

    public bool $portScanning = false;

    public array $portScanResults = [];

    public string $customPortInput = '';

    public string $portScanId = '';

    public bool $portScanInProgress = false;

    public array $portQueue = [];

    public array $hostQueue = [];

    public int $currentPortIndex = 0;

    public int $currentHostIndex = 0;

    public int $totalPorts = 0;

    public int $scannedPorts = 0;

    public int $totalPortScans = 0;

    public int $completedPortScans = 0;

    public string $currentPortScanHost = '';

    public string $currentPortScanPort = '';

    public array $portScanProgress = [];

    public function getPortsByType(string $portType): array
    {
        switch ($portType) {
            case 'common':
                return $this->scannerManager->getCommonPorts();
            case 'extended':
                return $this->scannerManager->getExtendedPorts();
            case 'custom':
                return $this->customPorts;
            default:
                return [];
        }
    }
}
