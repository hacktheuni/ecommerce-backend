import { supabase } from './supabaseClient.ts';

export async function uploadFileToSupabase({
  bucket,
  path,
  file,
  contentType,
}: {
  bucket: string;
  path: string;
  file: Buffer;
  contentType: string;
}): Promise<{ path: string; publicUrl: string }> {
  const result = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: false,
  });

  if (result.error) {
    throw result.error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

export async function deleteFilesFromSupabase({
  bucket,
  paths,
}: {
  bucket: string;
  paths: string[];
}): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.error('Failed to remove files from supabase', { paths, error });
  }
}
