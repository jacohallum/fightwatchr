// src/features/dashboard/sections/UpcomingEventsSection.tsx
export function UpcomingEventsSection() {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <p className="mb-2">Next UFC events coming soon...</p>
      <div className="space-y-2 text-xs">
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
          UFC 300 - April 13, 2024
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
          UFC Fight Night - April 20, 2024
        </div>
      </div>
    </div>
  )
}