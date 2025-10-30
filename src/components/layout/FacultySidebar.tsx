import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  BookOpen, Users, FileText, BarChart3, Bell, Calendar, 
  Settings, ClipboardList, Award, TrendingUp, Mail, 
  FolderOpen, X, Plus, Download, Upload, Clock,
  MessageSquare, Megaphone, FileBarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FacultySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop?: boolean;
}

const facultyModules = [
  {
    icon: BookOpen,
    label: 'My Courses',
    path: '/courses',
    description: 'View and manage your courses'
  },
  {
    icon: Users,
    label: 'My Students',
    path: '/students',
    description: 'Manage and track students'
  },
  {
    icon: Award,
    label: 'Gradebook',
    path: '/gradebook',
    description: 'Manage grades and assignments'
  },
  {
    icon: ClipboardList,
    label: 'Assignments',
    path: '/faculty/assignments',
    description: 'Create and manage assignments'
  },
  {
    icon: Bell,
    label: 'Announcements',
    path: '/faculty/announcements',
    description: 'Manage course announcements'
  },
  {
    icon: BarChart3,
    label: 'Analytics & Reports',
    path: '/faculty/analytics',
    description: 'View analytics and generate comprehensive reports'
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/faculty/settings',
    description: 'Faculty preferences'
  },
  {
    icon: FolderOpen,
    label: 'Content',
    path: '/faculty/content',
    description: 'Manage course materials and resources'
  },
          {
            icon: Users,
            label: 'Administration',
            path: '/faculty/administration',
            description: 'Manage courses and students'
          },
          {
            icon: Clock,
            label: 'Schedule & Events',
            path: '/faculty/scheduling',
            description: 'Manage class schedules, office hours, and events'
          },
          {
            icon: MessageSquare,
            label: 'Communication',
            path: '/faculty/communication',
            description: 'Messages, broadcasts, and notifications'
          },
          {
            icon: FileBarChart,
            label: 'Advanced Reports',
            path: '/faculty/advanced-reports',
            description: 'PDF generation and custom report templates'
          },
];

export function FacultySidebar({ isOpen, onClose, isDesktop = false }: FacultySidebarProps) {
  if (isDesktop) {
    return (
      <div className="hidden lg:block w-80 bg-card border-r border-border h-full overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Faculty Modules</h2>
          </div>

          {/* Modules Grid */}
          <div className="space-y-3">
            {facultyModules.map((module) => (
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
                <h2 className="text-lg font-semibold">Faculty Modules</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Modules Grid */}
              <div className="space-y-3">
                {facultyModules.map((module) => (
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
