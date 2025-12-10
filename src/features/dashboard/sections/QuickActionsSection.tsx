// features/dashboard/sections/QuickActionsSection.tsx
export function QuickActionsSection() {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <p className="mb-2">Quick Actions</p>
      <div className="space-y-2">
        <button className="w-full p-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
          Make a Prediction
        </button>
        <button className="w-full p-2 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
          View Events
        </button>
      </div>
    </div>
  )
}