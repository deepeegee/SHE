'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string
  department?: string
  supervisor?: string
  isAdmin?: boolean
}

export default function Challenge() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    supervisor: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/profile/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Profile update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          SHE Week Challenge
        </h1>

        {/* Profile Form */}
        {!user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Complete Your Profile
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700">
                  Supervisor
                </label>
                <input
                  id="supervisor"
                  type="text"
                  value={formData.supervisor}
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !formData.name}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Action Cards */}
        {user && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photos Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📸 Photos
              </h2>
              <p className="text-gray-600 mb-6">
                Upload and vote for your favorite photos
              </p>
              <div className="space-y-3">
                <Link
                  href="/upload?type=image"
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-blue-700 transition-colors"
                >
                  Upload Photos
                </Link>
                <Link
                  href="/vote/photos"
                  className="block w-full bg-green-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-green-700 transition-colors"
                >
                  Vote for Photos
                </Link>
              </div>
            </div>

            {/* Videos Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🎥 Videos
              </h2>
              <p className="text-gray-600 mb-6">
                Upload and vote for your favorite videos
              </p>
              <div className="space-y-3">
                <Link
                  href="/upload?type=video"
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-blue-700 transition-colors"
                >
                  Upload Videos
                </Link>
                <Link
                  href="/vote/videos"
                  className="block w-full bg-green-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-green-700 transition-colors"
                >
                  Vote for Videos
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Admin Link */}
        {user?.isAdmin && (
          <div className="mt-8 text-center">
            <Link
              href="/admin"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition-colors"
            >
              Admin Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
