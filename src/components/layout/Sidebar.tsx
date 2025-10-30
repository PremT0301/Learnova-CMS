import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  Building2, FileBarChart, History, ShieldCheck, Mail, Activity, 
  LifeBuoy, Database, UserCheck, BookOpen, Settings, ClipboardList, 
  Award, Eye, FolderOpen, Plug, TrendingUp, Code, Lock, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop?: boolean;
}

const adminModules = [
  {
    icon: Building2,
    label: 'Departments',
    path: '/admin/departments',
    description: 'Create and manage departments'
  },
  {
    icon: FileBarChart,
    label: 'Reports',
    path: '/admin/reports',
    description: 'Generate performance reports'
  },
  {
    icon: UserCheck,
    label: 'Faculty Verification',
    path: '/admin/faculty-verification',
    description: 'Approve or reject faculty signups'
  },
  {
    icon: History,
    label: 'Audit Logs',
    path: '/admin/logs',
    description: 'Review system changes'
  },
  {
    icon: ShieldCheck,
    label: 'Permissions',
    path: '/admin/permissions',
    description: 'Define roles and access rules'
  },
  {
    icon: Mail,
    label: 'Invites',
    path: '/admin/invites',
    description: 'Manage invitations'
  },
  {
    icon: Activity,
    label: 'Health',
    path: '/admin/health',
    description: 'Check service status'
  },
  {
    icon: LifeBuoy,
    label: 'Support',
    path: '/admin/support',
    description: 'Manage support tickets'
  },
  {
    icon: Database,
    label: 'Backup',
    path: '/admin/backup',
    description: 'Manage system backups'
  },
  {
    icon: UserCheck,
    label: 'User Impersonation',
    path: '/admin/impersonation',
    description: 'Impersonate users for debugging'
  },
  {
    icon: BookOpen,
    label: 'Course Management',
    path: '/admin/courses',
    description: 'Manage courses and programs'
  },
  {
    icon: ClipboardList,
    label: 'Assignment Management',
    path: '/admin/assignments',
    description: 'Manage assignments'
  },
  {
    icon: Award,
    label: 'Grade Management',
    path: '/admin/grades',
    description: 'Oversee and review grades'
  },
  {
    icon: Eye,
    label: 'User Activity Monitoring',
    path: '/admin/activity',
    description: 'Monitor user sessions'
  },
  {
    icon: FolderOpen,
    label: 'Content Management',
    path: '/admin/content',
    description: 'Manage files and resources'
  },
  {
    icon: Plug,
    label: 'Integration Management',
    path: '/admin/integrations',
    description: 'Configure external services'
  },
  {
    icon: TrendingUp,
    label: 'Advanced Analytics',
    path: '/admin/advanced-analytics',
    description: 'Custom reports and insights'
  },
  {
    icon: Code,
    label: 'API Management',
    path: '/admin/api-management',
    description: 'Manage API keys and endpoints'
  },
  {
    icon: Lock,
    label: 'Advanced Security',
    path: '/admin/advanced-security',
    description: 'Security policies and monitoring'
  }
];

export function Sidebar({ isOpen, onClose, isDesktop = false }: SidebarProps) {
  if (isDesktop) {
    return (
      <div className="hidden lg:block w-80 bg-card border-r border-border h-full overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Admin Modules</h2>
          </div>

          {/* Modules Grid */}
          <div className="space-y-3">
            {adminModules.map((module) => (
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
                <h2 className="text-lg font-semibold">Admin Modules</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Modules Grid */}
              <div className="space-y-3">
                {adminModules.map((module) => (
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
