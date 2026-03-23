@component('mail::message')
@include('mail.partials.logo')

# {{ __('passwords.mail_heading') }}

{{ __('passwords.mail_intro') }}

@component('mail::panel')
<div style="text-align:center;">
    <div style="font-size:32px; letter-spacing:8px; font-weight:700;">{{ $otp }}</div>
</div>
@endcomponent

{{ __('passwords.mail_expire', ['minutes' => $expireMinutes]) }}

<div style="font-size:14px; line-height:1.7; color:#64748b; text-align:center; margin-bottom:8px;">
    {{ __('passwords.mail_ignore') }}
</div>

<div style="font-size:14px; color:#0f172a; text-align:center; font-weight:600;">
    {{ config('app.name') }}
</div>
@endcomponent
