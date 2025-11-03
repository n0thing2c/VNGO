export default function TravelStatsSection() {
  return (
    <section className="relative py-16 md:py-20 lg:py-24 bg-gray-100 overflow-hidden">
      {/* Background Image - Placeholder */}
      <img
        src="https://images.unsplash.com/photo-1557750255-c76072a7aad1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
        // src={statsBgImage}
        alt="Vietnam landscape"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-gray-100/40" />

      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto"> 
        {/* CHÚ Ý: 
          Bạn có thể dùng max-w-6xl (như các section khác) hoặc 
          max-w-4xl (như code cũ) tùy xem bạn muốn nó rộng bao nhiêu.
          Ở đây để max-w-6xl cho nhất quán.
        */}
          <div className="max-w-4xl mx-auto text-center"> 
            <p className="font-medium text-black text-lg md:text-xl mb-3">
              Travel with us
            </p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-black mb-4">
              We're here to take you
            </h2>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-black mb-12">
              to the places you'll <span className="text-[#cc3737] font-light">love</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Stat 1 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-md">
                <div className="flex items-center justify-between px-6">
                  <span className="text-lg font-medium text-gray-700">Travellers served</span>
                  <span className="text-2xl font-bold text-black">10,000+</span>
                </div>
              </div>
              {/* Stat 2 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-md">
                <div className="flex items-center justify-between px-6">
                  <span className="text-lg font-medium text-gray-700">Tour guides</span>
                  <span className="text-2xl font-bold text-black">500+</span>
                </div>
              </div>
            </div>
          </div>
        </div> 
      </div>
    </section>
  );
}