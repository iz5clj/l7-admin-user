@extends('default.baseof', [
'layout' => 'centerDiv',
'headerH4' => 'Login page',
'headerP' => 'Use your email to login.',
'footer' => '<p><small class="text-muted">Terms privacy</small></p>'
])

@section('content')

<form method="POST" action="{{ route('login') }}">

    @csrf

    {{-- begin::email --}}
    <div class="form-group">
        <label for="email" class="col-form-label">{{ __('E-Mail Address') }}</label>
        <input id="email" type="email" class="form-control @error('email') is-invalid @enderror" name="email"
            value="{{ old('email') }}" required autocomplete="email" autofocus />
        <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
        @error('email')
            <span class="invalid-feedback" role="alert">
                <strong>{{ $message }}</strong>
            </span>
        @enderror
    </div>
    {{-- end::email --}}

    {{-- begin::password --}}
    <div class="form-group">
        <label for="password" class="col-form-label">{{ __('Password') }}</label>
        <input id="password" type="password" class="form-control @error('password') is-invalid @enderror"
            name="password" required autocomplete="current-password" />
        <small id="passwordHelp" class="form-text text-muted">Introduce your password.</small>
        @error('password')
            <span class="invalid-feedback" role="alert">
                <strong>{{ $message }}</strong>
            </span>
        @enderror
    </div>
    {{-- end::password --}}

    {{-- begin::remember me --}}
    <div class="form-group form-check">
        <input class="form-check-input" type="checkbox" name="remember" id="remember"
            {{ old('remember') ? 'checked' : '' }} />
        <label class="form-check-label" for="remember">{{ __('Remember Me') }}</label>
        <small id="rememberMeHelp"
            class="form-text text-muted">{{ __('This option will let you login quicker next time') }}</small>
    </div>
    {{-- end::remember me --}}

    {{-- begin::submit button --}}
    <div class="form-group row mt-4">
        <div class="col-md-6">
            <button type="submit" class="btn btn-primary btn-block">
                {{ __('Login') }}
            </button>
        </div>

        @if(Route::has('password.request'))
            <div class="col-md-6 text-sm-right">
                <a class="btn btn-link btn-sm" href="{{ route('password.request') }}">
                    {{ __('Forgot Your Password?') }}
                </a>
            </div>
        @endif
    </div>
    {{-- end::submit button --}}

</form>

@endsection
