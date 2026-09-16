// ========================================
// Gemini API Service
// Quiz generation via dynamically selected Gemini Models
// ========================================

import { Quiz, QuizQuestion, DifficultyLevel, Topic } from '../types';
import { useSettingsStore, cleanSubtopics } from '../store/useSettingsStore';
import { Platform } from 'react-native';
import { topics as topicsDb } from '../data/topics';
// @ts-ignore
const FileSystem = Platform.OS !== 'web' ? require('expo-file-system/legacy') : null;

const TIMEOUT_MS = 120000; // 120 seconds timeout for processing PDFs and generating 20 questions

const DIFFICULTY_PROMPTS: Record<DifficultyLevel, string> = {
  easy: 'KOLAY seviye: Soruları yalnızca temel kavramsal yorumlama, okuduğunu anlama ve basit mantık yürütme düzeyinde kurgula. Genel geçer, yüzeysel bilgileri hedefle. Seçenekler arasındaki farkları çok belirgin ve net tut; yanlış seçenekler kolayca elenebilecek uzak kavramlardan oluşsun.',
  medium: 'ORTA seviye: Standart KPSS sınav zorluğunu hedefle. Doğrudan bilgi ölçen sorular ile kavramsal yorumlama gerektiren soruları dengeli bir şekilde harmanla. Seçenekleri makul düzeyde seçici ve kafa karıştırıcı terimlerden oluştur.',
  hard: 'ZOR seviye (ÖSYM Tarzı): Derinlemesine bilgi ve dikkatli okuma gerektiren seçici sorular kurgula. Soruyu yazarken, hedeflediğin ana kavramı veya bilgiyi doğrudan adı ile sormak yerine; o bilginin yan özelliklerini, ilişkili olduğu diğer tarihleri, kurumları, coğrafi etkileri veya kanuni maddeleri ipucu olarak vererek dolaylı yoldan buldur. Seçenekleri birbirine çok yakın ve kavramsal olarak karıştırılabilecek gerçek KPSS terimlerinden seç.',
  extreme: 'UZMAN / AKADEMİK seviye: En seçici adayları bile zorlayacak derecede detaylı, derin akademik ve dipnot seviyesindeki uç bilgileri ölçen uzmanlık soruları kurgula. Sorularda doğrudan en bilinen ana kavramı sormak yerine; metnin/dokümanın en ücra köşelerinde kalmış alt bentleri, kanun maddelerinin ince detaylarını, mikro düzeydeki coğrafi/tarihi/kurumsal istisnaları ve sebep-sonuç ilişkilerini hedef al. Seçenekler birbirine son derece yakın olsun; yanlış şıklar da dokümandaki diğer gerçek terimlerden seçilsin ki adayın soruyu çözebilmesi için konuya yüzeysel değil, tam bir uzman seviyesinde hakim olması gereksin.'
};

// KPSS Detaylı Müfredat Alt Başlıkları Havuzu (Syllabus Check-list)
// Double quotes are used to ensure no unescaped single quotes (e.g., Türkiye'de, Amasya'da) break the JS string literal.
export const KPSS_SYLLABUS: Record<string, string> = {
  "İslamiyet Öncesi Türk Tarihi": "Türklerin tarih sahnesine çıkışları, Türk adının anlamları (Çin kaynaklarında miğfer, Uygur kaynaklarında güç-kuvvet, Kaşgarlı Mahmut'a göre olgunluk çağı, Ziya Gökalp'e göre töreli), Orta Asya kültür bölgeleri (Anav, Kelteminar, Afanasyevo, Andronova, Karasuk, Tagar), göçlerin nedenleri (iklim değişikliği, kuraklık, dış baskılar, bağımsız yaşama arzusu, cihan hakimiyeti) ve göçebe yaşantının sonuçları (mimari gelişmez, taşınabilir sanat, uzun hapis cezası yok, özel mülkiyet ve sınıf ayrımı yok). İlk Türk devletleri ve toplulukları: İskitler/Sakalar (ilk Türk topluluğu, atı evcilleştirdiler, Alper-Tunga Destanı, Tomris Hatun ilk kadın hükümdar, Bozkırın Kuyumcuları), Asya Hun Devleti (bilinen ilk Türk devleti, Teoman, Mete Han onlu sistem MÖ 209 Kara Kuvvetleri kuruluşu, siyasi birliği ilk sağlayan), Kavimler Göçü ve sonuçları (Roma ikiye ayrıldı, derebeylik ortaya çıktı, Balamir liderliğinde göç), Avrupa Hun Devleti (Uldız dönemi dış politika, Attila Tanrının Kırbacı, Nibelungen Destanı Etzel), I. Göktürk Devleti (Bumin Kağan, İstemi Yabgu ikili teşkilat, Kürşad İsyanı ilk bağımsızlık hareketi), II. Göktürk/Kutluk Devleti (Kutluk İlteriş Kağan, Vezir Tonyukuk, Bilge Kağan, Kültigin, Orhon Yazıtları), Uygurlar (Kutluk Bilge Kül Kağan, Bögü Kağan maniheizm kabulü, yerleşik yaşama geçiş, tarım, mimari, kütüphane, kağıt ve matbaa, Kırgızlar tarafından yıkıldılar), Kırgızlar (Manas Destanı, Yenisey Yazıtları, ölülerini yakan ilk Türk topluluğu), Karluklar (İslamiyet'i kabul eden ilk Türk boyu), Hazar Devleti (Museviliği benimseyen tek Türk devleti, Hazar Barış Çağı Pax Hazarica, ilk ücretli asker alan Türk devleti, Belencer savaşı ile İslam ordularını durdurdular), Avarlar (İstanbul'u kuşatan ilk Türk devleti), Peçenekler (Bizans ordusunda ücretli askerlik, Malazgirt'te saf değiştirdiler), Bulgarlar (İtil Bulgarları İslamiyet'i, Tuna Bulgarları Hristiyanlığı kabul etti), Kumanlar/Kıpçaklar (Codex Cumanicus, Oğuzlarla mücadeleleri Dede Korkut hikayeleri).",
  "İslamiyet Öncesi Türk Devletleri Kültür ve Medeniyeti": "Devlet Yönetimi: Kut anlayışı (veraset, üleş), ikili teşkilat, Kurultay/Toy/Kengeş üyeleri (Kağan, Hatun, Tigin prens, Aygucı/Öge başbakan, Buyruk bakan, Şad askeri vali, Yabgu batı kanadı yöneticisi, İnanç/İnal/Ataman tigin eğiticisi, Tudun vergi memuru, Ağılığ hazinedar, Bitikçi/Tamgacı katip-mühürdar, Subaşı ordu komutanı). Hükümdarlık Sembolleri (Otağ çadır, Örgin taht, Kotuz/Sorguç miğfer süsü, Tuğ, Nevbet davul, Kama, Toy ziyafet, Kur kemer, Berge kamçı, Yay). Ordu: Ordu-millet anlayışı, ücretli askerlik Hazar hariç yoktur, Mete Han onlu sistem, Turan taktiği (Hilal/Kurt kapanı, Sahte ricat). Hukuk: Töre (yazısız hukuk kuralları, değişmez hükümler: adalet/könilik, iyilik/uzluk, eşitlik/tüzlük, insanlık/insanlık), yargu hakanın başkanlık ettiği mahkeme. Sosyal Hayat: Oguş aile, Urug sülale, Boy boylar, Bodun millet, İl devlet. Din ve İnanış: Gök Tanrı inancı, Kurgan oda mezar, Balbal mezar taşı, Yuğ cenaze töreni, Uçmag cennet, Tamu cehennem, Kam/Baksı din adamı. Dil, Edebiyat ve Yazı: Sözlü edebiyat (Sav atasözü, Sagu ağıt, Koşuk şiir, Destanlar), Yazılı edebiyat (Orhon Yazıtları ilk kez Yollug Tigin yazdı, Danimarkalı Wilhelm Thomsen okudu, ilk çözülen kelime Tengri; Yenisey Yazıtları, Karabalgasun Yazıtları). Bilim ve Sanat: 12 Hayvanlı Türk Takvimi, taşınabilir sanat eserleri (hayvan üslubu), Uygurlarda fresk duvar resmi, minyatür, çadır sanatı.",
  "İlk Türk İslam Devletleri": "Müslüman Araplarla ilişkiler: Hz. Ömer dönemi sınırdaş olma, Hz. Osman dönemi Belencer savaşı, Emeviler dönemi sert mücadeleler ve mevali politikası, Abbasiler dönemi hoşgörü politikası, Avasım sınır kentleri, Samarra sadece Türklere özel askeri şehir, 751 Talas Savaşı Türklerin İslamiyet'e geçiş dönemi. Karahanlılar (Afrasiyapoğulları): Bilge Kül Kadir Han kurdu, Satuk Buğra Han (Abdülkerim) döneminde İslamiyet'i kabul ettiler, ilk Türk-İslam edebi eserleri, Ribat kervansarayları, burslu öğrencilik sistemi. Gazneliler (Yeminiler): Alp Tigin kurdu, en parlak dönem Gazneli Mahmut (Sultan unvanını ilk kullanan hükümdar, Hindistan'a 17 sefer, Biruni için 'Sarayımın en değerli hazinesidir' demiştir). Büyük Selçuklu Devleti: Selçuk Bey kurdu, Tuğrul ve Çağrı Beyler dönemi, Dandanakan savaşı (1040 - devlet resmen kuruldu), Pasinler savaşı (1048 - Bizans ile ilk savaş), Alp Arslan dönemi (Malazgirt savaşı 1071 - Anadolu kapıları açıldı, Ebul Feth unvanı), Melikşah dönemi (en parlak dönem, Nizamiye Medreseleri - Vezir Nizamülmülk, Ömer Hayyam Celali Takvimi), Hasan Sabbah Batınilik faaliyeti. Mısır'da Kurulan Türk Devletleri: Tolunoğulları (Mısır'da kurulan ilk Türk devleti, Maristan hastaneleri), İhşidiler/Akşitler (Kutsal topraklara Hicaz egemen olan ilk Türk devleti), Eyyubiler (Selahaddin Eyyubi Hıttin Savaşı ile Kudüs'ü haçlılardan geri aldı), Memlükler (Kölemenler, veraset sistemi farklıdır her komutan sultan olabilir, Ayn Calut ve Elbistan savaşları ile Moğolları tarihte ilk kez durduran devlet). Diğer Devletler: Babür İmparatorluğu (Tac Mahal - Şah Cihan eşi Mümtaz Mahal için yaptırdı), Harzemşahlar (Selçuklunun varisi, Yassıçemen savaşıyla yıkıldılar), Timur Devleti (Ali Şir Nevai, Uluğ Bey).",
  "İlk Türk-İslam Devletleri Kültür ve Medeniyeti": "Hükümdarlık Sembolleri (Hilat halifenin gönderdiği elbise, Menşur halife onayı, Hutbe okutmak, Çetr saltanat şemsiyesi, Sikke para, Nevbet). Saray Teşkilatı: Hacibü'l-Hüccab (Hacip, saray işlerini düzenleyen en yetkili kişi), candar saray koruması, silahdar silah koruması, taştdar temizlik, şarabdar içecekler, serheng törenleri düzenleyen. Hükümet/Divan: Divan-ı Vezaret (Vezir), Divan-ı Tuğra/İnşa (yazışma), Divan-ı İstifa (mali işler - Müstevfi), Divan-ı İşraf (idari denetim - Müşrif), Divan-ı Arz (ordu işleri - Emir-i Arz), Divan-ı Mezalim (ağır suçlar/hakan başkanlığında yüksek mahkeme). Toprak Yönetimi: Miri Topraklar: Has (hükümdara ait), İkta (geliri asker ve memurlara verilen toprak, İkta sahipleri Cebelü adlı atlı asker yetiştirir), Vakıf (hayır işleri). Mülk Topraklar: Öşri (müslümanlara ait), Haraci (gayrimüslimlere ait). Ordu: Gulaman-ı Saray (saray köleleri, doğrudan sultana bağlı, 3 ayda bir Biştegani maaşı alırlar), Hassa Ordusu (seçkin atlı askerler), İkta Askerleri (taşradaki atlı askerler). Bilim İnsanları: Farabi (Muallim-i Sani, İhsa'ül Ulum, el-Medinetü'l Fazıla), İbn-i Sina (Avicenna, el-Kanun fi't-Tıbb), Biruni (sarayımın en değerli hazinesi, Asar'ül Bakiye), Harezmi (sıfırı ilk kullanan, cebirin kurucusu), Gazali (İhyaü Ulumiddin, Nizamiye rektörü), Ömer Hayyam (Celali Takvimi), İbn-i Rüşd (Averroes, Aristocu), Cabir bin Hayyan (kimya, imbik). Edebi Eserler: Kutadgu Bilig (Yusuf Has Hacip - ilk siyasetname), Divan-ı Lügati't-Türk (Kaşgarlı Mahmut - ilk sözlük ve harita), Atabetü'l-Hakayık (Edip Ahmet Yükneki), Divan-ı Hikmet (Ahmet Yesevi - ilk tasavvufi eser).",
  "Anadolu Selçuklu ve İlk Beylikler": "Anadolu İlk Türk Beylikleri (I. Beylikler): Saltuklular (Erzurum çevresi, ilk beylik, Tepsi Minare, Mama Hatun Külliyesi), Danişmentliler (Sivas-Tokat çevresi, en güçlüsü, Yağıbasan Medresesi ilk medrese), Mengücekliler (Erzincan-Divriği çevresi, Divriği Ulu Camii UNESCO), Artuklular (Mardin-Diyarbakır çevresi, Malabadi Köprüsü, robotik bilimci El Cezeri), Çaka Beyliği (İzmir, ilk Türk denizcisi 1081 deniz kuvvetleri kuruluşu). Anadolu Selçuklu Devleti: Süleyman Şah kurdu İznik'te. I. Kılıçarslan (Haçlı seferi nedeniyle başkenti Konya'ya taşıdı). II. Kılıçarslan (Miryokefalon Savaşı 1176 - Anadolu kesin Türk yurdu oldu, Yurttutan savaş; ilk altın para). Gıyaseddin Keyhüsrev, İzzettin Keykavus ve Alaaddin Keykubad dönemleri (en parlak dönem, deniz aşırı Kırım Sudak limanı fethi, ticari sigorta sistemi, kervansaraylar Alay Han). Yassıçemen Savaşı (Harzemşahlar yenildi, tampon bölge kalktı). Baba İshak İsyanı (ilk dini nitelikli toplumsal isyan). Kösedağ Savaşı (1243 - Moğol İlhanlılar yenilgi, Anadolu Türk siyasi birliği bozuldu, II. Beylikler dönemi başladı: Osmanoğulları, Karamanoğulları Türkçeyi resmi dil yapan, Germiyanoğulları çeyizle toprak, Hamitoğulları parayla toprak, Karesioğulları denizci Osmanlıya katılan ilk beylik, Dulkadiroğulları Osmanlıya katılan son beylik).",
  "Osmanlı Kuruluş Dönemi": "Aşiretten beyliğe geçiş (Söğüt-Domaniç, gaza ve cihat anlayışı, jeopolitik konum, Bizans'ın zayıflığı), iskan, istimalet (hoşgörü) ve müdara politikaları. Önemli padişahlar ve olaylar: Osman Bey (ilk para, Koyunhisar savaşı, bac vergisi), Orhan Bey (yaya ve müsellem ordusu, ilk medrese İznik, divan teşkilatı, beylikten devlete geçiş, karesioğulları ilhakı - denizcilik başlangıcı, çimpe kalesi alınması - Rumeliye geçiş), I. Murad (Sazlıdere savaşı, Edirne fethi, ilk kez sultan unvanı, devşirme sistemi, pençik sistemi, Kapıkulu ocağı kurulması, veraset değişikliği - ülke padişah ve oğullarınındır, I. Kosova savaşı), Yıldırım Bayezid (İstanbul kuşatmaları, Ankara Savaşı fetret devri, Niğbolu fethi, sultan-ı iklim-i rum unvanı), I. Mehmed Çelebi (devletin ikinci kurucusu, Şeyh Bedreddin isyanı, Venedik deniz savaşı), II. Murad (Edirne-Segedin antlaşması, Varna savaşı, II. Kosova savaşı - balkanlar kesin Türk yurdu oldu).",
  "Osmanlı Yükselme Dönemi": "Dünya gücü Osmanlı (1453-1579). Fatih Sultan Mehmed (İstanbul'ın fethi nedenleri, shahi topları, havan topu, fethin dünya ve Türk tarihi sonuçları; Kırım'ın fethi - Karadeniz Türk gölü oldu; Otlukbeli savaşı, Kanunname-i Ali Osman, Topkapı Sarayı, Enderun Mektebi, Sahn-ı Seman medreseleri, iltizam sistemi başlangıcı), II. Bayezid (Cem Sultan olayı - iç sorunun dış sorun olması, Şahkulu isyanı), Yavuz Sultan Selim (8 yıla 80 yıllık iş sığdıran padişah, Şah İsmail ve Çaldıran savaşı, Turnadağ savaşı - Anadolu Türk siyasi birliği kesin sağlandı, Mısır Seferi - Mercidabık ve Ridaniye savaşları, halifelik Osmanlıya geçti, Baharat yolu denetimi), Kanuni Sultan Süleyman (Belgrad fethi, Mohaç Meydan savaşı - en kısa süren meydan savaşı, Viyana kuşatması, Preveze Deniz Zaferi - Barbaros Hayreddin Paşa Akdeniz Türk gölü oldu, Amasya Antlaşması - İran ile ilk resmi antlaşma, Zigetvar seferi), Sokollu Mehmed Paşa Dönemi (Sadrazamlık dönemi, Don-Volga ve Süveyş Kanalı projeleri, Kıbrıs'ın fethi ve İnebahtı bozgunu).",
  "Osmanlı Devleti Kültür ve Uygarlığı": "Veraset sistemindeki değişiklikler (padişah ve oğullarınındır, ekber ve erşed sistemi, kafes usulü, sancağa çıkmanın son bulması). Divan-ı Hümayun üyeleri ve görevleri: Sadrazam/Veziriazam (padişahın mutlak vekili, serdar-ı ekrem unvanıyla ordu komutanı), Vezirler (sadrazam yardımcıları), Defterdar (maliye işleri), Nişancı (örfi hukuk, tuğra çeker, tapu tahrir defterlerini tutar), Kazasker (şeri hukuk, kadı ve müderris atamaları), Şeyhülislam (divan üyesi değildir ancak fetva verir), Kaptan-ı Derya (donanma komutanı), Reisülküttab (dışişleri bakanı). Merkez ve Taşra Teşkilatı: Eyaletler: Salyaneli (yıllıklı, iltizam sisteminin uygulandığı, tımar olmayan eyaletler örn: Mısır, Cezayir), Salyanesiz (yıllık almayan, tımar sisteminin uygulandığı eyaletler örn: Anadolu, Rumeli), İmtiyazlı (özel statülü, iç işlerinde bağımsız örn: Kırım, Hicaz). Eyalet Askerleri (Tımarlı Sipahiler, cebelü atlı askerler) ve Kapıkulu Askerleri (Yeniçeriler, 3 ayda bir Ulufe maaşı alırlar, tahta çıkışta Cülus bahşişi alırlar). Toprak Sistemi ve Ekonomik Terimler: İltizam (vergi gelirlerinin ihale ile satılması), Malikane (toprağın ömür boyu kiralanması), Muaccele (iltizam ihale bedeli), Esham (iç borçlanma senedi). Vergiler: Öşür (müslüman tarım), Haraç (gayrimüslim tarım), Cizye (gayrimüslim askerlik vergisi), Avarız (olağanüstü hal vergisi), Çiftbozan (toprağını boş bırakan köylüden alınan vergi). Sosyal Yapı: Millet sistemi (toplumun din esasına göre teşkilatlanması).",
  "Osmanlı Duraklama Dönemi": "XVII. Yüzyıl Arayış Yılları. İç nedenler: Veraset sistemindeki değişiklikler (Ekber ve Erşed sistemi, Kafes usulü, deneyimsiz padişahlar, sancak sisteminin kaldırılması), rüşvet ve iltimas, tımar sisteminin bozulması, yeniçeri isyanları (merkez isyanları, Hotin seferi - II. Osman'ın yeniçeri ocağını kaldırmak istemesi ve şehit edilmesi), Celali isyanları (Anadolu halk isyanları, büyük kaçgun, tarım üretimi çöküşü). Dış nedenler: Doğal sınırlara ulaşılması, Avrupa'daki bilimsel gelişmelerin takip edilememesi. Önemli antlaşmalar: Ferhat Paşa (doğuda en geniş sınırlar), Nasuh Paşa, Serav, Kasr-ı Şirin (bugünkü Türkiye-İran sınırı çizildi), Zitvatorok (Avusturya kralı Osmanlı padişahına eşit sayıldı, mütekabiliyet esası, üstünlük kaybedildi), Bucaş (batıda en geniş sınırlar), Bahçesaray/Çehrin (Rusya ile ilk resmi antlaşma), II. Viyana Kuşatması (Merzifonlu Kara Mustafa Paşa), Kutsal İttifak ve Karlofça Antlaşması (ilk kez büyük toprak kaybı, duraklama bitti gerileme başladı), İstanbul Antlaşması (1700 - Azak kalesi Rusyaya verildi). Islahatçılar: Kuyucu Murat Paşa, II. Osman (ilk köklü ıslahat yapan padişah), IV. Murad (baskı ve şiddet, içki-tütün yasağı, Koçi Bey ve Katip Çelebi risaleleri), Tarhuncu Ahmed Paşa (ilk denk bütçe), Köprülüler Dönemi (şartlı sadrazam olan Köprülü Mehmed Paşa).",
  "Osmanlı Gerileme Dönemi": "XVIII. Yüzyıl Osmanlı Devleti Islahatları ve Antlaşmaları. Lale Devri (3. Ahmet, Nevşehirli Damat İbrahim Paşa, ilk geçici elçilik Yirmisekiz Mehmet Çelebi Paris Sefaretnamesi, ilk özel matbaa İbrahim Müteferrika ve Sait Efendi, çiçek aşısı, tulumbacılar itfaiye, Levni minyatür, Nedim şair). Askeri Islahatçılar: I. Mahmut (Humbaracı Ahmet Paşa batı tarzı ordu ıslahı, Hendesehane askeri okul), III. Mustafa (Baron de Tott, Sürat Topçuları, Esame sistemi iç borçlanma), I. Abdülhamit (Cülus bahşişinin kaldırılması, ulufe alım-satım yasağı, İstihkam Okulu), III. Selim (Nizam-ı Cedit ordusu, İrad-i Cedit hazinesi, ilk kalıcı elçi Yusuf Agah Efendi Londra, Kabakçı Mustafa İsyanı ile sona erdi). Antlaşmalar: Prut Antlaşması (toprakları geri alma umudu), Pasarofça Antlaşması (batının üstünlüğü kabul edildi Lale Devri başladı), Belgrad Antlaşması (en kazançlı antlaşma, Belgrad geri alındı, 1740 kapitülasyonları daimi oldu), Küçük Kaynarca Antlaşması (1774 - Kırım bağımsız oldu, halkı müslüman ilk toprak kaybı, halifelik ilk kez siyasi kullanıldı, Rusya'ya savaş tazminatı ve kapitülasyonlar verildi), Yaş Antlaşması (1792 - Kırım Rusya'ya ait oldu, gerileme bitti dağılma başladı).",
  "Osmanlı Dağılma Dönemi": "XIX. Yüzyıl Osmanlı Devleti Islahatları, Savaşları ve Fikir Akımları. Milliyetçilik isyanları (Sırp isyanı özerklik, 1829 Edirne Antlaşması Yunanistan bağımsızlığı). Savaşlar ve Antlaşmalar: Hünkar İskelesi Antlaşması (boğazlar sorunu başladı), Balta Limanı Ticaret Antlaşması (1838 Osmanlı açık pazar oldu), Kırım Savaşı (1853-1856, ilk dış borç İngiltere'den alındı), Paris Antlaşması (1856, Osmanlı Avrupa devleti sayıldı, toprak bütünlüğü Avrupa garantisinde), 93 Harbi (1877-1878 Osmanlı-Rus savaşı, Gazi Osman Paşa Plevne savunması, Nene Hatun), Berlin Antlaşması (1878 - Sırbistan, Karadağ, Romanya bağımsız oldu, Kars-Ardahan-Batum Rusya'ya bırakıldı, Ermeni sorunu başladı). Islahatlar ve Fermanlar: II. Mahmut Islahatları (Yeniçeri Ocağı'nın kaldırılması Vakayı Hayriye, Asakir-i Mansure-i Muhammediye, muhtarlıklar, posta, Takvim-i Vekayi ilk resmi gazete, pasaport, rüştiye mektepleri). Tanzimat Fermanı (1839 - Mustafa Reşit Paşa okudu, hukukun üstünlüğü, padişah yetkileri ilk kez sınırlandı). Islahat Fermanı (1856 - azınlıklara geniş haklar). I. Meşrutiyet (1876 - Kanun-i Esasi ilk anayasa, Jön Türkler). İstibdat Dönemi (1878-1908 - II. Abdülhamit, Duyun-ı Umumiye Muharrem Kararnamesi). II. Meşrutiyet (1908 - İttihat ve Terakki, 31 Mart Vakası bastıran Hareket Ordusu M. Kemal). Fikir Akımları: Osmanlıcılık, İslamcılık, Türkçülük, Batıcılık.",
  "I. Dünya Savaşı ve Mondros Mütarekesi": "Trablusgarp Savaşı (1911 - Mustafa Kemal'in ilk askeri başarısı, Şerif takma adıyla gazeteci olarak katıldı, Uşi Antlaşması ile Trablusgarp İtalya'ya verildi, On İki Ada geçici olarak İtalya'ya bırakıldı), Balkan Savaşları (I. Balkan: Osmanlıya saldıranlar Bulgaristan, Yunanistan, Sırbistan, Karadağ; en karlı çıkan Bulgaristan, Osmanlıdan ayrılan son balkan devleti Arnavutluk oldu; Babıali Baskını hükümet darbesi İttihat ve Terakki iktidarı; II. Balkan: Bulgaristan'a karşı diğer balkan devletleri savaştı, Edirne kahramanı Enver Paşa Edirne'yi geri aldı). I. Dünya Savaşı (1914-1918): Nedenleri, Osmanlı'nın savaşa girme süreci (Goben ve Breslau gemilerinin Yavuz ve Midilli yapılması, Rus limanları Sivastopol ve Odessa'yı bombalaması). Cepheler: Taarruz Cepheleri: Kafkas (Sarıkamış faciası, Tehcir kanunu, Mustafa Kemal Muş ve Bitlis'i geri aldı Altın Kılıç madalyası, Brest-Litovsk antlaşmasıyla kapandı, Kars Ardahan Batum geri alındı), Kanal (Cemal Paşa, İngilizlerin Mısır'daki egemenliğini kırmak ve Süveyş'i almak amacıyla taarruz edildi, başarısız olundu). Savunma Cepheleri: Çanakkale (Mustafa Kemal Anafartalar kahramanı, Arıburnu, Conkbayırı, Anafartalar; Seyit Onbaşı; Nusret Mayın Gemisi; Bulgaristan ittifaka girdi, Rusya'da ihtilal çıktı yardım gitmediği için Çarlık çöktü), Irak (Halil Paşa Kut'ül Amare zaferi), Hicaz-Yemen (Çöl Kaplanı Fahreddin Paşa Medine müdafaası), Suriye-Filistin (Mustafa Kemal'in savaştığı son cephe, Yıldırım Orduları Grup Komutanlığı, Halep'in kuzeyinde savunma hattı kurdu). Mondros Ateşkes Antlaşması (30 Ekim 1918): Rauf Orbay imzaladı Limni adasında, 7. madde (güvenliği tehdit eden herhangi bir stratejik noktayı işgal hakkı - işgallere hukuki zemin), 24. madde (Vilayat-ı Sitte'de Erzurum, Van, Harput, Diyarbakır, Sivas, Bitlis karışıklık çıkarsa işgal edilecek - Ermeni devleti kurma amacı). İlk işgaller: İlk işgal edilen Osmanlı toprağı Musul (İngiltere), ilk işgal edilen Anadolu toprağı Hatay Dörtyol (Fransa), İzmir'in işgali (15 Mayıs 1919 - Hasan Tahsin ilk kurşun Hukuk-u Beşer gazetesi yazarı, Amiral Bristol Raporu İzmir'in Türk yurdu olduğunu gösteren ilk uluslararası belge).",
  "Kurtuluş Savaşı Hazırlık Dönemi": "Milli Mücadele Dönemi. Mustafa Kemal'in Samsun'a çıkışı (19 Mayıs 1919) ve Samsun Raporu. Havza Genelgesi (İşgallerin protesto ve mitinglerle kınanması istendi, milli bilinç ilk kez uyandı). Amasya Genelgesi (Mustafa Kemal, Rauf Orbay, Ali Fuat Cebesoy, Refet Bele imzaladı, Kazım Karabekir ve Cemal Paşa telgrafla onayladı; Kurtuluş Savaşı'nın gerekçesi, amacı ve yöntemi ilk kez belirtildi, ihtilal beyannamesidir, Temsil Heyeti kurulması fikri ilk kez ortaya çıktı). Erzurum Kongresi (Toplanış bakımından bölgesel, aldığı kararlar bakımından ulusaldır; ilk kez milli sınırlardan bahsedildi - Mebusan meclisi açılmalıdır, ilk kez manda ve himaye reddedildi, Temsil Heyeti bölgesel olarak kuruldu Kazım Karabekir ve Doğu Anadolu Müdafaa-i Hukuk etkisi). Sivas Kongresi (Toplanış ve aldığı kararlar bakımından ulusaldır, her türlü manda ve himaye kesin olarak reddedildi, tüm yararlı cemiyetler Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti adı altında birleştirildi, Temsil Heyeti tüm yurdu temsil eder hale geldi, İrade-i Milliye gazetesi çıkarıldı, Batı cephesi komutanlığına Ali Fuat Cebesoy atandı - Temsil heyetinin ilk kez yürütme yetkisini kullanması). Amasya Görüşmeleri (Temsil Heyeti ile İstanbul Hükümeti Salih Paşa arasında yapıldı, İstanbul Hükümeti Temsil Heyetini resmen tanıdı, Mebusan Meclisinin açılması kararlaştırıldı). Temsil Heyetinin Ankara'ya gelmesi (27 Aralık 1919 - ulaşım, haberleşme, güvenli olması ve batı cephesine yakınlığı nedeniyle merkez seçildi). Misak-ı Milli Kararları (Son Osmanlı Mebusan Meclisinde kabul edildi, milli anddır, kapitülasyonlar, borçlar, boğazlar, sınırlar, azınlıklar, referandum konularını kapsar; işgal altındaki yerler, Kars-Ardahan-Batum ve Batı Trakya için referandum istendi). İstanbul'un resmen işgali (16 Mart 1920 - Misak-ı Millinin kabulü üzerine meclis basıldı, vekiller sürgün edildi Manastırlı Hamdi Efendi M. Kemal'e haber verdi). TBMM'nin Açılması (23 Nisan 1920 - kurucu mecl, meclis hükümeti sistemi, ilk meclis başkanı Mustafa Kemal, Hıyanet-i Vataniye kanunu, İstiklal Mahkemeleri kurulması, isyanların bastırılması). Sevr Barış Antlaşması (10 Ağustos 1920 - Saltanat Şurası imzaladı, meclis onayından geçmediği için hukuken geçersizdir, ölü doğmuş antlaşmadır).",
  "Kurtuluş Savaşı Muharebeler Dönemi": "Cepheler ve Antlaşmalar. Doğu Cephesi: Ermeniler ile savaşıldı, Kazım Karabekir liderliğindeki 15. Kolordu (Osmanlıdan kalan düzenli ordu) savaştı. Gümrü Antlaşması (3 Aralık 1920 - TBMM'nin uluslararası alandaki ilk askeri ve siyasi başarısı, Sevr'i reddeden ilk devlet Ermenistan oldu). Güney Cephesi: Fransız ve Ermeni çetelere karşı sadece Kuva-yı Milliye (halk direnişi) savaştı; Sütçü İmam (Maraş), Şahin Bey (Antep), Ali Saip Bey (Urfa); Sakarya zaferinden sonra imzalanan Ankara Antlaşması (1921) ile kapandı. Batı Cephesi: Düzenli ordunun kurulması (Kuva-yı milliyeden düzenli orduya geçiş). I. İnönü Savaşı (TBMM düzenli ordusunun ilk zaferi, Yunan taarruzu savunuldu). Sonuçları (MİLTER/TALİM): Milis güçlerin orduya katılması hızlandı, İstiklal Marşı kabul edildi (12 Mart 1921 - Mehmet Akif Ersoy ordunun kahramanlığına yazdı, Tacettin Dergahında yazdı, Hamdullah Suphi Tanrıöver okudu mecliste, ilk yayınlandığı gazete Açıksöz, bestecisi Osman Zeki Üngör), Londra Konferansı (TBMM itilaf devletlerince resmen tanındı, Bekir Sami Bey katıldı), Teşkilat-ı Esasiye Kanunu (1921 Anayasası), Afganistan Dostluk Antlaşması (TBMM'yi tanıyan ilk Müslüman devlet Afganistan), Moskova Antlaşması (Sovyet Rusya ile yapıldı, büyük bir Avrupa devleti TBMM'yi resmen tanıdı, Batum Gürcistan'a bırakılarak Misak-ı Milliden ilk taviz verildi). II. İnönü Savaşı (Yunan taarruzu tekrar savunuldu, Mustafa Kemal telgrafı: Siz orada yalnız düşmanı değil, milletin makus talihini de yendiniz). Kütahya-Eskişehir Savaşları (Düzenli ordunun tek yenilgisi, ordu Sakarya nehrinin doğusuna çekildi, Mustafa Kemal'e Başkomutanlık yetkisi verildi, M. Kemal Maarif Kongresini topladı eğitim kongresi, Tekalif-i Milliye Emirleri yayınlandı ordunun ihtiyaçları halktan karşılandı). Sakarya Meydan Muharebesi (Subaylar Savaşı, Mustafa Kemal: Hattı müdafaa yoktur, sathı müdafaa vardır. O satıh bütün vatandır; son savunma savaşıdır, II. Viyana'dan beri süren geri çekilme son buldu, M. Kemal'e Gazilik unvanı ve Mareşallik rütbesi verildi). Sonuçları: Kars Antlaşması (Kafkas Cumhuriyetleri ile yapıldı, doğu sınırımız kesin olarak çizildi), Ankara Antlaşması (1921 - Fransa ile yapıldı, TBMM'yi tanıyan ilk İtilaf devleti Fransa oldu, Hatay Fransız mandasındaki Suriye'ye bırakıldı Misak-ı Milliden ikinci taviz). Büyük Taarruz ve Başkomutanlık Meydan Muharebesi (Rum Sındığı savaşı, M. Kemal: Ordular, ilk hedefiniz Akdeniz'dir, ileri!; taarruz savaşıdır, Afyon Dumlupınar'da başladı, İzmir'in kurtuluşuyla sonuçlandı). Mudanya Ateşkes Antlaşması (11 Ekim 1928 - İsmet İnönü temsil etti, savaşsız kurtarılan yerler: Doğu Trakya, İstanbul ve Boğazlar; Osmanlı Devleti hukuken sona erdi). Lozan Barış Antlaşması (24 Temmuz 1923 - İsmet İnönü, Hasan Saka, Rıza Nur heyeti; çözülemeyen tek konu Irak Sınırı Musul; lehimize çözülenler: kapitülasyonlar tamamen kaldırıldı, Ermeni yurdu iddiası bitti, azınlıklar Türk vatandaşı sayıldı, savaş tazminatı Karaağaç alındı Yunanistandan; aleyhimize çözülenler: Hatay, Boğazlar komisyona bırakıldı, patrikhane dışarı çıkarılamadı).",
  "Atatürk İlke ve İnkılapları": "Siyasi İnkılaplar: Saltanatın kaldırılması (1 Kasım 1922 - laikliğin ilk adımı, Lozan'a ikilik çıkmasını önlemek için), Ankara'nın başkent olması, Cumhuriyetin İlanı (29 Ekim 1923 - devlet başkanlığı sorunu çözüldü, meclis hükümeti sisteminden kabine sistemine geçildi, ilk cumhurbaşkanı M. Kemal, ilk başbakan İsmet İnönü, ilk meclis başkanı Fethi Okyar), Halifeliğin kaldırılması (3 Mart 1924 - laikleşmenin en önemli adımı, inkılapların önü açıldı; Şeriye ve Evkaf Vekaleti kaldırıldı Diyanet ve Vakıflar kuruldu, Tevhid-i Tedrisat kanunu kabul edildi eğitim birleştirildi, Erkan-ı Harbiye kaldırıldı ordu siyasetten ayrıldı, Seyyid Bey meclis konuşması), Çok Partili Hayat Denemeleri: Halk Fırkası (ilk parti), Terakkiperver Cumhuriyet Fırkası (ilk muhalefet partisi, Kazım Karabekir, Rauf Orbay, Ali Fuat, Şeyh Said isyanı ile kapatıldı, Takrir-i Sükun kanunu çıkarıldı), İzmir Suikastı Girişimi (M. Kemal: Benim naçiz vücudum...), Serbest Cumhuriyet Fırkası (Fethi Okyar kurdu, kendisi kapattı, ardından Menemen Olayı Kubilay şehit edilmesi çıktı). Hukuk Alanındaki İnkılaplar: Türk Medeni Kanunu (1926 - İsviçre'den alındı; kadın-erkek sosyal ve ekonomik eşitliği sağlandı, tek eşlilik, mahkemede şahitlik eşitliği, miras eşitliği, velayet hakkı, kadınlara istediği mesleğe girme hakkı; KESİNLİKLE kadınlara siyasi haklar (seçme-seçilme) Medeni Kanun ile verilmemiştir!). Kadınlara Siyasi Haklar (BMW): 1930 Belediye, 1933 Muhtarlık, 1934 Vekil (Milletvekili) seçme ve seçilme hakkı. Eğitim ve Kültür Alanındaki İnkılaplar: Tevhid-i Tedrisat Kanunu (1924), Harf İnkılabı (1928 - yeni Türk harfleri kabul edildi, okuma yazma seferberliği için Millet Mektepleri açıldı, Mustafa Kemal Başöğretmen oldu), Türk Tarih Kurumu (1931) ve Türk Dil Kurumu (1932) kurulması (milliyetçilik ilkesi), Darülfünun'un Üniversite Reformu ile İstanbul Üniversitesi yapılması (Albert Malche raporu). Toplumsal Alandaki İnkılaplar: Şapka ve Kıyafet kanunu (1925), Tekke, Zaviye ve Türbelerin kapatılması (1925), Miladi Takvim, Beynelmilel rakamlar ve ölçü birimleri (metrik sistem) kabulü (Avrupa ile ticari entegrasyon), Soyadı Kanunu (1934 - unvan ve lakaplar kaldırıldı eşitlik ilkesi halkçılık, M. Kemal'e Atatürk soyadı meclisçe verildi). İktisadi Alandaki İnkılaplar: İzmir İktisat Kongresi (Misak-ı İktisadi kabul edildi, milli ekonomi), Aşar vergisinin kaldırılması (1925 - köylü rahatlatıldı halkçılık), Kabotaj Kanunu (1926 - Türk karasularında gemi işletme hakkı millileştirildi milliyetçilik), Teşvik-i Sanayi Kanunu (başarısız oldu halkta sermaye olmadığı için), I. Beş Yıllık Sanayi Planı (başarıyla uygulandı devletçilik, Sümerbank, Etibank kuruldu). Atatürk İlkeleri: Cumhuriyetçilik (ulus egemenliği, demokrasi, seçim, meclis), Milliyetçilik (bağımsızlık, Türk dili, Türk tarihi, ortak kader ve amaç, kabotaj kanunu), Halkçılık (eşitlik, ayrıcalıksız toplum, sosyal devlet, aşarın kaldırılması, soyadı kanunu, medeni kanun), Devletçilik (ekonomik yatırımların devlet eliyle yapılması, 1. beş yıllık sanayi planı, bankaların kurulması, özel sektörün yetersiz kaldığı durumlar), Laiklik (akıl ve bilim, din ve devlet işlerinin ayrılması, halifeliğin kaldırılması, medeni kanun, şeriye ve evkafın kaldırılması, 1928'de 'devletin dini islamdır' ibaresinin anayasadan çıkarılması, 1937'de ilkelerin anayasaya girmesi), İnkılapçılık (dinamik yapı, çağdaşlaşma, sürekli yenilenme, ölçü ve tartı değişikliği, miladi takvim).",
  "Çağdaş Türk ve Dünya Tarihi": "İki Savaş Arası Dönem: Kara Gömlekliler İtalya (Mussolini - Spazio Vitale/Bizim Deniz), Nazizm Almanya (Hitler - Hayat Sahası, Gestapo, Kristal Gece), Sovyet Rusya (Lenin NEP politikası, Stalin kollektifleştirme basmacı hareketi Zeki Velidi Togan, Enver Paşa şehit edilmesi), Japonya (İmparator Meiji restorasyonu, Asya Asyalılarındır, Co-Prosperity), 1929 Dünya Ekonomik Buhranı (Kara Perşembe, New York borsası çöküşü, Türkiye'de kliring takas sistemi ve devletçilik ilkesinin zorunlu uygulanması). II. Dünya Savaşı (1939-1945): Mihver Grubu (Almanya, İtalya, Japonya), Müttefik Grubu (İngiltere, Fransa, SSCB, ABD). Önemli Olaylar: Barbarossa Harekatı (Almanya'nın Rusya taarruzu), Pearl Harbor Baskını (Japonya'nın ABD limanını bombalaması, ABD savaşa girdi), Normandiya Çıkarması (Müttefiklerin Fransa'yı kurtarması), Hiroşima ve Nagazaki atom bombaları (Japonya teslim oldu). Savaş sırası konferanslar: Yalta (SSCB'nin gücünün artması, BM kurucu üyeliği için Mihvere savaş açma şartı), Potsdam (Almanya'nın paylaşılması). Türkiye'nin savaştaki politikası: Savaş dışı kalma, aktif tarafsızlık, İngiltere ve müttefiklerin baskısıyla son dakikada Mihver grubuna sembolik savaş açılması (BM kurucu üyesi olmak için), içeride Varlık Vergisi ve Toprak Mahsulleri Vergisi çıkarılması, Milli Korunma Kanunu, ekmek karnesi uygulaması. Soğuk Savaş Dönemi: Doğu Bloğu: SSCB liderliğinde, Kominform (siyasi işbirliği), Comecon (ekonomik işbirliği), Varşova Paktı (askeri ittifak). Batı Bloğu: ABD liderliğinde, Truman Doktrini ve Marshall Planı (ekonomik yardımlar Türkiye dahil), NATO (Kuzey Atlantik askeri ittifakı, Türkiye Kore'ye asker göndererek 1952'de üye oldu), Bağdat Paktı (sonradan CENTO). Ortadoğu Gelişmeleri: Balfour Deklarasyonu ile İsrail'in kurulması (1948), Arap-İsrail Savaşları. Yumuşama (Detant) Dönemi: Salt-I ve Salt-II antlaşmaları (nükleer silah sınırlandırma), Helsinki Nihai Senedi. Küreselleşen Dünya: SSCB'nin dağılması (1991 - Mihail Gorbaçov Glasnost ve Perestroyka politikaları), Türk Cumhuriyetlerinin bağımsızlığı (Azerbaycan Ebulfez Elçibey, Kazakistan Nursultan Nazarbayev, Özbekistan Islam Kerimov, Türkmenistan Saparmurat Niyazov, Kırgızistan Askar Akayev), TİKA kurulması.",
  "Harita Bilgisi": "Projeksiyon Yöntemleri: Silindirik Projeksiyon (Ekvator ve çevresi en az hata ile çizilir, kutuplara doğru bozulma artar, Grönland devasa görünür), Konik Projeksiyon (Orta kuşak ve Türkiye çevresi en az hata ile çizilir, kutup ve ekvatora gidildikçe bozulma artar), Düzlem Projeksiyon (Kutuplar ve dar alanlar en az hata ile çizilir, merkezden uzaklaştıkça hata artar). Harita elemanları: Ölçek (büyük ölçekli haritaların paydası küçüktür, gösterdiği alan dardır, ayrıntı fazladır, izohips farkı azdır, hata oranı düşüktür; küçük ölçekli haritaların paydası büyüktür, gösterdiği alan geniştir, ayrıntı azdır, izohips farkı fazladır, hata oranı yüksektir). İzohips (Eş yükselti eğrileri) Özellikleri: İç içe kapalı eğrilerdir, birbirlerini kesinlikle kesmezler, en dıştaki eğri en alçak, en içteki en yüksektir. Eğrilerin sıklaştığı yerlerde: Eğim fazladır, akarsu akış hızı ve aşındırma gücü fazladır, heyelan riski yüksektir, kıt sahanlığı (şelf) dardır, falez (yalıyar) oluşumu yaygındır, yol yapım maliyeti yüksektir. Eğrilerin seyrekleştiği yerlerde: Eğim azdır, kıt sahanlığı geniştir, delta ovaları oluşabilir. İzohips terimleri: V şekli sivri ucu yüksekliği gösteriyorsa vadi (akarsu akar), sivri ucu alçağı gösteriyorsa sırt (su bölümü çizgisi), içe doğru ok işaretleri varsa çanak/krater/kapalı havuz yükselti azalır.",
  "Türkiye'nin Fiziki Coğrafyası (Yer Şekilleri)": "Türkiye'nin jeolojik oluşumu: I. Jeolojik Zaman (Paleozoik - Masif araziler Yıldız Dağları, Menteşe, Saruhan, Kırşehir, Bitlis masifleri; Zonguldak taş kömürü yatakları oluşumu), II. Zaman (Mesozoik - Tethys denizinde tortulanma), III. Zaman (Neozoik - Alp-Himalaya kıvrım sistemi Kuzey Anadolu Dağları ve Toroslar, linyit, petrol, tuz, bor, jeotermal kaynakların oluşumu, Anadolu toptan yükselmeye başladı), IV. Zaman (Kuvaterner - Egeid karasının çökmesi ve Ege denizinin oluşumu, Boğazların İstanbul ve Çanakkale oluşumu, Karadeniz'in deniz haline gelmesi, buzul çağları). Orojeniz Kıvrım Dağları: Kuzey Anadolu Dağları (Kaçkar, Canik, Küre, Köroğlu, Bolu, Yıldız) ve Toroslar (Beydağları, Geyik, Bolkar, Aladağlar, Tahtalı, Binboğa) antiklinal ve senklinal yapılar. Orojeniz Kırık Dağları: Ege Bölgesi horst (dağ) ve graben (ova) yapıları; Horstlar: Yunt, Madra, Kozak, Bozdağlar, Aydın dağları, Menteşe dağları ve Akdeniz'deki Nur (Amanos) Dağları; Grabenler (Çöküntü ovaları): Bakırçay, Gediz, Küçük Menderes, Büyük Menderes ve Amik ovaları. Epijenik hareketler: Anadolu'nun toptan yükselmesi (kuvaternerde aşınan yüksek düzlüklerin hafifleyip yükselmesi), taraça (sekiler) oluşumu, yüksek platolar (Erzurum-Kars). Volkanik Dağlar: Doğu Anadolu: Ağrı (en yüksek dağımız), Süphan, Tendürek, Nemrut (kaldera gölü var); İç Anadolu: Erciyes, Hasan Dağı, Melendiz, Karacadağ, Karadağ; Güneydoğu: Karacadağ (kalkan biçimli volkan); Ege: Kula Volkanları (en genç volkanik alan, insan ayak izleri). Dış kuvvetler: Akarsu aşındırma şekilleri: Vadi, dev kazanı, kırgıbayır (badlands), peri bacaları (Nevşehir Ürgüp Göreme, sel suları tüfleri aşındırdı, rüzgar dolaylı etki), plato (yüksek düzlükler), Peneplen (yontukdüz). Akarsu biriktirme şekilleri: Delta ovaları (kıyıda gelgit olmamalı, akarsu bol alüvyon taşımalı, kıyı sığ olmalı, Çukurova Seyhan/Ceyhan, Çarşamba Yeşilırmak, Bafra Kızılırmak, Silifke Göksu, ege deltaları Menemen, Selçuk, Balat), birikinti yelpazesi, dağ eteği ovası, dağ içi ovası, kum adası. Karstik aşındırma şekilleri (Kireçtaşı/Kalker, alçıtaşı/jips, kaya tuzu yaygın teke ve taşeli platoları akdeniz): Lapya (en küçük), Dolin, Uvala, Polye (en büyük karstik ova - TAKKİ: Tefenni, Acıpayam, Korkuteli, Kestel, Elmalı), Obruk (Cennet-Cehennem, Kızören, sulak alan çökmesi), Mağara (Karain, Damlataş). Rüzgar şekilleri (kurak yarı kurak alanlar iç anadolu ve güneydoğu): Aşındırma Tafoni, Mantar kaya, Şahit kaya; Biriktirme Lös, Kumul, Barkan. Kıyı Tipleri: Boyuna kıyı tipi (Karadeniz ve Akdeniz - dağlar kıyıya paralel, girinti çıkıntı az, doğal liman az, kıt sahanlığı dar, falez çok), Enine kıyı tipi (Ege - dağlar kıyıya dik, girinti çıkıntı çok, koy körfez doğal liman çok, kıt sahanlığı geniş, falez az, delta kolay oluşur), Rias tipi kıyı (İstanbul ve Çanakkale boğazları, Haliç, eski akarsu vadilerinin deniz altında kalması, Muğla kıyıları), Limanlı kıyı (Büyük ve Küçük Çekmece kıyıları), Dalmaçya kıyı tipi (Antalya Kaş kıyıları, kıyıya paralel dağların çöken kısımlarının ada haline gelmesi), Kalanklı kıyı tipi (Mersin-Silifke kıyıları karstik çöküntüler). KESİNLİKLE Türkiye'de fiyort, skayer (buzul etkisi olmadığı için orta kuşakta olduğumuzdan kıyıda buzul yoktur) ve haliç/watt (gelgit etkisi olmadığı için iç deniz olduğumuzdan) kıyı tipleri görünmez!",
  "Türkiye'nin İklimi": "Türkiye iklimini etkileyen faktörler: Matematik konum: Kuzey yarım kürede orta kuşakta yer alması (Dört mevsim belirgin yaşanır, Cephesel yağışlar görülür, Akdeniz iklim kuşağındadır, rüzgarlar kuzeyden soğuk güneyden sıcak eser, Bakı yönü güneydir güney yamaçlar daha sıcaktır). Özel konum: Üç tarafının denizlerle çevrili olması, dağların uzanış yönü (batı-doğu yönünde uzanır kıyı ile iç kesim arası iklim farkı artar karadeniz ve akdenizde), yükseltinin batıdan doğuya artması sıcakhığın azalması. Sıcaklık dağılışı: En sıcak yerler yazın Güneydoğu Anadolu (karasallık, güneyden gelen sıcak rüzgarlar Samyeli), kışın en sıcak yer Akdeniz kıyıları (enlem, denizellik, nemlilik). En soğuk yerler kışın Kuzeydoğu Anadolu Erzurum-Kars (yükselti, karasallık, sibirya yüksek basıncı). Rüzgarlar: Soğuk yerel rüzgarlar (kuzeyden esenler - Kayıp): Karayel (kuzeybatı), Yıldız (kuzey), Poyraz (kuzeydoğu); Sıcak yerel rüzgarlar (güneyden esenler - Sakal): Samyeli/Keşişleme (güneydoğu), Kıble (güney), Lodos (güneybatı - soba zehirlenmesi, deniz ulaşımı aksaması). Fön Rüzgarı: Dağ yamacından aşağı esen, her 100 metrede sıcaklığı 1 derece arttıran kuru rüzgar (Doğu Karadeniz Rize'de turunçgil ve mikroklima, Doğu Anadolu Iğdır'da pamuk mikrokliması sağlar). Basınç Merkezleri: İzlanda alçak basıncı (kışın ılık ve yağışlı getirir), Sibirya yüksek basıncı (kışın aşırı soğuk ve kar getirir), Azor yüksek basıncı (yazın sıcak ve kurak getirir), Basra alçak basıncı (yazın güneydoğudan aşırı sıcak getirir). Yağış Oluşum Tipleri: Yamaç (Orografik) Yağışları: Dağların kıyıya paralel uzandığı Karadeniz (en çok) ve Akdeniz kıyılarında görülür; Konveksiyonel (Yükselim) Yağışları: Isınan havanın yükselip soğumasıyla İç Anadolu'da ilkbaharda (Kırkikindi yağışları), Erzurum-Kars'ta yazın görülür; Cephesel (Frontal) Yağışlar: Sıcak ve soğuk havanın karşılaşmasıyla Akdeniz iklim bölgesinde kışın görülür (matematik konum kanıtı). İklim Tipleri: Karadeniz İklimi: Her mevsim yağışlı, en çok yağış sonbaharda, en az ilkbaharda, nem oranı yüksek yıllık sıcaklık farkı en az, doğal bitki örtüsü Orman; Akdeniz İklimi: Yazlar sıcak ve kurak kışlar ılık ve yağışlı, en çok yağış kışın, don olayı nadir, mikroklima zeytin ve turunçgil, bitki örtüsü Maki (kızılçam tahribiyle oluşur zeytin, defne, zakkum, mersin, keçiboynuzu, maki tahribiyle garig); Karasal İklim: Yazlar sıcak kurak kışlar soğuk karlı, en çok yağış ilkbaharda konveksiyonel, bitki örtüsü Bozkır (antropojen bozkır orman tahribiyle); Sert Karasal İklim (Erzurum-Kars-Ardahan): Yazlar serin ve yağışlı, kışlar çok soğuk ve karlı, en çok yağış yazın konveksiyonel, bitki örtüsü Alpin Çayırlar (büyükbaş hayvancılık gelişmiştir). Yağış miktarları: En çok yağış alan yer Doğu Karadeniz (Rize), en az yağış alan yer Tuz Gölü çevresi ve Iğdır ovası.",
  "Türkiye'nin Bitki Örtüsü ve Toprak Yapısı": "Toprak Tipleri: Zonal (Yerli) Topraklar: İklim ve bitki örtüsüne göre oluşur. Kahverengi Orman Toprağı: Karadeniz iklimi nemli orman altı, humusça zengin; Terrosa (Kırmızı Toprak): Akdeniz iklimi kalkerli arazide, demir oksit oranı yüksek kırmızı renkli; Kahverengi/Kestane Renkli Bozkır Toprağı: Karasal iklim steplerinde, humus az kireçli, tahıl tarımı; Podzol: Batı Karadeniz yüksek soğuk nemli iğne yapraklı orman altı; Çernezyom (Kara Toprak): Sert karasal iklim Erzurum-Kars alpin çayırları altı, dünyanın en zengin humuslu verimli toprağı, ancak iklim soğuk olduğu için tarımda kullanılamaz çayır ve büyükbaş; Tundra: Türkiye'de görünmez kutup iklimi olmadığı için. İntrazonal Topraklar: Halomorfik (tuzlu), Hidromorfik (sulu bataklık), Kalsimorfik: Vertisol (Dönen toprak, taş doğuran, Trakya Ergene ayçiçeği), Rendzina (yumuşak kireçli). Azonal (Taşınmış) Topraklar: Horizonları katmanları yoktur, mineralce zengin verimlidir. Alüvyal Toprak: Akdeniz/Ege nehir biriktirmeleri delta ovalarında; Kolüvyal: Dağ eteklerinde biriken; Lös: Rüzgar taşıması; Regosol: Volkanik kumlu; Moren: Buzul taşıması (yüksek dağlarda az miktarda). Bitki Örtüsü: Ormanlar: En çok Karadeniz, sonra Akdeniz, en az Güneydoğu; Geniş yapraklı (kayın, meşe, gürgen alçakta), iğne yapraklı (çam, göknar, ardıç yüksekte). Maki: Akdeniz iklimi kızılçam tahribiyle bodur çalılar; Garig: Maki tahribiyle abdestbozan, süpürge çalısı; Psodomaki (Yalancı maki): Karadeniz'de nemli yerlerde orman tahribiyle yabani fındık. Bozkır (Step): İç anadolu en yaygın bitki örtüsü, ilkbahar yağışıyla yeşeren yazın sararan otlar (geven, yavşan otu, çoban yastığı, üzerlik), Antropojen bozkır: İnsanların ormanı kesmesiyle oluşan bozkır (İç Anadolu Ergene). Alpin Çayırlar: Erzurum-Kars yüksek dağ yamaçları yaz yağışıyla yeşeren uzun otlar. Endemik bitkiler (dünyada sadece bir yerde): Sığla Ağacı (Muğla Köyceğiz kozmetik sanayi), Datça Hurması, Kasnak Meşesi (Isparta), İspir Meşesi (Yozgat), Safran Otu (Safranbolu). Relikt (Kalıntı) bitkiler: Eski jeolojik dönemlerden günümüze kalan iklim değişimi korunan bitkiler (Karadeniz'deki sandal, kocayemiş; Akdeniz'deki kayın ormanı mikroklima).",
  "Türkiye'nin Su Kaynakları (Akarsular, Göller)": "Akarsular: Genel Özellikleri: Boyları genellikle kısadır (yarımada olması, dağların kıyıya paralel uzanması), debileri (akımları) düşüktür ve rejimleri düzensizdir (Karadeniz akarsuları hariç Çoruh rejim görece düzenli), akış hızları, aşındırma güçleri ve hidroelektrik potansiyelleri yüksektir (dağlık engebeli yapı), ulaşıma elverişli değildirler (Bartın çayı hariç, onda da sadece ağız kısmında tomruk taşımacılığı yapılır). Havzalarına göre: Açık Havza (denize dökülenler): Kızılırmak (Türkiye sınırları içindeki en uzun nehir), Yeşilırmak, Sakarya, Seyhan, Ceyhan, Göksu, Fırat ve Dicle (basra körfezine açık havza), Çoruh, Aras ve Kura (hazar gölüne kapalı havza dökülür). Kapalı Havzalar (denize dökülemeyenler): Tuz Gölü kapalı havzası, Konya kapalı havzası, Göller Yöresi, Van Gölü kapalı havzası, Aras-Kura kapalı havzası (Hazar denizine/gölüne döküldükleri için). Sınır aşan nehirler: Fırat, Dicle, Aras, Kura, Çoruh (Türkiye'den doğup dışarı gidenler); Meriç (Bulgaristan'dan doğup Türkiye'ye gelen, Yunanistan sınırı çizen), Asi (Lübnan'dan doğup Suriye üzerinden Hatay'dan dökülen). Göller: Oluşumlarına Göre: Tektonik Göller (fay hatlarında çöken alanlar, suları genellikle tatlı veya tuzlu): Tuz Gölü (en sığ göl, tuz üretimi), Beyşehir (en büyük tatlı su gölü, milli park), Eğirdir, Burdur, Manyas (Kuş Gölü), Sapanca, İznik, Uluabat, Hazar, Akşehir. Karstik Göller (erime çukurlarında biriken sular, suları kireçli teke ve taşeli): Salda (Türkiye'nin Maldivleri, magnezyum mineral beyaz kumsal), Kovada, Avlan, Castell, Söğüt. Volkanik Göller (krater, kaldera suları): Nemrut Kaldera Gölü (Bitlis, dünyanın ikinci büyük kalderası), Meke Tuzlası (Konya, dünyanın nazar boncuğu, maar gölü, kuruyor), Gölcük (Isparta). Buzul (Sirk) Gölleri (yüksek dağlarda): Kaçkar, Uludağ, Cilo, Bolkar dağlarındaki küçük göller. Set Gölleri: Heyelan Set Gölleri (Karadeniz en heyelan): Tortum (Erzurum), Sera (Trabzon), Abant ve Yedigöller (Bolu), Zinav (Tokat). Volkanik Set Gölleri (Doğu Anadolu): Van Gölü (en büyük gölümüz, suları sodalı, inci kefali, nemrut lav seti), Erçek, Nazik, Çıldır (kışın donar kızakla kayılır), Balık, Haçlı. Alüvyal Set Gölleri: Bafa/Çamiçi (Menderes), Marmara Gölü (Manisa), Mogan ve Eymir (Ankara), Köyceğiz (Muğla). Kıyı Set (Lagün/Deniz Kulağı) Gölleri: Durusu/Terkos, Büyük Çekmece, Küçük Çekmece. Karstik Baraj/Set: Tortum heyelan ama göller yöresinde doğal göller var.",
  "Türkiye'de Nüfus ve Yerleşme": "Nüsusun Dağılışını Etkileyen Doğal Faktörler: İklim (en önemli faktör, kıyı kesimler yağışlı ılık nüfus yoğun, iç kesimler kurak soğuk nüfus seyrek), yer şekilleri (dağlık engebeli alanlar seyrek nüfuslu Doğu Karadeniz iç kesimleri, Menteşe yöresi dağlık turizm var ama seyrek, Teke ve Taşeli platoları karstik engebeli su sızıyor yer altına seyrek), su kaynakları (akarsu kenarları yerleşim sık). Beşeri Faktörler: Sanayileşme, tarım, ticaret, madencilik (Zonguldak taş kömürü, Batman petrol yoğun nüfus), turizm (Antalya, Muğla mevsimsel nüfus değişimi fazla). Yoğun Nüfuslu Alanlar: Çatalca-Kocaeli (İstanbul, İzmit, Adapazarı - sanayi, ticaret, ulaşım), Kıyı Ege (İzmir, Manisa, Aydın - sanayi, tarım, turizm), Doğu Karadeniz Kıyısı (tarım, çay-fındık, yer şekillerinden dolayı dar kıyı şeridinde nüfus sıkışmıştır, ancak iç kesimler çok seyrektir), Çukurova (tarım, sanayi), Ankara ve Eskişehir çevresi (idari, ulaşım). Seyrek Nüfuslu Alanlar: Yıldız Dağları Yöresi (Kırklareli - engebeli, anayollara sapa kalması), Menteşe Yöresi (Muğla - dağlık engebeli yapı), Teke ve Taşeli Platoları (Akdeniz - engebeli karstik arazi, su kaybı), Tuz Gölü Çevresi ( İç Anadolu - kuraklık, yağış azlığı), Hakkari Yöresi (Doğu Anadolu - dağlık engebeli sert kış), Erzurum-Kars (soğuk iklim sert karasal). Nüfus Piramidi Özellikleri: Türkiye'nin nüfus piramidi gelişmekte olan/gelişmiş ülke modeline kaymaktadır. Doğum oranları hızla düşmektedir, çocuk nüfus oranı azalmaktadır, yaşlı nüfus oranı artmaktadır, ortanca yaş yükselmektedir (33-34 civarı), nüfus artış hızı düşmektedir, ancak toplam nüfus artmaya devam etmektedir (nüfus artış hızı eksiye düşmediği sürece toplam nüfus artar). Okuryazarlık oranı %97'nin üzerindedir. Kent nüfusu oranı %93'ün üzerindedir (en çok kent nüfusu İstanbul, en az kırsal nüfus tunceli/gümüşhane). Nüfus projeksiyonları: Nüfusun yaşlanması, iş gücü ihtiyacının gelecekte artacağı öngörülmektedir. Yerleşmeler: Kentsel yerleşmeler (büyükşehirler metropolitan), kırsal yerleşmeler. Kırsal mesken tipleri: Ahşap mesken (Karadeniz nem orman çok), Toprak/Kerpiç mesken ( İç Anadolu ve Güneydoğu kurak kil toprak), Taş mesken (Akdeniz karstik taş, Doğu Anadolu volkanik taş, Ege). Köy altı yerleşmeleri: Geçici Köy Altı: Yayla (en yaygın, Karadeniz, Akdeniz, Doğu Anadolu), Ağıl (hayvancılık İç Anadolu), Kom (Doğu Anadolu hayvancılık), Oba (göçebe Yörük çadırları Toroslar Ege), Dam (Ege hayvancılık tarım), Dalyan (balıkçılık Ege Muğla). Kalıcı Köy Altı: Mahalle, Mezra (Doğu ve Güneydoğu tarım hayvancılık), Divan (Batı Karadeniz birkaç mahallenin birleşmesi), Çiftlik (Geniş tarım arazileri Trakya, İç Anadolu, Ege, Çukurova).",
  "Türkiye'nin Ekonomik Coğrafyası (Tarım)": "Tarım Yöntemleri: İntansif (Modern) Tarım: Sulama, gübreleme, kaliteli tohum (ıslah), makine kullanımı yaygındır. Birim alandan alınan verim çok yüksektir, iklime bağımlılık azdır, üretimde dalgalanma azdır (Kıyı Ege, Çukurova, Marmara). Ekstansif (Kaba/Geleneksel) Tarım: İklime bağımlılık fazladır, birim alandan alınan verim düşüktür, üretimde yıllara göre dalgalanma fazladır, nadas uygulaması yaygındır (İç Anadolu, Doğu Anadolu). Nadas: Toprağın bir yıl ekilip bir yıl dinlendirilmesi. Su yetersizliğinden yapılır, erozyonu arttırır, İç Anadolu'da yaygındır. GAP ve KOP sulama projeleriyle nadas alanları azalmaktadır. Tarım Ürünleri: Devlet Kontrolünde Olanlar: Tütün (kaliteyi korumak için her bölgede izin verilmez), Pirinç (sıtma hastalığı sivrisinek yaydığı için yerleşim yerleri çevresinde yasaktır akarsu yataklarında izin verilir), Kenevir (uyuşturucu yapımında kullanıldığı için narkotik kontrolündedir), Haşhaş (alkaloit fabrikası ilaç yapımı uyuşturucu kontrolü, Afyonkarahisar), Şeker Pancarı (kota uygulaması vardır, fabrikaya yakın olmalıdır çabuk bozulur küspesi hayvan yemi olduğu için besi hayvancılığı şeker fabrikası çevresinde gelişmiştir). İklim Seçiciliği Olmayan (Her bölgede yetişebilen): Elma ve Üzüm (soğuğa don olayına karşı en dayanıklı ürünlerdir, her bölgede yetişir). Kış Ilıklığı İsteyenler (Mikroklima ve Akdeniz): Zeytin, Turunçgiller, İncir (kıyı bölgeler en çok Ege), Çay (Doğu Karadeniz Rize mikroklima, her mevsim bol yağış ve asitli toprak ister), Fındık (Karadeniz iklimi, nemli). Üretimde Birinci Olan İller (TÜİK güncel): Şeker pancarı, Buğday, Arpa (Konya), Pamuk (Şanlıurfa GAP ile birinci), Çay (Rize), Fındık (Ordu), İncir, Zeytin (Aydın), Tütün (Denizli/Adana), Mısır (Konya/Adana sulamayla), Pirinç (Edirne Meriç nehri), Muz (Mersin Anamur mikroklima), Turunçgiller (Adana/Mersin), Kayısı (Malatya), Antep Fıstığı (Şanlıurfa/Gaziantep), Gül (Isparta). Hayvancılık: Küçükbaş Hayvancılık: Bozkır bitki örtüsünün olduğu İç Anadolu (en çok koyun Van/Konya) ve Güneydoğu'da yaygındır. Kıl Keçisi: Dağlık engebeli Akdeniz Toroslar (ormanlara zarar verdiği için devlet kontrolündedir, Teke ve Taşeli). Tiftik Keçisi (Ankara Keçisi): Ankara ve Eskişehir çevresi. Büyükbaş Hayvancılık: Yaz yağışlarıyla yeşeren uzun alpin çayırların olduğu Erzurum-Kars and Doğu Karadeniz'de (Mera hayvancılığı şeklinde iklime bağlı rekolte dalgalanır) yapılır. Besi ve Küher Hayvancılığı: Tüketici nüfusun fazla olduğu büyükşehirler çevresinde (İstanbul, Bursa, İzmir, Konya şeker fabrikaları yakınları) yapılır, ahırlarda modern yöntemlerle yapılır iklime bağımlılık sıfırdır verim yüksektir. İpek Böcekçiliği: Yaş dut yaprağı yer, eskiden Bursa birinciydi şimdi suni ipek gelince Diyarbakır ve Şanlıurfa birinci sıraya yerleşti. Arıcılık: Bitki çeşitliliğinin fazla olduğu dağlık engebeli alanlarda yapılır; Muğla (çam balı), Ordu (çiçek balı), Adana, Hakkari, Kars, Rize Anzer balı. Kümes Hayvancılığı: Büyük tüketim merkezleri çevresinde kapalı tesislerde yapılır, iklimden etkilenmez (Manisa, Bolu, Balıkesir, Sakarya). Balıkçılık: En çok Karadeniz'de (%70 civarı, oksijen nem soğuk su), ancak kıyı balıkçılığı yapıldığı için verim düşüktür; kültür balıkçılığı Ege kıyılarında (Muğla milas) gelişmiştir.",
  "Türkiye'nin Ekonomik Coğrafyası (Sanayi ve Enerji)": "Madenler: Demir (Divriği Sivas, Hekimhan Malatya çıkarılır; Ereğli-Karabük kömür yataklarına/enerji kaynağına yakınlıktan dolayı işlenir, İskenderun liman/ulaşımdan dolayı işlenir), Bakır (Murgul Artvin, Küre Kastamonu, Maden Elazığ çıkarılır; Samsun'da liman/ulaşımdan dolayı işlenir), Krom (Fethiye Muğla, Guleman Elazığ çıkarılır; Elazığ ve Antalya ferrokrom fabrikalarında işlenir), Bor (Mustafakemalpaşa Bursa, Susurluk Balıkesir, Seyitgazi Eskişehir, Emet Kütahya çıkarılır; Bandırma Balıkesir'de işlenir), Boksit (Seydişehir Konya çıkarılır ve işlenir), Mermer (en çok ihraç edilen maden, Afyonkarahisar, Balıkesir, Marmara adası, Denizli), Taş Kömürü (Zonguldak çıkarılır, Çatalağzı termik santrali elektrik üretir, demir-çelik sanayisinde yakıt olarak kullanılır), Linyit (en yaygın enerji kaynağı, III. zamanda oluştuğumuz için her bölgede bulunur, Soma Manisa, Yatağan Muğla, Afşin-Elbistan Kahramanmaraş termik santrallerinde kullanılır), Petrol (Raman Batman çıkarılır ve işlenir; İzmir, İzmit, Kırıkkale, Batman rafinerileri), Doğalgaz (Kırklareli Hamitabat, Düzce Akçakoca çıkarılır; Hamitabat, Ambarlı, Ovaakça doğalgaz çevrim santrallerinde elektrik üretilir). Yenilenebilir enerji: Hidroelektrik (dağlık engebeli doğu anadolu ve karadeniz, barajlar: Atatürk, Karakaya, Keban), Rüzgar (Ege kıyıları, İzmir, Balıkesir, Çanakkale), Jeotermal (yer altı sıcak suları fay hatları, Sarayköy Denizli, Germencik Aydın), Güneş enerjisi (en fazla potansiyel Güneydoğu ve Akdeniz, en az Karadeniz). Sanayi kollarının dağılımı: Otomotiv (Bursa, Kocaeli, İstanbul, İzmir, Sakarya, Aksaray), Dokuma/Tekstil (İstanbul, Bursa, İzmir, Denizli, Adana, Kayseri, Gaziantep).",
  "Türkiye'nin Ekonomik Coğrafyası (Ulaşım ve Ticaret)": "Ulaşım: En ucuzdan en pahalıya uluslararası ulaşım: Denizyolu - Demiryolu - Karayolu - Havayolu. Karayolu geçitleri: Karadeniz dağlarını aşan geçitler (Zigan/Kalkanlı Trabzon-Gümüşhane, Kop Bayburt-Erzurum, Ilgaz Kastamonu-Çankırı, Ecevit), Akdeniz Torosları aşan geçitler (Sertavul İç Anadolu-Mersin, Gülek İç Anadolu-Adana, Çubuk Göller Yöresi-Antalya, Belen Çukurova-Hatay - Sen Çok Güzelsin Belen). Demiryolu ulaşımı olmayan önemli iller: Çanakkale, Muğla, Antalya, Sinop, Trabzon, Rize, Giresun, Hakkari, Şırnak. Ticaret: İç ticaret hacmi çok geniştir (bölgeler arası üretim ve tüketim farkı, nüfus dağılımı). Dış ticaret: İhracat (en çok sattıklarımız: motorlu kara taşıtları, kazanlar ve makineler, demir-çelik, hazır giyim, mermer, bor, beyaz eşya, tarım ürünleri fındık/kayısı/incir), İthalat (en çok aldıklarımız: mineral yakıtlar ve yağlar doğalgaz/petrol, makine parçaları, elektrikli cihazlar, altın, otomobil, kimyasal ürünler). En çok ihracat yaptığımız ülkeler: Almanya, ABD, İngiltere, İtalya, Irak. En çok ithalat yaptığımız ülkeler: Rusya, Çin, Almanya, İsviçre. Turizm: Kültürel miras (Göbeklitepe Şanlıurfa, Efes/Bergama İzmir, Hattuşaş Çorum, Safranbolu Evleri Karabük, Nemrut Dağı Adıyaman, Troya Çanakkale, Pamukkale/Hierapolis Denizli, Kapadokya Nevşehir).",
  "Dünya Coğrafyası": "Önemli Boğazlar ve Kanallar: Süveyş Kanalı (Akdeniz-Kızıldeniz, yapay kanal, Mısır, Baharat yolu önem kazandı), Panama Kanalı (Büyük Okyanus-Atlas Okyanusu, yapay kanal, mühendislik harikası, Macellan Boğazı önemini kaybetti), Hürmüz Boğazı (Basra Körfezi-Umman Denizi, petrol taşımacılığında dünyanın en kritik geçidi, Basra petrol kapısı), Babilmendep Boğazı (Kızıldeniz-Aden Körfezi/Hint Okyanusu), Cebelitarık Boğazı (Akdeniz-Atlas Okyanusu, Fas-İspanya arası), Malakka Boğazı (Endonezya-Malezya, Hint-Büyük okyanus geçişi, yoğun ticaret ve korsanlık), Bering Boğazı (Asya-Kuzey Amerika, tarih değiştirme çizgisi, en sapa boğaz), Dover Boğazı (İngiltere-Fransa arası, Manş tüneli), Kiel Kanalı (Baltık Denizi-Kuzey Denizi, Almanya), Korint Kanalı (Yunanistan, çok dar, büyük gemiler geçemez). İklim Bölgeleri (Ekvatoral - Amazon/Kongo; Savan; Çöl - Sahra/Gobi; Akdeniz iklimi güney/kuzey 30-40 enlemleri kaliforniya, orta şili, kap bölgesi güney afrika, güney avustralya kıyıları; Tundra; Muson - Güneydoğu Asya en fazla yağış alan yer Çerapunçi)."
};

/**
 * Executes a Gemini content generation request with automatic model fallbacks if
 * the user's preferred model is down, rate-limited, or unavailable (e.g. status 503).
 */
async function fetchGeminiWithFallback(
  preferredModel: string,
  requestBody: any,
  apiKey: string,
  responseMimeType?: string
): Promise<any> {
  const modelsToTry = [preferredModel, 'gemini-3.1-flash-lite', 'gemini-1.5-flash'];
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));

  let lastError: any = null;

  for (const model of uniqueModels) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Copy the requestBody so we don't mutate the original
    const bodyCopy = JSON.parse(JSON.stringify(requestBody));

    if (responseMimeType) {
      bodyCopy.generationConfig = bodyCopy.generationConfig || {};
      bodyCopy.generationConfig.responseMimeType = responseMimeType;
    }

    try {
      if (__DEV__) {
        console.log(`[Diagnostic] fetchGeminiWithFallback - Model: ${model}, Key length: ${apiKey ? apiKey.length : 0}`);
      }
      console.log(`Gemini API çağrılıyor. Model: ${model}`);
      const res = await fetch(`${geminiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyCopy),
      });

      if (res.ok) {
        return await res.json();
      }

      const errorData = await res.json().catch(() => null);
      const message = errorData?.error?.message || `HTTP ${res.status}`;
      console.warn(`Model ${model} hatası: ${message} (Status: ${res.status})`);

      lastError = new Error(message);

      if (res.status === 403 && (
        message.toLowerCase().includes('permission to access') ||
        message.toLowerCase().includes('may not exist') ||
        message.toLowerCase().includes('files/') ||
        message.toLowerCase().includes('not found')
      )) {
        throw new Error(`PDF_EXPIRED: Seçtiğiniz PDF belgesinin sunucudaki 48 saatlik süresi dolmuş veya dosya bulunamadı.\n\nDetay: ${message}`);
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error(`API anahtarı geçersiz veya yetkisiz.\n\n[Tanı Bilgisi]:\n- Model: ${model}\n- Anahtar Uzunluğu: ${apiKey ? apiKey.length : 0} karakter\n- İlk/Son Harfler: ${apiKey ? apiKey.substring(0, 6) : ''}...${apiKey ? apiKey.substring(apiKey.length - 4) : ''}\n- Google Sunucu Mesajı: ${message}\n- HTTP Kodu: ${res.status}`);
      }

    } catch (err: any) {
      console.warn(`Model ${model} çağrılırken istisna oluştu:`, err.message);
      lastError = err;
      if (err.message.includes('API anahtarı geçersiz') || err.message.includes('PDF_EXPIRED')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gemini API bağlantı hatası.');
}

// ========================================
// Question Distribution System
// Prevents topic clustering by assigning each question a specific concept
// ========================================

// Static deterministic mapping from UI topic name to KPSS_SYLLABUS keys
const TOPIC_TO_SYLLABUS_MAP: Record<string, string[]> = {
  "İslamiyet Öncesi Türk Tarihi (S. 2-8)": [
    "İslamiyet Öncesi Türk Tarihi",
    "İslamiyet Öncesi Türk Devletleri Kültür ve Medeniyeti"
  ],
  "İlk Türk İslam Devletleri (S. 9-18)": [
    "İlk Türk İslam Devletleri",
    "İlk Türk-İslam Devletleri Kültür ve Medeniyeti",
    "Anadolu Selçuklu ve İlk Beylikler"
  ],
  "Osmanlı Devleti Kültür ve Medeniyeti (S. 23-32)": [
    "Osmanlı Devleti Kültür ve Uygarlığı"
  ],
  "Osmanlı Devleti Kuruluş ve Yükselme Dönemleri (S. 33-38)": [
    "Osmanlı Kuruluş Dönemi",
    "Osmanlı Yükselme Dönemi"
  ],
  "XVII. Yüzyılda Osmanlı Devleti - Duraklama (S. 39-41)": [
    "Osmanlı Duraklama Dönemi"
  ],
  "XVIII. Yüzyılda Osmanlı Devleti - Gerileme (S. 42-43)": [
    "Osmanlı Gerileme Dönemi"
  ],
  "XIX. Yüzyılda Osmanlı Devleti - Dağılma (S. 44-51)": [
    "Osmanlı Dağılma Dönemi"
  ],
  "XX. Yüzyıl Başlarında Osmanlı Devleti (S. 52-61)": [
    "I. Dünya Savaşı ve Mondros Mütarekesi"
  ],
  "Kurtuluş Savaşı Hazırlık Dönemi (S. 62-64)": [
    "Kurtuluş Savaşı Hazırlık Dönemi"
  ],
  "I. TBMM Dönemi (S. 65-67)": [
    "Kurtuluş Savaşı Hazırlık Dönemi"
  ],
  "Kurtuluş Savaşı Muharebeler Dönemi (S. 67-71)": [
    "Kurtuluş Savaşı Muharebeler Dönemi"
  ],
  "Atatürk İlke ve İnkılapları (S. 73-87)": [
    "Atatürk İlke ve İnkılapları"
  ],
  "Atatürk Dönemi Türk Dış Politikası (S. 88-89)": [
    "Atatürk İlke ve İnkılapları"
  ],
  "Cumhuriyet Dönemi Kültür ve Medeniyet (S. 89-91)": [
    "Atatürk İlke ve İnkılapları"
  ],
  "XX. Yüzyılın Başlarında Dünya - Çağdaş (S. 91-100)": [
    "Çağdaş Türk ve Dünya Tarihi"
  ],
  "Soğuk Savaş Dönemi (S. 101-103)": [
    "Çağdaş Türk ve Dünya Tarihi"
  ],
  "Yumuşama Dönemi ve Çatışmalar (S. 104-106)": [
    "Çağdaş Türk ve Dünya Tarihi"
  ],
  "Küreselleşen Dünya (S. 109-114)": [
    "Çağdaş Türk ve Dünya Tarihi"
  ],
  "Küresel Sorunlar (S. 115)": [
    "Çağdaş Türk ve Dünya Tarihi"
  ],
  "Türkiye'nin Coğrafi Konumu (S. 3-13)": [
    "Türkiye'nin İklimi"
  ],
  "Türkiye'nin Yerşekilleri (S. 23-42)": [
    "Türkiye'nin Fiziki Coğrafyası (Yer Şekilleri)",
    "Türkiye'nin Su Kaynakları (Akarsular, Göller)",
    "Harita Bilgisi"
  ],
  "Türkiye'de İklim, Bitki Örtüsü ve Toprak Tipleri (S. 55-70)": [
    "Türkiye'nin İklimi",
    "Türkiye'nin Bitki Örtüsü ve Toprak Yapısı"
  ],
  "Türkiye'de Nüfus ve Yerleşme (S. 85-97)": [
    "Türkiye'de Nüfus ve Yerleşme"
  ],
  "Türkiye'de Tarım ve Hayvancılık (S. 110-122)": [
    "Türkiye'nin Ekonomik Coğrafyası (Tarım)"
  ],
  "Türkiye'de Madencilik ve Enerji Kaynakları (S. 132-141)": [
    "Türkiye'nin Ekonomik Coğrafyası (Sanayi ve Enerji)"
  ],
  "Türkiye'de Sanayi, Ticaret, Ulaşım ve Turizm (S. 151-173)": [
    "Türkiye'nin Ekonomik Coğrafyası (Ulaşım ve Ticaret)"
  ]
};

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_TOPIC_MAP: Record<string, string[]> = {};
for (const [topic, syllabusKeys] of Object.entries(TOPIC_TO_SYLLABUS_MAP)) {
  NORMALIZED_TOPIC_MAP[normalizeKey(topic)] = syllabusKeys;
}

/**
 * Maps a topic name (which may include page numbers like "İslamiyet Öncesi Türk Tarihi (S. 2-8)")
 * to one or more KPSS_SYLLABUS keys.
 */
function findSyllabusKeys(topicName: string): string[] {
  const norm = normalizeKey(topicName);
  if (NORMALIZED_TOPIC_MAP[norm]) {
    return NORMALIZED_TOPIC_MAP[norm];
  }
  
  // Fallback: If not found in the static map, try direct matching with keys in KPSS_SYLLABUS
  const stripped = topicName.replace(/\s*\(S\.\s*[\d\-–,\s]+\)\s*$/, '').trim();
  if (KPSS_SYLLABUS[stripped]) return [stripped];
  
  // Fuzzy fallback:
  const strippedLower = normalizeKey(stripped);
  const keywords = ['kuruluş', 'yükselme', 'duraklama', 'gerileme', 'dağılma', 'kültür ve medeniyet', 'kültür ve uygarlık', 'islamiyet öncesi', 'türk islam'];

  for (const key of Object.keys(KPSS_SYLLABUS)) {
    const keyNorm = normalizeKey(key);
    
    // Check for exact start match
    if (keyNorm.startsWith(strippedLower) || strippedLower.startsWith(keyNorm)) {
      return [key];
    }
    
    // Keyword match
    for (const kw of keywords) {
      if (strippedLower.includes(kw) && keyNorm.includes(kw)) {
        return [key];
      }
    }
  }
  
  return [];
}

/**
 * Extracts individual micro-concepts from a KPSS_SYLLABUS entry string.
 * Splits on commas and periods, filters short/generic fragments, returns unique concepts.
 */
function extractConceptsFromSyllabus(syllabusText: string): string[] {
  // Split on periods first to get major sections, then split subsections on commas
  const rawParts: string[] = [];
  const sentences = syllabusText.split(/\.\s*/);
  for (const sentence of sentences) {
    // Each sentence may contain parenthetical details — keep them as part of the concept
    const parts = sentence.split(/,\s*/);
    for (const part of parts) {
      const trimmed = part.trim().replace(/^[-•]\s*/, '');
      if (trimmed.length >= 8 && trimmed.length <= 120) {
        rawParts.push(trimmed);
      }
    }
  }
  // Deduplicate
  return Array.from(new Set(rawParts));
}

/**
 * Diverse question opening styles to prevent monotonous "Osmanlı Devleti'nde, X. yüzyılda..." patterns.
 */
const QUESTION_ENTRY_STYLES = [
  'Doğrudan soru kökü ile başla',
  'Bir tarihi olayın sonuçlarını sorarak başla',
  'Karşılaştırma formatında sor',
  'Sebep-sonuç ilişkisi ile sor',
  'Bir kavramın tanımını vererek soruya gir',
  'Olumsuz soru kökü kullan',
  'Kronolojik sıralama veya dönem karşılaştırması sor',
  'Bir alıntı veya tarihi ifade ile başla',
  'Doğrudan isim vererek başla',
  'Verilen bilgilerden çıkarım yapma sorusu sor',
  'Sonuçlardan hareketle olayı sordur',
  'Coğrafi veya mekansal bağlam ile başla',
];

/**
 * Generates a deterministic question distribution plan.
 * For topic (syllabus) mode: assigns each question a specific micro-concept from the syllabus.
 * For PDF mode: assigns each question a page range segment.
 * Returns a formatted string to embed in the prompt.
 */
function generateDistributionPlan(
  questionCount: number,
  topics: string[],
  excludeConcepts: string[],
  isPdfMode: boolean,
  pdfPageRange?: string | null
): string {
  const excludeSet = new Set(excludeConcepts.map(c => c.toLowerCase().trim()));

  // Shuffle entry styles so each test gets a different ordering
  const shuffledStyles = [...QUESTION_ENTRY_STYLES];
  let styleSeed = Date.now();
  for (let i = shuffledStyles.length - 1; i > 0; i--) {
    styleSeed = (styleSeed * 48271 + 11) & 0x7fffffff;
    const j = styleSeed % (i + 1);
    [shuffledStyles[i], shuffledStyles[j]] = [shuffledStyles[j], shuffledStyles[i]];
  }

  // Build compact exclusion reminder for the plan
  const exclusionReminder = excludeConcepts.length > 0
    ? `\n\u26d4 DAHA \u00d6NCE SORULAN KAVRAMLAR (bunlar\u0131 tekrar sorma, farkl\u0131 kavramlar se\u00e7):\n${excludeConcepts.slice(0, 15).map(c => `  \u2022 ${c}`).join('\n')}\n`
    : '';

  if (isPdfMode) {
    if (pdfPageRange) {
      // PDF mode with known page range: distribute questions across page segments
      const ranges = pdfPageRange.split(',').map(r => r.trim());
      const allNums: number[] = [];
      for (const range of ranges) {
        const parts = range.split(/[-–]/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        allNums.push(...parts);
      }
      const totalStart = allNums.length > 0 ? Math.min(...allNums) : 1;
      const totalEnd = allNums.length > 0 ? Math.max(...allNums) : 100;
      const actualPageCount = totalEnd - totalStart + 1;
      const isNarrowRange = actualPageCount <= 4;
      const lines: string[] = [];

      if (isNarrowRange) {
        // Narrow range: do not assign specific pages to individual questions.
        // Instead, allow the model to scan the entire narrow range, but focus on distinct micro-concepts.
        for (let i = 0; i < questionCount; i++) {
          const style = shuffledStyles[i % shuffledStyles.length];
          lines.push(`- Soru ${i + 1} → Sayfa aralığı: ${totalStart}-${totalEnd} | Giriş tarzı: "${style}"`);
        }

        return `📋 SORU DAĞILIM PLANI (DAR SAYFA ARALIĞI):
Hedef: Soruları sadece sayfa ${totalStart} ile ${totalEnd} arasından üretmeye odaklan. Bu aralık dışındaki sayfaları kapsam dışı bırak.
Bilgi Yayılımı: Hedef sayfa aralığı dar olduğu için (${actualPageCount} sayfa) soruları sayfalara katı olarak bölmek yerine; ${questionCount} sorunun tamamını bu sayfalar içerisindeki tamamen farklı cümlelerden, farklı paragraflardan, tablolardan veya ayrıntılardan üret. Her soruda tamamen yeni ve benzersiz bir bilgiyi test et.
${lines.join('\n')}
${exclusionReminder}
Plan Takibi: Soruların tamamını sayfa ${totalStart}-${totalEnd} arasından seçmeye özen göster.`;
      } else {
        // Build page-level assignments that CYCLE within the range (never overflow!)
        // If 20 questions / 10 pages → each page gets ~2 questions but from different micro-concepts
        const segments: { start: number; end: number }[] = [];

        if (questionCount <= actualPageCount) {
          // More pages than questions: each question gets a unique segment
          const segmentSize = Math.max(1, Math.floor(actualPageCount / questionCount));
          for (let i = 0; i < questionCount; i++) {
            const segStart = totalStart + (i * segmentSize);
            const segEnd = Math.min(segStart + segmentSize - 1, totalEnd);
            segments.push({ start: segStart, end: segEnd });
          }
        } else {
          // More questions than pages: cycle through pages, multiple questions per page
          for (let i = 0; i < questionCount; i++) {
            const pageOffset = i % actualPageCount;
            const page = totalStart + pageOffset;
            segments.push({ start: page, end: page });
          }
        }

        // Shuffle segments so the model doesn't always start from the same page
        let segSeed = styleSeed;
        for (let i = segments.length - 1; i > 0; i--) {
          segSeed = (segSeed * 48271 + 11) & 0x7fffffff;
          const j = segSeed % (i + 1);
          [segments[i], segments[j]] = [segments[j], segments[i]];
        }

        for (let i = 0; i < segments.length; i++) {
          const style = shuffledStyles[i % shuffledStyles.length];
          const pageLabel = segments[i].start === segments[i].end
            ? `Sayfa: ${segments[i].start}`
            : `Sayfa aralığı: ${segments[i].start}-${segments[i].end}`;
          lines.push(`- Soru ${i + 1} → ${pageLabel} | Giriş tarzı: "${style}"`);
        }

        return `📋 SORU DAĞILIM PLANI (SAYFA ATAMALARI):
Hedef: Soruları sadece sayfa ${totalStart} ile ${totalEnd} arasından üretmeye odaklan. Bu aralık dışındaki sayfaları kapsam dışı bırak.
Sayfa Eşleşmesi: Her soruyu kendisine atanmış olan sayfadaki bilgilerden üret.
${questionCount > actualPageCount ? `Not: Bazı sayfalardan birden fazla soru üretilecektir. Bu durumda her sorunun o sayfadaki tamamen farklı bir mikro kavram/detay hakkında olmasını sağla.` : ''}
${lines.join('\n')}
${exclusionReminder}
Plan Takibi: Soruların tamamını sayfa ${totalStart}-${totalEnd} arasından seçmeye özen göster.`;
      }
    }

    // PDF mode without page range: tell the model to self-distribute across the ENTIRE document
    const lines: string[] = [];
    for (let i = 0; i < questionCount; i++) {
      const style = shuffledStyles[i % shuffledStyles.length];
      lines.push(`- Soru ${i + 1} \u2192 B\u00f6l\u00fcm: ${i + 1}/${questionCount} | Giri\u015f tarz\u0131: "${style}"`);
    }

    return `📋 SORU DAĞILIM PLANI (DOKÜMAN BÖLÜM ATAMALARI):
PDF dokümanını toplam ${questionCount} eşit bölüme ayır ve her soruyu farklı bir bölümden üretmeye odaklan.
Örnek: Doküman 60 sayfa ve ${questionCount} soru isteniyorsa, her ${Math.max(1, Math.floor(60 / questionCount))} sayfadan ortalama 1 soru üret.

${lines.join('\n')}
${exclusionReminder}
Dağılım Rehberi:
- Soruları dokümanın geneline homojen olarak dağıt, tek bir bölüme yığılmaktan kaçın.
- Her sorunun dokümanın farklı bir fiziksel bölgesinden (farklı sayfalardan) gelmesini sağla.
- Dokümanın ikinci yarısından (son yarısından) en az ${Math.ceil(questionCount / 2)} adet soru üretmeye özen göstererek dengeli bir yayılım yakala.`;
  }

  // Topic/Syllabus mode: extract concepts and distribute
  const allConcepts: { concept: string; topic: string }[] = [];

  for (const topicName of topics) {
    const syllabusKeys = findSyllabusKeys(topicName);
    for (const key of syllabusKeys) {
      if (!KPSS_SYLLABUS[key]) continue;

      const concepts = extractConceptsFromSyllabus(KPSS_SYLLABUS[key]);
      for (const concept of concepts) {
        if (!excludeSet.has(concept.toLowerCase().trim())) {
          allConcepts.push({ concept, topic: key });
        }
      }
    }
  }

  if (allConcepts.length === 0) {
    // Fallback: no concepts could be extracted (shouldn't happen but be safe)
    return '';
  }

  // Shuffle the concepts using the same strong seed as styles
  const shuffled = [...allConcepts];
  let conceptSeed = styleSeed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    conceptSeed = (conceptSeed * 48271 + 11) & 0x7fffffff;
    const j = conceptSeed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Select concepts for each question (cycle if not enough unique concepts)
  const selected = [];
  for (let i = 0; i < questionCount; i++) {
    selected.push(shuffled[i % shuffled.length]);
  }

  // Build the distribution plan text
  const lines: string[] = [];
  for (let i = 0; i < selected.length; i++) {
    const style = shuffledStyles[i % shuffledStyles.length];
    lines.push(`- Soru ${i + 1} → Konu: "${selected[i].topic}" | Kavram: "${selected[i].concept}" | Giriş tarzı: "${style}"`);
  }

  return `📋 SORU DAĞILIM PLANI (KAVRAM ATAMALARI):
Her soruyu kendisine atanmış kavramı ölçecek şekilde tasarla. Soruların sıralamasını dilediğin gibi karıştırabilirsin, ancak her sorunun bu listedeki benzersiz kavramları eşleştirmesini sağla.
${lines.join('\n')}
${exclusionReminder}
Plan Takibi: Yukarıdaki her satır bir soruyu temsil eder. Her soruyu kendi kavramı çerçevesinde üret ve her birinde farklı bir giriş tarzı kullan.`;
}

/**
 * Generates a quiz using Gemini API based on selected topics, question count, difficulty, and optional PDF.
 */
export async function generateQuiz(
  topics: string[],
  questionCount: number,
  apiKey: string,
  difficulty: DifficultyLevel = 'medium',
  pdfBase64?: string | null,
  excludeConcepts: string[] = [],
  geminiFileUri?: string | null,
  pdfPageRange?: string | null,
  pdfName?: string | null,
  excludeQuestionTexts: string[] = [],
  focusSubtopics: string[] = []
): Promise<Quiz> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı. Lütfen Ayarlar ekranından API anahtarınızı girin.');
  }

  if (topics.length === 0 && !pdfBase64 && !geminiFileUri) {
    throw new Error('En az bir konu seçmelisiniz veya bir PDF dokümanı yüklemelisiniz.');
  }

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-3.1-flash-lite';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const topicsString = topics.join(', ');
  const difficultyInstruction = DIFFICULTY_PROMPTS[difficulty];

  // Dynamic temperature based on difficulty level
  const difficultyTemperature: Record<DifficultyLevel, number> = {
    easy: 0.4,
    medium: 0.55,
    hard: 0.7,
    extreme: 0.85,
  };
  const temperature = difficultyTemperature[difficulty];

  // Extract syllabus sub-topics details based on selected topics (using fuzzy key matcher)
  let syllabusContext = '';
  topics.forEach((topic) => {
    const keys = findSyllabusKeys(topic);
    keys.forEach((key) => {
      if (KPSS_SYLLABUS[key]) {
        syllabusContext += `- ${key}: ${KPSS_SYLLABUS[key]}\n`;
      }
    });
  });

  // Clean excludeConcepts first to make sure there are no main topic names or generic terms
  const cleanedExclusions = cleanSubtopics(excludeConcepts).slice(0, 80); // Max 80 concepts to avoid prompt bloat

  // Trim question texts to max 40 to avoid overwhelming the model
  const trimmedExcludeTexts = excludeQuestionTexts.slice(0, 40);

  // Generate the forced distribution plan (the core anti-clustering mechanism)
  const isPdfMode = !!(pdfBase64 || geminiFileUri);
  
  let actualPageCount = 100;
  if (isPdfMode && pdfPageRange) {
    const ranges = pdfPageRange.split(',').map(r => r.trim());
    const allNums: number[] = [];
    for (const range of ranges) {
      const parts = range.split(/[-–]/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
      allNums.push(...parts);
    }
    const totalStart = allNums.length > 0 ? Math.min(...allNums) : 1;
    const totalEnd = allNums.length > 0 ? Math.max(...allNums) : 100;
    actualPageCount = totalEnd - totalStart + 1;
  }
  const isNarrowRange = isPdfMode && !!pdfPageRange && actualPageCount <= 4;

  const distributionPlan = generateDistributionPlan(
    questionCount,
    topics,
    cleanedExclusions,
    isPdfMode,
    pdfPageRange
  );

  // Prepare compact deduplication instruction (secondary to distribution plan)
  const excludeInstruction = cleanedExclusions.length > 0
    ? `\n🔴 Daha önce sorulan kavramlar (bu kavramları tekrar SORMA):\n${cleanedExclusions.slice(0, 80).map(c => `- ${c.trim()}`).join('\n')}\n`
    : '';

  const excludeQuestionsInstruction = trimmedExcludeTexts.length > 0
    ? `\n🚫 Son çözülen sorular (benzerlerini üretME):\n${trimmedExcludeTexts.map(q => `- ${q.trim().substring(0, 80)}`).join('\n')}\n`
    : '';

  const varietyAndCoverageMandate = `
ÇEŞİTLİLİK VE DETAYLI MÜFREDAT KAPSAMI KURALI:
1. Ürettiğin ${questionCount} sorunun her biri müfredat detaylarında geçen **tamamen farklı, bağımsız ve benzersiz** bir mikro kavram/alt başlık ile ilgili olmalıdır.
2. Kavram Çeşitliliği: Her sorunun testteki diğer tüm sorulardan bağımsız ve farklı bir kazanımı/kavramı ölçtüğünden emin ol. Aynı konunun farklı yönlerini sormak yerine, konu havuzundaki tamamen farklı alt başlıklara odaklan.
3. Müfredattaki kavramları dengeli, geniş ve adil bir şekilde tarayarak her soru için farklı bir odak seç. Kolaycı davranıp en popüler 2-3 kavramı tekrar edip durmak yerine, kıyıda köşede kalmış, derin ÖSYM tarzı KPSS detaylarına da mutlaka yer ver.
4. Cümle Yapısı Çeşitliliği: Soruların başlangıç ve cümle yapılarını her soruda farklılaştır. Soruları farklı tümce yapılarıyla, farklı kelimelerle ve giriş tarzlarıyla sor. Her sorunun tümce yapısı ve dili birbirinden farklı olmalı, monoton bir ritim oluşturmaktan kaçın.
5. Konu Dağılımı (Shuffle): Benzer konulardan olan soruları testin geneline homojen olarak dağıt. Soruların konularını ve ölçtüğü alanları test içerisinde tamamen karıştır, harmanla ve rastgele dağıt. Kullanıcı art arda benzer temada sorular yerine her soruda farklı bir konuyu teyit etmelidir.
6. Kılavuz Metni Koruma: Dağılım planındaki kurgu yönergelerini sadece sorunun tasarımı için arka planda kullan. Soru metninin kendisini doğrudan doğal ve yalın bir cümle ile başlat.
7. Alıntı ve Paragraf Koruma: Eğer alıntı veya paragraf vererek soruyorsan, sorunun doğru cevabını metnin içerisinde doğrudan kelime kelime geçirmek yerine; metnin sadece bir bağlam veya ipucu vermesini sağla. Sorunun cevabını, bu bağlamdan hareketle bilgi kullanılarak çözülecek şekilde kurgula. İçinde cevabı barındıran basit sorulardan uzak dur.
8. Mikro Kavram Hassasiyeti (Subtopic): Ürettiğin her sorunun JSON çıktısındaki "subtopic" (alt konu) alanını son derece spesifik, benzersiz ve mikro düzeyde bir kavram olarak doldur. Genel kategori veya ders başlıkları yerine, doğrudan o sorunun ölçtüğü spesifik olay, kurum, yer şekli veya kanun maddesinin adını yaz. Bu alan, gelecekteki testlerde bu konunun tekrar sorulmasını engellemek için kullanılacaktır.
9. Giriş ve Referans Metin Uyumu (Mantık Doğruluğu): 
   - Soruyu kurarken referans kelimeler ('Buna göre', 'Yukarıdaki bilgilere göre', 'Bu gelişmelerin sonucunda' vb.) kullanmak istiyorsan, bu ifadeleri yazmadan hemen önce soru metninin ("question_text") en başına o duruma açıklık getiren kısa bir bilgi paragrafı, durum açıklaması veya öncül listesi ekle.
   - Herhangi bir öncül veya paragraf eklemeden doğrudan soru soracaksan, soru cümlesini bağımsız, net ve kendi içinde tam açıklayıcı bir soru köküyle başlat.
10. Öncüllü Sorularda Standart Biçim: Öncüllü (yani I., II., III. gibi Roma rakamlı önermeler içeren) bir soru kurguluyorsan; öncüllerin tüm metnini soru metninin (question_text) en başında yaz. Seçenekler (A, B, C, D, E) ise sadece klasik kombinasyonlardan ("Yalnız I", "I ve II" vb.) oluşmalıdır. Seçeneklerde öncüllerin metinlerini tekrarlamaktan kaçın. Soru metninde öncülleri listelemeyi unutmadan açıkça belirt.
11. Çeldirici ve Seçenek Yazım Kuralları (Yüksek Seçicilik):
    - Seçenek Tutarlılığı: Tüm yanlış seçenekleri (çeldiricileri) sorunun ait olduğu konuyla uyumlu, gerçek KPSS terimleri arasından seç. Uydurma, saçma veya konunun tamamen dışındaki alakasız kavramları seçeneklere koymaktan kaçın.
    - Kendi Bilgi Birikimini Kullan: Çeldiricileri oluştururken sadece verilen müfredat metnine veya dokümana değil, kendi genel bilgi birikimine de güven. Dokümanda yer alan bilgilerle sınırlı kalma. Eğer bir bilgi birden fazla şıkta doğru olabilecek kadar genel ise, doğru cevabı daha spesifik hale getir veya çeldiricileri doküman dışındaki gerçek ama yanlış terimlerden oluştur.
    - Uzunluk ve Gramer Dengesi: Doğru şık, diğer şıklardan benzer uzunlukta ve benzer ifade tarzına sahip olmalıdır ki doğru cevap sırıtmasın.
    - Güçlü Çeldirme Gücü: Şıklardan en az iki tanesini doğru cevaba kavramsal veya kronolojik olarak çok yakın, öğrencilerin en sık karıştırdığı gerçek terimler arasından seçerek çeldirme gücünü yüksek tut.
    - Tek Doğru Cevap Güvencesi: Seçeneklerden sadece ve sadece bir tanesinin kesinlikle doğru cevap olmasını sağla. Diğer 4 seçenek (çeldiriciler), doğru seçeneğe bilgi ve mantık olarak ne kadar yakın görünürse görünsün, soru kökünde sorulan durum açısından kesin olarak yanlış olmalıdır. Çelişkili veya yoruma göre değişebilen muğlak sorular yerine, doğru cevabı bilimsel olarak tartışmasız tek olan sorular tasarla.
12. CEVAP SIZDIRMA VE SPOILER YASAĞI (EN KRİTİK KURAL):
    - Soru metninin ("question_text") veya alıntının hiçbir yerinde, soru kökünün sorduğu doğru cevabın ADINI VEYA İSMİNİ KESİNLİKLE GEÇİRME!
    - ÖRNEK HATA: "Osmanlı Devleti'nde mimari bir yapı tekniği olan Türk Üçgeni hangi devlette gelişmiştir? -> Cevap: Osmanlı". Buradaki "Osmanlı Devleti'nde" kelimesi cevabı sızdırmaktadır! Bunun yerine "Türk-İslam mimarisinde bir yapı tekniği olan Türk Üçgeni hangi devlette gelişmiştir?" şeklinde soruyu genel kurgula.
    - ÖRNEK HATA: "Gök Tanrı tarafından hükümdara yönetme yetkisi verilmesini ifade eden Kut anlayışı aşağıdakilerden hangisidir? -> Cevap: Kut". Soru kökünde sorulan kavramın adı soru metninde asla geçmemelidir!
    - "subtopic" alanına yazdığın terimi soru metninde doğrudan cevap kelimesi olarak kullanma.
13. Geçmiş Soruları Filtreleme: Aşağıda "Daha önce sorulan kavramlar" ve "Son çözülen sorular" başlıkları altında listelenen konu başlıklarının ve soruların dışındaki yeni, farklı ve özgün bilgilere odaklan. Bu listeleri bir tasarım dışı listesi olarak gör ve buradaki kavramları elenmiş say.
`;

  const pdfVarietyAndCoverageMandate = `
ÇEŞİTLİLİK, DOKÜMANIN DERİNLİKLERİNE İNME VE YAYILIM KURALI:
1. Ürettiğin ${questionCount} sorunun her biri PDF dokümanındaki **tamamen farklı ve bağımsız** bölümler, sayfalar, paragraflar ve mikro kavramlar ile ilgili olmalıdır.
${isNarrowRange 
  ? `2. Her sorunun o sayfalardaki tamamen farklı paragraflardan, farklı cümlelerden ve farklı detaylardan üretildiğinden emin ol. Sayfa aralığı çok dar olduğu için (${actualPageCount} sayfa) aynı sayfadan çok sayıda soru üretilecektir; ancak kendi içinde tekrara düşmekten kaçın!`
  : `2. Her soruyu tamamen farklı bir sayfadan, farklı bir paragraftan veya farklı bir mikro kavramdan üretmeye özen göster. Dokümanın geneline yayılarak geniş, zengin ve çeşitli bir bilgi kapsamı sağla.`
}
3. PDF dokümanının ilk sayfalarında veya en belirgin giriş kısımlarında sınırlı kalmak yerine, belgenin ortalarındaki ve sonlarındaki sayfaları da tam olarak analiz edip derin detayları, tablolardaki küçük bilgileri ve dipnotları özellikle tara ve benzersiz sorular üret.
4. Kendi içinde tekrara düşmekten kaçın, her sorunun testteki diğer tüm sorulardan tamamen farklı bir bilgi/beceriyi ölçmesini sağla.
5. Dokümandaki Detayları Dengeli Tarama: Dokümanda yer alan yıldızlara (*), özel işaretlemelere veya vurgulu kısımlara kilitlenmek yerine, belgenin geri kalan tüm düz paragraflarını, tablolarını ve detaylarını da eşit şekilde tarayarak soru üret. Tekrara düşmektense, dokümanın daha önce hiç soru yazılmamış diğer bölümlerine odaklan.
${isNarrowRange 
  ? `6. Dar Aralık Özel Kuralı: Sayfa aralığı çok dar olduğu için (${actualPageCount} sayfa) her sayfadan çok sayıda soru üretilmesi gerekecektir. Bu durumda, her bir sorunun o sayfalardaki tamamen farklı paragraflardan, farklı cümlelerden ve farklı detaylardan üretildiğinden emin ol. Aynı konuyu/soruyu hafifçe değiştirip tekrar sorma almak yerine, her soruyle yeni bir bilgiyi ölç.`
  : `6. Sayfa Dağılımı ve Derin Tarama: Soruları dokümanın sayfalarına dengeli bir şekilde dağıt. Dokümanı sayfa sayısına göre kabaca eşit bölümlere ayır ve her bölümden eşit sayıda soru üretmeye çalış. Tek bir sayfaya veya bölüme yığılma yapmaktan kaçın.`
}
7. DİL VE YAPI ŞABLONU TEKRAR YASAĞI (MONOTONLUK ENGELİ): Soruların başlangıç ve cümle yapılarını sürekli aynı şablonla kurmak yerine; soruları farklı tümce yapılarıyla, farklı kelimelerle ve giriş tarzlarıyla sor. Her sorunun tümce yapısı ve dili birbirinden farklı olmalı, monoton bir ritim oluşturmaktan kaçın.
8. ARD ARDA AYNI KONU YIĞILMA YASAĞI (KONU KARIŞTIRMA / SHUFFLE): Benzer konulardan olan soruları testin geneline homojen olarak dağıt. Soruların konularını ve ölçtüğü alanları test içerisinde tamamen karıştır, harmanla ve rastgele dağıt. Kullanıcı art arda benzer temada sorular yerine her soruda farklı bir konuyu teyit etmelidir.
9. GİRİŞ TARZI / ŞABLON METNİ KAÇAK ENGELİ: Dağılım planındaki kurgu yönergelerini sadece sorunun tasarımı için arka planda kullan. Soru metninin kendisini doğrudan doğal ve yalın bir cümle ile başlat.
10. ALINTI/PARAGRAF BİLGİ KAÇAK YASAĞI (KENDİNDEN CEVAPLI SORU YASAĞI): Eğer alıntı vererek soruyorsan, sorunun doğru cevabını alıntının/paragrafın içerisine yazmak yerine; alıntının sadece bir bağlam veya ipucu vermesini sağla. Sorunun cevayı, bu bağlamdan hareketle bilgi kullanılarak çözülcek şekilde kurgula. İçinde cevabı barındıran basit sorulardan uzak dur.
11. GİRİŞ AND REFERANS METİN UYUMU (MANTIK DOĞRULUĞU): 
    - Soruyu kurarken referans kelimeler ('Buna göre', 'Yukarıdaki bilgilere göre', 'Bu gelişmelerin sonucunda' vb.) kullanmak istiyorsan, bu ifadeleri yazmadan hemen önce soru metninin ("question_text") en başına o duruma açıklık getiren kısa bir bilgi paragrafı, durum açıklaması veya öncül listesi ekle.
    - Herhangi bir öncül veya paragraf eklemeden doğrudan soru soracaksan, soru cümlesini bağımsız, net ve kendi içinde tam açıklayıcı bir soru köküyle başlat.
12. ÖNCÜLLÜ (I, II, III NUMARALI) SORULARDA MUTLAK KURAL: Eğer öncüllü (yani I., II., III. gibi Roma rakamlı önermeler içeren) bir soru kurguluyorsan; öncüllerin tüm metnini soru metninin (question_text) en başında yaz. Seçenekler (A, B, C, D, E) ise sadece klasik kombinasyonlardan ("Yalnız I", "I ve II" vb.) oluşmalıdır. Seçeneklerde öncüllerin metinlerini tekrarlamaktan kaçın. Soru metninde öncülleri listelemeyi unutmadan açıkça belirt.
13. ÇELDİRİCİ VE SEÇENEK YAZIM KURALLARI (YÜKSEK SEÇİCİLİK):
    - Seçenek Tutarlılığı: Tüm yanlış seçenekleri (çeldiricileri) sorunun ait olduğu konuyla uyumlu, gerçek KPSS terimleri arasından seç. Uydurma, saçma veya konunun tamamen dışındaki alakasız kavramları seçeneklere koymaktan kaçın.
    - Kendi Bilgi Birikimini Kullan: Çeldiricileri oluştururken sadece verilen müfredat metnine veya dokümana değil, kendi genel bilgi birikimine de güven. Dokümanda yer alan bilgilerle sınırlı kalma. Eğer bir bilgi birden fazla şıkta doğru olabilecek kadar genel ise, doğru cevabı daha spesifik hale getir veya çeldiricileri doküman dışındaki gerçek ama yanlış terimlerden oluştur.
    - Uzunluk ve Gramer Dengesi: Doğru şık, diğer şıklardan benzer uzunlukta ve benzer ifade tarzına sahip olmalıdır ki doğru cevap sırıtmasın.
    - Güçlü Çeldirme Gücü: Şıklardan en az iki tanesini doğru cevaba kavramsal veya kronolojik olarak çok yakın, öğrencilerin en sık karıştırdığı gerçek terimler arasından seçerek çeldirme gücünü yüksek tut.
    - Tek Doğru Cevap Güvencesi: Seçeneklerden sadece ve sonra bir tanesinin kesinlikle doğru cevap olmasını sağla. Diğer 4 seçenek (çeldiriciler), doğru seçeneğe bilgi ve mantık olarak ne kadar yakın görünürse görünsün, soru kökünde sorulan durum açısından kesin olarak yanlış olmalıdır. Çelişkili veya yoruma göre değişebilen muğlak sorular yerine, doğru cevabı bilimsel olarak tartışmasız tek olan sorular tasarla.
14. CEVAP SIZDIRMA VE SPOILER YASAĞI (EN KRİTİK KURAL):
    - Soru metninin ("question_text") veya alıntının hiçbir yerinde, soru kökünün sorduğu doğru cevabın ADINI VEYA İSMİNİ KESİNLİKLE GEÇİRME!
    - ÖRNEK HATA: "Osmanlı Devleti'nde mimari bir yapı tekniği olan Türk Üçgeni hangi devlette gelişmiştir? -> Cevap: Osmanlı". Buradaki "Osmanlı Devleti'nde" kelimesi cevabı sızdırmaktadır! Bunun yerine "Türk-İslam mimarisinde bir yapı tekniği olan Türk Üçgeni hangi devlette gelişmiştir?" şeklinde soruyu genel kurgula.
    - ÖRNEK HATA: "Gök Tanrı tarafından hükümdara yönetme yetkisi verilmesini ifade eden Kut anlayışı aşağıdakilerden hangisidir? -> Cevap: Kut". Soru kökünde sorulan kavramın adı soru metninde asla geçmemelidir!
    - "subtopic" alanına yazdığın terimi soru metninde doğrudan cevap kelimesi olarak kullanma.
15. Geçmiş Soruları Filtreleme: Aşağıda "Daha önce sorulan kavramlar" ve "Son çözülen sorular" başlıkları altında listelenen konu başlıklarının ve soruların dışındaki yeni, farklı ve özgün bilgilere odaklan. Bu listeleri bir tasarım dışı listesi olarak gör ve buradaki kavramları elenmiş say.
`;

  const explanationLength: Record<DifficultyLevel, string> = {
    easy: '"rational_explanation" (açıklama) kısmını maksimum 1-2 cümle ile son derece kısa ve öz tut, yalnızca cevabın neden doğru olduğunu açıkla.',
    medium: '"rational_explanation" (açıklama) kısmını 2-3 cümle ile öz tut, cevabın neden doğru olduğunu ve yanlış şıkların neden yanlış olduğunu kısaca açıkla.',
    hard: '"rational_explanation" (açıklama) kısmını 3-5 cümle ile detaylı bir şekilde yaz. Doğru cevabın neden doğru olduğunu, yanlış şıkların neden yanlış olduğunu ve konunun KPSS bağlamındaki önemini açıkla.',
    extreme: '"rational_explanation" (açıklama) kısmını 3-5 cümle ile akademik düzeyde detaylı yaz. Doğru cevabın neden doğru olduğunu, her yanlış şıkkın neden yanlış olduğunu, kavramlar arası ince farkları ve ÖSYM tuzaklarını açıkla.'
  };

  const speedConstraints = `
KURALLAR:
1. SUBTOPIC ALANI: "subtopic" alanını çok spesifik, mikro düzeyde bir kavramla doldur. Genel kategori veya ders başlıkları yerine, doğrudan o sorunun ölçtüğü spesifik olay, kurum, yer şekli veya kanun maddesinin adını yaz.
2. BİLGİ ODAKLI SORU ZORUNLULUĞU: Soruların tamamı bilgi odaklı olsun. Her soru net bir şekilde isim, savaş, tarih, rakam, yer, kurum, antlaşma, kanun maddesi veya somut bilgi sorsun. Yorum, analiz, sebep-sonuç çıkarımı, "hangisi söylenebilir?" veya "aşağıdakilerden hangisi çıkarılabilir?" tarzı subjektif ve yoruma açık sorulardan kesinlikle kaçın. Soru formatları:
   - Doğrudan bilgi sorusu formatı (ağırlıklı olarak kullan)
   - Yanlış olanı bulma formatı (en az 2 soru ekle)
   - Öncüllü sorular (en az 2 soru): Öncüllü sorularda en az 3 öncül (I., II., III.) kullan. Öncülleri soru metninin başında yaz, şıklara klasik kombinasyonlar ("Yalnız I", "I ve II" vb.) koy. Öncüller de bilgi ifadeleri olsun, yorum ifadeleri değil.
3. ŞIK DENGESİ: Doğru cevapları A, B, C, D, E harfleri arasında dengeli dağıt (her harf en az 1, en fazla 3 kez doğru olsun). Tüm şıkların uzunluklarını birbirine benzer tut.
4. SORU KARIŞTIRMA: Soruların konularını ve sıralamasını tamamen karıştır. Benzer konulardan olan soruları arka arkaya dizmek yerine aralara dağıt.
5. TEK DOĞRU CEVAP: Her sorunun net ve tek bir doğru cevabı olmasını sağla. Açıklamada neden diğer şıkların yanlış olduğunu belirt.
6. ÇELDİRİCİLER VE KENDİ BİLGİ BİRİKİMİ: Yanlış şıkları (çeldiricileri) oluştururken sadece verilen dokümana veya müfredat metnine değil, kendi genel bilgi birikimine de güven. Dokümanda yer alan bilgilerle sınırlı kalma. Eğer dokümandaki bir bilgi birden fazla şıkta doğru olabilecek kadar genel ise, doğru cevabı daha spesifik hale getir veya çeldiricileri doküman dışındaki gerçek ama yanlış terimlerden oluştur. Bu sayede her seçeneğin kesinlikle farklı ve tek doğru cevabın tartışmasız olmasını sağla.
7. GİRİŞ ÇEŞİTLİLİĞİ: Her sorunun giriş cümlesi farklı olsun. Aynı kalıbı tekrar kullanmaktan kaçın.
8. CEVAP SIZDIRMA YASAĞI: Soru metninde ("question_text"), sorduğun doğru cevabın kendisini kesinlikle geçirme! Soru kökünde sorulan ana terimi/devleti/kavramı soru cümlesinin içinden gizle ve seçeneklere koy.
9. ${explanationLength[difficulty]}
`;

  const extremeMandate = (difficulty === 'extreme')
    ? `\n[!!! UZMAN SEVİYE ÖZEL TALİMATI - ACIMASIZ VE AKADEMİK !!!]:
Bu test UZMAN / AKADEMİK seviyededir. 
1. Genelgeçer veya herkesin ezbere bildiği temel kavramlar, kurumlar veya ünvanlar yerine; dokümanda geçen en kıyıda köşede kalmış, dipnotlarda veya tabloların içinde yer alan, en az bilinen en uç detay bilgileri bul ve sor.
2. Çeldiricileri (şıklar) birbirine aşırı benzer, kavramsal olarak çok yakın ve kafa karıştırıcı yap. Yanlış şıklar da uydurma değil, dokümanın başka yerlerinde geçen gerçek terimler olsun ki çeldirme gücü maksimuma ulaşsın.
3. Soruyu okuyan kişi konuyu bilse dahi, en ince detayı hatırlamakta zorlanacak derecede seçici bir dil ve akademik ciddiyet kullan.
4. DERİN BİLGİ MADENCİLİĞİ: Her soruyu üretmeden önce, atanmış sayfadaki/bölümdeki metni satır satır tarayarak diğer soruların kullanmadığı, gözden kaçabilecek en küçük detayı (bir tablodaki tek bir hücre, bir parantez içi bilgi, bir isim, bir tarih, bir ayırt edici özellik) bul ve soruyu bu detay üzerine kur. Soruyu bu detay üzerine kurarak en az bilinen ve en seçici bilgiyi hedefle.\n`
    : '';

  const pageRangeInstruction = (pdfPageRange && pdfPageRange.trim().length > 0)
    ? `\nKRİTİK SAYFA ARALIĞI SINIRLANDIRMASI (HAYATİ ÖNEMDE):
- PDF belgesinin tamamından değil, YALNIZCA [${pdfPageRange}] sayfaları arasını oku ve analiz et.
- Diğer sayfalara göz atmaktan kaçınarak, sadece ve sadece bu sayfalar arasındaki bilgilerden soru yaz.\n`
    : '';

  const geographyMapInstruction = `
[!!! COĞRAFYA HARİTALI SORU TALİMATI - SON DERECE KRİTİK HARİTA GÖRSEL UYUMU !!!]:
Eğer Coğrafya konuları hakkında soru üretiyorsan, veya PDF adı coğrafya ile ilgili ise, ürettiğin toplam soruların en az %30'unu **Türkiye Haritalı Soru** olarak tasarla.
1. Haritalı sorularda, haritada vurgulanmasını ve işaretlenmesini istediğin illerin plaka kodlarını (1-81 arası tamsayılar) "highlighted_province_ids" alanına SADECE INTEGER (Tamsayı) dizisi olarak ekle. KESİNLİKLE STRING KULLANMA! (Haritasız normal sorularda bu alanı [] bırak veya ekleme).
2. KRİTİK UI KISITLAMASI (DİKKAT!): Uygulamadaki harita motoru, "highlighted_province_ids" içine yazdığın illeri sadece KIRMIZIYA BOYAR. İllerin üzerine numara veya harf yazamaz.
3. BU YÜZDEN ŞU SORU TİPİNDEN KAÇINILMALIDIR: Haritada numaralandırılmış alanları işaret edip şıklara bu numaraları koymak veya şıklara doğrudan plaka sayıları yazmak yerine; soruları doğrudan coğrafi veya fiziki özellikler üzerinden kurgula.
4. DOĞRU HARİTALI SORU TİPLERİ ŞUNLARDIR:
   - TİP 1 (Tek İl İşaretli): Sadece 1 ilin plakasını "highlighted_province_ids" içine ekle. Soru kökünde haritada kırmızı ile gösterilen yörenin coğrafi özelliklerini sor, seçenekleri de buna uygun kurgula.
   - TİP 2 (Çoklu İl İşaretli): Birden fazla ilin plakasını ekle. Soru kökünde işaretlenen tüm illerin ortak coğrafi özelliğini sor, seçenekleri de buna uygun kurgula.
   - Harita kullanmadan öncüllü soru sormak serbesttir, ancak bu öncüller soru metni (question_text) içinde metin olarak yazılmalıdır.
5. "highlighted_province_ids" içine yazdığın iller ile soru kökünde/çözümde kastedilen coğrafi konumlar %100 uyuşmalıdır.
6. Soru veya seçenek metnine plaka sayılarını doğrudan yazmak yerine, sadece doğal il/yöre isimleri kullan.
`;

  const vatandaslikInstruction = `
[!!! VATANDAŞLIK SORUSU TALİMATI - SON DERECE KRİTİK VE SEÇİCİ !!!]:
Eğer Vatandaşlık konusu hakkında soru üretiyorsan, veya PDF adı vatandaşlık ile ilgili ise:
1. Soruları anayasa maddelerine, kanunlara ve güncel hukuki terimlere tam olarak sadık kalarak kurgula.
2. ÖSYM tarzı seçici çeldiriciler kullan: Seçeneklerde birbirine kavramsal olarak çok benzeyen hukuk kurallarını, yaptırım türlerini veya yasama/yürütme organlarının yetkilerini çeldirici olarak kurgula.
3. Sorularda doğrudan kuru bilgi ölçmek yerine, olay örgüsü (vaka) kurgula veya farklı organlar arasındaki denge ve seçim süreçlerini sorarak bilginin analiz edilmesini iste.
4. Öncüllü sorularda hukuk kurallarını ya da devlet organlarının görevlerini listeleyip bunların ait olduğu kurumları veya yetki sahiplerini ayırt ettiren seçici kurgular hazırla.
`;

  const guncelInstruction = `
[!!! GÜNCEL BİLGİLER VE KÜLTÜR SORUSU TALİMATI - SON DERECE ÖNEMLİ !!!]:
Eğer Güncel Bilgiler konusu hakkında soru üretiyorsan, veya PDF adı güncel bilgiler ile ilgili ise:
1. Soruları tamamen güncel verilere (2025/2026 yılları), Türkiye ve dünya gündemine, önemli uluslararası ödüllere, uluslararası kuruluşların güncel yapılarına, Türkiye'nin savunma sanayii ve teknoloji başarılarına odaklayarak hazırla.
2. Tarihi ilkler ve kültürel miras da güncel bilgiler kapsamında sorulabilir.
3. Çeldiricileri çok güçlü tut: Seçeneklere ve çeldiricilere, sorunun konusuyla ilgili olan ancak tarihleri, isimleri, yerleri veya alanları farklı kurgulanmış yanıltıcı ve yakın kavramları ekleyerek çeldirme gücünü artır.
4. Doküman doğruluğu: Sadece dokümanda veya doğrulanmış KPSS müfredatında geçen kesin, net ve doğrulanabilir güncel gerçekleri soruya dönüştür.
5. Konu Çeşitliliği: Her yeni testte farklı ve çeşitli konuları seçmeye özen göster. Ülkelerin dönem başkanlıkları, uluslararası zirveler, ödüller, spor başarıları, ilkler ve farklı coğrafi değerler arasından dengeli bir dağılım yap.
`;

  const premiumNotesInstruction = `
[!!! PREMİUM NOT ÖZELLİKLERİ VE TUZAKLAR - SON DERECE KRİTİK !!!]:
Eğer sana verilen PDF/Markdown dokümanı bir "Premium" ders notu ise (başlığında veya içeriğinde "Premium", "ÖSYM TUZAĞI / UYARI:" gibi ifadeler barındırıyorsa):
1. Dokümanda geçen 'ÖSYM TUZAĞI / UYARI:' veya 'Tuzak / Uyarı' bölümlerinde yer alan kritik bilgileri inceleyerek, çeldiricileri bu uyarılarda belirtilen şaşırtmacalara ve tuzaklara göre kurgula.
2. Bu uyarılarda belirtilen kafa karıştırıcı ve adayların en sık hata yaptığı püf noktalarını doğrudan soru ve çeldirici konusu yap.
`;

  const selectedTopicObjects = topics.map(tName => topicsDb.find(td => td.name === tName)).filter((t): t is Topic => !!t);

  const hasGeography = selectedTopicObjects.some(t => t.category === 'cografya') ||
    (pdfName && (pdfName.toLowerCase().includes('cografya') || pdfName.toLowerCase().includes('coğrafya') || pdfName.toLowerCase().includes('harita') || pdfName.toLowerCase().includes('cog_')));
  
  const hasVatandaslik = selectedTopicObjects.some(t => t.category === 'vatandaslik') ||
    (pdfName && (pdfName.toLowerCase().includes('vatandaslik') || pdfName.toLowerCase().includes('vatandaşlık') || pdfName.toLowerCase().includes('calisma-yapraklari')));
    
  const hasGuncel = selectedTopicObjects.some(t => t.category === 'guncel') ||
    (pdfName && (pdfName.toLowerCase().includes('guncel') || pdfName.toLowerCase().includes('güncel') || pdfName.toLowerCase().includes('guncelbilgiler') || pdfName.toLowerCase().includes('guncel-bilgiler')));

  const subjectBoundaryInstruction = `
[!!! 🔴 KONU VE DERS SINIRI KILAVUZU !!!]:
- Bu testin tüm sorularını YALNIZCA seçilen şu konular [${topicsString}] kapsamından üret.
- Sorularının doğrudan seçilen ünitenin temel kazanımını, konusunu veya terimlerini ölçtüğünden emin ol.
- Seçtiğin konunun dışındaki diğer derslerin veya aynı dersin diğer ünitelerinin alanına giren bağımsız sorular yerine, tamamen seçilen konunun kendi müfredatına ve kavramlarına odaklanarak konu bütünlüğünü koru. Soru hazırladığın ünitenin sınırlarına ve dönemine tam olarak sadık kal.
`;

  let subjectInstructions = '';
  subjectInstructions += subjectBoundaryInstruction;
  if (hasGeography) subjectInstructions += geographyMapInstruction;
  if (hasVatandaslik) subjectInstructions += vatandaslikInstruction;
  if (hasGuncel) subjectInstructions += guncelInstruction;
  if (isPdfMode) subjectInstructions += premiumNotesInstruction;

  const mapInstructionToUse = subjectInstructions;

  const difficultyHeader = (difficulty === 'hard' || difficulty === 'extreme')
    ? `[!!! 🚨 DİKKAT: BU TESTİN ZORLUK DERECESİ: ${difficulty.toUpperCase()} 🚨 !!!]
- Bu testin temel amacı, en seçici adayları bile zorlayacak ve konunun en ince ayrıntılarına hakimiyeti ölçecek düzeyde sorular üretmektir.
- Genel geçer, popüler veya yüzeysel başlıklar yerine; dokümanın veya müfredatın en detaylı satırlarını, dipnotlarını, tablolarını, küçük kanun/yönetmelik maddelerini ve sebep-sonuç ilişkilerini soru konusu yap.
- Seçenekler ve çeldiriciler birbirine son derece yakın, kavramsal veya kronolojik olarak karıştırılmaya müsait gerçek terimlerden oluşmalıdır.

`
    : '';

  const systemPrompt = (pdfBase64 || geminiFileUri)
    ? `${difficultyHeader}Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. ${difficultyInstruction}${speedConstraints}${pdfVarietyAndCoverageMandate}
Sana verilen PDF dokümanını TEK VE MUTLAK KAYNAK olarak kullan. ${pageRangeInstruction}

Lütfen çıktıyı SADECE geçerli bir JSON formatında ver. JSON objelerinin sonuna trailing comma (sondaki virgül) koymaktan kaçın.

KRİTİK DOKÜMANA SADAKAT KURALI (MÜFREDAT VE DIŞ BİLGİ SINIRI):
1. Kendi eğitim verilerindeki veya dış dünyadaki genel KPSS bilgilerini geri planda tutarak, tamamen sana verilen PDF dokümanına bağlı kal.
2. Soracağın her bir sorunun cevabı, şıkları ve tüm detayları BİREBİR ve YALNIZCA sana iletilen PDF dokümanının içinde yazıyor olmalıdır.
3. Yalnızca PDF dokümanında açıkça yazan bilgileri, olayları, coğrafi ayrıntıları veya kanuni maddeleri soruya dönüştür.

${topics.length > 0
      ? `KRİTİK KONU SINIRLANDIRMA KURALI:
- Yalnızca şu seçilen konular hakkında soru üret: [${topicsString}].
- PDF dokümanı içinde geçiyor veya diğer sayfalarda yer alıyor olsa dahi, bu listede yer almayan diğer konuları/üniteleri kapsam dışı bırak ve sadece bu seçilen konularla doğrudan ilgili olan kısımları tarayıp soru yaz.`
      : `KONU SINIRLANDIRMA KURALI:
- Herhangi bir konu kısıtlaması yoktur. PDF dokümanının tamamını tarayarak soruları dengeli bir şekilde üret.`
    }

ÖNEMLİ PDF DERİN DETAY VE BİLGİ MADENCİLİĞİ TALİMATI (SON DERECE KRİTİK):
1. Dokümanın sadece ilk sayfalarıyla veya genel tanımların geçtiği giriş kısımlarıyla sınırlı kalma. Belgenin ortalarındaki, sonlarındaki sayfaları da tam olarak oku ve analiz et.
2. Tablolardaki verileri, dipnotları, kıyıda köşede kalmış çok spesifik detayları, kanun maddelerini, isimleri, tarihleri ve en ince ayrıntıları özellikle tarayarak buralardan uzmanlık seviyesinde sorular üret.
3. Genel geçer veya herkesin bildiği bilgiler yerine, dokümana has olan, derin KPSS/ÖSYM mantığına uygun ve adayları eleyecek nitelikte seçici detaylara odaklan.
${extremeMandate}${mapInstructionToUse}

${distributionPlan}

[BENZERSİZLİK ANAHTARI (SEHPA HAFİZASI): ${Date.now()}_${Math.floor(Math.random() * 1000)}]`
    : `${difficultyHeader}Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. ${difficultyInstruction}${speedConstraints}${varietyAndCoverageMandate}
Lütfen çıktıyı SADECE geçerli bir JSON formatında ver. JSON objelerinin sonuna trailing comma (sondaki virgül) koymaktan kaçın.

MÜFREDAT BİLGİSİ:
Aşağıdaki KPSS müfredatı detaylarını referans al ve YALNIZCA seçilen şu konular [${topicsString}] hakkında soru sor:
${syllabusContext}

[!!! KRİTİK KONU VE DÖNEM SINIRLANDIRMA UYARISI !!!]:
- Soracağın tüm soruları SADECE yukarıdaki "MÜFREDAT BİLGİSİ" alanında listelenmiş ve sana detayları verilen [${topicsString}] konusu/konuları ile sınırla.
- Sadece yukarıda sana sınırları çizilen üniteler hakkında sorular yaz; müfredattaki diğer dönemleri veya üniteleri tamamen kapsam dışı bırak.
- Tüm soruların tamamı sadece seçilen bu konulardan gelmek zorundadır. Farklı dönemlerin veya konuların sorularını araya karıştırmadan konu bütünlüğünü sağla.

${extremeMandate}${mapInstructionToUse}

${distributionPlan}

[BENZERSİZLİK ANAHTARI (SEHPA HAFİZASI): ${Date.now()}_${Math.floor(Math.random() * 1000)}]`;

  const userPrompt = (pdfBase64 || geminiFileUri)
    ? `Sana verilen PDF dokümanını detaylıca analiz et.
${pdfPageRange ? `Sayfa Aralığı Kısıtlaması: Yalnızca [${pdfPageRange}] sayfaları arasını tara.` : ''}
${topics.length > 0
      ? `Seçilen Konular: [${topicsString}] (Sadece bu konularla sınırlı kal!)`
      : 'Konu Kısıtlaması: Yok (Müfredatı tamamen unut ve sadece PDF içeriğini tara)'}

${distributionPlan}

BU TEST İÇİN TALİMATLAR:
1. ${topics.length > 0
      ? `Yalnızca seçilen konularla [${topicsString}] sınırlı kalmak ve PDF içinden bu konuları bulmak üzere`
      : `Sadece ve sadece PDF belgesinin tamamından${pdfPageRange ? ` (özellikle belirtilen [${pdfPageRange}] sayfalarından)` : ''}`} ${questionCount} adet benzersiz KPSS sorusu üret.
2. Dışarıdan veya genel müfredat havuzundan hiçbir ek bilgi ekleme.
3. DAĞILIM PLANINA UYUM: Yukarıdaki soru dağıtım planındaki her satıra sadık kal. Her soru kendisine atanmış sayfa aralığı/kavramdan üretilmelidir.

Her soruda "subtopic" alanı olsun.

${excludeInstruction}
${excludeQuestionsInstruction}`
    : `Seçilen Konular: [${topicsString}]

${distributionPlan}

BU TEST İÇİN TALİMATLAR:
1. Seçilen konulardan ${questionCount} adet benzersiz KPSS sorusu üret.
2. DAĞILIM PLANINA UYUM: Yukarıdaki soru dağıtım planındaki her satıra sadık kal. Her soru kendisine atanmış kavramdan üretilmelidir.

Her soruda "subtopic" alanı olsun.

${excludeInstruction}
${excludeQuestionsInstruction}`;

  const parts: any[] = [];

  // PRIORITIZE GEMINI FILES API CLOUD URI TO PREVENT HUGE BASE64 REST PAYLOADS AND TIMEOUTS
  if (geminiFileUri && geminiFileUri.startsWith('https://generativelanguage.googleapis.com')) {
    parts.push({
      fileData: {
        fileUri: geminiFileUri,
        mimeType: 'application/pdf',
      },
    });
  } else if (pdfBase64) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    });
  } else if (geminiFileUri) {
    parts.push({
      fileData: {
        fileUri: geminiFileUri,
        mimeType: 'application/pdf',
      },
    });
  }

  // PUSH SYSTEM AND USER PROMPTS COMBINED TO ENSURE CRITICAL INSTRUCTIONS ARE ALWAYS PROCESSED
  parts.push({ text: `[SİSTEM TALİMATLARI - EN YÜKSEK ÖNCELİK]:\n${systemPrompt}\n\n[KULLANICI TALEBİ]:\n${userPrompt}` });

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: parts,
      },
    ],
    generationConfig: {
      temperature: temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          test_id: { type: 'STRING' },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'INTEGER' },
                type: { type: 'STRING' },
                question_text: { type: 'STRING' },
                subtopic: {
                  type: 'STRING',
                  description: 'Sorunun ölçtüğü çok spesifik, mikro konu başlığı veya kavram. Genel kategori veya büyük konu adları yazmak yerine, doğrudan mikro kavramı belirt.'
                },
                options: {
                  type: 'OBJECT',
                  properties: {
                    A: { type: 'STRING' },
                    B: { type: 'STRING' },
                    C: { type: 'STRING' },
                    D: { type: 'STRING' },
                    E: { type: 'STRING' },
                  },
                  required: ['A', 'B', 'C', 'D', 'E'],
                },
                correct_answer: { type: 'STRING' },
                rational_explanation: { type: 'STRING' },
                page_number: {
                  type: 'INTEGER',
                  description: 'Sorunun üretildiği PDF belgesindeki sayfa numarası (1-indexed). Harici müfredat sorusu ise 0 yaz.'
                },
                highlighted_province_ids: {
                  type: 'ARRAY',
                  items: { type: 'INTEGER' },
                  description: 'Coğrafya haritalı sorularında vurgulanması/işaretlenmesi istenen illerin plaka kodları (1-81 arası tamsayılar). Haritasız normal sorularda bu alanı tamamen boş bırak veya ekleme.'
                },
              },
              required: ['id', 'type', 'question_text', 'subtopic', 'options', 'correct_answer', 'rational_explanation', 'page_number'],
            },
          },
        },
        required: ['test_id', 'questions'],
      },
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      if (__DEV__) {
        console.log(`[Diagnostic] generateQuiz - Model: ${modelName}, Key length: ${apiKey ? apiKey.length : 0}`);
      }
      response = await fetch(`${geminiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429 && retries < maxRetries) {
        retries++;
        const waitTime = Math.pow(3, retries) * 1000; // 3s, 9s, 27s
        console.log(`429 Too Many Requests. Retrying in ${waitTime / 1000}s... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      break;
    }

    clearTimeout(timeoutId);

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response?.status}`;

      if (response?.status === 400) {
        throw new Error(`Geçersiz istek: ${errorMessage}`);
      } else if (response?.status === 403 && (
        errorMessage.toLowerCase().includes('permission to access') ||
        errorMessage.toLowerCase().includes('may not exist') ||
        errorMessage.toLowerCase().includes('files/') ||
        errorMessage.toLowerCase().includes('not found')
      )) {
        throw new Error(`PDF_EXPIRED: Seçtiğiniz PDF belgesinin sunucudaki 48 saatlik süresi dolmuş veya dosya bulunamadı.\n\nDetay: ${errorMessage}`);
      } else if (response?.status === 401 || response?.status === 403) {
        throw new Error(`API anahtarı geçersiz veya yetkisiz.\n\n[Tanı Bilgisi]:\n- Model: ${modelName}\n- Anahtar Uzunluğu: ${apiKey ? apiKey.length : 0} karakter\n- İlk/Son Harfler: ${apiKey ? apiKey.substring(0, 6) : ''}...${apiKey ? apiKey.substring(apiKey.length - 4) : ''}\n- Google Sunucu Mesajı: ${errorMessage}\n- HTTP Kodu: ${response?.status}`);
      } else if (response?.status === 429) {
        throw new Error('Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.');
      } else if (response?.status && response.status >= 500) {
        throw new Error('Gemini sunucusunda bir hata oluştu. Lütfen tekrar deneyin.');
      } else {
        throw new Error(`API Hatası: ${errorMessage}`);
      }
    }

    const data = await response.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Gemini API boş yanıt döndü. Lütfen tekrar deneyin.');
    }

    let cleanedText = textContent.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    // Sanitize trailing commas which are common in AI JSON outputs and break JSON.parse
    cleanedText = cleanedText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    // Strip everything before the first '{' and after the last '}' to handle garbage text
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    let quiz: Quiz;
    try {
      quiz = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse hatası:', cleanedText.substring(0, 200));
      throw new Error('API yanıtı geçerli bir JSON formatında değil. Lütfen tekrar deneyin.');
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error('API yanıtında sorular bulunamadı. Lütfen tekrar deneyin.');
    }

    // Validate each question - Generate a globally unique timestamp-based ID to prevent collisions in Mistake Resolver (Hata Defteri)
    const uniqueBaseId = Date.now();
    quiz.questions = quiz.questions.map((q: any, index: number) => {
      const question: QuizQuestion = {
        id: uniqueBaseId + index,
        type: q.type || 'Çoktan Seçmeli',
        question_text: q.question_text || '',
        subtopic: q.subtopic || '',
        highlighted_province_ids: q.highlighted_province_ids || undefined,
        options: {
          A: q.options?.A || '',
          B: q.options?.B || '',
          C: q.options?.C || '',
          D: q.options?.D || '',
          E: q.options?.E || '',
        },
        correct_answer: q.correct_answer || 'A',
        rational_explanation: q.rational_explanation || 'Açıklama mevcut değil.',
        page_number: q.page_number !== undefined ? Number(q.page_number) : undefined,
      };

      if (!question.question_text) {
        throw new Error(`Soru ${index + 1} metni boş.`);
      }

      if (!['A', 'B', 'C', 'D', 'E'].includes(question.correct_answer)) {
        console.warn(`[Quiz Validation] Soru ${index + 1}: Geçersiz correct_answer "${question.correct_answer}", "A" olarak düzeltildi.`);
        question.correct_answer = 'A';
      }

      return cleanQuestionPlakas(question);
    });

    if (!quiz.test_id) {
      quiz.test_id = `test_${Date.now()}`;
    }

    return quiz;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
    }

    if (error.message && !error.message.includes('fetch')) {
      throw error;
    }

    throw new Error(error.message || 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
  }
}

/**
 * Uploads a file (PDF) to the Gemini Files API.
 * Returns the permanent Gemini File URI (e.g., "https://generativelanguage.googleapis.com/...").
 */
export async function uploadToGeminiFiles(
  base64: string,
  fileName: string,
  apiKey: string,
  fileUri?: string | null
): Promise<string> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı.');
  }

  const mimeType = 'application/pdf';
  let fileLength: number;
  let uploadBody: any;

  if (Platform.OS !== 'web' && fileUri) {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Yerel dosya bulunamadı.');
    }
    fileLength = fileInfo.size;
  } else {
    const blobRes = await fetch(`data:${mimeType};base64,${base64}`);
    const blob = await blobRes.blob();
    fileLength = blob.size;
    uploadBody = blob;
  }

  // 2. Start resumable upload session
  const initUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  const initRes = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': fileLength.toString(),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: {
        display_name: fileName,
      },
    }),
  });

  if (!initRes.ok) {
    const errorText = await initRes.text();
    throw new Error(`Google Dosya Servisi başlatılamadı (${initRes.status}): ${errorText}`);
  }

  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    throw new Error('Google Dosya Servisi yükleme adresi (x-goog-upload-url) döndürmedi.');
  }

  // 3. Perform the binary upload
  if (Platform.OS !== 'web' && fileUri) {
    const uploadRes = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'POST',
      headers: {
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    if (uploadRes.status < 200 || uploadRes.status >= 300) {
      throw new Error(`Google Dosya Yüklemesi başarısız oldu (${uploadRes.status}): ${uploadRes.body}`);
    }

    const uploadResult = JSON.parse(uploadRes.body);
    const finalFileUri = uploadResult.file?.uri;
    const fileId = uploadResult.file?.name;

    if (!finalFileUri || !fileId) {
      throw new Error('Google Dosya Kayıt Adresi boş döndü.');
    }

    return await pollUploadedFile(fileId, apiKey);
  } else {
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: uploadBody,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Google Dosya Yüklemesi başarısız oldu (${uploadRes.status}): ${errorText}`);
    }

    const uploadResult = await uploadRes.json();
    const finalFileUri = uploadResult.file?.uri;
    const fileId = uploadResult.file?.name;

    if (!finalFileUri || !fileId) {
      throw new Error('Google Dosya Kayıt Adresi boş döndü.');
    }

    return await pollUploadedFile(fileId, apiKey);
  }
}

/**
 * Poll the file status until it is ACTIVE.
 */
async function pollUploadedFile(fileId: string, apiKey: string): Promise<string> {
  let isProcessed = false;
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${fileId}?key=${apiKey}`;
  const maxPolls = 15;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const getRes = await fetch(pollUrl);
      if (getRes.ok) {
        const fileStatus = await getRes.json();
        const state = fileStatus?.state;

        if (state === 'ACTIVE') {
          isProcessed = true;
          break;
        } else if (state === 'FAILED') {
          throw new Error('Google PDF işleme (OCR) hatası: Dosya işlenemedi.');
        }
        console.log(`PDF işleniyor, mevcut durum: ${state} (${i + 1}/${maxPolls})`);
      }
    } catch (pollErr: any) {
      console.warn('PDF durum sorgulama hatası:', pollErr.message);
    }
  }

  if (!isProcessed) {
    throw new Error('PDF belgesi zaman aşımı nedeniyle tam olarak işlenemedi. Lütfen tekrar deneyin.');
  }

  return `https://generativelanguage.googleapis.com/v1beta/${fileId}`;
}

/**
 * Generates a brand new, highly similar question testing the exact same concept/subtopic.
 */
export async function generateSimilarQuestion(
  baseQuestion: QuizQuestion,
  apiKey: string
): Promise<QuizQuestion> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı.');
  }

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-3.1-flash-lite';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const systemPrompt = `Sen KPSS alanında uzman, efsanevi bir soru hazırlayıcısın.
Görevin, sana verilen temel soruyla AYNI mikro kavramı (alt başlığı) ölçen, ancak tamamen farklı bir kurgu, farklı seçenekler ve farklı bir soru köküne sahip yepyeni benzersiz benzer bir soru oluşturmaktır.
Soru, KPSS standartlarında, zor ve seçici olmalıdır. 5 şıklı olmalıdır (A, B, C, D, E).
Cevap seçenekleri ve detaylı çözüm analizi (rational_explanation) mutlaka olmalıdır.

ÇOK KRİTİK GEREKLİLİK (HARİTALI SORULARDA COĞRAFİ UYUMLULUK VE KURAL):
Eğer haritalı soru üretiyorsan, "highlighted_province_ids" dizisine eklediğin plaka kodları (1-81 arası) ile soru kökündeki ve çözümdeki illeri coğrafi olarak uyumlu yap. Plaka kodları ile sorulan illerin birbiriyle uyumlu olmasını sağla.`;

  const userPrompt = `Aşağıdaki temel soruyla AYNI alt konuyu/kavramı ölçen benzer bir soru hazırla:
Alt Başlık: ${baseQuestion.subtopic || 'KPSS Kavramı'}
Temel Soru: ${baseQuestion.question_text}
Doğru Cevabı: ${baseQuestion.correct_answer} - ${baseQuestion.options[baseQuestion.correct_answer as keyof typeof baseQuestion.options] || ''}

Lütfen JSON formatında ve tam olarak şu şemaya uygun bir nesne dön:
{
  "id": 1,
  "type": "multiple-choice",
  "question_text": "Soru metni...",
  "subtopic": "Alt başlık...",
  "options": {
    "A": "Seçenek A",
    "B": "Seçenek B",
    "C": "Seçenek C",
    "D": "Seçenek D",
    "E": "Seçenek E"
  },
  "correct_answer": "Doğru şık harfi (A, B, C, D veya E)",
  "rational_explanation": "Süper detaylı KPSS tarzı akademik çözüm açıklaması...",
  "highlighted_province_ids": [] // Soru coğrafya haritalı ise vurgulanacak plaka kodları listesi (örn: [6, 34]), yoksa boş bırak veya ekleme.
}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.85,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          id: { type: 'INTEGER' },
          type: { type: 'STRING' },
          question_text: { type: 'STRING' },
          subtopic: { type: 'STRING' },
          options: {
            type: 'OBJECT',
            properties: {
              A: { type: 'STRING' },
              B: { type: 'STRING' },
              C: { type: 'STRING' },
              D: { type: 'STRING' },
              E: { type: 'STRING' },
            },
            required: ['A', 'B', 'C', 'D', 'E'],
          },
          correct_answer: { type: 'STRING' },
          rational_explanation: { type: 'STRING' },
          highlighted_province_ids: {
            type: 'ARRAY',
            items: { type: 'INTEGER' },
          },
        },
        required: ['id', 'type', 'question_text', 'subtopic', 'options', 'correct_answer', 'rational_explanation'],
      },
    },
  };

  const resultData = await fetchGeminiWithFallback(
    modelName,
    requestBody,
    apiKey,
    'application/json'
  );

  const textResponse = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Yapay zeka geçerli bir soru döndüremedi.');
  }

  const similarQuestion = JSON.parse(textResponse) as QuizQuestion;
  similarQuestion.id = Date.now();
  return cleanQuestionPlakas(similarQuestion);
}

/**
 * Generates an elegant markdown study summary for a specific historical figure or resource.
 */
export async function generateSmartIndexSummary(
  concept: string,
  category: 'tarih' | 'cografya',
  apiKey: string,
  pdfBase64?: string | null,
  geminiFileUri?: string | null
): Promise<string> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı.');
  }

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-3.1-flash-lite';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const systemPrompt = `Sen KPSS hazırlık alanında efsaneleşmiş, milyonlarca öğrenciye Türkiye derecesi yaptırmış uzman bir KPSS hocasısın.
Görevin, sana verilen kavramla ilgili, KPSS sınavında %100 karşılarına çıkabilecek en kritik, en kıyıda köşede kalmış akademik ve ÖSYM tarzı detayları içeren, son derece pratik ve akılda kalıcı bir çalışma özeti (Cheat Sheet / Ders Notu) hazırlamaktır.
Markdown formatını çok şık ve temiz bir şekilde kullan. Önemli yerleri kalın yaz, tablolar ve maddeler kullanarak görsel ezberi kolaylaştır.

REHBER: Selamlama, giriş, sohbet veya kapanış cümlelerini yazmak yerine doğrudan ve sadece şablonun ilk başlığı (# 👑 ...) ile başlayıp içeriği üret ve son madde bittiğinde çıktıyı sonlandır.`;

  const userPrompt = `Lütfen "${concept}" kavramı ile ilgili, KPSS sınav müfredatına tam uyumlu efsanevi bir hızlı tekrar notu oluştur.
Kategori: ${category === 'tarih' ? 'KPSS Tarih' : 'KPSS Coğrafya'}

Eğer sana yüklediğim PDF notları varsa, öncelikle o PDF'teki bilgileri tara ve süzgeçten geçirerek tüm detayları eksiksiz bir şekilde rapora dahil et.

Markdown başlık yapısı şöyle olsun (Giriş yapmadan direkt bu başlıkla başla):
# 👑 ${concept} - KPSS Akıllı Tekrar Notu
## 📌 En Kritik KPSS Bilgileri (Çıkmış ve Çıkabilecek Sorular)
... (Buraya efsanevi, tablolu ve maddeli KPSS ders notu gelecek)
## 💡 Altın Ezber Tüyoları & Şifreler (Hocanın Notu)
... (Buraya akılda kalıcı şifreler, kodlamalar veya tuzak sorulara karşı uyarılar gelecek)

Notun tamamı Türkçe, son derece akıcı, net, sınav odaklı ve akademik olarak %100 hatasız olmalıdır.`;

  const parts: any[] = [];
  if (geminiFileUri) {
    parts.push({
      fileData: {
        fileUri: geminiFileUri,
        mimeType: 'application/pdf',
      },
    });
  } else if (pdfBase64) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    });
  }

  parts.push({ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` });

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: parts,
      },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    },
  };

  const resultData = await fetchGeminiWithFallback(
    modelName,
    requestBody,
    apiKey
  );

  const textResponse = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Yapay zeka geçerli bir ders notu oluşturamadı.');
  }

  return textResponse;
}

/**
 * Generates a super rich, high-yield KPSS academic explanation sheet for a historical event.
 */
export async function generateTimelineEventDetail(
  eventName: string,
  eventYear: number,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı. Lütfen Ayarlar ekranından API anahtarınızı girin.');
  }

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-3.1-flash-lite';
  const systemPrompt = `Sen son derece deneyimli, Türkiye'nin en iyi KPSS Tarih öğretmenisin.
Görevin, kullanıcının seçtiği tarihi olay hakkında harikulade, nokta atışı ve ÖSYM tarzı zengin bir ders notu/bilgi kartı hazırlamaktır.

REHBER: Selamlama, giriş, sohbet veya kapanış cümlelerini yazmak yerine doğrudan ve sadece aşağıdaki şablonun ilk başlığı (## 📌 ...) ile başlayıp içeriği üret.

Notu hazırlarken şu şablona sadık kal (Markdown formatında, ancak ham *, # gibi işaretleri temiz ve okunaklı paragraflar halinde sunmaya uygun biçimde, göz yormayacak bir düzende yaz):

## 📌 [Olay Adı] ([Yılı]) - Genel Özet ve Gelişimi
... (Olayın nedeni, hangi padişah döneminde olduğu ve gelişimi)

## 🏆 Kritik Sonuçlar ve KPSS Değeri
... (Olayın en önemli siyasi, askeri veya sosyal sonuçları. KPSS'de gelebilecek maddeler)

## 💡 ÖSYM'nin En Sevdiği KPSS Tuzakları & Tüyolar (Hocanın Notu)
... (Sınavda adayları düşürmek için hazırlanan çeldiriciler, kavram karmaşaları, kronolojik önemli detaylar ve kritik KPSS tüyoları)

Notun tamamı Türkçe, son derece akıcı, net, nokta atışı bilgi odaklı ve akademik olarak %100 hatasız olmalıdır.`;

  const userPrompt = `Lütfen "${eventName} (${eventYear})" tarihi olayı için yukarıdaki şablona uygun efsanevi bir KPSS ders notu hazırla.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 2048,
    },
  };

  const resultData = await fetchGeminiWithFallback(
    modelName,
    requestBody,
    apiKey
  );

  const textResponse = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Yapay zeka geçerli bir olay detayı üretemedi.');
  }

  return textResponse;
}

/**
 * Programmatically strips raw bracketed plaka codes (e.g. "[25]", "[25] numaralı il olan")
 * from question texts, options, and explanations to act as an unbreakable programmatic safety net.
 */
export function cleanPlakaFromText(text: string): string {
  if (!text) return '';
  // Clean plural lists like [8, 25, 36] numaralı alanlarda / illerde
  let cleaned = text.replace(/\[\d+(?:\s*,\s*\d+)*\]\s*numaralı\s*(?:il(?:imiz|ler|lerin|leri|lerden)?|alan(?:lar|larda|lardan)?|bölge(?:ler|lerde|lerden)?)/gi, 'işaretli yerler');

  // Clean [8, 25, 36] numaralı
  cleaned = cleaned.replace(/\[\d+(?:\s*,\s*\d+)*\]\s*numaralı/gi, 'işaretli');

  // Clean standalone [8, 25, 36]
  cleaned = cleaned.replace(/\[\d+(?:\s*,\s*\d+)*\]/gi, '');

  // Clean single ones
  cleaned = cleaned.replace(/\[\d+\]\s*numaralı\s*il(?:imiz| olan)?\s*/gi, '');
  cleaned = cleaned.replace(/\[\d+\]\s*numaralı\s*/gi, '');
  cleaned = cleaned.replace(/\s*\(\s*\[\d+\]\s*\)/gi, '');
  cleaned = cleaned.replace(/\[\d+\]/gi, '');
  return cleaned;
}

export function cleanReferencingPhrases(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  if (cleaned.length < 130 && !cleaned.includes('\n')) {
    cleaned = cleaned.replace(/^(?:Yukarıdaki bilgilere göre|Yukarıdaki verilere göre|Yukarıda verilen bilgilere göre|Verilen bilgilere göre|Bu bilgilere göre|Buna göre|Bu gelişmelerin sonucunda|Bu bilgilere dayanarak|Verilen metne göre)\s*,\s*/i, '');
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return cleaned;
}

export function cleanAnswerLeakage(qText: string, correctText: string): string {
  if (!correctText || correctText.trim().length < 3 || !qText) return qText;

  const target = correctText.trim();
  const lowerText = qText.toLowerCase();
  const lowerTarget = target.toLowerCase();

  // If the correct answer text is contained inside the question prompt text
  if (lowerText.includes(lowerTarget)) {
    const questionKeywords = [
      'hangisidir', 'hangi devlette', 'hangi padişah', 'hangi hükümdar', 'hangi savaş',
      'hangi antlaşma', 'hangi il', 'hangi şehir', 'hangi kavram', 'hangi dönemde',
      'hangi kurum', 'hangi yılda', 'hangi kanun', 'hangi olay', 'hangisinde'
    ];

    const hasQuestionKeyword = questionKeywords.some(kw => lowerText.includes(kw));

    if (hasQuestionKeyword) {
      const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let cleaned = qText;

      // Replace target Devleti'nde / Devletinde -> İlgili dönemde
      cleaned = cleaned.replace(new RegExp(`${escapedTarget}\\s+Devlet(?:i'nde|inde|i|i'nin|inin)`, 'gi'), 'İlgili dönemde');
      // Replace target İmparatorluğu'nda -> İlgili dönemde
      cleaned = cleaned.replace(new RegExp(`${escapedTarget}\\s+İmparatorluğu(?:'nda|nda)`, 'gi'), 'İlgili dönemde');
      // Replace quotes like 'Target' or 'Target anlayışı'
      cleaned = cleaned.replace(new RegExp(`['"“‘]${escapedTarget}(?:\\s+anlayışı|\\s+kavramı)?['"”’]`, 'gi'), 'söz konusu kavram');

      // Standalone word replace if still found
      if (cleaned.toLowerCase().includes(lowerTarget)) {
        cleaned = cleaned.replace(new RegExp(`\\b${escapedTarget}\\b`, 'gi'), 'söz konusu unsur');
      }

      if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      return cleaned;
    }
  }

  return qText;
}

export function cleanQuestionPlakas(q: QuizQuestion): QuizQuestion {
  let qText = cleanPlakaFromText(q.question_text);
  qText = cleanReferencingPhrases(qText);

  // Clean answer leakage if correct answer option text is leaked in question_text
  const correctOptionText = q.options && q.correct_answer && q.options[q.correct_answer as keyof typeof q.options];
  if (correctOptionText) {
    qText = cleanAnswerLeakage(qText, correctOptionText);
  }

  return {
    ...q,
    question_text: qText,
    options: {
      A: cleanPlakaFromText(q.options.A),
      B: cleanPlakaFromText(q.options.B),
      C: cleanPlakaFromText(q.options.C),
      D: cleanPlakaFromText(q.options.D),
      E: cleanPlakaFromText(q.options.E),
    },
    rational_explanation: cleanPlakaFromText(q.rational_explanation),
  };
}

/**
 * RAG-like search on the study PDF or syllabus using Gemini.
 * Explains any term or answers any question about the notes or KPSS curriculum.
 */
export async function generateSmartIndexSearch(
  query: string,
  apiKey: string,
  pdfBase64?: string | null,
  geminiFileUri?: string | null
): Promise<string> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı.');
  }

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-3.1-flash-lite';

  const systemPrompt = `Sen KPSS hazırlık alanında efsaneleşmiş, milyonlarca öğrenciye Türkiye derecesi yaptırmış uzman bir KPSS arama motoru ve çalışma koçusun.
Görevin, kullanıcının sorduğu soruya veya aradığı kavrama, öncelikle sana yüklenen PDF ders notlarını tarayarak, ardından akademik ve ÖSYM standartlarındaki bilgilerinle KPSS odaklı mükemmel bir açıklama hazırlamaktır.
Görevi yerine getirirken, bilgiyi doğrudan, gereksiz laf kalabalığı yapmadan yanıtla.
Eğer yanıt yüklenen PDF ders notlarında geçiyorsa, nottaki detayları belirt ve hangi bağlamda/sayfalarda geçtiğini açıkla (örn: "Yüklenen PDF notlarında Sayfa X'te belirtildiği üzere...").
Bilgiyi maddeler halinde, şık bir markdown tasarımıyla sun. Kalın yazım kurallarını (bold) etkin kullan.
"Giriş/Selamlama" ve "Kapanış/Sohbet" cümleleri yazmak yerine doğrudan konu başlığı (# 🔍 ...) ile başla ve son madde bittiğinde çıktıyı sonlandır.`;

  const userPrompt = `Arama Sorgusu / Soru: "${query}"

Lütfen bu sorguyu KPSS müfredatına ve yüklenen PDF notlarına sadık kalarak, aşağıdaki başlık şablonuyla açıkla:

# 🔍 "${query}" - KPSS Arama Sonucu
## 📌 Kavramsal Açıklama & PDF Bağlamı
... (Buraya doğrudan, maddeli ve varsa PDF sayfa referanslı açıklama gelecek)
## 💡 Sınavda Nasıl Sorulur? (ÖSYM Tarzı Çıkabilecek Soru Kalıpları)
... (Buraya bu kavramın KPSS'de ne şekilde sorulabileceğini, muhtemel çeldiricileri ve tuzakları yaz)`;

  const parts: any[] = [];
  if (geminiFileUri) {
    parts.push({
      fileData: {
        fileUri: geminiFileUri,
        mimeType: 'application/pdf',
      },
    });
  } else if (pdfBase64) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    });
  }

  parts.push({ text: userPrompt });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: parts,
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  };

  const resultData = await fetchGeminiWithFallback(
    modelName,
    requestBody,
    apiKey
  );

  const textResponse = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Yapay zeka arama sorgusunu cevaplayamadı.');
  }

  return textResponse;
}
