"use client";

export function GeoPlaceholder() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center overflow-hidden relative"
      style={{ borderTop: "1px solid rgba(228,224,216,0.04)" }}
    >
      <div className="text-center">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#e8c872" }}>
          In Progress
        </p>
        <p className="text-sm font-extralight" style={{ color: "#6b6b78" }}>
          Geographic overview coming soon
        </p>
      </div>
    </div>
  );
}
