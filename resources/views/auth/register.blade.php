@extends('default.baseof', [
'layout'   => 'centerDiv',
'headerH4' => 'Register page',
'headerP'  => 'Fill this form to register as a new user.',
'footer'   => '<p><small class="text-muted">Privacy statment</small></p>'
])

@section('content')

<form method="POST" action="{{ route('register') }}">

    @csrf

    {{-- begin:name --}}
    <div class="form-group">
        <label for="name" class="col-form-label field-required">{{ __('m.name') }}</label>
        <input id="name" type="text" class="form-control @error('name') is-invalid @enderror" name="name" value="{{ old('name') }}" required autocomplete="name" autofocus />
        @error('name')
        <span class="invalid-feedback" role="alert">
            <strong>{{ $message }}</strong>
        </span>
        @enderror
    </div>
    {{-- end:name --}}

    {{-- begin:surname --}}
    <div class="form-group">
        <label for="surname" class="col-form-label">{{ __('m.surname') }}</label>
        <input id="surname" type="text" class="form-control @error('surname') is-invalid @enderror" name="surname" value="{{ old('surname') }}" autocomplete="surname" />
        @error('surname')
        <span class="invalid-feedback" role="alert">
            <strong>{{ $message }}</strong>
        </span>
        @enderror
    </div>
    {{-- end:surname --}}

    {{-- begin:email --}}
    <div class="form-group">
        <label for="email" class="col-form-label field-required">{{ __('m.email') }}</label>
        <input id="email" type="email" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email') }}" required autocomplete="email" />
        @error('email')
        <span class="invalid-feedback" role="alert"><strong>{{ $message }}</strong></span>
        @enderror
    </div>
    {{-- end:email --}}

    {{-- begin:password --}}
    <div class="form-group has-feedback">
        <label for="password" class="col-form-label field-required">{{ __('m.password') }}</label>
        <div class="input-group">
            <input id="password" type="password" class="form-control @error('password') is-invalid @enderror" name="password" required autocomplete="new-password" />
            <div class="input-group-append">
                <i class="material-icons text-primary input-group-text" data-toggle="tooltip" data-placement="right" title="{{ __('m.help password') }}">help_outline</i>
            </div>
        </div>
        <small id="passwordHelp" class="form-text text-muted">{{ __('m.8 characters') }}</small>
        @error('password')
        <span class="invalid-feedback" role="alert"><strong>{{ $message }}</strong></span>
        @enderror
    </div>
    {{-- end:password --}}

    {{-- begin:repeat password --}}
    <div class="form-group">
        <label for="password-confirm" class="col-form-label field-required">{{ __('m.confirm password') }}</label>
        <input id="password-confirm" type="password" class="form-control" name="password_confirmation" required autocomplete="new-password" />
    </div>
    {{-- end:repeat password --}}

    {{-- begin:submit button --}}
    <div class="form-group mt-4">
        <button type="submit" class="btn btn-primary btn-block">
            {{ __('m.register') }}
        </button>
    </div>
    {{-- end:submit button --}}

</form>

@endsection
