import React from 'react';

export function Watermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-10 select-none"
    >
      <img
        src="/insanos.png"
        alt="Insanos MC Brasil"
        className="h-full w-full max-h-[380px] max-w-[380px] object-contain filter contrast-125 brightness-110 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
      />
    </div>
  );
}
