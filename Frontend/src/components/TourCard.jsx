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
    // guideName = 'Awesome Guide',
    // guideImage = 'https://placehold.co/100x100/e0e0e0/000000?text=Guide',
    rating = 4.5,
    reviews = 10,
    duration = 4,
    groupSize = 5,
    transportation = 'Car',
    price = 114
  } = tour || {};

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
    <Link to={`/tour/post/${id}`} className="block rounded-3xl bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col h-full">
      {/* Full width image - no gap at top */}
      <div className="relative h-56 w-full overflow-hidden flex-shrink-0">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x300/fecaca/991b1b?text=Image+Error'; }}
        />
        {/* You can add badges here if needed, e.g., for "Featured" */}
      </div>
      
      {/* Info bar (Duration, Group Size, Transport) */}
      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <Car size={16} className="text-gray-600" />
          <span className="capitalize">{transportation}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-600" />
          <span>{duration} hours</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-600" />
          <span>{groupSize}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Guide Info */}
        <div className="flex items-center gap-3 mb-4">
          {/* <img 
            src={guideImage} 
            alt={guideName} 
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/e0e0e0/000000?text=Guide'; }}
          />
          <div>
            <h4 className="font-semibold text-lg text-gray-900">{guideName}</h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {renderStars()}
              </div>
              <span className="text-sm text-gray-600">
                {rating.toFixed(1)} ({reviews})
              </span>
            </div>
          </div> */}
        </div>
        
        <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
                {renderStars()}
            </div>
            <span className="text-sm text-gray-600">
                {rating.toFixed(1)} ({reviews})
            </span>
        </div>

        {/* Tour Details */}
        <h3 className="text-xl font-bold text-gray-900 truncate mb-2" title={title}>
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-5 line-clamp-2">
          {description}
        </p>

        {/* Price */}
        <div className="flex items-baseline justify-start">
          <span className="text-3xl font-extrabold text-blue-600">${price/25000}</span>
          <span className="text-sm text-gray-600 ml-1.5">/person</span>
        </div>
      </div>
    </Link>
  );
}