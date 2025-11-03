import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI, reviewAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCourse();
    loadReviews();
    // Refresh user data to get latest enrollment status
    if (isAuthenticated) {
      refreshUser();
    }
  }, [id, isAuthenticated]);

  const loadCourse = async () => {
    try {
      const { data } = await courseAPI.getById(id);
      setCourse(data.course);
    } catch (error) {
      setError('Failed to load course');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const { data } = await reviewAPI.getByCourse(id);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      setError('');

      if (course.price === 0) {
        // Free course - direct enrollment
        await paymentAPI.enrollFree(id);
        await refreshUser(); // Refresh user data
        navigate(`/courses/${id}/learn`);
      } else {
        // Paid course - redirect to payment page
        navigate(`/courses/${id}/payment`);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleMockPurchase = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      setError('');
      
      // Use mock purchase for testing
      const { data } = await paymentAPI.mockPurchase(id);
      await refreshUser(); // Refresh user data
      navigate(`/courses/${id}/learn`);
    } catch (error) {
      setError(error.response?.data?.message || 'Mock purchase failed');
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = user?.enrolledCourses?.includes(id);
  const isInstructor = user?._id === course?.instructor?._id;

  if (loading) return <Loading fullScreen />;
  if (!course) return <div className="container mx-auto px-4 py-8">Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Hero Section */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link to="/courses" className="text-blue-400 hover:text-blue-300 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Courses
            </Link>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">{course.title}</h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">{course.description}</p>
              
              {/* Course Stats */}
              <div className="flex flex-wrap gap-6 items-center mb-8">
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 font-semibold text-lg">{course.averageRating?.toFixed(1) || '4.5'}</span>
                  <span className="ml-2 text-gray-400">({course.reviewCount || 150} ratings)</span>
                </div>
                <div className="text-gray-400">
                  {course.enrollmentCount || 2547} students
                </div>
                <div className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">
                  {course.level || 'All Levels'}
                </div>
              </div>

              {/* Instructor Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                <img
                  src={course.instructor?.avatar || `https://ui-avatars.com/api/?name=${course.instructor?.name}&background=3b82f6&color=ffffff`}
                  alt={course.instructor?.name}
                  className="w-16 h-16 rounded-full border-2 border-blue-500"
                />
                <div>
                  <p className="text-sm text-gray-400 mb-1">Instructor</p>
                  <p className="text-xl font-semibold">{course.instructor?.name}</p>
                  <p className="text-gray-400 text-sm">{course.instructor?.title || 'Expert Instructor'}</p>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-xl p-6 text-gray-900 sticky top-4">
                <img
                  src={course.thumbnail || 'https://via.placeholder.com/400x225'}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {course.price === 0 ? 'Free' : `₹${course.price}`}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                {isEnrolled ? (
                  <Link
                    to={`/courses/${id}/learn`}
                    className="block w-full bg-purple-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-purple-700 mb-3"
                  >
                    Go to Course
                  </Link>
                ) : isInstructor ? (
                  <Link
                    to={`/instructor/course/${id}/edit`}
                    className="block w-full bg-gray-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-700 mb-3"
                  >
                    Edit Course
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
                    >
                      {enrolling ? 'Processing...' : course.price === 0 ? 'Enroll for Free' : 'Buy Now'}
                    </button>
                    
                    {/* Mock Purchase Button for Testing */}
                    {course.price > 0 && (
                      <button
                        onClick={handleMockPurchase}
                        disabled={enrolling}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {enrolling ? 'Processing...' : '🧪 Mock Purchase (Testing)'}
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{course.totalDuration || 0} minutes of content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{course.lectures?.length || 0} lectures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Lifetime access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 max-w-6xl py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'curriculum'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Curriculum
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.whatYouWillLearn?.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {course.requirements?.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {course.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h2 className="text-2xl font-bold mb-4">About this course</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                </div>
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Course Content</h2>
                <div className="space-y-3">
                  {course.lectures && course.lectures.length > 0 ? (
                    course.lectures.map((lecture, index) => (
                      <div key={lecture._id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => {
                            if (isEnrolled || lecture.isFree) {
                              navigate(`/courses/${id}/learn`);
                            } else if (!isAuthenticated) {
                              navigate('/login');
                            } else {
                              if (course.price > 0) {
                                navigate(`/courses/${id}/payment`);
                              } else {
                                handleEnroll();
                              }
                            }
                          }}
                          disabled={(!isEnrolled && !lecture.isFree)}
                          className={`w-full p-4 text-left transition-colors rounded-lg group ${
                            (isEnrolled || lecture.isFree) 
                              ? 'hover:bg-gray-50 cursor-pointer' 
                              : 'cursor-not-allowed bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  {(isEnrolled || lecture.isFree) ? (
                                    <svg className="w-5 h-5 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m2-7.5V18a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h5.5l4.5 4.5z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  )}
                                  <span className="font-semibold">Lecture {index + 1}:</span>
                                  <span className={`${(isEnrolled || lecture.isFree) ? 'group-hover:text-purple-700' : 'text-gray-500'}`}>
                                    {lecture.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lecture.isFree && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Preview</span>
                                  )}
                                  {(isEnrolled || lecture.isFree) && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">▶ Watch</span>
                                  )}
                                  {(!isEnrolled && !lecture.isFree) && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded flex items-center gap-1">
                                      🔒 Purchase Course to Access
                                    </span>
                                  )}
                                </div>
                              </div>
                              {lecture.description && (
                                <p className="text-sm text-gray-600 mt-2">{lecture.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{lecture.duration} min</span>
                              {(isEnrolled || lecture.isFree) ? (
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              ) : (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  Click to Purchase
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No lectures added yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Student Reviews</h2>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 pb-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={review.user?.avatar || 'https://ui-avatars.com/api/?name=' + review.user?.name}
                            alt={review.user?.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{review.user?.name}</span>
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
