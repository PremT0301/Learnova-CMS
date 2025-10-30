import React, { useState } from 'react';
import { Bell, Search, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavLink, useLocation } from 'react-router-dom';
import LearnovaLogo from '@/components/images/LEARNOVA-T.png';
import { Sidebar } from './Sidebar';
import { FacultySidebar } from './FacultySidebar';
import { StudentSidebar } from './StudentSidebar';

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isAdminSection = location.pathname.startsWith('/admin');
  const isFacultySection = location.pathname.startsWith('/faculty') || 
                          location.pathname === '/faculty-dashboard' ||
                          location.pathname === '/students' ||
                          location.pathname === '/gradebook' ||
                          (location.pathname === '/courses' && user?.role === 'faculty') ||
                          location.pathname === '/support' ||
                          (location.pathname === '/dashboard' && user?.role === 'faculty');
  const isStudentSection = location.pathname.startsWith('/student') ||
                          location.pathname === '/student-dashboard' ||
                          (location.pathname === '/courses' && user?.role === 'student') ||
                          location.pathname === '/grades' ||
                          (location.pathname === '/dashboard' && user?.role === 'student');

  return (
    <header className="bg-card border-b border-border px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <NavLink to={
            isAdminSection ? '/admin/dashboard' : 
            isFacultySection ? '/faculty-dashboard' : 
            isStudentSection ? '/student-dashboard' : 
            '/dashboard'
          } className="flex items-center gap-2 shrink-0">
            <img
              src={LearnovaLogo}
              alt="Learnova logo"
              className="h-8 w-auto object-contain sm:h-9"
            />
            <div className="text-lg font-semibold whitespace-nowrap">Learnova</div>
          </NavLink>
          <nav className="hidden md:flex items-center gap-2">
            {isAdminSection ? (
              <>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Users
                </NavLink>
                <NavLink
                  to="/admin/configuration"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Settings
                </NavLink>
                <NavLink
                  to="/admin/announcements"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Announcements
                </NavLink>
              </>
            ) : isFacultySection ? (
              <>
                <NavLink
                  to="/faculty-dashboard"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/courses"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  My Courses
                </NavLink>
                <NavLink
                  to="/students"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  My Students
                </NavLink>
                <NavLink
                  to="/gradebook"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Gradebook
                </NavLink>
              </>
            ) : isStudentSection ? (
              <>
                <NavLink
                  to="/student-dashboard"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/courses"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  My Courses
                </NavLink>
                <NavLink
                  to="/student/assignments"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Assignments
                </NavLink>
                <NavLink
                  to="/grades"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  My Grades
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/courses"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Courses
                </NavLink>
                {user?.role === 'faculty' && (
                  <>
                    <NavLink
                      to="/students"
                      className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                      My Students
                    </NavLink>
                    <NavLink
                      to="/gradebook"
                      className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                      Gradebook
                    </NavLink>
                  </>
                )}
                <NavLink
                  to="/support"
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  Support
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  >
                    Admin
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses, assignments..."
                className="pl-10 bg-muted/50 border-muted"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary font-semibold text-sm">
                  {user?.name.charAt(0)}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebars */}
      {isAdminSection && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isDesktop={false} 
        />
      )}
      {isFacultySection && (
        <FacultySidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isDesktop={false} 
        />
      )}
      {isStudentSection && (
        <StudentSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isDesktop={false} 
        />
      )}
    </header>
  );
}