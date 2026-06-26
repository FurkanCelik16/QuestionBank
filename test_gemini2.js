const fs = require('fs');

async function testGenerate() {
  const apiKey = 'AIzaSyBTyCo8aoRY7yq5ENnCUZh7_9FWWuicAU0';
  const modelName = 'gemini-3.1-flash-lite';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const systemPrompt = `Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. Zorluk seviyesi: ZOR.
Lütfen JSON formatında test hazırla. Çıktı sadece geçerli JSON olmalıdır.

JSON ŞEMASI:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice",
      "question_text": "Soru kökü buraya gelecek.",
      "subtopic": "Sorunun alt konusu",
      "options": {
        "A": "Şık 1",
        "B": "Şık 2",
        "C": "Şık 3",
        "D": "Şık 4",
        "E": "Şık 5"
      },
      "correct_answer": "C",
      "rational_explanation": "Çözüm.",
      "highlighted_province_ids": []
    }
  ]
}

- "highlighted_province_ids": Haritada gösterilmesi gereken bir soruysa ilin/illerin plaka kodlarını ekle. Haritalık değilse [] bırak.
- KRİTİK KURAL: Uygulamadaki harita altyapısı illeri sadece kırmızıya boyar, illerin üzerine numara (I, II, III vb.) YAZAMAZ. Bu nedenle KESİNLİKLE "Haritada numaralandırılmış yerlerin hangisinde..." veya "İşaretli yerlerden hangisi..." deyip şıklara I, II, III, IV, V KOYMAYIN. Bu tür sorular uygulamada çözülemez!
- DOĞRU HARİTA SORUSU TİPLERİ:
  1) Tek bir ili boyayıp (örneğin [35]): "Haritada kırmızı ile gösterilen yörede aşağıdaki tarım ürünlerinden hangisi yetişmez?"
  2) Birden fazla ili boyayıp (örneğin [53, 61, 08]): "Haritada gösterilen alanların ortak özelliği aşağıdakilerden hangisidir?"
  3) Şıklarda il isimleri verip, haritayı kullanmamak (boş [] bırakmak).
- Şıklarda "I ve II" gibi öncüllü sorular SORABİLİRSİNİZ, ancak bu öncüller soru kökünde metin olarak verilmelidir, harita üzerinde DEĞİL.`;

  const userPrompt = `Bana Türkiye coğrafyası hakkında 3 adet çok kaliteli KPSS sorusu üret. İkisi haritalı olsun.`;

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` }] }],
    generationConfig: { temperature: 0.85, responseMimeType: 'application/json' }
  };

  try {
    const res = await fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    const data = await res.json();
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.text || data);
  } catch(e) { console.error(e); }
}

testGenerate();
