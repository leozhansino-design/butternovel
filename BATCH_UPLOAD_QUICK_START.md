# 批量上传功能快速入门指南

## 📦 完整功能介绍

批量小说上传功能允许管理员一次性上传最多100本小说，每本小说包含：
- 封面图片（300x400像素）
- 完整的内容文件（包含元数据和所有章节）

**特性**：
- ✅ 自动检测书名重复
- ✅ 实时格式验证
- ✅ 上传进度显示
- ✅ 支持暂停/继续/取消
- ✅ Tags自动创建和关联
- ✅ 详细的错误报告

## 🚀 快速开始（3步）

### 第1步：准备测试文件

创建测试文件夹结构：

```bash
# 创建测试目录
mkdir -p test-batch-upload/novel1
mkdir -p test-batch-upload/novel2
mkdir -p test-batch-upload/novel3
```

### 第2步：创建内容文件

**novel1/content.txt**:
```
Tags: romance, fantasy, magic
Title: The Enchanted Garden
Genre: Romance
Blurb: A magical love story set in an enchanted garden where time stands still. When Emma discovers a hidden portal, she meets Alexander, a gardener trapped between two worlds.

Chapter 1: The Hidden Portal
Emma had always been drawn to the old garden at the end of Maple Street. Today, she finally pushed open the rusty iron gate.

The garden was unlike anything she had imagined. Roses bloomed in impossible colors, and the air shimmered with golden light.

As she walked deeper into the garden, she noticed a stone archway covered in glowing vines. Without thinking, she reached out to touch them.

Suddenly, the world around her shifted, and she found herself in a place both familiar and completely foreign.

Chapter 2: Alexander
A tall figure emerged from behind a massive oak tree. His clothes were old-fashioned, yet somehow timeless.

"Welcome," he said with a gentle smile. "I've been waiting for someone like you."

Emma's heart raced. "Where am I? What is this place?"

"This is the garden between worlds," Alexander explained. "And I am its keeper—or perhaps its prisoner. The distinction has blurred over the centuries."

He gestured to a marble bench beneath a willow tree. "Please, sit. We have much to discuss."

Chapter 3: The Curse
Alexander told her his story. Three hundred years ago, he had been cursed by a jealous witch to tend this garden until someone with a pure heart could break the spell.

"But how do I break it?" Emma asked.

"That," Alexander said softly, "I don't know. The witch never told me."

They spent hours talking, sharing stories of their worlds. Emma felt a connection she had never experienced before.

As the sun began to set in the enchanted garden, Alexander took her hand. "Will you come back tomorrow?"

Emma nodded, already knowing that this was just the beginning of something extraordinary.
```

**novel2/content.txt**:
```
Tags: thriller, mystery, detective
Title: The Last Witness
Genre: Thriller
Blurb: Detective Sarah Chen races against time to protect the only witness to a brutal crime. As the bodies pile up, she realizes the killer is always one step ahead—and may be closer than she thinks.

Chapter 1: The Call
The phone rang at 3 AM, shattering the silence of Sarah's apartment. She knew before answering that this wouldn't be good news.

"Detective Chen," the voice on the other end was urgent. "We have a situation at the Harbor View Hotel. You need to get here now."

Twenty minutes later, Sarah stood in front of room 412, watching the forensics team work. The victim was a federal prosecutor, and the killer had left no trace.

Except for one thing—a terrified hotel maid had seen him leave.

Chapter 2: The Witness
Maria Rodriguez sat in the interview room, her hands shaking as she held a cup of cold coffee.

"Tell me exactly what you saw," Sarah said gently.

"I was cleaning the hallway," Maria whispered. "I saw a man in a dark coat leaving room 412. He looked directly at me."

Sarah's blood ran cold. "Can you describe him?"

"That's the thing, Detective. I saw his face clearly, but..." Maria paused, her voice dropping to barely audible. "But I can't remember it now. It's like my memory was erased."

Chapter 3: The Pattern
Back at the precinct, Sarah pulled up old case files. Three similar murders in the past six months, all involving key witnesses in high-profile cases.

And each witness had died within 48 hours of giving their testimony.

Sarah's partner, Detective Mike Torres, pointed at the timeline. "We have less than two days to figure this out."

"Then we better get started," Sarah said, grabbing her jacket. "Because whoever this killer is, they're about to learn that I don't give up easily."
```

**novel3/content.txt**:
```
Tags: sci-fi, adventure, space-opera
Title: Beyond the Nebula
Genre: Sci-Fi
Blurb: Captain Lisa Morgan leads humanity's first mission beyond the Andromeda Nebula. What they discover will change everything we know about the universe—and our place in it.

Chapter 1: Launch Day
The ISS Pathfinder hummed with activity as the crew prepared for departure. Captain Lisa Morgan stood on the bridge, watching Earth shrink in the viewscreen.

"All systems green, Captain," her first officer reported. "We're cleared for jump."

Lisa took a deep breath. They were about to go farther than any human had ever traveled.

"Engage jump drive," she commanded.

The ship shuddered, reality bent around them, and in an instant, Earth was 2.5 million light-years behind them.

Chapter 2: First Contact
Three days into their exploration, the sensors picked up something impossible—a structured signal coming from within the nebula.

"It's definitely artificial," the science officer confirmed. "And it's responding to our presence."

As they moved closer, a massive structure emerged from the cosmic dust. It was a space station, ancient but still functional.

And it was not empty.

Chapter 3: The Message
The station's AI greeted them in perfect English, though its last contact with humanity should have been millions of years ago.

"We have been waiting," it said. "Waiting for you to be ready."

Lisa and her crew discovered records of a galactic civilization that had seeded Earth billions of years ago. Humanity wasn't just discovering the universe—they were coming home.

"What do we do now?" her first officer asked.

Lisa looked at the vast archives of knowledge before them. "We learn. And then we decide what kind of civilization we want to become."
```

### 第3步：创建封面图片

你需要为每本小说创建300x400像素的封面图片：

**选项A：使用在线工具**
1. 访问 https://www.canva.com 或 https://www.photopea.com
2. 创建新图片，尺寸设为 300x400 像素
3. 设计封面（可以使用简单的颜色+文字）
4. 导出为JPG格式，命名为 `cover.jpg`
5. 放入对应的小说文件夹

**选项B：使用命令行（ImageMagick）**
```bash
# 安装ImageMagick后运行
convert -size 300x400 xc:#FF6B6B -pointsize 30 -gravity center \
  -annotate +0+0 "The\nEnchanted\nGarden" \
  test-batch-upload/novel1/cover.jpg

convert -size 300x400 xc:#4ECDC4 -pointsize 30 -gravity center \
  -annotate +0+0 "The\nLast\nWitness" \
  test-batch-upload/novel2/cover.jpg

convert -size 300x400 xc:#95E1D3 -pointsize 30 -gravity center \
  -annotate +0+0 "Beyond\nthe\nNebula" \
  test-batch-upload/novel3/cover.jpg
```

**选项C：占位图（仅测试用）**
```bash
# 从网上下载300x400的测试图片
curl -o test-batch-upload/novel1/cover.jpg "https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Novel+1"
curl -o test-batch-upload/novel2/cover.jpg "https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Novel+2"
curl -o test-batch-upload/novel3/cover.jpg "https://via.placeholder.com/300x400/95E1D3/FFFFFF?text=Novel+3"
```

## 📋 使用步骤

### 1. 访问批量上传页面
```
http://localhost:3000/admin/batch-upload
```
（或在Admin侧边栏点击 "Batch Upload"）

### 2. 选择文件夹
- 点击"选择文件夹"按钮
- 选择 `test-batch-upload` 文件夹
- 系统会自动扫描并验证所有子文件夹

### 3. 查看验证结果
- ✅ 绿色勾：文件格式正确，可以上传
- ❌ 红色叉：有错误，需要修复
- ⚠️ 黄色感叹号：有警告，但可以继续

### 4. 开始上传
- 点击"开始上传"按钮
- 系统会依次上传每本小说
- 可以随时点击"暂停"或"取消"

### 5. 查看结果
- 上传成功：显示绿色勾和"查看小说"链接
- 上传失败：显示红色错误信息
- 可以点击链接查看已上传的小说

## 🎯 常见问题排查

### 封面尺寸错误
**错误**: `封面尺寸必须是300x400，当前为400x600`

**解决**:
```bash
# 使用ImageMagick调整尺寸
convert original-cover.jpg -resize 300x400^ -gravity center -extent 300x400 cover.jpg
```

### content.txt格式错误
**错误**: `第1行必须是 "Tags: tag1, tag2, tag3"`

**解决**: 确保content.txt前4行严格按照以下格式：
```
Tags: tag1, tag2
Title: 书名
Genre: Romance
Blurb: 简介

Chapter 1: 章节标题
```

**注意**：
- 每行冒号后面必须有空格
- Genre必须是数据库中存在的分类（Romance, Fantasy, Mystery, Thriller, Sci-Fi, Horror, Adventure, Historical等）
- 第4行后必须有一个空行，然后才是Chapter 1

### 书名重复
**错误**: `小说《The Enchanted Garden》已存在（ID: 123）`

**解决**: 修改title或删除数据库中的重复小说

### 章节编号不连续
**错误**: `章节编号不连续：期望Chapter 2，实际为Chapter 3`

**解决**: 确保章节从1开始，连续递增，中间不能跳号

## 📊 测试清单

完成以下测试以确保功能正常：

- [ ] 上传单本小说
- [ ] 上传3本小说
- [ ] 测试暂停功能（上传到第2本时点击暂停）
- [ ] 测试继续功能（暂停后点击继续）
- [ ] 测试取消功能
- [ ] 故意上传错误尺寸的封面（验证应该拦截）
- [ ] 故意使用错误的content.txt格式（验证应该拦截）
- [ ] 上传重复书名的小说（应该显示409错误）
- [ ] 检查数据库：小说、章节、tags是否正确创建
- [ ] 访问已上传的小说页面，确认显示正常

## 🔧 故障排除

### 上传卡住不动
1. 检查浏览器控制台是否有错误
2. 检查Cloudinary环境变量配置
3. 检查数据库连接

### Cloudinary上传失败
```bash
# 检查环境变量
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

### 数据库错误
```bash
# 检查Prisma迁移状态
npx prisma migrate status

# 如果有待执行的迁移
npx prisma migrate deploy
```

## 📝 content.txt 完整规范

```
Tags: tag1, tag2, tag3               # 必需，逗号分隔，最多20个
Title: 小说标题                       # 必需，2-200字符
Genre: Romance                       # 必需，必须是有效分类
Blurb: 小说简介文字...                # 必需，10-1000字符
                                     # 空行（必需）
Chapter 1: 第一章标题                # 必需，格式: Chapter [数字]: 标题
第一章正文内容...                     # 必需，至少10字符
                                     # 空行（可选）
Chapter 2: 第二章标题
第二章正文内容...
```

**字段说明**：
- **Tags**: 小写字母、数字、连字符，空格会被转为连字符
- **Title**: 用于显示和URL生成
- **Genre**: Romance, Fantasy, Mystery, Thriller, Sci-Fi, Horror, Adventure, Historical, Action, Contemporary
- **Blurb**: 小说简介，支持多行
- **Chapter**: 必须从1开始连续编号

## 🎉 成功后的检查

上传完成后，请检查：

1. **数据库**:
   ```sql
   SELECT id, title, slug, status, "totalChapters" FROM "Novel" WHERE title LIKE '%Enchanted%';
   SELECT COUNT(*) FROM "Chapter" WHERE "novelId" = [novel_id];
   SELECT * FROM "Tag" WHERE name IN ('romance', 'fantasy', 'magic');
   ```

2. **前端页面**:
   - 访问 `/novels/the-enchanted-garden`
   - 检查封面是否显示
   - 检查tags是否正确
   - 点击第一章，检查内容是否正确

3. **Tags功能**:
   - 访问 `/tags/romance`
   - 确认新上传的小说出现在列表中

---

**现在可以开始测试批量上传功能了！** 🚀

有问题请参考 `BATCH_UPLOAD_IMPLEMENTATION.md` 获取技术细节。
