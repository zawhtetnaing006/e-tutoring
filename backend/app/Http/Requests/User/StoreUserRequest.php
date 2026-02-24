<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\RequiredIf;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'auto_generate_password' => ['sometimes', 'boolean'],
            'password' => [
                new RequiredIf(! $this->boolean('auto_generate_password')),
                'nullable',
                'string',
                'min:8',
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'user_type' => ['required', Rule::in(User::TYPES)],
            'subject_ids' => ['sometimes', 'array'],
            'subject_ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
        ];
    }
}
