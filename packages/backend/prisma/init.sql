-- Database initialization script
-- This script will be run when the PostgreSQL container starts

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE ai_platform'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_platform')\gexec

-- Connect to the database
\c ai_platform;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance (will be created by Prisma migrations)
-- These are just placeholders for future optimizations