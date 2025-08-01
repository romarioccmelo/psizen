export type InteractionStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'speaking'
  | 'error'

export type FileMetadata = {
  fileName: string
  fileSize: string | number
  fileType: string
  mimeType: string
  fileExtension: string
}

export type Message = {
  id: string
  text: string
  sender: 'user' | 'agent'
  audioUrl?: string
  isLoading?: boolean
  files?: FileMetadata[]
}
