import { abortUpload, completeUpload, getPartUrl, initiateUpload } from './drive-api';

export type UploadProgress = {
  stage: 'INIT' | 'UPLOADING' | 'COMPLETING' | 'DONE' | 'ERROR' | 'ABORTED';
  percent: number;
  message?: string;
};

export async function uploadFileMultipart(
  file: File,
  parentId: string,
  onProgress: (p: UploadProgress) => void
): Promise<{ fileNodeId: string }> {
  onProgress({ stage: 'INIT', percent: 0, message: 'Preparing upload…' });

  const init = await initiateUpload(parentId, file.name, String(file.size), file.type || undefined);
  const sessionId = init.upload?.sessionId || init.upload?.id || init.upload?.uploadSessionId;
  const partSize = Number(init.upload?.partSize || 8 * 1024 * 1024);
  const totalParts = Number(init.upload?.totalParts || Math.ceil(file.size / partSize));

  if (!sessionId) throw new Error('Upload sessionId missing from server response');

  const parts: { partNumber: number; etag: string }[] = [];
  onProgress({ stage: 'UPLOADING', percent: 1, message: 'Uploading…' });

  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      const presigned = await getPartUrl(sessionId, partNumber);
      const resp = await fetch(presigned.url, { method: 'PUT', body: chunk });

      if (!resp.ok) throw new Error(`Part upload failed (part ${partNumber}): ${resp.status}`);

      const etag = resp.headers.get('etag') || resp.headers.get('ETag') || '';
      parts.push({ partNumber, etag });

      const percent = Math.round((partNumber / totalParts) * 90);
      onProgress({ stage: 'UPLOADING', percent, message: `Uploaded part ${partNumber}/${totalParts}` });
    }

    onProgress({ stage: 'COMPLETING', percent: 95, message: 'Finalizing…' });
    await completeUpload(sessionId, parts);
    onProgress({ stage: 'DONE', percent: 100, message: 'Upload complete' });
    return { fileNodeId: init.fileNodeId };
  } catch (e) {
    try {
      await abortUpload(sessionId);
      onProgress({ stage: 'ABORTED', percent: 0, message: 'Upload aborted' });
    } catch {
      // ignore
    }
    onProgress({ stage: 'ERROR', percent: 0, message: (e as any)?.message || 'Upload failed' });
    throw e;
  }
}
