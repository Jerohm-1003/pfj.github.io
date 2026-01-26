import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://blxrymicjowtplrkusck.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseHJ5bWljam93dHBscmt1c2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTkwODQsImV4cCI6MjA4MzEzNTA4NH0.Q1y53hRP0PS91IbRdX4jUIqJBqtJAmqVbOg6PgPhAi4";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)