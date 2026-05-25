/**
 * Unwrap { success, data, message } service responses for React Query.
 * @throws {Error}
 */
export function unwrapServiceResult(result, fallbackMessage = "Request failed") {
  if (result?.success) {
    return result.data;
  }
  throw new Error(result?.message || fallbackMessage);
}
