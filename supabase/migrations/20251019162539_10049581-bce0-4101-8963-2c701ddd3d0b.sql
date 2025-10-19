-- Create public_storage bucket for audio files and profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public_storage',
  'Public Storage',
  true,
  104857600, -- 100MB max
  ARRAY[
    'audio/mpeg',
    'audio/wav', 
    'audio/mp4',
    'audio/x-m4a',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/wav', 
    'audio/mp4',
    'audio/x-m4a',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ];