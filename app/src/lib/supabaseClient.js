import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cnboxzblouzraysfmwmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYm94emJsb3V6cmF5c2Ztd21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NzQ2MjQsImV4cCI6MjEwMDE1MDYyNH0.eaV8ATZyJi-szRfd1PYGehLcPwBT8VljArVGVy7v4d8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
