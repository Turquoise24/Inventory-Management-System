"use client";

import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setNotifications,
  setUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  setLoading,
} from "@/store/slices/notificationSlice";
import { notificationService } from "@/services/notificationService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading } = useAppSelector(
    (state) => state.notification,
  );
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await notificationService.getAllNotifications();
      if (response.success && response.data) {
        dispatch(setNotifications(response.data));
        // Update unread count from the response
        const unreadCount = (response as any).unreadCount || 0;
        dispatch(setUnreadCount(unreadCount));
      }
    } catch (error: any) {
      // Silently fail for background polling to avoid annoying users
      console.error("Failed to fetch notifications:", error);
    } finally {
      dispatch(setLoading(false));
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchNotifications();

    // Real-time polling: Check for new notifications every 5 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      dispatch(markAsRead(id));
      // Refresh to update the count
      await fetchNotifications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch(markAllAsRead());
      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      dispatch(deleteNotification(id));
      toast.success("Notification deleted");
      // Refresh to update the count
      await fetchNotifications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_updated":
        return "✏️";
      case "request_deleted":
        return "🗑️";
      case "request_created":
        return "✨";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "request_updated":
        return "bg-blue-50 border-blue-200";
      case "request_deleted":
        return "bg-red-50 border-red-200";
      case "request_created":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-stone-100 rounded-lg border border-stone-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">
              You&apos;ll be notified when admins interact with your requests
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className="bg-white rounded-lg border border-stone-200 p-6"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {!notification.isRead && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-cyan-300 text-gray-900">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default NotificationsPage;
