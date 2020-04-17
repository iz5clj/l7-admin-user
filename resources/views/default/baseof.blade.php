<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    @include('partials.head')
</head>

<body>
    <div class="wrapper">

        @switch($layout)

        @case('dashboard')
        @include('partials.aside')
        <div class="main-panel">
            @include('partials.header', ['navTitle' => $navTitle])
            <div class="content">
                <div class="container-fluid">
                    @if (session('success'))
                    <div class="session-message alert alert-success">
                        <button type="button" class="chiusura btn btn-success">
                            {{ __('m.close in') }} <span class="count_number">5</span> {{ __('m.seconds') }}
                        </button>
                        {{ session('success') }}
                    </div>
                    @endif
                    @if (session('warning'))
                    <div class="session-message alert alert-warning">
                        {{-- <span id="close">X</span> --}}
                        {{ session('warning') }}
                    </div>
                    @endif
                    @yield('content')
                </div>
            </div>
            @include('partials.footer')
        </div>
        @break

        @case('centerDiv')
        <div class="container h-100">
            <div class="row h-100 justify-content-center align-items-center">
                <div class="col-md-6">
                    <div id="login-card" class="card px-3">
                        <div class="card-header card-header-primary">
                            <div class="border-bottom pb-1">
                                @if($headerH4)
                                <h4 class="card-title">{{ $headerH4 }}</h4>
                                @endif
                                @if($headerP)
                                <small class="text-muted">{{ $headerP }}</small>
                                @endif
                            </div>
                        </div>
                        {{-- card-header --}}

                        <div class="card-body">
                            @yield('content')
                        </div>

                        @if($footer)
                        <div class="card-footer">
                            <div class="border-top">
                                {!! $footer !!}
                            </div>
                        </div>
                        @endif

                    </div>
                    {{-- end::card --}}
                </div>
                {{-- end::col-md-6 --}}
            </div>
            {{-- end::row --}}
        </div>
        {{-- end::container --}}
        @break

        @endswitch

    </div>
    {{-- end::wrapper --}}

    @include('partials.javascript')
    @yield('extra-javascript')

</body>

</html>
