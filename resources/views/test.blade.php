<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    @include('partials.head')
</head>

<body>
    <div class="wrapper">
        <div class="container h-100">
            <div class="row h-100 justify-content-center align-items-center">
                <div class="border border-dark bg-light px-3 py-2 mb-4">
                    <p>Nothing to test</p>
                    <p><a href="{{ route('index') }}">Back to home</a></p>
                </div>
            </div>
        </div>
    </div>

    @include('partials.javascript')

    <script>
        // place to test your js script
    </script>

</body>

</html>
