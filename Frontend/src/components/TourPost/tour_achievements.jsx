import * as React from "react";
import { cn } from "@/lib/utils.js";
import { Languages, PiggyBank, LucideGem, UserStar, Flame, MessagesSquare } from "lucide-react";

const ACHIEVEMENT_COLORS = {
  popular: "from-red-400 via-red-500 to-red-700",
  highlyrated: "from-yellow-300 via-yellow-400 to-yellow-500",
  multilingual: "from-blue-300 via-blue-500 to-blue-700",
  budget: "from-pink-200 via-pink-400 to-pink-600",
  luxury: "from-cyan-100 via-sky-300 to-blue-500",
  reviews: "from-rose-200 via-orange-300 to-rose-500",
};

const ACHIEVEMENT_OUTLINES = {
  popular: "#d71e1e",       // red-700
  highlyrated: "#ffce2f",   // yellow-500
  multilingual: "#1d4ed8",  // blue-700
  budget: "#db2777",        // pink-600
  luxury: "#79a4f5",        // blue-500
  reviews: "#e47c0c",       // rose-500
};

const ACHIEVEMENT_ICONS = {
  popular: <Flame fill="#ff8a3d" stroke="#ff4500" className="w-4 h-4" />,
  highlyrated: <UserStar fill="#facc15" stroke="#ca8a04" className="w-4 h-4" />,
  multilingual: <Languages color = "#3b82f6" className="w-4 h-4" />,
  budget: <PiggyBank fill="#f9a8d4" stroke="#ec4899" className="w-4 h-4" />,
  luxury: <LucideGem fill="#d6f0ff" stroke="#60a5fa" className="w-4 h-4" />,
  reviews: <MessagesSquare fill="#fb923c" stroke="#ea580c" className="w-4 h-4" />,
};

function AchievementBadge({ variant = "popular", label }) {
  return (
    <div className="relative inline-block m-2 group overflow-visible">
      {/* Hover glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-opacity duration-300",
          "bg-gradient-to-br opacity-0 group-hover:opacity-40",
          ACHIEVEMENT_COLORS[variant]
        )}
        style={{
          filter: "blur(20px) brightness(0.9)",
          zIndex: 0,
        }}
      />

      {/* Outer hexagon with colored outline */}
      <div
        className={cn(
          "relative z-10 w-10 h-10 flex items-center justify-center text-white font-bold cursor-pointer transition-transform transform hover:scale-110"
        )}
        style={{
          clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          backgroundColor: ACHIEVEMENT_OUTLINES[variant], // keep dark base (gray-800ish)
        }}
      >
        {/* Inner hexagon */}
        <div
          className="w-9 h-9 flex items-center justify-center bg-white"
          style={{
            clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
            boxShadow:
              "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          {ACHIEVEMENT_ICONS[variant]}
        </div>
      </div>

      {/* Label popup */}
      <span
        className="absolute left-1/2 -translate-x-1/2 mt-2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-20"
      >
        {label}
      </span>
    </div>
  );
}

export { AchievementBadge };



// import * as React from "react";
// import { cn } from "@/lib/utils";
// import { Languages, PiggyBank, LucideGem, UserStar, Flame, MessagesSquare } from "lucide-react";
//
// const ACHIEVEMENT_COLORS = {
//   popular: "from-red-400 via-red-500 to-red-700",
//   highlyrated: "from-emerald-300 via-emerald-500 to-emerald-700",
//   multilingual: "from-blue-300 via-blue-500 to-blue-700",
//   budget: "from-pink-200 via-pink-400 to-pink-600",
//   luxury: "from-cyan-100 via-sky-300 to-blue-500",
//   reviews: "from-rose-200 via-orange-300 to-rose-500",
// };
//
// const ACHIEVEMENT_ICONS = {
//   popular: <Flame fill="#ff8a3d" stroke="#ff4500" className="w-4 h-4" />,
//   highlyrated: <UserStar fill="#10b981" stroke="#059669" className="w-4 h-4" />,
//   multilingual: <Languages fill="#3b82f6" stroke="#3b82f6" className="w-4 h-4" />,
//   budget: <PiggyBank fill="#f9a8d4" stroke="#ec4899" className="w-4 h-4" />,
//   luxury: <LucideGem fill="#d6f0ff" stroke="#60a5fa" className="w-4 h-4" />,
//   reviews: <MessagesSquare fill="#fb923c" stroke="#ea580c" className="w-4 h-4" />,
// };
//
// function AchievementBadge({ variant = "popular", label }) {
//   return (
//     <div className="relative inline-block m-2 group overflow-visible">
//       {/* Glow only on hover */}
//       <div
//         className={cn(
//           "absolute inset-0 rounded-lg transition-opacity duration-300",
//           "bg-gradient-to-br opacity-0 group-hover:opacity-80",
//           ACHIEVEMENT_COLORS[variant]
//         )}
//         style={{
//           filter: "blur(14px) brightness(0.95)",
//           zIndex: 0,
//         }}
//       />
//
//       {/* Hexagon main shape */}
//       <div
//         className={cn(
//           "relative z-10 w-10 h-10 flex items-center justify-center text-white font-bold cursor-pointer transition-transform transform hover:scale-110",
//           "bg-gradient-to-br shadow-lg",
//           ACHIEVEMENT_COLORS[variant]
//         )}
//         style={{
//           clipPath:
//             "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
//           boxShadow:
//             "0 0 10px rgba(255,255,255,0.4), 0 0 20px rgba(255,255,255,0.15) inset",
//         }}
//       >
//         {/* Inner circle for icon with subtle depth */}
//         <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-md transition-shadow duration-300 group-hover:shadow-xl">
//           {ACHIEVEMENT_ICONS[variant]}
//         </div>
//       </div>
//
//       {/* Label popup */}
//       <span
//         className="absolute left-1/2 -translate-x-1/2 mt-2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-20"
//       >
//         {label}
//       </span>
//     </div>
//   );
// }
//
// export { AchievementBadge };
