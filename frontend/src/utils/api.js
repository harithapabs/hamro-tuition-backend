import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
});

function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)ht_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

API.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const t = getCsrfToken();
    if (t) config.headers['X-CSRF-Token'] = t;
  }
  return config;
});

API.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        await API.post('/auth/refresh');
        return API(original);
      } catch (refreshErr) {
        const path = window.location.pathname;
        if (path.startsWith('/dashboard') || path === '/profile') {
          const reason = refreshErr.response?.data?.message?.includes('Session') ? 'session' : 'expired';
          window.location.href = `/?auth=${reason}`;
        }
        return Promise.reject(refreshErr);
      }
    }
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/dashboard') || path === '/profile') {
        const msg = err.response?.data?.message || '';
        const reason = msg.includes('Session') ? 'session' : 'expired';
        window.location.href = `/?auth=${reason}`;
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  getCaptcha: () => API.get('/auth/captcha'),
  verifyEmail: (token) => API.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  enable2FA: () => API.post('/auth/2fa/enable'),
  disable2FA: () => API.post('/auth/2fa/disable'),
  refresh: () => API.post('/auth/refresh'),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

export const courseAPI = {
  getAll: (params) => API.get('/courses', { params }),
  getOne: (id) => API.get(`/courses/${id}`),
  addReview: (id, data) => API.post(`/courses/${id}/review`, data),
  getReviews: (id) => API.get(`/courses/${id}/reviews`),
  getApprovedReviews: () => API.get('/courses/reviews/approved'),
};

export const paymentAPI = {
  initiate: (data) => API.post('/payments/initiate', data),
  verify: (data) => API.post('/payments/verify', data),
  submitManual: (data) => API.post('/payments/manual', data),
  getMyPayments: () => API.get('/payments/my-payments'),
  getPaymentSettings: () => API.get('/payment-settings/public'),
};

export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  createCourse: (data) => API.post('/admin/courses', data),
  updateCourse: (id, data) => API.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => API.delete(`/admin/courses/${id}`),
  addLesson: (courseId, data) => API.post(`/admin/courses/${courseId}/lessons`, data),
  wizardCreateCourse: (data) => API.post('/admin/courses', data),
  wizardUpdateCourse: (id, data) => API.put(`/admin/courses/${id}/wizard`, data),
  getStudents: (params) => API.get('/admin/students', { params }),
  blockStudent: (id, data) => API.patch(`/admin/students/${id}/block`, data),
  getPayments: (params) => API.get('/admin/payments', { params }),
  getPaymentRequests: () => API.get('/admin/payment-requests'),
  approvePayment: (id) => API.patch(`/admin/payments/${id}/approve`),
  rejectPayment: (id, data) => API.patch(`/admin/payments/${id}/reject`, data),
  approveReview: (id) => API.patch(`/admin/reviews/${id}/approve`),
  deleteReview: (id) => API.delete(`/admin/reviews/${id}`),
  getPaymentSettings: () => API.get('/payment-settings'),
  savePaymentSettings: (data) => API.put('/payment-settings', data),
  getReports: () => API.get('/admin/reports'),
  getAuditLogs: (params) => API.get('/admin/audit-logs', { params }),
};

export const studentAPI = {
  getMyCourses: () => API.get('/student/my-courses'),
  getQuiz: (lessonId) => API.get(`/student/quiz/${lessonId}`),
  submitQuiz: (data) => API.post('/student/quiz/submit', data),
  askDoubt: (formData) => API.post('/student/doubt', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDoubts: () => API.get('/student/doubts'),
  uploadAssignment: (formData) => API.post('/student/assignment/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadProfilePhoto: (formData) => API.post('/student/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createReview: (data) => API.post('/student/review', data),
  updateProfile: (data) => API.put('/student/profile', data),
  changePassword: (data) => API.put('/student/password', data),
  markLessonComplete: (lessonId, courseId) => API.post(`/student/lesson/${lessonId}/complete`, { courseId }),
  getCourseProgress: (courseId) => API.get(`/student/course/${courseId}/progress`),
  getMyProgress: () => API.get('/student/my-progress'),
  getReferralInfo: () => API.get('/student/referral/info'),
  validateReferralCode: (code) => API.get(`/student/referral/validate/${encodeURIComponent(code)}`),
};

export const noticeAPI = {
  getAll: () => API.get('/notices'),
  create: (data) => API.post('/notices', data),
  delete: (id) => API.delete(`/notices/${id}`),
};

export const doubtAPI = {
  getAll: () => API.get('/doubts'),
  answer: (id, data) => API.put(`/doubts/${id}/answer`, data),
};

export const certificateAPI = {
  getAll: () => API.get('/certificates'),
  generate: (courseId) => API.post('/certificates/generate', { courseId }),
};

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};

export const liveSessionAPI = {
  getAll: () => API.get('/live-sessions'),
  getUpcoming: () => API.get('/live-sessions?upcoming=true'),
  create: (data) => API.post('/live-sessions', data),
  update: (id, data) => API.put(`/live-sessions/${id}`, data),
  delete: (id) => API.delete(`/live-sessions/${id}`),
  enroll: (data) => API.post('/live-sessions/enroll', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  myEnrollments: () => API.get('/live-sessions/my-enrollments'),
  allEnrollments: () => API.get('/live-sessions/enrollments'),
  approveEnrollment: (id) => API.patch(`/live-sessions/enrollment/${id}/approve`),
  rejectEnrollment: (id) => API.patch(`/live-sessions/enrollment/${id}/reject`),
  getAssignments: (id) => API.get(`/live-sessions/${id}/assignments`),
  addAssignment: (id, data) => API.post(`/live-sessions/${id}/assignments`, data),
  deleteAssignment: (assignId) => API.delete(`/live-sessions/assignments/${assignId}`),
  submitSolution: (assignId, formData) => API.post(`/live-sessions/assignments/${assignId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  allSubmissions: () => API.get('/live-sessions/submissions'),
};

export default API;
