@component('mail::message')
# {{ __('passwords.mail_heading') }}

{{ __('passwords.mail_intro') }}

@component('mail::panel')
<div style="text-align:center;">
    <div style="font-size:32px; letter-spacing:8px; font-weight:700;">{{ $otp }}</div>
</div>
@endcomponent

{{ __('passwords.mail_expire', ['minutes' => $expireMinutes]) }}

{{ __('passwords.mail_ignore') }}

{{ config('app.name') }}
@endcomponent
