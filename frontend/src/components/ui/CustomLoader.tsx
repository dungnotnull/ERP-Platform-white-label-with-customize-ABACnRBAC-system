const CustomLoader = ({}) => {
  return (
    <div className="flex items-center justify-center min-h-[150px]">
      <div
        className="relative w-20 h-20 text-[#002D5A]"
        aria-label="Loading"
        role="status"
      >
        <div className="absolute inset-0 rounded-full blur-md opacity-20 bg-gradient-to-tr from-[#002D5A] via-[#0892A5] to-[#C9910D]"></div>

        <svg viewBox="0 0 120 120" className="relative w-full h-full">
          <g className="origin-center animate-[spin_8s_linear_infinite]">
            <circle
              cx="60"
              cy="60"
              r="54"
              className="fill-none"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.25"
            ></circle>

            <g
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            >
              <g className="origin-center">
                <line x1="60" y1="6" x2="60" y2="12"></line>
                <line x1="60" y1="108" x2="60" y2="114"></line>
                <line x1="6" y1="60" x2="12" y2="60"></line>
                <line x1="108" y1="60" x2="114" y2="60"></line>
              </g>

              <g>
                <g className="origin-center">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
                <g className="origin-center rotate-45">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
                <g className="origin-center rotate-90">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
                <g className="origin-center rotate-[135deg]">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
                <g className="origin-center rotate-[22.5deg]">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
                <g className="origin-center rotate-[67.5deg]">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
                <g className="origin-center rotate-[112.5deg]">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
                <g className="origin-center rotate-[157.5deg]">
                  <line x1="60" y1="8" x2="60" y2="12"></line>
                </g>
              </g>
            </g>
          </g>

          <g className="origin-center animate-[spin_5s_linear_infinite_reverse]">
            <polygon
              points="60,22 66,60 60,98 54,60"
              fill="#C9910D"
              opacity="0.95"
            ></polygon>
            <polygon
              points="22,60 60,66 98,60 60,54"
              fill="#0892A5"
              opacity="0.9"
            ></polygon>
            <circle
              cx="60"
              cy="60"
              r="6"
              fill="white"
              stroke="currentColor"
              strokeWidth="2"
            ></circle>
          </g>

          <g className="origin-center animate-[swing_1.8s_ease-in-out_infinite]">
            <line
              x1="60"
              y1="60"
              x2="60"
              y2="18"
              stroke="#C9910D"
              strokeWidth="3"
              strokeLinecap="round"
            ></line>
            <circle cx="60" cy="60" r="3" fill="#C9910D"></circle>
          </g>

          <g className="origin-center">
            <path
              d="M12 82 Q 24 76 36 82 T 60 82 T 84 82 T 108 82"
              fill="none"
              stroke="#0892A5"
              strokeWidth="3"
              className="animate-[waveDash_2.2s_linear_infinite]"
            ></path>
            <path
              d="M12 90 Q 24 84 36 90 T 60 90 T 84 90 T 108 90"
              fill="none"
              stroke="#4E3822"
              strokeWidth="2"
              opacity="0.4"
              className="animate-[waveDash_3s_linear_infinite, bob_2.4s_ease-in-out_infinite]"
            ></path>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default CustomLoader;
