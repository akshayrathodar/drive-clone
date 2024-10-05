<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleTokens extends Model
{
    protected $table = 'google_tokens';

    protected $fillable = [
        'name', 'value'
    ];
}
