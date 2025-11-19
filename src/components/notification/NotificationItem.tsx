'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NotificationItemProps {
  notification: any;
  onArchive: () => void;
}

// 判断是否为作者通知
function isAuthorNotification(type: string): boolean {
  const authorTypes = ['NOVEL_RATING', 'NOVEL_COMMENT'];
  return authorTypes.includes(type);
}

export default function NotificationItem({
  notification,
  onArchive,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = async () => {
    // 标记为归档
    try {
      await fetch(`/api/notifications/${notification.id}/archive`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }

    // 跳转链接
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }

    onArchive();
  };

  const isAuthor = isAuthorNotification(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: zhCN,
  });

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
        !notification.isRead
          ? 'bg-blue-50 dark:bg-blue-900/10'
          : ''
      } ${
        isAuthor
          ? 'border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 头像/图标 */}
        {notification.imageUrl ? (
          <img
            src={notification.imageUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">🔔</span>
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {isAuthor && (
            <span className="inline-block text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
              ✍️ 作者通知
            </span>
          )}

          <div className="font-medium text-gray-900 dark:text-white text-sm">
            {notification.title}
          </div>

          {notification.content && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {notification.content}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo}
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
