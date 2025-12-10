// features/dashboard/sections/RankingsSection.tsx
export function RankingsSection() {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <p className="mb-2">Fighter Rankings</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between p-1">
          <span>1. Fighter Name</span>
          <span className="text-gray-500">Champion</span>
        </div>
        <div className="flex justify-between p-1">
          <span>2. Fighter Name</span>
          <span className="text-gray-500">#1 Contender</span>
        </div>
      </div>
    </div>
  )
}