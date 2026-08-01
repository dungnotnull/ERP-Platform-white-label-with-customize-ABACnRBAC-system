export function JapanFlag() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      className="w-5 h-3.5 rounded-sm shadow-sm"
    >
      <defs>
        <clipPath id="a">
          <path fillOpacity=".7" d="M-88.6 32h640v480h-640z" />
        </clipPath>
      </defs>
      <g
        fillRule="evenodd"
        clipPath="url(#a)"
        transform="translate(88.6 -32)"
        strokeWidth="1pt"
      >
        <path fill="#fff" d="M-128 32h720v480h-720z" />
        <circle
          cx="523.1"
          cy="344.1"
          r="194.9"
          fill="#bc002d"
          transform="translate(-168.4 8.6) scale(.76554)"
        />
      </g>
    </svg>
  );
}
