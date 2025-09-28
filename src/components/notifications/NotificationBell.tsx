import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationsModal from './NotificationsModal';

export function NotificationBell() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { notifications, notificationsCount } = useNotifications(user?.uid);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
      >
        <Bell className="w-5 h-5" />
        {notificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-red-500 rounded-full">
            {notificationsCount}
          </span>
        )}
      </button>

      <NotificationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notifications={notifications}
      />
    </>
  );
}