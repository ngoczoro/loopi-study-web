import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

export async function uploadFlashcardImage(file) {
  try {
    const body = new FormData();
    body.append("image", file);
    const response = await api.post("/flashcards/images", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Could not upload that image."),
    };
  }
}

export async function suggestPronunciations(text, { signal } = {}) {
  try {
    const response = await api.post(
      "/flashcards/pronunciations",
      { text, lang: "en" },
      { signal },
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
      return { success: false, canceled: true };
    }
    return {
      success: false,
      message: getApiErrorMessage(error, "Could not suggest a pronunciation."),
    };
  }
}
