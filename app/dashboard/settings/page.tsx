//app\dashboard\settings\page.tsx
'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useDashboardPreferences } from '@/src/features/dashboard/useDashboardPreferences'
import DashboardSettingsTab from '@/src/features/settings/DashboardSettingsTab'
import FightersSettingsTab from '@/src/features/settings/FightersSettingsTab'
import GeneralSettingsTab from '@/src/features/settings/GeneralSettingsTab'

type TabId = 'general' | 'dashboard' | 'fighters'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('general')
  
  const dashboardPrefs = useDashboardPreferences()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return null
  }

  const tabs = [
    { id: 'general' as TabId, label: 'General' },
    { id: 'dashboard' as TabId, label: 'Manage Dashboard' },
    { id: 'fighters' as TabId, label: 'Manage Fighters' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && <GeneralSettingsTab />}
            {activeTab === 'dashboard' && <DashboardSettingsTab {...dashboardPrefs} />}
            {activeTab === 'fighters' && <FightersSettingsTab />}
          </div>
        </div>
      </main>
    </div>
  )
}