import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats file size from bytes to a human-readable string.
 * @param bytes - The file size in bytes or as a string.
 * @param decimals - The number of decimal places to display.
 * @returns A formatted file size string (e.g., "1.23 MB").
 */
export function formatFileSize(bytes: number | string, decimals = 2) {
  // Se já for uma string formatada, retorna como está
  if (typeof bytes === 'string') {
    return bytes
  }
  
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Converts a Blob to a Base64 encoded string.
 * @param blob - The blob to convert.
 * @returns A promise that resolves with the Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64String = result.split(',')[1]
      if (base64String) {
        resolve(base64String)
      } else {
        reject(new Error('Failed to extract base64 string from data URL.'))
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Copies a string to the user's clipboard.
 * @param text - The text to copy.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!navigator.clipboard) {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err)
      return false
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Async: Could not copy text: ', err)
    return false
  }
}

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
