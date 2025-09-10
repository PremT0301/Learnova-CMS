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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
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
              
              {/* Faculty Routes */}
              <Route path="students" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">My Students</h1><p className="text-muted-foreground">Coming soon...</p></div>
                </ProtectedRoute>
              } />
              <Route path="gradebook" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">Gradebook</h1><p className="text-muted-foreground">Coming soon...</p></div>
                </ProtectedRoute>
              } />
              
              {/* Student Routes */}
              <Route path="grades" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="p-6"><h1 className="text-2xl font-bold">My Grades</h1><p className="text-muted-foreground">Coming soon...</p></div>
                </ProtectedRoute>
              } />
              
              {/* Common Routes */}
              <Route path="profile" element={<div className="p-6"><h1 className="text-2xl font-bold">Profile</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
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
