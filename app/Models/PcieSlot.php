<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PcieSlot extends Model
{
    use HasFactory;

    protected $primaryKey = 'slot_id';

    public function device()
    {
        return $this->belongsTo(Device::class, 'device_serial_number');
    }

    public function pcieCard()
    {
        return $this->hasOne(PcieCard::class, 'slot_id');
    }
}
