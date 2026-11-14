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

  const destination = `${directory}profile-${userId}.jpg`;
  if (!uri) {
    try {
      await FileSystem.deleteAsync(destination, { idempotent: true });
    } catch {
      // Foto lama tidak tersedia; tidak ada yang perlu dihapus.
    }
    return null;
  }

  if (!uri.startsWith("file://") || uri === destination) return uri;

  try {
    await FileSystem.deleteAsync(destination, { idempotent: true });
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch {
    return uri;
  }
}
