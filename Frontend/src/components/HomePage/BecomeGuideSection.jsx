import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import guideApplyImage from '@/assets/homepage/guide-apply.jpg'
export default function BecomeGuideSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Application submitted:", formData);
    setIsOpen(false);
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      experience: "",
      message: ""
    });
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

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <button className="bg-[#5A74F8] hover:bg-[#4a63d8] text-white px-6 py-3 rounded-xl transition-colors font-medium">
                      Apply now
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Apply to Become a Guide</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-left">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your.email@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+84 xxx xxx xxx"
                        />
                      </div>

                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Tell us about yourself *</Label>
                        <Textarea
                          id="message"
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Share your passion for guiding and what makes you unique..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-[#5A74F8] hover:bg-[#4a63d8] text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Submit Application
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
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