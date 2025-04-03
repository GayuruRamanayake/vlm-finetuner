import axios from 'axios';

const API_URL = 'http://localhost:5000';
const API_URL2 = 'https://4pwidgomv5jcc5-4000.proxy.runpod.net';

// Define TypeScript interfaces for API responses
export interface Model {
  id: string;
  size: string;
  tags: string[];
  likes: number;
  downloads: number;
}

interface SearchModelsResponse {
  models: Model[];
  total: number;
}

interface DownloadModelResponse {
  message: string;
}

interface CheckModelAccessResponse {
  restricted: boolean;
  has_access: boolean;
  message?: string;
  action?: string;
}

interface VqaResponse {
  answer: string;
}

interface VqaHistoryEntry {
  id: number;
  image_base64: string;
  question: string;
  answer: string;
  timestamp: string;
}

interface VqaHistoryResponse {
  history: VqaHistoryEntry[];
}

interface SystemInfoResponse {
  timestamp: string;
  cpu_usage_percent: number;
  cpu_usage_label: string;
  memory_total_gb: number;
  memory_used_gb: number;
  memory_remaining_gb: number;
  memory_percent: number;
  disk_total_gb: number;
  disk_used_gb: number;
  disk_remaining_gb: number;
  disk_percent: number;
}

interface FineTuneResponse {
  task_id: string;
  status: string;
}

interface ModelsResponse {
  models: string[];
}

interface DeleteModelResponse {
  message: string;
}

interface DeleteVqaHistoryResponse {
  message: string;
}

interface ClearVqaHistoryResponse {
  message: string;
}

interface UploadImageFolderResponse {
  message: string;
}

interface GetNextImageResponse {
  done?: boolean;
  message?: string;
  image_path?: string;
  caption?: string;
  total?: number;
}

interface SaveCaptionRequest {
  caption: string;
  image_path: string;
}

interface SaveCaptionResponse {
  message: string;
}

interface DownloadDatasetResponse {
  message?: string;
}

interface GetJsonResponse {
  data: any;
}

interface ClearDataResponse {
  message: string;
}

// Helper function to handle API errors
const handleApiError = (error: any): never => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || error.message;
    throw new Error(`API Error: ${message}`);
  }
  throw new Error(`Unexpected Error: ${error.message || String(error)}`);
};

// Perform VQA (Vision Question Answering)
export const performVqa = async (
  model: string,
  image: File | null,
  question: string,
  apiKey?: string,
  apiType?: 'gemini' | 'openai'
): Promise<VqaResponse> => {
  const formData = new FormData();
  formData.append('model', model);
  formData.append('question', question);
  if (image) {
    formData.append('image', image);
  }
  if (apiKey && apiType) {
    formData.append('api_key', apiKey);
    formData.append('api_type', apiType);
  }
  try {
    const response = await axios.post(`${API_URL}/vqa`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Fetch list of downloaded models
export const fetchModels = async (): Promise<ModelsResponse> => {
  try {
    const response = await axios.get(`${API_URL2}/models`);
    return response.data; 
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a model
export const deleteModel = async (model: string): Promise<DeleteModelResponse> => {
  try {
    const response = await axios.post(`${API_URL}/delete-model`, { model });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Fetch VQA history
export const fetchVqaHistory = async (): Promise<VqaHistoryResponse> => {
  try {
    const response = await axios.get(`${API_URL}/vqa/history`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a specific VQA history entry
export const deleteVqaHistory = async (historyId: number): Promise<DeleteVqaHistoryResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/vqa/history/delete/${historyId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Clear all VQA history
export const clearVqaHistory = async (): Promise<ClearVqaHistoryResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/vqa/history/clear`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Test API key for Gemini or OpenAI
export const testApiKey = async (apiKey: string, apiType: 'gemini' | 'openai'): Promise<VqaResponse> => {
  const formData = new FormData();
  formData.append('api_key', apiKey);
  formData.append('api_type', apiType);
  formData.append('question', 'Test question');
  try {
    const response = await axios.post(`${API_URL}/vqa`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Download a model from Hugging Face
export const downloadModel = async (model: string, token?: string): Promise<DownloadModelResponse> => {
  try {
    console.log('Sending download request:', { model, token });
    const response = await axios.post(
      `${API_URL}/download-model`,
      { model, token },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Check if a model is restricted and if the user has access
export const checkModelAccess = async (model: string, token?: string): Promise<CheckModelAccessResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/check-model-access`,
      { model, token },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Search for models on Hugging Face with pagination
export const searchModels = async (query: string, limit: number = 50, offset: number = 0): Promise<SearchModelsResponse> => {
  try {
    const response = await axios.get(`${API_URL}/search`, {
      params: { query, limit, offset },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Fetch system information
export const fetchSystemInfo = async (): Promise<SystemInfoResponse> => {
  try {
    const response = await axios.get(`${API_URL}/system-info`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Fine-tune a model
export const finetuneModel = async (modelName: string, dataset: string): Promise<FineTuneResponse> => {
  try {
    const payload = {
      model_name: modelName,
      dataset_path: dataset,
    }
    const response = await axios.post(`${API_URL2}/start-finetuning`, payload);
    return response.data;
  } catch (error) {
    return handleApiError(error); 
  }
};

export const fetchTaskStatus = async (taskId: string) => {
  const response = await axios.get(`https://4pwidgomv5jcc5-4000.proxy.runpod.net/status/${taskId}`);
  return response.data; // Assumes response.data = { status, progress, loss, learning_rate, epoch, error }
};

// Upload image folder for captioning
export const uploadImageFolder = async (formData: FormData): Promise<UploadImageFolderResponse> => {
  try {
    const response = await axios.post(`${API_URL}/upload-image-folder`, formData, {
      timeout: 60000, // 60 seconds
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get the next image for captioning
export const getNextImage = async (apiKey: string, apiType: string, model: string = 'google/gemma-3-12b-it:free'): Promise<GetNextImageResponse> => {
  try {
    const response = await axios.get(`${API_URL}/get-next-image`, {
      params: { api_key: apiKey, api_type: apiType, model },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Save the edited caption
export const saveCaption = async (request: SaveCaptionRequest): Promise<SaveCaptionResponse> => {
  try {
    const response = await axios.post(`${API_URL}/save-caption`, request);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Download the JSON file
export const downloadJson = async (): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_URL}/download-json`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Download the dataset as a ZIP file
export const downloadDataset = async (): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_URL}/download-dataset`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get the JSON data for preview
export const getJson = async (): Promise<GetJsonResponse> => {
  try {
    const response = await axios.get(`${API_URL}/get-json`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Clear all data
export const clearData = async (): Promise<ClearDataResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/clear-data`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};





export const sendChatbotMessage = async (
  message: string,
  apiKey: string,
  taskType: string,
  paramRangeMin: number,
  paramRangeMax: number,
  hardwareGpuMemory: number | null,
  preference: string | null
) => {
  const response = await axios.post(`${API_URL}/chatbot`, {
    message,
    api_key: apiKey,
    task_type: taskType,
    param_range_min: paramRangeMin,
    param_range_max: paramRangeMax,
    hardware_gpu_memory: hardwareGpuMemory, // Should be a number or null
    preference, // Should be a string or null
  });
  return response.data;
};