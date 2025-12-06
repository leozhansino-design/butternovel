# Paddle 支付集成设计文档

> ButterNovel 付费功能集成方案
> 版本: 1.0
> 日期: 2025-12-06

---

## 目录

1. [Paddle 验证需求](#1-paddle-验证需求)
2. [商业模式设计](#2-商业模式设计)
3. [技术架构](#3-技术架构)
4. [数据库设计](#4-数据库设计)
5. [API 设计](#5-api-设计)
6. [前端组件](#6-前端组件)
7. [Webhook 处理](#7-webhook-处理)
8. [实现步骤](#8-实现步骤)

---

## 1. Paddle 验证需求

根据 Paddle 客服 (Danny) 的邮件，需要完成以下准备工作：

### 1.1 需要准备的内容

| 需求 | 状态 | 说明 |
|-----|------|-----|
| ① 确认版权所有权 | ❌ 待办 | 确认是电子书的作者/拥有者，或基于 GPL 销售 |
| ② 法律名称 | ❌ 待办 | 在条款页面添加 "Haikou Portal Technology Co., Ltd" |
| ③ Checkout 嵌入 URL | ❌ 待办 | 需要创建定价页面 `/pricing` |
| ④ 退款政策 | ❌ 待办 | 创建退款政策页面或在条款中添加（Paddle 要求最少 14 天） |
| ⑤ 定价页面 | ❌ 待办 | 创建 `/pricing` 页面展示会员方案 |

### 1.2 需要创建/更新的页面

```
/src/app/pricing/page.tsx          # 新建 - 定价页面
/src/app/terms/page.tsx            # 更新 - 添加法律名称和退款政策
/src/app/refund/page.tsx           # 新建 - 退款政策页面（可选，也可放在 terms）
```

### 1.3 条款页面需添加的内容

```markdown
## 法律实体信息

ButterNovel 由 **Haikou Portal Technology Co., Ltd**（海口门户科技有限公司）运营。

## 内容版权声明

ButterNovel 平台上的内容分为以下类型：
1. **原创内容**: 由平台注册作者创作，作者保留完整版权
2. **授权内容**: 获得版权方授权的作品
3. **公共领域**: 已进入公共领域的作品

## 退款政策

根据 Paddle 平台政策，所有付费内容享有 **14 天无理由退款**保障。

退款条件：
- 购买后 14 天内申请
- 通过 support@butternovel.com 提交退款请求
- 提供订单号和购买邮箱

退款处理时间：3-5 个工作日
```

---

## 2. 商业模式设计

### 2.1 付费模式选择

考虑到 ButterNovel 是小说阅读平台，推荐采用 **订阅制 + 虚拟货币** 混合模式：

```
┌─────────────────────────────────────────────────────────────┐
│                    ButterNovel 付费体系                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │   订阅会员 VIP   │    │        虚拟货币(金币)        │    │
│  │                 │    │                             │    │
│  │  • 月度会员 $4.99│    │  • 用于购买单章节            │    │
│  │  • 年度会员 $39.99│   │  • 充值获得（$1 = 100 金币）  │    │
│  │                 │    │  • 订阅会员每月赠送 500 金币   │    │
│  │  权益:          │    │                             │    │
│  │  • 全站免费阅读  │    │  非会员购买:                 │    │
│  │  • 无广告体验    │    │  • 每章 10-50 金币           │    │
│  │  • 抢先阅读      │    │  • 约 $0.10 - $0.50/章       │    │
│  │  • 专属徽章      │    │                             │    │
│  └─────────────────┘    └─────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 定价策略

| 商品类型 | Paddle Product | 价格 (USD) | 说明 |
|---------|----------------|-----------|------|
| 月度会员 | `pro_monthly` | $4.99/月 | 订阅，自动续费 |
| 年度会员 | `pro_yearly` | $39.99/年 | 订阅，节省33% |
| 金币包 - 小 | `coins_100` | $1.00 | 一次性，100 金币 |
| 金币包 - 中 | `coins_500` | $4.50 | 一次性，500 金币，送10% |
| 金币包 - 大 | `coins_1000` | $8.00 | 一次性，1000 金币，送25% |

### 2.3 作者收益分成

```
读者付费 → 平台分成 30% → 作者收益 70%

示例：
- 读者购买章节花费 50 金币 ($0.50)
- 作者获得 35 金币 ($0.35)
- 平台获得 15 金币 ($0.15)
```

---

## 3. 技术架构

### 3.1 Paddle 集成架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ PricingPage  │  │ WalletModal  │  │ ChapterPurchase    │    │
│  │              │  │              │  │ Modal              │    │
│  │ - 显示方案   │  │ - 显示余额   │  │ - 购买确认         │    │
│  │ - 选择购买   │  │ - 充值入口   │  │ - 金币支付         │    │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘    │
│         │                 │                     │               │
│         └────────────────┬┴─────────────────────┘               │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │              Paddle.js SDK (Checkout Overlay)              │  │
│  │                                                            │  │
│  │  paddle.Checkout.open({                                    │  │
│  │    items: [{ priceId: 'pri_xxx', quantity: 1 }],          │  │
│  │    customer: { email: 'user@email.com' },                  │  │
│  │    customData: { userId: 'cuid_xxx' }                      │  │
│  │  })                                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ 支付完成后
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Paddle Webhooks                             │
│                                                                  │
│  POST /api/webhooks/paddle                                      │
│                                                                  │
│  Events:                                                         │
│  • subscription.created    → 创建会员                            │
│  • subscription.updated    → 更新会员状态                         │
│  • subscription.canceled   → 取消会员                            │
│  • transaction.completed   → 一次性购买完成                       │
│  • transaction.payment_failed → 支付失败                         │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Next.js API)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/webhooks/paddle     - Webhook 处理                         │
│  /api/subscription/status - 查询订阅状态                          │
│  /api/wallet/balance      - 查询金币余额                          │
│  /api/wallet/recharge     - 创建充值订单                          │
│  /api/chapters/[id]/purchase - 购买章节                          │
│  /api/writer/earnings     - 作者收益                             │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Subscription      - 用户订阅信息                                 │
│  UserWallet        - 用户金币钱包                                 │
│  WalletTransaction - 钱包交易记录                                 │
│  ChapterPurchase   - 章节购买记录                                 │
│  WriterEarnings    - 作者收益                                    │
│  PaymentRecord     - Paddle 支付记录                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 依赖安装

```bash
npm install @paddle/paddle-node-sdk
```

### 3.3 环境变量

```bash
# .env.local

# Paddle Configuration
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx  # Webhook 签名密钥
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx  # 前端 SDK token
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # sandbox 或 production

# Paddle Product/Price IDs
PADDLE_PRICE_MONTHLY=pri_xxx
PADDLE_PRICE_YEARLY=pri_xxx
PADDLE_PRICE_COINS_100=pri_xxx
PADDLE_PRICE_COINS_500=pri_xxx
PADDLE_PRICE_COINS_1000=pri_xxx
```

---

## 4. 数据库设计

### 4.1 新增 Prisma 模型

```prisma
// prisma/schema.prisma 新增内容

// ============================================
// 付费系统
// ============================================

// 订阅状态枚举
enum SubscriptionStatus {
  ACTIVE      // 激活中
  PAUSED      // 暂停
  CANCELED    // 已取消（到期前仍可用）
  PAST_DUE    // 逾期
  EXPIRED     // 已过期
}

// 订阅计划枚举
enum SubscriptionPlan {
  MONTHLY     // 月度
  YEARLY      // 年度
}

// 用户订阅
model Subscription {
  id              String              @id @default(cuid())
  userId          String              @unique

  // Paddle 信息
  paddleSubscriptionId  String        @unique  // Paddle subscription ID
  paddleCustomerId      String                 // Paddle customer ID

  // 订阅信息
  plan            SubscriptionPlan
  status          SubscriptionStatus  @default(ACTIVE)

  // 时间
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  canceledAt          DateTime?

  // 元数据
  priceId         String              // Paddle price ID
  currency        String              @default("USD")
  amount          Decimal             @db.Decimal(10, 2)

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([userId])
  @@index([paddleSubscriptionId])
  @@index([status])
}

// 用户钱包
model UserWallet {
  id              String              @id @default(cuid())
  userId          String              @unique

  // 余额（金币）
  balance         Int                 @default(0)

  // 统计
  totalRecharged  Int                 @default(0)  // 总充值金币
  totalSpent      Int                 @default(0)  // 总消费金币

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // 关系
  transactions    WalletTransaction[]
  purchases       ChapterPurchase[]

  @@index([userId])
}

// 交易类型枚举
enum TransactionType {
  RECHARGE        // 充值
  PURCHASE        // 购买章节
  SUBSCRIPTION_BONUS  // 订阅赠送
  REFUND          // 退款
  EARNING         // 作者收益
  WITHDRAWAL      // 提现
}

// 钱包交易记录
model WalletTransaction {
  id              String              @id @default(cuid())
  walletId        String
  wallet          UserWallet          @relation(fields: [walletId], references: [id], onDelete: Cascade)

  type            TransactionType
  amount          Int                 // 金币数量（正数增加，负数减少）
  balanceAfter    Int                 // 交易后余额

  // 关联信息
  description     String?
  relatedId       String?             // 关联的 Paddle transaction ID 或 ChapterPurchase ID

  createdAt       DateTime            @default(now())

  @@index([walletId, createdAt])
  @@index([type])
}

// 章节购买记录
model ChapterPurchase {
  id              String              @id @default(cuid())

  // 购买者
  userId          String
  walletId        String
  wallet          UserWallet          @relation(fields: [walletId], references: [id])

  // 购买内容
  novelId         Int
  chapterId       Int

  // 价格
  price           Int                 // 花费金币

  // 收益分成
  authorEarning   Int                 // 作者获得金币 (70%)
  platformFee     Int                 // 平台费用 (30%)

  createdAt       DateTime            @default(now())

  @@unique([userId, chapterId])       // 每个用户每章只能购买一次
  @@index([userId])
  @@index([novelId])
  @@index([chapterId])
}

// 作者收益
model WriterEarnings {
  id              String              @id @default(cuid())
  userId          String              @unique  // 作者的 user ID

  // 收益统计（金币）
  totalEarned     Int                 @default(0)  // 总收益
  withdrawn       Int                 @default(0)  // 已提现
  pending         Int                 @default(0)  // 待结算
  available       Int                 @default(0)  // 可提现

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // 关系
  withdrawals     WriterWithdrawal[]

  @@index([userId])
}

// 提现状态枚举
enum WithdrawalStatus {
  PENDING         // 待处理
  PROCESSING      // 处理中
  COMPLETED       // 已完成
  REJECTED        // 已拒绝
}

// 作者提现记录
model WriterWithdrawal {
  id              String              @id @default(cuid())
  earningsId      String
  earnings        WriterEarnings      @relation(fields: [earningsId], references: [id])

  amount          Int                 // 提现金币数
  amountUsd       Decimal             @db.Decimal(10, 2)  // 折合美元

  status          WithdrawalStatus    @default(PENDING)

  // 支付信息
  paymentMethod   String?             // PayPal, Bank, etc.
  paymentAccount  String?             // 脱敏后的账户信息

  // 处理信息
  processedAt     DateTime?
  processedBy     String?             // Admin ID
  rejectReason    String?

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([earningsId])
  @@index([status])
}

// Paddle 支付记录（用于对账和 webhook 去重）
model PaymentRecord {
  id                    String        @id @default(cuid())

  // Paddle 信息
  paddleTransactionId   String        @unique
  paddleCustomerId      String?
  paddleSubscriptionId  String?

  // 用户
  userId                String

  // 支付信息
  type                  String        // subscription, one_time
  status                String        // completed, refunded, etc.

  amount                Decimal       @db.Decimal(10, 2)
  currency              String

  // 商品信息
  priceId               String
  productId             String?

  // 元数据
  metadata              Json?         // 原始 webhook 数据

  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  @@index([userId])
  @@index([paddleTransactionId])
  @@index([paddleSubscriptionId])
}
```

### 4.2 现有模型修改

```prisma
// 修改 User 模型，添加付费相关字段
model User {
  // ... 现有字段 ...

  // 付费系统（新增）
  subscription      Subscription?
  wallet            UserWallet?
  chapterPurchases  ChapterPurchase[]
  writerEarnings    WriterEarnings?

  // VIP 相关
  isVip             Boolean           @default(false)
  vipExpiredAt      DateTime?
}

// 修改 Novel 模型，添加付费章节设置
model Novel {
  // ... 现有字段 ...

  // 付费设置（新增）
  isPaidNovel       Boolean           @default(false)   // 是否为付费小说
  freeChapterCount  Int               @default(5)       // 免费章节数
  chapterPrice      Int               @default(10)      // 每章价格（金币）
}

// 修改 Chapter 模型，添加付费标记
model Chapter {
  // ... 现有字段 ...

  // 付费设置（新增）
  isPaid            Boolean           @default(false)   // 是否为付费章节
  price             Int?                                 // 单独定价（覆盖小说默认价）

  // 关系
  purchases         ChapterPurchase[]
}
```

---

## 5. API 设计

### 5.1 API 路由列表

```
/api/webhooks/paddle          POST   - Paddle Webhook 处理
/api/subscription/status      GET    - 获取订阅状态
/api/subscription/cancel      POST   - 取消订阅
/api/wallet/balance           GET    - 获取钱包余额
/api/wallet/recharge          POST   - 创建充值订单
/api/wallet/transactions      GET    - 获取交易记录
/api/chapters/[id]/purchase   POST   - 购买章节
/api/chapters/[id]/access     GET    - 检查章节访问权限
/api/writer/earnings          GET    - 获取作者收益
/api/writer/withdraw          POST   - 申请提现
```

### 5.2 核心 API 实现

#### 5.2.1 Paddle 初始化 (`src/lib/paddle.ts`)

```typescript
import Paddle from '@paddle/paddle-node-sdk'

// 服务端 Paddle 客户端
export const paddle = new Paddle(process.env.PADDLE_API_KEY!)

// 价格 ID 映射
export const PADDLE_PRICES = {
  MONTHLY: process.env.PADDLE_PRICE_MONTHLY!,
  YEARLY: process.env.PADDLE_PRICE_YEARLY!,
  COINS_100: process.env.PADDLE_PRICE_COINS_100!,
  COINS_500: process.env.PADDLE_PRICE_COINS_500!,
  COINS_1000: process.env.PADDLE_PRICE_COINS_1000!,
} as const

// 金币包配置
export const COIN_PACKAGES = {
  [PADDLE_PRICES.COINS_100]: { coins: 100, bonus: 0 },
  [PADDLE_PRICES.COINS_500]: { coins: 500, bonus: 50 },   // 10% bonus
  [PADDLE_PRICES.COINS_1000]: { coins: 1000, bonus: 250 }, // 25% bonus
} as const

// 验证 Webhook 签名
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET!
  // Paddle SDK 内置验证
  return paddle.webhooks.verify(payload, signature, secret)
}
```

#### 5.2.2 Webhook 处理 (`src/app/api/webhooks/paddle/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { paddle, COIN_PACKAGES, verifyWebhookSignature } from '@/lib/paddle'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('paddle-signature')

  // 验证签名
  if (!signature || !await verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  try {
    // 防止重复处理
    const existing = await prisma.paymentRecord.findUnique({
      where: { paddleTransactionId: event.data.id }
    })
    if (existing) {
      return NextResponse.json({ message: 'Already processed' })
    }

    switch (event.event_type) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscription(event.data)
        break

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data)
        break

      case 'transaction.completed':
        await handleTransactionCompleted(event.data)
        break

      case 'transaction.payment_failed':
        await handlePaymentFailed(event.data)
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscription(data: any) {
  const userId = data.custom_data?.userId
  if (!userId) throw new Error('Missing userId in custom_data')

  await prisma.$transaction(async (tx) => {
    // 更新或创建订阅
    await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        paddleSubscriptionId: data.id,
        paddleCustomerId: data.customer_id,
        plan: data.items[0].price.billing_cycle.interval === 'month' ? 'MONTHLY' : 'YEARLY',
        status: mapPaddleStatus(data.status),
        currentPeriodStart: new Date(data.current_billing_period.starts_at),
        currentPeriodEnd: new Date(data.current_billing_period.ends_at),
        priceId: data.items[0].price.id,
        amount: data.items[0].price.unit_price.amount / 100,
        currency: data.currency_code,
      },
      update: {
        status: mapPaddleStatus(data.status),
        currentPeriodStart: new Date(data.current_billing_period.starts_at),
        currentPeriodEnd: new Date(data.current_billing_period.ends_at),
      },
    })

    // 更新用户 VIP 状态
    await tx.user.update({
      where: { id: userId },
      data: {
        isVip: true,
        vipExpiredAt: new Date(data.current_billing_period.ends_at),
      },
    })

    // 记录支付
    await tx.paymentRecord.create({
      data: {
        paddleTransactionId: data.transaction_id || data.id,
        paddleCustomerId: data.customer_id,
        paddleSubscriptionId: data.id,
        userId,
        type: 'subscription',
        status: 'completed',
        amount: data.items[0].price.unit_price.amount / 100,
        currency: data.currency_code,
        priceId: data.items[0].price.id,
        metadata: data,
      },
    })
  })
}

async function handleTransactionCompleted(data: any) {
  const userId = data.custom_data?.userId
  if (!userId) throw new Error('Missing userId')

  // 检查是否是金币充值
  const priceId = data.items[0]?.price?.id
  const coinPackage = COIN_PACKAGES[priceId as keyof typeof COIN_PACKAGES]

  if (coinPackage) {
    await handleCoinRecharge(userId, data, coinPackage)
  }
}

async function handleCoinRecharge(
  userId: string,
  data: any,
  coinPackage: { coins: number; bonus: number }
) {
  const totalCoins = coinPackage.coins + coinPackage.bonus

  await prisma.$transaction(async (tx) => {
    // 获取或创建钱包
    let wallet = await tx.userWallet.findUnique({ where: { userId } })
    if (!wallet) {
      wallet = await tx.userWallet.create({
        data: { userId, balance: 0 }
      })
    }

    // 增加余额
    const newBalance = wallet.balance + totalCoins
    await tx.userWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalRecharged: { increment: totalCoins },
      },
    })

    // 记录交易
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'RECHARGE',
        amount: totalCoins,
        balanceAfter: newBalance,
        description: `充值 ${coinPackage.coins} 金币${coinPackage.bonus > 0 ? `，赠送 ${coinPackage.bonus}` : ''}`,
        relatedId: data.id,
      },
    })

    // 记录支付
    await tx.paymentRecord.create({
      data: {
        paddleTransactionId: data.id,
        paddleCustomerId: data.customer_id,
        userId,
        type: 'one_time',
        status: 'completed',
        amount: data.details.totals.total / 100,
        currency: data.currency_code,
        priceId: data.items[0].price.id,
        metadata: data,
      },
    })
  })
}

function mapPaddleStatus(status: string) {
  const map: Record<string, string> = {
    'active': 'ACTIVE',
    'paused': 'PAUSED',
    'canceled': 'CANCELED',
    'past_due': 'PAST_DUE',
    'trialing': 'ACTIVE',
  }
  return map[status] || 'ACTIVE'
}
```

#### 5.2.3 购买章节 (`src/app/api/chapters/[id]/purchase/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chapterId = parseInt(params.id)
  const userId = session.user.id

  try {
    // 检查是否已购买
    const existingPurchase = await prisma.chapterPurchase.findUnique({
      where: { userId_chapterId: { userId, chapterId } }
    })
    if (existingPurchase) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
    }

    // 获取章节和小说信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: true }
    })
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // 检查是否为付费章节
    if (!chapter.isPaid) {
      return NextResponse.json({ error: 'Chapter is free' }, { status: 400 })
    }

    // VIP 用户免费阅读
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.isVip && user.vipExpiredAt && user.vipExpiredAt > new Date()) {
      return NextResponse.json({ access: true, isVip: true })
    }

    // 获取钱包
    const wallet = await prisma.userWallet.findUnique({ where: { userId } })
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 400 })
    }

    // 计算价格
    const price = chapter.price || chapter.novel.chapterPrice
    if (wallet.balance < price) {
      return NextResponse.json({
        error: 'Insufficient balance',
        required: price,
        current: wallet.balance
      }, { status: 400 })
    }

    // 计算分成
    const authorEarning = Math.floor(price * 0.7)
    const platformFee = price - authorEarning

    // 执行购买
    await prisma.$transaction(async (tx) => {
      // 扣除买家余额
      const newBalance = wallet.balance - price
      await tx.userWallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          totalSpent: { increment: price },
        },
      })

      // 记录交易
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PURCHASE',
          amount: -price,
          balanceAfter: newBalance,
          description: `购买《${chapter.novel.title}》第${chapter.chapterNumber}章`,
        },
      })

      // 创建购买记录
      await tx.chapterPurchase.create({
        data: {
          userId,
          walletId: wallet.id,
          novelId: chapter.novelId,
          chapterId,
          price,
          authorEarning,
          platformFee,
        },
      })

      // 增加作者收益
      await tx.writerEarnings.upsert({
        where: { userId: chapter.novel.authorId },
        create: {
          userId: chapter.novel.authorId,
          totalEarned: authorEarning,
          available: authorEarning,
        },
        update: {
          totalEarned: { increment: authorEarning },
          available: { increment: authorEarning },
        },
      })
    })

    return NextResponse.json({ success: true, price })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
  }
}
```

---

## 6. 前端组件

### 6.1 Paddle SDK 初始化 (`src/components/providers/PaddleProvider.tsx`)

```tsx
'use client'

import { useEffect } from 'react'
import { initializePaddle, Paddle } from '@paddle/paddle-js'

let paddleInstance: Paddle | null = null

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!paddleInstance) {
      initializePaddle({
        environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production',
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      }).then((paddle) => {
        paddleInstance = paddle
      })
    }
  }, [])

  return <>{children}</>
}

export function usePaddle() {
  return paddleInstance
}
```

### 6.2 定价页面 (`src/app/pricing/page.tsx`)

```tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePaddle } from '@/components/providers/PaddleProvider'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Read free chapters',
      'Basic reading experience',
      'Community access',
      'Bookshelf (up to 50 books)',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'VIP Monthly',
    price: '$4.99',
    period: '/month',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
    features: [
      'All free features',
      'Unlimited paid chapters',
      'No ads',
      'Early access to new chapters',
      '500 bonus coins/month',
      'VIP badge',
    ],
    cta: 'Subscribe',
    popular: true,
  },
  {
    name: 'VIP Yearly',
    price: '$39.99',
    period: '/year',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY,
    features: [
      'All VIP Monthly features',
      'Save 33%',
      '6000 bonus coins/year',
      'Priority support',
    ],
    cta: 'Subscribe & Save',
  },
]

const coinPackages = [
  { coins: 100, price: '$1.00', priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_COINS_100 },
  { coins: 500, price: '$4.50', bonus: '+50', priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_COINS_500 },
  { coins: 1000, price: '$8.00', bonus: '+250', priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_COINS_1000 },
]

export default function PricingPage() {
  const { data: session } = useSession()
  const paddle = usePaddle()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    if (!session?.user?.email) {
      // Redirect to login
      window.location.href = '/login?redirect=/pricing'
      return
    }

    if (!paddle) {
      console.error('Paddle not initialized')
      return
    }

    setLoading(priceId)

    try {
      await paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: session.user.email },
        customData: { userId: session.user.id },
        settings: {
          successUrl: `${window.location.origin}/pricing/success`,
          displayMode: 'overlay',
        },
      })
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock unlimited access to premium novels
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`
                bg-white rounded-2xl shadow-lg p-8
                ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}
              `}
            >
              {plan.popular && (
                <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full w-fit mb-4">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.priceId && handleCheckout(plan.priceId)}
                disabled={plan.disabled || loading === plan.priceId}
                className={`
                  w-full py-3 rounded-lg font-medium transition
                  ${plan.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }
                  ${plan.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {loading === plan.priceId ? 'Loading...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Coin Packages */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Buy Coins
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Use coins to purchase individual chapters
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {coinPackages.map((pkg) => (
              <div
                key={pkg.coins}
                className="border rounded-xl p-6 text-center hover:border-blue-500 transition cursor-pointer"
                onClick={() => pkg.priceId && handleCheckout(pkg.priceId)}
              >
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {pkg.coins}
                  {pkg.bonus && (
                    <span className="text-green-500 text-lg ml-1">{pkg.bonus}</span>
                  )}
                </div>
                <div className="text-gray-500 mb-4">coins</div>
                <div className="text-2xl font-bold">{pkg.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6.3 章节购买模态框 (`src/components/reader/ChapterPurchaseModal.tsx`)

```tsx
'use client'

import { useState } from 'react'
import { Coins, Lock } from 'lucide-react'

interface Props {
  chapter: {
    id: number
    title: string
    chapterNumber: number
    price: number
  }
  novel: {
    title: string
  }
  userBalance: number
  onPurchase: () => Promise<void>
  onClose: () => void
}

export function ChapterPurchaseModal({
  chapter,
  novel,
  userBalance,
  onPurchase,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false)
  const canAfford = userBalance >= chapter.price

  const handlePurchase = async () => {
    setLoading(true)
    try {
      await onPurchase()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
          <Lock className="w-8 h-8 text-blue-500" />
        </div>

        <h3 className="text-xl font-bold text-center mb-2">
          Unlock Chapter
        </h3>

        <p className="text-gray-600 text-center mb-6">
          {novel.title} - Chapter {chapter.chapterNumber}: {chapter.title}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Chapter Price</span>
            <span className="font-bold flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              {chapter.price}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Your Balance</span>
            <span className={`font-bold flex items-center gap-1 ${!canAfford ? 'text-red-500' : ''}`}>
              <Coins className="w-4 h-4 text-yellow-500" />
              {userBalance}
            </span>
          </div>
        </div>

        {canAfford ? (
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Unlock Now'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-red-500 text-center text-sm">
              Insufficient balance. You need {chapter.price - userBalance} more coins.
            </p>
            <a
              href="/pricing"
              className="block w-full bg-blue-500 text-white py-3 rounded-lg font-medium text-center hover:bg-blue-600"
            >
              Buy Coins
            </a>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
```

---

## 7. Webhook 处理

### 7.1 Webhook 事件列表

| 事件 | 处理逻辑 |
|-----|---------|
| `subscription.created` | 创建订阅记录，更新用户 VIP 状态 |
| `subscription.updated` | 更新订阅状态和到期时间 |
| `subscription.canceled` | 标记订阅为已取消，设置到期时间 |
| `subscription.past_due` | 标记逾期，发送提醒邮件 |
| `transaction.completed` | 处理一次性购买（金币充值） |
| `transaction.refunded` | 处理退款，扣除对应金币 |

### 7.2 Webhook URL 配置

在 Paddle Dashboard 中配置：
```
Production: https://www.butternovel.com/api/webhooks/paddle
Sandbox: https://staging.butternovel.com/api/webhooks/paddle
```

---

## 8. 实现步骤

### Phase 1: 基础准备 (1-2 天)

- [ ] 回复 Paddle 邮件，确认版权和法律信息
- [ ] 更新 `/terms` 页面，添加法律实体和退款政策
- [ ] 创建 `/pricing` 页面基础结构
- [ ] 在 Paddle Dashboard 创建产品和价格

### Phase 2: 数据库迁移 (1 天)

- [ ] 添加 Prisma schema 新模型
- [ ] 运行数据库迁移
- [ ] 修改 User/Novel/Chapter 模型

### Phase 3: 后端 API (2-3 天)

- [ ] 实现 Paddle 初始化 (`src/lib/paddle.ts`)
- [ ] 实现 Webhook 处理 (`/api/webhooks/paddle`)
- [ ] 实现订阅状态 API
- [ ] 实现钱包 API
- [ ] 实现章节购买 API

### Phase 4: 前端组件 (2-3 天)

- [ ] 实现 PaddleProvider
- [ ] 完善 Pricing 页面
- [ ] 实现 ChapterPurchaseModal
- [ ] 实现钱包组件
- [ ] 实现 VIP 徽章显示

### Phase 5: 测试 (2 天)

- [ ] Sandbox 环境测试订阅流程
- [ ] 测试金币充值流程
- [ ] 测试章节购买流程
- [ ] 测试 Webhook 处理
- [ ] 测试退款流程

### Phase 6: 上线 (1 天)

- [ ] 切换到 Production 环境
- [ ] 配置生产 Webhook
- [ ] 监控首批交易
- [ ] 准备客服响应

---

## 附录: Paddle 邮件回复模板

```
Hi Danny,

Thank you for your response. Here are the answers to your questions:

1. **Content Ownership**: ButterNovel is a user-generated content platform.
   - Original content: Created by our registered authors who retain full copyright
   - Platform content: We publish public domain works and content we have licensed

2. **Legal Entity**: I have updated our Terms and Conditions page to include our
   legal name "Haikou Portal Technology Co., Ltd"
   URL: https://www.butternovel.com/terms

3. **Checkout URL**: We plan to embed Paddle checkout on our pricing page
   URL: https://www.butternovel.com/pricing

4. **Refund Policy**: I have added our refund policy (14-day minimum as per Paddle's
   Buyer Terms) to our Terms page
   URL: https://www.butternovel.com/terms#refund-policy

5. **Pricing Page**: Our pricing page is now live at
   URL: https://www.butternovel.com/pricing

Please let me know if you need any additional information.

Best regards,
[Your Name]
ButterNovel Team
```

---

*文档结束*
