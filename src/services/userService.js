import api from "./api";

export const getMe = async () => {
  try {
    const response = await api.get("/users/me");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch profile",
      error: error.response?.data,
    };
  }
};

export const updateMe = async (payload) => {
  try {
    const response = await api.patch("/users/me", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update profile",
      error: error.response?.data,
    };
  }
};

export const getPreferences = async () => {
  try {
    const response = await api.get("/users/me/preferences");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch preferences",
      error: error.response?.data,
    };
  }
};

export const updatePreferences = async (payload) => {
  try {
    const response = await api.patch("/users/me/preferences", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update preferences",
      error: error.response?.data,
    };
  }
};

export const getBlockedSlots = async () => {
  try {
    const response = await api.get("/users/me/blocked-slots");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch blocked slots",
      error: error.response?.data,
    };
  }
};

export const replaceBlockedSlots = async (slots) => {
  try {
    const response = await api.put("/users/me/blocked-slots", { slots });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update blocked slots",
      error: error.response?.data,
    };
  }
};

export const changePassword = async (payload) => {
  try {
    const response = await api.post("/users/me/password", payload);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to change password",
      error: error.response?.data,
    };
  }
};
