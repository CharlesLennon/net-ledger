<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceTemplate extends Model
{
    protected $primaryKey = 'template_id';

    protected $casts = [
        'specifications_json' => 'array',
    ];

    public function devices()
    {
        return $this->hasMany(Device::class, 'template_id');
    }
}
