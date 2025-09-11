import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./admin/AdminDashboard";
import AdminAnalytics from "./admin/Analytics";
import UsersManagement from "./admin/UsersManagement";
import UserForm from "./admin/UserForm";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import MyGrades from "./pages/MyGrades";
import MyStudents from "./pages/MyStudents";
import Gradebook from "./pages/Gradebook";
import { useAuth } from "@/contexts/AuthContext";
import Departments from "./admin/Departments";
import Settings from "./admin/Settings";
import Logs from "./admin/Logs";
import Announcements from "./admin/Announcements";
import Backup from "./admin/Backup";
import Reports from "./admin/Reports";
import Permissions from "./admin/Permissions";
import Invites from "./admin/Invites";
import Health from "./admin/Health";
import Support from "./admin/Support";

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty-dashboard" replace />;
  return <Navigate to="/student-dashboard" replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses" element={<ProtectedRoute allowedRoles={['student','faculty']}><Courses /></ProtectedRoute>} />
              <Route path="assignments" element={<div className="p-6"><h1 className="text-2xl font-bold">Assignments</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
              <Route path="notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">Notifications</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
              <Route path="messages" element={<div className="p-6"><h1 className="text-2xl font-bold">Messages</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
              
              {/* Student Routes */}
              <Route path="student-dashboard" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="grades" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyGrades />
                </ProtectedRoute>
              } />
              
              {/* Faculty Routes */}
              <Route path="faculty-dashboard" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              } />
              <Route path="students" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <MyStudents />
                </ProtectedRoute>
              } />
              <Route path="gradebook" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Gradebook />
                </ProtectedRoute>
              } />
              
              {/* Admin Only Routes */}
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              } />
              <Route path="admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/users/create" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserForm />
                </ProtectedRoute>
              } />
              <Route path="admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } />
              <Route path="admin/departments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Departments />
                </ProtectedRoute>
              } />
              <Route path="admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="admin/logs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Logs />
                </ProtectedRoute>
              } />
              <Route path="admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="admin/announcements" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Announcements />
                </ProtectedRoute>
              } />
              <Route path="admin/backups" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Backup />
                </ProtectedRoute>
              } />
              <Route path="admin/permissions" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Permissions />
                </ProtectedRoute>
              } />
              <Route path="admin/invites" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Invites />
                </ProtectedRoute>
              } />
              <Route path="admin/health" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Health />
                </ProtectedRoute>
              } />
              <Route path="admin/support" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Support />
                </ProtectedRoute>
              } />
              <Route path="admin/impersonation" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">User Impersonation</h1><p className="text-muted-foreground">Coming soon...</p></div>
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
