import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('employeeId');

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    if (!userId) return;
    const stored = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
    // Filter for current user or Owner logic
    const role = localStorage.getItem('role');
    const myNotifications = stored.filter(n => n.userId === userId || (role === 'ROLE_OWNER' && n.userId === 'owner'));
    setNotifications(myNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  const markAsRead = (id) => {
    const stored = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
    const updated = stored.map(n => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem('mockNotifications', JSON.stringify(updated));
    loadNotifications();
  };

  const clearAll = () => {
    const stored = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
    const role = localStorage.getItem('role');
    const filtered = stored.filter(n => !(n.userId === userId || (role === 'ROLE_OWNER' && n.userId === 'owner')));
    localStorage.setItem('mockNotifications', JSON.stringify(filtered));
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6 relative z-30 transition-colors">
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors"
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Notifications</h3>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold flex items-center gap-1">
                  <Trash2 size={12} /> Clear All
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">No new notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">
                        {notif.type === 'Approved' ? <CheckCircle size={18} className="text-green-500" /> : 
                         notif.type === 'Rejected' ? <XCircle size={18} className="text-red-500" /> : 
                         <Bell size={18} className="text-blue-500" />}
                      </div>
                      <div>
                        <p className={`text-sm ${!notif.isRead ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>{notif.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
