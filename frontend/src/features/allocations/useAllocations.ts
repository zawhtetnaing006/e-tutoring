import { useQuery } from '@tanstack/react-query'
import {
  getAllocation,
  getAllocations,
  type Allocation,
  type AllocationsResponse,
} from './api'

type UseAllocationsOptions = {
  page?: number
  perPage?: number
  search?: string
  onlyMine?: boolean
}

export function useAllocations(
  options: UseAllocationsOptions = {}
): ReturnType<typeof useQuery<AllocationsResponse>> {
  const { page = 1, perPage = 10, search = '', onlyMine } = options

  return useQuery<AllocationsResponse>({
    queryKey: ['allocations', page, perPage, search, onlyMine],
    queryFn: () => getAllocations({ page, perPage, search, onlyMine }),
  })
}

export function useAllocation(
  id: number | null
): ReturnType<typeof useQuery<Allocation>> {
  return useQuery<Allocation>({
    queryKey: ['allocations', 'detail', id],
    queryFn: () => getAllocation(id as number),
    enabled: id != null,
  })
}
