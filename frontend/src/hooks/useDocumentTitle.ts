import { useEffect } from "react";

export function useDocumentTitle(title: string, prevailOnUnmount = false) {
  const defaultTitle = "My React App";

  useEffect(() => {
    document.title = title ? `${title} | ${defaultTitle}` : defaultTitle;

    return () => {
      if (!prevailOnUnmount) {
        document.title = defaultTitle;
      }
    };
  }, [title, prevailOnUnmount]);
}
