'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { uploadFile, aiApi, getApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { 
  FileText, Bot, Upload, GraduationCap, Briefcase, 
  Code2, Globe, Sparkles, CheckCircle2, User, Layers 
} from 'lucide-react';

export default function StudentCVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    const user = auth.getUserData();
    if (!user) return;

    setIsUploading(true);
    let fileId = null;
    
    // 1. Upload to File Service
    try {
      const res = await uploadFile(file, user.user_id);
      fileId = res.data.file_id;
      toast.success('Dosya başarıyla yüklendi!');
    } catch (err: unknown) {
      toast.error(getApiError(err));
      setIsUploading(false);
      return;
    }
    setIsUploading(false);

    // 2. Analyze with AI Service
    if (fileId) {
      setIsAnalyzing(true);
      toast('Yapay zeka dosyayı analiz ediyor...', { icon: '🤖' });
      try {
        const aiRes = await aiApi.post(`/api/v1/ai/analyze-file-by-id/${fileId}`);
        setAiResult(aiRes.data);
        toast.success('Analiz başarıyla tamamlandı!');
      } catch (err) {
        toast.error('AI Analizi sırasında bir hata oluştu.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const cvData = aiResult
    ? (aiResult.success && aiResult.data ? aiResult.data : aiResult)
    : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Upload Box */}
      <Card className="border border-surface-border/40 shadow-xl bg-surface/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
            Özgeçmiş Yükle & Yapay Zeka ile Analiz Et
          </CardTitle>
          <CardDescription className="text-text-muted">
            PDF, DOCX veya TXT formatındaki CV'nizi yükleyerek Gemini AI ile yeteneklerinizi otomatik çıkartın ve global standartlara göre iyileştirin.
          </CardDescription>
        </CardHeader>
        <div className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-2xl p-12 bg-surface/30 hover:bg-surface-card/30 transition-all duration-300 group">
          <div className="p-4 rounded-full bg-primary/10 text-primary-light group-hover:scale-110 transition-transform duration-300 mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <input 
            type="file" 
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden" 
            id="cv-upload"
          />
          <label htmlFor="cv-upload" className="btn-primary cursor-pointer px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all">
            Dosya Seç
          </label>
          <p className="text-sm text-text-muted mt-3 font-medium">
            {file ? file.name : 'Sürükleyip bırakın veya bilgisayarınızdan seçin'}
          </p>
          <p className="text-xs text-text-secondary mt-1">Maksimum 10MB. PDF, DOCX, TXT.</p>
          
          {file && (
            <Button 
              className="mt-8 px-8 py-3 w-full max-w-xs font-bold rounded-xl shadow-md" 
              onClick={handleUploadAndAnalyze}
              isLoading={isUploading || isAnalyzing}
            >
              {isUploading ? 'Yükleniyor...' : isAnalyzing ? 'Analiz Ediliyor...' : 'Yükle ve Analiz Et'}
            </Button>
          )}
        </div>
      </Card>

      {/* Analysis Output Section */}
      {cvData && (
        <div className="space-y-8 animate-slideUp">
          
          {/* Header Card */}
          <div className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-surface-card to-surface-border/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-lg shadow-primary/30">
                <User className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{cvData.name || 'Ad Soyad Çıkarılamadı'}</h2>
                <p className="text-sm font-medium uppercase tracking-wider text-primary-light">Özgeçmiş Analiz Profili</p>
              </div>
            </div>
            {cvData.summary && (
              <div className="mt-6 pt-6 border-t border-surface-border/50">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Özet</h3>
                <p className="text-text-muted italic leading-relaxed text-sm bg-surface/50 p-4 rounded-xl border border-surface-border/30">
                  "{cvData.summary}"
                </p>
              </div>
            )}
          </div>

          {/* GLOBAL STANDARD IMPROVEMENT SUGGESTIONS SECTION */}
          {cvData.improvements && cvData.improvements.length > 0 && (
            <Card className="border border-primary-light/40 shadow-2xl shadow-primary/10 bg-gradient-to-r from-primary/10 via-surface-card to-indigo-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-48 h-48 bg-primary-light/10 rounded-full blur-3xl" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-primary-light animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      Global Standartlara Göre Yapay Zeka İyileştirme Önerileri
                    </CardTitle>
                    <CardDescription className="text-primary-light/80 font-medium">
                      Özgeçmişinizin kurumsal işe alım ve ATS (Aday Takip Sistemleri) standartlarına uyumluluğunu artırmak için öneriler
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cvData.improvements.map((improvement: string, index: number) => (
                    <div 
                      key={index} 
                      className="flex gap-4 items-start p-4 rounded-xl border border-primary/15 bg-surface-card/60 hover:border-primary-light/30 transition-all duration-200"
                    >
                      <div className="p-1 rounded-full bg-primary-light/15 text-primary-light mt-0.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-text-secondary font-medium leading-relaxed">{improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Skills & Languages */}
            <div className="space-y-8">
              
              {/* Skills Card */}
              <Card className="border border-surface-border/60 bg-surface/40 shadow-lg">
                <CardHeader className="pb-3 border-b border-surface-border/40">
                  <div className="flex items-center gap-2 text-primary-light">
                    <Code2 className="w-5 h-5" />
                    <CardTitle className="text-lg font-bold text-white">Yetenekler</CardTitle>
                  </div>
                </CardHeader>
                <div className="p-5">
                  {cvData.skills && cvData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {cvData.skills.map((skill: string, index: number) => (
                        <span 
                          key={index} 
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/20 bg-primary/10 text-primary-light hover:bg-primary/25 hover:border-primary-light/40 transition-all"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">Yetenek çıkarılamadı.</p>
                  )}
                </div>
              </Card>

              {/* Languages Card */}
              <Card className="border border-surface-border/60 bg-surface/40 shadow-lg">
                <CardHeader className="pb-3 border-b border-surface-border/40">
                  <div className="flex items-center gap-2 text-primary-light">
                    <Globe className="w-5 h-5" />
                    <CardTitle className="text-lg font-bold text-white">Diller</CardTitle>
                  </div>
                </CardHeader>
                <div className="p-5">
                  {cvData.languages && cvData.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {cvData.languages.map((lang: string, index: number) => (
                        <span 
                          key={index} 
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-border bg-surface-border/30 text-text-secondary"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">Yabancı dil bilgisi çıkarılamadı.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Experience, Education, Projects */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Experience Card */}
              <Card className="border border-surface-border/60 bg-surface/40 shadow-lg">
                <CardHeader className="pb-3 border-b border-surface-border/40">
                  <div className="flex items-center gap-2 text-primary-light">
                    <Briefcase className="w-5 h-5" />
                    <CardTitle className="text-lg font-bold text-white">İş Deneyimi</CardTitle>
                  </div>
                </CardHeader>
                <div className="p-6 space-y-6">
                  {cvData.experience && cvData.experience.length > 0 ? (
                    cvData.experience.map((exp: any, index: number) => (
                      <div key={index} className="flex gap-4 items-start group">
                        <div className="p-3 rounded-xl border border-surface-border bg-surface-border/40 text-text-muted group-hover:text-primary-light group-hover:border-primary/20 transition-all duration-300">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white group-hover:text-primary-light transition-colors">{exp.title}</h4>
                          <p className="text-sm font-semibold text-text-secondary">{exp.company}</p>
                          <p className="text-xs text-text-muted font-medium">{exp.duration}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary">İş deneyimi bilgisi çıkarılamadı.</p>
                  )}
                </div>
              </Card>

              {/* Education Card */}
              <Card className="border border-surface-border/60 bg-surface/40 shadow-lg">
                <CardHeader className="pb-3 border-b border-surface-border/40">
                  <div className="flex items-center gap-2 text-primary-light">
                    <GraduationCap className="w-5 h-5" />
                    <CardTitle className="text-lg font-bold text-white">Eğitim Bilgileri</CardTitle>
                  </div>
                </CardHeader>
                <div className="p-6 space-y-6">
                  {cvData.education && cvData.education.length > 0 ? (
                    cvData.education.map((edu: any, index: number) => (
                      <div key={index} className="flex gap-4 items-start group">
                        <div className="p-3 rounded-xl border border-surface-border bg-surface-border/40 text-text-muted group-hover:text-primary-light group-hover:border-primary/20 transition-all duration-300">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white group-hover:text-primary-light transition-colors">{edu.degree}</h4>
                          <p className="text-sm font-semibold text-text-secondary">{edu.school}</p>
                          <p className="text-xs text-text-muted font-medium">{edu.year}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary">Eğitim bilgisi çıkarılamadı.</p>
                  )}
                </div>
              </Card>

              {/* Projects Card */}
              <Card className="border border-surface-border/60 bg-surface/40 shadow-lg">
                <CardHeader className="pb-3 border-b border-surface-border/40">
                  <div className="flex items-center gap-2 text-primary-light">
                    <Code2 className="w-5 h-5" />
                    <CardTitle className="text-lg font-bold text-white">Öne Çıkan Projeler</CardTitle>
                  </div>
                </CardHeader>
                <div className="p-6">
                  {cvData.projects && cvData.projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cvData.projects.map((proj: any, index: number) => (
                        <div key={index} className="p-5 rounded-xl border border-surface-border bg-surface-card/40 hover:border-primary/20 hover:bg-surface-card/65 transition-all duration-300 space-y-3">
                          <h4 className="text-base font-bold text-white">{proj.name}</h4>
                          <p className="text-sm text-text-secondary leading-relaxed">{proj.description}</p>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {proj.technologies.map((tech: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface border border-surface-border text-text-muted uppercase">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">Proje bilgisi çıkarılamadı.</p>
                  )}
                </div>
              </Card>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
