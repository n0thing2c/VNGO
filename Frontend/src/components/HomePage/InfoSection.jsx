import QuestionIcon from "@/assets/homepage/question.png";
import { Target, Heart, Star } from "lucide-react";

export default function InfoSection() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4 md:mb-6">
            <img
              src={QuestionIcon}
              alt="Question Icon"
              className="w-8 md:w-12 lg:w-16 h-auto object-cover"
            />
          </div>
          <h2 className="text-vngo-primary text-3xl md:text-4xl font-bold mb-4">
            Why Choose Us?
          </h2>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Experience Vietnam with local guides who will make your journey
            unforgettable
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-vngo-normal-medium-responsive">Local Experts</h3>
              <p className="text-vngo-normal-small-responsive text-gray-600">
                Connect with experienced guides
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold mb-2 text-vngo-normal-medium-responsive">Personalized Tours</h3>
              <p className="text-vngo-normal-small-responsive text-gray-600">
                Customize your perfect journey
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2 text-vngo-normal-medium-responsive">5 Star Rated</h3>
              <p className="text-vngo-normal-small-responsive text-gray-600">
                Verified by thousands of travelers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}