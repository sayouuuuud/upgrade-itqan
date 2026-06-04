-- Fix recording URLs that were stored with URL-encoded slashes (%2F).
--
-- Root cause: S3's CompleteMultipartUpload returns a `Location` whose key path
-- is percent-encoded (e.g. recordings%2F<session>%2F<id>.webm). That value was
-- persisted into recording_url, so later key extraction pointed at a
-- non-existent object and playback failed with S3 "NoSuchKey".
--
-- The application now (a) rebuilds a clean URL on complete and (b) decodes keys
-- at read time, so this script is an optional one-time cleanup of historical
-- rows. Safe to run multiple times (idempotent).

-- video_recordings table
UPDATE video_recordings
SET recording_url = REPLACE(recording_url, '%2F', '/')
WHERE recording_url LIKE '%\%2F%' ESCAPE '\';

UPDATE video_recordings
SET recording_url = REPLACE(recording_url, '%2f', '/')
WHERE recording_url LIKE '%\%2f%' ESCAPE '\';

-- video_sessions mirror column
UPDATE video_sessions
SET recording_url = REPLACE(recording_url, '%2F', '/')
WHERE recording_url LIKE '%\%2F%' ESCAPE '\';

UPDATE video_sessions
SET recording_url = REPLACE(recording_url, '%2f', '/')
WHERE recording_url LIKE '%\%2f%' ESCAPE '\';

-- Verify what remains (should return 0 rows after the updates above)
-- SELECT id, recording_url FROM video_recordings WHERE recording_url ILIKE '%\%2f%' ESCAPE '\';
-- SELECT id, recording_url FROM video_sessions   WHERE recording_url ILIKE '%\%2f%' ESCAPE '\';
