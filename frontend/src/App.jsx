import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Courses from './pages/Courses';

const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const LiveClass = lazy(() => import('./pages/LiveClass'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.default })));
const ResetPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ResetPassword })));
const LiveSessionEnroll = lazy(() => import('./pages/student/LiveSessionEnroll'));
const LoginModal = lazy(() => import('./pages/LoginModal'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Overview = lazy(() => import('./pages/admin/Overview'));
const ManageCourses = lazy(() => import('./pages/admin/ManageCourses'));
const ManageStudents = lazy(() => import('./pages/admin/ManageStudents'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Notices = lazy(() => import('./pages/admin/Notices'));
const Doubts = lazy(() => import('./pages/admin/Doubts'));
const Reviews = lazy(() => import('./pages/admin/Reviews'));
const ManageLiveSessions = lazy(() => import('./pages/admin/ManageLiveSessions'));
const ManageEnrollments = lazy(() => import('./pages/admin/ManageEnrollments'));
const ManageSubmissions = lazy(() => import('./pages/admin/ManageSubmissions'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MyCourses = lazy(() => import('./pages/student/MyCourses'));
const WatchVideo = lazy(() => import('./pages/student/WatchVideo'));
const Quiz = lazy(() => import('./pages/student/Quiz'));
const Assignments = lazy(() => import('./pages/student/Assignments'));
const WriteReview = lazy(() => import('./pages/student/WriteReview'));
const StudentDoubts = lazy(() => import('./pages/student/Doubts'));
const Notifications = lazy(() => import('./pages/student/Notifications'));
const Profile = lazy(() => import('./pages/student/Profile'));
const StudentNotices = lazy(() => import('./pages/student/Notices'));
const Certificates = lazy(() => import('./pages/student/Certificates'));
const CertificateView = lazy(() => import('./pages/student/CertificateView'));
const TeachingBoard = lazy(() => import('./pages/student/TeachingBoard'));
const Referrals = lazy(() => import('./pages/student/Referrals'));
const CheckoutPage = lazy(() => import('./pages/student/CheckoutPage'));
const PaymentSuccess = lazy(() => import('./pages/student/PaymentSuccess'));
const PaymentHistory = lazy(() => import('./pages/student/PaymentHistory'));
const WhatsAppButton = lazy(() => import('./components/WhatsAppButton'));
const InstallPrompt = lazy(() => import('./components/InstallPrompt'));

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  return <Navigate to="/dashboard/student" replace />;
};

const AppContent = () => {
  const [loginModal, setLoginModal] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isCheckout = location.pathname.startsWith('/checkout');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'session') {
      toast.error('You were logged out because someone signed in from another device.', { duration: 5000 });
    } else if (auth === 'expired') {
      toast.error('Your session expired. Please log in again.', { duration: 5000 });
    }
    if (auth) {
      const next = searchParams;
      next.delete('auth');
      setSearchParams(next, { replace: true });
    }
  }, []);

  return (
    <>
      {!isDashboard && !isCheckout && <Navbar onLoginClick={() => setLoginModal(true)} />}
        <main className={isDashboard || isCheckout ? '' : 'min-h-screen'}>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path="/" element={<Home onLoginClick={() => setLoginModal(true)} />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/live-class" element={<LiveClass />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/live-class/enroll/:sessionId" element={
            <ProtectedRoute role="student">
              <LiveSessionEnroll />
            </ProtectedRoute>
          } />
          <Route path="/course/:id" element={<CourseDetail onLoginClick={() => setLoginModal(true)} />} />
          <Route path="/checkout/:courseId" element={
            <ProtectedRoute role="student">
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<MyCourses />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="course/:courseId/lesson/:lessonId" element={<WatchVideo />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="quiz/:lessonId" element={<Quiz />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="doubts" element={<StudentDoubts />} />
            <Route path="notices" element={<StudentNotices />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="certificate/:id" element={<CertificateView />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="payment-history" element={<PaymentHistory />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="write-review" element={<WriteReview />} />
            <Route path="teaching-board" element={<TeachingBoard />} />
            <Route path="referrals" element={<Referrals />} />
          </Route>
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="payments" element={<Payments />} />
            <Route path="notices" element={<Notices />} />
            <Route path="doubts" element={<Doubts />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="live-sessions" element={<ManageLiveSessions />} />
            <Route path="enrollments" element={<ManageEnrollments />} />
            <Route path="submissions" element={<ManageSubmissions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Routes>
        </Suspense>
      </main>
      {!isDashboard && !isCheckout && <Footer />}
      {!isDashboard && <WhatsAppButton />}
      <InstallPrompt />
      {loginModal && (
        <Suspense fallback={null}>
          <LoginModal onClose={() => setLoginModal(false)} />
        </Suspense>
      )}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
