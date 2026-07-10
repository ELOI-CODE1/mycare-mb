import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import { Alert } from 'react-native'
import { supabase } from './supabase'

type PickedImage = { base64: string; ext: string; contentType: string }

// Opens the photo library and returns the chosen image as base64, or null if
// the user cancels / denies permission.
export async function pickImage(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Please allow photo access to choose an image.')
    return null
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  })

  if (result.canceled) return null
  const asset = result.assets?.[0]
  if (!asset?.base64) {
    Alert.alert('Error', 'Could not read the selected image.')
    return null
  }

  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase()
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  return { base64: asset.base64, ext, contentType }
}

// Uploads a picked image to a Storage bucket and returns its public URL.
export async function uploadImage(bucket: string, path: string, image: PickedImage): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(image.base64), { contentType: image.contentType, upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Convenience: pick + upload in one step. Returns the public URL, or null if cancelled.
export async function pickAndUploadImage(bucket: string, pathPrefix: string): Promise<string | null> {
  const picked = await pickImage()
  if (!picked) return null
  const path = `${pathPrefix}-${Date.now()}.${picked.ext}`
  return uploadImage(bucket, path, picked)
}
