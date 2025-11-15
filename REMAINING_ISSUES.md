# 剩余问题列表

## ✅ 已修复
1. **段落评论无限循环** - 40+次并发请求导致连接池耗尽
   - 解决方案：批量API，一次请求获取所有段落评论数

## 🔧 待修复

### 2. 阅读器点赞错误
```
TypeError: Cannot read properties of undefined (reading 'likeCount')
```
- 需要检查小说点赞组件的数据结构

### 3. Writer Dashboard - Recent Stories 更新不及时
- 已上传的小说没有显示
- 需要检查缓存失效机制

### 4. 官方账号 (ButterPicks) 问题
- [ ] 小说详情页点击官方账号没有显示官方卡片
- [ ] Tags 还是4个（应该有官方标识）
- [ ] 官方账号应该有官方头像边框
- [ ] 头像下面显示 "Novice Reader" 而不是 "Official"
- [ ] 官方账号 modal 只显示粉丝数，不显示 following/books read

### 5. 分页问题
- Profile 相关的 library 应该分页
- Reading history 应该分页

### 6. Redis 缓存问题
- Upstash Data Browser 没有看到首页缓存
- 刷新几次都没有出现
- 已添加日志，需要检查 Vercel 日志

## 优先级
1. **P0（严重）** - 点赞错误（影响用户体验）
2. **P1（高）** - Redis 缓存问题（影响性能）
3. **P2（中）** - Writer dashboard、官方账号
4. **P3（低）** - 分页
