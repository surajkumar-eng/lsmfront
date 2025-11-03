import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function CourseLearning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [completedLectures, setCompletedLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoProgress, setVideoProgress] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCourse();
  }, [id]);

  useEffect(() => {
    console.log('🔄 Course or currentLectureIndex changed');
    console.log('Course:', course?.title);
    console.log('Current index:', currentLectureIndex);
    console.log('Lectures available:', course?.lectures?.length || 0);
    
    if (course && course.lectures && course.lectures.length > 0) {
      const lecture = course.lectures[currentLectureIndex];
      console.log('🎯 Setting current lecture:', lecture?.title);
      console.log('🎬 Video URL:', lecture?.videoUrl);
      
      // Reset progress when switching lectures
      setVideoProgress(0);
      
      setCurrentLecture(lecture);
      loadComments(lecture._id);
    }
  }, [currentLectureIndex, course]);

  const loadCourse = async () => {
    try {
      console.log('🔍 Loading course content for ID:', id);
      // First check if user has access
      const { data } = await courseAPI.getCourseContent(id);
      const courseData = data.course;
      
      console.log('📚 Course loaded:', courseData.title);
      console.log('🎬 Lectures count:', courseData.lectures?.length || 0);
      
      setCourse(courseData);
      
      // Set first lecture as current if none selected
      if (courseData.lectures && courseData.lectures.length > 0 && currentLectureIndex === 0) {
        console.log('🎯 Setting first lecture as current');
        setCurrentLecture(courseData.lectures[0]);
      }
      
      loadProgress();
    } catch (error) {
      console.error('❌ Course loading error:', error);
      if (error.response?.status === 403) {
        setError('Please purchase this course to access video content');
        setTimeout(() => {
          navigate(`/courses/${id}`);
        }, 2000);
      } else {
        setError('Failed to load course');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const { data } = await courseAPI.getProgress(id);
      setCompletedLectures(data.progress?.completedLectures || []);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadComments = async (lectureId) => {
    // Mock comments for now - you can implement real API later
    setComments([
      {
        id: 1,
        user: { name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe' },
        comment: 'Great explanation! Very helpful.',
        timestamp: '2 hours ago'
      },
      {
        id: 2,
        user: { name: 'Jane Smith', avatar: 'https://ui-avatars.com/api/?name=Jane+Smith' },
        comment: 'Can you explain the concept at 5:30 again?',
        timestamp: '1 day ago'
      }
    ]);
  };

  const handleVideoProgress = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        console.log(`📹 Video progress: ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s = ${progress.toFixed(1)}%`);
        setVideoProgress(progress);
        
        // Auto-mark complete when 90% watched
        if (progress >= 90 && !completedLectures.includes(currentLecture?._id)) {
          console.log('🎉 Lecture 90% complete, marking as complete');
          handleLectureComplete();
        }
      }
    }
  };

  const handleLectureComplete = async () => {
    if (!currentLecture || completedLectures.includes(currentLecture._id)) return;

    try {
      await courseAPI.markLectureComplete(id, currentLecture._id);
      setCompletedLectures([...completedLectures, currentLecture._id]);
    } catch (error) {
      console.error('Failed to mark lecture complete:', error);
    }
  };

  const handlePreviousLecture = () => {
    if (currentLectureIndex > 0) {
      setCurrentLectureIndex(currentLectureIndex - 1);
    }
  };

  const handleNextLecture = () => {
    if (currentLectureIndex < course.lectures.length - 1) {
      setCurrentLectureIndex(currentLectureIndex + 1);
    }
  };

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        user: { name: user?.name, avatar: user?.avatar },
        comment: newComment,
        timestamp: 'Just now'
      };
      setComments([comment, ...comments]);
      setNewComment('');
    }
  };

  const calculateProgress = () => {
    if (!course?.lectures?.length) return 0;
    return Math.round((completedLectures.length / course.lectures.length) * 100);
  };

  if (loading) return <Loading fullScreen />;
  if (error) return <div className="container mx-auto px-4 py-8 text-red-600">{error}</div>;
  if (!course) return <div className="container mx-auto px-4 py-8">Course not found</div>;

  const currentIndex = course.lectures?.findIndex(l => l._id === currentLecture?._id) ?? -1;
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-purple-600 hover:text-purple-700"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">by {course.instructor?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Your Progress</div>
              <div className="text-lg font-semibold text-purple-600">{progress}% Complete</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Video Player */}
              <div className="bg-black aspect-video relative">
                {currentLecture ? (
                  <>
                    {/* Debug Info */}
                    <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                      <div>Lecture: {currentLecture.title}</div>
                      <div>Video URL: {currentLecture.videoUrl ? '✅ Available' : '❌ Missing'}</div>
                      <div>URL: {currentLecture.videoUrl?.substring(0, 50)}...</div>
                    </div>
                    
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      controls
                      onTimeUpdate={handleVideoProgress}
                      onLoadStart={() => console.log('📹 Video loading started')}
                      onLoadedData={() => console.log('📹 Video data loaded')}
                      onLoadedMetadata={() => {
                        console.log('📹 Video metadata loaded');
                        if (videoRef.current) {
                          console.log(`📹 Duration: ${videoRef.current.duration}s`);
                        }
                      }}
                      onCanPlay={() => console.log('📹 Video can start playing')}
                      onPlay={() => console.log('📹 Video started playing')}
                      onPause={() => console.log('📹 Video paused')}
                      onError={(e) => {
                        console.error('📹 Video error:', e);
                        console.error('Error details:', e.target.error);
                      }}
                      poster={course.thumbnail}
                      src={currentLecture.videoUrl}
                      key={currentLecture._id} // Force reload when lecture changes
                    >
                      Your browser does not support the video tag.
                    </video>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg mb-2">Select a Lecture</p>
                      <p className="text-sm opacity-75">Choose a lecture from the curriculum to start learning</p>
                      <p className="text-xs mt-2 opacity-50">Debug: {course?.lectures?.length || 0} lectures available</p>
                      {course?.lectures?.length > 0 && (
                        <button
                          onClick={() => setCurrentLectureIndex(0)}
                          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Start First Lecture
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Video Type Indicator */}
                {currentLecture?.videoUrl && (
                  <div className="absolute top-4 left-4">
                    {currentLecture.videoUrl.includes('cloudinary.com') ? (
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                        ✅ Instructor Video
                      </span>
                    ) : currentLecture.videoUrl.includes('commondatastorage') ? (
                      <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                        🧪 Demo Video
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        📹 Video
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentLecture?.title || 'Select a lecture to start learning'}
                  </h2>
                  {completedLectures.includes(currentLecture?._id) && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Completed
                    </span>
                  )}
                </div>
                
                {currentLecture?.description && (
                  <p className="text-gray-600 mb-6">{currentLecture.description}</p>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousLecture}
                    disabled={currentLectureIndex === 0}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous Lecture
                  </button>

                  <button
                    onClick={handleLectureComplete}
                    disabled={completedLectures.includes(currentLecture?._id)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completedLectures.includes(currentLecture?._id) ? 'Completed' : 'Mark as Complete'}
                  </button>

                  <button
                    onClick={handleNextLecture}
                    disabled={currentLectureIndex === course.lectures?.length - 1}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Lecture
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs for Overview and Comments */}
            <div className="bg-white rounded-lg shadow-lg mt-6">
              <div className="border-b">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'comments'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Comments ({comments.length})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About this lecture</h3>
                    <p className="text-gray-600 mb-4">
                      {currentLecture?.description || 'No description available for this lecture.'}
                    </p>
                    {currentLecture?.resources && currentLecture.resources.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Resources</h4>
                        <ul className="space-y-2">
                          {currentLecture.resources.map((resource, index) => (
                            <li key={index}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {resource.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div>
                    {/* Add Comment */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Add a comment</h3>
                      <div className="flex gap-4">
                        <img
                          src={user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User')}
                          alt="Your avatar"
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Ask a question or share your thoughts..."
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            rows={3}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={addComment}
                              disabled={!newComment.trim()}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Post Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                          <img
                            src={comment.user.avatar}
                            alt={comment.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{comment.user.name}</h4>
                                <span className="text-sm text-gray-500">{comment.timestamp}</span>
                              </div>
                              <p className="text-gray-700">{comment.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Course Content</h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{completedLectures.length} of {course.lectures?.length || 0} lectures</span>
                  <span>{progress}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Lectures List */}
              <div className="space-y-2">
                {course.lectures?.map((lecture, index) => (
                  <button
                    key={lecture._id}
                    onClick={() => setCurrentLectureIndex(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentLectureIndex === index
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          completedLectures.includes(lecture._id)
                            ? 'bg-green-500 text-white'
                            : currentLectureIndex === index
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {completedLectures.includes(lecture._id) ? '✓' : index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{lecture.title}</div>
                          <div className="text-xs text-gray-500">
                            {lecture.duration ? `${Math.floor(lecture.duration / 60)}:${(lecture.duration % 60).toString().padStart(2, '0')}` : '16:00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
