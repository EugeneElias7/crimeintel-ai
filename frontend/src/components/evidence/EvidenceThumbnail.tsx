import { useEffect, useState } from 'react';
import { File, FileImage, FileVideo } from 'lucide-react';
import type { Evidence } from '../../types/evidence';

function getAuthHeaders(): Record<string, string> {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('crimeintel_token');

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function isImageType(fileType: string) {
  return (
    fileType.toLowerCase().includes('image') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp'].some((ext) =>
      fileType.toLowerCase().includes(ext),
    )
  );
}

function isVideoType(fileType: string) {
  return (
    fileType.toLowerCase().includes('video') ||
    ['mp4', 'mov', 'avi', 'webm'].some((ext) =>
      fileType.toLowerCase().includes(ext),
    )
  );
}

function isPdfType(fileType: string) {
  return fileType.toLowerCase().includes('pdf');
}

function createFallbackPreviewSvg(label: string, color: string) {
  const safeLabel = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f8fafc"/>
      <rect x="50" y="60" width="700" height="480" rx="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
      <rect x="150" y="190" width="500" height="160" rx="20" fill="${color}" opacity="0.12"/>
      <text x="400" y="240" font-family="Segoe UI, Arial" font-size="90" text-anchor="middle" fill="${color}" font-weight="700">📄</text>
      <text x="400" y="340" font-family="Segoe UI, Arial" font-size="36" text-anchor="middle" fill="#334155">${safeLabel}</text>
    </svg>
  `)}`;
}

export default function EvidenceThumbnail({ evidence }: { evidence: Evidence }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchThumb = async () => {
      try {
        const response = await fetch(`/api/v1/evidence/${evidence.evidence_id}/file`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          return;
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setThumbUrl(objectUrl);
      } catch {
        setThumbUrl(null);
      }
    };

    if (!isImageType(evidence.file_type) && !isVideoType(evidence.file_type) && !isPdfType(evidence.file_type)) {
      setThumbUrl(null);
      return undefined;
    }

    fetchThumb();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [evidence.evidence_id, evidence.file_type]);

  if (thumbUrl && isImageType(evidence.file_type)) {
    return (
      <img
        src={thumbUrl}
        alt={evidence.file_name}
        className="h-48 w-full rounded-lg object-cover"
      />
    );
  }

  if (thumbUrl && isVideoType(evidence.file_type)) {
    return (
      <video
        src={thumbUrl}
        muted
        playsInline
        preload="metadata"
        className="h-48 w-full rounded-lg object-cover"
      />
    );
  }

  if (thumbUrl && isPdfType(evidence.file_type)) {
    return (
      <iframe
        src={thumbUrl}
        title={evidence.file_name}
        className="h-48 w-full rounded-lg border border-slate-200 bg-white"
      />
    );
  }

  if (isImageType(evidence.file_type)) {
    return (
      <img
        src={createFallbackPreviewSvg(evidence.file_name, '#10b981')}
        alt={evidence.file_name}
        className="h-48 w-full rounded-lg object-cover"
      />
    );
  }

  if (isVideoType(evidence.file_type)) {
    return (
      <img
        src={createFallbackPreviewSvg(evidence.file_name, '#8b5cf6')}
        alt={evidence.file_name}
        className="h-48 w-full rounded-lg object-cover"
      />
    );
  }

  if (isPdfType(evidence.file_type)) {
    return (
      <img
        src={createFallbackPreviewSvg(evidence.file_name, '#ef4444')}
        alt={evidence.file_name}
        className="h-48 w-full rounded-lg object-cover"
      />
    );
  }

  const fallbackIcon =
    isImageType(evidence.file_type) ? (
      <FileImage className="h-8 w-8 text-green-500" />
    ) : isVideoType(evidence.file_type) ? (
      <FileVideo className="h-8 w-8 text-purple-500" />
    ) : (
      <File className="h-8 w-8 text-gray-500" />
    );

  return (
    <div className="flex h-48 w-full items-center justify-center rounded-lg bg-slate-50">
      {fallbackIcon}
    </div>
  );
}
