<?php

namespace App\Traits;

use App\Models\Service;
use Livewire\Attributes\On;

trait ServiceListeners
{
    #[On('on-service-deleted')]
    public function onServiceDeleted(int $service_id): void
    {
        $service = Service::find($service_id);
        if (! $service) {
            return;
        }

        $service->delete();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-service-cloned')]
    public function onServiceCloned(int $service_id): void
    {
        $service = Service::find($service_id);
        if (! $service) {
            return;
        }

        $clonedService = $service->replicate();
        $clonedService->name = $service->name.' (Copy)';
        $clonedService->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-service-title-changed')]
    public function onServiceTitleChanged(int $id, $current = null, $new = null): void
    {
        if ($new) {
            $service = Service::find($id);
            if (! $service) {
                return;
            }

            $service->name = $new;
            $service->save();

            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        } else {
            $this->dispatch('show-edit-panel', 'Service Name', $current, 'on-service-title-changed');
        }
    }
}
