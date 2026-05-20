// ========================================
// Gemini API Service
// Quiz generation via dynamically selected Gemini Models
// ========================================

import { Quiz, QuizQuestion, DifficultyLevel } from '../types';
import { useSettingsStore, cleanSubtopics } from '../store/useSettingsStore';

const TIMEOUT_MS = 120000; // 120 seconds timeout for processing PDFs and generating 20 questions

const DIFFICULTY_PROMPTS: Record<DifficultyLevel, string> = {
  easy: 'KOLAY seviye: Temel bilgi gerektiren, doğrudan hatırlama ve tanıma düzeyinde sorular sor. Şıklar arasında belirgin farklar olsun.',
  medium: 'ORTA seviye: KPSS sınavına uygun standart zorlukta, analiz ve yorumlama gerektiren sorular sor.',
  hard: 'ZOR seviye: Derinlemesine bilgi, çıkarım ve sentez gerektiren sorular sor. Şıklar birbirine yakın olsun, dikkatli okuma gereksin.',
  extreme: 'UZMAN / AKADEMİK seviye: Son derece detaylı, derin akademik bilgi, karmaşık kavramsal analiz ve çok ince ayrıntı farkı gerektiren, en seçici adayları bile zorlayacak ileri düzey uzmanlık soruları sor. Şıklar birbirine o kadar yakın ve çeldiriciler o kadar profesyonelce hazırlanmış olsun ki, aday konuyu genel hatlarıyla bilse bile soruyu çözemesin, mutlaka dipnot seviyesinde en uç detaya hakim olması gereksin. Doğrudan ezber yerine, kavramlar arası sebep-sonuç ilişkilerini ve ince hukuki/idari/ekonomik ayrıntıları ölç.'
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
  const modelsToTry = [preferredModel, 'gemini-1.5-flash', 'gemini-2.5-flash'];
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
      
      if (res.status === 401 || res.status === 403) {
        throw new Error('API anahtarı geçersiz veya yetkisiz. Lütfen anahtarınızı kontrol edin.');
      }
      
    } catch (err: any) {
      console.warn(`Model ${model} çağrılırken istisna oluştu:`, err.message);
      lastError = err;
      if (err.message.includes('API anahtarı geçersiz')) {
        throw err;
      }
    }
  }
  
  throw lastError || new Error('Gemini API bağlantı hatası.');
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
  pdfUri?: string | null,
  pdfPageRange?: string | null
): Promise<Quiz> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı. Lütfen Ayarlar ekranından API anahtarınızı girin.');
  }

  if (topics.length === 0 && !pdfBase64 && !pdfUri) {
    throw new Error('En az bir konu seçmelisiniz veya bir PDF dokümanı yüklemelisiniz.');
  }

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-2.5-flash';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const topicsString = topics.join(', ');
  const difficultyInstruction = DIFFICULTY_PROMPTS[difficulty];

  // Extract syllabus sub-topics details based on selected topics
  let syllabusContext = '';
  topics.forEach((topic) => {
    if (KPSS_SYLLABUS[topic]) {
      syllabusContext += `- ${topic}: ${KPSS_SYLLABUS[topic]}\n`;
    }
  });

  // Clean excludeConcepts first to make sure there are no main topic names or generic terms
  const cleanedExclusions = cleanSubtopics(excludeConcepts);

  // Prepare deduplication instruction if we have previously asked questions/concepts
  const excludeInstruction = cleanedExclusions.length > 0
    ? `\nÖNEMLİ (KAVRAMSAL TEKRAR ENGELLEME HAFIZASI - SON DERECE KRİTİK):
Aşağıda belirtilen spesifik kavramlar/alt başlıklar hakkında daha önce sorular sorulmuştur. Bu nedenle, BU KAVRAMLARDAN VEYA BUNLARLA YAKINDAN İLGİLİ, EŞ ANLAMLI YA DA AYNI KONU GRUBUNDAKİ ALT DETAYLARDAN KESİNLİKLE TEKRAR SORU ÜRETME!
Eğer yasaklı listede "Uygurlar Maniheizm" varsa, Uygurların dini inançlarıyla ilgili hiçbir şey sorma; onun yerine Uygurların tarım faaliyetleri, matbaası veya göç destanları gibi tamamen farklı alanlarına odaklan.
[KESİNLİKLE YASAKLI / DAHA ÖNCE SORULAN KAVRAMLAR VE ALT BAŞLIKLAR]: ${cleanedExclusions.join(', ')}\n`
    : '';

  const varietyAndCoverageMandate = `
ÇEŞİTLİLİK VE DETAYLI MÜFREDAT KAPSAMI KURALI:
1. Ürettiğin ${questionCount} sorunun her biri müfredat detaylarında geçen **tamamen farklı, bağımsız ve benzersiz** bir mikro kavram/alt başlık ile ilgili olmalıdır.
2. Kesinlikle aynı mikro kavramdan/alt başlıktan birden fazla soru üretme! (Örneğin; 1 soru Kurultay hakkındaysa, diğer sorular ikili teşkilat, kut anlayışı, destanlar veya uygurların kültürel mirası gibi tamamen farklı ve bağımsız diğer kavramlardan olmalıdır.)
3. Müfredat listesindeki kavramları dengeli, geniş ve adil bir şekilde tarayarak her soru için farklı bir odak seç. Kolaycı davranıp en popüler 2-3 kavramı tekrar edip durma. Kıyıda köşede kalmış, derin ÖSYM tarzı KPSS detaylarına da mutlaka yer ver.
`;

  const pdfVarietyAndCoverageMandate = `
ÇEŞİTLİLİK VE DOKÜMAN KAPSAMI KURALI:
1. Ürettiğin ${questionCount} sorunun her biri PDF dokümanındaki **tamamen farklı ve bağımsız** bölümler, sayfalar, paragraflar ve mikro kavramlar ile ilgili olmalıdır.
2. Kesinlikle aynı sayfadan, aynı paragraftan veya aynı mikro kavramdan birden fazla soru üretme! Dokümanın geneline yayılarak geniş, zengin ve çeşitli bir bilgi kapsamı sağla.
3. PDF dokümanının baş kısımlarında sıkışıp kalma; dokümanın orta ve son kısımlarındaki derin detayları, tablolardaki küçük bilgileri, dipnotları ve kritik ayrıntıları da taranarak benzersiz sorular üret.
4. Kendi içinde tekrara düşme, her sorunun testteki diğer tüm sorulardan tamamen farklı bir bilgi/beceriyi ölçmesini sağla.
`;

  const speedConstraints = `
HIZ VE KALİTE TALİMATI:
1. Soru metinlerini ve seçenekleri gereksiz yere uzatma. Net, açık ve doğrudan bir dil kullan.
2. "rational_explanation" (açıklama) kısmını KESİNLİKLE maksimum 1-2 cümle ile son derece kısa ve öz tut, yalnızca cevabın neden doğru olduğunu açıkla. Konu anlatımı yapma.
3. Sorularda her şık benzersiz olsun. Tekrarlayan ifadeler kullanma.
`;

  const extremeMandate = (difficulty === 'extreme')
    ? `\n[!!! UZMAN SEVİYE ÖZEL TALİMATI - ACIMASIZ VE AKADEMİK !!!]:
Bu test UZMAN / AKADEMİK seviyededir. 
1. Genelgeçer saray görevlisi isimleri (Çeşnigir, İbrikdar, Bostancıbaşı gibi bilinen görevliler) veya herkesin ezbere bildiği temel kavramlar/vergiler (Öşür, Haraç, Cizye, İkta, Tımar) yerine; dokümanda geçen en kıyıda köşede kalmış, dipnotlarda veya tabloların içinde yer alan, en az bilinen en uç detay bilgileri (örn: vergi alt türleri, nadir divan defterleri, özel eyalet yönetim detayları, az bilinen kurumlar ve onların mikro görevleri, özel vakıf şartları) bul ve sor.
2. Çeldiricileri (şıklar) birbirine aşırı benzer, kavramsal olarak çok yakın ve kafa karıştırıcı yap. Yanlış şıklar da uydurma değil, dokümanın başka yerlerinde geçen gerçek terimler olsun ki çeldirme gücü maksimuma ulaşsın.
3. Soruyu okuyan kişi konuyu bilse dahi, en ince detayı hatırlamakta zorlanacak derecede seçici bir dil ve akademik ciddiyet kullan.\n`
    : '';

  const pageRangeInstruction = (pdfPageRange && pdfPageRange.trim().length > 0)
    ? `\nKRİTİK SAYFA ARALIĞI SINIRLANDIRMASI (HAYATİ ÖNEMDE):
- PDF belgesinin tamamından değil, YALNIZCA [${pdfPageRange}] sayfaları arasını oku ve analiz et.
- Diğer sayfalara kesinlikle göz atma, soru üretme ve şıklar için buraları tarama. Sadece ve sadece bu sayfalar arasındaki bilgilerden soru yaz.\n`
    : '';

  const geographyMapInstruction = `
[!!! COĞRAFYA HARİTALI SORU TALİMATI - SON DERECE KRİTİK !!!]:
Eğer Coğrafya konuları hakkında soru üretiyorsan, ürettiğin toplam soruların en az %30'unu (örn: 10 soruluk bir testte en az 3 soruyu) **Türkiye Haritalı Soru** olarak tasarla.
1. Haritalı sorularda, haritada vurgulanmasını ve işaretlenmesini istediğin illerin plaka kodlarını (1-81 arası tamsayılar, örn: Rize için [53], Muğla için [48], Konya için [42], İzmir için [35]) "highlighted_province_ids" alanına bir dizi olarak ekle. (Haritasız normal sorularda bu alanı tamamen boş bırak veya ekleme).
2. Soru metninde haritaya açıkça atıfta bulun. Örnek: "Yukarıdaki Türkiye haritasında koyu renkle işaretlenerek gösterilen ilimiz için aşağıdakilerden hangisi söylenemez?" ya da "Haritada işaretlenen bölgelerin ortak coğrafi özelliği aşağıdakilerden hangisidir?" ya da "Haritada numaralandırılarak gösterilen illerden hangisinde..." gibi ifadeler kullan.
3. Vurguladığın illeri soru ve şıklarda tutarlı bir şekilde kullan.
`;

  const systemPrompt = (pdfBase64 || pdfUri)
    ? `Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. ${difficultyInstruction}${speedConstraints}${pdfVarietyAndCoverageMandate}
Sana verilen PDF dokümanını TEK VE MUTLAK KAYNAK olarak kullan. ${pageRangeInstruction}

KRİTİK DOKÜMANA SADAKAT KURALI (MÜFREDAT VE DIŞ BİLGİ YASAĞI):
1. Kendi eğitim verilerindeki veya dış dünyadaki genel KPSS müfredatı bilgilerini KESİNLİKLE KULLANMA!
2. Soracağın her bir sorunun cevabı, şıkları ve tüm detayları BİREBİR ve YALNIZCA sana iletilen PDF dokümanının içinde yazıyor olmalıdır.
3. PDF dokümanında geçmeyen hiçbir tarihi olayı, coğrafi detayı, kanunu veya bilgiyi (müfredatta yer alsa dahi) kesinlikle soruya dönüştürme.

${topics.length > 0 
  ? `KRİTİK KONU SINIRLANDIRMA KURALI:
- Yalnızca şu seçilen konular hakkında soru üret: [${topicsString}].
- PDF dokümanı içinde geçiyor olsa dahi, bu listede yer almayan diğer hiçbir konudan/üniteden kesinlikle soru üretme! Sadece bu konularla ilgili sayfaları ve paragrafları tarayıp soru yaz.`
  : `KONU SINIRLANDIRMA KURALI:
- Herhangi bir konu kısıtlaması yoktur. PDF dokümanının tamamını tarayarak soruları dengeli bir şekilde üret.`
}

ÖNEMLİ PDF DERİN DETAY VE BİLGİ MADENCİLİĞİ TALİMATI (SON DERECE KRİTİK):
1. Dokümanın sadece ilk sayfalarıyla veya genel tanımların geçtiği giriş kısımlarıyla sınırlı kalma. Belgenin ortalarındaki, sonlarındaki sayfaları da tam olarak oku ve analiz et.
2. Tablolardaki verileri, dipnotları, kıyıda köşede kalmış çok spesifik detayları, kanun maddelerini, isimleri, tarihleri ve en ince ayrıntıları özellikle tarayarak buralardan uzmanlık seviyesinde sorular üret.
3. Genel geçer veya herkesin bildiği bilgiler yerine, dokümana has olan, derin KPSS/ÖSYM mantığına uygun ve adayları eleyecek nitelikte seçici detaylara odaklan.
${excludeInstruction}${extremeMandate}${geographyMapInstruction}

[BENZERSİZLİK ANAHTARI (SEHPA HAFİZASI): ${Date.now()}_${Math.floor(Math.random() * 1000)}]`
    : `Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. ${difficultyInstruction}${speedConstraints}${varietyAndCoverageMandate}
MÜFREDAT BİLGİSİ:
Aşağıdaki KPSS müfredatı detaylarını referans al ve YALNIZCA seçilen şu konular [${topicsString}] hakkında soru sor. Diğer konulara kesinlikle girme:
${syllabusContext}
${excludeInstruction}${extremeMandate}${geographyMapInstruction}

[BENZERSİZLİK ANAHTARI (SEHPA HAFİZASI): ${Date.now()}_${Math.floor(Math.random() * 1000)}]`;

  const userPrompt = (pdfBase64 || pdfUri)
    ? `Sana verilen PDF dokümanını detaylıca analiz et.
${pdfPageRange ? `Sayfa Aralığı Kısıtlaması: Yalnızca [${pdfPageRange}] sayfaları arasını tara.` : ''}
${topics.length > 0 
  ? `Seçilen Konular: [${topicsString}] (Sadece bu konularla sınırlı kal!)` 
  : 'Konu Kısıtlaması: Yok (Müfredatı tamamen unut ve sadece PDF içeriğini tara)'}

BU TEST İÇİN SIKILAŞTIRILMIŞ TALİMUTLAR:
1. ${topics.length > 0 
  ? `Yalnızca seçilen konularla [${topicsString}] sınırlı kalmak ve PDF içinden bu konuları bulmak üzere` 
  : `Sadece ve sadece PDF belgesinin tamamından${pdfPageRange ? ` (özellikle belirtilen [${pdfPageRange}] sayfalarından)` : ''}`} ${questionCount} adet benzersiz KPSS sorusu üret.
2. Dışarıdan veya genel müfredat havuzundan hiçbir ek bilgi ekleme.
3. ${pdfVarietyAndCoverageMandate}
4. ${excludeInstruction}

Her soruda "subtopic" alanı olsun.`
    : `Seçilen Konular: [${topicsString}]

BU TEST İÇİN SIKILAŞTIRILMIŞ TALİMUTLAR:
1. Seçilen konulardan ${questionCount} adet benzersiz KPSS sorusu üret.
2. ${varietyAndCoverageMandate}
3. ${excludeInstruction}

Her soruda "subtopic" alanı olsun.`;

  const parts: any[] = [];

  // PRIORITIZE GEMINI FILES API CLOUD URI TO PREVENT HUGE BASE64 REST PAYLOADS AND TIMEOUTS
  if (pdfUri && pdfUri.startsWith('https://generativelanguage.googleapis.com')) {
    parts.push({
      fileData: {
        fileUri: pdfUri,
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
  } else if (pdfUri) {
    parts.push({
      fileData: {
        fileUri: pdfUri,
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
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.85,
      topP: 0.98,
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
                   description: 'Sorunun ölçtüğü çok spesifik, mikro konu başlığı veya kavram (örn: "Uygurlar Maniheizm Etkisi", "Heyelan Set Gölleri", "Kut\'ül Amare", "Sened-i İttifak"). Asla genel/büyük konu adları veya "Tarih", "Coğrafya" gibi genel kategoriler yazma!'
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
                highlighted_province_ids: {
                  type: 'ARRAY',
                  items: { type: 'INTEGER' },
                  description: 'Coğrafya haritalı sorularında vurgulanması/işaretlenmesi istenen illerin plaka kodları (1-81 arası tamsayılar). Haritasız normal sorularda bu alanı tamamen boş bırak veya ekleme.'
                },
              },
              required: ['id', 'type', 'question_text', 'subtopic', 'options', 'correct_answer', 'rational_explanation'],
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
      } else if (response?.status === 401 || response?.status === 403) {
        throw new Error('API anahtarı geçersiz veya yetkisiz. Lütfen anahtarınızı kontrol edin.');
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

    // Parse JSON from response - clean any markdown artifacts
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

    // Validate each question
    quiz.questions = quiz.questions.map((q: any, index: number) => {
      const question: QuizQuestion = {
        id: q.id || index + 1,
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
      };

      if (!question.question_text) {
        throw new Error(`Soru ${index + 1} metni boş.`);
      }

      if (!['A', 'B', 'C', 'D', 'E'].includes(question.correct_answer)) {
        question.correct_answer = 'A';
      }

      return question;
    });

    // Ensure unique IDs
    quiz.questions = quiz.questions.map((q, index) => ({
      ...q,
      id: index + 1,
    }));

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
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı.');
  }

  const mimeType = 'application/pdf';

  // 1. Convert base64 to binary byte array for upload first to get the exact byte size
  let binaryString: string;
  if (typeof atob === 'function') {
    binaryString = atob(base64);
  } else if (typeof Buffer !== 'undefined') {
    binaryString = Buffer.from(base64, 'base64').toString('binary');
  } else {
    throw new Error('Base64 dönüştürücü bulunamadı.');
  }

  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const fileLength = bytes.length;

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
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': fileLength.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Google Dosya Yüklemesi başarısız oldu (${uploadRes.status}): ${errorText}`);
  }

  const uploadResult = await uploadRes.json();
  const fileUri = uploadResult.file?.uri;
  const fileId = uploadResult.file?.name; // e.g. "files/abcdef123"

  if (!fileUri || !fileId) {
    throw new Error('Google Dosya Kayıt Adresi boş döndü.');
  }

  // 4. Poll the file status until it is ACTIVE (or FAILED)
  // This is vital so the Gemini model doesn't hit a 400 or processing error!
  let isProcessed = false;
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${fileId}?key=${apiKey}`;
  const maxPolls = 15;

  for (let i = 0; i < maxPolls; i++) {
    // Wait 1.5 seconds before checking
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

  return fileUri;
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

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-2.5-flash';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const systemPrompt = `Sen KPSS alanında uzman, efsanevi bir soru hazırlayıcısın.
Görevin, sana verilen temel soruyla AYNI mikro kavramı (alt başlığı) ölçen, ancak tamamen farklı bir kurgu, farklı seçenekler ve farklı bir soru köküne sahip yepyeni benzersiz benzer bir soru oluşturmaktır.
Soru, KPSS standartlarında, zor ve seçici olmalıdır. 5 şıklı olmalıdır (A, B, C, D, E).
Cevap seçenekleri ve detaylı çözüm analizi (rational_explanation) mutlaka olmalıdır.`;

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
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
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

  return JSON.parse(textResponse) as QuizQuestion;
}

/**
 * Generates an elegant markdown study summary for a specific historical figure or resource.
 */
export async function generateSmartIndexSummary(
  concept: string,
  category: 'tarih' | 'cografya',
  apiKey: string,
  pdfBase64?: string | null,
  pdfUri?: string | null
): Promise<string> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı.');
  }

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-2.5-flash';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const systemPrompt = `Sen KPSS hazırlık alanında efsaneleşmiş, milyonlarca öğrenciye Türkiye derecesi yaptırmış uzman bir KPSS hocasısın.
Görevin, sana verilen kavramla ilgili, KPSS sınavında %100 karşılarına çıkabilecek en kritik, en kıyıda köşede kalmış akademik ve ÖSYM tarzı detayları içeren, son derece pratik ve akılda kalıcı bir çalışma özeti (Cheat Sheet / Ders Notu) hazırlamaktır.
Markdown formatını çok şık ve temiz bir şekilde kullan. Önemli yerleri kalın yaz, tablolar ve maddeler kullanarak görsel ezberi kolaylaştır.`;

  const userPrompt = `Lütfen "${concept}" kavramı ile ilgili, KPSS sınav müfredatına tam uyumlu efsanevi bir hızlı tekrar notu oluştur.
Kategori: ${category === 'tarih' ? 'KPSS Tarih (Islahatlar, Savaşlar, Teşkilat, Padişah Dönemi vb.)' : 'KPSS Coğrafya (Maden Yatakları, Sanayi Tesisleri, Ulaşım vb.)'}

Eğer sana yüklediğim PDF notları varsa, öncelikle o PDF'teki bilgileri tara ve süzgeçten geçir. PDF'te bu kavramla ilgili yer alan detayları asla atlama.

Markdown başlık yapısı şöyle olsun:
# 👑 ${concept} - KPSS Akıllı Tekrar Notu
## 📌 En Kritik KPSS Bilgileri (Çıkmış ve Çıkabilecek Sorular)
... (Buraya efsanevi, tablolu ve maddeli KPSS ders notu gelecek)
## 💡 Altın Ezber Tüyoları & Şifreler (Hocanın Notu)
... (Buraya akılda kalıcı şifreler, kodlamalar veya tuzak sorulara karşı uyarılar gelecek)

Notun tamamı Türkçe, son derece akıcı, samimi ve akademik olarak %100 hatasız olmalıdır.`;

  const parts: any[] = [];
  if (pdfUri) {
    parts.push({
      fileData: {
        fileUri: pdfUri,
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
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
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

  const modelName = useSettingsStore.getState().geminiModel || 'gemini-2.5-flash';
  const systemPrompt = `Sen son derece deneyimli, Türkiye'nin en iyi KPSS Tarih öğretmenisin.
Görevin, kullanıcının seçtiği tarihi olay hakkında harikulade, nokta atışı ve ÖSYM tarzı zengin bir ders notu/bilgi kartı hazırlamaktır.
Notu hazırlarken şu şablona sadık kal (Markdown formatında, ancak ham *, # gibi işaretleri temiz ve okunaklı paragraflar halinde sunmaya uygun biçimde, göz yormayacak bir düzende yaz):

## 📌 [Olay Adı] ([Yılı]) - Genel Özet ve Gelişimi
... (Olayın nedeni, hangi padişah döneminde olduğu ve gelişimi)

## 🏆 Kritik Sonuçlar ve KPSS Değeri
... (Olayın en önemli siyasi, askeri veya sosyal sonuçları. KPSS'de gelebilecek maddeler)

## 💡 ÖSYM'nin En Sevdiği KPSS Tuzakları & Tüyolar (Hocanın Notu)
... (Sınavda adayları düşürmek için hazırlanan çeldiriciler, kavram karmaşaları, kronolojik önemli detaylar - örneğin I. Kosova'da I. Murat'ın şehit edilmesi gibi kritik KPSS tüyoları)

Notun tamamı Türkçe, son derece akıcı, motive edici ve akademik olarak %100 hatasız olmalıdır.`;

  const userPrompt = `Lütfen "${eventName} (${eventYear})" tarihi olayı için yukarıdaki şablona uygun efsanevi bir KPSS ders notu hazırla.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
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
