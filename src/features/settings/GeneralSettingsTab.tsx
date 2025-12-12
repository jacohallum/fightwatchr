'use client'
import { useSession } from 'next-auth/react'

export default function GeneralSettingsTab() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Account Information
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
            <div className="text-gray-900 dark:text-white">{session?.user?.email}</div>
          </div>
        </div>
      </div>

      {/* Add more general settings here later */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Additional preferences coming soon...
        </p>
      </div>
    </div>
  )
}