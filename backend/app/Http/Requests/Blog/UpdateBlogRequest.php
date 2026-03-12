<?php

namespace App\Http\Requests\Blog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBlogRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'hashtags' => ['nullable', 'string', 'max:500'],
            'cover_image' => ['nullable', 'image', 'max:5120', 'mimes:jpeg,jpg,png,webp'],
            'remove_cover_image' => ['sometimes', 'boolean'],
        ];
    }
}
