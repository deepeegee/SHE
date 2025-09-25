'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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

interface LeaderboardData {
  images: Asset[]
  videos: Asset[]
}

export default function Admin() {
  const { data: session } = useSession()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/signin')
      return
    }

    loadLeaderboard()
  }, [session, router])

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard')
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      } else if (response.status === 403) {
        alert('Admin access required')
        router.push('/challenge')
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  if (!leaderboard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">You need admin access to view this page.</p>
            <Link
              href="/challenge"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Challenge
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Leaderboard
          </h1>
          <Link
            href="/challenge"
            className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
          >
            Back to Challenge
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Photos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📸 Top Photos
            </h2>
            
            {leaderboard.images.length > 0 ? (
              <div className="space-y-4">
                {leaderboard.images.map((asset, index) => {
                  const imageUrl = `https://${process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT || 'your-storage-account'}.blob.core.windows.net/raw-images/${asset.blobPathRaw}`
                  
                  return (
                    <div key={asset.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-blue-600">
                          #{index + 1}
                        </span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={asset.title || 'Photo'}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {asset.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          by {asset.owner.name}
                        </p>
                        {asset.owner.department && (
                          <p className="text-xs text-gray-500">
                            Dept: {asset.owner.department}
                          </p>
                        )}
                        {asset.owner.supervisor && (
                          <p className="text-xs text-gray-500">
                            Supervisor: {asset.owner.supervisor}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-bold text-green-600">
                          {asset.likeCount}
                        </p>
                        <p className="text-xs text-gray-500">votes</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No photos submitted yet</p>
            )}
          </div>

          {/* Top Videos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🎥 Top Videos
            </h2>
            
            {leaderboard.videos.length > 0 ? (
              <div className="space-y-4">
                {leaderboard.videos.map((asset, index) => {
                  const videoUrl = `https://${process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT || 'your-storage-account'}.blob.core.windows.net/raw-videos/${asset.blobPathRaw}`
                  
                  return (
                    <div key={asset.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-blue-600">
                          #{index + 1}
                        </span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <video
                          src={videoUrl}
                          className="w-16 h-16 object-cover rounded-lg"
                          muted
                          playsInline
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {asset.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          by {asset.owner.name}
                        </p>
                        {asset.owner.department && (
                          <p className="text-xs text-gray-500">
                            Dept: {asset.owner.department}
                          </p>
                        )}
                        {asset.owner.supervisor && (
                          <p className="text-xs text-gray-500">
                            Supervisor: {asset.owner.supervisor}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-bold text-green-600">
                          {asset.likeCount}
                        </p>
                        <p className="text-xs text-gray-500">votes</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No videos submitted yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
