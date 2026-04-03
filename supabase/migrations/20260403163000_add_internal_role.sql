-- Add 'internal' value to app_role enum for internal service accounts
-- that need access to admin-style tooling (e.g. check-links) without
-- being full admins.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'internal';
