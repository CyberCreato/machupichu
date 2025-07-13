// Fix for ResizeObserver loop warnings
// This is a common issue with responsive charts and dynamic content

export const suppressResizeObserverLoopError = () => {
  // Store the original error handler
  const originalError = console.error;

  // Override console.error to filter out ResizeObserver warnings
  console.error = (...args: any[]) => {
    // Check if the error is the ResizeObserver loop warning
    if (
      args.length > 0 &&
      typeof args[0] === "string" &&
      args[0].includes(
        "ResizeObserver loop completed with undelivered notifications",
      )
    ) {
      // Suppress this specific warning
      return;
    }

    // For all other errors, use the original handler
    originalError.apply(console, args);
  };

  // Return a cleanup function to restore original error handling
  return () => {
    console.error = originalError;
  };
};

// Debounced resize observer for custom components
export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 100,
): ResizeObserver => {
  let timeoutId: NodeJS.Timeout;

  const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        callback(entries, observer);
      } catch (error) {
        // Suppress ResizeObserver errors
        if (
          error instanceof Error &&
          error.message.includes("ResizeObserver loop")
        ) {
          return;
        }
        console.error("ResizeObserver error:", error);
      }
    }, delay);
  };

  return new ResizeObserver(debouncedCallback);
};
