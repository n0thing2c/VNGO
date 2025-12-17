import { MapPin, Calendar, Wallet, Sparkles } from "lucide-react";

export default function TripPlannerHero() {
    return (
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                </svg>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-10 right-20 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl" />

            <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
                <div className="text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        AI-Powered Trip Planning
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                        Plan Your Perfect
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-200">
                            Vietnam Adventure
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
                        Tell us where you want to go, how long, and your budget.
                        Our smart system will create the perfect multi-day itinerary with local tours and hotels.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-4">
                        <FeaturePill icon={MapPin} text="Choose your destination" />
                        <FeaturePill icon={Calendar} text="Set your dates" />
                        <FeaturePill icon={Wallet} text="Define your budget" />
                    </div>
                </div>
            </div>

            {/* Wave Bottom */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" className="w-full h-auto">
                    <path
                        fill="#f0fdf4"
                        d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,85.3C672,75,768,53,864,48C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                    />
                </svg>
            </div>
        </div>
    );
}

function FeaturePill({ icon: Icon, text }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
            <Icon className="w-4 h-4" />
            {text}
        </div>
    );
}

