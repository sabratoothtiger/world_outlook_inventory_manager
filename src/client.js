import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlhwgrvzfnhfhkhsgqdh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsaHdncnZ6Zm5oZmhraHNncWRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTI5NDczNCwiZXhwIjoyMDMwODcwNzM0fQ.dHfoCSUCHFPHzO0oDmWkPTeVJCYouLU9Tt2DnMFk9Mo';
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };