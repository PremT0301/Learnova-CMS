import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FacultySidebar } from './FacultySidebar';

export function Layout() {
  const location = useLocation();
  const { user } = useAuth();
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {isAdminSection && <Sidebar isOpen={true} onClose={() => {}} isDesktop={true} />}
        {isFacultySection && <FacultySidebar isOpen={true} onClose={() => {}} isDesktop={true} />}
        {/* Student section has no sidebar - full width layout */}
        <main className={`flex-1 ${isAdminSection || isFacultySection ? 'lg:ml-0' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}