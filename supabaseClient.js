import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pzsxhypigslcvduegvpa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3hoeXBpZ3NsY3ZkdWVndnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTMxOTQsImV4cCI6MjA4MTA2OTE5NH0.0LC452nPLSywGh1mKxNQedm3M_yWZ4srck-gK67iZag'

export const supabase = createClient(supabaseUrl, supabaseKey)
