import { useNavigate } from "react-router-dom";

export default function FloatingChatbotButton({
  className = "fixed bottom-6 right-6 z-50",
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to chat page with flag to open chatbot room
    navigate("/chat", { state: { openChatbot: true } });
  };

  return (
    <div className={className}>
      <button
        className="p-4 bg-gradient-to-r from-[#020765] to-[#23c491] hover:from-[#23c491] hover:to-[#020765] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-[#23c491]/40 flex items-center justify-center group animate-bounce-slow"
        onClick={handleClick}
        aria-label="Chatbot"
        title="Ask our AI Assistant"
      >
        {/* Robot/Chatbot Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-7 h-7 group-hover:scale-110 transition-transform"
        >
          {/* Robot head */}
          <rect x="4" y="6" width="16" height="12" rx="2" />
          {/* Antenna */}
          <line x1="12" y1="6" x2="12" y2="2" />
          <circle cx="12" cy="2" r="1" fill="currentColor" />
          {/* Eyes */}
          <circle cx="9" cy="11" r="1.5" fill="currentColor" />
          <circle cx="15" cy="11" r="1.5" fill="currentColor" />
          {/* Mouth - smile */}
          <path d="M9 15h6" />
          {/* Ears/Side panels */}
          <rect x="1" y="10" width="2" height="4" rx="0.5" fill="currentColor" />
          <rect x="21" y="10" width="2" height="4" rx="0.5" fill="currentColor" />
        </svg>
      </button>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-bounce-slow:hover {
          animation: none;
        }
      `}</style>
    </div>
  );
}