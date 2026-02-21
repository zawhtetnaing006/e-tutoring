<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Password Reset Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines are the default lines which match reasons
    | that are given by the password broker for a password update attempt
    | outcome such as failure due to an invalid password / reset token.
    |
    */

    'reset' => 'Password reset successful.',
    'sent' => 'If the email exists, a reset OTP has been sent.',
    'throttled' => 'Please wait before retrying.',
    'token' => 'The provided OTP is invalid or expired.',
    'user' => "We can't find a user with that email address.",
    'mail_subject' => ':app password reset OTP',
    'mail_heading' => 'Reset your password',
    'mail_intro' => 'Use this OTP to reset your password:',
    'mail_expire' => 'This OTP expires in :minutes minutes.',
    'mail_ignore' => 'If you did not request a password reset, no further action is required.',

];
