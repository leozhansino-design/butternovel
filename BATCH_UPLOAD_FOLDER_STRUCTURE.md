# 批量上传文件夹结构功能说明

## 概述

批量上传功能现在支持两种文件夹结构：

1. **独立文件结构（推荐）** - 新功能
2. **content.txt 结构** - 原有功能，保持兼容

## 格式 1: 独立文件结构（新功能）

### 文件夹结构示例

```
novels/
├── novel1/
│   ├── cover_300x400.jpg      # 封面图片（优先）
│   ├── title.txt              # 小说标题
│   ├── blurb.txt              # 小说简介
│   ├── category.txt           # 小说类型（如 Romance）
│   ├── tags.txt               # 标签（逗号分隔，可选）
│   ├── age.txt                # 年龄分级（可选）
│   ├── chapter_1_Baton_Pass.txt
│   ├── chapter_2_Just_Keep_Swimming.txt
│   ├── chapter_3_Another_Chapter.txt
│   └── ...
└── novel2/
    ├── cover.png              # 或使用 cover.png / cover.jpg
    ├── title.txt
    └── ...
```

### 文件说明

#### 1. 封面图片

**识别优先级：**
1. `cover_300x400.jpg`（最高优先级）
2. `cover.png`
3. `cover.jpg`

**要求：**
- 尺寸：300x400 像素
- 格式：JPG/PNG
- 大小：不超过 5MB

#### 2. title.txt

小说标题，纯文本文件。

**示例内容：**
```
My Amazing Novel
```

**要求：**
- 2-200 个字符
- 必需文件

#### 3. blurb.txt

小说简介，纯文本文件，支持多行。

**示例内容：**
```
This is an amazing story about...
It has multiple paragraphs and tells
a wonderful tale.
```

**要求：**
- 10-1000 个字符
- 必需文件

#### 4. category.txt

小说类型/分类，必须对应系统中已存在的分类。

**示例内容：**
```
Romance
```

**常见分类：**
- Romance
- Fantasy
- Science Fiction
- Mystery
- Thriller
等

**要求：**
- 必需文件
- 必须匹配系统中已有的分类

#### 5. tags.txt（可选）

标签列表，使用逗号分隔。

**示例内容：**
```
romance, fantasy, adventure, magic
```

**要求：**
- 可选文件
- 逗号分隔
- 最多 20 个标签
- 每个标签不超过 30 字符

#### 6. age.txt（可选）

年龄分级，支持多种格式。

**示例内容：**
```
Teen 13+
```

**支持的格式：**

| 分级选项 | 匹配关键词 |
|---------|-----------|
| All Ages | all ages, all |
| Teen 13+ | teen, 13+, 13 |
| Mature 16+ | mature, 16+, 16 |
| Explicit 18+ | explicit, 18+, 18, adult |

**说明：**
- 可选文件（默认为 All Ages）
- 关键词匹配不区分大小写
- 如无法识别，默认设为 All Ages

#### 7. 章节文件

**命名格式：**
```
chapter_{序号}_{章节标题}.txt
```

**示例：**
- `chapter_1_Baton_Pass.txt` → 第1章，标题为 "Baton Pass"
- `chapter_2_Just_Keep_Swimming.txt` → 第2章，标题为 "Just Keep Swimming"
- `chapter_10_The_Final_Battle.txt` → 第10章，标题为 "The Final Battle"

**规则：**
1. 文件名中的下划线会自动转换为空格
2. 章节编号必须从 1 开始连续递增
3. 章节内容为纯文本
4. **重要：** `chapter_X_prompt.txt` 文件会被自动忽略（提示词文件）

**要求：**
- 至少 1 个章节
- 最多 200 个章节
- 每章内容至少 10 个字符
- 每章内容不超过 50,000 字符

### 完整示例

**文件夹：** `novels/MyNovel/`

**title.txt:**
```
The Adventures of Butter
```

**blurb.txt:**
```
A heartwarming tale about a young protagonist
who discovers the magic of storytelling.

Join Butter on an epic journey through
fantastical worlds and mysterious realms.
```

**category.txt:**
```
Fantasy
```

**tags.txt:**
```
adventure, magic, young-adult, coming-of-age
```

**age.txt:**
```
Teen 13+
```

**chapter_1_The_Beginning.txt:**
```
This is the beginning of our story...

[章节内容]
```

**chapter_2_The_Journey_Starts.txt:**
```
Our hero sets off on an adventure...

[章节内容]
```

## 格式 2: content.txt 结构（原有功能）

保持兼容性，详见原有文档。

### 文件夹结构

```
novels/
├── novel1/
│   ├── cover.jpg    (必须是300x400像素)
│   └── content.txt
└── ...
```

### content.txt 格式

```
Tags: romance, fantasy, adventure
Title: 小说标题
Genre: Romance
Blurb: 小说简介（10-1000字符）

Chapter 1: 第一章标题
第一章正文内容...

Chapter 2: 第二章标题
第二章正文内容...
```

## 使用方法

1. **准备文件夹**
   - 按照上述格式组织小说文件
   - 可以混合使用两种格式（每个文件夹可以是不同格式）

2. **访问批量上传页面**
   - 登录管理员账号
   - 访问 `/admin/batch-upload`

3. **选择文件夹**
   - 点击"选择文件夹"按钮
   - 选择包含多个小说文件夹的父目录

4. **验证**
   - 系统会自动识别文件夹格式
   - 显示验证结果（错误/警告）
   - 红色错误必须修复
   - 黄色警告可以忽略

5. **上传**
   - 点击"开始上传"
   - 支持暂停/继续/取消
   - 查看上传进度

## 错误处理

系统会提供详细的错误信息：

### 文件缺失错误
- `缺少 title.txt 文件`
- `缺少 blurb.txt 文件`
- `缺少 category.txt 文件`
- `缺少封面图片 (cover_300x400.jpg / cover.png / cover.jpg)`
- `至少需要1个章节文件 (chapter_1_XXX.txt)`

### 内容验证错误
- `标题长度至少2个字符`
- `简介长度至少10个字符`
- `分类 "XXX" 不存在`
- `章节编号不连续：期望第 X 章，实际为第 Y 章`

### 封面验证错误
- `封面尺寸必须是300x400，当前为XXXxYYY`
- `封面大小超过限制（最大5MB）`

## 技术实现

### 前端

**文件：** `src/app/admin/batch-upload/page.tsx`

- 自动识别文件夹格式
- 支持两种格式的验证
- 实时显示验证结果和上传进度

### 后端 API

**文件：** `src/app/api/admin/batch-upload/route.ts`

- 接收 FormData 包含封面和元数据
- 支持可选的 `contentRating` 参数
- 创建小说、章节、标签

### 工具函数

**文件：** `src/lib/batch-upload-utils.ts`

新增函数：
- `parseAgeRating()` - 解析年龄分级
- `extractChapterInfoFromFilename()` - 从文件名提取章节信息
- `isPromptFile()` - 检查是否为提示词文件
- `parseIndividualFiles()` - 解析独立文件结构
- `identifyCoverFile()` - 识别封面文件

## 常见问题

### Q: 可以混合使用两种格式吗？
A: 可以。每个小说文件夹可以是不同的格式，系统会自动识别。

### Q: 如果章节编号不连续怎么办？
A: 系统会报错并指出期望的章节编号。请确保从 1 开始连续递增。

### Q: chapter_X_prompt.txt 文件会被上传吗？
A: 不会。所有 `chapter_X_prompt.txt` 文件会被自动忽略。

### Q: 如果封面不是 300x400 怎么办？
A: 系统会在 Cloudinary 上传时自动调整尺寸为 300x400。

### Q: age.txt 可以包含其他文本吗？
A: 可以。系统会搜索关键词，只要包含匹配的关键词即可。

### Q: tags.txt 是否必需？
A: 不必需。如果没有 tags.txt，标签列表为空。

## 更新日志

### 2025-11-24
- ✅ 添加独立文件结构支持
- ✅ 支持多种封面文件名（cover_300x400.jpg 优先）
- ✅ 实现年龄分级（age.txt）解析
- ✅ 自动忽略 chapter_X_prompt.txt 文件
- ✅ 从文件名提取章节标题（下划线转空格）
- ✅ 改进错误提示，明确指出哪一步出错
- ✅ 保持与 content.txt 格式的向后兼容
