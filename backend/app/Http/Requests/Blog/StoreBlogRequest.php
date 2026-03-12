<?php

namespace App\Http\Requests\Blog;

use Illuminate\Foundation\Http\FormRequest;

class StoreBlogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'hashtags' => ['nullable', 'string', 'max:500'],
            'cover_image' => ['nullable', 'image', 'max:5120', 'mimes:jpeg,jpg,png,webp'],
        ];
    }
}
