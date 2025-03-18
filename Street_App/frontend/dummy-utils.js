/**
 * Dummy utils module to satisfy imports regardless of path resolution
 */

// This is the main function used by all components
export function cn(...inputs) {
  // Simply join the classnames or return empty string if no inputs
  return inputs.filter(Boolean).join(' ');
}

// Export everything as a noop to prevent further errors
export default {
  cn
}; 