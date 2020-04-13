@extends('default.baseof', [
'layout' => 'dashboard',
'navTitle' => 'Dashboard (new)'
])

@section('content')

<div class="row">
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <div class="inner" style="border-bottom: 1px solid #2c2c2c;">
                    <h4 class="card-title">Users</h4>
                    <p class="card-category">Number of registrered users.</p>
                </div>
            </div>
            <div class="card-body ">
                <p>We have {{ $users }} users.</p>
            </div>
        </div>
    </div>
</div>

@endsection
