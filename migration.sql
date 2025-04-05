-- Create the pods table
CREATE TABLE IF NOT EXISTS pods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  points INTEGER NOT NULL DEFAULT 0
);

-- Create the classes table
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  pod_id INTEGER NOT NULL REFERENCES pods(id),
  points INTEGER NOT NULL DEFAULT 0
);

-- Add class_id column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id);

-- Migrate data: create a default pod if none exists
INSERT INTO pods (name, color, description, logo_url, points)
SELECT 'Default Pod', '#3b82f6', 'Default pod for migration', '', 0
WHERE NOT EXISTS (SELECT 1 FROM pods LIMIT 1);

-- Migrate data: create a default class in the default pod
INSERT INTO classes (name, description, pod_id, points)
SELECT 'Default Class', 'Default class for migration', (SELECT id FROM pods LIMIT 1), 0
WHERE NOT EXISTS (SELECT 1 FROM classes LIMIT 1);

-- Migrate data: set class_id for all students with house_id
-- Note: This assumes house_id exists. If not, it will just skip this step.
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'house_id'
  ) THEN
    UPDATE users 
    SET class_id = (SELECT id FROM classes LIMIT 1)
    WHERE role = 'student' AND house_id IS NOT NULL AND class_id IS NULL;
  END IF;
END $$;

-- Drop the house_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'house_id'
  ) THEN
    ALTER TABLE users DROP COLUMN house_id;
  END IF;
END $$;