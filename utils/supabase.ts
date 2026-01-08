import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL=https://zlktfukxdxugxyfgcksz.supabase.co
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa3RmdWt4ZHh1Z3h5Zmdja3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODUxOTUsImV4cCI6MjA4MzQ2MTE5NX0.j0REdnH49Y4q4ZXK3rSZrSGmTxTYrXhVykkRkMjJWtw

export const supabase = createClient(supabaseUrl, supabaseKey)
