export function isRateLimited(error) {
  return error?.response?.status === 429;
}

export function getApiErrorMessage(error, fallback = "Something went wrong") {
  if (isRateLimited(error)) {
    return "Too many requests. Please wait a moment.";
  }

  return error?.response?.data?.message || fallback;
}
