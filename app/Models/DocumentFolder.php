<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentFolder extends Model
{
    protected $table = 'document_folder';

    protected $fillable = [
        'name', 'parent_id', 'type'
    ];
}
