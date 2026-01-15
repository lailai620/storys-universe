import { createClient } from '@supabase/supabase-js'

// TODO: 請前往 Supabase Dashboard -> Project Settings -> API 複製您的資料
const supabaseUrl = 'https://bvcbrneysdhkfwkwoptb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Y2JybmV5c2Roa2Z3a3dvcHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNzg5NDgsImV4cCI6MjA4Mzc1NDk0OH0.qDpZQbNak3gM0PSMfCicjGD3pgEvn_1GcLk6T5XMaks'

// 修復點：原本這裡缺少了 export，導致 Login.jsx 找不到變數
export const supabase = createClient(supabaseUrl, supabaseKey)