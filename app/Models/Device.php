<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Device extends Model
{
    use HasFactory;

    protected $primaryKey = 'serial_number';
    public $incrementing = false;
    protected $keyType = 'string';

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function deviceTemplate()
    {
        return $this->belongsTo(DeviceTemplate::class, 'template_id');
    }

    public function pcieSlots()
    {
        return $this->hasMany(PcieSlot::class, 'device_serial_number');
    }

    public function interfaces()
    {
        return $this->hasMany(DeviceInterface::class, 'device_serial_number');
    }

    public function ipAddresses()
    {
        return $this->belongsToMany(IPAddress::class, 'device_ip', 'device_serial_number', 'ip_address_id');
    }
}
