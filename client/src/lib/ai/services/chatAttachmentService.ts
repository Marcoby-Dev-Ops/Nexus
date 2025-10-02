import { getAuthHeaders } from '@/lib/api-client';
import type { FileAttachment } from '@/shared/types/chat';

interface UploadAttachmentsOptions {
  conversationId: string;
  messageId?: string;
  files: File[];
}

interface AttachmentApiResponse {
  success: boolean;
  data?: Array<{
    id: string;
    conversationId: string;
    messageId?: string | null;
    name: string;
    type: string;
    size: number;
    createdAt: string;
    url: string;
  }>;
  error?: string;
}

async function uploadAttachments({
  conversationId,
  messageId,
  files,
}: UploadAttachmentsOptions): Promise<FileAttachment[]> {
  if (!files.length) {
    return [];
  }

  const formData = new FormData();
  formData.append('conversationId', conversationId);
  if (messageId) {
    formData.append('messageId', messageId);
  }

  files.forEach((file) => {
    formData.append('files', file);
  });

  const headers = await getAuthHeaders();
  if ('Content-Type' in headers) {
    delete headers['Content-Type'];
  }

  const response = await fetch('/api/chat/attachments', {
    method: 'POST',
    headers,
    body: formData,
  });

  let payload: AttachmentApiResponse;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error('Failed to parse attachment upload response');
  }

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || 'Failed to upload attachments');
  }

  return payload.data.map<FileAttachment>((item) => ({
    id: item.id,
    name: item.name,
    size: item.size,
    type: item.type,
    url: item.url,
    downloadUrl: item.url,
    status: 'uploaded',
  }));
}

export const chatAttachmentService = {
  uploadAttachments,
};
