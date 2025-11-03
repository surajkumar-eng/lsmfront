import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI, uploadAPI } from '../../services/api';
import axios from 'axios';
import Loading from '../../components/Loading';

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Lecture form state
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 0,
    isFree: false
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

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

  const handleCourseUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await courseAPI.update(id, course);
      setSuccess('Course updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    setUploadingThumbnail(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await uploadAPI.uploadImage(formData);
      
      setCourse(prev => ({
        ...prev,
        thumbnail: data.url
      }));

      setSuccess('Thumbnail uploaded successfully! ✓');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to upload thumbnail. Please try again.';
      setError(errorMsg);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError('Video size should be less than 100MB');
      return;
    }

    try {
      setUploadingVideo(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE}/api/upload/video`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setLectureForm(prev => ({
        ...prev,
        videoUrl: response.data.url,
        duration: Math.round(response.data.duration || 0)
      }));
      setSuccess('Video uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Video upload failed. Please try again.');
      console.error(error);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAddLecture = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      if (editingLecture) {
        await courseAPI.updateLecture(id, editingLecture._id, lectureForm);
        setSuccess('Lecture updated successfully!');
      } else {
        await courseAPI.addLecture(id, lectureForm);
        setSuccess('Lecture added successfully!');
      }

      await loadCourse();
      setShowLectureForm(false);
      setEditingLecture(null);
      setLectureForm({ title: '', description: '', videoUrl: '', duration: 0, isFree: false });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save lecture');
    } finally {
      setSaving(false);
    }
  };

  const handleEditLecture = (lecture) => {
    setEditingLecture(lecture);
    setLectureForm({
      title: lecture.title,
      description: lecture.description || '',
      videoUrl: lecture.videoUrl,
      duration: lecture.duration,
      isFree: lecture.isFree || false
    });
    setShowLectureForm(true);
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    try {
      setSaving(true);
      await courseAPI.deleteLecture(id, lectureId);
      await loadCourse();
      setSuccess('Lecture deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete lecture');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      setSaving(true);
      const newStatus = course.status === 'published' ? 'draft' : 'published';
      await courseAPI.publish(id, { status: newStatus });
      await loadCourse();
      setSuccess(`Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!course) return <div className="container mx-auto px-4 py-8">Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link to="/dashboard" className="text-purple-600 hover:text-purple-700 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-600 mt-1">{course.title}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePublishToggle}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium ${
                course.status === 'published'
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {course.status === 'published' ? 'Unpublish' : 'Publish Course'}
            </button>
            <Link
              to={`/courses/${id}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Preview
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'details'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Course Details
              </button>
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'curriculum'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Curriculum ({course.lectures?.length || 0} lectures)
              </button>
            </nav>
          </div>

          {/* Course Details Tab */}
          {activeTab === 'details' && (
            <form onSubmit={handleCourseUpdate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={course.description}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={course.category}
                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={course.level}
                    onChange={(e) => setCourse({ ...course, level: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Thumbnail</label>
                
                {/* Upload Button and URL Input */}
                <div className="flex items-center gap-4 mb-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      disabled={uploadingThumbnail}
                    />
                    <div className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2">
                      {uploadingThumbnail ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upload from Computer
                        </>
                      )}
                    </div>
                  </label>
                  
                  <span className="text-gray-500 text-sm">or</span>
                  
                  <input
                    type="url"
                    value={course.thumbnail || ''}
                    onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Paste image URL here"
                    disabled={uploadingThumbnail}
                  />
                </div>

                {/* Thumbnail Preview */}
                {course.thumbnail && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={course.thumbnail}
                      alt="Thumbnail preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x225/6366f1/ffffff?text=Invalid+Image';
                      }}
                    />
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 1280x720px (Max: 10MB) • Auto-optimized
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Curriculum Tab */}
          {activeTab === 'curriculum' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Course Lectures</h3>
                <button
                  onClick={() => {
                    setShowLectureForm(true);
                    setEditingLecture(null);
                    setLectureForm({ title: '', description: '', videoUrl: '', duration: 0, isFree: false });
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  + Add Lecture
                </button>
              </div>

              {/* Lecture Form */}
              {showLectureForm && (
                <form onSubmit={handleAddLecture} className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
                  <h4 className="font-semibold text-lg">{editingLecture ? 'Edit Lecture' : 'Add New Lecture'}</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lecture Title</label>
                    <input
                      type="text"
                      value={lectureForm.title}
                      onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={lectureForm.description}
                      onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Video Upload</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {uploadingVideo && (
                      <p className="text-sm text-purple-600 mt-2">Uploading video... Please wait</p>
                    )}
                    {lectureForm.videoUrl && (
                      <p className="text-sm text-green-600 mt-2">✓ Video uploaded successfully</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={lectureForm.duration}
                        onChange={(e) => setLectureForm({ ...lectureForm, duration: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lectureForm.isFree}
                          onChange={(e) => setLectureForm({ ...lectureForm, isFree: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Free Preview</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving || uploadingVideo || !lectureForm.videoUrl}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingLecture ? 'Update Lecture' : 'Add Lecture'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLectureForm(false);
                        setEditingLecture(null);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Lectures List */}
              <div className="space-y-3">
                {course.lectures && course.lectures.length > 0 ? (
                  course.lectures.map((lecture, index) => (
                    <div key={lecture._id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Lecture {index + 1}:</span>
                          <span>{lecture.title}</span>
                          {lecture.isFree && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Free</span>
                          )}
                        </div>
                        {lecture.description && (
                          <p className="text-sm text-gray-600 mt-1">{lecture.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{lecture.duration} minutes</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditLecture(lecture)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLecture(lecture._id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No lectures added yet</p>
                    <p className="text-sm mt-2">Click "Add Lecture" to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
