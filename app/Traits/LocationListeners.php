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
    public function onLocationTitleChanged(int $location_id, string $new_title): void
    {
        $location = Location::find($location_id);
        if (!$location) {
            return;
        }

        $location->name = $new_title;
        $location->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }

    #[On('on-location-parent-changed')]
    public function onLocationParentChanged(int $location_id, ?int $new_parent_id): void
    {
        $location = Location::find($location_id);
        if (!$location) {
            return;
        }

        $location->parent_location_id = $new_parent_id;
        $location->save();

        // Reload the page to reflect changes
        $this->redirect(request()->header('Referer'));
    }
}