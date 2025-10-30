import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FacultySidebar } from './FacultySidebar';
import { StudentSidebar } from './StudentSidebar';

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
        {isStudentSection && <StudentSidebar isOpen={true} onClose={() => {}} isDesktop={true} />}
        <main className={`flex-1 ${isAdminSection || isFacultySection || isStudentSection ? 'lg:ml-0' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}