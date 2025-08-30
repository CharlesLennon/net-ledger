<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
 
        <title>{{ $title ?? 'Page Title' }}</title>

        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        
        <!-- LiteGraph.js -->
        <script src="https://unpkg.com/litegraph.js@0.7.16/build/litegraph.js"></script>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/litegraph.js@0.7.16/css/litegraph.css">
 
        @vite(['resources/css/app.css', 'resources/js/app.js'])

        @livewireStyles
    </head>
    <body class="bg-gray-900 text-white">
        {{ $slot }}

        @stack('scripts') // Add this line
        @livewireScripts
    </body>
</html>