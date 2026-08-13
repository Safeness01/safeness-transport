import React, { memo } from 'react';
import Marquee from 'react-fast-marquee';

const LOGOS = [
  {
    name: 'Uniformation',
    src: 'https://res.cloudinary.com/ec9kwdkg/image/upload/v1785410691/1200px-Vaisala_logo.svg_u59jsu.png',
    className: 'h-6 object-contain brightness-0 invert opacity-60 mr-16 md:mr-20',
  },
  {
    name: 'Prada',
    src: 'https://res.cloudinary.com/ec9kwdkg/image/upload/v1785410691/2560px-Prada-Logo.svg-1024x159-1_uyx0zd.webp',
    className: 'h-4 object-contain brightness-0 invert opacity-60 mr-16 md:mr-20',
  },
  {
    name: 'Vaisala',
    src: 'https://res.cloudinary.com/ec9kwdkg/image/upload/v1785410691/1200px-Vaisala_logo.svg_u59jsu.png',
    className: 'h-6 object-contain brightness-0 invert opacity-60 mr-16 md:mr-20',
  },
  {
    name: 'ETS Global',
    src: 'https://res.cloudinary.com/ec9kwdkg/image/upload/v1785410692/ETSGlobal_logo.a83452a9_xxbkm6.png',
    className: 'h-8 object-contain brightness-0 invert opacity-60 mr-16 md:mr-20',
  },
];

// Duplicate list 4 times for seamless infinite loop on all screen sizes
const MULTIPLIED_LOGOS = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

export const PartnerLogos = memo(function PartnerLogos() {
  return (
    <div className="w-full pt-16 border-t border-white/5 relative">
      <p className="text-xs font-normal text-white/50 tracking-[0.2em] mb-12 uppercase text-center">
        Corporate Partners
      </p>

      {/* Infinite Marquee with Side Gradient Fade */}
      <div className="relative w-full overflow-hidden">
        <Marquee 
          speed={40} 
          pauseOnHover={true} 
          gradient={true}
          gradientColor="#1c1917"
          gradientWidth={100}
          direction="left"
        >
          {MULTIPLIED_LOGOS.map((logo, index) => (
            <img
              key={`${logo.name}-${index}`}
              src={logo.src}
              alt={logo.name}
              className={logo.className}
            />
          ))}
        </Marquee>
      </div>
    </div>
  );
});

export default PartnerLogos;
