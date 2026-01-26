---
description: 設定 Supabase Row Level Security 策略以保護資料
---

# Row Level Security (RLS) 設定流程

此工作流程指導如何為資料表設定正確的 RLS 策略。

## 核心原則
> **預設拒絕 (Deny by Default)**：啟用 RLS 後，沒有明確策略的操作會被拒絕。

## 執行步驟

### 1. 登入 Supabase Dashboard
前往 Table Editor > 選擇目標資料表 > 開啟 RLS

### 2. Stories 表格策略

#### 允許公開讀取公開故事
```sql
CREATE POLICY "Public stories are viewable by everyone"
ON stories FOR SELECT
USING (visibility = 'public');
```

#### 允許作者讀取自己的所有故事
```sql
CREATE POLICY "Users can view own stories"
ON stories FOR SELECT
USING (auth.uid() = author_id);
```

#### 允許用戶創建故事
```sql
CREATE POLICY "Users can create stories"
ON stories FOR INSERT
WITH CHECK (auth.uid() = author_id);
```

#### 允許作者更新自己的故事
```sql
CREATE POLICY "Users can update own stories"
ON stories FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);
```

#### 允許作者刪除自己的故事
```sql
CREATE POLICY "Users can delete own stories"
ON stories FOR DELETE
USING (auth.uid() = author_id);
```

### 3. Users/Profiles 表格策略

#### 用戶只能讀取自己的資料
```sql
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

#### 用戶只能更新自己的資料
```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 4. Transactions 表格策略 (如有)

#### 用戶只能查看自己的交易紀錄
```sql
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);
```

#### 只有後端 (service_role) 可以寫入
```sql
-- 不建立 INSERT 策略給 anon/authenticated
-- 僅透過 Edge Functions 使用 service_role 寫入
```

### 5. 測試策略
在 Supabase Dashboard > SQL Editor 中測試：

```sql
-- 模擬一般用戶
SET request.jwt.claims.sub = 'test-user-id';
SELECT * FROM stories; -- 應只看到公開故事或自己的
```

---

## 驗證清單
- [ ] 所有資料表已啟用 RLS
- [ ] 測試：匿名用戶無法存取私人故事
- [ ] 測試：用戶無法修改他人故事
- [ ] 測試：用戶無法偽造 author_id 創建故事
