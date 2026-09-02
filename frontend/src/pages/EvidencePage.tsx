// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { File, Search, X, Image } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { listCases, searchCases } from '../services/caseService';
import { listEvidence } from '../services/evidenceService';
import type { Evidence } from '../types/evidence';
import type { Case } from '../types/case';
import api from '../services/api';

type FilterType = 'all' | 'image' | 'video' | 'pdf';

function isImageType(t: string, n: string) {
  return t.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(n);
}
function isVideoType(t: string, n: string) {
  return t.toLowerCase().includes('video') || /\.(mp4|mov|avi|webm)$/i.test(n);
}
function isPdfType(t: string, n: string) {
  return t.toLowerCase().includes('pdf') || /\.pdf$/i.test(n);
}

// Reuse same professional evidence card + gallery as CaseDetail (Case Explorer)
function EvidenceThumb({ ev }: { ev: any }) {
  const fileName = ev.file_name || ev.original_file_name || 'file';
  const fileType = ev.file_type || ev.mime_type || '';
  const isImg = isImageType(fileType, fileName);
  const isVid = isVideoType(fileType, fileName);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const url = ev.file_url && ev.file_url.startsWith('/storage') ? ev.file_url : (ev.evidence_id ? `/evidence/${ev.evidence_id}/file` : null);
    if (!url || (!isImg && !isVid)) return;
    (async () => {
      try {
        let res: any;
        if (url.startsWith('/storage')) {
          const r = await fetch(url);
          if (!r.ok) throw new Error('fetch failed');
          const blob = await r.blob();
          objectUrl = URL.createObjectURL(blob);
        } else {
          res = await api.get(url, { responseType: 'blob' });
          objectUrl = URL.createObjectURL(res.data as Blob);
        }
        if (!cancelled) setThumbUrl(objectUrl);
      } catch {
        if (!cancelled) setThumbUrl(null);
      }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [ev.evidence_id, ev.file_url, isImg, isVid]);
  if (isImg && thumbUrl) return <img src={thumbUrl} alt={fileName} className="h-full w-full object-cover" />;
  if (isImg) return <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600 text-xs">Image</div>;
  if (isVid && thumbUrl) return <div className="relative h-full w-full"><video src={thumbUrl} className="h-full w-full object-cover" muted preload="metadata" /><span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">▶</span></div>;
  if (isVid) return <div className="flex h-full w-full items-center justify-center bg-violet-50">▶</div>;
  if (isPdfType(fileType, fileName)) return <div className="flex h-full w-full items-center justify-center bg-red-50 text-red-600 font-bold text-xs">PDF</div>;
  return <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400"><File size={20} /></div>;
}

function EvidenceExplorer({ caseId }: { caseId: string }) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [preview, setPreview] = useState<Evidence | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listEvidence(caseId);
      setEvidence(items as Evidence[]);
    } catch { setEvidence([]); } finally { setLoading(false); }
  }, [caseId]);

  useEffect(() => { fetchEvidence(); }, [fetchEvidence]);

  const filtered = evidence.filter((e) => {
    const n = e.file_name || '';
    const t = e.file_type || (e as any).mime_type || '';
    if (filter === 'image' && !isImageType(t, n)) return false;
    if (filter === 'video' && !isVideoType(t, n)) return false;
    if (filter === 'pdf' && !isPdfType(t, n)) return false;
    return true;
  });

  const openGallery = (idx: number) => { setGalleryIndex(idx); setGalleryOpen(true); };

  if (loading) return <div className="flex justify-center py-12"><Spinner text="Loading evidence..." /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all','image','video','pdf'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter===f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{f}</button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{filtered.length} of {evidence.length}</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500">No evidence for this filter</Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e, idx) => {
            const n = e.file_name || 'file';
            const t = e.file_type || (e as any).mime_type || '';
            const isSensitive = Boolean((e as any).sensitive || (e as any).is_sensitive);
            return (
              <div key={e.evidence_id} onClick={() => { setPreview(e); openGallery(idx); }} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="relative h-44 w-full overflow-hidden bg-slate-50">
                  <div className={`h-full w-full ${isSensitive ? 'blur-[7px] scale-105' : ''}`}>
                    <EvidenceThumb ev={e as any} />
                  </div>
                  {isSensitive && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]"><span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold">Sensitive</span></div>}
                  <span className={`absolute right-2 top-2 rounded-full border bg-white/90 px-2 py-1 text-[11px] font-medium ${isImageType(t,n) ? 'text-emerald-700 border-emerald-200' : isVideoType(t,n) ? 'text-violet-700 border-violet-200' : isPdfType(t,n) ? 'text-red-700 border-red-200' : 'text-slate-600 border-slate-200'}`}>{isImageType(t,n) ? 'Image' : isVideoType(t,n) ? 'Video' : isPdfType(t,n) ? 'PDF' : 'File'}</span>
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <p className="truncate text-sm font-semibold group-hover:text-blue-600">{n}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{(e as any).description || t}</p>
                  <p className="mt-1 text-xs text-slate-400">{t.split('/').pop()?.toUpperCase() || 'FILE'} • {( (e as any).file_size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] max-w-3xl overflow-auto rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{preview.file_name}</h3>
              <button onClick={() => setPreview(null)} className="rounded p-1 hover:bg-slate-100"><X size={16} /></button>
            </div>
            {isImageType(preview.file_type, preview.file_name) ? <img src={`/api/v1/evidence/${preview.evidence_id}/file`} alt={preview.file_name} className="max-h-[70vh] w-full object-contain" /> : isVideoType(preview.file_type, preview.file_name) ? <video controls src={`/api/v1/evidence/${preview.evidence_id}/file`} className="max-h-[70vh] w-full" /> : isPdfType(preview.file_type, preview.file_name) ? <embed src={`/api/v1/evidence/${preview.evidence_id}/file`} type="application/pdf" className="h-[70vh] w-full" /> : <p>Preview not available</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setPreview(null)} className="rounded border px-4 py-2">Close</button>
              <a href={`/api/v1/evidence/${preview.evidence_id}/file`} download={preview.file_name} className="rounded bg-blue-600 px-4 py-2 text-white">Download</a>
            </div>
          </div>
        </div>
      )}

      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4" onClick={() => setGalleryOpen(false)}>
          <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">{filtered[galleryIndex]?.file_name}</h3>
              <button onClick={() => setGalleryOpen(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="relative flex flex-1 items-center justify-center bg-slate-50 p-4">
              {(() => {
                const ev: any = filtered[galleryIndex];
                if (!ev) return null;
                const isImg = isImageType(ev.file_type, ev.file_name);
                const isVid = isVideoType(ev.file_type, ev.file_name);
                const isPdf = isPdfType(ev.file_type, ev.file_name);
                if (isImg) return <img src={`/api/v1/evidence/${ev.evidence_id}/file`} alt={ev.file_name} className="max-h-[60vh] object-contain" />;
                if (isVid) return <video controls src={`/api/v1/evidence/${ev.evidence_id}/file`} className="max-h-[60vh] w-full" />;
                if (isPdf) return <embed src={`/api/v1/evidence/${ev.evidence_id}/file`} type="application/pdf" className="h-[60vh] w-full" />;
                return <p>{ev.file_name}</p>;
              })()}
              <button onClick={() => setGalleryIndex((i) => i > 0 ? i - 1 : filtered.length - 1)} className="absolute left-3 rounded-full bg-white p-2 shadow">‹</button>
              <button onClick={() => setGalleryIndex((i) => i < filtered.length - 1 ? i + 1 : 0)} className="absolute right-3 rounded-full bg-white p-2 shadow">›</button>
            </div>
            <div className="flex gap-2 overflow-x-auto border-t p-3">
              {filtered.map((ev, i) => (
                <button key={ev.evidence_id} onClick={() => setGalleryIndex(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i===galleryIndex ? 'border-blue-500' : 'border-slate-200'}`}>
                  <img src={`/api/v1/evidence/${ev.evidence_id}/file`} alt={ev.file_name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidencePage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [caseSearch, setCaseSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Case[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    listCases({ limit: 500 }).then((res) => setCases(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!caseSearch) { setSearchResults(null); return; }
    setIsSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchCases(caseSearch, 1, 500);
        setSearchResults(res.data);
      } catch {
        const q = caseSearch.toLowerCase();
        setSearchResults(cases.filter((c) => c.case_number.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)));
      } finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [caseSearch, cases]);

  const filteredCases = searchResults !== null ? searchResults : cases.filter((c) => {
    if (!caseSearch) return true;
    const q = caseSearch.toLowerCase();
    return c.case_number.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.crime_type.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Evidence</h1>
        <p className="mt-1 text-sm text-slate-500">Select a case to view its evidence — same explorer as Case Detail</p>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Select Case</label>
          <span className="text-xs text-slate-500">{cases.length} cases</span>
        </div>
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field w-full pl-9 pr-9" placeholder="Search cases — KSP-2024, theft, Mysore..." value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} />
          {caseSearch && <button onClick={() => setCaseSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
        </div>
        <div className="mt-3 grid max-h-[320px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {isSearching ? <div className="col-span-full flex justify-center py-8"><span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /></div> : filteredCases.slice(0, 9).map((c) => (
            <button key={c.case_id} onClick={() => setSelectedCaseId(c.case_id)} className={`rounded-xl border p-3 text-left ${selectedCaseId===c.case_id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="flex justify-between gap-2">
                <span className="rounded bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white">{c.case_number}</span>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs border">{c.crime_type}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold">{c.title}</p>
              <p className="text-xs text-slate-500">{c.district} • {c.location}</p>
            </button>
          ))}
        </div>
      </Card>

      {selectedCaseId ? <EvidenceExplorer caseId={selectedCaseId} /> : (
        <Card className="py-12 text-center">
          <File size={32} className="mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600">Select a case above to view its evidence</p>
          <p className="text-xs text-slate-500">Evidence shown here is identical to Case Explorer → Evidence tab. Click any case to open it.</p>
        </Card>
      )}
    </div>
  );
}
