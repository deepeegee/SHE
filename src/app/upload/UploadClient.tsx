'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function UploadClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type') as 'image' | 'video'
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!type || !['image', 'video'].includes(type)) {
      router.push('/challenge')
    }
  }, [type, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      // Create preview
      const url = URL.createObjectURL(selectedFile)
      setPreview(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)

    try {
      // Get SAS URL
      const sasResponse = await fetch('/api/upload/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: type,
          mime: file.type,
        }),
      })

      if (!sasResponse.ok) throw new Error('Failed to get upload URL')

      const { sasUrl, blobName } = await sasResponse.json()

      // Upload file to Azure
      const uploadResponse = await fetch(sasUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) throw new Error('Upload failed')

      // Ingest asset
      const ingestResponse = await fetch('/api/assets/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: type,
          title: formData.title || undefined,
          description: formData.description || undefined,
          blobPathRaw: blobName,
        }),
      })

      if (!ingestResponse.ok) throw new Error('Failed to save asset')

      // Success - redirect to challenge
      router.push('/challenge')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!type || !['image', 'video'].includes(type)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Upload {type === 'image' ? 'Photo' : 'Video'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Choose File
              </label>
              <input
                id="file"
                type="file"
                accept={type === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {preview && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                {type === 'image' ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="max-w-full h-64 rounded-lg"
                  />
                )}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a title for your upload"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a description for your upload"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={!file || isUploading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/challenge')}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
