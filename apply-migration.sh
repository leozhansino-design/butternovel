#!/bin/bash

echo "🔄 应用数据库迁移：添加评分系统和标签功能"
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ 错误：.env 文件不存在"
    echo "请先创建 .env 文件并配置 DATABASE_URL"
    echo "参考 .env.example 文件"
    exit 1
fi

# 检查 DATABASE_URL 是否配置
if ! grep -q "^DATABASE_URL=" .env; then
    echo "❌ 错误：DATABASE_URL 未配置"
    echo "请在 .env 文件中配置 DATABASE_URL"
    exit 1
fi

echo "✅ 环境配置检查通过"
echo ""

# 应用迁移
echo "📦 执行数据库迁移..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 迁移成功！"
    echo ""
    echo "📋 已添加的功能："
    echo "  - Novel 表新增字段："
    echo "    • averageRating (平均评分)"
    echo "    • totalRatings (评分总数)"
    echo "    • tags (标签数组)"
    echo ""
    echo "  - 新增 Rating 表："
    echo "    • 支持用户评分和评论"
    echo "    • 每用户每小说只能评分一次"
    echo ""
    echo "🔄 正在重新生成 Prisma Client..."
    npx prisma generate
    echo ""
    echo "✅ 所有设置完成！可以启动应用了。"
else
    echo ""
    echo "❌ 迁移失败"
    echo ""
    echo "💡 如果遇到连接问题，请手动执行 SQL："
    echo "   查看文件：prisma/migrations/20251112_add_rating_and_tags/migration.sql"
fi
