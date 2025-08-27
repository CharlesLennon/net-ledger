<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $primaryKey = 'location_id';

    public function parent()
    {
        return $this->belongsTo(Location::class, 'parent_location_id');
    }

    public function children()
    {
        return $this->hasMany(Location::class, 'parent_location_id');
    }

    public function devices()
    {
        return $this->hasMany(Device::class, 'location_id');
    }

    public function pcieCards()
    {
        return $this->hasMany(PcieCard::class, 'location_id');
    }
}
