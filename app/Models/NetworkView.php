<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NetworkView extends Model
{
    protected $primaryKey = 'view_id';

    protected $fillable = [
        'name',
        'description',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function nodePositions(): HasMany
    {
        return $this->hasMany(NodePosition::class, 'view_id', 'view_id');
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
}
