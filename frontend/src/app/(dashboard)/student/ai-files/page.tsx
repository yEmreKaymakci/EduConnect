'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fileApi, aiApi, getApiError, uploadFile } from '@/lib/api';
import { auth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import {
  FileText, FileCode, Wand2, Trash2, Download,
  Eye, Loader2, Upload, X, ArrowRight, CheckCircle2,
  RefreshCw, FileCog
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────

interface FileInfo {
  id: number;
  status: string;
  created_at: string;
  info: {
    original_name: string;
    extension: string;
    size_bytes: number;
    ai_analyzed?: boolean;
    ai_converted?: boolean;
    target_format?: string;
  };
}

const SUPPORTED_FORMATS = ['txt', 'pdf', 'docx', 'xlsx'] as const;
type SupportedFormat = typeof SUPPORTED_FORMATS[number];

const FORMAT_META: Record<SupportedFormat, { label: string; icon: string; color: string }> = {
  txt:  { label: 'Plain Text',     icon: '📄', color: 'text-gray-300' },
  pdf:  { label: 'PDF Belgesi',    icon: '📕', color: 'text-red-400' },
  docx: { label: 'Word (.docx)',   icon: '📝', color: 'text-blue-400' },
  xlsx: { label: 'Excel (.xlsx)',  icon: '📊', color: 'text-green-400' },
};

// ─── Format Conversion Panel ──────────────────────────────────────────────

function ConversionPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedFormat | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');

  const sourceExt = sourceFile ? sourceFile.name.rsplit ? undefined : sourceFile.name.split('.').pop()?.toLowerCase() : undefined;
  const availableTargets = SUPPORTED_FORMATS.filter(f => f !== sourceExt);

  const handleConvert = async () => {
    if (!sourceFile || !targetFormat) return;
    setIsConverting(true);
    setIsDone(false);
    try {
      const formData = new FormData();
      formData.append('file', sourceFile);

      const res = await aiApi.post(
        `/api/v1/ai/convert-format?target_format=${targetFormat}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, responseType: 'blob' }
      );

      const base = sourceFile.name.split('.').slice(0, -1).join('.');
      const filename = `${base}_converted.${targetFormat}`;
      setResultBlob(res.data);
      setResultFilename(filename);
      setIsDone(true);
      toast.success(`Dönüşüm tamamlandı! ${filename}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSourceFile(null);
    setTargetFormat(null);
    setIsDone(false);
    setResultBlob(null);
    setResultFilename('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const srcExt = sourceFile?.name.split('.').pop()?.toLowerCase() as SupportedFormat | undefined;

  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-surface-card/80 to-surface/40 shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 text-primary-light">
            <FileCog className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Dosya Format Dönüştürücü</CardTitle>
            <CardDescription>txt · pdf · docx · xlsx formatları arasında dönüştür ve indir</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Select Source File */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            1 — Kaynak Dosyayı Seç
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx,.xlsx"
            className="hidden"
            id="conv-source"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setSourceFile(f);
              setTargetFormat(null);
              setIsDone(false);
            }}
          />
          {!sourceFile ? (
            <label
              htmlFor="conv-source"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-xl p-8 cursor-pointer transition-all bg-surface/20 hover:bg-surface-card/30"
            >
              <Upload className="w-8 h-8 text-primary-light" />
              <span className="text-sm text-text-secondary">Dosya seç veya sürükle bırak</span>
              <span className="text-xs text-text-muted">TXT, PDF, DOCX, XLSX (maks. 50MB)</span>
            </label>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <span className="text-2xl">{srcExt ? FORMAT_META[srcExt as SupportedFormat]?.icon ?? '📁' : '📁'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{sourceFile.name}</p>
                <p className="text-xs text-text-muted">{(sourceFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={handleReset} className="text-text-muted hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Choose Target Format */}
        {sourceFile && !isDone && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              2 — Hedef Formatı Seç
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableTargets.map((fmt) => {
                const meta = FORMAT_META[fmt];
                return (
                  <button
                    key={fmt}
                    onClick={() => setTargetFormat(fmt)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                      targetFormat === fmt
                        ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10'
                        : 'border-surface-border bg-surface/40 hover:border-primary/40 hover:bg-surface-card/50'
                    }`}
                  >
                    <span className="text-2xl">{meta.icon}</span>
                    <span className={`text-xs font-bold uppercase ${targetFormat === fmt ? 'text-primary-light' : 'text-text-secondary'}`}>
                      {fmt}
                    </span>
                    <span className="text-[10px] text-text-muted text-center leading-tight">{meta.label}</span>
                    {targetFormat === fmt && <CheckCircle2 className="w-4 h-4 text-primary-light" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Convert */}
        {sourceFile && targetFormat && !isDone && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              3 — Dönüştür
            </p>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface/30 border border-surface-border mb-4">
              <div className="text-center">
                <span className="text-2xl block">{FORMAT_META[srcExt as SupportedFormat]?.icon ?? '📁'}</span>
                <span className="text-xs text-text-muted uppercase">{srcExt}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-light" />
              <div className="text-center">
                <span className="text-2xl block">{FORMAT_META[targetFormat].icon}</span>
                <span className="text-xs text-primary-light uppercase font-bold">{targetFormat}</span>
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-text-muted">{sourceFile.name.split('.').slice(0,-1).join('.')}_converted.{targetFormat}</p>
              </div>
            </div>
            <Button
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-light hover:to-indigo-500 border-none shadow-lg shadow-primary/20"
            >
              {isConverting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Dönüştürülüyor...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Dönüştür</>
              )}
            </Button>
          </div>
        )}

        {/* Step 4: Download */}
        {isDone && resultBlob && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-emerald-300">Dönüşüm Başarılı!</p>
                <p className="text-xs text-text-muted">{resultFilename}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none"
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
              <Button variant="outline" onClick={handleReset} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <RefreshCw className="w-4 h-4 mr-2" />
                Yeni Dönüşüm
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── File Card ─────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AIFilesPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const user = auth.getUserData();
      if (!user) return;
      const res = await fileApi.get(`/api/v1/files/user/${user.user_id}`);
      setFiles(res.data);
    } catch {
      toast.error('Dosyalar yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const user = auth.getUserData();
    if (!user) return;
    setIsUploading(true);
    try {
      await uploadFile(file, user.user_id);
      toast.success('Dosya başarıyla yüklendi.');
      fetchFiles();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    try {
      const user = auth.getUserData();
      await fileApi.delete(`/api/v1/files/${fileId}?user_id=${user?.user_id}`);
      toast.success('Dosya silindi.');
      setFiles(files.filter(f => f.id !== fileId));
    } catch {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const handleAIConvert = async (fileId: number, format: string) => {
    setIsProcessing(fileId);
    try {
      await aiApi.post(`/api/v1/ai/convert-file-by-id/${fileId}?target_format=${format}`);
      toast.success(format === 'html' ? 'HTML Dönüşümü Başarılı!' : 'Prompt Analizi Tamamlandı!');
      fetchFiles();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">AI Dosya İşleme</h1>
          <p className="text-text-muted">Dosyalarınızı sisteme yükleyin, AI ile işleyin veya formatlar arasında dönüştürün.</p>
        </div>
        <div className="relative">
          <input
            type="file"
            id="lib-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
            accept=".txt,.pdf,.docx,.xlsx,.png,.jpg,.jpeg"
          />
          <label
            htmlFor="lib-upload"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer font-semibold transition-all duration-200 ${
              isUploading
                ? 'bg-surface-border text-text-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-light hover:to-indigo-500 text-white shadow-lg shadow-primary/25'
            }`}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isUploading ? 'Yükleniyor...' : 'Kütüphaneye Ekle'}
          </label>
        </div>
      </div>

      {/* Conversion Panel */}
      <ConversionPanel />

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-border" />
        <span className="text-xs text-text-muted uppercase tracking-widest font-semibold px-3">Yüklenen Dosya Kütüphanesi</span>
        <div className="flex-1 h-px bg-surface-border" />
      </div>

      {/* File Library */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 rounded-2xl bg-surface animate-pulse border border-surface-border" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <div className="w-20 h-20 rounded-full bg-surface-card flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-text-muted" />
          </div>
          <CardTitle className="mb-2">Kütüphane Boş</CardTitle>
          <CardDescription className="max-w-xs">
            Yukarıdaki "Kütüphaneye Ekle" butonu ile dosya yükleyin ya da Format Dönüştürücüyü doğrudan kullanın.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => {
            const ext = file.info.extension.toLowerCase() as SupportedFormat;
            const isDocx = ext === 'docx';
            const isTxt = ext === 'txt';
            const isProcessingThis = isProcessing === file.id;
            const meta = FORMAT_META[ext as SupportedFormat];

            return (
              <Card key={file.id} className="group hover:border-primary/50 transition-all duration-300 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl text-2xl leading-none ${
                      isDocx ? 'bg-blue-500/10' : isTxt ? 'bg-green-500/10' : 'bg-surface-border/40'
                    }`}>
                      {meta?.icon ?? '📁'}
                    </div>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-text-muted hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <CardTitle className="text-base mt-3 truncate" title={file.info.original_name}>
                    {file.info.original_name}
                  </CardTitle>
                  <CardDescription className="flex justify-between text-xs">
                    <span>{ext.toUpperCase()} • {formatSize(file.info.size_bytes)}</span>
                    <span>{new Date(file.created_at).toLocaleDateString('tr-TR')}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-end space-y-2">
                  {isDocx && (
                    <Button
                      onClick={() => handleAIConvert(file.id, 'html')}
                      disabled={isProcessingThis}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-sm"
                    >
                      {isProcessingThis ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      HTML'e Dönüştür (AI)
                    </Button>
                  )}
                  {isTxt && (
                    <Button
                      onClick={() => handleAIConvert(file.id, 'analysis')}
                      disabled={isProcessingThis}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-none text-sm"
                    >
                      {isProcessingThis ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Promptları İşle (AI)
                    </Button>
                  )}

                  {file.info.ai_converted && file.info.target_format === 'html' && (
                    <Link href={`/student/ai-files/editor/${file.id}`} className="block">
                      <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm">
                        <Eye className="w-4 h-4 mr-2" />Editörde Düzenle
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
