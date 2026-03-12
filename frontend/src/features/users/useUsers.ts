import { useQuery } from '@tanstack/react-query'
import { getUsers, type GetUsersParams, type UsersResponse } from './api'

type UseUsersOptions = GetUsersParams & {
  enabled?: boolean
}

export function useUsers(
  options: UseUsersOptions = {}
): ReturnType<typeof useQuery<UsersResponse>> {
  const {
    page = 1,
    perPage = 15,
    name = '',
    roleCode = '',
    enabled = true,
  } = options

  return useQuery<UsersResponse>({
    queryKey: ['users', page, perPage, name, roleCode],
    queryFn: () => getUsers({ page, perPage, name, roleCode }),
    enabled,
  })
}
