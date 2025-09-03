<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NodePosition extends Model
{
    protected $primaryKey = 'position_id';

    protected $fillable = [
        'view_id',
        'node_type',
        'node_id',
        'x_position',
        'y_position',
    ];

    protected $casts = [
        'x_position' => 'decimal:2',
        'y_position' => 'decimal:2',
    ];

    public function networkView(): BelongsTo
    {
        return $this->belongsTo(NetworkView::class, 'view_id', 'view_id');
    }
}
