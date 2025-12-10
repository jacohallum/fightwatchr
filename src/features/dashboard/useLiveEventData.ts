// src/features/dashboard/useLiveEventData.ts

import { useQuery } from '@tanstack/react-query'
import { LiveEventResponse } from './types'

export function useLiveEventData() {
  return useQuery<LiveEventResponse>({
    queryKey: ['live-event'],
    queryFn: async () => {
      const res = await fetch('/api/events/live')
      if (!res.ok) {
        throw new Error('Failed to fetch live event')
      }
      return res.json()
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  })
}