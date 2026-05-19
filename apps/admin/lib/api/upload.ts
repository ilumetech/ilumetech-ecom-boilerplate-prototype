import { apiClient } from "./client";

export const uploadApi = {
  uploadImage: async (
    file: File,
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },
};
