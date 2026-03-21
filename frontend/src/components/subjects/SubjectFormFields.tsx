/** Shared shape for create/update subject forms. */
export type SubjectFormValues = {
  name: string
  description?: string | null
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export type SubjectFormFieldsProps = {
  nameId: string
  descriptionId: string
  form: SubjectFormValues
  onChange: (next: SubjectFormValues) => void
  namePlaceholder?: string
  descriptionPlaceholder?: string
  descriptionRows?: number
}

export function SubjectFormFields({
  nameId,
  descriptionId,
  form,
  onChange,
  namePlaceholder = 'e.g. Advanced Mathematics',
  descriptionPlaceholder = 'e.g. Brief description of the subject',
  descriptionRows = 4,
}: SubjectFormFieldsProps) {
  return (
    <div className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto p-4 sm:p-6">
      <div>
        <label
          htmlFor={nameId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Subject Name <span className="text-destructive">*</span>
        </label>
        <input
          id={nameId}
          type="text"
          className={inputClass}
          placeholder={namePlaceholder}
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          required
          maxLength={255}
        />
      </div>
      <div>
        <label
          htmlFor={descriptionId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id={descriptionId}
          className={inputClass}
          placeholder={descriptionPlaceholder}
          value={form.description || ''}
          onChange={e => onChange({ ...form, description: e.target.value })}
          maxLength={1000}
          rows={descriptionRows}
        />
      </div>
    </div>
  )
}
