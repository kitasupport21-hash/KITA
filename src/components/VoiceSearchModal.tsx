import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Command,
  Check,
  AlertCircle,
  RotateCcw,
  Volume2,
  MapPin,
  Laptop,
  Briefcase,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import type { JobType, WorkplaceType } from '../shared/types.js';

export interface VoiceCommandResult {
  rawTranscript: string;
  cleanedKeyword?: string;
  detectedProvince?: string;
  detectedJobType?: JobType | 'all';
  detectedWorkplace?: WorkplaceType | 'all';
  detectedMinSalary?: number;
  isResetCommand?: boolean;
  actionSummary: string;
}

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVoiceResult: (result: VoiceCommandResult) => void;
  provincesList: string[];
}

// Indonesian provinces and synonyms for voice parsing
const PROVINCE_VOICE_MAP: { [key: string]: string } = {
  jakarta: 'DKI Jakarta',
  'dki jakarta': 'DKI Jakarta',
  bandung: 'Jawa Barat',
  bogor: 'Jawa Barat',
  depok: 'Jawa Barat',
  bekasi: 'Jawa Barat',
  'jawa barat': 'Jawa Barat',
  jabar: 'Jawa Barat',
  semarang: 'Jawa Tengah',
  solo: 'Jawa Tengah',
  surakarta: 'Jawa Tengah',
  'jawa tengah': 'Jawa Tengah',
  jateng: 'Jawa Tengah',
  jogja: 'DI Yogyakarta',
  yogyakarta: 'DI Yogyakarta',
  jogjakarta: 'DI Yogyakarta',
  surabaya: 'Jawa Timur',
  malang: 'Jawa Timur',
  'jawa timur': 'Jawa Timur',
  jatim: 'Jawa Timur',
  banten: 'Banten',
  tangerang: 'Banten',
  medan: 'Sumatera Utara',
  'sumatera utara': 'Sumatera Utara',
  sumut: 'Sumatera Utara',
  padang: 'Sumatera Barat',
  'sumatera barat': 'Sumatera Barat',
  palembang: 'Sumatera Selatan',
  'sumatera selatan': 'Sumatera Selatan',
  bali: 'Bali',
  denpasar: 'Bali',
  samarinda: 'Kalimantan Timur',
  balikpapan: 'Kalimantan Timur',
  'kalimantan timur': 'Kalimantan Timur',
  pontianak: 'Kalimantan Barat',
  'kalimantan barat': 'Kalimantan Barat',
  makassar: 'Sulawesi Selatan',
  'sulawesi selatan': 'Sulawesi Selatan',
  papua: 'Papua',
  jayapura: 'Papua'
};

/**
 * Intelligent parser that extracts search keywords and filters from natural speech
 */
export const parseVoiceCommand = (transcript: string): VoiceCommandResult => {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. Check for Reset / Clear command
  if (
    lower.includes('reset') ||
    lower.includes('hapus pencarian') ||
    lower.includes('hapus filter') ||
    lower.includes('bersihkan filter') ||
    lower.includes('kembalikan awal')
  ) {
    return {
      rawTranscript: text,
      isResetCommand: true,
      actionSummary: 'Mereset semua kata kunci dan filter'
    };
  }

  let cleanedKeyword = text;
  let detectedProvince: string | undefined = undefined;
  let detectedJobType: JobType | 'all' | undefined = undefined;
  let detectedWorkplace: WorkplaceType | 'all' | undefined = undefined;
  let detectedMinSalary: number | undefined = undefined;
  const actions: string[] = [];

  // Strip leading voice trigger prefixes like "cari", "carikan", "tolong carikan", "pencarian", "search"
  const prefixRegex = /^(tolong\s+)?(cari(kan)?|pencarian|search(\s+for)?|lihat(\s+lowongan)?)\s+/i;
  cleanedKeyword = cleanedKeyword.replace(prefixRegex, '').trim();

  // 2. Check workplace mode (Remote / Hybrid / On-site)
  if (lower.includes('remote') || lower.includes('jarak jauh') || lower.includes('wfh') || lower.includes('dari rumah')) {
    detectedWorkplace = 'remote';
    actions.push('Mode Remote (WFH)');
    cleanedKeyword = cleanedKeyword
      .replace(/\b(kerja\s+)?remote\b/gi, '')
      .replace(/\b(kerja\s+)?jarak\s+jauh\b/gi, '')
      .replace(/\bwfh\b/gi, '')
      .replace(/\bdari\s+rumah\b/gi, '')
      .trim();
  } else if (lower.includes('hybrid') || lower.includes('hibrida')) {
    detectedWorkplace = 'hybrid';
    actions.push('Mode Hybrid');
    cleanedKeyword = cleanedKeyword.replace(/\b(kerja\s+)?hybrid\b/gi, '').trim();
  } else if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('di kantor') || lower.includes('kantor')) {
    if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('di kantor')) {
      detectedWorkplace = 'onsite';
      actions.push('Mode On-site');
      cleanedKeyword = cleanedKeyword.replace(/\b(onsite|on-site|di kantor)\b/gi, '').trim();
    }
  }

  // 3. Check job type (Fulltime, Freelance, Parttime, Internship, Contract)
  if (lower.includes('freelance') || lower.includes('lepas') || lower.includes('proyek')) {
    detectedJobType = 'freelance';
    actions.push('Tipe Freelance');
    cleanedKeyword = cleanedKeyword.replace(/\b(kerja\s+)?freelance\b/gi, '').replace(/\bproyek\b/gi, '').trim();
  } else if (lower.includes('magang') || lower.includes('internship') || lower.includes('intern')) {
    detectedJobType = 'internship';
    actions.push('Tipe Magang');
    cleanedKeyword = cleanedKeyword.replace(/\b(kerja\s+)?(magang|internship|intern)\b/gi, '').trim();
  } else if (lower.includes('part time') || lower.includes('part-time') || lower.includes('paruh waktu')) {
    detectedJobType = 'parttime';
    actions.push('Tipe Paruh Waktu');
    cleanedKeyword = cleanedKeyword.replace(/\b(part\s*time|paruh\s+waktu)\b/gi, '').trim();
  } else if (lower.includes('full time') || lower.includes('full-time') || lower.includes('penuh waktu')) {
    detectedJobType = 'fulltime';
    actions.push('Tipe Penuh Waktu');
    cleanedKeyword = cleanedKeyword.replace(/\b(full\s*time|penuh\s+waktu)\b/gi, '').trim();
  } else if (lower.includes('kontrak') || lower.includes('pkwt')) {
    detectedJobType = 'contract';
    actions.push('Tipe Kontrak');
    cleanedKeyword = cleanedKeyword.replace(/\b(kontrak|pkwt)\b/gi, '').trim();
  }

  // 4. Check salary commands like "gaji di atas 8 juta", "gaji 5 juta"
  const salaryMatch = lower.match(/gaji\s+(di\s+atas\s+|minimal\s+|min\s+)?(\d+)\s*(juta|jt)/i);
  if (salaryMatch) {
    const num = parseInt(salaryMatch[2], 10);
    if (!isNaN(num) && num > 0) {
      detectedMinSalary = num * 1000000;
      actions.push(`Min. Gaji Rp ${num} Jt`);
      cleanedKeyword = cleanedKeyword.replace(/gaji\s+(di\s+atas\s+|minimal\s+|min\s+)?\d+\s*(juta|jt)/gi, '').trim();
    }
  }

  // 5. Check province / city (e.g., "di Jakarta", "wilayah Surabaya", "area Bandung")
  for (const [locationKey, provinceValue] of Object.entries(PROVINCE_VOICE_MAP)) {
    const locationRegex = new RegExp(`\\b(di\\s+|kota\\s+|wilayah\\s+|area\\s+)?${locationKey}\\b`, 'i');
    if (locationRegex.test(lower)) {
      detectedProvince = provinceValue;
      actions.push(`Lokasi ${provinceValue}`);
      // Remove location phrasing from keyword
      cleanedKeyword = cleanedKeyword.replace(locationRegex, '').trim();
      break;
    }
  }

  // Clean trailing punctuation or prepositions like "di", "untuk", "dan", "yang"
  cleanedKeyword = cleanedKeyword
    .replace(/^(\s*di|\s*untuk|\s*yang|\s*pada)\s+/i, '')
    .replace(/\s+(di|untuk|yang)$/i, '')
    .trim();

  // If keyword ended up empty but filters were found, provide helpful action summary
  if (!cleanedKeyword && actions.length > 0) {
    return {
      rawTranscript: text,
      cleanedKeyword: '',
      detectedProvince,
      detectedJobType,
      detectedWorkplace,
      detectedMinSalary,
      actionSummary: `Menerapkan filter: ${actions.join(', ')}`
    };
  }

  if (cleanedKeyword) {
    actions.unshift(`Mencari "${cleanedKeyword}"`);
  }

  return {
    rawTranscript: text,
    cleanedKeyword: cleanedKeyword || text,
    detectedProvince,
    detectedJobType,
    detectedWorkplace,
    detectedMinSalary,
    actionSummary: actions.length > 0 ? actions.join(' • ') : `Mencari "${text}"`
  };
};

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onApplyVoiceResult
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Mendengarkan suara Anda...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<VoiceCommandResult | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);

  // Check speech recognition capability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setHasSpeechSupport(!!SpeechRecognition);
    }
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setInterimTranscript('');
    setParsedResult(null);
    isManuallyStoppedRef.current = false;

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      setErrorMessage(
        'Peramban ini tidak mendukung Web Speech API secara native. Silakan gunakan peramban berbasis Chromium (Chrome, Edge) atau gunakan simulasi uji suara di bawah.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; // Indonesian voice recognition with fallback support
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Mendengarkan... Silakan ucapkan posisi, keahlian, atau kota.');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          const combined = (transcript ? `${transcript} ${final}` : final).trim();
          setTranscript(combined);
          setInterimTranscript('');
          const parsed = parseVoiceCommand(combined);
          setParsedResult(parsed);
          setStatusMessage('Suara berhasil dikenali!');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage(
            'Izin mikrofon tidak diberikan atau diblokir. Mohon klik ikon gembok/pengaturan di bilah alamat peramban dan izinkan mikrofon.'
          );
        } else if (event.error === 'no-speech') {
          setStatusMessage('Tidak ada suara terdeteksi. Silakan berbicara lebih dekat ke mikrofon.');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('Mikrofon tidak ditemukan pada perangkat Anda. Pastikan perangkat mikrofon aktif.');
        } else if (event.error === 'network') {
          setErrorMessage('Terjadi gangguan jaringan pada layanan speech recognition peramban.');
        } else {
          setErrorMessage(`Pengenalan suara mengalami kendala: ${event.error || 'silakan coba lagi'}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!isManuallyStoppedRef.current && !errorMessage) {
          setStatusMessage('Sesi dengar selesai. Anda dapat meninjau hasil atau berbicara lagi.');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setErrorMessage(
        'Gagal memulai perekaman suara: ' + (err?.message || 'Pastikan mikrofon diizinkan.')
      );
      setIsListening(false);
    }
  };

  const stopListening = () => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop on inactive
      }
    }
    setIsListening(false);

    // If we have an interim transcript but no final one yet, adopt interim
    if (!transcript && interimTranscript) {
      const text = interimTranscript.trim();
      setTranscript(text);
      setInterimTranscript('');
      const parsed = parseVoiceCommand(text);
      setParsedResult(parsed);
    }
  };

  // Start listening automatically whenever modal opens
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [isOpen]);

  // Apply parsed results to Search Screen
  const handleApply = (resultToApply?: VoiceCommandResult) => {
    const target = resultToApply || parsedResult;
    if (target) {
      stopListening();
      onApplyVoiceResult(target);
      onClose();
    } else if (transcript || interimTranscript) {
      const fallback = parseVoiceCommand(transcript || interimTranscript);
      stopListening();
      onApplyVoiceResult(fallback);
      onClose();
    }
  };

  // Quick preset voice queries for accessibility & effortless testability
  const SAMPLE_VOICE_COMMANDS = [
    { label: 'Software Engineer di Jakarta', query: 'Software Engineer di Jakarta' },
    { label: 'Barista Bandung', query: 'Barista di Bandung' },
    { label: 'Lowongan Remote Desain', query: 'Desainer Grafis kerja remote' },
    { label: 'Magang IT', query: 'Magang IT Web Developer' },
    { label: 'Staff Admin Full-time', query: 'Staff Administrasi full time' },
    { label: 'Gaji di atas 8 juta', query: 'Cari pekerjaan gaji di atas 8 juta' },
    { label: 'Reset Filter', query: 'Reset filter' }
  ];

  const handleSimulateVoice = (sample: string) => {
    stopListening();
    setTranscript(sample);
    setInterimTranscript('');
    setErrorMessage(null);
    const parsed = parseVoiceCommand(sample);
    setParsedResult(parsed);
    setStatusMessage('Perintah suara terdeteksi!');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#8B0026] to-rose-700 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 id="voice-modal-title" className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Pencarian Suara KITA</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-[#8B0026] dark:text-red-300 text-[10px] font-black uppercase tracking-wider">
                  Voice AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ucapkan posisi, kota, tipe kerja, atau perintah suara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup pencarian suara"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Animated Central Microphone Visualizer */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Waves when listening */}
              {isListening && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-red-500/15 dark:bg-red-500/25 animate-ping duration-1000 pointer-events-none" />
                  <div className="absolute w-24 h-24 rounded-full bg-[#8B0026]/20 dark:bg-red-500/30 animate-pulse pointer-events-none" />
                </>
              )}

              {/* Central Mic Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#8B0026] to-red-600 text-white ring-4 ring-red-400/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
                aria-label={isListening ? 'Hentikan mendengarkan' : 'Mulai mendengarkan'}
              >
                {isListening ? (
                  <Mic className="w-8 h-8 animate-pulse text-white" />
                ) : (
                  <MicOff className="w-7 h-7 text-slate-500 dark:text-slate-400" />
                )}
              </button>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center gap-1.5 mt-4 h-6">
              {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9, 0.3].map((heightScale, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isListening
                      ? 'bg-gradient-to-t from-[#8B0026] to-rose-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{
                    height: isListening ? `${Math.max(6, Math.min(24, 24 * heightScale))}px` : '4px',
                    animation: isListening ? `pulse 1s ease-in-out ${idx * 0.1}s infinite alternate` : 'none'
                  }}
                />
              ))}
            </div>

            {/* Status Feedback Text */}
            <p className="mt-2 text-xs font-semibold text-center text-slate-600 dark:text-slate-300">
              {statusMessage}
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  Tip: Pastikan peramban memiliki izin mikrofon, atau gunakan tombol contoh suara di bawah untuk menguji langsung.
                </p>
              </div>
            </div>
          )}

          {/* Spoken Voice Transcription Area */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
                <span>Teks Terdeteksi:</span>
              </span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setInterimTranscript('');
                    setParsedResult(null);
                  }}
                  className="hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="min-h-[44px] flex items-center">
              {transcript || interimTranscript ? (
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  <span>{transcript}</span>
                  {interimTranscript && (
                    <span className="text-slate-400 dark:text-slate-500 italic ml-1">
                      {interimTranscript}...
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  Belum ada kata terucap. Bicaralah sekarang atau pilih salah satu contoh di bawah...
                </p>
              )}
            </div>

            {/* Smart Voice Parsing Result Breakdown */}
            {parsedResult && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#8B0026] dark:text-red-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Pemahaman Pintar (Voice Commands):</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>{parsedResult.actionSummary}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsedResult.cleanedKeyword && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <Command className="w-2.5 h-2.5" />
                        Kata Kunci: &quot;{parsedResult.cleanedKeyword}&quot;
                      </span>
                    )}
                    {parsedResult.detectedProvince && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                        <MapPin className="w-2.5 h-2.5 text-blue-500" />
                        Provinsi: {parsedResult.detectedProvince}
                      </span>
                    )}
                    {parsedResult.detectedWorkplace && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                        <Laptop className="w-2.5 h-2.5 text-emerald-500" />
                        Mode: {parsedResult.detectedWorkplace}
                      </span>
                    )}
                    {parsedResult.detectedJobType && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40">
                        <Briefcase className="w-2.5 h-2.5 text-purple-500" />
                        Tipe: {parsedResult.detectedJobType}
                      </span>
                    )}
                    {parsedResult.detectedMinSalary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                        <SlidersHorizontal className="w-2.5 h-2.5 text-amber-500" />
                        Min: Rp {(parsedResult.detectedMinSalary / 1000000).toFixed(0)} Jt
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Voice Command Cheat-Sheet & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Command className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
                <span>Contoh Perintah Suara Cepat:</span>
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk uji coba</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_COMMANDS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSimulateVoice(sample.query)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#8B0026] dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{sample.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {isListening ? (
              <button
                type="button"
                onClick={stopListening}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Selesai Bicara</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startListening}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
                <span>Bicara Lagi</span>
              </button>
            )}

            <button
              type="button"
              disabled={!transcript && !interimTranscript && !parsedResult}
              onClick={() => handleApply()}
              className="px-5 py-2 bg-[#8B0026] hover:bg-[#6b001d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Cari Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
