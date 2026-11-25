/* eslint-disable @next/next/no-img-element -- decorative SVGs */

export function FormHeader() {
  return (
    <header className="relative h-16 overflow-hidden sm:h-20 bg-cream">
      <div aria-hidden className="absolute inset-y-0 left-0 w-[7px] bg-forest-600" />
      <img
        aria-hidden
        alt=""
        src="/form/header-corner-organic.svg"
        className="pointer-events-none absolute -top-[103px] -right-4 max-w-none max-sm:-top-[106px] max-sm:-right-60 max-sm:h-[170px]"
      />
      <p className="absolute inset-y-0 left-6 flex items-center font-display text-[18px] leading-normal text-forest-950 sm:left-[42px] sm:text-[21px]">
        YOUNG MUSLIMS
      </p>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-cream-line opacity-70" />
    </header>
  );
}
