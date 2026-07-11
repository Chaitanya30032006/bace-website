import React from 'react';

export default function Logo({ className = 'h-[72px] w-[72px]', showText = true, dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${className} rounded-full overflow-hidden flex items-center justify-center bg-white p-1`}>
        <img
          src="/mayapur-bace-logo.png"
          alt="Mayapur BACE - Bhaktivedant Academy for Culture and Education"
          className="h-full w-full object-contain"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-extrabold text-lg leading-none tracking-wide sm:text-xl ${dark ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
            MAYAPUR BACE
          </span>
          <span className={`text-[9px] uppercase font-semibold tracking-wider leading-tight ${dark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            Bridge • Advance • Connect • Empower
          </span>
        </div>
      )}
    </div>
  );
}
