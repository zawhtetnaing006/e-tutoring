import { useQuery } from '@tanstack/react-query'
import { getSubjects, type SubjectsResponse } from './api'

type UseSubjectsOptions = {
  page?: number
  per_page?: number
  /** @deprecated Use per_page */
  perPage?: number
  name?: string
  enabled?: boolean
}

export function useSubjects(
  options: UseSubjectsOptions = {}
): ReturnType<typeof useQuery<SubjectsResponse>> {
  const { page = 1, enabled = true, name } = options
  const perPage = options.per_page ?? options.perPage ?? 15

  return useQuery<SubjectsResponse>({
    queryKey: ['subjects', page, perPage, name?.trim() ?? ''],
    queryFn: () => getSubjects({ page, per_page: perPage, name }),
    enabled,
  })
}
