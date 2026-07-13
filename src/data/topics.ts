// ========================================
// KPSS Konu Listesi
// MEB/ÖSYM müfredatına uygun
// ========================================

import { Topic } from '../types';

export const topics: Topic[] = [
  // ======== TARİH KONULARI ========
  { id: 'tarih_01', name: 'İslamiyet Öncesi Türk Tarihi (S. 2-8)', category: 'tarih' },
  { id: 'tarih_02', name: 'İlk Türk İslam Devletleri (S. 9-18)', category: 'tarih' },
  { id: 'tarih_03', name: 'Osmanlı Devleti Kültür ve Medeniyeti (S. 23-32)', category: 'tarih' },
  { id: 'tarih_04', name: 'Osmanlı Devleti Kuruluş ve Yükselme Dönemleri (S. 33-38)', category: 'tarih' },
  { id: 'tarih_05', name: 'XVII. Yüzyılda Osmanlı Devleti - Duraklama (S. 39-41)', category: 'tarih' },
  { id: 'tarih_06', name: 'XVIII. Yüzyılda Osmanlı Devleti - Gerileme (S. 42-43)', category: 'tarih' },
  { id: 'tarih_07', name: 'XIX. Yüzyılda Osmanlı Devleti - Dağılma (S. 44-51)', category: 'tarih' },
  { id: 'tarih_08', name: 'XX. Yüzyıl Başlarında Osmanlı Devleti (S. 52-61)', category: 'tarih' },
  { id: 'tarih_09', name: 'Kurtuluş Savaşı Hazırlık Dönemi (S. 62-64)', category: 'tarih' },
  { id: 'tarih_10', name: 'I. TBMM Dönemi (S. 65-67)', category: 'tarih' },
  { id: 'tarih_11', name: 'Kurtuluş Savaşı Muharebeler Dönemi (S. 67-71)', category: 'tarih' },
  { id: 'tarih_12', name: 'Atatürk İlke ve İnkılapları (S. 73-87)', category: 'tarih' },
  { id: 'tarih_13', name: 'Atatürk Dönemi Türk Dış Politikası (S. 88-89)', category: 'tarih' },
  { id: 'tarih_14', name: 'Cumhuriyet Dönemi Kültür ve Medeniyet (S. 89-91)', category: 'tarih' },
  { id: 'tarih_15', name: 'XX. Yüzyılın Başlarında Dünya - Çağdaş (S. 91-100)', category: 'tarih' },
  { id: 'tarih_16', name: 'Soğuk Savaş Dönemi (S. 101-103)', category: 'tarih' },
  { id: 'tarih_17', name: 'Yumuşama Dönemi ve Çatışmalar (S. 104-106)', category: 'tarih' },
  { id: 'tarih_18', name: 'Küreselleşen Dünya (S. 109-114)', category: 'tarih' },
  { id: 'tarih_19', name: 'Küresel Sorunlar (S. 115)', category: 'tarih' },

  // ======== COĞRAFYA KONULARI ========
  { id: 'cog_01', name: 'Türkiye\'nin Coğrafi Konumu (S. 3-13)', category: 'cografya' },
  { id: 'cog_02', name: 'Türkiye\'nin Yerşekilleri (S. 23-42)', category: 'cografya' },
  { id: 'cog_03', name: 'Türkiye\'de İklim, Bitki Örtüsü ve Toprak Tipleri (S. 55-70)', category: 'cografya' },
  { id: 'cog_04', name: 'Türkiye\'de Nüfus ve Yerleşme (S. 85-97)', category: 'cografya' },
  { id: 'cog_05', name: 'Türkiye\'de Tarım ve Hayvancılık (S. 110-122)', category: 'cografya' },
  { id: 'cog_06', name: 'Türkiye\'de Madencilik ve Enerji Kaynakları (S. 132-141)', category: 'cografya' },
  { id: 'cog_07', name: 'Türkiye\'de Sanayi, Ticaret, Ulaşım ve Turizm (S. 151-173)', category: 'cografya' },

  // ======== VATANDAŞLIK KONULARI ========
  { id: 'vat_01', name: 'Temel Hukuk Bilgileri ve Kavramları', category: 'vatandaslik' },
  { id: 'vat_02', name: 'Borçlar Hukuku, Ticaret Hukuku ve Haklar', category: 'vatandaslik' },
  { id: 'vat_03', name: 'Türk Anayasa Tarihi ve Anayasal Gelişmeler', category: 'vatandaslik' },
  { id: 'vat_04', name: 'Temel Hak ve Ödevler (Kişi, Sosyal, Siyasi Haklar)', category: 'vatandaslik' },
  { id: 'vat_05', name: '1982 Anayasası: Yasama ve Seçim Sistemi', category: 'vatandaslik' },
  { id: 'vat_06', name: '1982 Anayasası: Yürütme Organı (Cumhurbaşkanı ve CBK)', category: 'vatandaslik' },
  { id: 'vat_07', name: '1982 Anayasası: Yargı Organı (Yüksek Mahkemeler)', category: 'vatandaslik' },
  { id: 'vat_08', name: 'İdare Hukuku, Türkiye\'nin İdari Yapısı ve Devlet Memurları (657)', category: 'vatandaslik' },

  // ======== GÜNCEL BİLGİLER KONULARI ========
  { id: 'gun_01', name: 'Uluslararası Kuruluşlar, Zirveler ve Başkanlıklar', category: 'guncel' },
  { id: 'gun_02', name: 'Türkiye Gündemi, Teknoloji, Uzay ve Savunma Sanayii', category: 'guncel' },
  { id: 'gun_03', name: 'Türkiye\'nin En\'leri, Coğrafi Veriler ve İlkler', category: 'guncel' },
  { id: 'gun_04', name: 'Kültür, Sanat, Edebiyat, Arkeoloji ve Nobel Ödülleri', category: 'guncel' },
  { id: 'gun_05', name: 'Spor Dünyası ve Şampiyonalar (2025/2026)', category: 'guncel' },
  { id: 'gun_06', name: 'Anayasa, Yüksek Yargı, Yönetim ve Güncel Görevliler', category: 'guncel' },
];

export const questionCountOptions = [5, 10, 15, 20];
