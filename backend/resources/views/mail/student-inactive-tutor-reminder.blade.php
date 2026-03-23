@component('mail::message')
@include('mail.partials.logo')

# {{ $subjectLine }}

Hello {{ $recipientName }},

Our records show that {{ $studentRelationLabel }}, {{ $studentName }}, has been inactive for {{ $daysInactive }} days.

Their latest recorded activity was on {{ $latestActivityAt }}.

Please follow up with the student when appropriate.

@component('mail::button', ['url' => $appUrl])
Open E-Tutoring
@endcomponent

<div style="font-size:14px; color:#0f172a; text-align:center; font-weight:600;">
    {{ config('app.name') }}
</div>
@endcomponent
