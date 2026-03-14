import { useQuery } from '@tanstack/react-query'
import { getUsers, type GetUsersParams, type UsersListResponse } from './api'

type UseUsersOptions = GetUsersParams & {
  enabled?: boolean
}

export function useUsers(
  options: UseUsersOptions = {}
): ReturnType<typeof useQuery<UsersListResponse>> {
  const {
    page = 1,
    perPage = 15,
    name = '',
    roleCode = '',
    enabled = true,
  } = options

  return useQuery<UsersListResponse>({
    queryKey: ['users', page, perPage, name, roleCode],
    queryFn: () => getUsers({ page, perPage, name, roleCode }),
    enabled,
  })
}
