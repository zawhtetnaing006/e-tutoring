@component('mail::message')
@include('mail.partials.logo')

# {{ $subjectLine }}

Hello {{ $recipientName }},

{{ $introLine }}

Your latest recorded activity was on {{ $latestActivityAt }}.

{{ $closingLine }}

@component('mail::button', ['url' => $appUrl])
Open E-Tutoring
@endcomponent

<div style="font-size:14px; color:#0f172a; text-align:center; font-weight:600;">
    {{ config('app.name') }}
</div>
@endcomponent
