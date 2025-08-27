<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class DeviceInterface extends Model
{
    use HasFactory;

    protected $table = 'interfaces';
    protected $primaryKey = 'interface_id';

    public function device()
    {
        return $this->belongsTo(Device::class, 'device_serial_number');
    }

    public function pcieCard()
    {
        return $this->belongsTo(PcieCard::class, 'card_serial_number');
    }

    public function sourceConnections()
    {
        return $this->hasMany(Connection::class, 'source_interface_id');
    }

    public function destinationConnections()
    {
        return $this->hasMany(Connection::class, 'destination_interface_id');
    }
}
