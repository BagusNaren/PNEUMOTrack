export function audioFormat(uri: string, mime = "") {
  const ext = uri.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  const formats = {
    m4a: "audio/mp4",
    wav: "audio/wav",
    aac: "audio/aac",
    webm: "audio/webm",
    ogg: "audio/ogg",
  } as const;
  if (ext && ext in formats)
    return { extension: ext, mimeType: formats[ext as keyof typeof formats] };
  const matched = Object.entries(formats).find(
    ([, value]) => mime.split(";")[0] === value,
  );
  return matched ? { extension: matched[0], mimeType: matched[1] } : null;
}

export function validChildId(id?: string): id is string {
  return (
    !!id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}
