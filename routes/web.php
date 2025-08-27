<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/sanity-check');
});

Route::get('/sanity-check', function () {
    return view('sanity-check');
});
