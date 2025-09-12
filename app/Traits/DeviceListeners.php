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
    public function ondeviceTitleChanged(int $id, $current = null, $new = null): void
    {
        if($new) {
            $device = Device::find($id);
            if (!$device) {
                return;
            }
    
            $device->name = $new;
            $device->save();
    
            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        }else{            
            $this->dispatch('show-edit-panel', 'Device Name', $current, 'on-device-title-changed');
        }
    }

    #[On('on-device-location-changed')]
    public function ondeviceLocationChanged(int $id, $current = null, $new = null): void
    {
        if($new) {
            $device = Device::find($id);
            if (!$device) {
                return;
            }
    
            $device->location_id = $new;
            $device->save();
    
            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        }else{            
            $this->dispatch('show-edit-panel', 'Device Location ID', $current, 'on-device-location-changed');
        }
    }
}
