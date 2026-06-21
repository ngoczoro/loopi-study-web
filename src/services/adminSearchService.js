import api from "./api";

export const adminGlobalSearch = async (query) => {
  try {
    const response = await api.get("/admin/search", {
      params: { q: String(query ?? "").trim() },
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to search",
      status: error.response?.status,
      error: error.response?.data,
    };
  }
};
