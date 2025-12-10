// src/features/dashboard/sections/NewsSection.tsx
export function NewsSection() {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <p className="mb-2">Latest MMA News</p>
      <div className="space-y-2 text-xs">
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="font-semibold">Breaking: Fighter announces return</div>
          <div className="text-gray-500 dark:text-gray-400">2 hours ago</div>
        </div>
      </div>
    </div>
  )
}