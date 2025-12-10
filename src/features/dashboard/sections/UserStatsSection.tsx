// features/dashboard/sections/UserStatsSection.tsx
export function UserStatsSection() {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <p className="mb-2">Your Stats</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-center">
          <div className="font-semibold text-lg">0</div>
          <div className="text-gray-500">Predictions</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-center">
          <div className="font-semibold text-lg">0%</div>
          <div className="text-gray-500">Accuracy</div>
        </div>
      </div>
    </div>
  )
}