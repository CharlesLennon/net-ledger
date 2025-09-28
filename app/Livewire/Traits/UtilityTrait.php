<?php

namespace App\Livewire\Traits;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

trait UtilityTrait
{
    public function getScheduledScans(): array
    {
        try {
            $output = Artisan::call('schedule:list');
            $scheduleOutput = Artisan::output();

            $lines = explode("\n", $scheduleOutput);
            $networkScans = array_filter($lines, function ($line) {
                return str_contains($line, 'network:scan');
            });

            return array_values($networkScans);
        } catch (\Exception $e) {
            return ['Error loading schedule: '.$e->getMessage()];
        }
    }

    public function clearLogs(): void
    {
        try {
            $logFiles = [
                storage_path('logs/network-scan.log'),
                storage_path('logs/network-scan-quick.log'),
                storage_path('logs/network-scan-daily.log'),
                storage_path('logs/network-scan-weekly.log'),
            ];

            foreach ($logFiles as $logFile) {
                if (file_exists($logFile)) {
                    file_put_contents($logFile, '');
                }
            }

            $this->scanHistory = [];
            $this->dispatch('logs-cleared', 'Scan logs cleared successfully!');
        } catch (\Exception $e) {
            $this->dispatch('clear-failed', 'Failed to clear logs: '.$e->getMessage());
        }
    }
}
