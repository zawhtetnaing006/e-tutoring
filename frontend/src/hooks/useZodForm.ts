import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { createZodResolver } from '@/lib/form'

/** Form values must extend FieldValues (Record<string, any>) for react-hook-form */
type InferSchemaValues<T extends z.ZodType<FieldValues>> = z.infer<T>

/**
 * useForm with Zod validation (react-hook-form + @hookform/resolvers + zod).
 * Schema output must be a plain object (e.g. z.object({ ... })).
 *
 * @example
 * const schema = z.object({ name: z.string().min(1), age: z.coerce.number().min(0) })
 * const form = useZodForm(schema, { defaultValues: { name: '', age: 0 } })
 */
export function useZodForm<Schema extends z.ZodType<FieldValues>>(
  schema: Schema,
  options?: Omit<UseFormProps<InferSchemaValues<Schema>>, 'resolver'>,
): UseFormReturn<InferSchemaValues<Schema>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod 4 vs @hookform/resolvers type mismatch
  const resolver = createZodResolver(schema as any) as UseFormProps<FieldValues>['resolver']
  const form = useForm({
    ...(options as UseFormProps<FieldValues>),
    resolver,
  })
  return form as unknown as UseFormReturn<InferSchemaValues<Schema>>
}
