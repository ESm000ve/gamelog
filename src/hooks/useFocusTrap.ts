import { useEffect } from "react";

/**
 * A hook that traps focus within a specific DOM element.
 * Useful for modals, dialogs, and side sheets.
 * It also restores focus to the previously active element when unmounted.
 */
export function useFocusTrap(
  ref: React.RefObject<any>,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const container = ref.current as HTMLElement;
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    // Get all focusable elements inside the container
    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => {
        // Ensure the element is actually visible
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement || document.activeElement === container) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    // Initial focus on the container or first element
    // setTimeout is needed because the dialog might be rendering and animating
    const focusTimeout = setTimeout(() => {
        const focusableElements = getFocusableElements();
        // If the container itself has tabIndex={-1}, we can focus it directly
        if (container.hasAttribute('tabindex')) {
            container.focus();
        } else if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }, 10);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus
      if (previouslyFocusedElement && document.body.contains(previouslyFocusedElement)) {
        // Also use timeout to restore focus just in case the modal closing animation
        // interferes with focus restoring.
        setTimeout(() => {
             previouslyFocusedElement.focus();
        }, 10);
      }
    };
  }, [isActive, ref]);
}
