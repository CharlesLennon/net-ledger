<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class History extends Model
{
    use HasFactory;

    protected $table = 'history';
    protected $primaryKey = 'history_id';
    const UPDATED_AT = null;
}
