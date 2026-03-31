import { useQuery } from '@tanstack/react-query'
import {
  getUser,
  getUsers,
  type GetUsersParams,
  type UserResource,
  type UsersListResponse,
} from './api'

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
    role_code = undefined,
    enabled = true,
  } = options

  return useQuery<UsersListResponse>({
    queryKey: ['users', page, perPage, name, role_code],
    queryFn: () => getUsers({ page, perPage, name, role_code }),
    enabled,
  })
}

export function useUser(
  userIdentifier: string | number | null | undefined,
  enabled = true
): ReturnType<typeof useQuery<UserResource>> {
  return useQuery<UserResource>({
    queryKey: ['users', 'detail', userIdentifier],
    queryFn: () => getUser(userIdentifier as string | number),
    enabled: enabled && userIdentifier != null,
  })
}
