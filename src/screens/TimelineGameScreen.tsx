// ========================================
// KPSS Timeline & Chronology Game (Zaman Tüneli) Screen
// Includes interactive Timeline Explorer and a Chronological Sorting Game (Idea 6).
// Features 6 distinct historical eras (Kuruluş, Yükseliş, Duraklama, Gerileme, Dağılma, Cumhuriyet).
// Cards are interactive: tapping them opens an academic KPSS Cheat Sheet detailing the event and ÖSYM tips.
// ========================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateTimelineEventDetail } from '../services/geminiService';
import { ActivityIndicator } from 'react-native';

interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  desc: string;
  emoji: string;
  kpssTip: string; // The academic cheat sheet / trap alert for KPSS
}

interface Era {
  id: string;
  title: string;
  events: TimelineEvent[];
}

const HISTORICAL_ERAS: Era[] = [
  {
    id: 'kurulus',
    title: '👑 Osmanlı Kuruluş Dönemi (1299 - 1453)',
    events: [
      { id: 'k1', year: 1302, title: 'Koyunhisar Savaşı', desc: 'Bizans İmparatorluğu ile yapılan ilk savaş ve zaferdir.', emoji: '⚔️', kpssTip: 'Bizans ile yapılan İLK savaştır. Osman Bey dönemindedir. Osmanlı\'nın bağımsızlık yolundaki ilk büyük askeri tescilidir.' },
      { id: 'k2', year: 1326, title: 'Bursa’nın Fethi', desc: 'Bursa fethedilerek Osmanlı Devleti’nin yeni başkenti yapıldı.', emoji: '🏰', kpssTip: 'Orhan Bey dönemindedir. Kuşatma uzun sürdüğü için askeri teşkilatlanmanın önemi anlaşılmış ve ilk gümüş para (akçe) basılmıştır.' },
      { id: 'k3', year: 1329, title: 'Maltepe (Palekanon) Savaşı', desc: 'Bizans\'ın Anadolu topraklarını kurtarmak için yaptığı son büyük hamle kırıldı.', emoji: '⚔️', kpssTip: 'Orhan Bey dönemindedir. Bizans\'ın Anadolu\'daki direnci tamamen çökmüş, İznik ve İzmit\'in fethine yol açılmıştır.' },
      { id: 'k4', year: 1331, title: 'İznik\'in Fethi & İlk Medrese', desc: 'İznik fethedilerek Osmanlı\'nın ilk yüksek eğitim kurumu olan İznik Orhaniyesi açıldı.', emoji: '🕌', kpssTip: 'İlk Osmanlı medresesidir. İlk müderris olarak ünlü alim Davud-i Kayseri atanmıştır. Eğitime verilen önemi kanıtlar.' },
      { id: 'k5', year: 1345, title: 'Karesioğulları Beyliği\'nin Alınması', desc: 'Balıkesir dolaylarındaki beylik savaşsız bir şekilde Osmanlı topraklarına katıldı.', emoji: '⛵', kpssTip: 'Osmanlı\'ya katılan İLK beyliktir. Anadolu Türk Siyasi Birliğini (ATSB) kurma yolundaki ilk adımdır. Beyliğin donanması sayesinde Osmanlı ilk kez denizcilik faaliyetlerine başlamış ve Rumeli\'ye geçiş kolaylaşmıştır.' },
      { id: 'k6', year: 1353, title: 'Çimpe Kalesi’nin Alınması', desc: 'Bizans\'taki taht kavgalarına yardım karşılığı Çimpe Kalesi Osmanlı\'ya verildi.', emoji: '🏰', kpssTip: 'Osmanlı\'nın Rumeli\'ye geçişteki İLK askeri üssüdür. Orhan Bey döneminde gerçekleşmiştir. Balkan fetihlerinin sıçrama tahtasıdır.' },
      { id: 'k7', year: 1361, title: 'Sazlıdere Savaşı & Edirne\'nin Fethi', desc: 'Bizans ordusu yenilerek Edirne fethedildi ve başkent yapılma süreci başladı.', emoji: '🏰', kpssTip: 'I. Murat dönemindedir. Bizans\'ın Balkanlar ile kara bağlantısı kesilmiş, Edirne stratejik önemi nedeniyle başkent yapılmıştır.' },
      { id: 'k8', year: 1364, title: 'Sırpsındığı Savaşı', desc: 'İlk Osmanlı-Haçlı savaşı ve Haçlıların bozguna uğratılması.', emoji: '⚔️', kpssTip: 'Haçlılarla yapılan İLK savaştır. I. Murat dönemindedir. Savaşın kazanılmasıyla Edirne başkent yapılmış ve Balkan fetihleri hız kazanmıştır.' },
      { id: 'k9', year: 1371, title: 'Çirmen Savaşı', desc: 'Sırp kuvvetleri Meriç nehri kıyısında ağır bir bozguna uğratıldı.', emoji: '🛡️', kpssTip: 'I. Murat dönemindedir. Makedonya kapıları Osmanlı\'ya tamamen açılmış, Sırplar Osmanlı üstünlüğünü kabul etmiştir.' },
      { id: 'k10', year: 1389, title: 'I. Kosova Savaşı', desc: 'Haçlılara karşı kazanılan büyük zafer; Osmanlı ilk kez top kullandı.', emoji: '🛡️', kpssTip: 'I. Murat dönemindedir. İlk kez top (sesinden korkutmak amacıyla) kullanılmıştır. I. Murat savaş alanını gezerken bir Sırplı tarafından şehit edilmiştir (Savaş alanında şehit düşen İLK ve TEK padişahtır).' },
      { id: 'k11', year: 1396, title: 'Niğbolu Savaşı', desc: 'Yıldırım Bayezid\'in büyük Haçlı ordusunu imha ettiği tarihi zafer.', emoji: '🎖️', kpssTip: 'Yıldırım Bayezid\'e bu zafer üzerine Abbasi Halifesi tarafından "Sultan-ı İklim-i Rum" (Anadolu Diyarının Sultanı) unvanı verilmiştir. Bu unvan Osmanlı\'nın İslam dünyasındaki prestijini zirveye taşımıştır.' },
      { id: 'k12', year: 1402, title: 'Ankara Savaşı', desc: 'Yıldırım Bayezid ile Timur arasında yapıldı, Osmanlı yenildi ve Fetret Devri başladı.', emoji: '📉', kpssTip: 'Yıldırım Bayezid esir düşmüştür. Anadolu Türk siyasi birliği bozulmuş, beylikler yeniden kurulmuş ve Osmanlı 11 yıl sürecek "Fetret Devri" krizine girmiştir.' },
      { id: 'k13', year: 1413, title: 'Fetret Devri\'nin Sonu', desc: 'I. Mehmet (Çelebi) kardeşlerini bertaraf ederek tek padişah oldu.', emoji: '👑', kpssTip: 'Osmanlı Devleti\'nin İKİNCİ kurucusu olarak kabul edilir. Dağılma aşamasına gelen devleti tekrar birleştirip merkezi otoriteyi kurmuştur.' },
      { id: 'k14', year: 1416, title: 'Çalı Bey Deniz Savaşı', desc: 'Venedik donanmasıyla Ege denizinde yapılan ilk deniz savaşı.', emoji: '⛵', kpssTip: 'Osmanlı tarihindeki İLK deniz savaşıdır. Osmanlı kaybetmiş olsa da denizlerdeki mücadele gücünün gelişmekte olduğunu göstermiştir.' },
      { id: 'k15', year: 1416, title: 'Şeyh Bedreddin İsyanı', desc: 'Fetret Devri\'nin getirdiği sosyal krizlerden beslenen büyük dini ayaklanma.', emoji: '📢', kpssTip: 'Osmanlı tarihindeki İLK dini ve sosyal nitelikli isyandır. Çelebi Mehmet döneminde bastırılmıştır.' },
      { id: 'k16', year: 1443, title: 'İzladi Derbendi Savaşı', desc: 'Macarlarla yapılan ve Osmanlı mağlubiyetiyle sonuçlanan zorlu savunma savaşı.', emoji: '🛡️', kpssTip: 'Osmanlı\'nın Balkanlar\'da aldığı ilk büyük yenilgilerdendir. Edirne-Segedin Antlaşması\'na zemin hazırlamıştır.' },
      { id: 'k17', year: 1444, title: 'Edirne-Segedin Antlaşması', desc: 'Osmanlı ile Macarlar arasında imzalanan ilk yazılı barış antlaşması.', emoji: '📜', kpssTip: 'Osmanlı\'nın batıda imzaladığı İLK sınırlayıcı antlaşmadır. II. Murat bu antlaşmaya güvenerek tahtı 12 yaşındaki oğlu II. Mehmet\'e (Fatih) bırakmıştır.' },
      { id: 'k18', year: 1444, title: 'Varna Savaşı', desc: 'Tahtı babasına bırakan II. Mehmet\'in çağrısıyla Haçlı ordusunu yok eden II. Murat zaferi.', emoji: '⚔️', kpssTip: 'Haçlıların Edirne-Segedin antlaşmasını bozması üzerine yapılmıştır. II. Murat ordunun başına geçerek Haçlıları imha etmiştir.' },
      { id: 'k19', year: 1448, title: 'II. Kosova Savaşı', desc: 'II. Murat komutasında Haçlıların kesin olarak yenilgiye uğratılması.', emoji: '🛡️', kpssTip: 'Bu zaferle Balkanlar\'ın KESİN olarak Türk yurdu olduğu tescillenmiş ve Haçlılar savunmaya, Osmanlı ise taarruza geçmiştir.' },
    ]
  },
  {
    id: 'yukselis',
    title: '🚀 Osmanlı Yükselme Dönemi (1453 - 1579)',
    events: [
      { id: 'y1', year: 1453, title: 'İstanbul’un Fethi', desc: 'İstanbul fethedildi, Doğu Roma yıkıldı, Orta Çağ kapandı.', emoji: '🏰', kpssTip: 'Fatih Sultan Mehmet dönemidir. Kuruluş devri bitmiş, Yükselme devri başlamıştır. İpek yolu denetimi tamamen Osmanlı\'ya geçmiş, bu durum Avrupalıların Coğrafi Keşifleri başlatmasına neden olmuştur.' },
      { id: 'y2', year: 1459, title: 'Amasra ve Sinop\'un Alınması', desc: 'Cenevizlilerden Amasra, Candaroğullarından Sinop kansız fethedildi.', emoji: '🌊', kpssTip: 'Karadeniz ticaret yollarının güvenliği ve Karadeniz\'i Türk gölü yapma hedefinin ilk büyük adımlarıdır.' },
      { id: 'y3', year: 1461, title: 'Trabzon Rum Devleti\'nin Yıkılması', desc: 'Fatih, Trabzon\'u fethederek Bizans\'ın son kalıntısını da yok etti.', emoji: '🏰', kpssTip: 'Bizans İmparatorluğu\'nu yeniden diriltme hayalleri tamamen sona ermiştir.' },
      { id: 'y4', year: 1473, title: 'Otlukbeli Savaşı', desc: 'Akkoyunlu devleti yenilerek Doğu Anadolu sınır güvenliği sağlandı.', emoji: '⚔️', kpssTip: 'Fatih dönemindedir. Doğu Anadolu sınırlarımız güvence altına alınmış ve Akkoyunlu Devleti yıkılma sürecine girmiştir.' },
      { id: 'y5', year: 1475, title: 'Kırım\'ın Fethi', desc: 'Gedik Ahmet Paşa komutasındaki donanma Kırım\'ı fethederek Cenevizlilerden temizledi.', emoji: '🌊', kpssTip: 'Kırım\'ın alınmasıyla Karadeniz tamamen bir "Türk Gölü" haline gelmiştir. İpek Yolu\'nun kuzey kolu tamamen denetimimize geçmiştir.' },
      { id: 'y6', year: 1481, title: 'Cem Sultan Olayı Başlangıcı', desc: 'Fatih\'in ölümü sonrası oğulları II. Bayezid ile Cem Sultan arasında taht kavgası başladı.', emoji: '📉', kpssTip: 'Osmanlı\'da bir "İç Sorun" iken Cem Sultan\'ın Rodos Şövalyelerine ve Papalığa sığınmasıyla bir "Dış Sorun" haline gelen İLK büyük olaydır. Bayezid devrindeki fetihlerin yavaşlamasına neden olmuştur.' },
      { id: 'y7', year: 1511, title: 'Şahkulu İsyanı', desc: 'Safevi destekli Şii kökenli halk ayaklanması Anadolu\'yu sarstı.', emoji: '📢', kpssTip: 'II. Bayezid döneminin sonlarında çıkan, Safevilerin kışkırttığı dini nitelikli büyük isyandır. Yavuz Sultan Selim\'in tahta çıkış sürecini hızlandırmıştır.' },
      { id: 'y8', year: 1514, title: 'Çaldıran Savaşı', desc: 'Yavuz Sultan Selim’in Safevilere karşı kazandığı tarihi zafer.', emoji: '🛡️', kpssTip: 'Safevi (Şii) tehlikesi uzun bir süre için engellenmiş, Tebriz-Halep ipek yolu hattı kontrol altına alınmıştır.' },
      { id: 'y9', year: 1515, title: 'Turnadağ Savaşı', desc: 'Dulkadiroğulları beyliği yıkılarak Anadolu Türk birliği sağlandı.', emoji: '🤝', kpssTip: 'Yavuz Sultan Selim dönemidir. Anadolu Türk Siyasi Birliği (ATSB) KESİN olarak ve tamamen sağlanmıştır. (İlk adımı atan Karesioğulları, kesinleştiren Dulkadiroğulları\'dır).' },
      { id: 'y10', year: 1516, title: 'Mercidabık Savaşı', desc: 'Yavuz Sultan Selim Suriye\'de Memlük ordusunu bozguna uğrattı.', emoji: '⚔️', kpssTip: 'Memlükler ile yapılan ilk büyük savaştır. Suriye, Lübnan ve Filistin toprakları Osmanlı denetimine girmiştir.' },
      { id: 'y11', year: 1517, title: 'Ridaniye Savaşı ve Mısır Fethi', desc: 'Memlük devleti yıkıldı, Mısır fethedildi ve halifelik Osmanlı\'ya geçti.', emoji: '🕌', kpssTip: 'Yavuz Sultan Selim dönemidir. Halifelik makamı, kutsal emanetler Osmanlı\'ya geçmiş, Baharat Yolu kontrol altına alınmış ve devlet teokratik (dini) niteliğini güçlendirmiştir.' },
      { id: 'y12', year: 1521, title: 'Belgrad\'ın Fethi', desc: 'Kanuni Sultan Süleyman ilk büyük batı seferinde Belgrad\'ı fethetti.', emoji: '🏰', kpssTip: 'Fatih döneminde kuşatılıp alınamayan Belgrad alınmıştır. Avrupa\'ya yapılacak seferler için en önemli askeri üs ele geçirilmiştir.' },
      { id: 'y13', year: 1522, title: 'Rodos\'un Fethi', desc: 'Kanuni Sultan Süleyman, St. Jean şövalyelerinin elindeki Rodos adasını fethetti.', emoji: '🏝️', kpssTip: 'Ege Denizi\'nin güvenliği tamamen sağlanmış, Suriye-Mısır deniz ticaret yolunun emniyeti pekişmiştir.' },
      { id: 'y14', year: 1526, title: 'Mohaç Meydan Muharebesi', desc: 'Macar ordusunun 2 saatte yenildiği dünya tarihinin en kısa meydan zaferi.', emoji: '⚔️', kpssTip: 'Kanuni Sultan Süleyman dönemindedir. Macaristan Osmanlı\'ya bağlanmış ve Orta Avrupa\'da Osmanlı üstünlüğü kesinleşmiştir.' },
      { id: 'y15', year: 1529, title: 'I. Viyana Kuşatması', desc: 'Avusturya başkenti Viyana ilk kez kuşatıldı ancak kış şartları nedeniyle kaldırdı.', emoji: '📉', kpssTip: 'Hazırlıksız gidilmesi, ağır kuşatma toplarının götürülmemesi ve kış mevsiminin yaklaşması nedeniyle fetih gerçekleşmemiştir.' },
      { id: 'y16', year: 1533, title: 'İstanbul (İbrahim Paşa) Antlaşması', desc: 'Avusturya kralı Osmanlı sadrazamına protokolde eşit sayıldı.', emoji: '📜', kpssTip: 'Kanuni dönemindedir. Osmanlı\'nın Avusturya ve Avrupa üzerindeki mutlak siyasi-diplomatik üstünlüğünü tescilleyen tarihi belgedir.' },
      { id: 'y17', year: 1538, title: 'Preveze Deniz Zaferi', desc: 'Haçlı donanmasının yenilmesiyle Akdeniz Türk gölü haline geldi.', emoji: '⛵', kpssTip: 'Barbaros Hayreddin Paşa komutasındaki zaferdir. Akdeniz tamamen bir "Türk Gölü" haline gelmiştir. Bu gün günümüzde "Türk Denizcilik Günü" olarak kutlanır.' },
      { id: 'y18', year: 1555, title: 'Amasya Antlaşması', desc: 'İran (Safeviler) ile imzalanan tarihteki ilk resmi anlaşmadır.', emoji: '📜', kpssTip: 'Kanuni dönemindedir. Safevi devleti ile yapılan İLK resmi anlaşma özelliğini taşır, sınırlar resmiyet kazanmıştır.' },
      { id: 'y19', year: 1571, title: 'İnebahtı Deniz Bozgunu', desc: 'Kıbrıs fethinin intikamı olarak Haçlı donanması Osmanlı donanmasını yaktı.', emoji: '🔥', kpssTip: 'Osmanlı donanmasının tarihte İLK kez yakılmasıdır. Donanmanın yenilmezlik efsanesi batıda sarsılmıştır.' }
    ]
  },
  {
    id: 'duraklama',
    title: '📉 Osmanlı Duraklama Dönemi (1579 - 1699)',
    events: [
      { id: 'd1', year: 1590, title: 'Ferhat Paşa Antlaşması', desc: 'Osmanlı Devleti doğuda en geniş sınırlarına ulaştı.', emoji: '📜', kpssTip: 'Osmanlı\'nın doğuda en geniş sınırlara ulaştığı antlaşmadır. Bu dönemden sonra duraklama emareleri belirginleşmiştir.' },
      { id: 'd2', year: 1596, title: 'Haçova Meydan Muharebesi', desc: 'III. Mehmet komutasında Avusturya ordusunun bozguna uğratılması.', emoji: '⚔️', kpssTip: 'Eğri Fatihi III. Mehmet bizzat sefere çıkmıştır. Osmanlı\'nın gerileme öncesi kazandığı son büyük meydan savaşıdır.' },
      { id: 'd3', year: 1603, title: 'Celali İsyanlarının Zirve Yapması', desc: 'Anadolu\'da köylülerin ağır vergiler ve güvensizlik nedeniyle dağlara çıkıp isyan etmesi.', emoji: '🔥', kpssTip: 'Büyük Kaçgun dönemidir. Anadolu\'da tarımsal üretim çökmüş, asayiş yok olmuş ve şehirlere devasa göçler başlamıştır.' },
      { id: 'd4', year: 1606, title: 'Zitvatorok Antlaşması', desc: 'Avusturya kralı Osmanlı padişahına eşit sayıldı, siyasi üstünlük bitti.', emoji: '📜', kpssTip: 'İstanbul Antlaşması (1533) ile kurulan siyasi/protokol üstünlük sona ermiştir. Avusturya arşidükü sadrazama değil doğrudan Padişaha denk sayılmıştır (Diplomatik mütekabiliyet).' },
      { id: 'd5', year: 1621, title: 'Hotin Seferi', desc: 'Genç Osman\'ın Yeniçeri ocak disiplinsizliğini gördüğü sefer.', emoji: '🛡️', kpssTip: 'II. Osman (Genç Osman) ocağın disiplinsizliğini bizzat görerek Yeniçeri Ocağı\'nı kaldırmaya karar vermiş ancak bu durumu hayatıyla ödemiştir (İlk radikal ıslahatçı padişah).' },
      { id: 'd6', year: 1622, title: 'Genç Osman\'ın Şehit Edilmesi', desc: 'Yeniçeriler isyan ederek padişah II. Osman\'ı Yedikule zindanlarında öldürdü.', emoji: '📉', kpssTip: 'Yeniçeri Ocağı\'nın devlet içerisindeki askeri vesayetinin zirve yaptığı kara gündür. "Ocak devlet içindir" anlayışından "Devlet ocak içindir" anlayışına geçiş tescillenmiştir.' },
      { id: 'd7', year: 1639, title: 'Kasr-ı Şirin Antlaşması', desc: 'Bugünkü Türkiye-İran sınırını büyük ölçüde belirleyen antlaşma.', emoji: '✍️', kpssTip: 'IV. Murat (Bağdat Fatihi) dönemindedir. Bugün hala yürürlükte olan ve en uzun süre değişmeden kalan sınırlarımızdan birini çizmiştir.' },
      { id: 'd8', year: 1645, title: 'Girit Kuşatmasının Başlaması', desc: 'Girit adası Venediklilerden alınmak üzere denizden kuşatıldı.', emoji: '⛵', kpssTip: 'Osmanlı\'nın deniz gücünün ve lojistiğinin zayıfladığını gösteren 24 yıllık tarihi kuşatmanın ilk adımıdır.' },
      { id: 'd9', year: 1656, title: 'Çınar Vakası (Vaka-i Vakvakiye)', desc: 'Yeniçerilerin sarayı basarak 30 devlet adamını çınar ağacına asması.', emoji: '🌲', kpssTip: 'IV. Mehmet dönemindedir. İstanbul isyanlarının en dehşet vericisidir. Sarayın otoritesinin ordunun elinde nasıl oyuncak olduğunu gösterir.' },
      { id: 'd10', year: 1656, title: 'Köprülü Şartlı Sadrazamlığı', desc: 'Köprülü Mehmet Paşa saraya şartlar sunarak sadrazam olmayı kabul etti.', emoji: '🤝', kpssTip: 'Osmanlı tarihinde saraya şartlar sunarak göreve gelen ilk sadrazamdır. Duraklama içinde yükselme dönemi yaşatmıştır.' },
      { id: 'd11', year: 1669, title: 'Girit’in Fethi', desc: '24 yıllık kuşatmadan sonra Venedik\'ten alınan Akdeniz adası.', emoji: '🏝️', kpssTip: 'Fazıl Ahmet Paşa komutasındadır. Fethin 24 yıl sürmesi Osmanlı donanmasının eski gücünü kaybettiğinin en büyük kanıtıdır.' },
      { id: 'd12', year: 1672, title: 'Bucaş Antlaşması', desc: 'Lehistan\'dan Podolya alınarak batıda en geniş sınırlara ulaşıldı.', emoji: '📜', kpssTip: 'Osmanlı\'nın batıda en geniş sınırlara ulaştığı antlaşmadır. Toprak kazanılan son büyük antlaşma olma niteliği taşır.' },
      { id: 'd13', year: 1681, title: 'Bahçesaray (Çehrin) Anlaşması', desc: 'Osmanlı ile Rusya arasında yapılan ilk resmi sınır antlaşmasıdır.', emoji: '📜', kpssTip: 'Rus Çarlığı ile yapılan İLK resmi anlaşmadır. Dinyeper nehri sınır olarak kabul edilmiştir.' },
      { id: 'd14', year: 1683, title: 'II. Viyana Kuşatması', desc: 'Merzifonlu Kara Mustafa Paşa komutasındaki kuşatma başarısız oldu.', emoji: '📉', kpssTip: 'Başarısızlık sonrası Kutsal İttifak kurulmuş, Osmanlı batıdan geriye doğru çekilmeye başlamıştır (Bu geri çekilme Sakarya Meydan Savaşı\'na kadar sürecektir).' },
      { id: 'd15', year: 1687, title: 'IV. Mehmet\'in Askeri Darbeyle İndirilmesi', desc: 'Yeniçeri ve devlet adamlarının baskısıyla Avcı Mehmet tahttan indirildi.', emoji: '👑', kpssTip: 'Viyana bozgununun faturası padişaha kesilmiş ve askeri darbeyle taht değişikliği yaşanmıştır.' }
    ]
  },
  {
    id: 'gerileme',
    title: '🥀 Osmanlı Gerileme Dönemi (1699 - 1792)',
    events: [
      { id: 'g1', year: 1699, title: 'Karlofça Antlaşması', desc: 'Batıda ilk kez devasa miktarda toprak kaybedilen antlaşma.', emoji: '📉', kpssTip: 'Gerileme döneminin başlangıcı kabul edilir. Osmanlı ilk kez büyük çapta toprak kaybetmiş, diplomaside savunma pozisyonuna geçmiştir.' },
      { id: 'g2', year: 1703, title: 'Edirne Vakası', desc: 'Yeniçeri isyanıyla II. Mustafa tahttan indirilip III. Ahmet getirildi.', emoji: '📉', kpssTip: 'Padişahların başkenti Edirne\'ye taşıma dedikodusu üzerine çıkan isyandır. Ordunun yönetim üzerindeki vesayeti pekişmiştir.' },
      { id: 'g3', year: 1711, title: 'Prut Savaşı ve Antlaşması', desc: 'Kaybedilen toprakların geri alınabileceği umudunu doğuran Rusya zaferi.', emoji: '⚔️', kpssTip: 'Karlofça ile kaybedilen yerlerin geri alınabileceği inancı doğmuştur. Sadrazam Baltacı Mehmet Paşa komutasındadır.' },
      { id: 'g4', year: 1718, title: 'Pasarofça Antlaşması', desc: 'Lale Devri\'ni başlatan, batının üstünlüğünün ilk kez kabul edildiği antlaşma.', emoji: '🌷', kpssTip: 'Kaybedilen yerleri geri alma umutları sönmüş, mevcut toprakları koruma politikasına geçilmiştir. Batı tarzı ıslahatların yapıldığı Lale Devri başlamıştır.' },
      { id: 'g5', year: 1727, title: 'İlk Türk Matbaasının Kurulması', desc: 'İbrahim Müteferrika ve Sait Efendi ilk sivil Türk matbaasını açtı.', emoji: '🖨️', kpssTip: 'Lale Devri ıslahatıdır. Batıdan alınan İLK teknik araçtır. Hattatların tepkisini çekmemek için dini kitaplar dışındaki eserler basılmıştır.' },
      { id: 'g6', year: 1730, title: 'Patrona Halil İsyanı', desc: 'Lale Devri\'ni kanlı kapatan ve III. Ahmet\'i tahttan indiren ayaklanma.', emoji: '📉', kpssTip: 'Lale Devri zevk ve sefasına tepki olarak çıkan askeri isyandır. Lale Devri sona ermiş ancak batılılaşma ıslahatları sonraki padişahlarca devam ettirilmiştir.' },
      { id: 'g7', year: 1731, title: 'Hendesehane\'nin Açılması', desc: 'I. Mahmut, batı tarzı askeri mühendislik okulu olan Hendesehane\'yi kurdu.', emoji: '🏛️', kpssTip: 'Batı tarzı askeri ıslahatların öncüsüdür. Fransız asıllı Humbaracı Ahmet Paşa (Comte de Bonneval) tarafından kurulmuştur.' },
      { id: 'g8', year: 1736, title: 'Osmanlı-Rus-Avusturya Savaşları', desc: 'Osmanlı\'nın gerileme devrinde hem Rusyayı hem Avusturyayı yenilgiye uğrattığı savaşlar.', emoji: '⚔️', kpssTip: 'I. Mahmut dönemi askeri ıslahatlarının (Humbaracı Ahmet Paşa) başarısını gösterir. Gerilemenin son başarılı savaş serisidir.' },
      { id: 'g9', year: 1739, title: 'Belgrad Antlaşması', desc: 'Gerileme döneminin en kazançlı antlaşması; Karadeniz son kez Türk gölü sayıldı.', emoji: '✍️', kpssTip: 'Fransa\'nın arabuluculuğu ile imzalanmıştır. Bu arabuluculuk nedeniyle Fransa\'ya verilen kapitülasyonlar 1740\'ta sürekli hale getirilmiştir (KPSS\'nin en çok sorduğu tuzak!).' },
      { id: 'g10', year: 1740, title: 'Kapitülasyonların Sürekliliği', desc: 'Fransa\'ya verilen kapitülasyon imtiyazları padişahın ömrüyle sınırlı olmaktan çıkarıldı.', emoji: '📜', kpssTip: 'I. Mahmut dönemidir. Belgrad arabuluculuğuna rüşvet olarak verilmiştir. Osmanlı ekonomisine vurulan en ağır darbelerden biridir.' },
      { id: 'g11', year: 1746, title: 'Kerden (II. Kasr-ı Şirin) Antlaşması', desc: 'Safeviler ile uzun süren savaşları bitiren barış anlaşması.', emoji: '📜', kpssTip: 'İran ile 1639 Kasr-ı Şirin sınırlarına aynen geri dönülmesini onaylayan dostluk anlaşmasıdır.' },
      { id: 'g12', year: 1770, title: 'Çeşme Baskını ve Donanmanın Yakılması', desc: 'Rus donanması Baltık Denizi\'nden gelerek Çeşme limanında Osmanlı donanmasını yaktı.', emoji: '🔥', kpssTip: 'Osmanlı donanmasının tarihinde İKİNCİ kez yakılmasıdır (İlki İnebahtı, sonrakiler Navarin ve Sinop\'tur).' },
      { id: 'g13', year: 1773, title: 'Mühendishane-i Bahr-i Hümayun', desc: 'Deniz subayı yetiştirmek üzere modern denizcilik akademisi kuruldu.', emoji: '⛵', kpssTip: 'III. Mustafa döneminde donanmanın Çeşme\'de yakılması sonrası acil deniz subayı ihtiyacı üzerine kurulmuştur.' },
      { id: 'g14', year: 1774, title: 'Küçük Kaynarca Antlaşması', desc: 'Kırım bağımsız oldu; halifelik siyasi güç olarak ilk kez kullanıldı.', emoji: '📜', kpssTip: 'Tamamı Türk ve Müslüman olan bir toprak parçası (Kırım) ilk kez elden çıkmıştır. Padişah, Kırım halkıyla dini bağları korumak için HALİFELİK makamını siyasi amaçla ilk kez antlaşma metnine koydurmuştur. İlk kez tazminat ödenmiştir.' },
      { id: 'g15', year: 1789, title: 'Nizam-ı Cedit Dönemi & III. Selim', desc: 'Fransız modeline göre Nizam-ı Cedit ordusu kuruldu ve daimi elçilikler açıldı.', emoji: '💂‍♂️', kpssTip: 'İlk daimi elçilik Londra\'da açılmış ve Yusuf Agah Efendi elçi olarak gönderilmiştir. Bu dönem Kabakçı Mustafa İsyanı ile son bulmuştur.' },
      { id: 'g16', year: 1792, title: 'Yaş Antlaşması', desc: 'Kırım’ın Rusya’ya ait olduğu kabul edildi; Dağılma dönemi başladı.', emoji: '✍️', kpssTip: 'Kırım\'ın Rusya\'ya ilhakı kesinleşmiş, Osmanlı resmi olarak "Dağılma/Yıkılış" sürecine girmiştir.' }
    ]
  },
  {
    id: 'dagilma',
    title: '💔 Osmanlı Dağılma Dönemi (1792 - 1918)',
    events: [
      { id: 'da1', year: 1798, title: 'Napolyon\'un Mısır\'ı İşgali', desc: 'Fransa Mısır\'a saldırdı, Osmanlı ilk kez denge politikası uyguladı.', emoji: '🌍', kpssTip: 'Osmanlı Devleti İngiltere ve Rusya desteğini arkasına alarak İLK kez "Denge Politikası" uygulamıştır. III. Selim\'in Nizam-ı Cedit ordusu Akka\'da Napolyon\'u yenmiştir (Cezzar Ahmet Paşa).' },
      { id: 'da2', year: 1804, title: 'Sırp İsyanı Başlangıcı', desc: 'Milliyetçilik akımının etkisiyle Osmanlı\'ya karşı ayaklanan ilk topluluk Sırplar oldu.', emoji: '🔥', kpssTip: 'Milliyetçilik etkisiyle isyan eden İLK azınlıktır (Kara Yorgi önderliğinde). İlk imtiyazı Bükreş\'te almışlardır.' },
      { id: 'da3', year: 1808, title: 'Sened-i İttifak', desc: 'II. Mahmut ile Ayanlar arasında imzalanan yetki kısıtlama belgesi.', emoji: '📜', kpssTip: 'Padişahın yetkilerini kendi isteğiyle sınırlandırdığı İLK belgedir. Magna Carta\'ya benzetilir. Batı etkisi yoktur, tamamen iç dinamiklerle (Ayanlar) gerçekleşmiştir.' },
      { id: 'da4', year: 1826, title: 'Vaka-i Hayriye (Yeniçeri Ocağının Kaldırılması)', desc: 'II. Mahmut halkın ve ulemanın desteğiyle Yeniçeri Ocağı\'nı kanlı bir şekilde ilga etti.', emoji: '🌲', kpssTip: 'Islahatların önündeki en büyük askeri engel kaldırılmıştır. Yerine "Asakir-i Mansure-i Muhammediye" ordusu kurulmuştur.' },
      { id: 'da5', year: 1829, title: 'Edirne Antlaşması', desc: 'Yunanistan\'ın bağımsızlığını ilan etmesiyle sonuçlanan antlaşma.', emoji: '📜', kpssTip: 'Osmanlı Devleti\'nden bağımsızlık kazanan İLK azınlık Rumlar (Yunanistan) olmuştur. Milliyetçiliğin yıkıcı etkisidir.' },
      { id: 'da6', year: 1833, title: 'Hünkar İskelesi Antlaşması', desc: 'Mısır krizine karşı Rusya ile imzalanan savunma antlaşması.', emoji: '📜', kpssTip: 'Osmanlı Boğazlar üzerindeki mutlak egemenlik yetkisini tek başına son kez kullanmıştır. Bu antlaşma ile "Boğazlar Sorunu" uluslararası düzeyde başlamıştır.' },
      { id: 'da7', year: 1839, title: 'Tanzimat Fermanı', desc: 'Kanun üstünlüğünü ve tüm vatandaşların eşitliğini ilan eden ferman.', emoji: '📜', kpssTip: 'Mustafa Reşit Paşa tarafından okunmuştur. Padişah ilk kez "Kanun Gücünün" üstünlüğünü kabul etmiştir. Anayasal düzene geçişin İLK adımıdır. Milliyetçilik isyanlarını önleme amacı taşır.' },
      { id: 'da8', year: 1841, title: 'Londra Boğazlar Sözleşmesi', desc: 'Boğazlar ilk kez uluslararası ortak bir statüye kavuştu.', emoji: '🌊', kpssTip: 'Boğazlar Osmanlı\'nın tek taraflı kontrolünden çıkıp uluslararası denetime açılmıştır.' },
      { id: 'da9', year: 1853, title: 'Kırım Savaşı & İlk Dış Borç', desc: 'Rusya\'ya karşı İngiltere ve Fransa desteğiyle yapılan savaş sırasında ilk kez dış borç alındı.', emoji: '💸', kpssTip: 'Osmanlı tarihindeki İLK dış borcunu Kırım Savaşı sırasında Abdülmecit döneminde İngiltere\'den almıştır. Mali çöküşün ilk resmi adımıdır.' },
      { id: 'da10', year: 1856, title: 'Islahat Fermanı', desc: 'Paris Kongresi öncesi azınlıklara geniş haklar veren ferman.', emoji: '📜', kpssTip: 'Tamamen gayrimüslim tebaaya haklar tanımaya yöneliktir. Avrupalı devletlerin iç işlerimize karışmasını önlemek amacıyla Paris Antlaşması metnine eklenmiştir.' },
      { id: 'da11', year: 1876, title: 'I. Meşrutiyet & Kanun-i Esasi', desc: 'İlk anayasanın ilanı ve meclisli monarşiye geçiş dönemi.', emoji: '🏛️', kpssTip: 'Türk tarihinin İLK yazılı anayasası (Kanun-i Esasi) ilan edilmiş, halk ilk kez padişahın yanında yönetime ortak olmuştur (Rejim değişikliği).' },
      { id: 'da12', year: 1878, title: 'Berlin Antlaşması', desc: 'Sırbistan, Romanya ve Karadağ bağımsız oldu; Ermeni sorunu doğdu.', emoji: '📜', kpssTip: 'Büyük toprak kaybıdır. Ermeni meselesi uluslararası bir antlaşma metnine (61. madde) İLK kez girerek dünya diplomasisinin konusu olmuştur.' },
      { id: 'da13', year: 1881, title: 'Muharrem Kararnamesi & Düyun-ı Umumiye', desc: 'Osmanlı iflasını ilan etti ve borç tahsili için Düyun-ı Umumiye kuruldu.', emoji: '💸', kpssTip: 'Devletin gelir kaynaklarına doğrudan el konulmuştur. Osmanlı\'nın ekonomik bağımsızlığı tamamen ortadan kalkmıştır.' },
      { id: 'da14', year: 1908, title: 'II. Meşrutiyet\'in İlanı', desc: 'İttihat ve Terakki baskısı sonucu anayasanın tekrar yürürlüğe girmesi.', emoji: '🏛️', kpssTip: 'Reval Görüşmeleri sonrası Jön Türkler ve İttihatçı subayların isyanıyla ilan edilmiştir. Çok partili hayata geçişin önünü açmıştır.' },
      { id: 'da15', year: 1909, title: '31 Mart Vakası', desc: 'Meşrutiyet rejimini yıkmaya yönelik gerici ayaklanma bastırıldı.', emoji: '🚨', kpssTip: 'Osmanlı tarihinde mevcut REJİME karşı çıkan İLK isyandır. Kurmay başkanlığını Mustafa Kemal\'in yaptığı Hareket Ordusu tarafından bastırılmıştır.' },
      { id: 'da16', year: 1911, title: 'Trablusgarp Savaşı', desc: 'İtalya\'nın sömürge arayışı sonucu saldırdığı Trablusgarp savunuldu.', emoji: '⚔️', kpssTip: 'Mustafa Kemal\'in İLK askeri başarısıdır. Derne ve Tobruk\'ta yerel halkı örgütlemiştir. Osmanlı Kuzey Afrika\'daki son toprağını kaybetmiştir.' },
      { id: 'da17', year: 1912, title: 'Balkan Savaşları', desc: 'Balkan devletlerinin birleşerek Osmanlı\'yı topraklarından atma savaşı.', emoji: '⚔️', kpssTip: 'Edirne dahil batı toprakları kaybedilmiş, büyük bir Türk göçmen dalgası Anadolu\'ya sığınmıştır. Türkçülük akımı güçlenmiştir.' },
      { id: 'da18', year: 1914, title: 'I. Dünya Savaşı\'na Giriş', desc: 'Osmanlı İmparatorluğu küresel savaşa ittifak bloklarında katıldı.', emoji: '🌍', kpssTip: 'Goben ve Breslau (Yavuz ve Midilli) gemilerinin Rus limanlarını bombalamasıyla savaşa girilmiştir. Padişah son kez Cihad ilan etmiştir.' },
      { id: 'da19', year: 1918, title: 'Mondros Ateşkes Antlaşması', desc: 'Anadolu topraklarını işgallere açan teslimiyet belgesi.', emoji: '📉', kpssTip: 'Osmanlı Devleti\'ni FİİLEN bitiren anlaşmadır. Özellikle 7. madde (güvenliği tehdit eden herhangi bir stratejik noktayı işgal hakkı) işgallerin hukuki kılıfı olmuştur.' }
    ]
  },
  {
    id: 'cumhuriyet',
    title: '⭐️ Cumhuriyet & Milli Mücadele (1918 - 1938+)',
    events: [
      { id: 'm1', year: 1919, title: 'Samsun\'a Çıkış (19 Mayıs)', desc: 'Mustafa Kemal Paşa Milli Mücadele meşalesini yakmak üzere Samsun\'a ayak bastı.', emoji: '🚢', kpssTip: 'Milli Mücadele\'nin fiili ve resmi başlangıç tarihi kabul edilir. Mustafa Kemal, 9. Ordu Müfettişi sıfatıyla bölgeye gönderilmiştir.' },
      { id: 'm2', year: 1919, title: 'Samsun Raporu (22 Mayıs)', desc: 'Mustafa Kemal\'in Samsun\'a çıktıktan sonra Harbiye Nezareti\'ne gönderdiği resmi rapor.', emoji: '📝', kpssTip: 'Milli Mücadele\'nin İLK resmi yazılı belgesidir. Rumların iddialarının asılsız olduğunu, Türklerin haklı davasını ve İzmir\'in işgalinin kabul edilemez olduğunu İstanbul\'a bildiren tarihi rapordur.' },
      { id: 'm3', year: 1919, title: 'Havza Genelgesi (28 Mayıs)', desc: 'Mustafa Kemal\'in milli bilinci uyandırmak için halkı işgalleri protesto etmeye çağırdığı genelge.', emoji: '📢', kpssTip: 'Milli Mücadele\'nin İLK genelgesidir. Halkı mitingler yapmaya ve işgalleri protesto telgrafları çekmeye davet ederek milli ruhu uyandırmıştır. Bu genelge sonrası Mustafa Kemal İstanbul\'a geri çağrılmıştır.' },
      { id: 'm4', year: 1919, title: 'Amasya Genelgesi', desc: 'Milli mücadelenin amacı, gerekçesi ve yönteminin ilk kez yayınlanması.', emoji: '📢', kpssTip: 'Milli Mücadele\'nin "İhtilal Beyannamesi"dir. "Milletin bağımsızlığını yine milletin azim ve kararı kurtaracaktır" maddesiyle üstü kapalı olarak milli egemenliğe ve rejim değişikliğine ilk kez işaret edilmiştir.' },
      { id: 'm5', year: 1919, title: 'Erzurum Kongresi', desc: 'Manda ve himayenin ilk kez reddedilerek ulusal sınırların çizilmesi.', emoji: '🤝', kpssTip: 'Toplanış bakımından bölgesel, aldığı kararlar bakımından ulusaldır. Manda ve himaye İLK kez reddedilmiştir. İlk kez geçici bir hükümet kurulmasından bahsedilmiştir.' },
      { id: 'm6', year: 1919, title: 'Sivas Kongresi', desc: 'Tüm yararlı cemiyetlerin tek bir çatı altında birleştirildiği kongre.', emoji: '🤝', kpssTip: 'Hem toplanış hem kararlar bakımından tamamen ULUSAL tek kongredir. Tüm cemiyetler "Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti" adı altında birleştirilmiştir. Manda ve himaye KESİN olarak reddedilmiştir.' },
      { id: 'm7', year: 1919, title: 'Amasya Görüşmeleri (20-22 Ekim)', desc: 'Temsil Heyeti ile İstanbul Hükümeti temsilcisi Salih Paşa Amasya\'da bir araya geldi.', emoji: '🤝', kpssTip: 'İstanbul Hükümeti, Temsil Heyeti\'nin hukuki varlığını İLK kez resmen ve hukuken tanımıştır. Bu görüşmeler sonucunda Mebusan Meclisi\'nin açılması kararlaştırılmıştır.' },
      { id: 'm8', year: 1920, title: 'Misak-ı Milli Kararları', desc: 'Son Osmanlı Mebusan Meclisinde kabul edilen milli bağımsızlık andı.', emoji: '📜', kpssTip: 'Milli sınırlarımız son kez Mebusan Meclisinde tescillenmiştir. Kararlar üzerine İtilaf Devletleri İstanbul\'u resmen işgal etmiştir.' },
      { id: 'm9', year: 1920, title: 'TBMM’nin Açılması', desc: 'Ulusal egemenliği temsil eden kurucu meclisin Ankara\'da açılması.', emoji: '🏛️', kpssTip: 'Milli egemenlik ilkesi kurumsallaşmıştır. Kurucu ve olağanüstü yetkilere sahip bir meclistir. Meclis hükümeti sistemi uygulanmıştır.' },
      { id: 'm10', year: 1920, title: 'Sevr Antlaşması', desc: 'Milletimizce yırtılıp atılan, Saltanat Şurası onaylı ama hukuken geçersiz ölü doğmuş antlaşma.', emoji: '📉', kpssTip: 'Meclis-i Mebusan onayından geçmediği ve TBMM tarafından haince reddedildiği için hukuken geçersiz ölü doğmuş bir antlaşmadır.' },
      { id: 'm11', year: 1920, title: 'Bilecik Görüşmesi (5 Aralık)', desc: 'Mustafa Kemal Paşa ile İstanbul Hükümeti temsilcileri Bilecik Garı\'nda görüştü.', emoji: '🤝', kpssTip: 'İstanbul Hükümeti (Ahmet İzzet Paşa heyeti), TBMM Hükümeti\'nin varlığını İLK kez resmen ve hukuken tanımıştır. Mustafa Kemal, bu heyeti Ankara\'ya getirerek gövde gösterisi yapmıştır.' },
      { id: 'm12', year: 1921, title: 'I. İnönü Savaşı', desc: 'Düzenli ordunun Batı cephesindeki ilk askeri zaferi.', emoji: '🎖️', kpssTip: 'Düzenli ordunun ilk zaferidir. Milat (Moskova Ant., İstiklal Marşı, Londra Konf., Afganistan Dostluk, Teşkilat-ı Esasiye anayasası) gelişmeleri bu zaferin ardından yaşanmıştır.' },
      { id: 'm13', year: 1921, title: 'Sakarya Meydan Muharebesi', desc: 'Geri çekilmenin bittiği tarihi zafer.', emoji: '🎖️', kpssTip: 'Mustafa Kemal\'e "Gazilik" unvanı ve "Mareşallik" rütbesi verilmiştir. II. Viyana Kuşatması\'ndan (1683) beri süregelen Türk geri çekilmesi bu zaferle son bulmuştur.' },
      { id: 'm14', year: 1922, title: 'Büyük Taarruz', desc: 'Düşmanın Anadolu topraklarından tamamen sökülüp atılması.', emoji: '⚔️', kpssTip: 'Kurtuluş Savaşı\'nın askeri safhası başarıyla tamamlanmış ve diplomatik safha (ateşkes süreçleri) başlamıştır.' },
      { id: 'm15', year: 1922, title: 'Mudanya Ateşkes Antlaşması', desc: 'Doğu Trakya, İstanbul ve Boğazlar\'ın savaşsız kurtarıldığı ateşkes.', emoji: '📜', kpssTip: 'Osmanlı Devleti\'nin HUKUKEN sona erdiğinin kanıtıdır; çünkü İtilaf Devletleri başkent İstanbul\'u Osmanlı yerine doğrudan TBMM hükümetine teslim etmiştir.' },
      { id: 'm16', year: 1922, title: 'Saltanatın Kaldırılması', desc: 'Laiklik yolundaki ilk büyük devrim.', emoji: '👑', kpssTip: 'Osmanlı Devleti resmen sona ermiştir. Lozan Konferansı\'nda İtilaf Devletleri\'nin ikilik çıkarma planı suya düşürülmüştür. Laikliğin ilk aşamasıdır.' },
      { id: 'm17', year: 1923, title: 'Lozan Barış Antlaşması', desc: 'Yeni Türk devletinin bağımsızlığının tüm dünyaca tescil edildiği barış belgesi.', emoji: '✍️', kpssTip: 'Yeni Türk Devleti\'nin kurucu tapu senedidir. Sevr antlaşması tamamen tarihe gömülmüştür. Kapitülasyonlar kesin olarak kaldırılmıştır.' },
      { id: 'm18', year: 1923, title: 'Cumhuriyetin İlanı', desc: 'Devletin adının konduğu ve rejim krizinin çözüldüğü gün.', emoji: '⭐️', kpssTip: 'Devlet başkanlığı krizi çözülmüş, ilk cumhurbaşkanı M. Kemal, ilk başbakan İsmet İnönü, ilk meclis başkanı Fethi Okyar olmuştur. Kabine sistemine geçilmiştir.' },
      { id: 'm19', year: 1924, title: 'Halifeliğin Kaldırılması', desc: 'Modernleşmenin hızlandığı laiklik devrimi.', emoji: '📜', kpssTip: 'Laiklik ve inkılapların önündeki en büyük engel kaldırılmıştır. Aynı gün Tevhid-i Tedrisat (eğitim birliği) kanunu kabul edilmiş ve Şer\'iye-Evkaf vekaleti kaldırılmıştır.' }
    ]
  }
];

export const TimelineGameScreen: React.FC = () => {
  const colors = useTheme();

  const [activeMode, setActiveMode] = useState<'explore' | 'game'>('explore');
  const [selectedEra, setSelectedEra] = useState<Era>(HISTORICAL_ERAS[0]);

  // Modal / Detail state
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<TimelineEvent | null>(null);
  const [aiDetails, setAiDetails] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const handleOpenDetails = async (event: TimelineEvent) => {
    setSelectedDetailEvent(event);
    setAiDetails(null);
    setLoadingDetails(true);

    const apiKey = useSettingsStore.getState().apiKey;
    if (!apiKey) {
      setLoadingDetails(false);
      return;
    }

    try {
      const details = await generateTimelineEventDetail(event.title, event.year, apiKey);
      const cleanDetails = details
        .replace(/[\#\*\_]/g, '')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      setAiDetails(cleanDetails);
    } catch (err: any) {
      console.warn("AI details generation failed, using local details:", err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Game specific state with dynamic random subset
  const [gameShuffledEvents, setGameShuffledEvents] = useState<TimelineEvent[]>([]);
  const [userSelection, setUserSelection] = useState<TimelineEvent[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isCorrectSequence, setIsCorrectSequence] = useState(false);

  // Setup game with a dynamic random subset of 4 events from the selected era's events
  const handleStartGame = (era: Era) => {
    setSelectedEra(era);
    
    // Grab 4 completely random events from the era's events
    const pool = [...era.events].sort(() => Math.random() - 0.5);
    const selectedFour = pool.slice(0, 4);
    
    setGameShuffledEvents(selectedFour);
    setUserSelection([]);
    setIsGameFinished(false);
    setIsCorrectSequence(false);
  };

  const handleSelectGameEvent = (event: TimelineEvent) => {
    if (isGameFinished) return;

    // Toggle selection
    if (userSelection.some(e => e.id === event.id)) {
      setUserSelection(prev => prev.filter(e => e.id !== event.id));
    } else {
      if (userSelection.length < 4) {
        setUserSelection(prev => [...prev, event]);
      }
    }
  };

  const handleVerifySequence = () => {
    if (userSelection.length < 4) {
      Alert.alert('Eksik Seçim', 'Lütfen tüm olayların sıralamasını belirlemek için 4 olaya da sırayla tıklayın.');
      return;
    }

    // Correct chronological order of the selected 4 events based on years
    const correctOrder = [...gameShuffledEvents].sort((a, b) => a.year - b.year);
    
    // Check if user sequence matches correct chronological sequence
    const correct = userSelection.every((event, index) => event.id === correctOrder[index].id);
    
    setIsCorrectSequence(correct);
    setIsGameFinished(true);
  };

  const handleResetGame = () => {
    handleStartGame(selectedEra);
  };

  const renderFormattedAIDetails = (text: string) => {
    // Split text by "##" to isolate sections
    const sections = text.split(/(?=##)/g);
    
    return sections.map((sec, idx) => {
      const cleanSec = sec.replace(/^##\s*/, '').trim();
      if (!cleanSec) return null;

      // Extract title and body
      const lines = cleanSec.split('\n');
      const headerLine = lines[0].trim();
      const bodyLines = lines.slice(1).join('\n').trim();

      let icon = '📌';
      let title = headerLine;
      let isTipBox = false;

      if (headerLine.includes('📌') || headerLine.toLowerCase().includes('özet') || headerLine.toLowerCase().includes('gelişim')) {
        icon = '📌';
        title = headerLine.replace(/^[📌\s]*/, '');
      } else if (headerLine.includes('🏆') || headerLine.toLowerCase().includes('sonuç') || headerLine.toLowerCase().includes('değer')) {
        icon = '🏆';
        title = headerLine.replace(/^[🏆\s]*/, '');
      } else if (headerLine.includes('💡') || headerLine.toLowerCase().includes('tuzak') || headerLine.toLowerCase().includes('tüyo') || headerLine.toLowerCase().includes('hoca')) {
        icon = '💡';
        title = headerLine.replace(/^[💡\s]*/, '');
        isTipBox = true;
      }

      if (isTipBox) {
        return (
          <View key={idx} style={s.tipBox}>
            <Text style={s.tipHeader}>{icon} {title}</Text>
            <Text style={s.tipText}>{bodyLines}</Text>
          </View>
        );
      }

      return (
        <View key={idx} style={s.sectionCard}>
          <Text style={s.sectionCardHeader}>{icon} {title}</Text>
          <Text style={s.sectionCardBody}>{bodyLines}</Text>
        </View>
      );
    });
  };

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Modes Toggle Header */}
      <View style={s.modeToggleRow}>
        <TouchableOpacity
          style={[s.modeBtn, activeMode === 'explore' && s.modeBtnActive]}
          onPress={() => setActiveMode('explore')}
          activeOpacity={0.7}
        >
          <Text style={[s.modeBtnText, activeMode === 'explore' && s.modeBtnTextActive]}>📖 Zaman Tüneli Keşfet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, activeMode === 'game' && s.modeBtnActive]}
          onPress={() => {
            setActiveMode('game');
            handleStartGame(selectedEra);
          }}
          activeOpacity={0.7}
        >
          <Text style={[s.modeBtnText, activeMode === 'game' && s.modeBtnTextActive]}>🎮 Kronoloji Sıralama Oyunu</Text>
        </TouchableOpacity>
      </View>

      {/* Era Selector Row - 6 distinct KPSS Eras */}
      <View style={s.eraSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.eraSelectorScroll}>
          {HISTORICAL_ERAS.map((era) => {
            const isSel = selectedEra.id === era.id;
            return (
              <TouchableOpacity
                key={era.id}
                style={[s.eraTag, isSel && s.eraTagActive]}
                onPress={() => {
                  setSelectedEra(era);
                  if (activeMode === 'game') {
                    handleStartGame(era);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.eraTagText, isSel && s.eraTagTextActive]}>
                  {era.id === 'kurulus' && '👑 Kuruluş'}
                  {era.id === 'yukselis' && '🚀 Yükseliş'}
                  {era.id === 'duraklama' && '📉 Duraklama'}
                  {era.id === 'gerileme' && '🥀 Gerileme'}
                  {era.id === 'dagilma' && '💔 Dağılma'}
                  {era.id === 'cumhuriyet' && '⭐️ Cumhuriyet'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* EXPLORE MODE VIEW */}
      {activeMode === 'explore' && (
        <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.exploreContent}>
          <Text style={s.eraTitle}>{selectedEra.title}</Text>
          <Text style={s.eraDesc}>Aşağıdaki kronolojik kartlara dokunarak KPSS püf noktalarını ve ÖSYM tüyolarını detaylıca inceleyin:</Text>

          <View style={s.timelineContainer}>
            {/* The vertical line */}
            <View style={s.verticalLine} />

            {/* Sort all era events by year to display the full timeline in correct order */}
            {[...selectedEra.events].sort((a, b) => a.year - b.year).map((event, index) => (
              <TouchableOpacity
                key={event.id}
                style={s.timelineNodeRow}
                onPress={() => handleOpenDetails(event)}
                activeOpacity={0.8}
              >
                {/* Node circle on the line */}
                <View style={s.timelineDot}>
                  <View style={s.timelineDotInner} />
                </View>

                {/* Event Details Card */}
                <View style={s.eventCard}>
                  <View style={s.eventCardHeader}>
                    <Text style={s.eventYear}>{event.year}</Text>
                    <View style={s.badgeRow}>
                      <Text style={s.infoBadge}>ℹ️ Detay</Text>
                      <Text style={s.eventEmoji}>{event.emoji}</Text>
                    </View>
                  </View>
                  <Text style={s.eventTitle}>{event.title}</Text>
                  <Text style={s.eventDescText}>{event.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* CHRONOLOGY GAME MODE VIEW */}
      {activeMode === 'game' && (
        <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={s.gameContent}>
          <Text style={s.eraTitle}>🎮 Kronolojik Sıralama Oyunu</Text>
          <Text style={s.eraDesc}>
            Aşağıdaki 4 olayı **kronolojik olarak (en eskiden en yeniye doğru)** sırasıyla seçin. Kartlara basarak detaylarını inceleyebilirsiniz:
          </Text>

          {/* Shuffled Event Cards */}
          <View style={s.gameCardsContainer}>
            {gameShuffledEvents.map((event) => {
              const selectIndex = userSelection.findIndex(e => e.id === event.id);
              const isSelected = selectIndex !== -1;

              return (
                <View key={event.id} style={s.gameCardWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={isGameFinished}
                    onPress={() => handleSelectGameEvent(event)}
                    style={[s.gameCard, isSelected && s.gameCardSelected]}
                  >
                    <View style={s.gameCardLeft}>
                      <Text style={s.gameCardEmoji}>{event.emoji}</Text>
                      <Text style={s.gameCardTitle}>{event.title}</Text>
                    </View>
                    
                    {/* Selection Badge Showing Order: 1, 2, 3, 4 */}
                    <View style={[s.orderBadge, isSelected && s.orderBadgeActive]}>
                      <Text style={[s.orderBadgeText, isSelected && s.orderBadgeTextActive]}>
                        {isSelected ? selectIndex + 1 : '?'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Detay Info Button */}
                  <TouchableOpacity
                    style={s.gameCardInfoBtn}
                    onPress={() => handleOpenDetails(event)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.gameCardInfoText}>ℹ️ Detay</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Verification Results Panel */}
          {isGameFinished && (
            <View style={[s.resultPanel, isCorrectSequence ? s.successPanel : s.errorPanel]}>
              <Text style={[s.resultTitle, isCorrectSequence ? s.successText : s.errorText]}>
                {isCorrectSequence ? '🎉 Efsanevi Sıralama! Doğru!' : '❌ Maalesef Hatalı Sıralama!'}
              </Text>
              <Text style={s.resultDesc}>
                {isCorrectSequence
                  ? 'Olayların tarihsel gelişimini kusursuz bir şekilde kronolojik sıraya dizdiniz. Müthiş bir başarı!'
                  : 'Seçilen bu 4 olayın doğru kronolojisi şu şekildedir:'}
              </Text>

              {/* Correct Sequence List (Sorted subset of active chosen events) */}
              <View style={s.correctSequenceList}>
                {[...gameShuffledEvents].sort((a, b) => a.year - b.year).map((event, index) => (
                  <View key={event.id} style={s.correctSeqItem}>
                    <Text style={s.seqIndexText}>{index + 1}.</Text>
                    <Text style={s.seqYear}>{event.year}</Text>
                    <Text style={s.seqTitle}>{event.title}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={s.replayBtn} onPress={handleResetGame}>
                <Text style={s.replayBtnText}>Yeniden Oyna (Başka Olaylar) 🔄</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Verify Button */}
          {!isGameFinished && (
            <TouchableOpacity
              style={[s.verifyBtn, userSelection.length < 4 && s.verifyBtnDisabled]}
              onPress={handleVerifySequence}
              activeOpacity={0.8}
              disabled={userSelection.length < 4}
            >
              <Text style={s.verifyBtnText}>Sıralamayı Kontrol Et 🔍</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Premium Event Detail Modal */}
      <Modal
        visible={selectedDetailEvent !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDetailEvent(null)}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalContainer} edges={['top', 'bottom']}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalYearText}>{selectedDetailEvent?.year} Yılı</Text>
                <Text style={s.modalTitleText}>{selectedDetailEvent?.emoji} {selectedDetailEvent?.title}</Text>
              </View>
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setSelectedDetailEvent(null)}
              >
                <Text style={s.closeBtnText}>Kapat ✕</Text>
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={s.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.loaderText}>Yapay Zeka Derin KPSS Analizi Yapıyor...</Text>
                <Text style={s.loaderSubText}>Konu ve döneme özel nokta atışı ÖSYM tüyoları derleniyor.</Text>
              </View>
            ) : aiDetails ? (
              <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={s.modalContent}>
                {renderFormattedAIDetails(aiDetails)}
              </ScrollView>
            ) : (
              <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={s.modalContent}>
                <View style={s.sectionCard}>
                  <Text style={s.sectionCardHeader}>📋 Tarihsel Olay Özeti</Text>
                  <Text style={s.sectionCardBody}>{selectedDetailEvent?.desc}</Text>
                </View>

                <View style={s.tipBox}>
                  <Text style={s.tipHeader}>💡 ÖSYM KPSS Püf Noktaları (Tuzaklar)</Text>
                  <Text style={s.tipText}>{selectedDetailEvent?.kpssTip}</Text>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  modeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow
  },
  modeBtnText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  modeBtnTextActive: { color: colors.primary, fontWeight: '700' },
  
  eraSelectorContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  eraSelectorScroll: { paddingHorizontal: spacing.xxl, gap: spacing.md },
  eraTag: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  eraTagActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  eraTagText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  eraTagTextActive: { color: colors.textInverse },
  
  scrollArea: { flex: 1 },
  exploreContent: { padding: spacing.xxl },
  gameContent: { padding: spacing.xxl },
  eraTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '800', marginBottom: 4 },
  eraDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.xxl },
  
  timelineContainer: { position: 'relative', paddingLeft: 24 },
  verticalLine: {
    position: 'absolute',
    left: 7,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: colors.border
  },
  timelineNodeRow: { flexDirection: 'row', marginBottom: spacing.xl },
  timelineDot: {
    position: 'absolute',
    left: -23,
    top: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    zIndex: 10
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  eventCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl
  },
  eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  eventYear: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoBadge: {
    backgroundColor: colors.surfaceHighlight,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 0.5,
    borderColor: colors.border
  },
  eventEmoji: { fontSize: 20 },
  eventTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.xs },
  eventDescText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 22 },
  
  gameCardsContainer: { gap: spacing.md, marginBottom: spacing.xxl },
  gameCardWrapper: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center'
  },
  gameCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg
  },
  gameCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow
  },
  gameCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  gameCardEmoji: { fontSize: 22, marginRight: spacing.md },
  gameCardTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700', flex: 1 },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  orderBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  orderBadgeText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '800' },
  orderBadgeTextActive: { color: colors.textInverse },
  
  gameCardInfoBtn: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gameCardInfoText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  
  verifyBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginVertical: spacing.lg },
  verifyBtnDisabled: { opacity: 0.6 },
  verifyBtnText: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: '800' },
  
  resultPanel: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
    marginBottom: spacing.xxxl
  },
  successPanel: { borderColor: colors.success, backgroundColor: colors.successGlow },
  errorPanel: { borderColor: colors.error, backgroundColor: colors.errorGlow },
  resultTitle: { fontSize: fontSize.lg, fontWeight: '800', marginBottom: 8 },
  resultDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.lg },
  successText: { color: colors.success },
  errorText: { color: colors.error },
  correctSequenceList: { gap: spacing.sm, marginVertical: spacing.md },
  correctSeqItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  seqIndexText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700', width: 24 },
  seqYear: { color: colors.primary, fontSize: fontSize.md, fontWeight: '800', marginRight: spacing.md, width: 44 },
  seqTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  replayBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.xl },
  replayBtnText: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '700' },

  // Modal Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  modalContainer: {
    width: '92%',
    height: '75%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalYearText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '800' },
  modalTitleText: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '800', marginTop: 2 },
  closeBtn: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  closeBtnText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  modalBody: { flex: 1 },
  modalContent: { padding: spacing.xl, gap: spacing.md },
  
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm
  },
  sectionCardHeader: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 8
  },
  sectionCardBody: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22
  },

  tipBox: {
    backgroundColor: colors.primaryGlow,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: spacing.lg,
    marginBottom: spacing.sm
  },
  tipHeader: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '800', marginBottom: 6 },
  tipText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 22 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  loaderText: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.lg, textAlign: 'center' },
  loaderSubText: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, textAlign: 'center' },
  aiBodyText: { color: colors.textPrimary, fontSize: fontSize.sm, lineHeight: 24 }
});
