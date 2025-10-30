import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  BookOpen, Award, ClipboardList, Bell, Settings, Calendar, 
  Upload, MessageSquare, FileText, TrendingUp, Clock, X,
  User, Megaphone, BarChart3, FolderOpen, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop?: boolean;
}

const studentModules = [
  {
    icon: BookOpen,
    label: 'My Courses',
    path: '/courses',
    description: 'View enrolled courses and materials'
  },
  {
    icon: Award,
    label: 'My Grades',
    path: '/grades',
    description: 'Track academic performance and grades'
  },
  {
    icon: ClipboardList,
    label: 'Assignments',
    path: '/student/assignments',
    description: 'View and submit assignments'
  },
  {
    icon: Upload,
    label: 'Submissions',
    path: '/student/submissions',
    description: 'Manage assignment submissions'
  },
  {
    icon: Bell,
    label: 'Announcements',
    path: '/student/announcements',
    description: 'View course and system announcements'
  },
  {
    icon: Calendar,
    label: 'Schedule',
    path: '/student/schedule',
    description: 'View class schedule and events'
  },
  {
    icon: MessageSquare,
    label: 'Messages',
    path: '/student/messages',
    description: 'Communicate with faculty and peers'
  },
  {
    icon: FileText,
    label: 'Course Materials',
    path: '/student/materials',
    description: 'Access course resources and documents'
  },
  {
    icon: TrendingUp,
    label: 'Progress',
    path: '/student/progress',
    description: 'Track learning progress and analytics'
  },
  {
    icon: User,
    label: 'Profile & Settings',
    path: '/student/settings',
    description: 'Manage personal information and preferences'
  },
  {
    icon: Megaphone,
    label: 'Notifications',
    path: '/student/notifications',
    description: 'Manage notification preferences'
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    path: '/student/analytics',
    description: 'View detailed academic analytics'
  }
];

export function StudentSidebar({ isOpen, onClose, isDesktop = false }: StudentSidebarProps) {
  if (isDesktop) {
    return (
      <div className="hidden lg:block w-80 bg-card border-r border-border h-full overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Student Modules</h2>
            <p className="text-sm text-muted-foreground mt-1">Access your academic tools</p>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-sm font-medium mb-3 text-primary">Quick Actions</h3>
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start" asChild>
                <NavLink to="/student/assignments">
                  <Plus size={14} className="mr-2" />
                  New Assignment
                </NavLink>
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" asChild>
                <NavLink to="/student/messages">
                  <MessageSquare size={14} className="mr-2" />
                  Send Message
                </NavLink>
              </Button>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="space-y-3">
            {studentModules.map((module) => (
              <NavLink
                key={module.path}
                to={module.path}
                className={({ isActive }) => `
                  block p-3 rounded-lg border transition-all duration-200
                  ${isActive 
                    ? 'bg-primary/10 border-primary/20 text-primary' 
                    : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/20'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <module.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-none mb-1">
                      {module.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </div>
              </NavLink>
            ))}
          </div>

          {/* Support Link */}
          <div className="mt-8 pt-6 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <NavLink to="/support">
                <Clock size={14} className="mr-2" />
                Get Support
              </NavLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Student Modules</h2>
                  <p className="text-sm text-muted-foreground">Access your academic tools</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <h3 className="text-sm font-medium mb-3 text-primary">Quick Actions</h3>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full justify-start" asChild>
                    <NavLink to="/student/assignments" onClick={onClose}>
                      <Plus size={14} className="mr-2" />
                      New Assignment
                    </NavLink>
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" asChild>
                    <NavLink to="/student/messages" onClick={onClose}>
                      <MessageSquare size={14} className="mr-2" />
                      Send Message
                    </NavLink>
                  </Button>
                </div>
              </div>

              {/* Modules Grid */}
              <div className="space-y-3">
                {studentModules.map((module) => (
                  <NavLink
                    key={module.path}
                    to={module.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      block p-3 rounded-lg border transition-all duration-200
                      ${isActive 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/20'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <module.icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-none mb-1">
                          {module.label}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </NavLink>
                ))}
              </div>

              {/* Support Link */}
              <div className="mt-8 pt-6 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <NavLink to="/support" onClick={onClose}>
                    <Clock size={14} className="mr-2" />
                    Get Support
                  </NavLink>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
