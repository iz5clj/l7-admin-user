<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    @include('partials.head')
</head>

<body>

    <div class="d-flex flex-column justify-content-center align-items-center bg-white"
        style="height: 100vh;">
        <div class="border border-dark bg-light px-3 py-2 mb-4">
            <p>{{ $name }} - {{ $version }} - Language: {{ $language }}</p>
            <p>Italiano: @lang('passwords.user')</p>
            <p>If you see this div in the middle of the screen, bootstrap has been loaded.</p>
            <p>This website is created by: Michel.</p>
            <p>The next line will test the components of Laravel</p>
            <x-alert message="This is an error message" type="danger" />
            <p id="jquery-text" class="text-danger">Jquery is not working</p>
            <p>If you see the icons below, Google icons is working.</p>
            <p>
                <span class="material-icons text-primary align-bottom font-weight-normal">computer</span>
                <span class="material-icons text-primary align-bottom font-weight-bold">computer</span>
                <span class="material-icons text-primary align-bottom font-weight-bold">computer</span>
                <span class="material-icons text-primary align-bottom" style="font-size: 2rem;">computer</span>
                <span class="material-icons text-primary align-bottom" style="font-size: 3rem;">computer</span>
            </p>
            <button type="button" class="btn btn-primary btn-block" data-toggle="tooltip" data-placement="top"
                title="This tooltip will appear on top of the button">
                Hoover this button to check if tooltip is working
            </button>
            @if(Route::has('register'))
            <p><a href="{{ route('register') }}">Register a new user</a></p>
            @endif
            <p><a href="{{ route('dashboard') }}">Goto admin panel</a></p>
            <p><a href="{{ route('login') }}">Login page</a></p>
            <p>
                <a href="{{ route('logout') }}" 
                    onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                    Logout
                </a>
                <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                @csrf
                </form>
            </p>
            <p><a href="{{ route('test') }}">Test page</a></p>
        </div>
    </div>

    @include('partials.javascript')

</body>

</html>
