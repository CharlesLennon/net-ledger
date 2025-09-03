<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Connection extends Model
{
    use HasFactory;

    protected $primaryKey = 'connection_id';

    protected $fillable = [
        'source_interface_id',
        'destination_interface_id',
        'cable_type',
    ];

    public function sourceInterface()
    {
        return $this->belongsTo(DeviceInterface::class, 'source_interface_id');
    }

    public function destinationInterface()
    {
        return $this->belongsTo(DeviceInterface::class, 'destination_interface_id');
    }
}
