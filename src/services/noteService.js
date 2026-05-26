import {
  getContent,
  createNote,
  updateContent,
  deleteContent,
} from "./contentService";
import { mapContentItemForUI, mapContentListForUI } from "../lib/content-utils";

const toServiceResult = (result, fallbackMessage) => {
  if (result.ok) {
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  }
  return {
    success: false,
    message: result.message || fallbackMessage,
    error: result.error,
  };
};

export const getNotesAPI = async () => {
  const result = await getContent({ type: "note" });
  if (result.ok) {
    return {
      success: true,
      data: mapContentListForUI(result.data),
      message: result.message,
    };
  }
  return toServiceResult(result, "Failed to fetch notes");
};

export const createNoteAPI = async (
  title,
  content,
  subjectId = null,
  isPinned = false,
) => {
  const result = await createNote({
    title,
    content,
    subjectId: subjectId || null,
    isPinned,
  });

  if (result.ok) {
    return {
      success: true,
      data: mapContentItemForUI(result.data),
      message: result.message,
    };
  }
  return toServiceResult(result, "Failed to create note");
};

export const updateNoteAPI = async (noteId, updateData) => {
  const result = await updateContent(noteId, updateData);
  if (result.ok) {
    return {
      success: true,
      data: mapContentItemForUI(result.data),
      message: result.message,
    };
  }
  return toServiceResult(result, "Failed to update note");
};

export const deleteNoteAPI = async (noteId) => {
  const result = await deleteContent(noteId);
  if (result.ok) {
    return {
      success: true,
      message: result.message,
    };
  }
  return toServiceResult(result, "Failed to delete note");
};
