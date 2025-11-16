# Redis监控系统使用指南

## 📊 概述

Redis监控系统记录所有Redis操作，帮助诊断和优化Redis使用情况。

## 🚀 功能

### 1. 自动记录所有Redis调用
- GET/SET/DEL/KEYS 所有操作
- 记录时间戳、耗时、结果（HIT/MISS/SUCCESS/FAIL）
- 记录调用堆栈（追踪调用来源）
- 内存中保存最近1000条记录

### 2. 实时统计
- 总调用次数
- GET/SET/DEL/KEYS 分类计数
- 缓存命中率
- 错误次数
- 运行时长

### 3. 详细日志
- Console日志：每个操作都会输出详细信息
- 堆栈追踪：知道谁调用了Redis

## 📡 API端点

### 获取统计数据
```bash
GET /api/redis-monitor?action=stats
```

响应示例：
```json
{
  "success": true,
  "data": {
    "totalCalls": 150,
    "gets": 100,
    "sets": 30,
    "dels": 20,
    "keys": 0,
    "hits": 80,
    "misses": 20,
    "errors": 0,
    "startTime": "2025-11-15T10:00:00.000Z",
    "uptime": 3600,
    "hitRate": "80.00%",
    "currentTime": "2025-11-15T11:00:00.000Z"
  }
}
```

### 获取调用日志
```bash
# 获取最近100条
GET /api/redis-monitor?action=logs&limit=100

# 获取所有日志（最多1000条）
GET /api/redis-monitor?action=logs
```

响应示例：
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "timestamp": "2025-11-15T10:30:00.123Z",
      "operation": "GET",
      "key": "home:all-data",
      "result": "HIT",
      "duration": 45,
      "stackTrace": "at getHomePageData (/src/lib/cache-optimized.ts:70:20)..."
    },
    {
      "timestamp": "2025-11-15T10:31:00.456Z",
      "operation": "SET",
      "key": "novel:my-novel",
      "result": "SUCCESS",
      "duration": 67,
      "stackTrace": "..."
    }
  ]
}
```

### 重置统计（仅开发环境）
```bash
GET /api/redis-monitor?action=reset
```

## 📝 Console日志格式

### Redis操作日志
```
[Redis] ✅ HIT: home:all-data (45ms, 12345 bytes)
[Redis] ❌ MISS: novel:test (23ms)
[Redis] 💾 SET: home:all-data (67ms, 12345 bytes, TTL: 3600)
[Redis] 🗑️ DEL: novel:old-data (12ms, 1 key(s))
[Redis] 🔍 KEYS: home:* (89ms, 3 found: home:a, home:b, home:c)
```

### Cache操作日志
```
[Cache] 🔄 getOrSet called for key: home:all-data, TTL: 3600
[Cache] ✅ Cache HIT for home:all-data (total: 50ms)
[Cache] ❌ Cache MISS for novel:test, fetching from database...
[Cache] 💾 Database fetch complete for novel:test (234ms)
[Cache] ✅ Complete for novel:test (total: 345ms, db: 234ms)
```

### Homepage日志
```
[Homepage] 🏠 getHomePageData called
[Homepage] 📊 Fetching fresh data from database
[Homepage] ✅ Data prepared: 24 featured, 15 categories
[Homepage] 🏁 getHomePageData complete (total: 567ms)
```

## 🔍 使用场景

### 1. 诊断高Redis使用量
查看统计数据，确认调用次数和命中率：
```bash
curl https://your-domain.com/api/redis-monitor?action=stats
```

### 2. 追踪具体调用
查看最近100条日志，找出频繁调用的键：
```bash
curl https://your-domain.com/api/redis-monitor?action=logs&limit=100
```

### 3. 验证ISR缓存是否生效
访问首页几次，然后查看统计：
- 如果ISR工作正常：第一次访问后，后续访问不会触发Redis GET
- 如果ISR未生效：每次访问都会有Redis GET

### 4. 查看实时Console日志
在Vercel或本地开发环境，查看实时日志输出：
```
npm run dev
# 或在 Vercel Dashboard -> Logs
```

## 📊 性能指标

### 正常情况（ISR工作）
- **首页访问**：第一次访问/小时才调用Redis
- **命中率**：应该 > 80%
- **每日调用量**：< 100 commands（假设10,000 DAU）

### 异常情况（需要修复）
- **首页访问**：每次访问都调用Redis
- **命中率**：< 50%
- **每日调用量**：> 2000 commands

## 🛠️ 调试步骤

1. **访问首页3次**
2. **查看统计**：`GET /api/redis-monitor?action=stats`
3. **查看日志**：`GET /api/redis-monitor?action=logs&limit=50`
4. **分析**：
   - 检查GET调用次数（应该 = 1，不是3）
   - 检查stackTrace，找出调用来源
   - 查看是否有缓存MISS

## 🔧 代码位置

- **监控模块**：`src/lib/redis-monitor.ts`
- **Redis客户端**：`src/lib/redis.ts`
- **缓存模块**：`src/lib/cache.ts`
- **Homepage数据**：`src/lib/cache-optimized.ts`
- **监控API**：`src/app/api/redis-monitor/route.ts`

## ⚠️ 注意事项

1. **内存限制**：只保存最近1000条记录
2. **生产环境**：
   - Console日志会被记录
   - Reset功能被禁用
3. **调用堆栈**：可能会增加轻微性能开销（< 1ms）
4. **隐私**：日志包含键名，不要记录敏感信息

## 📈 监控仪表板

你可以创建一个简单的监控页面：

```tsx
// src/app/redis-monitor/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function RedisMonitorPage() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // 每5秒刷新一次
    const interval = setInterval(async () => {
      const statsRes = await fetch('/api/redis-monitor?action=stats')
      const statsData = await statsRes.json()
      setStats(statsData.data)

      const logsRes = await fetch('/api/redis-monitor?action=logs&limit=50')
      const logsData = await logsRes.json()
      setLogs(logsData.data)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Redis Monitor</h1>
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-600">Total Calls</div>
            <div className="text-3xl font-bold">{stats.totalCalls}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-600">Hit Rate</div>
            <div className="text-3xl font-bold">{stats.hitRate}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-600">Errors</div>
            <div className="text-3xl font-bold">{stats.errors}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-gray-600">Uptime</div>
            <div className="text-3xl font-bold">{stats.uptime}s</div>
          </div>
        </div>
      )}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Recent Logs</h2>
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="text-sm font-mono">
              {log.timestamp} - {log.operation} {log.key} = {log.result} ({log.duration}ms)
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## 🎯 下一步

现在你可以：
1. 部署代码到Vercel
2. 访问首页几次
3. 查看 `/api/redis-monitor?action=stats`
4. 把日志发给我，我帮你分析问题！
