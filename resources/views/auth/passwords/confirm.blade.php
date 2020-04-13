@extends('default.baseof', [
'layout' => 'centerDiv',
'headerH4' => 'Password confirm',
'headerP' => 'Please confirm your password before proceeding.',
'footer' => '<p><small class="text-muted">Terms privacy</small></p>'
])

@section('content')

<form method="POST" action="{{ route('password.confirm') }}">

    @csrf

    <div class="form-group">
        <label for="password" class="col-form-label">{{ __('Password') }}</label>
        <input id="password" type="password" class="form-control @error('password') is-invalid @enderror" name="password" required autocomplete="current-password" />

        @error('password')
        <span class="invalid-feedback" role="alert">
            <strong>{{ $message }}</strong>
        </span>
        @enderror
    </div>

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
