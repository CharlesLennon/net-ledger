<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class IPAddress extends Model
{
    use HasFactory;

    protected $table = 'ip_addresses';
    protected $primaryKey = 'ip_address_id';

    public function devices()
    {
        return $this->belongsToMany(Device::class, 'device_ip', 'ip_address_id', 'device_serial_number');
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_ip_port', 'ip_address_id', 'service_id')->withPivot('port_number');
    }
}
