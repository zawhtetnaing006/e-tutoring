<?php

namespace App\Http\Requests\BlogComment;

use Illuminate\Foundation\Http\FormRequest;

class StoreBlogCommentRequest extends FormRequest
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
            'comment_text' => ['required', 'string', 'max:5000'],
        ];
    }
}
