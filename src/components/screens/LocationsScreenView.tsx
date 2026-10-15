import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Compass,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Building2,
  X
} from 'lucide-react';
import { api } from '../../lib/api.js';

interface LocationsScreenViewProps {
  onSelectLocation: (province: string, city?: string) => void;
  onNavigateBack?: () => void;
}

export const LocationsScreenView: React.FC<LocationsScreenViewProps> = ({
  onSelectLocation,
  onNavigateBack
}) => {
  const [data, setData] = useState<{ regions: any[]; locationCounts: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState<string>('jawa');
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    const fetchLocs = async () => {
      setLoading(true);
      try {
        const res = await api.getLocations();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('Gagal memuat data lokasi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocs();
  }, []);

  const regions = data?.regions || [
    {
      id: 'jawa',
      name: 'Pulau Jawa',
      provinces: [
        { name: 'DKI Jakarta', count: 0, cities: ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Utara', 'Jakarta Timur'] },
        { name: 'Jawa Barat', count: 0, cities: ['Bandung', 'Bekasi', 'Bogor', 'Depok', 'Cimahi'] },
        { name: 'Jawa Timur', count: 0, cities: ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik', 'Banyuwangi'] },
        { name: 'DI Yogyakarta', count: 0, cities: ['Yogyakarta', 'Sleman', 'Bantul'] },
        { name: 'Jawa Tengah', count: 0, cities: ['Semarang', 'Surakarta', 'Magelang', 'Salatiga'] },
        { name: 'Banten', count: 0, cities: ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon'] }
      ]
    },
    {
      id: 'sumatera',
      name: 'Pulau Sumatera',
      provinces: [
        { name: 'Sumatera Utara', count: 0, cities: ['Medan', 'Binjai', 'Pematangsiantar'] },
        { name: 'Sumatera Barat', count: 0, cities: ['Padang', 'Bukittinggi'] },
        { name: 'Riau', count: 0, cities: ['Pekanbaru', 'Dumai'] },
        { name: 'Kepulauan Riau', count: 0, cities: ['Batam', 'Tanjungpinang'] },
        { name: 'Sumatera Selatan', count: 0, cities: ['Palembang', 'Prabumulih'] },
        { name: 'Lampung', count: 0, cities: ['Bandar Lampung', 'Metro'] }
      ]
    },
    {
      id: 'bali_nusa',
      name: 'Bali & Nusa Tenggara',
      provinces: [
        { name: 'Bali', count: 0, cities: ['Denpasar', 'Badung', 'Gianyar'] },
        { name: 'Nusa Tenggara Barat', count: 0, cities: ['Mataram', 'Bima'] },
        { name: 'Nusa Tenggara Timur', count: 0, cities: ['Kupang', 'Manggarai Barat'] }
      ]
    },
    {
      id: 'kalimantan',
      name: 'Pulau Kalimantan',
      provinces: [
        { name: 'Kalimantan Barat', count: 0, cities: ['Pontianak', 'Singkawang'] },
        { name: 'Kalimantan Timur', count: 0, cities: ['Balikpapan', 'Samarinda'] },
        { name: 'Kalimantan Selatan', count: 0, cities: ['Banjarmasin', 'Banjarbaru'] }
      ]
    },
    {
      id: 'sulawesi',
      name: 'Pulau Sulawesi',
      provinces: [
        { name: 'Sulawesi Selatan', count: 0, cities: ['Makassar', 'Palopo'] },
        { name: 'Sulawesi Utara', count: 0, cities: ['Manado', 'Bitung'] },
        { name: 'Sulawesi Tenggara', count: 0, cities: ['Kendari', 'Kolaka'] }
      ]
    },
    {
      id: 'maluku_papua',
      name: 'Maluku & Papua',
      provinces: [
        { name: 'Maluku', count: 0, cities: ['Ambon', 'Tual'] },
        { name: 'Papua', count: 0, cities: ['Jayapura', 'Biak Numfor'] },
        { name: 'Papua Barat Daya', count: 0, cities: ['Sorong', 'Raja Ampat'] }
      ]
    }
  ];

  const currentRegion = regions.find((r) => r.id === activeRegion) || regions[0];

  // Helper to safely extract string city name from string or object {name, count}
  const getCityName = (city: any): string => {
    if (typeof city === 'string') return city;
    if (city && typeof city === 'object' && typeof city.name === 'string') return city.name;
    return String(city || '');
  };

  const getCityCount = (city: any): number => {
    if (city && typeof city === 'object' && typeof city.count === 'number') return city.count;
    return 0;
  };

  const displayedProvinces = useMemo(() => {
    if (!searchCity.trim()) {
      return currentRegion.provinces;
    }
    const q = searchCity.toLowerCase().trim();
    return regions
      .flatMap((r) => r.provinces)
      .filter((p: any) => {
        const provMatches = p.name.toLowerCase().includes(q);
        const cityMatches = p.cities?.some((c: any) => getCityName(c).toLowerCase().includes(q));
        return provMatches || cityMatches;
      });
  }, [searchCity, currentRegion, regions]);

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-6 transition-colors duration-200">
      {/* Top Header with Back Button */}
      <div className="flex items-center gap-3">
        {onNavigateBack && (
          <button
            type="button"
            onClick={onNavigateBack}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Kembali ke Beranda"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
              Pusat Lowongan di Indonesia
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#8B0026] dark:text-red-300 text-[10px] font-bold shrink-0">
              38 Provinsi
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Pilih pulau, provinsi, atau kota untuk menjelajahi peluang kerja
          </p>
        </div>
      </div>

      {/* Nationwide Reset Button */}
      <button
        type="button"
        onClick={() => onSelectLocation('Semua Provinsi')}
        className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#8B0026] dark:hover:border-red-500 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-[#8B0026] dark:hover:text-red-400 flex items-center justify-between transition-all shadow-2xs group cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block leading-tight font-extrabold">Seluruh Wilayah Indonesia</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Tampilkan semua lowongan aktif tanpa batasan kota</span>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#8B0026] dark:text-red-300 text-[11px] font-bold group-hover:bg-[#8B0026] group-hover:text-white transition-colors">
          Buka Semua
        </div>
      </button>

      {/* Live City & Province Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          placeholder="Cari provinsi atau kota (contoh: Surabaya, Bandung, Medan, Bali)..."
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#8B0026] focus:ring-1 focus:ring-[#8B0026] shadow-2xs transition-all"
        />
        {searchCity && (
          <button
            type="button"
            onClick={() => setSearchCity('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            aria-label="Hapus pencarian kota"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stylized Indonesia Map SVG Illustration Banner */}
      <div className="bg-gradient-to-br from-red-950 via-[#8B0026] to-red-900 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold">
            <Compass className="w-3 h-3 text-red-200" />
            <span>38 Provinsi Tercover</span>
          </div>
          <span className="text-[10px] text-red-200 font-semibold">Sabang sampai Merauke</span>
        </div>

        <div className="py-2 opacity-80">
          <svg viewBox="0 0 800 240" className="w-full h-16 text-white fill-current">
            <path d="M50,40 L130,130 L110,160 L60,80 Z" opacity="0.9" />
            <path d="M140,175 L280,185 L260,200 L130,190 Z" opacity="0.95" />
            <path d="M210,60 L280,50 L310,120 L240,140 Z" opacity="0.9" />
            <path d="M340,70 L380,85 L360,115 L390,145 L350,155 L345,110 Z" opacity="0.9" />
            <path d="M290,195 L360,200 L350,210 L285,205 Z" opacity="0.85" />
            <path d="M420,110 L440,130 L430,150 Z M460,80 L560,95 L580,140 L500,165 Z" opacity="0.9" />
          </svg>
        </div>
        <div className="text-center pt-1">
          <span className="text-[11px] text-red-100 font-medium">
            Ketuk salah satu wilayah atau kota di bawah untuk langsung membuka lowongan:
          </span>
        </div>
      </div>

      {/* Island Region Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {regions.map((reg) => {
          const isActive = activeRegion === reg.id;
          return (
            <button
              key={reg.id}
              type="button"
              onClick={() => {
                setActiveRegion(reg.id);
                setSearchCity('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#8B0026] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {reg.name}
            </button>
          );
        })}
      </div>

      {/* Provinces & Cities in Selected Region */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {searchCity.trim() ? `Hasil Pencarian Lokasi (${displayedProvinces.length})` : `Provinsi di ${currentRegion.name}`}
          </h3>
          {searchCity.trim() && (
            <button
              type="button"
              onClick={() => setSearchCity('')}
              className="text-xs text-[#8B0026] dark:text-red-400 font-bold hover:underline cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
        </div>

        {displayedProvinces.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Wilayah "{searchCity}" tidak ditemukan</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Coba cari dengan kata kunci lain seperti Jakarta, Surabaya, atau Bali.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {displayedProvinces.map((prov: any) => (
              <div
                key={prov.name}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-400 flex items-center justify-center font-bold shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {prov.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {prov.count > 0 ? `${prov.count} Lowongan Aktif` : 'Tersedia Lowongan Resmi'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectLocation(prov.name)}
                    className="py-1.5 px-3 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900 text-[#8B0026] dark:text-red-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Buka Lowongan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {prov.cities && prov.cities.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 mr-1 shrink-0">Kota:</span>
                    {prov.cities.map((city: any, cIdx: number) => {
                      const cityName = getCityName(city);
                      const cityCount = getCityCount(city);
                      return (
                        <button
                          key={`${cityName}-${cIdx}`}
                          type="button"
                          onClick={() => onSelectLocation(prov.name, cityName)}
                          className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Lihat lowongan di ${cityName}, ${prov.name}`}
                        >
                          <span>{cityName}</span>
                          {cityCount > 0 && (
                            <span className="text-[9px] bg-red-100 dark:bg-red-950/60 text-[#8B0026] dark:text-red-300 px-1 rounded-full font-bold">
                              {cityCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
