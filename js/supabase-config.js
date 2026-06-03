// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://poffztrbehwgxpbfdjro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZmZ6dHJiZWh3Z3hwYmZkanJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTE5OTAsImV4cCI6MjA5NjA2Nzk5MH0.n58ivGf3KzO7H2iT4gLD6I6bcTKE9DWqCYgOQyDKpGw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Supabase conectado correctamente');
