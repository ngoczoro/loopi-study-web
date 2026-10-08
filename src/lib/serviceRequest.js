import { getApiErrorMessage } from "./apiErrorUtils.js";
import { isMockEnabled, mockDelay } from "../mocks/mockUtils.js";

/**
 * Run an API call, or its mock when VITE_USE_MOCKS=true.
 * Always resolves to { success, data, message } like the other services.
 */
export async function callService({ mock, request, fallback }) {
  if (mock && isMockEnabled()) {
    await mockDelay();
    try {
      return { success: true, data: structuredClone(mock() ?? null) };
    } catch (error) {
      return {
        success: false,
        message: error.message || fallback,
        error: { status: error.status },
      };
    }
  }

  try {
    const response = await request();
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, fallback),
      error: error.response?.data,
    };
  }
}
