@php($logoUrl = config('mail.brand.logo_url'))

@if($logoUrl)
<div style="text-align:center; margin-bottom:20px;">
    <img
        src="{{ $logoUrl }}"
        alt="{{ config('app.name') }} logo"
        style="display:inline-block; max-width:120px; height:auto;"
    >
</div>
@endif
