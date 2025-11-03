export default function InfoSection() {
    return(
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Us?
              </h2>
              <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
                Experience Vietnam with local guides who will make your journey unforgettable
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  {/* ĐỔI MÀU: Icon background */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl">🎯</span>
                  </div>
                  <h3 className="font-semibold mb-2">Local Experts</h3>
                  <p className="text-sm text-gray-600">
                    Connect with experienced local guides
                  </p>
                </div>
                <div className="text-center">
                  {/* ĐỔI MÀU: Icon background */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl">💝</span>
                  </div>
                  <h3 className="font-semibold mb-2">Personalized Tours</h3>
                  <p className="text-sm text-gray-600">
                    Customize your perfect journey
                  </p>
                </div>
                <div className="text-center">
                  {/* ĐỔI MÀU: Icon background */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl">⭐</span>
                  </div>
                  <h3 className="font-semibold mb-2">5 Star Rated</h3>
                  <p className="text-sm text-gray-600">
                    Verified by thousands of travelers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
    )
}