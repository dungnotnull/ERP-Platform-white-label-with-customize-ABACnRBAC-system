import { useEffect, useState } from "react";

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export const MOBILE_BREAKPOINT = 767;
export const TABLET_BREAKPOINT = 1024;

const useResponsive = () => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const width = windowSize.width ?? 0;

  const isMobile = isMounted && width < MOBILE_BREAKPOINT;
  const isTablet =
    isMounted && width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
  const isDesktop = isMounted && width >= TABLET_BREAKPOINT;
  const isTouchDevice =
    isMounted && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const isMobileBrowser =
    isMounted &&
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isMobileBrowser,
    windowSize,
    isMounted
  };
};

export default useResponsive;
