import api from "./api";
import { normalizeSubjectId } from "../lib/content-utils.js";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleResponse = (response) => ({
  ok: true,
  data: response.data.data,
  message: response.data.message,
});

const handleError = (error, fallback) => ({
  ok: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const getContent = async (params = {}) => {
  try {
    const response = await api.get("/content", { params });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching content:", error);
    return handleError(error, "Failed to fetch content");
  }
};

export const getContentById = async (id) => {
  try {
    const response = await api.get(`/content/${id}`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching content item:", error);
    return handleError(error, "Failed to fetch content");
  }
};

export const getContentBySubject = async (subjectId) => {
  try {
    const response = await api.get(`/content/subject/${subjectId}`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching subject content:", error);
    return handleError(error, "Failed to fetch subject content");
  }
};

export const getTextPreview = async (id) => {
  const response = await api.get(`/content/${id}/text-preview`);
  return response.data.data;
};

export const getDocPreview = async (id) => {
  const response = await api.get(`/content/${id}/doc-preview`);
  return response.data.data;
};

export const getExcelPreview = async (id) => {
  const response = await api.get(`/content/${id}/excel-preview`);
  return response.data.data;
};

export const createNote = async ({ title, content, description, subjectId, isPinned }) => {
  try {
    const response = await api.post("/content", {
      type: "note",
      title,
      content,
      description: description || undefined,
      subjectId: normalizeSubjectId(subjectId),
      isPinned: isPinned ?? undefined,
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error creating note:", error);
    return handleError(error, "Failed to create note");
  }
};

export const createLink = async ({ title, content, description, subjectId }) => {
  try {
    const response = await api.post("/content", {
      type: "link",
      title,
      content,
      description: description || undefined,
      subjectId: normalizeSubjectId(subjectId),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error creating link:", error);
    return handleError(error, "Failed to create link");
  }
};

export const uploadFile = async (formData) => {
  try {
    const response = await api.post("/content/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error uploading file:", error);
    return handleError(error, "Failed to upload file");
  }
};

export const updateContent = async (id, payload, replacementFile = null) => {
  try {
    if (replacementFile) {
      const formData = new FormData();
      formData.append("file", replacementFile);

      if (payload.title !== undefined) {
        formData.append("title", payload.title);
      }
      if (payload.content !== undefined) {
        formData.append("content", payload.content);
      }
      if (payload.description !== undefined) {
        formData.append("description", payload.description ?? "");
      }
      if (payload.subjectId !== undefined) {
        formData.append(
          "subjectId",
          normalizeSubjectId(payload.subjectId) ?? "",
        );
      }
      if (payload.isPinned !== undefined) {
        formData.append("isPinned", String(payload.isPinned));
      }

      const response = await api.put(`/content/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return handleResponse(response);
    }

    const body = { ...payload };
    if (body.subjectId !== undefined) {
      body.subjectId = normalizeSubjectId(body.subjectId);
    }
    const response = await api.put(`/content/${id}`, body);
    return handleResponse(response);
  } catch (error) {
    console.error("Error updating content:", error);
    return handleError(error, "Failed to update content");
  }
};

export const deleteContent = async (id) => {
  try {
    const response = await api.delete(`/content/${id}`);
    return {
      ok: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting content:", error);
    return handleError(error, "Failed to delete content");
  }
};
