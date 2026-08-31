import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadVerificationDocument, getVerificationStatus } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { X, Upload, AlertCircle, Shield } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';

type DocumentType = 'EMPLOYEE_ID' | 'POLICE_ID' | 'OTHER_GOVERNMENT_ID';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'EMPLOYEE_ID', label: 'Government-issued Employee ID' },
  { value: 'POLICE_ID', label: 'Police Identification Card' },
  { value: 'OTHER_GOVERNMENT_ID', label: 'Other Authorized Government Identity Document' },
];

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Sub-component for the main upload form - avoids hook issues with early returns
function VerificationUploadForm({ userId }: { userId: number }) {
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState<DocumentType>('EMPLOYEE_ID');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, JPG, JPEG, or PNG files only.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a document to upload.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadVerificationDocument(userId, documentType, selectedFile);
      localStorage.setItem('verification_user_id', userId.toString());
      navigate(response.redirect_url, { replace: true });
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string };
        };
        message?: string;
      };

      if (axiosError.response?.status === 400) {
        setError(axiosError.response.data?.detail || 'Upload failed. Please check your file.');
      } else if (axiosError.response?.status === 404) {
        setError('User not found. Please register again.');
      } else if (axiosError.message?.includes('Network Error')) {
        setError('Unable to reach server. Please try again later.');
      } else {
        setError('Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const inputIcon = (icon: React.ReactNode) => (
    <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors duration-300 group-focus-within:text-[var(--color-accent-primary)]">
      {icon}
    </div>
  );

  return (
    <div className="p-8">
      <h2 className="mb-2 text-center text-xl font-semibold text-white tracking-tight">Verify Your Identity</h2>
      <p className="mb-6 text-center text-sm text-slate-400">
        To protect access to sensitive investigation information, authorized users must submit
        an official identification document for account verification.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-sm text-red-300 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5">
        {/* Document Type Selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Document Type
          </label>
          <div className="relative group">
            {inputIcon(
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            )}
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full rounded-lg border-[var(--color-border-primary)] bg-[var(--color-navy-900)] px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary)]/20 appearance-none cursor-pointer"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Upload Area */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Upload Document
          </label>
          <div className="relative">
            <input
              type="file"
              id="document-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInputChange}
              disabled={isUploading}
              className="sr-only"
            />
            <div
              className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
                dragActive
                  ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5'
                  : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent-primary)]/50'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isUploading && document.getElementById('document-upload')?.click()}
            >
              {selectedFile ? (
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-[var(--color-navy-900)] flex items-center justify-center border border-[var(--color-border-primary)]">
                        {selectedFile.type.startsWith('image/') ? (
                          <svg className="h-6 w-6 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        ) : (
                          <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)} • {selectedFile.type}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      aria-label="Remove file"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {uploadProgress !== null && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Uploading...</span>
                        <span className="text-white">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-[var(--color-navy-800)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-accent-primary)] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="h-14 w-14 rounded-full bg-[var(--color-navy-900)] flex items-center justify-center border border-[var(--color-border-primary)]">
                      <Upload className="h-7 w-7 text-slate-500" />
                    </div>
                  </div>
                  <p className="mb-1 text-sm font-medium text-white">Drag and drop your document here</p>
                  <p className="text-xs text-slate-500">or browse files</p>
                  <p className="mt-2 text-xs text-slate-500">Supported: PDF, JPG, JPEG, PNG • Max 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="w-full rounded-lg bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.4)] hover:bg-[var(--color-accent-primary-hover)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-navy-900)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0" />
              </svg>
              Uploading...
            </>
          ) : (
            'Submit for Verification'
          )}
        </button>
      </form>
    </div>
  );
}

// Sub-component for checking status - isolates the async check
function StatusChecker({ userId, navigate, onReady }: { userId: number; navigate: ReturnType<typeof useNavigate>; onReady: (status: any) => void }) {
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === 'ADMIN' || authUser?.role === 'SUPER_ADMIN';
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        // Use localStorage fallback for userId if not provided
        const effectiveUserId = userId || parseInt(localStorage.getItem('verification_user_id') || '0', 10);
        if (!effectiveUserId) {
          if (mounted) setError('Session expired. Please register again.');
          return;
        }
        
        const status = await getVerificationStatus(effectiveUserId);
        if (!mounted) return;
        
        if (status.document) {
          navigate('/verification-pending', { replace: true, state: { userId: effectiveUserId } });
          return;
        }
        if (status.account_status === 'APPROVED') {
          navigate('/login', { replace: true, state: { fromRegistration: true, message: 'Account approved. Please sign in.' } });
          return;
        }
        onReady(status);
      } catch (err: unknown) {
        if (!mounted) return;
        const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosError.response?.status === 404) {
          setError('User not found. Please register again.');
        } else {
          setError('Unable to check verification status. Please try again.');
        }
      } finally {
        if (mounted) setChecking(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, [userId, navigate]);

  if (checking) {
    return (
      <div className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
        <PageTransition className="relative w-full max-w-md">
          <div className="relative overflow-hidden rounded-[12px] border border-[var(--color-border-sidebar)] bg-[var(--color-navy-900)]/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
            <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
            <div className="hazard-stripe opacity-80" />
            <div className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center animate-pulse">
                  <Shield className="h-6 w-6 text-[var(--color-accent-primary)]" />
                </div>
              </div>
              <h2 className="mb-2 text-center text-xl font-semibold text-white">Checking Verification Status</h2>
              <p className="text-center text-sm text-slate-400">Please wait...</p>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  if (error) {
    return (
      <div className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
        <PageTransition className="relative w-full max-w-md">
          <div className="relative overflow-hidden rounded-[12px] border border-[var(--color-border-sidebar)] bg-[var(--color-navy-900)]/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
            <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
            <div className="hazard-stripe opacity-80" />
            <div className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <h2 className="mb-2 text-center text-xl font-semibold text-white">Error</h2>
              <p className="mb-6 text-center text-sm text-slate-400">{error}</p>
              <button
                onClick={() => navigate('/register')}
                className="w-full rounded-lg bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-accent-primary-hover)] transition-colors"
              >
                Go to Registration
              </button>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  return null;
}

export default function IdentityVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = (location.state as { userId?: number })?.userId;
  
  // Also check for userId in localStorage as fallback (for page refreshes)
  const storedUserId = localStorage.getItem('verification_user_id');
  const effectiveUserId = userId || (storedUserId ? parseInt(storedUserId, 10) : null);
  
  // Store userId in localStorage for page refreshes
  useEffect(() => {
    if (userId) {
      localStorage.setItem('verification_user_id', userId.toString());
    }
  }, [userId]);

  const [statusChecked, setStatusChecked] = useState(false);
  const authUser = useAuthStore((s) => s.user);
  const isAuthAdmin = authUser?.role === 'ADMIN' || authUser?.role === 'SUPER_ADMIN';
  const isAuthVerified = authUser?.account_status === 'APPROVED';

  // If already verified or is admin, redirect away - verification not needed at all for admin
  useEffect(() => {
    if (isAuthAdmin) {
      navigate('/', { replace: true });
      return;
    }
    if (isAuthVerified) {
      navigate('/login', { replace: true });
      return;
    }
  }, [navigate, isAuthAdmin, isAuthVerified]);

  if (!effectiveUserId) {
    return (
      <div className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
        <PageTransition className="relative w-full max-w-md">
          <div className="relative overflow-hidden rounded-[12px] border border-[var(--color-border-sidebar)] bg-[var(--color-navy-900)]/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
            <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
            <div className="hazard-stripe opacity-80" />
            <div className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <h2 className="mb-2 text-center text-xl font-semibold text-white">Session Expired</h2>
              <p className="mb-6 text-center text-sm text-slate-400">Please complete registration first.</p>
              <button
                onClick={() => navigate('/register')}
                className="w-full rounded-lg bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-accent-primary-hover)] transition-colors"
              >
                Go to Registration
              </button>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  const handleStatusReady = useCallback(() => {
    setStatusChecked(true);
  }, []);

  if (!statusChecked) {
    return <StatusChecker userId={effectiveUserId} navigate={navigate} onReady={handleStatusReady} />;
  }

  // Status checked, show the upload form
  return (
    <div className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
      <PageTransition className="relative w-full max-w-md">
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute -left-40 -top-40 z-0 h-[30rem] w-[30rem] animate-[float-orb_16s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-600/40 via-indigo-600/25 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-[34rem] w-[34rem] animate-[float-orb_20s_ease-in-out_infinite_reverse] rounded-full bg-gradient-to-tr from-violet-600/35 via-fuchsia-500/15 to-cyan-500/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />

        {/* Blueprint grid overlay + forensic watermark */}
        <div className="bg-grid pointer-events-none absolute inset-0 z-0" />

        <div className="relative w-full max-w-md">
          {/* Brand – clean and prominent */}
          <div className="animate-scale-in text-center">
            <img src="/Crime-Icon.png" alt="CrimeIntel" className="mx-auto h-48 w-48 object-contain" />
          </div>

          {/* Industrial steel login card – rivets + hazard stripe */}
          <div className="relative overflow-hidden rounded-[12px] border border-[var(--color-border-sidebar)] bg-[var(--color-navy-900)]/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-up">
            <div className="rivet rivet-tl" /> <div className="rivet rivet-tr" /> <div className="rivet rivet-bl" /> <div className="rivet rivet-br" />
            <div className="hazard-stripe opacity-80" />
            <VerificationUploadForm userId={effectiveUserId} />
          </div>
        </div>
      </PageTransition>
    </div>
  );
}