<?php

Route::get('/', function () {
    return view('pages.home');
});

Route::get('/about-us', function () {
    return view('pages.about');
});
