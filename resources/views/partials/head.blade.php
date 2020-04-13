<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

{{-- CSRF Token --}}
<meta name="csrf-token" content="{{ csrf_token() }}">

<title>{{ config('app.name', 'Auxe by Michel Sabatino') }}</title>

{{-- begin :: Fontawesome 5.0 All styles --}}
{{-- <script defer src="{{ mix(asset('js/fontawesome.js')) }}"></script> --}}

{{-- Fonts are being loaded in the sass file --}}
{{-- begin :: Fonts --}}
{{-- <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700,200" rel="stylesheet" /> --}}

{{-- begin :: google icons --}}
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

{{-- begin :: Styles --}}
<link href="{{ mix(asset('css/app.css')) }}" rel="stylesheet">
<link href="{{ mix(asset('css/custom.css')) }}" rel="stylesheet">

{{-- begin :: icons from https://www.favicon-generator.org/ --}}
<link rel="apple-touch-icon" sizes="57x57" href="{{ asset('/icons/apple-icon-57x57.png') }}">
<link rel="apple-touch-icon" sizes="60x60" href="{{ asset('/icons/apple-icon-60x60.png') }}">
<link rel="apple-touch-icon" sizes="72x72" href="{{ asset('/icons/apple-icon-72x72.png') }}">
<link rel="apple-touch-icon" sizes="76x76" href="{{ asset('/icons/apple-icon-76x76.png') }}">
<link rel="apple-touch-icon" sizes="114x114" href="{{ asset('/icons/apple-icon-114x114.png') }}">
<link rel="apple-touch-icon" sizes="120x120" href="{{ asset('/icons/apple-icon-120x120.png') }}">
<link rel="apple-touch-icon" sizes="144x144" href="{{ asset('/icons/apple-icon-144x144.png') }}">
<link rel="apple-touch-icon" sizes="152x152" href="{{ asset('/icons/apple-icon-152x152.png') }}">
<link rel="apple-touch-icon" sizes="180x180" href="{{ asset('/icons/apple-icon-180x180.png') }}">
<link rel="icon" type="image/png" sizes="192x192"  href="{{ asset('/icons/android-icon-192x192.png') }}">
<link rel="icon" type="image/png" sizes="32x32" href="{{ asset('/icons/favicon-32x32.png') }}">
<link rel="icon" type="image/png" sizes="96x96" href="{{ asset('/icons/favicon-96x96.png') }}">
<link rel="icon" type="image/png" sizes="16x16" href="{{ asset('/icons/favicon-16x16.png') }}">
<link rel="manifest" href="{{ asset('/icons/manifest.json') }}">
<meta name="msapplication-TileColor" content="#ffffff">
<meta name="msapplication-TileImage" content="{{ asset('/icons/ms-icon-144x144.png') }}">
<meta name="theme-color" content="#ffffff">
{{-- end :: icons --}}