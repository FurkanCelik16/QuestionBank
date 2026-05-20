// ========================================
// Dünya Ülkeleri Verisi
// Kıta, alt-bölge ve distractör öncelikleri
// ========================================

export type Continent = 'Avrupa' | 'Asya' | 'Afrika' | 'Kuzey Amerika' | 'Güney Amerika' | 'Okyanusya';

export interface Country {
  id: string; // ISO Code
  name: string;
  continent: Continent;
  subRegion: string;
  x: number; // 0-100
  y: number; // 0-100
}

export const worldCountries: Country[] = [
  // ======== AVRUPA ========
  { id: 'TR', name: 'Türkiye', continent: 'Avrupa', subRegion: 'Güney Avrupa', x: 58.5, y: 44.5 },
  { id: 'DE', name: 'Almanya', continent: 'Avrupa', subRegion: 'Batı Avrupa', x: 50.5, y: 35.5 },
  { id: 'FR', name: 'Fransa', continent: 'Avrupa', subRegion: 'Batı Avrupa', x: 48.5, y: 40.5 },
  { id: 'GB', name: 'Birleşik Krallık', continent: 'Avrupa', subRegion: 'Kuzey Avrupa', x: 47.5, y: 32.5 },
  { id: 'IT', name: 'İtalya', continent: 'Avrupa', subRegion: 'Güney Avrupa', x: 52.5, y: 44.5 },
  { id: 'ES', name: 'İspanya', continent: 'Avrupa', subRegion: 'Güney Avrupa', x: 45.5, y: 46.5 },
  { id: 'GR', name: 'Yunanistan', continent: 'Avrupa', subRegion: 'Güney Avrupa', x: 56.5, y: 47.5 },
  { id: 'SE', name: 'İsveç', continent: 'Avrupa', subRegion: 'Kuzey Avrupa', x: 53.5, y: 24.5 },
  { id: 'NO', name: 'Norveç', continent: 'Avrupa', subRegion: 'Kuzey Avrupa', x: 50.5, y: 25.5 },
  { id: 'FI', name: 'Finlandiya', continent: 'Avrupa', subRegion: 'Kuzey Avrupa', x: 56.5, y: 24.5 },
  { id: 'PL', name: 'Polonya', continent: 'Avrupa', subRegion: 'Doğu Avrupa', x: 53.5, y: 35.5 },
  { id: 'RU', name: 'Rusya', continent: 'Avrupa', subRegion: 'Doğu Avrupa', x: 70.5, y: 28.5 },

  // ======== ASYA ========
  { id: 'CN', name: 'Çin', continent: 'Asya', subRegion: 'Doğu Asya', x: 78.5, y: 48.5 },
  { id: 'IN', name: 'Hindistan', continent: 'Asya', subRegion: 'Güney Asya', x: 72.5, y: 58.5 },
  { id: 'JP', name: 'Japonya', continent: 'Asya', subRegion: 'Doğu Asya', x: 88.5, y: 45.5 },
  { id: 'KR', name: 'Güney Kore', continent: 'Asya', subRegion: 'Doğu Asya', x: 85.5, y: 45.5 },
  { id: 'ID', name: 'Endonezya', continent: 'Asya', subRegion: 'Güneydoğu Asya', x: 80.5, y: 72.5 },
  { id: 'SA', name: 'Suudi Arabistan', continent: 'Asya', subRegion: 'Batı Asya', x: 60.5, y: 58.5 },
  { id: 'KZ', name: 'Kazakistan', continent: 'Asya', subRegion: 'Orta Asya', x: 68.5, y: 38.5 },

  // ======== AFRİKA ========
  { id: 'EG', name: 'Mısır', continent: 'Afrika', subRegion: 'Kuzey Afrika', x: 57.5, y: 57.5 },
  { id: 'ZA', name: 'Güney Afrika', continent: 'Afrika', subRegion: 'Güney Afrika', x: 54.5, y: 88.5 },
  { id: 'NG', name: 'Nijerya', continent: 'Afrika', subRegion: 'Batı Afrika', x: 50.5, y: 68.5 },
  { id: 'KE', name: 'Kenya', continent: 'Afrika', subRegion: 'Doğu Afrika', x: 58.5, y: 70.5 },
  { id: 'MA', name: 'Fas', continent: 'Afrika', subRegion: 'Kuzey Afrika', x: 45.5, y: 56.5 },

  // ======== KUZEY AMERİKA ========
  { id: 'US', name: 'ABD', continent: 'Kuzey Amerika', subRegion: 'Kuzey Amerika', x: 20.5, y: 44.5 },
  { id: 'CA', name: 'Kanada', continent: 'Kuzey Amerika', subRegion: 'Kuzey Amerika', x: 20.5, y: 30.5 },
  { id: 'MX', name: 'Meksika', continent: 'Kuzey Amerika', subRegion: 'Orta Amerika', x: 20.5, y: 56.5 },

  // ======== GÜNEY AMERİKA ========
  { id: 'BR', name: 'Brezilya', continent: 'Güney Amerika', subRegion: 'Güney Amerika', x: 34.5, y: 72.5 },
  { id: 'AR', name: 'Arjantin', continent: 'Güney Amerika', subRegion: 'Güney Amerika', x: 31.5, y: 85.5 },
  { id: 'CL', name: 'Şili', continent: 'Güney Amerika', subRegion: 'Güney Amerika', x: 29.5, y: 85.5 },

  // ======== OKYANUSYA ========
  { id: 'AU', name: 'Avustralya', continent: 'Okyanusya', subRegion: 'Avustralya ve Yeni Zelanda', x: 85.5, y: 82.5 },
  { id: 'NZ', name: 'Yeni Zelanda', continent: 'Okyanusya', subRegion: 'Avustralya ve Yeni Zelanda', x: 92.5, y: 88.5 },
];

/**
 * Yanıltıcı şık seçme algoritması - Dünya
 */
export function getWorldDistractors(countryId: string, count: number = 3): Country[] {
  const target = worldCountries.find(c => c.id === countryId);
  if (!target) return [];

  const candidates: { country: Country; score: number }[] = [];

  worldCountries.forEach(c => {
    if (c.id === countryId) return;

    let score = 0;
    if (c.subRegion === target.subRegion) score += 50;
    else if (c.continent === target.continent) score += 30;

    score += Math.floor(Math.random() * 10);
    candidates.push({ country: c, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  const topPool = candidates.slice(0, Math.max(count * 3, 15));
  const shuffled = topPool.sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count).map(c => c.country);
}
