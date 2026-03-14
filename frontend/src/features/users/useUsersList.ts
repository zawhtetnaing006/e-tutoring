import { useQuery } from '@tanstack/react-query'
import { getUsers, type UsersListResponse } from './api'

type UseUsersListOptions = {
  page?: number
  perPage?: number
  userType?: 'STAFF' | 'STUDENT' | 'TUTOR'
  enabled?: boolean
}

export function useUsersList(
  options: UseUsersListOptions = {}
): ReturnType<typeof useQuery<UsersListResponse>> {
  const { page = 1, perPage = 10, userType, enabled = true } = options

  return useQuery<UsersListResponse>({
    queryKey: ['users', 'list', page, perPage, userType],
    queryFn: () => getUsers({ page, per_page: perPage, user_type: userType }),
    enabled,
  })
}
