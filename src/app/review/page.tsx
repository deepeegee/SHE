'use client'

import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
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

interface BallotItem {
  id: string
  asset: Asset
}

interface Ballot {
  id: string
  items: BallotItem[]
}

export default function Review() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category') as 'image' | 'video'
  
  const [ballot, setBallot] = useState<Ballot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/signin')
      return
    }

    if (!category || !['image', 'video'].includes(category)) {
      router.push('/challenge')
      return
    }

    loadBallot()
  }, [session, router, category])

  const loadBallot = async () => {
    try {
      const response = await fetch(`/api/ballot?category=${category.toUpperCase()}`)
      if (response.ok) {
        const data = await response.json()
        setBallot(data.ballot)
      }
    } catch (error) {
      console.error('Error loading ballot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!ballot || ballot.items.length === 0) {
      alert('No items to submit')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/ballot/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category.toUpperCase() }),
      })

      if (response.ok) {
        setSubmitted(true)
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!ballot || ballot.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No {category}s selected
            </h1>
            <Link
              href={`/vote/${category}s`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Go back to voting
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <h1 className="text-2xl font-bold mb-2">Votes Submitted Successfully!</h1>
              <p>Thank you for participating in SHE Week voting.</p>
            </div>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Review Your {category === 'image' ? 'Photo' : 'Video'} Selections
          </h1>
          <Link
            href={`/vote/${category}s`}
            className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
          >
            Back to Voting
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Selected {category === 'image' ? 'Photos' : 'Videos'} ({ballot.items.length}/5)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ballot.items.map((item) => {
              const asset = item.asset
              const mediaUrl = `https://${process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT || 'your-storage-account'}.blob.core.windows.net/raw-${category}s/${asset.blobPathRaw}`
              
              return (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="aspect-square relative mb-4">
                    {category === 'image' ? (
                      <img
                        src={mediaUrl}
                        alt={asset.title || 'Media'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover rounded-lg"
                        muted
                        playsInline
                      />
                    )}
                  </div>
                  
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
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Votes'}
          </button>
          
          <Link
            href={`/vote/${category}s`}
            className="bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors"
          >
            Modify Selection
          </Link>
        </div>
      </div>
    </div>
  )
}
