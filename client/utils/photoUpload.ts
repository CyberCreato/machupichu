interface UploadPhotoParams {
  staffId: string;
  jobId: string;
  category: "before" | "after" | "traffic" | "general";
  file: File;
  notes?: string;
}

interface UploadPhotoResponse {
  id: string;
  jobId: string;
  staffId: string;
  category: string;
  url: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
  notes: string;
  size: number;
  mimetype: string;
}

export async function uploadPhoto(
  params: UploadPhotoParams,
): Promise<UploadPhotoResponse> {
  const { staffId, jobId, category, file, notes = "" } = params;

  const formData = new FormData();
  formData.append("photo", file);
  formData.append("jobId", jobId);
  formData.append("category", category);
  formData.append("notes", notes);

  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api/staff/${staffId}/photos`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Upload failed" }));
    throw new Error(
      errorData.error || `Upload failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function uploadMultiplePhotos(
  params: Omit<UploadPhotoParams, "file"> & { files: Record<string, File> },
): Promise<UploadPhotoResponse[]> {
  const { files, ...baseParams } = params;

  const uploadPromises = Object.entries(files).map(([category, file]) =>
    uploadPhoto({
      ...baseParams,
      category: category as "before" | "after" | "traffic" | "general",
      file,
    }),
  );

  return Promise.all(uploadPromises);
}
