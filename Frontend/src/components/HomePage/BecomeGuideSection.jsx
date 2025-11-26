import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import guideApplyImage from '@/assets/homepage/guide-apply-2.jpg'
import { Heart, Users, ShieldCheck, Smile } from 'lucide-react';
export default function BecomeGuideSection() {
  const themeBlue = "#020765";
  const themeGreen = "#068F64";
  // --- CẤU HÌNH FONT & STYLE TẠI ĐÂY ---
  const customTextStyle = {
    // Bạn thay đổi tên font ở đây (vd: 'Roboto', 'Open Sans', 'Merriweather'...)
    // Lưu ý: Đảm bảo bạn đã import font này trong index.css hoặc index.html
    fontFamily: '"Roboto", serif',
    fontWeight: 300, // 400 là bình thường (không bold), 300 là mỏng
  };

  return (
    // Thêm padding cho section và bọc content bên trong container
    <section className="py-16 md:py-20 lg:py-24 bg-gray-50/50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Thêm max-w-6xl, shadow, rounded và overflow-hidden để nhất quán */}
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Content Side */}
            <div className="flex-1 py-16 md:py-20 lg:py-28 px-6 md:px-12 lg:px-16 flex items-center justify-center md:justify-start">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="mb-6 text-black text-3xl md:text-4xl font-bold">Become a guide</h2>
                <p className="mb-8 text-black/55 leading-relaxed">
                  If you're ready to join a network of creative local tour guides who thrive on
                  providing visitors with truly memorable experiences, we'd love to hear from you
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  {/* Nút Apply Now - Link tới trang Signup */}
                  <Link to="/signup">
                    <button className="btn-vngo-gradient-primary px-8 py-3 rounded-full">
                      Apply now
                    </button>
                  </Link>

                  {/* Nút See More - Hiện Popup nội dung */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full sm:w-auto border-2 border-[#020765] text-[#020765] hover:bg-[#020765]/5 px-8 py-3 rounded-full transition-colors font-medium
                        btn-vngo-hover-effect"
                      >
                        See more
                      </button>
                    </DialogTrigger>
                    
                    {/* Nội dung Popup */}
                    <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 md:p-6 rounded-xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl font-bold text-[#020765] mb-2 pr-4">
                          Welcome to VNGo!
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6 text-sm md:text-base text-gray-700 leading-relaxed">
                        <p>
                          You've just found a network of passionate, creative, and hard-working guides who thrive on providing visitors with truly memorable travel experiences. It could be the place that brings your guide career to the next level!
                        </p>

                        <div>
                          <h3 className="text-lg font-bold text-black mb-2">Being a guide on our platform means that you can…</h3>
                          
                          {/* BLOCK 1: Do what you love */}
                            <div className="flex flex-col items-center">
                              <Heart className="w-12 h-12 mb-3" style={{ color: themeBlue }} />
                              <h4
                                className="font-inria text-xl mb-3 text-center" 
                                style={{ color: themeBlue, ...customTextStyle }}
                              >
                                Do what you love
                              </h4>
                              <div className="max-w-lg mx-auto text-left bg-gray-50 p-4 rounded-lg">
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>Be creative and be yourself, as you design and deliver tours that let your unique personality and knowledge shine.</li>
                                  <li>Be your own boss: stay flexible and independent by setting your own schedule and prices for every tour.</li>
                                  <li>Follow your passion and do what you love every day, supported by a team whose goal is your success.</li>
                                </ul>
                              </div>
                            </div>

                            {/* BLOCK 2: Meet travellers */}
                            <div className="flex flex-col items-center">
                              <Users className="w-12 h-12 mb-3" style={{ color: themeGreen }} />
                              <h4 
                                className="font-inria text-xl mb-3 text-center" 
                                style={{ color: themeGreen, ...customTextStyle }}
                              >
                                Meet kind and curious travellers
                              </h4>
                              <div className="max-w-lg mx-auto text-left bg-gray-50 p-4 rounded-lg">
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>The travellers who use VNGo are passionate about exploring the world and are eager to learn more about you and the places you love.</li>
                                  <li>The travellers on our platform are value-oriented rather than price-oriented; they get energized by authentic, unique experiences.</li>
                                </ul>
                              </div>
                            </div>

                            {/* BLOCK 3: Support */}
                            <div className="flex flex-col items-center">
                              <ShieldCheck className="w-12 h-12 mb-3" style={{ color: themeBlue }} />
                              <h4 
                                className="font-inria text-xl mb-3 text-center" 
                                style={{ color: themeBlue, ...customTextStyle }}
                              >
                                Be supported in all that you do
                              </h4>
                              <div className="max-w-lg mx-auto text-left bg-gray-50 p-4 rounded-lg">
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>We have your back. From the moment you become a guide with VNGo, you've got a team of caring staff cheering you on. We want you to succeed!</li>
                                  <li>From practical advice for getting started to ongoing support with every booking you make, our staff are here to help you 24/7.</li>
                                  <li>You're protected from the pain of last minute no-shows with our guide-friendly cancellation policy.</li>
                                </ul>
                              </div>
                            </div>

                            {/* BLOCK 4: Marketing */}
                            <div className="flex flex-col items-center">
                              <Smile className="w-12 h-12 mb-3" style={{ color: themeGreen }} />
                              <h4 
                                className="font-inria text-xl mb-3 text-center" 
                                style={{ color: themeGreen, ...customTextStyle }}
                              >
                                Grow your business with smart marketing
                              </h4>
                              <div className="max-w-lg mx-auto text-left bg-gray-50 p-4 rounded-lg">
                                <p>Through a comprehensive program of marketing tactics, know that your tours will be discovered by the right people, motivated customers who otherwise may never have found you.</p>
                              </div>
                            </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-black mb-2">We'd love to hear from you</h3>
                          <p>
                            We respect guides' diverse areas of expertise and bodies of knowledge, and are proud to present a full range of options to our travelers. This means that whether you're a long-time tourism professional, or a novice but enthusiastic local with unique skills or stories to share, we'd love to hear from you.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Image Side */}
            <div className="flex-1 relative min-h-[300px] md:min-h-full">
              <img
                // src="https://images.unsplash.com/photo-1543165796-5426273adab5?w=500&h=540&fit=crop"
                src={guideApplyImage}
                alt="Tour guide in Vietnam"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}