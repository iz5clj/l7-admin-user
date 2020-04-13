@php
$navTitle = __('m.user profile');
@endphp

@extends('default.baseof', [
'layout' => 'dashboard',
'navTitle' => $navTitle
])

@section('content')


<div class="row">
    <div class="col">
        <div class="card">
            <div class="card-header">
                <div class="inner">
                    <h4 class="card-title">{{ $user->name }}</h4>
                    <p class="card-category">{{ __('m.your profile') }}</p>
                </div>
            </div>
            <div class="card-body ">
                <form action="{{ route('userUpdate', $user->id) }}" method="POST" enctype="multipart/form-data">
                    @csrf

                    @method('PUT')

                    @include('user.userForm')
                </form>
            </div>
        </div>
    </div>
</div>

@endsection

@section('extra-javascript')
@endsection
