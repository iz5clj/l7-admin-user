@extends('default.baseof', [
'layout'   => 'dashboard',
'navTitle' => 'System Info.'
])

@section('content')

<div class="row">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">
                <div class="inner" style="border-bottom: 1px solid #2c2c2c;">
                    <h4 class="card-title">System Information</h4>
                    <p class="card-category">Some data on your system.</p>
                </div>
            </div>
            <div class="card-body ">
                <dl>
                    @foreach( $infos as $info)
                    <dt>{{ $info['title'] }}</dt>
                    <dd>
                        <p>
                            {{-- @if($info['title'] === 'PHP Version')
                                    <a href="{{ route('phpinfo') }}">{{ $info['value'] }} phpinfo</a>
                            @else --}}
                            {{ $info['value'] }}
                            {{-- @endif --}}
                        </p>
                    </dd>
                    @endforeach
                </dl>

            </div>
        </div>
    </div>
</div>

@endsection
