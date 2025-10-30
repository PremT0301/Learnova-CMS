import React, { useState } from 'react';
import { Bell, Search, LogOut, Menu, User, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import LearnovaLogo from '@/components/images/LEARNOVA-T.png';
import { Sidebar } from './Sidebar';
import { FacultySidebar } from './FacultySidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          {!isStudentSection ? (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <NavLink to="/student-dashboard" className="w-full cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Dashboard
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/courses" className="w-full cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Courses
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/grades" className="w-full cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Grades
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/student/assignments" className="w-full cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Assignments
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/student/submissions" className="w-full cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Submissions
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/student/announcements" className="w-full cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Announcements
                  </NavLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
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
                {/* Student Navigation - 6 Essential Items */}
                <NavLink
                  to="/student-dashboard"
                  className={({ isActive }) => `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[#37729C] text-white shadow-sm' : 'text-[#091F46] hover:text-white hover:bg-[#37729C]/90'}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/courses"
                  className={({ isActive }) => `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[#37729C] text-white shadow-sm' : 'text-[#091F46] hover:text-white hover:bg-[#37729C]/90'}`}
                >
                  Courses
                </NavLink>
                <NavLink
                  to="/grades"
                  className={({ isActive }) => `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[#37729C] text-white shadow-sm' : 'text-[#091F46] hover:text-white hover:bg-[#37729C]/90'}`}
                >
                  Grades
                </NavLink>
                <NavLink
                  to="/student/assignments"
                  className={({ isActive }) => `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[#37729C] text-white shadow-sm' : 'text-[#091F46] hover:text-white hover:bg-[#37729C]/90'}`}
                >
                  Assignments
                </NavLink>
                <NavLink
                  to="/student/submissions"
                  className={({ isActive }) => `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[#37729C] text-white shadow-sm' : 'text-[#091F46] hover:text-white hover:bg-[#37729C]/90'}`}
                >
                  Submissions
                </NavLink>
                <NavLink
                  to="/student/announcements"
                  className={({ isActive }) => `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[#37729C] text-white shadow-sm' : 'text-[#091F46] hover:text-white hover:bg-[#37729C]/90'}`}
                >
                  Announcements
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
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 hover:bg-[#E9E4DE] transition-colors"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[#091F46]">{user?.name}</p>
                  <p className="text-xs text-[#7699AE] capitalize">{user?.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#37729C]/10 flex items-center justify-center border-2 border-[#37729C]/20">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[#37729C] font-semibold text-sm">
                      {user?.name.charAt(0)}
                    </span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2 border-b border-border">
                <p className="text-sm font-medium text-[#091F46]">{user?.name}</p>
                <p className="text-xs text-[#7699AE]">{user?.email}</p>
              </div>
              <DropdownMenuItem
                onClick={() => navigate('/student/profile')}
                className="cursor-pointer py-2.5"
              >
                <UserCircle size={18} className="mr-2 text-[#37729C]" />
                <span className="text-[#091F46]">View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/student/profile/edit')}
                className="cursor-pointer py-2.5"
              >
                <User size={18} className="mr-2 text-[#37729C]" />
                <span className="text-[#091F46]">Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/student/settings')}
                className="cursor-pointer py-2.5"
              >
                <Settings size={18} className="mr-2 text-[#37729C]" />
                <span className="text-[#091F46]">Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut size={18} className="mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile Sidebars - Only for Admin and Faculty */}
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
      {/* Student section has no sidebar */}
    </header>
  );
}