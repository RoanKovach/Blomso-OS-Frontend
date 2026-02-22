/**
 * Normalizes various error formats into a single, user-friendly string.
 *
 * @param {any} error - The error object, which can be an instance of Error, an API response, or a string.
 * @returns {string} A user-friendly error message.
 */
export const handleApiError = (error) => {
  if (!error) {
    return "An unknown error occurred.";
  }

  // If the error has a response object (common in API errors)
  if (error.response && error.response.data) {
    if (typeof error.response.data.error === 'string') {
      return error.response.data.error;
    }
    if (typeof error.response.data.message === 'string') {
      return error.response.data.message;
    }
  }

  // If the error has a message property
  if (typeof error.message === 'string' && error.message.length > 0) {
    // Avoid generic "An error occurred" if more specific info is available
    if (error.message.toLowerCase().includes('failed to fetch')) {
      return "Network error: Could not connect to the server. Please check your connection.";
    }
    return error.message;
  }

  // If the error is just a string
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for other cases
  return "An unexpected error occurred. Please try again.";
};