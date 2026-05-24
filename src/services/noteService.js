import api from "./api";

/**
 * Get all notes for the current user
 * @returns {Promise}
 */
export const getNotesAPI = async () => {
  try {
    const response = await api.get("/notes");

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching notes:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch notes",
      error: error.response?.data,
    };
  }
};

/**
 * Create a new note
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @param {string} subjectId - Subject ID (optional, format: "s5" -> 5)
 * @param {boolean} isPinned - Whether note is pinned (optional)
 * @returns {Promise}
 */
export const createNoteAPI = async (
  title,
  content,
  subjectId = null,
  isPinned = false,
) => {
  try {
    // Convert subjectId from "s5" format to number 5
    let parsedSubjectId = null;
    if (subjectId) {
      if (typeof subjectId === "string") {
        parsedSubjectId = Number(subjectId.replace(/[^0-9]/g, ""));
      } else {
        parsedSubjectId = Number(subjectId);
      }
      // Validate it's a valid number
      if (isNaN(parsedSubjectId)) {
        parsedSubjectId = null;
      }
    }

    const response = await api.post("/notes", {
      title,
      content,
      subjectId: parsedSubjectId,
      isPinned,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating note:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create note",
      error: error.response?.data,
    };
  }
};

/**
 * Update an existing note
 * @param {string} noteId - Note ID
 * @param {object} updateData - Data to update (title, content, subjectId, isPinned)
 * @returns {Promise}
 */
export const updateNoteAPI = async (noteId, updateData) => {
  try {
    // Convert subjectId from "s5" format to number 5 if present
    const processedData = { ...updateData };

    if (
      processedData.subjectId !== undefined &&
      processedData.subjectId !== null
    ) {
      if (typeof processedData.subjectId === "string") {
        processedData.subjectId = Number(
          processedData.subjectId.replace(/[^0-9]/g, ""),
        );
      } else {
        processedData.subjectId = Number(processedData.subjectId);
      }
      // Validate it's a valid number
      if (isNaN(processedData.subjectId)) {
        processedData.subjectId = null;
      }
    }

    const response = await api.put(`/notes/${noteId}`, processedData);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating note:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update note",
      error: error.response?.data,
    };
  }
};

/**
 * Delete a note
 * @param {string} noteId - Note ID
 * @returns {Promise}
 */
export const deleteNoteAPI = async (noteId) => {
  try {
    const response = await api.delete(`/notes/${noteId}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting note:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete note",
      error: error.response?.data,
    };
  }
};
