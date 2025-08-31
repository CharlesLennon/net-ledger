<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PcieCard extends Model
{
    use HasFactory;


    protected $primaryKey = 'card_serial_number';
    public $incrementing = false;
    protected $keyType = 'string';
    public function pcieSlot()
    {
        return $this->belongsTo(PcieSlot::class, 'slot_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function interfaces()
    {
        return $this->hasMany(DeviceInterface::class, 'card_serial_number');
    }
}
