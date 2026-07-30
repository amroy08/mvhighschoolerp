"use client";

export function SchoolLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Golden Border */}
      <circle cx="100" cy="100" r="96" fill="#EAB308" stroke="#7E1B1B" strokeWidth="4" />
      
      {/* Outer Maroon Ring */}
      <circle cx="100" cy="100" r="90" fill="#7E1B1B" />
      
      {/* Inner Golden Ring */}
      <circle cx="100" cy="100" r="66" fill="#FACC15" />
      
      {/* Inner Sky Blue Core */}
      <circle cx="100" cy="100" r="62" fill="#38BDF8" />

      {/* Curved Text Path */}
      <path id="textPath" d="M 22 100 A 78 78 0 0 1 178 100" fill="none" />
      
      <text fill="#FFFFFF" fontSize="13.5" fontWeight="900" letterSpacing="0.8">
        <textPath href="#textPath" startOffset="50%" textAnchor="middle">
          M.V HIGH SCHOOL MUMBAI
        </textPath>
      </text>

      {/* Lotus Flower Center */}
      <g transform="translate(100, 95)">
        {/* Lotus Stem & Base */}
        <path d="M-25 15 C-25 25, 25 25, 25 15 C20 10, -20 10, -25 15 Z" fill="#15803D" stroke="#FEF08A" strokeWidth="1.5" />
        <path d="M-15 15 C-15 22, 15 22, 15 15 Z" fill="#86EFAC" />

        {/* Outer Lotus Petals */}
        <path d="M-32 5 C-42 -15, -20 -30, -12 -12 C-20 0, -28 5, -32 5 Z" fill="#EC4899" stroke="#FFFFFF" strokeWidth="1" />
        <path d="M32 5 C42 -15, 20 -30, 12 -12 C20 0, 28 5, 32 5 Z" fill="#EC4899" stroke="#FFFFFF" strokeWidth="1" />
        
        {/* Mid Lotus Petals */}
        <path d="M-20 -5 C-28 -28, -5 -40, 0 -22 C-10 -15, -15 -10, -20 -5 Z" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1" />
        <path d="M20 -5 C28 -28, 5 -40, 0 -22 C10 -15, 15 -10, 20 -5 Z" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1" />

        {/* Center Main Petal */}
        <path d="M-12 -10 C0 -45, 0 -45, 12 -10 C5 -5, -5 -5, -12 -10 Z" fill="#FDF2F8" stroke="#E11D48" strokeWidth="1.5" />
        <path d="M-6 -12 C0 -38, 0 -38, 6 -12 Z" fill="#F472B6" />

        {/* Lotus Buds Left & Right */}
        <path d="M-40 0 C-48 -12, -35 -20, -32 -5 Z" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1" />
        <path d="M40 0 C48 -12, 35 -20, 32 -5 Z" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1" />
      </g>

      {/* Bottom Motto Ribbon */}
      <path d="M 25 145 L 175 145 C 160 180, 40 180, 25 145 Z" fill="#7E1B1B" stroke="#EAB308" strokeWidth="3" />
      <text x="100" y="166" fill="#FACC15" fontSize="11" fontWeight="800" textAnchor="middle">
        Sa Vidya Ya Vimuktaye
      </text>
    </svg>
  );
}
