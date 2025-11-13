# Chapter Form 统一组件迁移指南

## 📦 新组件

**文件:** `src/components/admin/ChapterForm.tsx`

**功能:** 统一的章节创建/编辑表单组件

**代码减少:** ~200 行 (472 行 → 265 行)

---

## ✅ 功能特性

### 统一的功能
- ✅ 创建和编辑章节 (单一组件)
- ✅ 字数实时统计和进度条
- ✅ 字数限制验证 (5000 字)
- ✅ 标题长度限制 (100 字)
- ✅ 发布状态切换
- ✅ 暗色模式支持
- ✅ 加载状态处理
- ✅ 成功/错误消息提示
- ✅ 自动跳转或自定义回调

---

## 🔧 使用方法

### 示例 1: 创建章节

```typescript
import ChapterForm from '@/components/admin/ChapterForm'

export default function CreateChapterPage() {
  return (
    <ChapterForm
      mode="create"
      novelId={123}
      novelTitle="我的小说"
      chapterNumber={5}
      onSuccess={() => {
        // 可选: 自定义成功后的操作
        router.push('/admin/novels/123/edit')
      }}
    />
  )
}
```

### 示例 2: 编辑章节

```typescript
import ChapterForm from '@/components/admin/ChapterForm'

export default function EditChapterPage({ chapter }) {
  return (
    <ChapterForm
      mode="edit"
      novelId={chapter.novelId}
      novelTitle={chapter.novel.title}
      chapterNumber={chapter.chapterNumber}
      initialData={{
        id: chapter.id,
        title: chapter.title,
        content: chapter.content,
        isPublished: chapter.isPublished
      }}
      onCancel={() => {
        // 可选: 取消按钮的操作
        router.back()
      }}
    />
  )
}
```

---

## 📋 Props 说明

| Prop | 类型 | 必需 | 说明 |
|------|------|------|------|
| `mode` | `'create' \| 'edit'` | ✅ | 表单模式 |
| `novelId` | `number` | ✅ | 小说 ID |
| `novelTitle` | `string` | ✅ | 小说标题 (显示用) |
| `chapterNumber` | `number` | ✅ | 章节号 |
| `initialData` | `object` | ❌ | 编辑模式时的初始数据 |
| `onSuccess` | `() => void` | ❌ | 成功后的回调 |
| `onCancel` | `() => void` | ❌ | 取消按钮的回调 |

### initialData 结构 (编辑模式必需)

```typescript
{
  id: number           // 章节 ID
  title: string        // 章节标题
  content: string      // 章节内容
  isPublished: boolean // 是否已发布
}
```

---

## 🔄 迁移步骤

### 需要替换的文件

1. ⏳ 使用 `ChapterAddForm` 的页面
   - 替换为 `ChapterForm` (mode="create")

2. ⏳ 使用 `ChapterEditForm` 的页面
   - 替换为 `ChapterForm` (mode="edit")

### 迁移示例

**之前 (ChapterAddForm):**
```typescript
import ChapterAddForm from '@/components/admin/ChapterAddForm'

<ChapterAddForm
  novelId={novelId}
  novelTitle={novelTitle}
  nextChapterNumber={nextChapterNumber}
/>
```

**之后 (ChapterForm):**
```typescript
import ChapterForm from '@/components/admin/ChapterForm'

<ChapterForm
  mode="create"
  novelId={novelId}
  novelTitle={novelTitle}
  chapterNumber={nextChapterNumber}
/>
```

---

**之前 (ChapterEditForm):**
```typescript
import ChapterEditForm from '@/components/admin/ChapterEditForm'

<ChapterEditForm
  chapter={chapter}
  novelId={novelId}
  novelTitle={novelTitle}
/>
```

**之后 (ChapterForm):**
```typescript
import ChapterForm from '@/components/admin/ChapterForm'

<ChapterForm
  mode="edit"
  novelId={chapter.novelId}
  novelTitle={chapter.novel.title}
  chapterNumber={chapter.chapterNumber}
  initialData={{
    id: chapter.id,
    title: chapter.title,
    content: chapter.content,
    isPublished: chapter.isPublished
  }}
/>
```

---

## 🎨 UI 改进

### 新增特性

1. **暗色模式支持**
   - 所有元素都支持暗色主题
   - 自动适配系统主题

2. **更好的字数进度条**
   - 实时显示字数百分比
   - 超出限制时变红色警告
   - 平滑的动画过渡

3. **改进的消息提示**
   - 绿色 = 成功
   - 红色 = 错误
   - 自动消失 + 跳转

4. **更好的按钮布局**
   - 主要操作: 蓝色按钮
   - 次要操作: 边框按钮
   - 禁用状态: 半透明

---

## ⚠️ 注意事项

### API 兼容性

组件调用的 API 端点:
- **创建:** `POST /api/admin/chapters`
- **编辑:** `PUT /api/admin/chapters/[id]`

确保这些 API 接受以下字段:
```typescript
{
  novelId: number
  chapterNumber: number
  title: string
  content: string
  isPublished: boolean
}
```

### 默认行为

如果不提供 `onSuccess` 回调:
- 成功后自动跳转到 `/admin/novels/${novelId}/edit`
- 并调用 `router.refresh()` 刷新数据

如果不提供 `onCancel` 回调:
- 取消按钮不会显示

---

## 📊 对比表

| 特性 | 旧组件 | 新组件 |
|------|--------|--------|
| 总行数 | 472 行 (2个文件) | 265 行 (1个文件) |
| 创建章节 | ChapterAddForm | ChapterForm (mode="create") |
| 编辑章节 | ChapterEditForm | ChapterForm (mode="edit") |
| 字数统计 | ✅ | ✅ |
| 进度条 | ✅ | ✅ 改进 |
| 暗色模式 | ❌ | ✅ |
| 消息提示 | ✅ | ✅ 改进 |
| 自定义回调 | ❌ | ✅ |
| 代码重复 | 高 (70%) | 无 |

---

## ✅ 迁移检查清单

完成迁移后检查:

- [ ] 创建章节功能正常
- [ ] 编辑章节功能正常
- [ ] 字数统计正确
- [ ] 超出限制时显示警告
- [ ] 发布状态切换正常
- [ ] 成功/错误消息显示
- [ ] 自动跳转工作
- [ ] 暗色模式正常
- [ ] 响应式布局正常
- [ ] TypeScript 编译通过
- [ ] 没有 console 错误

---

## 🗑️ 清理

迁移完成后可以删除:

1. `src/components/admin/ChapterAddForm.tsx`
2. `src/components/admin/ChapterEditForm.tsx`

**注意:** 删除前确保所有使用这些组件的地方都已迁移!

---

## 🔗 相关文档

- [Zod 验证](./ZOD_VALIDATION_EXAMPLES.md)
- [Admin 中间件](./ADMIN_MIDDLEWARE_USAGE.md)
- [代码质量审计](./CODE_QUALITY_AUDIT_REPORT.md)

---

**创建日期:** 2025-11-13
**节省代码:** ~200 行
**维护成本:** ⬇️ 显著降低
