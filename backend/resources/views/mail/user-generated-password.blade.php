@component('mail::message')
@include('mail.partials.logo')

# {{ $subjectLine }}

Hello {{ $recipientName }},

{{ $introLine }}

{{ $supportingLine }}

Your temporary password is:

@component('mail::panel')
<div style="text-align:center;">
    <div style="font-size:24px; font-weight:700; letter-spacing:1px;">{{ $password }}</div>
</div>
@endcomponent

@component('mail::button', ['url' => $appUrl])
Open E-Tutoring
@endcomponent

{{ $closingLine }}

<div style="font-size:14px; color:#0f172a; text-align:center; font-weight:600;">
    {{ config('app.name') }}
</div>
@endcomponent
