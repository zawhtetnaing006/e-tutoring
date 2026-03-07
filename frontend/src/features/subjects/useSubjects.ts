import { useQuery } from '@tanstack/react-query'
import { getSubjects, type SubjectsResponse } from './api'

type UseSubjectsOptions = {
  page?: number
  perPage?: number
  enabled?: boolean
}

export function useSubjects(
  options: UseSubjectsOptions = {}
): ReturnType<typeof useQuery<SubjectsResponse>> {
  const { page = 1, perPage = 15, enabled = true } = options

  return useQuery<SubjectsResponse>({
    queryKey: ['subjects', page, perPage],
    queryFn: () => getSubjects({ page, perPage }),
    enabled,
  })
}
