import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Bookmark,
  CheckCircle2,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  DollarSign,
  Laptop,
  Layers,
  ArrowUpDown,
  RotateCcw,
  Check,
  ShieldCheck,
  Building,
  Sliders,
  ChevronUp,
  MonitorSmartphone,
  History,
  Clock,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Tag
} from 'lucide-react';
import type { JobListing, JobType, WorkplaceType } from '../../shared/types.js';
import { VoiceSearchModal, type VoiceCommandResult } from '../VoiceSearchModal.js';
import { getJobSkillTags, matchJobBySkillOrKeyword } from '../../lib/skillsHelper.js';
import { IndonesiaJobSources } from '../IndonesiaJobSources.js';

interface SearchScreenViewProps {
  jobs: JobListing[];
  loading: boolean;
  onSelectJob: (job: JobListing) => void;
  onToggleBookmark: (jobId: string) => void;
  initialKeyword?: string;
}

const PROVINCES = [
  'Semua Provinsi',
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten', 'Bali',
  'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
  'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara',
  'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah',
  'Papua Pegunungan', 'Papua Barat Daya'
];

const JOB_TYPE_OPTIONS: { id: string; label: string; value: JobType | 'all' }[] = [
  { id: 'all', label: 'Semua Tipe', value: 'all' },
  { id: 'fulltime', label: 'Penuh Waktu (Full-time)', value: 'fulltime' },
  { id: 'freelance', label: 'Freelance / Proyek', value: 'freelance' },
  { id: 'parttime', label: 'Paruh Waktu (Part-time)', value: 'parttime' },
  { id: 'internship', label: 'Magang / Internship', value: 'internship' },
  { id: 'contract', label: 'Kontrak (PKWT)', value: 'contract' }
];

const WORKPLACE_OPTIONS: { id: string; label: string; iconDesc: string; value: WorkplaceType | 'all' }[] = [
  { id: 'all', label: 'Semua Mode', iconDesc: 'Semua lokasi kerja', value: 'all' },
  { id: 'remote', label: 'Remote / WFH', iconDesc: 'Kerja jarak jauh dari rumah', value: 'remote' },
  { id: 'hybrid', label: 'Hybrid', iconDesc: 'Kombinasi kantor & rumah', value: 'hybrid' },
  { id: 'onsite', label: 'On-site / Kantor', iconDesc: 'Kerja langsung di lokasi / toko', value: 'onsite' }
];

const CATEGORIES = [
  'Semua Kategori',
  'Teknologi & IT',
  'Logistik & Rantai Pasok',
  'Perbankan & Keuangan',
  'Manufaktur & Produksi',
  'Energi & Lingkungan',
  'Desain & Industri Kreatif',
  'Pemasaran & Media Sosial',
  'Manajemen & Strategi Bisnis',
  'UMKM & Kuliner'
];

const SALARY_DROPDOWN_OPTIONS = [
  { id: 'all', label: 'Semua Rentang Gaji', min: 0, max: 0 },
  { id: 'under_4m', label: '< Rp 4 Juta (UMR / Entri)', min: 0, max: 4000000 },
  { id: '4m_7m', label: 'Rp 4 - 7 Juta (Menengah)', min: 4000000, max: 7000000 },
  { id: '7m_12m', label: 'Rp 7 - 12 Juta (Profesional)', min: 7000000, max: 12000000 },
  { id: '12m_20m', label: 'Rp 12 - 20 Juta (Senior / Lead)', min: 12000000, max: 20000000 },
  { id: 'over_20m', label: '> Rp 20 Juta (Eksekutif)', min: 20000000, max: 0 }
];

const SALARY_PRESETS = [
  { id: 'all', label: 'Semua Gaji', min: 0, max: 0 },
  { id: '3m', label: '> Rp 3 Jt', min: 3000000, max: 0 },
  { id: '5m', label: '> Rp 5 Jt', min: 5000000, max: 0 },
  { id: '8m', label: '> Rp 8 Jt', min: 8000000, max: 0 },
  { id: '12m', label: '> Rp 12 Jt', min: 12000000, max: 0 },
  { id: '20m', label: '> Rp 20 Jt', min: 20000000, max: 0 }
];

const QUICK_FILTER_CHIPS = [
  { id: 'all', label: 'Semua' },
  { id: 'remote', label: 'Remote / WFH' },
  { id: 'fulltime', label: 'Penuh Waktu' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'jakarta', label: 'DKI Jakarta' },
  { id: 'surabaya', label: 'Surabaya' },
  { id: 'salary_high', label: 'Gaji > 7 Juta' },
  { id: 'bumn', label: 'BUMN & Resmi' },
  { id: 'umkm', label: 'UMKM NIB' }
];

export const SearchScreenView: React.FC<SearchScreenViewProps> = ({
  jobs,
  loading,
  onSelectJob,
  onToggleBookmark,
  initialKeyword = ''
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [activeChip, setActiveChip] = useState('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [showSalarySliderCard, setShowSalarySliderCard] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('Semua Provinsi');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');
  const [selectedSalaryDropdown, setSelectedSalaryDropdown] = useState<string>('all');
  const [minSalaryInput, setMinSalaryInput] = useState<number>(0);
  const [maxSalaryInput, setMaxSalaryInput] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'salary_desc' | 'salary_asc'>('newest');
  const [visibleCount, setVisibleCount] = useState(10);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [voiceFeedbackNotice, setVoiceFeedbackNotice] = useState<string | null>(null);

  // Recent Searches tracked via localStorage (max 5 queries)
  const RECENT_SEARCHES_STORAGE_KEY = 'kita_recent_searches';
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('kita_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 5);
        }
      }
    } catch (e) {
      console.error('Failed to read recent searches from localStorage', e);
    }
    return [];
  });

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent search to localStorage', e);
      }
      return updated;
    });
  };

  const removeRecentSearch = (itemToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update recent searches in localStorage', e);
      }
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches in localStorage', e);
    }
  };

  // Debounced auto-save of typed search queries
  useEffect(() => {
    const trimmed = keyword.trim();
    if (trimmed.length >= 2) {
      const timer = setTimeout(() => {
        saveRecentSearch(trimmed);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [keyword]);

  // Synchronize initialKeyword updates when navigating from HomeScreen skill tags, Location screen, or City shortcuts
  useEffect(() => {
    if (initialKeyword !== undefined) {
      setKeyword(initialKeyword);
      if (initialKeyword.trim()) {
        // Reset quick-chip filter to 'all' so conflicting chips don't block the skill search results
        setActiveChip('all');
        const matchedProv = PROVINCES.find(
          (p) =>
            p !== 'Semua Provinsi' &&
            (p.toLowerCase() === initialKeyword.toLowerCase() ||
              initialKeyword.toLowerCase().includes(p.toLowerCase()))
        );
        if (matchedProv) {
          setSelectedProvince(matchedProv);
        }
      }
    }
  }, [initialKeyword]);

  const handleApplyVoiceResult = (result: VoiceCommandResult) => {
    if (result.isResetCommand) {
      resetAllFilters();
      setVoiceFeedbackNotice('Filter dan pencarian telah direset');
      setTimeout(() => setVoiceFeedbackNotice(null), 3500);
      return;
    }

    if (result.cleanedKeyword !== undefined && result.cleanedKeyword.length > 0) {
      setKeyword(result.cleanedKeyword);
      saveRecentSearch(result.cleanedKeyword);
    }

    if (result.detectedProvince) {
      setSelectedProvince(result.detectedProvince);
    }

    if (result.detectedJobType) {
      setSelectedJobType(result.detectedJobType);
    }

    if (result.detectedWorkplace) {
      setSelectedWorkplace(result.detectedWorkplace);
    }

    if (result.detectedMinSalary) {
      setMinSalaryInput(result.detectedMinSalary);
      const match = SALARY_DROPDOWN_OPTIONS.find((o) => o.min === result.detectedMinSalary);
      setSelectedSalaryDropdown(match ? match.id : 'custom');
    }

    setVoiceFeedbackNotice(result.actionSummary);
    setTimeout(() => setVoiceFeedbackNotice(null), 4000);
  };

  const formatRupiah = (val?: number) => {
    if (!val || val === 0) return 'Gaji Dirahasiakan';
    return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Juta`;
  };

  const handleSalaryDropdownChange = (optionId: string) => {
    setSelectedSalaryDropdown(optionId);
    const found = SALARY_DROPDOWN_OPTIONS.find((o) => o.id === optionId);
    if (found) {
      setMinSalaryInput(found.min);
      setMaxSalaryInput(found.max);
    }
  };

  const handleSalaryPresetChange = (presetId: string) => {
    const found = SALARY_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setMinSalaryInput(found.min);
      setMaxSalaryInput(found.max);
      if (presetId === 'all') {
        setSelectedSalaryDropdown('all');
      } else {
        setSelectedSalaryDropdown('custom');
      }
    }
  };

  const handleMinSliderChange = (newVal: number) => {
    setMinSalaryInput(newVal);
    if (maxSalaryInput > 0 && newVal > maxSalaryInput) {
      setMaxSalaryInput(newVal + 2000000);
    }
    const match = SALARY_DROPDOWN_OPTIONS.find((o) => o.min === newVal && o.max === maxSalaryInput);
    setSelectedSalaryDropdown(match ? match.id : 'custom');
  };

  const handleMaxSliderChange = (newVal: number) => {
    setMaxSalaryInput(newVal);
    const match = SALARY_DROPDOWN_OPTIONS.find((o) => o.min === minSalaryInput && o.max === newVal);
    setSelectedSalaryDropdown(match ? match.id : 'custom');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (keyword.trim()) count++;
    if (selectedJobType !== 'all') count++;
    if (selectedWorkplace !== 'all') count++;
    if (selectedProvince !== 'Semua Provinsi') count++;
    if (selectedCategory !== 'Semua Kategori') count++;
    if (minSalaryInput > 0 || maxSalaryInput > 0) count++;
    if (verifiedOnly) count++;
    if (sortBy !== 'newest') count++;
    if (activeChip !== 'all') count++;
    return count;
  }, [
    keyword,
    selectedJobType,
    selectedWorkplace,
    selectedProvince,
    selectedCategory,
    minSalaryInput,
    maxSalaryInput,
    verifiedOnly,
    sortBy,
    activeChip
  ]);

  const resetAllFilters = () => {
    setKeyword('');
    setActiveChip('all');
    setSelectedJobType('all');
    setSelectedWorkplace('all');
    setSelectedProvince('Semua Provinsi');
    setSelectedCategory('Semua Kategori');
    setSelectedSalaryDropdown('all');
    setMinSalaryInput(0);
    setMaxSalaryInput(0);
    setVerifiedOnly(false);
    setSortBy('newest');
    setShowSalarySliderCard(false);
  };

  const resetSalaryFilter = () => {
    setSelectedSalaryDropdown('all');
    setMinSalaryInput(0);
    setMaxSalaryInput(0);
  };

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        if (keyword.trim()) {
          if (!matchJobBySkillOrKeyword(job, keyword.trim())) {
            return false;
          }
        }

        if (activeChip === 'remote' && job.workplace_type !== 'remote') return false;
        if (activeChip === 'fulltime' && job.job_type !== 'fulltime') return false;
        if (activeChip === 'freelance' && job.job_type !== 'freelance') return false;
        if (
          activeChip === 'jakarta' &&
          !job.province.toLowerCase().includes('jakarta') &&
          !job.city.toLowerCase().includes('jakarta')
        ) {
          return false;
        }
        if (activeChip === 'surabaya' && !job.city.toLowerCase().includes('surabaya')) return false;
        if (activeChip === 'salary_high' && (job.min_salary || 0) < 7000000) return false;
        if (
          activeChip === 'bumn' &&
          job.source_type !== 'bumn_fhci' &&
          job.source_type !== 'kemnaker_karirhub'
        ) {
          return false;
        }
        if (
          activeChip === 'umkm' &&
          !job.category.toLowerCase().includes('umkm') &&
          job.company_verified_status !== 'verified_nib'
        ) {
          return false;
        }

        if (selectedJobType !== 'all' && job.job_type !== selectedJobType) return false;
        if (selectedWorkplace !== 'all' && job.workplace_type !== selectedWorkplace) return false;

        if (selectedProvince !== 'Semua Provinsi') {
          const provMatch =
            job.province?.toLowerCase().includes(selectedProvince.toLowerCase()) ||
            job.city?.toLowerCase().includes(selectedProvince.toLowerCase());
          if (!provMatch) return false;
        }

        if (selectedCategory !== 'Semua Kategori') {
          const cat = selectedCategory.toLowerCase();
          const jobCat = (job.category || '').toLowerCase();
          const jobTitle = (job.title || '').toLowerCase();

          let matches = jobCat.includes(cat) || cat.includes(jobCat);
          if (!matches) {
            if (cat.includes('teknologi') || cat.includes('it')) {
              matches = jobCat.includes('teknologi') || jobCat.includes('it') || jobTitle.includes('developer') || jobTitle.includes('engineer');
            } else if (cat.includes('logistik') || cat.includes('operasional')) {
              matches = jobCat.includes('logistik') || jobCat.includes('rantai pasok') || jobCat.includes('transportasi') || jobCat.includes('operasional');
            } else if (cat.includes('perbankan') || cat.includes('keuangan')) {
              matches = jobCat.includes('perbankan') || jobCat.includes('keuangan') || jobCat.includes('bank');
            } else if (cat.includes('manufaktur') || cat.includes('produksi')) {
              matches = jobCat.includes('manufaktur') || jobCat.includes('produksi') || jobCat.includes('mekatronika');
            } else if (cat.includes('energi') || cat.includes('lingkungan')) {
              matches = jobCat.includes('energi') || jobCat.includes('pertambangan') || jobCat.includes('lingkungan');
            } else if (cat.includes('desain') || cat.includes('kreatif')) {
              matches = jobCat.includes('desain') || jobCat.includes('kreatif') || jobTitle.includes('ui/ux') || jobTitle.includes('desain');
            } else if (cat.includes('pemasaran') || cat.includes('media sosial')) {
              matches = jobCat.includes('pemasaran') || jobCat.includes('media sosial') || jobCat.includes('marketing') || jobCat.includes('penjualan');
            } else if (cat.includes('manajemen') || cat.includes('strategi')) {
              matches = jobCat.includes('manajemen') || jobCat.includes('strategi') || jobCat.includes('bisnis');
            } else if (cat.includes('umkm') || cat.includes('kuliner')) {
              matches = jobCat.includes('umkm') || jobCat.includes('kuliner') || job.company_verified_status === 'verified_nib';
            }
          }
          if (!matches) return false;
        }

        const jobMin = job.min_salary || 0;
        const jobMax = job.max_salary || jobMin;

        if (minSalaryInput > 0) {
          if (jobMax > 0 && jobMax < minSalaryInput) return false;
          if (jobMax === 0 && jobMin > 0 && jobMin < minSalaryInput) return false;
        }

        if (maxSalaryInput > 0) {
          if (jobMin > maxSalaryInput) return false;
        }

        if (verifiedOnly && !job.is_verified_employer) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'salary_desc') return (b.min_salary || 0) - (a.min_salary || 0);
        if (sortBy === 'salary_asc') return (a.min_salary || 0) - (b.min_salary || 0);
        return new Date(b.publication_date || b.created_at).getTime() - new Date(a.publication_date || a.created_at).getTime();
      });
  }, [
    jobs,
    keyword,
    activeChip,
    selectedJobType,
    selectedWorkplace,
    selectedProvince,
    selectedCategory,
    minSalaryInput,
    maxSalaryInput,
    verifiedOnly,
    sortBy
  ]);

  const filterCriteriaKey = useMemo(() => {
    return [
      keyword.trim().toLowerCase(),
      activeChip,
      selectedJobType,
      selectedWorkplace,
      selectedProvince,
      selectedCategory,
      minSalaryInput,
      maxSalaryInput,
      verifiedOnly ? 'verified' : 'all',
      sortBy
    ].join('|');
  }, [
    keyword,
    activeChip,
    selectedJobType,
    selectedWorkplace,
    selectedProvince,
    selectedCategory,
    minSalaryInput,
    maxSalaryInput,
    verifiedOnly,
    sortBy
  ]);

  const [isFilteringTransition, setIsFilteringTransition] = useState(false);
  const prevFilterKeyRef = useRef(filterCriteriaKey);

  useEffect(() => {
    if (prevFilterKeyRef.current !== filterCriteriaKey) {
      prevFilterKeyRef.current = filterCriteriaKey;
      setIsFilteringTransition(true);
      setVisibleCount(10);
      const timer = setTimeout(() => {
        setIsFilteringTransition(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [filterCriteriaKey]);

  const displayedJobs = filteredJobs.slice(0, visibleCount);

  return (
    <div className="space-y-3.5 max-w-xl mx-auto pb-6 transition-colors duration-200">
      {/* Top Search Input & Filter Drawer Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && keyword.trim()) {
                saveRecentSearch(keyword);
              }
            }}
            placeholder="Cari lowongan, keahlian, UMKM, atau gunakan suara..."
            className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#8B0026] focus:ring-1 focus:ring-[#8B0026] shadow-2xs transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Hapus kata kunci"
                title="Hapus kata kunci"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="p-1.5 rounded-xl text-[#8B0026] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
              title="Pencarian Suara & Perintah Suara (Voice Search)"
              aria-label="Cari lowongan dengan suara"
            >
              <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setFilterDrawerOpen(true)}
          className={`relative p-2.5 rounded-2xl border transition-all flex items-center justify-center shrink-0 shadow-2xs ${
            activeFilterCount > 0
              ? 'bg-[#8B0026] text-white border-[#8B0026]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Semua Filter Lanjutan"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-[#8B0026] rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-2xs">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Voice Command Applied Banner */}
      {voiceFeedbackNotice && (
        <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-red-50 via-rose-50 to-white dark:from-red-950/40 dark:via-slate-900 dark:to-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs text-slate-800 dark:text-slate-200 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-[#8B0026] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Mic className="w-3.5 h-3.5" />
            </span>
            <span className="truncate font-semibold text-xs">
              <strong className="text-[#8B0026] dark:text-red-400 font-extrabold mr-1">
                Perintah Suara:
              </strong>
              {voiceFeedbackNotice}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg shrink-0 ml-2 cursor-pointer"
            aria-label="Tutup notifikasi suara"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Recent Searches (Pencarian Terakhir) Quick Re-Access Section */}
      {recentSearches.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <History className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
              <span>Pencarian Terakhir</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                ({recentSearches.length}/5)
              </span>
            </div>
            <button
              type="button"
              onClick={clearAllRecentSearches}
              className="text-[11px] font-semibold text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              Hapus Riwayat
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {recentSearches.map((item, idx) => {
              const isCurrentActive = keyword.trim().toLowerCase() === item.toLowerCase();
              return (
                <div
                  key={`${item}-${idx}`}
                  onClick={() => {
                    setKeyword(item);
                    saveRecentSearch(item);
                  }}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                    isCurrentActive
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-[#8B0026] dark:text-red-300 ring-1 ring-[#8B0026]'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                  title={`Cari ulang "${item}"`}
                >
                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-[#8B0026] dark:group-hover:text-red-400 transition-colors" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{item}</span>
                  <button
                    type="button"
                    onClick={(e) => removeRecentSearch(item, e)}
                    className="p-0.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-0.5"
                    title={`Hapus "${item}" dari riwayat`}
                    aria-label={`Hapus ${item}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Salary Range Dropdown & Slider Toggle Controls */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <DollarSign className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400 shrink-0" />
              <select
                value={selectedSalaryDropdown}
                onChange={(e) => handleSalaryDropdownChange(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer truncate"
              >
                {SALARY_DROPDOWN_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
                {selectedSalaryDropdown === 'custom' && (
                  <option value="custom" className="dark:bg-slate-900">Kustom (Slider Aktif)</option>
                )}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSalarySliderCard(!showSalarySliderCard)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shrink-0 transition-all ${
              showSalarySliderCard || minSalaryInput > 0 || maxSalaryInput > 0
                ? 'bg-[#8B0026] text-white border-[#8B0026] shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Buka Slider Rentang Gaji"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Slider Gaji</span>
            {showSalarySliderCard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Slider Card */}
        {showSalarySliderCard && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <DollarSign className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
                <span>Atur Ekspektasi Gaji Bulanan</span>
              </div>
              <span className="text-xs font-black text-[#8B0026] dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-900">
                {minSalaryInput > 0 ? formatRupiah(minSalaryInput) : 'Rp 0'}
                {' - '}
                {maxSalaryInput > 0 ? formatRupiah(maxSalaryInput) : 'Tak Terbatas'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>Gaji Minimal:</span>
                <span className="font-bold text-[#8B0026] dark:text-red-400">
                  {minSalaryInput === 0 ? 'Semua Gaji (Rp 0)' : `${(minSalaryInput / 1000000).toFixed(1)} Juta/bln`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20000000"
                step="500000"
                value={minSalaryInput}
                onChange={(e) => handleMinSliderChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#8B0026]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>Gaji Maksimal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {maxSalaryInput === 0 ? 'Tak Terbatas' : `${(maxSalaryInput / 1000000).toFixed(1)} Juta/bln`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30000000"
                step="1000000"
                value={maxSalaryInput}
                onChange={(e) => handleMaxSliderChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#8B0026]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {SALARY_PRESETS.map((p) => {
                const isActive =
                  (p.id === 'all' && minSalaryInput === 0 && maxSalaryInput === 0) ||
                  (p.min === minSalaryInput && p.max === maxSalaryInput);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSalaryPresetChange(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      isActive
                        ? 'bg-[#8B0026] text-white border-[#8B0026]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={resetSalaryFilter}
                className="text-[11px] font-bold text-slate-500 hover:text-[#8B0026] dark:hover:text-red-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Gaji
              </button>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span className="text-[#8B0026] dark:text-red-400 font-extrabold">{filteredJobs.length}</span> lowongan sesuai
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Work Mode Toggle (Remote, Hybrid, Onsite) */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
            <span>Mode Lokasi Kerja</span>
          </span>
          {selectedWorkplace !== 'all' ? (
            <button
              onClick={() => setSelectedWorkplace('all')}
              className="text-[11px] font-bold text-[#8B0026] dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Mode
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Semua Tipe Aktif</span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedWorkplace('all')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              selectedWorkplace === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setSelectedWorkplace('remote')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              selectedWorkplace === 'remote'
                ? 'bg-[#8B0026] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#8B0026] dark:hover:text-red-400'
            }`}
          >
            <Laptop className="w-3 h-3 shrink-0" />
            <span>Remote</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedWorkplace('hybrid')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              selectedWorkplace === 'hybrid'
                ? 'bg-[#8B0026] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#8B0026] dark:hover:text-red-400'
            }`}
          >
            <MonitorSmartphone className="w-3 h-3 shrink-0" />
            <span>Hybrid</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedWorkplace('onsite')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              selectedWorkplace === 'onsite'
                ? 'bg-[#8B0026] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#8B0026] dark:hover:text-red-400'
            }`}
          >
            <Building className="w-3 h-3 shrink-0" />
            <span>On-site</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        {QUICK_FILTER_CHIPS.map((chip) => {
          const isActive = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveChip(isActive ? 'all' : chip.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all shrink-0 text-xs ${
                isActive
                  ? 'bg-[#8B0026] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Active Filter Pills Bar */}
      {activeFilterCount > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
              Filter Aktif ({activeFilterCount})
            </span>
            <button
              onClick={resetAllFilters}
              className="text-[#8B0026] dark:text-red-400 font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Semua
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keyword.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900 text-[11px] font-bold text-[#8B0026] dark:text-red-300 shadow-2xs">
                <Tag className="w-3 h-3 text-[#8B0026] dark:text-red-400 shrink-0" />
                <span>Keahlian / Kata Kunci:</span>
                <strong className="underline underline-offset-2 decoration-[#8B0026]/40">"{keyword.trim()}"</strong>
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="p-0.5 text-slate-400 hover:text-red-600 dark:hover:text-red-300 ml-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  title="Hapus filter keahlian ini"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(minSalaryInput > 0 || maxSalaryInput > 0) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                <DollarSign className="w-3 h-3 text-[#8B0026]" />
                <span>Gaji: </span>
                <strong className="text-[#8B0026] dark:text-red-400">
                  {minSalaryInput > 0 ? formatRupiah(minSalaryInput) : 'Rp 0'} -{' '}
                  {maxSalaryInput > 0 ? formatRupiah(maxSalaryInput) : 'Bebas'}
                </strong>
                <button onClick={resetSalaryFilter} className="text-slate-400 hover:text-red-600 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedJobType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Tipe: <strong className="text-[#8B0026] dark:text-red-400">{selectedJobType}</strong>
                <button onClick={() => setSelectedJobType('all')} className="text-slate-400 hover:text-slate-600 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedWorkplace !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Lokasi: <strong className="text-[#8B0026] dark:text-red-400">{selectedWorkplace}</strong>
                <button onClick={() => setSelectedWorkplace('all')} className="text-slate-400 hover:text-slate-600 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>Menampilkan</span>
          <span className="text-[#8B0026] dark:text-red-400 font-extrabold">{filteredJobs.length}</span>
          <span>Lowongan</span>
          {isFilteringTransition && (
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold animate-pulse">
              Memperbarui...
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent font-bold text-slate-700 dark:text-slate-300 hover:text-[#8B0026] focus:outline-hidden cursor-pointer"
          >
            <option value="newest" className="dark:bg-slate-900">Terbaru</option>
            <option value="salary_desc" className="dark:bg-slate-900">Gaji Tertinggi</option>
            <option value="salary_asc" className="dark:bg-slate-900">Gaji Terendah</option>
          </select>
        </div>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-[#8B0026] dark:text-red-400 flex items-center justify-center mx-auto mb-1">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Lowongan Tidak Ditemukan</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Tidak ada lowongan yang sesuai dengan kriteria pencarian Anda. Coba kurangi filter atau reset kata kunci.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B0026] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua Filter
            </button>
          </div>

          {/* Quick Popular Skill Suggestions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              Atau coba cari berdasarkan keahlian populer:
            </span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {['React', 'UI/UX', 'Logistik', 'K3 Umum', 'Barista', 'Otomasi Industri', 'Supply Chain'].map(
                (skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setKeyword(skill);
                      saveRecentSearch(skill);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-700 hover:border-red-300 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-[#8B0026] dark:hover:text-red-300 transition-colors cursor-pointer"
                  >
                    {skill}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-[#8B0026]/40 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer relative group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={
                      job.employer_logo ||
                      'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={job.employer_name || 'Perusahaan'}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#8B0026] dark:group-hover:text-red-400 transition-colors truncate">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                        {job.employer_name || 'Mitra Resmi KITA'}
                      </span>
                      {(job.is_verified_employer || job.company_verified_status !== 'pending_verification') && (
                        <span title="Terverifikasi Resmi">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(job.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-[#8B0026] dark:hover:text-red-400 rounded-lg transition-colors shrink-0"
                  title="Simpan Lowongan"
                >
                  <Bookmark
                    className={`w-4 h-4 ${job.is_saved ? 'fill-[#8B0026] text-[#8B0026] dark:fill-red-400 dark:text-red-400' : ''}`}
                  />
                </button>
              </div>

              {/* Interactive Clickable Skill Tags */}
              {(() => {
                const skillTags = getJobSkillTags(job);
                if (!skillTags || skillTags.length === 0) return null;
                return (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {skillTags.map((skill) => {
                      const isSelected = keyword.toLowerCase().trim() === skill.toLowerCase().trim();
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setKeyword(skill);
                            saveRecentSearch(skill);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs group/tag active:scale-95 ${
                            isSelected
                              ? 'bg-[#8B0026] text-white border border-[#8B0026] ring-1 ring-red-300 dark:ring-red-900'
                              : 'bg-slate-50 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-950/60 border border-slate-200/90 hover:border-red-300 dark:border-slate-700/80 dark:hover:border-red-800 text-slate-700 hover:text-[#8B0026] dark:text-slate-300 dark:hover:text-red-300'
                          }`}
                          title={`Saring lowongan dengan keahlian "${skill}"`}
                          aria-label={`Filter keahlian ${skill}`}
                        >
                          <Tag
                            className={`w-2.5 h-2.5 ${
                              isSelected
                                ? 'text-white'
                                : 'text-slate-400 group-hover/tag:text-[#8B0026] dark:group-hover/tag:text-red-400'
                            }`}
                          />
                          <span>{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.city}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {job.job_type === 'fulltime' ? 'Penuh Waktu' : job.job_type === 'freelance' ? 'Freelance' : job.job_type}
                  </span>
                  {job.workplace_type === 'remote' ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <Laptop className="w-3 h-3" />
                      Remote
                    </span>
                  ) : job.workplace_type === 'hybrid' ? (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      Hybrid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      On-site
                    </span>
                  )}
                </div>

                <div className="font-extrabold text-[#8B0026] dark:text-red-400 text-xs">
                  {(!job.min_salary && !job.max_salary) || (job.min_salary <= 0 && job.max_salary <= 0)
                    ? 'Kompetitif'
                    : formatRupiah(job.min_salary)}
                </div>
              </div>
            </div>
          ))}

          {visibleCount < filteredJobs.length && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="py-2.5 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors shadow-2xs"
              >
                Muat Lebih Banyak ({filteredJobs.length - visibleCount} tersisa)
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5">
        <IndonesiaJobSources />
      </div>

      {/* Advanced Filter Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Filter Lanjutan Lowongan
                </h3>
              </div>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Provinsi di Indonesia
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Sektor Industri
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tipe Pekerjaan
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {JOB_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedJobType(opt.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedJobType === opt.id
                          ? 'bg-[#8B0026] text-white border-[#8B0026] font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDrawerOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-[#8B0026] text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Terapkan Filter ({filteredJobs.length} Lowongan)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Search & Commands Recognition Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onApplyVoiceResult={handleApplyVoiceResult}
        provincesList={PROVINCES}
      />
    </div>
  );
};
