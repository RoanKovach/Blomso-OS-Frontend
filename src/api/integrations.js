/**
 * Core integrations via REST: UploadFile, InvokeLLM, etc.
 * When API is not configured, throws.
 */

import { apiPost, apiPostForm, isApiConfigured } from './client.js';

async function uploadFile({ file }) {
  if (!isApiConfigured()) {
    throw new Error('API not configured. Set VITE_API_URL to use file upload.');
  }
  const formData = new FormData();
  formData.append('file', file);
  const result = await apiPostForm('/integrations/upload', formData);
  return result?.file_url ? result : { file_url: result?.url ?? result };
}

async function invokeLLM(params) {
  if (!isApiConfigured()) {
    throw new Error('API not configured. Set VITE_API_URL to use LLM.');
  }
  const result = await apiPost('/integrations/llm', params);
  return typeof result === 'string' ? result : (result?.content ?? result?.text ?? result?.data ?? JSON.stringify(result));
}

async function sendEmail(params) {
  if (!isApiConfigured()) throw new Error('API not configured.');
  return apiPost('/integrations/email', params);
}

async function generateImage(params) {
  if (!isApiConfigured()) throw new Error('API not configured.');
  return apiPost('/integrations/image', params);
}

async function extractDataFromUploadedFile(params) {
  if (!isApiConfigured()) throw new Error('API not configured.');
  return apiPost('/integrations/extract', params);
}

async function createFileSignedUrl(params) {
  if (!isApiConfigured()) throw new Error('API not configured.');
  return apiPost('/integrations/signed-url', params);
}

async function uploadPrivateFile(params) {
  if (!isApiConfigured()) throw new Error('API not configured.');
  const formData = new FormData();
  if (params?.file) formData.append('file', params.file);
  return apiPostForm('/integrations/upload-private', formData);
}

export const Core = {
  UploadFile: uploadFile,
  InvokeLLM: invokeLLM,
  SendEmail: sendEmail,
  GenerateImage: generateImage,
  ExtractDataFromUploadedFile: extractDataFromUploadedFile,
  CreateFileSignedUrl: createFileSignedUrl,
  UploadPrivateFile: uploadPrivateFile,
};

export const InvokeLLM = invokeLLM;
export const SendEmail = sendEmail;
export const UploadFile = uploadFile;
export const GenerateImage = generateImage;
export const ExtractDataFromUploadedFile = extractDataFromUploadedFile;
export const CreateFileSignedUrl = createFileSignedUrl;
export const UploadPrivateFile = uploadPrivateFile;
