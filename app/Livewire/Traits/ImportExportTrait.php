<?php

namespace App\Livewire\Traits;

use Illuminate\Support\Facades\Log;

trait ImportExportTrait
{
    public $importFile;

    public function exportScanResults()
    {
        if (empty($this->scanResults)) {
            $this->dispatch('export-failed', 'No scan results to export.');
            return;
        }
        $json = json_encode($this->scanResults);
        Log::info('Exporting scan results as JSON', [
            'exported' => $this->scanResults,
        ]);
        $this->dispatch('download-json', [
            'filename' => 'scan-results-'.date('Y-m-d_H-i-s').'.json',
            'json' => $json,
        ]);
    }

    public function importScanResults()
    {
        $this->validate([
            'importFile' => 'required|file|mimes:json,txt',
        ]);

        $file = $this->importFile;
        if ($file && $file->isValid()) {
            $json = file_get_contents($file->getRealPath());
            $data = json_decode($json, true);
            if (is_array($data)) {
                $this->scanResults = $data;
                $this->showCommitOptions = true;
                session()->flash('importStatus', 'Scan results imported successfully!');
            } else {
                session()->flash('importStatus', 'Invalid JSON format.');
            }
        } else {
            session()->flash('importStatus', 'File upload failed.');
        }
    }
}
