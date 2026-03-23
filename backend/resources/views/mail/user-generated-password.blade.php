@component('mail::message')
@include('mail.partials.logo')

# {{ $subjectLine }}

Hello {{ $recipientName }},

An account has been created for you.

Your generated temporary password is:

@component('mail::panel')
<div style="text-align:center;">
    <div style="font-size:24px; font-weight:700; letter-spacing:1px;">{{ $password }}</div>
</div>
@endcomponent

Please sign in and change your password as soon as possible.

<div style="font-size:14px; color:#0f172a; text-align:center; font-weight:600;">
    {{ config('app.name') }}
</div>
@endcomponent
