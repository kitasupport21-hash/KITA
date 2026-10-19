import provinceData from '../data/indonesia-provinces.json' with { type: 'json' };
import regencyData1 from '../data/indonesia-regencies-1.json' with { type: 'json' };
import regencyData2 from '../data/indonesia-regencies-2.json' with { type: 'json' };
import regencyData3 from '../data/indonesia-regencies-3.json' with { type: 'json' };

export type IndonesianProvince = { id: string; name: string };
export type IndonesianRegency = { id: string; provinceId: string; name: string };

export const INDONESIAN_PROVINCES = provinceData as IndonesianProvince[];
export const INDONESIAN_REGENCIES = [...regencyData1, ...regencyData2, ...regencyData3] as IndonesianRegency[];

export function displayProvinceName(name: string): string {
  if (name === 'Daerah Khusus Ibukota Jakarta') return 'DKI Jakarta';
  if (name === 'Daerah Istimewa Yogyakarta') return 'DI Yogyakarta';
  return name;
}

export function normalizeIndonesianLocation(value: string): string {
  const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const match = normalized.match(/^(kabupaten\s+administrasi|kabupaten\s+adm\.?|kabupaten|kab\.?|kota\s+administrasi|kota\s+adm\.?|kota)\s*(.*)$/);
  if (!match) return normalized.replace(/[^a-z0-9]+/g, ' ').trim();
  const type = match[1].startsWith('kab') ? 'kabupaten' : 'kota';
  const name = match[2].replace(/[^a-z0-9]+/g, ' ').trim();
  return `${type} ${name}`.trim();
}

export function filterRegenciesForProvince(provinceName: string): IndonesianRegency[] {
  const province = INDONESIAN_PROVINCES.find((item) => item.name === provinceName || displayProvinceName(item.name) === provinceName);
  return INDONESIAN_REGENCIES.filter((item) => !provinceName || provinceName === 'All Indonesia' || item.provinceId === province?.id)
    .slice().sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

export function regencyMatchesCity(regencyName: string, cityName: string): boolean {
  const regency = normalizeIndonesianLocation(regencyName);
  const city = normalizeIndonesianLocation(cityName);
  if (regency === city) return true;
  const hasType = (value: string) => /^(kabupaten|kota)\s/.test(value);
  const bareName = (value: string) => value.replace(/^(kabupaten|kota)\s+/, '');
  if (hasType(regency) && !hasType(city)) return bareName(regency) === city;
  if (!hasType(regency) && hasType(city)) return regency === bareName(city);
  return false;
}
