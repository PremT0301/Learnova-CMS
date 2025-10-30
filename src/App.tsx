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
import CourseDetails from "./pages/CourseDetails";
import CoursePage from "./pages/CoursePage";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import AdminDashboard from "./admin/AdminDashboard";
import UsersManagement from "./admin/UsersManagement";
import UserForm from "./admin/UserForm";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import MyGrades from "./pages/MyGrades";
import MyStudents from "./pages/MyStudents";
import Gradebook from "./pages/Gradebook";
import Support from "./pages/Support";
import FacultyAssignments from "./pages/faculty/FacultyAssignments";
import FacultyAnnouncements from "./pages/faculty/FacultyAnnouncements";
import FacultyAnalytics from "./pages/faculty/FacultyAnalytics";
import FacultySettings from "./pages/faculty/FacultySettings";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentSettings from "./pages/student/StudentSettings";
import StudentSchedule from "./pages/student/StudentSchedule";
import FacultyContentManagement from "./components/faculty/ContentManagement";
import AdministrativeFunctions from "./components/faculty/AdministrativeFunctions";
import FacultyScheduling from "./components/faculty/FacultyScheduling";
import CommunicationSystem from "./components/faculty/CommunicationSystem";
import AdvancedReporting from "./components/faculty/AdvancedReporting";
import { useAuth } from "@/contexts/AuthContext";
import Departments from "./admin/Departments";
import Logs from "./admin/Logs";
import Announcements from "./admin/Announcements";
import Reports from "./admin/Reports";
import Permissions from "./admin/Permissions";
import Invites from "./admin/Invites";
import Health from "./admin/Health";
import AdminSupport from "./admin/Support";
import Backup from "./admin/Backup";
import UserImpersonation from "./admin/UserImpersonation";
import CourseManagement from "./admin/CourseManagement";
import SystemConfiguration from "./admin/SystemConfiguration";
import AssignmentManagement from "./admin/AssignmentManagement";
import GradeManagement from "./admin/GradeManagement";
import UserActivityMonitoring from "./admin/UserActivityMonitoring";
import ContentManagement from "./admin/ContentManagement";
import IntegrationManagement from "./admin/IntegrationManagement";
import AdvancedAnalytics from "./admin/AdvancedAnalytics";
import APIManagement from "./admin/APIManagement";
import AdvancedSecurity from "./admin/AdvancedSecurity";
import FacultyAccountVerification from "./admin/FacultyAccountVerification";
import DatabaseSetup from "./admin/DatabaseSetup";
import RequestUnderReview from "./pages/RequestUnderReview";
import RequestDenied from "./pages/RequestDenied";

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
            <Route path="/signup" element={<Signup />} />
            <Route path="/request-under-review" element={<RequestUnderReview />} />
            <Route path="/request-denied" element={<RequestDenied />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses" element={<ProtectedRoute allowedRoles={['student','faculty']}><Courses /></ProtectedRoute>} />
              <Route path="courses/:courseId" element={<ProtectedRoute allowedRoles={['student','faculty','admin']}><CourseDetails /></ProtectedRoute>} />
              <Route path="course/:courseId" element={<ProtectedRoute allowedRoles={['student','faculty','admin']}><CoursePage /></ProtectedRoute>} />
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
              
              {/* Student-specific Routes */}
              <Route path="student/assignments" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAssignments />
                </ProtectedRoute>
              } />
              <Route path="student/announcements" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAnnouncements />
                </ProtectedRoute>
              } />
              <Route path="student/settings" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSettings />
                </ProtectedRoute>
              } />
              <Route path="student/schedule" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSchedule />
                </ProtectedRoute>
              } />
              <Route path="student/submissions" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">Submissions</h1><p className="text-muted-foreground">Track your assignment submissions</p></div>
                </ProtectedRoute>
              } />
              <Route path="student/materials" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">Course Materials</h1><p className="text-muted-foreground">Access your course resources</p></div>
                </ProtectedRoute>
              } />
              <Route path="student/progress" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">Progress</h1><p className="text-muted-foreground">Track your learning progress</p></div>
                </ProtectedRoute>
              } />
              <Route path="student/messages" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">Messages</h1><p className="text-muted-foreground">Communicate with faculty and peers</p></div>
                </ProtectedRoute>
              } />
              <Route path="student/notifications" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">Notifications</h1><p className="text-muted-foreground">Manage your notification preferences</p></div>
                </ProtectedRoute>
              } />
              <Route path="student/analytics" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-muted-foreground">View detailed academic analytics</p></div>
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
              
              {/* Faculty-specific Routes */}
              <Route path="faculty/assignments" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyAssignments />
                </ProtectedRoute>
              } />
              <Route path="faculty/announcements" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyAnnouncements />
                </ProtectedRoute>
              } />
              <Route path="faculty/analytics" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyAnalytics />
                </ProtectedRoute>
              } />
              <Route path="faculty/settings" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultySettings />
                </ProtectedRoute>
              } />
              <Route path="faculty/content" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyContentManagement />
                </ProtectedRoute>
              } />
              <Route path="faculty/administration" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <AdministrativeFunctions />
                </ProtectedRoute>
              } />
              <Route path="faculty/scheduling" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyScheduling />
                </ProtectedRoute>
              } />
              <Route path="faculty/communication" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <CommunicationSystem />
                </ProtectedRoute>
              } />
              <Route path="faculty/advanced-reports" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <AdvancedReporting />
                </ProtectedRoute>
              } />
              
              {/* Support Routes - Available to all authenticated users */}
              <Route path="support" element={
                <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
                  <Support />
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
              <Route path="admin/departments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Departments />
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
              <Route path="admin/faculty-verification" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FacultyAccountVerification />
                </ProtectedRoute>
              } />
              <Route path="admin/announcements" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Announcements />
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
                  <AdminSupport />
                </ProtectedRoute>
              } />
              <Route path="admin/backup" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Backup />
                </ProtectedRoute>
              } />
              <Route path="admin/impersonation" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserImpersonation />
                </ProtectedRoute>
              } />
              <Route path="admin/courses" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CourseManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/configuration" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SystemConfiguration />
                </ProtectedRoute>
              } />
              <Route path="admin/assignments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AssignmentManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/grades" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GradeManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/activity" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserActivityMonitoring />
                </ProtectedRoute>
              } />
              <Route path="admin/content" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ContentManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/integrations" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <IntegrationManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/advanced-analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdvancedAnalytics />
                </ProtectedRoute>
              } />
              <Route path="admin/api-management" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <APIManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/advanced-security" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdvancedSecurity />
                </ProtectedRoute>
              } />
              <Route path="admin/database-setup" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DatabaseSetup />
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
