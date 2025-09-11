import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  UserCheck,
  GraduationCap,
  Bell,
  MessageSquare,
  LogOut,
  Mail,
  Activity
} from 'lucide-react';
import LearnovaLogo from '@/components/images/LEARNOVA-T.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/courses', icon: BookOpen, label: 'Courses' },
      { to: '/assignments', icon: FileText, label: 'Assignments' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/messages', icon: MessageSquare, label: 'Messages' },
    ];

    switch (user?.role) {
      case 'admin':
        // Admin isolation: show only admin section links
        return [
          { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
          { to: '/admin/users', icon: Users, label: 'Users' },
          { to: '/admin/departments', icon: Users, label: 'Departments' },
          { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
          { to: '/admin/announcements', icon: MessageSquare, label: 'Announcements' },
          { to: '/admin/logs', icon: FileText, label: 'Audit Logs' },
          { to: '/admin/backups', icon: Settings, label: 'Backups' },
          { to: '/admin/impersonation', icon: UserCheck, label: 'Impersonation' },
          { to: '/admin/permissions', icon: UserCheck, label: 'Permissions' },
          { to: '/admin/invites', icon: Mail, label: 'Invites' },
          { to: '/admin/health', icon: Activity, label: 'Health' },
          { to: '/admin/support', icon: MessageSquare, label: 'Support' },
          { to: '/admin/settings', icon: Settings, label: 'System Settings' },
        ];
      case 'faculty':
        return [
          ...commonItems,
          { to: '/students', icon: UserCheck, label: 'My Students' },
          { to: '/gradebook', icon: BarChart3, label: 'Gradebook' },
          { to: '/profile', icon: Settings, label: 'Profile' },
        ];
      case 'student':
        return [
          ...commonItems,
          { to: '/grades', icon: GraduationCap, label: 'My Grades' },
          { to: '/profile', icon: Settings, label: 'Profile' },
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 nav-academic z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-nav-foreground/10">
            <div className="flex items-center gap-3">
              <img src={LearnovaLogo} alt="Learnova logo" className="h-9 w-auto object-contain" />
              <h1 className="text-2xl font-bold text-nav-foreground">Learnova</h1>
            </div>
            <p className="text-nav-foreground/70 text-sm mt-1">Learning Management</p>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-nav-foreground/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-nav-accent/20 flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-nav-accent font-semibold">
                    {user?.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-nav-foreground font-medium truncate">{user?.name}</p>
                <p className="text-nav-foreground/60 text-sm capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
                      ${isActive 
                        ? 'bg-nav-accent text-white shadow-lg' 
                        : 'text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/5'
                      }
                    `}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-nav-foreground/10">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/5 rounded-lg transition-colors duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}