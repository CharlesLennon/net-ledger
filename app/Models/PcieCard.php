<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PcieCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_serial_number',
        'model_name',
        'type',
        'slot_id',
        'location_id'
    ];

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
