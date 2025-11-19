'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationPreferencesModalProps {
  onClose: () => void;
}

export default function NotificationPreferencesModal({
  onClose,
}: NotificationPreferencesModalProps) {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/notifications/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: string, value: boolean) => {
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="text-center text-gray-600 dark:text-gray-400">
            加载中...
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            通知偏好设置
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* 站内通知 */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            站内通知
          </h3>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              评分相关通知
            </span>
            <input
              type="checkbox"
              checked={preferences.enableRatingNotifications}
              onChange={(e) =>
                updatePreference('enableRatingNotifications', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              评论相关通知
            </span>
            <input
              type="checkbox"
              checked={preferences.enableCommentNotifications}
              onChange={(e) =>
                updatePreference('enableCommentNotifications', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              关注相关通知
            </span>
            <input
              type="checkbox"
              checked={preferences.enableFollowNotifications}
              onChange={(e) =>
                updatePreference('enableFollowNotifications', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              作者更新通知
            </span>
            <input
              type="checkbox"
              checked={preferences.enableAuthorNotifications}
              onChange={(e) =>
                updatePreference('enableAuthorNotifications', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              启用通知聚合
            </span>
            <input
              type="checkbox"
              checked={preferences.aggregationEnabled}
              onChange={(e) =>
                updatePreference('aggregationEnabled', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>

        {/* 邮件通知 */}
        <div className="space-y-4 mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            邮件通知
          </h3>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              启用邮件通知
            </span>
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) =>
                updatePreference('emailNotifications', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          {preferences.emailNotifications && (
            <div className="ml-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  评分相关
                </span>
                <input
                  type="checkbox"
                  checked={preferences.emailRatingNotifications}
                  onChange={(e) =>
                    updatePreference(
                      'emailRatingNotifications',
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  评论相关
                </span>
                <input
                  type="checkbox"
                  checked={preferences.emailCommentNotifications}
                  onChange={(e) =>
                    updatePreference(
                      'emailCommentNotifications',
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  关注相关
                </span>
                <input
                  type="checkbox"
                  checked={preferences.emailFollowNotifications}
                  onChange={(e) =>
                    updatePreference(
                      'emailFollowNotifications',
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  作者更新
                </span>
                <input
                  type="checkbox"
                  checked={preferences.emailAuthorNotifications}
                  onChange={(e) =>
                    updatePreference(
                      'emailAuthorNotifications',
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
