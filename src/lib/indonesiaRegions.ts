import data from '../data/indonesia-regions.json' with { type: 'json' };

export type IndonesianProvince = { id: string; name: string };
export type IndonesianRegency = { id: string; provinceId: string; name: string };

export const INDONESIAN_PROVINCES = data.provinces as IndonesianProvince[];
export const INDONESIAN_REGENCIES = data.regencies as IndonesianRegency[];

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
  return normalizeIndonesianLocation(regencyName) === normalizeIndonesianLocation(cityName);
}
