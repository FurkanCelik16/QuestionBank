const fs = require('fs');

async function testGenerate() {
  const apiKey = 'AIzaSyBTyCo8aoRY7yq5ENnCUZh7_9FWWuicAU0';
  const modelName = 'gemini-3.1-flash-lite';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const difficultyInstruction = 'Zorluk seviyesi: ZOR (Uzman seviyesi ve KPSS sınav standartlarında). Çeldiricileri çok güçlü olsun.';
  const speedConstraints = 'ŞIKLARI (A, B, C, D, E) YAZARKEN CÜMLELERİ ÇOK UZATMA. KISA, NET VE AKADEMİK OLSUN.';
  const topicsString = "Osmanlı Devleti Kültür ve Uygarlığı, Türkiye'nin Fiziki Coğrafyası (Yer Şekilleri)";

  const geographyMapInstruction = `
[!!! COĞRAFYA HARİTALI SORU TALİMATI - SON DERECE KRİTİK VE MUTLAK ZORUNLU !!!]:
Eğer Coğrafya konuları hakkında soru üretiyorsan, ürettiğin toplam soruların en az %30'unu **Türkiye Haritalı Soru** olarak tasarla.
1. Haritalı sorularda, haritada vurgulanmasını istediğin illerin plaka kodlarını (örn: Rize için [53]) "highlighted_province_ids" alanına ekle. Haritasız sorularda bu alanı [] bırak.
2. KRİTİK UI KISITLAMASI: Uygulamadaki harita motoru, illeri sadece KIRMIZIYA BOYAR. İllerin üzerine numara (I, II, III vb.) YAZAMAZ.
3. BU YÜZDEN ŞU SORU TİPİ YASAKTIR: "Haritada numaralandırılmış alanların hangisinde..." deyip şıklara "A) I, B) II, C) III" veya "A) 34, B) 06" koymak YASAKTIR.
4. DOĞRU HARİTALI SORU TİPLERİ:
   - Tek İl İşaretli: Soru: "Haritada kırmızı ile gösterilen yörede... hangisi yetişmez?" (Şıklar metin olmalı)
   - Çoklu İl İşaretli: Birden fazla il plakası ekle. Soru: "Haritada işaretlenen illerin ortak özelliği aşağıdakilerden hangisidir?" (Şıklar metin olmalı)
5. Plaka numaralarını metin içinde göstermek kesinlikle yasaktır! (Örn: "[6] numaralı il" YAZMA)`;

  const varietyAndCoverageMandate = `
ÇEŞİTLİLİK VE DETAYLI MÜFREDAT KAPSAMI KURALI:
1. Ürettiğin soruların her biri tamamen farklı bir alt başlık/kavram ile ilgili olmalıdır. Asla aynı alt başlıktan 2 soru üretme!
2. DİL VE YAPI ŞABLONU TEKRAR YASAĞI: Soruların başlangıç ve cümle yapılarını sürekli aynı şablonla kurma!
3. GİRİŞ TARZI KAÇAK ENGELİ: Kılavuz ifadeleri (örn: "Doğrudan soru kökü ile başla") soru metnine kopyalama!
4. MANTIK HATASI ENGELİ (YUKARIDAKİLERDEN HANGİSİ): Soru metni "Yukarıdakilerden hangisi..." diye bitiyorsa, metnin en başında MUTLAKA öncüller (I. ..., II. ..., III. ...) bulunmak ZORUNDADIR. Öncül yoksa "Yukarıdakilerden hangisi" kelimesini ASLA kullanma, "Aşağıdakilerden hangisi" de.
5. KENDİNDEN CEVAPLI SORU YASAĞI: Sorunun cevabını soru kökünde veya alıntıda açıkça verme.`;

  const systemPrompt = `Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. ${difficultyInstruction}${speedConstraints}${varietyAndCoverageMandate}
Lütfen çıktıyı SADECE geçerli bir JSON formatında ver. JSON objelerinin sonuna ASLA trailing comma (sondaki virgül) KOYMA.

MÜFREDAT BİLGİSİ:
YALNIZCA seçilen şu konular [${topicsString}] hakkında soru sor. Diğer konulara girme.

JSON ŞEMASI:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice",
      "question_text": "Soru kökü buraya gelecek.",
      "subtopic": "Sorunun ölçtüğü mikro kavram.",
      "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "correct_answer": "C",
      "rational_explanation": "Çözüm...",
      "highlighted_province_ids": []
    }
  ]
}
${geographyMapInstruction}`;

  const userPrompt = `Aşağıdaki konulardan toplam 4 soru üret: ${topicsString}`;

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` }] }],
    generationConfig: { temperature: 0.85, responseMimeType: 'application/json' }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(geminiUrl, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    if (!res.ok) {
       console.log("API ERROR:", await res.text());
       return;
    }
    
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.endsWith('```')) text = text.slice(0, -3);
      text = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      try {
        const parsed = JSON.parse(text);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log("JSON parsing STILL failed:\n" + text);
      }
    }
  } catch(e) { console.error("Fetch Error:", e.message); } finally { clearTimeout(timeoutId); }
}
testGenerate();
