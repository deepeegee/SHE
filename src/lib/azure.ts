import { BlobSASPermissions, BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'

export async function getUploadSAS(
  container: string,
  blobName: string,
  contentType: string
) {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT!
  const accountKey = process.env.AZURE_STORAGE_KEY!
  
  const credential = new StorageSharedKeyCredential(accountName, accountKey)
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  )
  
  const containerClient = blobServiceClient.getContainerClient(container)
  const blobClient = containerClient.getBlobClient(blobName)
  
  const expiresOn = new Date()
  expiresOn.setHours(expiresOn.getHours() + 1) // 1 hour expiry
  
  const sasUrl = await blobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse('w'),
    expiresOn,
    contentType,
  })
  
  return {
    sasUrl,
    container,
    blobName,
  }
}
