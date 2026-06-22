import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const listGoals = async (params = {}) => {
  try {
    const response = await api.get("/goals", { params });
    return {
      success: true,
      data: response.data.data ?? [],
    };
  } catch (error) {
    console.error("Error fetching goals:", error);
    return handleError(error, "Failed to load goals");
  }
};

export const createGoal = async (payload) => {
  try {
    const response = await api.post("/goals", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating goal:", error);
    return handleError(error, "Failed to create goal");
  }
};

export const updateGoal = async (id, payload) => {
  try {
    const response = await api.patch(`/goals/${id}`, payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating goal:", error);
    return handleError(error, "Failed to update goal");
  }
};

export const deleteGoal = async (id) => {
  try {
    const response = await api.delete(`/goals/${id}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting goal:", error);
    return handleError(error, "Failed to delete goal");
  }
};
