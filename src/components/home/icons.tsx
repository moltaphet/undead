const common = {
  width: 40,
  height: 40,
  viewBox: "0 0 40 40",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function AutopsyIcon() {
  return (
    <svg {...common}>
      <path d="M7 34V16a8 8 0 0 1 16 0v18" />
      <path d="M4 34h22M15 15v8M12 18h6" />
      <circle cx="27" cy="22" r="6" />
      <path d="m31.5 26.5 5 5" />
    </svg>
  );
}

export function SeanceIcon() {
  return (
    <svg {...common}>
      <path d="M20 5c-2.5 3-3 5.5-1.5 7.5S22.5 15 20 18c-2.5-1.5-3.5-4-2-7" />
      <rect x="15" y="20" width="10" height="13" rx="1.5" />
      <path d="M10 35h20M20 18v2" />
    </svg>
  );
}

export function ResurrectionIcon() {
  return (
    <svg {...common}>
      <path d="M4 34c4-2 8-2 12 0s8 2 12 0 6-1 8 0" />
      <path d="M15 31V18m0 0v-6a2 2 0 0 1 4 0v8m0-6v-3a2 2 0 0 1 4 0v9m0-6a2 2 0 0 1 4 0v8c0 4-2 8-6 9" />
      <path d="M15 18l-2.5-2.5a2 2 0 0 0-3 2.6L14 25" />
    </svg>
  );
}
