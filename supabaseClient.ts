
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ocxddcpgdxuxlwgxxyvw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeGRkY3BnZHh1eGx3Z3h4eXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzQ4NjgsImV4cCI6MjA4MzcxMDg2OH0._7wRr9CcbSYOqGLZ2ZVqNT7Z5K_TMlPC_0U0XunVDWg';

export const supabase = createClient(supabaseUrl, supabaseKey);
