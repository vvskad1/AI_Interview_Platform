-- AI Interview Platform Database Setup
-- Run this script in pgAdmin or psql

-- Create the database
CREATE DATABASE ai_interview;

-- Create a user for the application
CREATE USER interview_user WITH PASSWORD 'interview_pass_2024';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE ai_interview TO interview_user;

-- Connect to the ai_interview database and grant schema permissions
\c ai_interview;

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO interview_user;

-- Grant create privileges on the public schema
GRANT CREATE ON SCHEMA public TO interview_user;

-- Grant all privileges on all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO interview_user;

-- Grant all privileges on all sequences in public schema
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO interview_user;

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO interview_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO interview_user;

-- Confirm setup
SELECT 'Database setup complete!' as status;