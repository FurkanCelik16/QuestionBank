// ========================================
// KPSS Konu Listesi
// MEB/ÖSYM müfredatına uygun
// ========================================

import { Topic } from '../types';

export const topics: Topic[] = [
  // ======== TARİH KONULARI ========
  {
    id: 'tarih_01',
    name: 'İslamiyet Öncesi Türk Tarihi',
    category: 'tarih',
  },
  {
    id: 'tarih_02',
    name: 'İlk Türk İslam Devletleri',
    category: 'tarih',
  },
  {
    id: 'tarih_03',
    name: 'Osmanlı Kuruluş Dönemi',
    category: 'tarih',
  },
  {
    id: 'tarih_04',
    name: 'Osmanlı Yükselme Dönemi',
    category: 'tarih',
  },
  {
    id: 'tarih_05',
    name: 'Osmanlı Duraklama Dönemi',
    category: 'tarih',
  },
  {
    id: 'tarih_06',
    name: 'Osmanlı Gerileme ve Dağılma Dönemi',
    category: 'tarih',
  },
  {
    id: 'tarih_07',
    name: 'I. Dünya Savaşı ve Mondros Mütarekesi',
    category: 'tarih',
  },
  {
    id: 'tarih_08',
    name: 'Kurtuluş Savaşı Hazırlık Dönemi',
    category: 'tarih',
  },
  {
    id: 'tarih_09',
    name: 'Kurtuluş Savaşı Muharebeler Dönemi',
    category: 'tarih',
  },
  {
    id: 'tarih_10',
    name: 'Atatürk İlke ve İnkılapları',
    category: 'tarih',
  },
  {
    id: 'tarih_11',
    name: 'Çağdaş Türk ve Dünya Tarihi',
    category: 'tarih',
  },

  // ======== COĞRAFYA KONULARI ========
  {
    id: 'cog_01',
    name: 'Harita Bilgisi',
    category: 'cografya',
  },
  {
    id: 'cog_02',
    name: 'Türkiye\'nin Fiziki Coğrafyası (Yer Şekilleri)',
    category: 'cografya',
  },
  {
    id: 'cog_03',
    name: 'Türkiye\'nin İklimi',
    category: 'cografya',
  },
  {
    id: 'cog_04',
    name: 'Türkiye\'nin Bitki Örtüsü ve Toprak Yapısı',
    category: 'cografya',
  },
  {
    id: 'cog_05',
    name: 'Türkiye\'nin Su Kaynakları (Akarsular, Göller)',
    category: 'cografya',
  },
  {
    id: 'cog_06',
    name: 'Türkiye\'de Nüfus ve Yerleşme',
    category: 'cografya',
  },
  {
    id: 'cog_07',
    name: 'Türkiye\'nin Ekonomik Coğrafyası (Tarım)',
    category: 'cografya',
  },
  {
    id: 'cog_08',
    name: 'Türkiye\'nin Ekonomik Coğrafyası (Sanayi ve Enerji)',
    category: 'cografya',
  },
  {
    id: 'cog_09',
    name: 'Türkiye\'nin Ekonomik Coğrafyası (Ulaşım ve Ticaret)',
    category: 'cografya',
  },
  {
    id: 'cog_10',
    name: 'Dünya Coğrafyası',
    category: 'cografya',
  },
];

export const questionCountOptions = [5, 10, 15, 20];
