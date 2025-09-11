<?php

namespace App\Traits;
use App\Models\Device;
use Livewire\Attributes\On;

trait DeviceListeners
{
    #[On('on-device-deleted')]
    public function ondeviceDeleted(int $device_id): void
    {
        $device = Device::find($device_id);
        if (!$device) {
            return;
        }

        $device->delete();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-device-cloned')]
    public function ondeviceCloned(int $device_id): void
    {
        $device = Device::find($device_id);
        if (!$device) {
            return;
        }

        $cloneddevice = $device->replicate();
        $cloneddevice->name = $device->name . ' (Copy)';
        $cloneddevice->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-device-title-changed')]
    public function ondeviceTitleChanged(int $device_id, string $new_title): void
    {
        $device = Device::find($device_id);
        if (!$device) {
            return;
        }

        $device->name = $new_title;
        $device->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-device-parent-changed')]
    public function ondeviceParentChanged(int $device_id, ?int $new_parent_id): void
    {
        $device = Device::find($device_id);
        if (!$device) {
            return;
        }

        $device->parent_device_id = $new_parent_id;
        $device->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }
}
