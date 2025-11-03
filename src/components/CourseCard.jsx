import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  const {
    _id,
    title,
    subtitle,
    price,
    discountPrice,
    thumbnail,
    instructor,
    averageRating,
    totalRatings,
    enrollmentCount,
    level,
    totalDuration,
  } = course;

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `₹${price}`;
  };

  return (
    <Link to={`/courses/${_id}`} className="group block">
      <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-200">
        {/* Thumbnail */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={thumbnail || 'https://via.placeholder.com/400x240?text=Course+Image'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Discount Badge */}
          {discountPrice && discountPrice < price && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
              {Math.round(((price - discountPrice) / price) * 100)}% OFF
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 line-clamp-1 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Instructor */}
          <div className="text-sm text-gray-600 mb-2">
            {instructor?.name || 'Expert Instructor'}
          </div>

          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              <span className="text-sm font-bold text-yellow-600 mr-1">
                {averageRating > 0 ? averageRating.toFixed(1) : '4.5'}
              </span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-1">
                ({totalRatings || '150'})
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              {discountPrice && discountPrice < price ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(discountPrice)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(price)}
                  </span>
                </div>
              ) : (
                <span className={`text-xl font-bold ${price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {formatPrice(price)}
                </span>
              )}
            </div>
            
            {/* Level Badge */}
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {level || 'All Levels'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
