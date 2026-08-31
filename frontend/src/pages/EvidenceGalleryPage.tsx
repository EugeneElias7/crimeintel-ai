import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { File, FileImage, FileVideo, Download, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import BackButton from '../components/ui/BackButton';
import EvidenceThumbnail from '../components/evidence/EvidenceThumbnail';
import { getEvidenceUrl } from '../utils/evidenceUrl';
import { listEvidence } from '../services/evidenceService';
import type { Evidence } from '../types/evidence';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  const t = fileType.toLowerCase();
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) {
    return <FileImage className="h-8 w-8 text-green-500" />;
  }
  if (t.includes('video') || t.includes('mp4') || t.includes('mov')) {
    return <FileVideo className="h-8 w-8 text-purple-500" />;
  }
  if (t.includes('pdf')) {
    return <File className="h-8 w-8 text-red-500" />;
  }
  return <File className="h-8 w-8 text-gray-500" />;
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

export default function EvidenceGalleryPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Evidence | null>(null);

  const fetchEvidence = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listEvidence(caseId);
      setEvidence(res);
    } catch {
      setError('Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  // Esc closes the preview modal first; only navigates back when no modal is open
  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPreview(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [preview]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton fallbackTo="/cases" label="Back to Cases" />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Evidence Gallery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Viewing all evidence for this case
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner text="Loading evidence..." />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={fetchEvidence}>Retry</Button>
        </div>
      ) : evidence.length === 0 ? (
        <EmptyState
          icon={<File size={48} />}
          title="No evidence"
          description="No evidence has been uploaded for this case yet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evidence.map((e) => (
            <Card key={e.evidence_id}>
              <div
                className="cursor-pointer"
                onClick={() => setPreview(e)}
              >
                <div className="mb-3 overflow-hidden rounded-lg bg-gray-50">
                  <EvidenceThumbnail evidence={e} />
                </div>
                <p className="truncate text-sm font-medium text-gray-900">
                  {e.file_name}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatFileSize(e.file_size)}</span>
                  <span>·</span>
                  <span>
                    {new Date(e.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                {e.description && (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {e.description}
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                <a
                  href={getEvidenceUrl(e)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Download size={14} />
                  Download
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[90vh] max-w-3xl overflow-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {preview.file_name}
              </h3>
              <button
                onClick={() => setPreview(null)}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            {isImageType(preview.file_type) ? (
              <img
                src={getEvidenceUrl(preview)}
                alt={preview.file_name}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ) : isVideoType(preview.file_type) ? (
              <video controls className="max-h-[70vh] w-full rounded-lg">
                <source src={getEvidenceUrl(preview)} type={preview.file_type} />
              </video>
            ) : (
              <div className="flex flex-col items-center py-12">
                {getFileIcon(preview.file_type)}
                <p className="mt-4 text-sm text-gray-500">
                  Preview not available
                </p>
                <a
                  href={getEvidenceUrl(preview)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="mt-4">
                    <Download size={16} />
                    Download File
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
