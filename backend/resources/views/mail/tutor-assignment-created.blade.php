@component('mail::message')
@include('mail.partials.logo')

# {{ $subjectLine }}

Hello {{ $recipientName }},

{{ $introLine }}

@component('mail::panel')
{{ $counterpartyLabel }}: {{ $counterpartyName }}

From Date: {{ $fromDate }}

To Date: {{ $toDate }}
@endcomponent

@component('mail::button', ['url' => $appUrl])
Open E-Tutoring
@endcomponent

Please sign in to review the allocation details.

<div style="font-size:14px; color:#0f172a; text-align:center; font-weight:600;">
    {{ config('app.name') }}
</div>
@endcomponent
