'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { shuffle } from '@/lib/shuffle'

interface Asset {
  id: string
  title?: string
  description?: string
  blobPathRaw: string
  likeCount: number
  owner: {
    name: string
    department?: string
    supervisor?: string
  }
}

interface BallotItem {
  id: string
  asset: Asset
}

interface Ballot {
  id: string
  items: BallotItem[]
}

export default function VotePhotosClient() {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [ballot, setBallot] = useState<Ballot | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [assetsResponse, ballotResponse] = await Promise.all([
        fetch('/api/feed?type=image'),
        fetch('/api/ballot?category=IMAGE'),
      ])

      if (assetsResponse.ok) {
        const data = await assetsResponse.json()
        const shuffledAssets = shuffle(data.assets ?? [])
        setAssets(shuffledAssets)
      }

      if (ballotResponse.ok) {
        const ballotData = await ballotResponse.json()
        if (ballotData.ballot) {
          setBallot(ballotData.ballot)
          setSelectedIds(ballotData.ballot.items.map((item: BallotItem) => item.asset.id))
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSelection = async (assetId: string) => {
    const isSelected = selectedIds.includes(assetId)
    const newSelected = [...selectedIds]

    if (isSelected) {
      newSelected.splice(newSelected.indexOf(assetId), 1)
    } else {
      if (newSelected.length >= 5) {
        return // No-op if already at max
      }
      newSelected.push(assetId)
    }

    setSelectedIds(newSelected)

    // Update ballot
    try {
      await fetch('/api/ballot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'IMAGE',
          assetId,
          action: isSelected ? 'remove' : 'add',
        }),
      })
    } catch (error) {
      console.error('Error updating ballot:', error)
    }
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one photo')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/ballot/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'IMAGE' }),
      })

      if (response.ok) {
        alert('Votes submitted successfully!')
        router.push('/challenge')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit votes')
      }
    } catch (error) {
      console.error('Error submitting votes:', error)
      alert('Failed to submit votes')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading photos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Vote for Photos
          </h1>
          <Link
            href="/challenge"
            className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
          >
            Back to Challenge
          </Link>
        </div>

        {/* Sticky counter */}
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b p-3 text-sm mb-6">
          Selected {selectedIds.length}/5
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset) => {
            const isSelected = selectedIds.includes(asset.id)
            const imageUrl = `https://${process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT || 'your-storage-account'}.blob.core.windows.net/raw-images/${asset.blobPathRaw}`
            
            return (
              <div
                key={asset.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                  isSelected ? 'ring-4 ring-blue-500' : 'hover:shadow-lg'
                }`}
              >
                <div className="aspect-square relative">
                  <img
                    src={imageUrl}
                    alt={asset.title || 'Photo'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">
                    {asset.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    by {asset.owner.name}
                  </p>
                  {asset.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {asset.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    {asset.likeCount} votes
                  </p>
                  
                  <button
                    onClick={() => toggleSelection(asset.id)}
                    disabled={!isSelected && selectedIds.length >= 5}
                    className={`mt-3 w-full px-3 py-1 rounded border ${
                      !isSelected && selectedIds.length >= 5 
                        ? "opacity-50 cursor-not-allowed" 
                        : isSelected 
                          ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200" 
                          : "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {isSelected ? "Unselect" : "Select"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {assets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No photos available for voting</p>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/review?category=image"
              className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              Review & Submit ({selectedIds.length} selected)
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
