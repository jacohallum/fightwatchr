import { useState, useEffect, useCallback } from 'react'

interface Fighter {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
  imageUrl: string | null
  nationality: string | null
  wins: number
  losses: number
  draws: number
  organizationId: string
}

interface UseFightersReturn {
  fighters: Fighter[]
  loading: boolean
  error: string | null
  searchFighters: (query: string) => Promise<void>
  fetchFighters: (options?: FetchOptions) => Promise<void>
  clearError: () => void
}

interface FetchOptions {
  organizationId?: string
  limit?: number
  offset?: number
}

export function useFighters(): UseFightersReturn {
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchFighters = useCallback(async (options: FetchOptions = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (options.organizationId) params.append('organizationId', options.organizationId)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())
      
      const response = await fetch(`/api/fighters?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch fighters')
      }
      
      const data = await response.json()
      setFighters(data.fighters || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fighters'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const searchFighters = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFighters([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ search: query })
      const response = await fetch(`/api/fighters?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to search fighters')
      }
      
      const data = await response.json()
      setFighters(data.fighters || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setFighters([])
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fighters,
    loading,
    error,
    searchFighters,
    fetchFighters,
    clearError
  }
}

// Lightweight hook for fighter search only
export function useFighterSearch() {
  const [searchResults, setSearchResults] = useState<Fighter[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    setSearchError(null)
    
    try {
      const params = new URLSearchParams({ search: query, limit: '20' })
      const response = await fetch(`/api/fighters?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      setSearchResults(data.fighters || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setSearchError(errorMessage)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setSearchError(null)
  }, [])

  return {
    searchResults,
    searching,
    searchError,
    search,
    clearSearch
  }
}