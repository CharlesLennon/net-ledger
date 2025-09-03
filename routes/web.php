<?php

use App\Livewire\NetworkView;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/sanity-check', function () {
    return view('sanity-check');
});

Route::post('/refresh-db', function () {
    try {
        Artisan::call('migrate:fresh', ['--seed' => true]);

        return response('Database refreshed successfully!', 200);
    } catch (Exception $e) {
        return response('Database refresh failed: '.$e->getMessage(), 500);
    }
});

Route::get('/{any}', NetworkView::class)->where('any', '.*');
