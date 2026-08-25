import { useState, useEffect, useCallback, useRef } from 'react';
import {
  File,
  FileImage,
  FileVideo,
  Upload,
  Download,
  Trash2,
  Filter,
  X,
  AlertCircle,
  Image,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { listCases } from '../services/caseService';
import { listEvidence, uploadEvidence, deleteEvidence } from '../services/evidenceService';
import type { Evidence } from '../types/evidence';
import type { Case } from '../types/case';

type FileTypeFilter = 'all' | 'pdf' | 'image' | 'video';

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

function isPdfType(fileType: string) {
  return fileType.toLowerCase().includes('pdf');
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/mov', 'video/avi', 'video/webm'];

export default function EvidencePage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [sensitive, setSensitive] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<Evidence | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCases({ limit: 100 })
      .then((res) => setCases(res?.data || []))
      .catch(() => {});
  }, []);

  const fetchEvidence = useCallback(async () => {
    if (!selectedCaseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listEvidence(selectedCaseId);
      setEvidence(res.data);
    } catch {
      setError('Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const filteredEvidence = evidence.filter((e) => {
    if (fileTypeFilter === 'all') return true;
    if (fileTypeFilter === 'pdf') return isPdfType(e.file_type);
    if (fileTypeFilter === 'image') return isImageType(e.file_type);
    if (fileTypeFilter === 'video') return isVideoType(e.file_type);
    return true;
  });

  const handleUpload = async (file: File) => {
    if (!selectedCaseId) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: PNG, JPG, GIF, WebP, PDF, MP4, MOV, AVI, WebM');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 90));
    }, 300);

    try {
      await uploadEvidence(file, selectedCaseId, description || undefined, sensitive);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setDescription('');
        setSensitive(false);
        fetchEvidence();
      }, 500);
    } catch {
      clearInterval(interval);
      setUploadProgress(0);
      setUploadError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (evidenceId: string) => {
    try {
      await deleteEvidence(evidenceId);
      fetchEvidence();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage case evidence
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Select Case
            </label>
            <select
              className="input-field w-full"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
            >
              <option value="">Choose a case...</option>
              {cases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {uploadProgress > 0 && (
        <Card className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </Card>
      )}

      {selectedCaseId && (
        <>
          <Card className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Upload Evidence
            </h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Upload className="mb-3 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Drop files here or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG, GIF, WebP, PDF, MP4, MOV, AVI, WebM (max 50MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.mp4,.mov,.avi,.webm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Browse Files
              </Button>
            </div>

            {uploadError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                <AlertCircle size={16} />
                {uploadError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  className="input-field w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of evidence"
                />
              </div>
              <div className="flex items-end">
                <label className="gradient-border flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm transition-shadow hover:shadow-md hover:shadow-blue-100">
                  <input
                    type="checkbox"
                    checked={sensitive}
                    onChange={(e) => setSensitive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Sensitive</span>
                </label>
              </div>
            </div>
          </Card>

          <div className="mb-4 flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            {(['all', 'pdf', 'image', 'video'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFileTypeFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  fileTypeFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
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
          ) : filteredEvidence.length === 0 ? (
            <EmptyState
              icon={<Image size={48} />}
              title="No evidence uploaded yet"
              description="Upload documents, images, or videos as evidence."
              action={{
                label: 'Browse Files',
                onClick: () => fileInputRef.current?.click(),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvidence.map((e) => (
                <Card key={e.evidence_id}>
                  <div
                    className="cursor-pointer"
                    onClick={() => setPreview(e)}
                  >
                    <div className="mb-3 flex items-center justify-center rounded-lg bg-gray-50 py-6">
                      {getFileIcon(e.file_type)}
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
                    <div className="mt-2 flex items-center gap-2">
                      {e.sensitive && (
                        <Badge variant="critical">Sensitive</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        by {e.uploaded_by.display_name}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                    <a
                      href={e.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Download size={14} />
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(e.evidence_id)}
                      className="ml-auto flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!selectedCaseId && (
        <EmptyState
          icon={<File size={48} />}
          title="Select a case"
          description="Choose a case from the dropdown above to view its evidence."
        />
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
                src={preview.file_url}
                alt={preview.file_name}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ) : isVideoType(preview.file_type) ? (
              <video
                controls
                className="max-h-[70vh] w-full rounded-lg"
              >
                <source src={preview.file_url} type={preview.file_type} />
              </video>
            ) : (
              <div className="flex flex-col items-center py-12">
                {getFileIcon(preview.file_type)}
                <p className="mt-4 text-sm text-gray-500">
                  Preview not available
                </p>
                <a
                  href={preview.file_url}
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
