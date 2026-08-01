import { useCallback } from "react";

interface UseKeyboardNavigationProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  filteredOptionsLength: number;
  focusedIndex: number;
  setFocusedIndex: (index: number | ((prev: number) => number)) => void;
  onSelect: (index: number) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}

export const useKeyboardNavigation = ({
  isOpen,
  setIsOpen,
  filteredOptionsLength,
  focusedIndex,
  setFocusedIndex,
  onSelect,
  triggerRef,
  onToggle
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(prev =>
            prev < filteredOptionsLength - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptionsLength - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0) {
            onSelect(focusedIndex);
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    },
    [
      isOpen,
      filteredOptionsLength,
      focusedIndex,
      setFocusedIndex,
      onSelect,
      setIsOpen,
      triggerRef,
      onToggle
    ]
  );

  return { handleKeyDown };
};
