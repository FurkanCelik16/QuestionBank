// ========================================
// Türkiye 81 İl Verisi
// Bölge, komşuluk ve coğrafi özellikler
// ========================================

export type TurkeyRegion = 'marmara' | 'ege' | 'akdeniz' | 'ic_anadolu' | 'karadeniz' | 'dogu_anadolu' | 'guneydogu_anadolu';

export interface Province {
  id: number; // Plaka kodu
  name: string;
  region: TurkeyRegion;
  neighbors: number[]; // Komşu il plaka kodları
  traits: string[]; // Coğrafi özellikler
  x: number; // Harita üzerindeki X yüzdesi (0-100)
  y: number; // Harita üzerindeki Y yüzdesi (0-100)
}

export const provinces: Province[] = [
  // ======== MARMARA BÖLGESİ ========
  { id: 34, name: 'İstanbul', region: 'marmara', neighbors: [41, 59], traits: ['coastal'], x: 22.5, y: 35.5 },
  { id: 16, name: 'Bursa', region: 'marmara', neighbors: [10, 17, 20, 26, 77], traits: ['coastal', 'mountainous'], x: 20.5, y: 48.5 },
  { id: 41, name: 'Kocaeli', region: 'marmara', neighbors: [34, 54, 77, 81], traits: ['coastal'], x: 25.5, y: 38.5 },
  { id: 59, name: 'Tekirdağ', region: 'marmara', neighbors: [22, 34, 39], traits: ['coastal'], x: 13.5, y: 37.5 },
  { id: 22, name: 'Edirne', region: 'marmara', neighbors: [39, 59], traits: ['border'], x: 7.5, y: 28.5 },
  { id: 39, name: 'Kırklareli', region: 'marmara', neighbors: [22, 59], traits: ['border'], x: 11.5, y: 25.5 },
  { id: 10, name: 'Balıkesir', region: 'marmara', neighbors: [16, 17, 22, 35, 45], traits: ['coastal'], x: 11.5, y: 55.5 },
  { id: 17, name: 'Çanakkale', region: 'marmara', neighbors: [10, 16], traits: ['coastal'], x: 5.5, y: 48.5 },
  { id: 77, name: 'Yalova', region: 'marmara', neighbors: [16, 41], traits: ['coastal', 'small'], x: 22.5, y: 41.5 },
  { id: 54, name: 'Sakarya', region: 'marmara', neighbors: [14, 40, 41, 81], traits: [], x: 28.5, y: 38.5 },
  { id: 11, name: 'Bilecik', region: 'marmara', neighbors: [16, 26, 43, 54], traits: ['small'], x: 24.5, y: 49.5 },

  // ======== EGE BÖLGESİ ========
  { id: 35, name: 'İzmir', region: 'ege', neighbors: [10, 45, 48], traits: ['coastal'], x: 6.5, y: 68.5 },
  { id: 9, name: 'Aydın', region: 'ege', neighbors: [20, 35, 48], traits: ['coastal'], x: 9.5, y: 80.5 },
  { id: 48, name: 'Muğla', region: 'ege', neighbors: [9, 15, 20, 35], traits: ['coastal'], x: 13.5, y: 90.5 },
  { id: 20, name: 'Denizli', region: 'ege', neighbors: [3, 9, 15, 48, 64], traits: [], x: 19.5, y: 81.5 },
  { id: 45, name: 'Manisa', region: 'ege', neighbors: [10, 35, 43, 64], traits: [], x: 11.5, y: 67.5 },
  { id: 43, name: 'Kütahya', region: 'ege', neighbors: [3, 10, 11, 26, 45, 64], traits: ['mountainous'], x: 19.5, y: 59.5 },
  { id: 64, name: 'Uşak', region: 'ege', neighbors: [3, 20, 43, 45], traits: ['small'], x: 17.5, y: 70.5 },
  { id: 3, name: 'Afyonkarahisar', region: 'ege', neighbors: [15, 20, 26, 32, 43, 64], traits: [], x: 25.5, y: 72.5 },

  // ======== AKDENİZ BÖLGESİ ========
  { id: 7, name: 'Antalya', region: 'akdeniz', neighbors: [15, 32, 42], traits: ['coastal', 'large'], x: 28.5, y: 92.5 },
  { id: 33, name: 'Mersin', region: 'akdeniz', neighbors: [1, 42, 70], traits: ['coastal'], x: 44.5, y: 94.5 },
  { id: 1, name: 'Adana', region: 'akdeniz', neighbors: [27, 33, 38, 46, 80], traits: ['coastal', 'large'], x: 52.5, y: 89.5 },
  { id: 31, name: 'Hatay', region: 'akdeniz', neighbors: [1, 80], traits: ['coastal', 'border'], x: 56.5, y: 98.5 },
  { id: 32, name: 'Isparta', region: 'akdeniz', neighbors: [3, 7, 15], traits: ['lake'], x: 29.5, y: 81.5 },
  { id: 15, name: 'Burdur', region: 'akdeniz', neighbors: [3, 7, 20, 32, 48], traits: ['lake'], x: 24.5, y: 84.5 },
  { id: 46, name: 'Kahramanmaraş', region: 'akdeniz', neighbors: [1, 21, 27, 38, 44, 80], traits: ['mountainous'], x: 59.5, y: 78.5 },
  { id: 80, name: 'Osmaniye', region: 'akdeniz', neighbors: [1, 27, 31, 46], traits: ['small'], x: 56.5, y: 87.5 },

  // ======== İÇ ANADOLU BÖLGESİ ========
  { id: 6, name: 'Ankara', region: 'ic_anadolu', neighbors: [5, 14, 18, 25, 26, 40, 43, 71, 72], traits: ['large'], x: 38.5, y: 55.5 },
  { id: 42, name: 'Konya', region: 'ic_anadolu', neighbors: [3, 7, 15, 32, 33, 38, 47, 70], traits: ['large'], x: 36.5, y: 80.5 },
  { id: 38, name: 'Kayseri', region: 'ic_anadolu', neighbors: [42, 46, 50, 58, 60, 66, 70], traits: [], x: 51.5, y: 69.5 },
  { id: 26, name: 'Eskişehir', region: 'ic_anadolu', neighbors: [3, 6, 11, 16, 43], traits: [], x: 27.5, y: 56.5 },
  { id: 58, name: 'Sivas', region: 'ic_anadolu', neighbors: [5, 19, 23, 24, 38, 50, 60, 62], traits: ['large', 'mountainous'], x: 60.5, y: 57.5 },
  { id: 50, name: 'Nevşehir', region: 'ic_anadolu', neighbors: [38, 40, 51, 60, 71], traits: ['small'], x: 47.5, y: 71.5 },
  { id: 68, name: 'Aksaray', region: 'ic_anadolu', neighbors: [40, 42, 50, 51], traits: ['small'], x: 44.5, y: 72.5 },
  { id: 70, name: 'Karaman', region: 'ic_anadolu', neighbors: [33, 42, 47], traits: ['small'], x: 40.5, y: 87.5 },
  { id: 40, name: 'Kırşehir', region: 'ic_anadolu', neighbors: [6, 50, 51, 66, 68], traits: ['small'], x: 45.5, y: 64.5 },
  { id: 51, name: 'Niğde', region: 'ic_anadolu', neighbors: [33, 38, 50, 68], traits: ['small', 'mountainous'], x: 48.5, y: 79.5 },
  { id: 71, name: 'Kırıkkale', region: 'ic_anadolu', neighbors: [6, 19, 40, 50, 66], traits: ['small'], x: 41.5, y: 59.5 },
  { id: 66, name: 'Yozgat', region: 'ic_anadolu', neighbors: [5, 19, 38, 40, 50, 58, 71], traits: [], x: 48.5, y: 58.5 },
  { id: 18, name: 'Çankırı', region: 'ic_anadolu', neighbors: [6, 19, 37, 57, 66], traits: [], x: 40.5, y: 46.5 },

  // ======== KARADENİZ BÖLGESİ ========
  { id: 61, name: 'Trabzon', region: 'karadeniz', neighbors: [28, 29, 69], traits: ['coastal', 'mountainous'], x: 74.5, y: 39.5 },
  { id: 53, name: 'Rize', region: 'karadeniz', neighbors: [8, 61], traits: ['coastal', 'mountainous'], x: 79.5, y: 37.5 },
  { id: 8, name: 'Artvin', region: 'karadeniz', neighbors: [75, 53], traits: ['coastal', 'border', 'mountainous'], x: 84.5, y: 32.5 },
  { id: 55, name: 'Samsun', region: 'karadeniz', neighbors: [5, 19, 52, 60], traits: ['coastal'], x: 55.5, y: 36.5 },
  { id: 52, name: 'Ordu', region: 'karadeniz', neighbors: [28, 55, 60], traits: ['coastal'], x: 62.5, y: 38.5 },
  { id: 28, name: 'Giresun', region: 'karadeniz', neighbors: [24, 52, 61], traits: ['coastal', 'mountainous'], x: 67.5, y: 40.5 },
  { id: 60, name: 'Tokat', region: 'karadeniz', neighbors: [5, 19, 52, 55, 58], traits: [], x: 56.5, y: 48.5 },
  { id: 5, name: 'Amasya', region: 'karadeniz', neighbors: [19, 55, 58, 60, 66], traits: [], x: 53.5, y: 46.5 },
  { id: 19, name: 'Çorum', region: 'karadeniz', neighbors: [5, 6, 55, 58, 60, 66, 71], traits: [], x: 48.5, y: 46.5 },
  { id: 57, name: 'Sinop', region: 'karadeniz', neighbors: [18, 37], traits: ['coastal'], x: 48.5, y: 28.5 },
  { id: 37, name: 'Kastamonu', region: 'karadeniz', neighbors: [14, 18, 19, 57, 74], traits: ['coastal'], x: 41.5, y: 34.5 },
  { id: 67, name: 'Zonguldak', region: 'karadeniz', neighbors: [14, 37, 74, 78], traits: ['coastal'], x: 32.5, y: 35.5 },
  { id: 74, name: 'Bartın', region: 'karadeniz', neighbors: [37, 67, 78], traits: ['coastal', 'small'], x: 36.5, y: 32.5 },
  { id: 78, name: 'Karabük', region: 'karadeniz', neighbors: [14, 37, 67, 74], traits: ['small'], x: 38.5, y: 38.5 },
  { id: 14, name: 'Bolu', region: 'karadeniz', neighbors: [6, 37, 54, 67, 78, 81], traits: ['mountainous'], x: 34.5, y: 44.5 },
  { id: 81, name: 'Düzce', region: 'karadeniz', neighbors: [14, 41, 54], traits: ['small'], x: 31.5, y: 41.5 },
  { id: 29, name: 'Gümüşhane', region: 'karadeniz', neighbors: [24, 28, 61, 69], traits: ['mountainous'], x: 72.5, y: 46.5 },
  { id: 69, name: 'Bayburt', region: 'karadeniz', neighbors: [24, 25, 29, 61], traits: ['small', 'mountainous'], x: 76.5, y: 48.5 },

  // ======== DOĞU ANADOLU BÖLGESİ ========
  { id: 25, name: 'Erzurum', region: 'dogu_anadolu', neighbors: [4, 8, 12, 24, 36, 69], traits: ['large', 'mountainous', 'border'], x: 80.5, y: 52.5 },
  { id: 36, name: 'Kars', region: 'dogu_anadolu', neighbors: [4, 25, 76], traits: ['border', 'mountainous'], x: 88.5, y: 44.5 },
  { id: 76, name: 'Iğdır', region: 'dogu_anadolu', neighbors: [4, 36], traits: ['border', 'small'], x: 92.5, y: 54.5 },
  { id: 4, name: 'Ağrı', region: 'dogu_anadolu', neighbors: [25, 36, 65, 76], traits: ['border', 'mountainous'], x: 89.5, y: 60.5 },
  { id: 65, name: 'Van', region: 'dogu_anadolu', neighbors: [4, 13, 30, 49, 56], traits: ['border', 'lake', 'large'], x: 91.5, y: 77.5 },
  { id: 30, name: 'Hakkari', region: 'dogu_anadolu', neighbors: [56, 65, 73], traits: ['border', 'mountainous'], x: 92.5, y: 92.5 },
  { id: 49, name: 'Muş', region: 'dogu_anadolu', neighbors: [12, 13, 24, 65], traits: ['mountainous'], x: 81.5, y: 68.5 },
  { id: 12, name: 'Bingöl', region: 'dogu_anadolu', neighbors: [21, 23, 24, 25, 49, 62], traits: ['mountainous'], x: 75.5, y: 66.5 },
  { id: 23, name: 'Elazığ', region: 'dogu_anadolu', neighbors: [12, 21, 24, 44, 58, 62], traits: [], x: 68.5, y: 71.5 },
  { id: 24, name: 'Erzincan', region: 'dogu_anadolu', neighbors: [12, 23, 25, 28, 29, 58, 62, 69], traits: ['mountainous'], x: 69.5, y: 55.5 },
  { id: 44, name: 'Malatya', region: 'dogu_anadolu', neighbors: [1, 23, 38, 46, 58], traits: [], x: 61.5, y: 74.5 },
  { id: 62, name: 'Tunceli', region: 'dogu_anadolu', neighbors: [12, 23, 24], traits: ['mountainous', 'small'], x: 69.5, y: 63.5 },
  { id: 75, name: 'Ardahan', region: 'dogu_anadolu', neighbors: [8, 36], traits: ['border', 'small', 'mountainous'], x: 86.5, y: 35.5 },
  { id: 13, name: 'Bitlis', region: 'dogu_anadolu', neighbors: [49, 56, 65], traits: ['mountainous', 'lake'], x: 84.5, y: 76.5 },

  // ======== GÜNEYDOĞU ANADOLU BÖLGESİ ========
  { id: 21, name: 'Diyarbakır', region: 'guneydogu_anadolu', neighbors: [72, 12, 23, 44, 47, 56], traits: ['large'], x: 74.5, y: 80.5 },
  { id: 27, name: 'Gaziantep', region: 'guneydogu_anadolu', neighbors: [1, 46, 63, 79, 80], traits: ['border'], x: 57.5, y: 87.5 },
  { id: 63, name: 'Şanlıurfa', region: 'guneydogu_anadolu', neighbors: [1, 21, 27, 47, 79], traits: ['border', 'large'], x: 63.5, y: 90.5 },
  { id: 56, name: 'Siirt', region: 'guneydogu_anadolu', neighbors: [72, 13, 21, 47, 65], traits: ['mountainous'], x: 82.5, y: 83.5 },
  { id: 79, name: 'Kilis', region: 'guneydogu_anadolu', neighbors: [27], traits: ['border', 'small'], x: 58.5, y: 93.5 },
  { id: 73, name: 'Şırnak', region: 'guneydogu_anadolu', neighbors: [30, 47, 56], traits: ['border', 'mountainous'], x: 88.5, y: 89.5 },
  { id: 72, name: 'Batman', region: 'guneydogu_anadolu', neighbors: [21, 47, 56], traits: [], x: 78.5, y: 81.5 },
  { id: 2, name: 'Adıyaman', region: 'guneydogu_anadolu', neighbors: [21, 27, 44, 46, 63], traits: [], x: 62.5, y: 82.5 },
  { id: 47, name: 'Mardin', region: 'guneydogu_anadolu', neighbors: [72, 21, 56, 73], traits: ['border'], x: 76.5, y: 90.5 },
];

// Bölge isim eşlemeleri
export const regionNames: Record<TurkeyRegion, string> = {
  marmara: 'Marmara',
  ege: 'Ege',
  akdeniz: 'Akdeniz',
  ic_anadolu: 'İç Anadolu',
  karadeniz: 'Karadeniz',
  dogu_anadolu: 'Doğu Anadolu',
  guneydogu_anadolu: 'Güneydoğu Anadolu',
};

/**
 * Yanıltıcı şık seçme algoritması - Türkiye
 */
export function getTurkeyDistractors(provinceId: number, count: number = 3): Province[] {
  const target = provinces.find(p => p.id === provinceId);
  if (!target) return [];

  const candidates: { province: Province; score: number }[] = [];

  provinces.forEach(p => {
    if (p.id === provinceId) return;

    let score = 0;

    // Aynı bölge komşusu = en yüksek skor (en yanıltıcı)
    if (target.neighbors.includes(p.id) && p.region === target.region) {
      score += 50;
    }
    // Komşu ama farklı bölge
    else if (target.neighbors.includes(p.id)) {
      score += 40;
    }
    // Aynı bölge ama komşu değil
    else if (p.region === target.region) {
      score += 30;
    }

    // Benzer coğrafi özellikler
    const sharedTraits = target.traits.filter(t => p.traits.includes(t));
    score += sharedTraits.length * 5;

    if (score > 0) {
      candidates.push({ province: p, score });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  const topPool = candidates.slice(0, Math.max(count * 3, 10));
  const shuffled = topPool.sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count).map(c => c.province);
}
