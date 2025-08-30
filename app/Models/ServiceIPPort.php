<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceIPPort extends Model
{
    use HasFactory;

    protected $table = 'service_ip_port';
    public $incrementing = false; // Disable auto-incrementing primary key
    protected $primaryKey = ['service_id', 'ip_address_id', 'port_number']; // Define composite primary key
    protected $guarded = []; // Allow mass assignment for all attributes
}