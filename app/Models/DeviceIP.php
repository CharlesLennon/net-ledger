<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceIP extends Model
{
    use HasFactory;

    protected $table = 'device_ip';
    public $incrementing = false; // Disable auto-incrementing primary key
    protected $primaryKey = ['device_serial_number', 'ip_address_id']; // Define composite primary key
    protected $guarded = []; // Allow mass assignment for all attributes
}