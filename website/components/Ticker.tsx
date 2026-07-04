const items = [
  "Made in Germany since 1913",
  "PVC-free · VOC-free",
  "Seamless up to 5.05 m",
  "αw 0.90 acoustic absorption",
  "B-s1,d0 fire certified",
  "OEKO-TEX® Standard 100",
  "1,000+ projects across India",
  "Installed in a day",
  "Indoor Air Comfort Gold®",
];

export function Ticker() {
  const row = items.map((t) => (
    <span key={t} className="mx-8 inline-flex items-center gap-8 whitespace-nowrap">
      {t} <span className="text-paper/30">◆</span>
    </span>
  ));
  return (
    <div className="overflow-hidden border-y border-white/10 bg-ink py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-paper/70">
      <div className="ticker inline-block whitespace-nowrap will-change-transform">
        {row}
        {row}
      </div>
    </div>
  );
}
