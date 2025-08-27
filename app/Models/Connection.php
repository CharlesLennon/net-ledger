<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Connection extends Model
{
    use HasFactory;

    protected $primaryKey = 'connection_id';

    public function sourceInterface()
    {
        return $this->belongsTo(DeviceInterface::class, 'source_interface_id');
    }

    public function destinationInterface()
    {
        return $this->belongsTo(DeviceInterface::class, 'destination_interface_id');
    }
}
