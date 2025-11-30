import * as React from "react";
import { cn } from "@/lib/utils.js";
import {
    Languages,
    PiggyBank,
    LucideGem,
    UserStar,
    Flame,
    MessagesSquare,
    Star,
    Paintbrush,
    Heart,
    ThumbsUp, Globe, User, UserRound, UserPlus, UserCheck, UserPen, Pencil, Brush, Palette, PencilRuler
} from "lucide-react";


const ACHIEVEMENT_COLORS = {
  popular: "from-red-400 via-red-500 to-red-700",
  highlyrated: "from-yellow-300 via-yellow-400 to-yellow-500",
  multilingual: "from-blue-300 via-blue-500 to-blue-700",
  polygot: "from-blue-400 via-blue-500 to-blue-700",
  budget: "from-pink-200 via-pink-400 to-pink-600",
  luxury: "from-cyan-100 via-sky-300 to-blue-500",
  reviews: "from-rose-200 via-orange-300 to-rose-500",

  // Guides - green theme increasing
  "rookie guide": "from-green-200 via-green-300 to-green-400",
  "rising guide": "from-green-300 via-green-400 to-green-500",
  "experienced guide": "from-green-400 via-green-500 to-green-600",
  "master guide": "from-teal-400 via-teal-500 to-teal-600",
  "legendary guide": "from-lime-400 via-lime-500 to-lime-600",

  // Crafter / Artist / Architect - orange → red / purple
  "rookie crafter": "from-orange-200 via-orange-300 to-orange-400",
  "apprentice crafter": "from-orange-300 via-orange-400 to-orange-500",
  "skilled artist": "from-red-300 via-red-400 to-red-500",
  "master artist": "from-red-400 via-red-500 to-red-600",
  "master architect": "from-purple-400 via-purple-500 to-purple-700",
  architect: "from-purple-500 via-purple-600 to-purple-700",

  liked: "from-blue-300 via-blue-400 to-blue-500",
  loved: "from-red-200 via-red-400 to-red-600",
  "people's choice": "from-yellow-300 via-yellow-400 to-yellow-500",
};

const ACHIEVEMENT_OUTLINES = {
  popular: "#c21818",
  highlyrated: "#e6c72a",
  multilingual: "#1a3dbd",
  polygot: "#1e40af",
  budget: "#c0266c",
  luxury: "#6ca0e0",
  reviews: "#d46f09",

  "rookie guide": "#15803d",
  "rising guide": "#16a34a",
  "experienced guide": "#15803d",
  "master guide": "#0f766e",
  "legendary guide": "#84cc16",

  "rookie crafter": "#f97316",
  "apprentice crafter": "#ea580c",
  "skilled artist": "#dc2626",
  "master artist": "#b91c1c",
  "master architect": "#7c3aed",
  architect: "#6d28d9",

  liked: "#3b82f6",
  loved: "#b91c1c",
  "people's choice": "#ca8a04",
};

const ACHIEVEMENT_ICONS = {
  popular: <Flame fill="#ff8a3d" stroke="#ff4500" className="w-4 h-4" />,
  highlyrated: <Star fill="#facc15" stroke="#ca8a04" className="w-4 h-4" />,
  multilingual: <Languages color="#3b82f6" className="w-4 h-4" />,
  polygot: <Globe color="#1e40af" className="w-4 h-4" />,
  budget: <PiggyBank fill="#f9a8d4" stroke="#ec4899" className="w-4 h-4" />,
  luxury: <LucideGem fill="#d6f0ff" stroke="#60a5fa" className="w-4 h-4" />,
  reviews: <MessagesSquare fill="#fb923c" stroke="#ea580c" className="w-4 h-4" />,

  // Guides
  "rookie guide": <UserPen fill="#a7f3d0" stroke="#15803d" className="w-4 h-4" />,
  "rising guide": <UserPlus fill="#6ee7b7" stroke="#16a34a" className="w-4 h-4" />,
  "experienced guide": <UserCheck fill="#4ade80" stroke="#15803d" className="w-4 h-4" />,
  "master guide": <UserStar fill="#0f766e" stroke="#0f766e" className="w-4 h-4" />,
  "legendary guide": <Flame fill="#eaff00" stroke="#84cc16" className="w-4 h-4" />,

  // Crafter / Artist / Architect
  "rookie crafter": <Pencil fill="#fed7aa" stroke="#f97316" className="w-4 h-4" />,
  "apprentice crafter": <PencilRuler fill="#fdba74" stroke="#ea580c" className="w-4 h-4" />,
  "skilled artist": <Brush fill="#f87171" stroke="#dc2626" className="w-4 h-4" />,
  "master artist": <Paintbrush fill="#ef4444" stroke="#b91c1c" className="w-4 h-4" />,
  "master architect": <LucideGem fill="#d8b4fe" stroke="#7c3aed" className="w-4 h-4" />,
  architect: <LucideGem fill="#c084fc" stroke="#6d28d9" className="w-4 h-4" />,

  liked: <ThumbsUp color="#3b82f6" className="w-4 h-4" />,
  loved: <Heart fill="#f87171" stroke="#b91c1c" className="w-4 h-4" />,
  "people's choice": <Star fill="#facc15" stroke="#ca8a04" className="w-4 h-4" />,
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

      {/* Outer hexagon shadow/base (fixed) */}
      <div
        className="absolute w-10 h-10"
        style={{
          clipPath:
            "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          backgroundColor: ACHIEVEMENT_OUTLINES[variant],
            filter: "brightness(0.7)",
          transform: "translateY(3px)",
          zIndex: 5,
        }}
      />

      {/* Main hexagon + inner hexagon (hover lifts only this) */}
      <div
        className="relative w-10 h-10 flex items-center justify-center text-white font-bold cursor-pointer transition-transform transform group-hover:-translate-y-[-3px]"
        style={{
          clipPath:
            "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          backgroundColor: ACHIEVEMENT_OUTLINES[variant],
          zIndex: 10,
        }}
      >
        {/* Inner hexagon */}
        <div
          className="w-9 h-9 flex items-center justify-center bg-white"
          style={{
            clipPath:
              "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
            boxShadow:
              "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          {ACHIEVEMENT_ICONS[variant]}
        </div>
      </div>

      {/* Label popup */}
      <span className=" absolute left-1/2 -translate-x-1/2 mt-2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-xl text-black text-xs px-2 py-1 shadow-lg z-20">
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
