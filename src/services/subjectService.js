import api from "./api";

/**
 * @typedef {Object} Subject
 * @property {string} id
 * @property {string} name
 * @property {number|null} credits
 * @property {"Easy"|"Medium"|"Hard"|null} difficulty
 * @property {string|null} examDate
 * @property {string|null} color
 * @property {number} progress
 * @property {"low"|"medium"|"high"|null} priority
 * @property {number|null} requiredHoursPerWeek
 */

/**
 * @typedef {Object} SubjectPayload
 * @property {string} name
 * @property {number} [credits]
 * @property {"Easy"|"Medium"|"Hard"} [difficulty]
 * @property {string} [examDate]
 * @property {string} [color]
 * @property {"low"|"medium"|"high"} [priority]
 * @property {number} [requiredHoursPerWeek]
 * @property {number} [progress]
 */

export const getSubjects = async () => {
  try {
    const response = await api.get("/subjects");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch subjects",
      error: error.response?.data,
    };
  }
};

export const getSubjectById = async (id) => {
  try {
    const response = await api.get(`/subjects/${id}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching subject:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch subject",
      error: error.response?.data,
    };
  }
};

export const createSubject = async (payload) => {
  try {
    const response = await api.post("/subjects", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating subject:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create subject",
      error: error.response?.data,
    };
  }
};

export const updateSubject = async (id, payload) => {
  try {
    const response = await api.put(`/subjects/${id}`, payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating subject:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update subject",
      error: error.response?.data,
    };
  }
};

export const deleteSubject = async (id) => {
  try {
    const response = await api.delete(`/subjects/${id}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting subject:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete subject",
      error: error.response?.data,
    };
  }
};
