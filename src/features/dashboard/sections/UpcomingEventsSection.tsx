'use client'
import { useQuery } from '@tanstack/react-query'

interface Event {
  id: string
  name: string
  date: string
  location: string
  venue: string
  eventType: string
  fightCount: number
}

export default function UpcomingEventsSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const res = await fetch('/api/events/upcoming')
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json() as Promise<{ events: Event[] }>
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load events
        </p>
      </div>
    )
  }

  if (!data?.events || data.events.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No upcoming events scheduled
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.events.map((event) => {
        const eventDate = new Date(event.date)
        const isThisWeek = eventDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

        return (
          <div
            key={event.id}
            className="border-l-4 border-blue-500 pl-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {event.name}
                  {isThisWeek && (
                    <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                      This Week
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  {event.location}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {event.fightCount} fights
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}