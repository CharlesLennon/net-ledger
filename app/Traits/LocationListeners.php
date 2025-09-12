<?php

namespace App\Traits;

use App\Models\Device;
use App\Models\Location;
use Livewire\Attributes\On;

trait LocationListeners
{
    #[On('on-location-deleted')]
    public function onLocationDeleted(int $location_id): void
    {
        $location = Location::find($location_id);
        if (!$location) {
            return;
        }

        // If location has children, move them to the parent location
        $children = Location::where('parent_location_id', $location->location_id)->get();
        foreach ($children as $child) {
            $child->parent_location_id = $location->parent_location_id ?? 0;
            $child->save();
        }

        // Devices in this location should be moved to the parent location
        $devices = Device::where('location_id', $location->location_id)->get();
        foreach ($devices as $device) {
            $device->location_id = $location->parent_location_id;
            $device->save();
        }

        $location->delete();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-location-direction-inverted')]
    public function onLocationDirectionInverted(int $location_id): void
    {
        $location = Location::find($location_id);
        if (!$location) {
            return;
        }

        $location->layout_direction = $location->layout_direction === 'vertical' ? 'horizontal' : 'vertical';
        $location->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-location-cloned')]
    public function onLocationCloned(int $location_id): void
    {
        $location = Location::find($location_id);
        if (!$location) {
            return;
        }

        $clonedLocation = $location->replicate();
        $clonedLocation->name = $location->name . ' (Copy)';
        $clonedLocation->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-location-title-changed')]
    public function onLocationTitleChanged(int $id, $current = null, $new = null): void
    {
        if ($new) {
            $location = Location::find($id);
            if (!$location) {
                return;
            }

                $location->name = $new;
            $location->save();

            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        } else {
            $this->dispatch('show-edit-panel', 'Location Name', $current, 'on-location-title-changed');
        }
    }

    #[On('on-location-parent-changed')]
    public function onLocationParentChanged(int $id, $current = null, $new = null): void
    {
        if ($new) {
            $location = Location::find($id);
            if (!$location) {
                return;
            }

            $location->parent_location_id = $new;
            $location->save();

            // Reload the page to reflect changes
            $this->redirect(request()->header('Referer'));
        } else {
            $this->dispatch('show-edit-panel', 'Location Parent ID', $current, 'on-location-parent-changed');
        }
    }
}