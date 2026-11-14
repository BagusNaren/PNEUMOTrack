import * as FileSystem from "expo-file-system/legacy";

/**
 * Salin foto pilihan pengguna ke dokumen aplikasi agar tetap tersedia
 * setelah cache pemilih gambar dibersihkan.
 */
export async function persistProfilePhoto(
  uri: string | null,
  userId: string | null,
): Promise<string | null> {
  const directory = FileSystem.documentDirectory;
  if (!directory || !userId) return uri;

  if (!uri) return null;
  const prefix = `${directory}profile-${userId}`;
  const destination = `${prefix}-${Date.now()}.jpg`;

  if (!uri.startsWith("file://")) return uri;
  if (uri.startsWith(prefix)) {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) throw new Error("Profile photo is unavailable");
    return uri;
  }

  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}
