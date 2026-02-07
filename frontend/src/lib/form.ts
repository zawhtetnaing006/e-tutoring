import { zodResolver } from '@hookform/resolvers/zod'

/**
 * react-hook-form resolver for a Zod schema.
 * Use with useForm; type the form with z.infer<typeof schema>.
 *
 * @example
 * const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
 * type FormData = z.infer<typeof schema>
 * const form = useForm<FormData>({
 *   resolver: createZodResolver(schema),
 *   defaultValues: { email: '', password: '' },
 * })
 */
export const createZodResolver = zodResolver
