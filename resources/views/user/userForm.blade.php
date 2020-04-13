{{-- begin::name --}}
<div class="form-group">
    <label class="label-form field-required " for="name">{{ __('m.name') }}</label>
    <input type="text" class="form-control @error('name') is-invalid @enderror" name="name" value="{{ old('name') ? old('name') : $user->name }}" autofocus />
    @if($errors->has('name'))
    <small class="form-text invalid-feedback">{{ $errors->first('name') }}</small>
    @else
    <small class="form-text text-muted">{{ __('m.help name') }}</small>
    @endif
</div>
{{-- end::name --}}

{{-- begin::surname --}}
<div class="form-group">
    <label class="label-form" for="surname">{{ __('m.surname') }}</label>
    <input type="text" class="form-control @error('surname') is-invalid @enderror" name="surname" value="{{ old('surname') ? old('surname') : $user->surname }}" />
    @if($errors->has('surname'))
    <small class="form-text invalid-feedback">{{ $errors->first('surname') }}</small>
    @else
    <small class="form-text text-muted">{{ __('m.help surname') }}</small>
    @endif
</div>
{{-- end::name --}}

{{-- begin:email --}}
<div class="form-group">
    <label for="email" class="col-form-label field-required">{{ __('m.email') }}</label>
    <input id="email" type="email" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email') ? old('email') : $user->email }}" autocomplete="email" />
    @if($errors->has('email'))
    <span class="invalid-feedback" role="alert"><strong>{{ $errors->first('email') }}</strong></span>
    @else
    <small class="form-text text-muted">{{ __('m.help email') }}</small>
    @endif
</div>
{{-- end:email --}}

{{-- begin::row for avatar --}}
{{-- inspired from https://bootsnipp.com/snippets/xg7B --}}
<div class="row align-items-center">
    <div class="col-sm-12 col-md-2 form-group">
        {{-- if you want center horizontal as well add this class: justify-content-center --}}
        <div id="avatar-column" class="d-flex align-items-center">
            <img src="{{ ($action === 'create') ? "/assets/images/avatar/default.png" : "/assets/images/avatar/$user->avatar" }}" id="v2-img-tag" width="100px" />
        </div>
    </div>
    <div class="col-md-4">
        <div class="input-group image-preview">
            {{-- don't give a name === doesn't send on POST/GET --}}
            <input type="text" class="form-control image-preview-filename" disabled="disabled" />
            <div class="input-group-append">
                <!-- image-preview-clear button -->
                <div class="btn image-preview-clear text-danger" style="display:none;">
                    <span class="material-icons">clear</span> Clear
                </div>
                <!-- image-preview-input -->
                <div class="btn image-preview-input">
                    <span class="material-icons">folder_open</span>
                    <span class="image-preview-input-title">Browse</span>
                    <input type="file" accept="image/png, image/jpeg, image/gif" name="avatar" /> <!-- rename it -->
                </div>
            </div>
        </div>
        {{-- begin::remove avatar checkbox --}}
        <div class="custom-control custom-checkbox mt-3">
            <input type="checkbox" class="custom-control-input" id="noAvatar" name="noAvatar">
            <label class="custom-control-label" for="noAvatar">{{ __('m.remove avatar') }}</label>
        </div>
        {{-- end::remove avatar checkbox --}}
    </div>
</div>

{{-- begin::submit button --}}
<div class="form-group row">
    <div class="col-sm-12 col-md-4 pt-1">
        <button type="submit" class="btn btn-primary btn-block">
            Conferma
        </button>
    </div>
    {{-- @if ($action === 'create')
            <div class="col-sm-12 col-md-4 pt-1">
                <button type="submit" class="btn btn-secondary btn-block" name="submitButton" value="submitAndAdd">
                    Conferma e Nuovo
                </button>
            </div>
            @endif --}}
    <div class="col-sm-12 col-md-4 pt-1">
        <a class="btn btn-outline-danger btn-block" href="{{ URL::previous() }}">
            Cancella
        </a>
    </div>
</div>
{{-- end::submit button --}}

{{-- begin::extra --}}
<p class="text-muted mt-3">
    (<span class="text-danger">*</span>) {{ __('m.requested fields') }}
</p>
{{-- end::extra --}}

@section('extra-javascript')
<script>
    $(function() {
        // Create the close button
        var closebtn = $('<button/>', {
            type: "button"
            , text: 'x'
            , id: 'close-preview'
            , style: 'font-size: initial;'
        , });
        closebtn.attr("class", "close pull-right");

        // Clear event
        $('.image-preview-clear').click(function() {
            $('#v2-img-tag').attr('src', 'data:image/png;base64,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');
            // $('.image-preview').attr("data-content", "").popover('hide');
            $('.image-preview-filename').val("");
            $('.image-preview-clear').hide();
            $('.image-preview-input input:file').val("");
            $(".image-preview-input-title").text("Browse");
        });

        // Create the preview image
        $(".image-preview-input input:file").change(function() {

            var file = this.files[0];
            var reader = new FileReader();

            // Set preview image into the popover data-content
            reader.onload = function(e) {

                $('#v2-img-tag').attr('src', e.target.result);

                $(".image-preview-input-title").text("Change");
                $(".image-preview-clear").show();
                $(".image-preview-filename").val(file.name);
                img.attr('src', e.target.result);
                // $(".image-preview").attr("data-content",$(img)[0].outerHTML).popover("show");
            }
            reader.readAsDataURL(file);
        });
    });

</script>
@endsection
