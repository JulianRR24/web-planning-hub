import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://dbozvpvjixvzlzlwyqrg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib3p2cHZqaXh2emx6bHd5cXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTY2ODMsImV4cCI6MjA3ODE5MjY4M30.SOo6pTOL9P5y2dHsP_kTlqbl30IEIpQkVg0IILst-bQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)