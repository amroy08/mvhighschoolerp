"use client";

/* Using exact logo.jpeg downloaded by user from Downloads folder */
export function SchoolLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <img
      src="/logo.jpeg"
      alt="Marwari Vidyalaya High School Emblem"
      className={`object-contain ${className}`}
    />
  );
}
