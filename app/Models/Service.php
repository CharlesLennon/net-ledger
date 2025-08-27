<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Service extends Model
{
    use HasFactory;

    protected $primaryKey = 'service_id';

    public function ipAddresses()
    {
        return $this->belongsToMany(IPAddress::class, 'service_ip_port', 'service_id', 'ip_address_id')->withPivot('port_number');
    }
}
