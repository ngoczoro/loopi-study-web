import api from "./api";

/**
 * Register new user
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @returns {Promise}
 */
export const registerAPI = async (
  email,
  password,
  confirmPassword,
  fullName,
) => {
  try {
    console.log({
      email,
      password,
      confirmPassword,
      fullName,
    });

    const response = await api.post("/auth/register", {
      email,
      password,
      confirmPassword,
      fullName,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.log(error.response?.data);

    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
      error: error.response?.data,
    };
  }
};
/**
 * Verify OTP
 * @param {string} email
 * @param {string} otp
 * @returns {Promise}
 */
export const verifyOTPAPI = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-otp", {
      email,
      otp,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "OTP verification failed",
      error: error.response?.data,
    };
  }
};

/**
 * Resend OTP
 * @param {string} email
 * @param {string} type - "REGISTER" or "FORGOT_PASSWORD"
 * @returns {Promise}
 */
export const resendOTPAPI = async (email, type) => {
  try {
    const response = await api.post("/auth/resend-otp", {
      email,
      type,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Resend OTP failed",
      error: error.response?.data,
    };
  }
};

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
export const loginAPI = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
      error: error.response?.data,
    };
  }
};

/**
 * Logout user
 * @returns {Promise}
 */
export const logoutAPI = async () => {
  try {
    const response = await api.post("/auth/logout");
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    // Even if logout fails on backend, clear local tokens
    return {
      success: false,
      message: error.response?.data?.message || "Logout failed",
    };
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken
 * @returns {Promise}
 */
export const refreshTokenAPI = async (refreshToken) => {
  try {
    const response = await api.post("/auth/refresh-token", {
      refreshToken,
    });
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Token refresh failed",
      error: error.response?.data,
    };
  }
};

/**
 * Forgot password - request OTP
 * @param {string} email
 * @returns {Promise}
 */
export const forgotPasswordAPI = async (email) => {
  try {
    const response = await api.post("/password/forgot", { email });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Forgot password request failed",
      error: error.response?.data,
    };
  }
};

/**
 * Verify OTP for password reset (Check only)
 * @param {string} email
 * @param {string} otp
 * @returns {Promise}
 */
export const verifyResetOTPAPI = async (email, otp) => {
  try {
    const response = await api.post("/password/verify", { email, otp });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "OTP verification failed",
      error: error.response?.data,
    };
  }
};

/**
 * Reset password with OTP
 * @param {string} email
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise}
 */
export const resetPasswordAPI = async (
  email,
  otp,
  newPassword,
  confirmPassword,
) => {
  try {
    const response = await api.post("/password/reset", {
      email,
      otp,
      newPassword,
      confirmPassword,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Reset password failed",
      error: error.response?.data,
    };
  }
};
