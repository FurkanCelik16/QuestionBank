const fs = require('fs');

async function testGenerate() {
  const apiKey = 'AIzaSyBTyCo8aoRY7yq5ENnCUZh7_9FWWuicAU0';
  const modelName = 'gemini-3.1-flash-lite';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Use the exact prompts from geminiService
  const difficultyInstruction = 'Zorluk seviyesi: ZOR (Uzman seviyesi ve KPSS sınav standartlarında). Çeldiricileri çok güçlü olsun.';
  const speedConstraints = 'ŞIKLARI (A, B, C, D, E) YAZARKEN CÜMLELERİ ÇOK UZATMA. KISA, NET VE AKADEMİK OLSUN.';
  const topicsString = "Türkiye'nin Fiziki Coğrafyası (Yer Şekilleri), Türkiye'nin İklimi";

  const geographyMapInstruction = `
[!!! COĞRAFYA HARİTALI SORU TALİMATI - SON DERECE KRİTİK VE MUTLAK ZORUNLU !!!]:
Eğer Coğrafya konuları hakkında soru üretiyorsan, ürettiğin toplam soruların en az %30'unu (örn: 10 soruluk bir testte en az 3 soruyu) **Türkiye Haritalı Soru** olarak tasarla.
1. Haritalı sorularda, haritada vurgulanmasını ve işaretlenmesini istediğin illerin plaka kodlarını (1-81 arası tamsayılar, örn: Rize için [53]) "highlighted_province_ids" alanına dizi olarak ekle. (Haritasız normal sorularda bu alanı [] bırak).
2. KRİTİK UI KISITLAMASI (DİKKAT!): Uygulamadaki harita motoru, "highlighted_province_ids" içine yazdığın illeri sadece KIRMIZIYA BOYAR. İllerin üzerine KESİNLİKLE numara (I, II, III vb.) veya harf YAZAMAZ.
3. BU YÜZDEN ŞU SORU TİPİ KESİNLİKLE YASAKTIR: "Haritada numaralandırılmış alanların hangisinde..." deyip şıklara "A) I, B) II, C) III" koymak YASAKTIR. Şıklara il plakası "A) 34, B) 06" koymak YASAKTIR. Bu tür sorular uygulamada çözülemez ve testin kalitesini bozar.
4. DOĞRU HARİTALI SORU TİPLERİ ŞUNLARDIR:
   - TİP 1 (Tek İl İşaretli): Sadece 1 ilin plakasını "highlighted_province_ids" içine ekle. Soru: "Yukarıdaki haritada kırmızı renk ile gösterilen yörede aşağıdaki tarım ürünlerinden hangisi yetişmez?". Şıklar: "A) Pamuk, B) Fındık, C) Çay...".
   - TİP 2 (Çoklu İl İşaretli): Birden fazla ilin plakasını ekle (örn: [53, 61, 08]). Soru: "Türkiye haritasında koyu renkle işaretlenen illerin ortak coğrafi özelliği aşağıdakilerden hangisidir?". Şıklar: "A) Dağların kıyıya dik uzanması, B) Yaz kuraklığının belirgin olması...".
   - Harita kullanmadan "I ve II" öncüllü soru sormak serbesttir, ancak bu öncüller soru metni (question_text) içinde metin olarak yazılmalıdır.
5. "highlighted_province_ids" içine yazdığın iller ile soru kökünde/çözümde kastedilen iller %100 uyuşmalıdır. (Örn: Soru Erzurum-Kars ise plakalar kesinlikle [25, 36] olmalıdır).
6. Soru veya seçenek metnine KESİNLİKLE "[6]", "[34]" gibi plaka sayıları yazma, sadece doğal ifadeler kullan.`;

  const systemPrompt = `Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. ${difficultyInstruction}${speedConstraints}
Lütfen JSON formatında, KPSS formatına birebir uygun bir test hazırla. Çıktı sadece geçerli ve düzgün JSON formatında olmalıdır.

JSON ŞEMASI:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice",
      "question_text": "Soru kökü buraya gelecek.",
      "subtopic": "Sorunun ölçtüğü mikro kavram/konu.",
      "options": {
        "A": "Şık 1",
        "B": "Şık 2",
        "C": "Şık 3",
        "D": "Şık 4",
        "E": "Şık 5"
      },
      "correct_answer": "Doğru şıkkın harfi (A, B, C, D veya E)",
      "rational_explanation": "Sorunun detaylı çözüm açıklaması.",
      "highlighted_province_ids": []
    }
  ]
}
${geographyMapInstruction}`;

  const userPrompt = `Aşağıdaki konulardan toplam 5 soru üret: ${topicsString}`;

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` }] }],
    generationConfig: { temperature: 0.85, responseMimeType: 'application/json' }
  };

  try {
    const res = await fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.endsWith('```')) text = text.slice(0, -3);
      try {
        const parsed = JSON.parse(text);
        console.log("JSON is valid!");
      } catch (e) {
        console.log("INVALID JSON GENERATED:\n" + text);
      }
    }
  } catch(e) { console.error(e); }
}
testGenerate();
