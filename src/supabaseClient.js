// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// 請去 Supabase 後台 -> Settings -> API 複製這兩個值
const supabaseUrl = 'https://bvcbrneysdhkfwkwoptb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Y2JybmV5c2Roa2Z3a3dvcHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNzg5NDgsImV4cCI6MjA4Mzc1NDk0OH0.qDpZQbNak3gM0PSMfCicjGD3pgEvn_1GcLk6T5XMaks';

export const supabase = createClient(supabaseUrl, supabaseKey);