<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="stylesheet" href="leap/assets/css/theme.min.css">
    <link rel="stylesheet" href="leap/assets/css/theme-saas-trend.css">
    <link rel="stylesheet" href="leap/assets/css/loaders/loader-typing.css">
    <link rel="preload" as="font" href="leap/assets/fonts/Inter-UI-upright.var.woff2" type="font/woff2"
        crossorigin="anonymous">
    <link rel="preload" as="font" href="leap/assets/fonts/Inter-UI.var.woff2" type="font/woff2" crossorigin="anonymous">
    <title>APEXHQ</title>
</head>

<body>
    <div id="apexhq">
        @include('partials.header')
        <div class="main">
            @yield('content')
        </div>
        @include('partials.footer')
    </div>
</body>

</html>
