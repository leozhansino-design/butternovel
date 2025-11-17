# Tags数据迁移指南

## ⚠️ 问题说明

你的数据库中已有一个旧的 `tags` 列（31条记录有数据），现在要改用新的Tag表和多对多关系。需要先迁移数据才能安全删除旧列。

## 🔍 步骤1: 检查现有数据格式

在Supabase Dashboard中运行以下SQL查询：

```sql
SELECT id, slug, title, tags
FROM "Novel"
WHERE tags IS NOT NULL
LIMIT 10;
```

查看 `tags` 列的数据格式，可能是以下几种：
- JSON数组: `["romance", "fantasy", "adventure"]`
- 逗号分隔: `"romance,fantasy,adventure"`
- PostgreSQL数组: `{romance,fantasy,adventure}`
- 其他格式

## 📋 步骤2: 根据格式选择迁移方案

### 方案A: tags是JSON格式

如果你看到的数据像这样: `["romance", "fantasy"]`

在Supabase SQL Editor中运行：

```sql
-- 创建Tag表（如果还不存在）
CREATE TABLE IF NOT EXISTS "Tag" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    count INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建关系表（如果还不存在）
CREATE TABLE IF NOT EXISTS "_NovelTags" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    PRIMARY KEY ("A", "B")
);

-- 迁移数据
DO $$
DECLARE
    novel_record RECORD;
    tag_name TEXT;
    tag_id TEXT;
BEGIN
    -- 遍历所有有tags的小说
    FOR novel_record IN
        SELECT id, tags
        FROM "Novel"
        WHERE tags IS NOT NULL
          AND tags::text != '[]'
          AND tags::text != 'null'
    LOOP
        -- 解析JSON数组中的每个tag
        FOR tag_name IN
            SELECT jsonb_array_elements_text(
                CASE
                    WHEN jsonb_typeof(novel_record.tags::jsonb) = 'array'
                    THEN novel_record.tags::jsonb
                    ELSE '[]'::jsonb
                END
            )
        LOOP
            -- 规范化tag名称
            tag_name := LOWER(TRIM(tag_name));

            IF tag_name != '' THEN
                -- 创建或更新Tag
                INSERT INTO "Tag" (id, name, slug, count, "createdAt")
                VALUES (
                    'tag_' || encode(digest(tag_name, 'sha256'), 'hex'),
                    tag_name,
                    tag_name,
                    1,
                    NOW()
                )
                ON CONFLICT (name) DO UPDATE
                SET count = "Tag".count + 1
                RETURNING id INTO tag_id;

                -- 获取tag_id（如果是已存在的tag）
                IF tag_id IS NULL THEN
                    SELECT id INTO tag_id FROM "Tag" WHERE name = tag_name;
                END IF;

                -- 创建关系
                INSERT INTO "_NovelTags" ("A", "B")
                VALUES (novel_record.id, tag_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Migration completed!';
END $$;
```

### 方案B: tags是逗号分隔文本

如果你看到的数据像这样: `"romance,fantasy,adventure"`

```sql
-- 创建表（同上）
CREATE TABLE IF NOT EXISTS "Tag" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    count INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "_NovelTags" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    PRIMARY KEY ("A", "B")
);

-- 迁移数据
DO $$
DECLARE
    novel_record RECORD;
    tag_name TEXT;
    tag_id TEXT;
    tags_array TEXT[];
BEGIN
    FOR novel_record IN
        SELECT id, tags
        FROM "Novel"
        WHERE tags IS NOT NULL AND tags::text != ''
    LOOP
        -- 分割逗号
        tags_array := string_to_array(novel_record.tags::text, ',');

        FOREACH tag_name IN ARRAY tags_array
        LOOP
            tag_name := LOWER(TRIM(tag_name));

            IF tag_name != '' THEN
                INSERT INTO "Tag" (id, name, slug, count, "createdAt")
                VALUES (
                    'tag_' || encode(digest(tag_name, 'sha256'), 'hex'),
                    tag_name,
                    tag_name,
                    1,
                    NOW()
                )
                ON CONFLICT (name) DO UPDATE
                SET count = "Tag".count + 1
                RETURNING id INTO tag_id;

                IF tag_id IS NULL THEN
                    SELECT id INTO tag_id FROM "Tag" WHERE name = tag_name;
                END IF;

                INSERT INTO "_NovelTags" ("A", "B")
                VALUES (novel_record.id, tag_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Migration completed!';
END $$;
```

### 方案C: tags是PostgreSQL数组

如果你看到的数据像这样: `{romance,fantasy}`

```sql
-- 创建表（同上）
-- ...

-- 迁移数据
DO $$
DECLARE
    novel_record RECORD;
    tag_name TEXT;
    tag_id TEXT;
BEGIN
    FOR novel_record IN
        SELECT id, tags
        FROM "Novel"
        WHERE tags IS NOT NULL AND array_length(tags::text[], 1) > 0
    LOOP
        FOREACH tag_name IN ARRAY novel_record.tags::text[]
        LOOP
            tag_name := LOWER(TRIM(tag_name));

            IF tag_name != '' THEN
                INSERT INTO "Tag" (id, name, slug, count, "createdAt")
                VALUES (
                    'tag_' || encode(digest(tag_name, 'sha256'), 'hex'),
                    tag_name,
                    tag_name,
                    1,
                    NOW()
                )
                ON CONFLICT (name) DO UPDATE
                SET count = "Tag".count + 1
                RETURNING id INTO tag_id;

                IF tag_id IS NULL THEN
                    SELECT id INTO tag_id FROM "Tag" WHERE name = tag_name;
                END IF;

                INSERT INTO "_NovelTags" ("A", "B")
                VALUES (novel_record.id, tag_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Migration completed!';
END $$;
```

## ✅ 步骤3: 验证迁移结果

运行以下查询检查迁移是否成功：

```sql
-- 检查Tag表
SELECT * FROM "Tag" ORDER BY count DESC;

-- 检查关系表
SELECT COUNT(*) as total_relationships FROM "_NovelTags";

-- 对比迁移前后（看看31条记录是否都迁移了）
SELECT
    n.id,
    n.slug,
    n.title,
    n.tags as old_tags,
    COUNT(t.id) as new_tag_count,
    STRING_AGG(t.name, ', ' ORDER BY t.name) as new_tags
FROM "Novel" n
LEFT JOIN "_NovelTags" nt ON nt."A" = n.id
LEFT JOIN "Tag" t ON t.id = nt."B"
WHERE n.tags IS NOT NULL
GROUP BY n.id, n.slug, n.title, n.tags
ORDER BY n.id;
```

**检查要点**:
- ✅ 是否有31条或更多的小说有新tags
- ✅ Tag表中的count是否正确
- ✅ 新旧tags内容是否一致

## 🚀 步骤4: 安全删除旧列

确认数据迁移无误后，在本地运行：

```bash
npx prisma db push
# 现在可以安全地输入 Y 了
```

## 🔄 如果需要回滚

如果迁移出错，可以清理重来：

```sql
-- 删除新创建的数据
DELETE FROM "_NovelTags";
DELETE FROM "Tag";

-- 旧的tags列数据仍然保留，可以重新迁移
```

## 📝 建议

在执行迁移前，建议：
1. 在Supabase Dashboard中备份数据库
2. 或者先导出这31条记录的tags数据：
   ```sql
   COPY (
       SELECT id, slug, title, tags
       FROM "Novel"
       WHERE tags IS NOT NULL
   ) TO '/tmp/tags_backup.csv' WITH CSV HEADER;
   ```

---

**如果不确定数据格式，请先运行步骤1的查询，然后把结果发给我，我会帮你写准确的迁移脚本！**
