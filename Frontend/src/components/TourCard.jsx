import { Star, Clock, Users, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

// The tour card is built to accept a 'tour' prop and is styled with Tailwind.

export default function TourCard({ tour }) {
  // Fallback data in case tour prop is incomplete
  const {
    id = 'default-id',
    title = 'Amazing Tour Title',
    description = 'A brief and exciting description of the tour goes here.',
    image = 'https://placehold.co/400x300/60a5fa/ffffff?text=Tour+Image',
    rating = 4.5,
    reviews = 10,
    duration = 4,
    min_people,
    max_people,
    groupSize = 5,
    transportation = 'Car',
    price = 114
  } = tour || {};

  // // Extract guide info safely
  // const guide = tour?.guide;
  // const guideName = guide?.name || tour?.guideName || 'Local Guide';
  // // Use a sensible default or the provided avatar. If it's a relative path, the browser/setup might need a base URL, 
  // // but assuming incoming data is handled like other images for now.
  // const guideAvatar = guide?.avatar || tour?.guideImage || 'https://placehold.co/100x100/e0e0e0/000000?text=Guide';

  // Determine display group size
  const displayGroupSize = (min_people && max_people)
    ? `${min_people} - ${max_people}`
    : groupSize;

  // Function to render the star ratings
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} fill="#FFD700" stroke="#FFD700" size={16} />
        ))}
        {halfStar && <Star fill="#FFD700" stroke="#FFD700" size={16} style={{ clipPath: 'inset(0 50% 0 0)' }} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} fill="#E0E0E0" stroke="#E0E0E0" size={16} />
        ))}
      </>
    );
  };

  return (
    <Link to={`/tour/post/${id}`} className="block rounded-3xl bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col h-full text-left">
      {/* Full width image - no gap at top */}
      <div className="relative h-56 w-full overflow-hidden flex-shrink-0 group">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/fecaca/991b1b?text=Image+Error'; }}
        />

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Guide Info Overlay */}
        {/* <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
          <img
            src={guideAvatar}
            alt={guideName}
            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/e0e0e0/000000?text=G'; }}
          />
          <span className="text-white font-medium text-sm drop-shadow-md truncate max-w-[150px]">
            {guideName}
          </span>
        </div> */}
      </div>

      {/* Info bar (Duration, Group Size, Transport) */}
      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between text-sm text-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <Car size={16} className="text-gray-600 flex-shrink-0" />
          <span className="capitalize truncate">{transportation}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Clock size={16} className="text-gray-600 flex-shrink-0" />
          <span className="truncate">{duration} hours</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Users size={16} className="text-gray-600 flex-shrink-0" />
          <span className="truncate">{displayGroupSize}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 flex flex-col gap-2">

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 truncate" title={title}>
          {title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {renderStars()}
          </div>
          <span className="text-sm text-gray-600">
            {rating.toFixed(1)} <span className="text-gray-400">({reviews} reviews)</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mt-1 mb-2">
          {description}
        </p>

        {/* Price */}
        <div className="flex items-baseline justify-start">
          <span className="text-3xl font-extrabold text-blue-600">${price / 25000}</span>
          <span className="text-sm text-gray-600 ml-1.5">/person</span>
        </div>
      </div>
    </Link >
  );
}