/**
 * KITA - Official 38 Indonesian Provinces & Regencies Dataset
 * Covers all 38 official administrative provinces of the Republic of Indonesia
 * across 6 geographic region groups.
 */

export interface ProvinceData {
  name: string;
  capital: string;
  cities: string[];
}

export interface RegionData {
  id: string;
  name: string;
  provinces: ProvinceData[];
}

export const INDONESIA_38_PROVINCES: RegionData[] = [
  {
    id: 'sumatera',
    name: 'Pulau Sumatera',
    provinces: [
      {
        name: 'Aceh',
        capital: 'Banda Aceh',
        cities: ['Banda Aceh', 'Sabang', 'Lhokseumawe', 'Langsa', 'Subulussalam', 'Aceh Besar', 'Aceh Barat', 'Aceh Tengah', 'Aceh Utara', 'Bireuen']
      },
      {
        name: 'Sumatera Utara',
        capital: 'Medan',
        cities: ['Medan', 'Binjai', 'Pematangsiantar', 'Tebing Tinggi', 'Tanjungbalai', 'Sibolga', 'Padangsidimpuan', 'Gunungsitoli', 'Deli Serdang', 'Karo']
      },
      {
        name: 'Sumatera Barat',
        capital: 'Padang',
        cities: ['Padang', 'Bukittinggi', 'Payakumbuh', 'Pariaman', 'Solok', 'Padang Panjang', 'Sawahlunto', 'Agam', 'Tanah Datar', 'Pesisir Selatan']
      },
      {
        name: 'Riau',
        capital: 'Pekanbaru',
        cities: ['Pekanbaru', 'Dumai', 'Kampar', 'Siak', 'Pelalawan', 'Bengkalis', 'Indragiri Hulu', 'Indragiri Hilir', 'Rokan Hulu', 'Rokan Hilir']
      },
      {
        name: 'Kepulauan Riau',
        capital: 'Tanjungpinang',
        cities: ['Batam', 'Tanjungpinang', 'Bintan', 'Karimun', 'Natuna', 'Kepulauan Anambas', 'Lingga']
      },
      {
        name: 'Jambi',
        capital: 'Jambi',
        cities: ['Jambi', 'Sungai Penuh', 'Muaro Jambi', 'Batanghari', 'Bungo', 'Tebo', 'Merangin', 'Sarolangun', 'Tanjung Jabung Barat']
      },
      {
        name: 'Sumatera Selatan',
        capital: 'Palembang',
        cities: ['Palembang', 'Prabumulih', 'Lubuklinggau', 'Pagar Alam', 'Ogan Komering Ilir', 'Ogan Ilir', 'Muara Enim', 'Lahat', 'Banyuasin']
      },
      {
        name: 'Kepulauan Bangka Belitung',
        capital: 'Pangkalpinang',
        cities: ['Pangkalpinang', 'Bangka', 'Bangka Barat', 'Bangka Tengah', 'Bangka Selatan', 'Belitung', 'Belitung Timur']
      },
      {
        name: 'Bengkulu',
        capital: 'Bengkulu',
        cities: ['Bengkulu', 'Rejang Lebong', 'Bengkulu Utara', 'Bengkulu Selatan', 'Mukomuko', 'Seluma', 'Kaur', 'Kepahiang', 'Lebong']
      },
      {
        name: 'Lampung',
        capital: 'Bandar Lampung',
        cities: ['Bandar Lampung', 'Metro', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Timur', 'Lampung Utara', 'Lampung Barat', 'Pesawaran', 'Pringsewu', 'Tanggamus', 'Tulang Bawang']
      }
    ]
  },
  {
    id: 'jawa',
    name: 'Pulau Jawa',
    provinces: [
      {
        name: 'DKI Jakarta',
        capital: 'Jakarta Pusat',
        cities: ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Kepulauan Seribu']
      },
      {
        name: 'Jawa Barat',
        capital: 'Bandung',
        cities: ['Bandung', 'Bekasi', 'Bogor', 'Depok', 'Cimahi', 'Tasikmalaya', 'Cirebon', 'Sukabumi', 'Karawang', 'Purwakarta', 'Subang', 'Cianjur', 'Garut', 'Bandung Barat']
      },
      {
        name: 'Jawa Tengah',
        capital: 'Semarang',
        cities: ['Semarang', 'Surakarta', 'Magelang', 'Salatiga', 'Pekalongan', 'Tegal', 'Banyumas', 'Kudus', 'Cilacap', 'Brebes', 'Klaten', 'Sukoharjo', 'Boyolali', 'Jepara', 'Kendal']
      },
      {
        name: 'DI Yogyakarta',
        capital: 'Yogyakarta',
        cities: ['Yogyakarta', 'Sleman', 'Bantul', 'Kulon Progo', 'Gunungkidul']
      },
      {
        name: 'Jawa Timur',
        capital: 'Surabaya',
        cities: ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik', 'Banyuwangi', 'Kediri', 'Madiun', 'Jember', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Blitar', 'Batu', 'Tuban', 'Lamongan', 'Bojonegoro']
      },
      {
        name: 'Banten',
        capital: 'Serang',
        cities: ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon', 'Lebak', 'Pandeglang']
      }
    ]
  },
  {
    id: 'bali_nusa',
    name: 'Bali & Nusa Tenggara',
    provinces: [
      {
        name: 'Bali',
        capital: 'Denpasar',
        cities: ['Denpasar', 'Badung', 'Gianyar', 'Tabanan', 'Buleleng', 'Karangasem', 'Klungkung', 'Bangli', 'Jembrana']
      },
      {
        name: 'Nusa Tenggara Barat',
        capital: 'Mataram',
        cities: ['Mataram', 'Bima', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur', 'Lombok Utara', 'Sumbawa', 'Sumbawa Barat', 'Dompu']
      },
      {
        name: 'Nusa Tenggara Timur',
        capital: 'Kupang',
        cities: ['Kupang', 'Manggarai Barat', 'Ende', 'Sikka', 'Sumba Timur', 'Timor Tengah Selatan', 'Belu', 'Alor']
      }
    ]
  },
  {
    id: 'kalimantan',
    name: 'Pulau Kalimantan',
    provinces: [
      {
        name: 'Kalimantan Barat',
        capital: 'Pontianak',
        cities: ['Pontianak', 'Singkawang', 'Kubu Raya', 'Sambas', 'Ketapang', 'Sanggau', 'Sintang', 'Kapuas Hulu']
      },
      {
        name: 'Kalimantan Tengah',
        capital: 'Palangka Raya',
        cities: ['Palangka Raya', 'Kotawaringin Barat', 'Kotawaringin Timur', 'Kapuas', 'Barito Selatan', 'Katingan']
      },
      {
        name: 'Kalimantan Selatan',
        capital: 'Banjarbaru',
        cities: ['Banjarmasin', 'Banjarbaru', 'Banjar', 'Tanah Bumbu', 'Kotabaru', 'Tabalong', 'Tapin']
      },
      {
        name: 'Kalimantan Timur',
        capital: 'Samarinda',
        cities: ['Samarinda', 'Balikpapan', 'Bontang', 'Kutai Kartanegara', 'Kutai Timur', 'Berau', 'Penajam Paser Utara']
      },
      {
        name: 'Kalimantan Utara',
        capital: 'Tanjung Selor',
        cities: ['Tarakan', 'Bulungan', 'Nunukan', 'Malinau', 'Tana Tidung']
      }
    ]
  },
  {
    id: 'sulawesi',
    name: 'Pulau Sulawesi',
    provinces: [
      {
        name: 'Sulawesi Utara',
        capital: 'Manado',
        cities: ['Manado', 'Bitung', 'Tomohon', 'Kotamobagu', 'Minahasa', 'Minahasa Utara', 'Minahasa Selatan']
      },
      {
        name: 'Gorontalo',
        capital: 'Gorontalo',
        cities: ['Gorontalo', 'Bone Bolango', 'Gorontalo Utara', 'Pohuwato', 'Boalemo']
      },
      {
        name: 'Sulawesi Tengah',
        capital: 'Palu',
        cities: ['Palu', 'Morowali', 'Banggai', 'Poso', 'Donggala', 'Tolitoli', 'Parigi Moutong', 'Morowali Utara']
      },
      {
        name: 'Sulawesi Barat',
        capital: 'Mamuju',
        cities: ['Mamuju', 'Majene', 'Polewali Mandar', 'Mamasa', 'Pasangkayu', 'Mamuju Tengah']
      },
      {
        name: 'Sulawesi Selatan',
        capital: 'Makassar',
        cities: ['Makassar', 'Palopo', 'Parepare', 'Gowa', 'Maros', 'Bone', 'Luwu Timur', 'Bulukumba', 'Bantaeng', 'Wajo', 'Pinrang']
      },
      {
        name: 'Sulawesi Tenggara',
        capital: 'Kendari',
        cities: ['Kendari', 'Baubau', 'Kolaka', 'Konawe', 'Muna', 'Wakatobi', 'Konawe Selatan', 'Kolaka Utara']
      }
    ]
  },
  {
    id: 'maluku_papua',
    name: 'Maluku & Papua',
    provinces: [
      {
        name: 'Maluku',
        capital: 'Ambon',
        cities: ['Ambon', 'Tual', 'Maluku Tengah', 'Seram Bagian Barat', 'Kepulauan Tanimbar', 'Buru']
      },
      {
        name: 'Maluku Utara',
        capital: 'Sofifi',
        cities: ['Ternate', 'Tidore Kepulauan', 'Halmahera Selatan', 'Halmahera Utara', 'Halmahera Tengah', 'Pulau Morotai']
      },
      {
        name: 'Papua',
        capital: 'Jayapura',
        cities: ['Jayapura', 'Keerom', 'Sarmi', 'Mamberamo Raya', 'Biak Numfor', 'Kepulauan Yapen']
      },
      {
        name: 'Papua Barat',
        capital: 'Manokwari',
        cities: ['Manokwari', 'Fakfak', 'Kaimana', 'Teluk Bintuni', 'Teluk Wondama']
      },
      {
        name: 'Papua Selatan',
        capital: 'Merauke',
        cities: ['Merauke', 'Boven Digoel', 'Mappi', 'Asmat']
      },
      {
        name: 'Papua Tengah',
        capital: 'Nabire',
        cities: ['Nabire', 'Mimika', 'Paniai', 'Puncak Jaya', 'Intan Jaya']
      },
      {
        name: 'Papua Pegunungan',
        capital: 'Jayawijaya',
        cities: ['Jayawijaya', 'Pegunungan Bintang', 'Yahukimo', 'Tolikara', 'Lanny Jaya']
      },
      {
        name: 'Papua Barat Daya',
        capital: 'Sorong',
        cities: ['Sorong', 'Raja Ampat', 'Sorong Selatan', 'Maybrat', 'Tambrauw']
      }
    ]
  }
];

export const ALL_PROVINCES_LIST: string[] = INDONESIA_38_PROVINCES.flatMap((r) =>
  r.provinces.map((p) => p.name)
);
