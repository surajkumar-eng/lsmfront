import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Course APIs
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  publish: (id, data) => api.patch(`/courses/${id}/publish`, data),
  addLecture: (id, data) => api.post(`/courses/${id}/lectures`, data),
  updateLecture: (courseId, lectureId, data) => api.put(`/courses/${courseId}/lectures/${lectureId}`, data),
  deleteLecture: (courseId, lectureId) => api.delete(`/courses/${courseId}/lectures/${lectureId}`),
  getInstructorCourses: () => api.get('/courses/instructor/my-courses'),
  getEnrolledCourses: () => api.get('/courses/student/my-courses'),
  getCourseContent: (id) => api.get(`/courses/${id}/content`),
  getAnalytics: (id) => api.get(`/courses/${id}/analytics`),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  getProgress: (id) => api.get(`/courses/${id}/progress`),
  markLectureComplete: (courseId, lectureId) => api.post(`/courses/${courseId}/lectures/${lectureId}/complete`),
  updateProgress: (courseId, lectureId, data) => api.post(`/courses/${courseId}/lectures/${lectureId}/progress`, data),
  addToWishlist: (id) => api.post(`/courses/${id}/wishlist`),
  removeFromWishlist: (id) => api.delete(`/courses/${id}/wishlist`),
};

// Review APIs
export const reviewAPI = {
  getByCourse: (courseId, params) => api.get(`/reviews/course/${courseId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

// Payment APIs
export const paymentAPI = {
  createIntent: (courseId) => api.post('/payments/create-intent', { courseId }),
  confirm: (paymentId, paymentIntentId) => api.post('/payments/confirm', { paymentId, paymentIntentId }),
  enrollFree: (courseId) => api.post('/payments/enroll-free', { courseId }),
  mockPurchase: (courseId) => api.post('/payments/mock-purchase', { courseId }),
  getMyPayments: () => api.get('/payments/my-payments'),
  getById: (id) => api.get(`/payments/${id}`),
};

// Upload APIs
export const uploadAPI = {
  uploadImage: (formData) => {
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadVideo: (formData, onUploadProgress) => {
    return api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  deleteFile: (publicId) => api.delete(`/upload/${publicId}`),
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getCourses: (params) => api.get('/admin/courses', { params }),
  approveCourse: (id, isApproved) => api.patch(`/admin/courses/${id}/approve`, { isApproved }),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getReviews: (params) => api.get('/admin/reviews', { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

export default api;
