import GlobalSearchBar from "../GlobalSearchBar"
import defaultBanner from "@/assets/banner.svg";

export default function HeroSection() {
    return(
        <section className="relative min-h-[500px] md:min-h-[600px] lg:min-h-[660px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-100 to-blue-50">
          {/* Background image */}
          <img
            // src="https://6ixgo.com/_next/static/media/Banner.dd1e0ea6.svg?fbclid=IwY2xjawNzqBFleHRuA2FlbQIxMQABHoZRcRU5rejwr7vbckhvtLzAsQWbXN-PY_3Xo3KXl9XwlcknXI7651mx4gKJ_aem_E_758frw4cYczKIHiSZopA"
            src={defaultBanner}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0">
            <div className="absolute inset-0 border border-black/10" />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Hero Text */}
              <h1
                className="font-inria italic text-4xl md:text-5xl lg:text-6xl font-bold mb-8 md:mb-10 lg:mb-12
                  tracking-[-1.2px] leading-[1.1] text-center
                  bg-clip-text bg-gradient-to-r from-[#020765] via-60% via-[#068f64] via-5% to-[#666666] via-35%"
                style={{ WebkitTextFillColor: 'transparent' }}
              >
                Skip the tourist traps<br />
                Unlock the hidden Vietnam
              </h1>
              {/* <p className="text-vngo-normal-small-responsive mb-8 md:mb-10 lg:mb-12 text-black/90 max-w-2xl mx-auto">
                The best spots aren't advertised. Discover authentic Vietnam with us.
              </p> */}

              {/* Search Bar */}
              <GlobalSearchBar />

            </div>
          </div>
        </section>
    )
}