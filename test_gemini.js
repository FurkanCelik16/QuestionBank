const fs = require('fs');

async function testGenerate() {
  const apiKey = 'AIzaSyBTyCo8aoRY7yq5ENnCUZh7_9FWWuicAU0';
  const modelName = 'gemini-3.1-flash-lite';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const difficultyInstruction = 'Zorluk seviyesi: ZOR (Uzman seviyesi ve KPSS sınav standartlarında). Çeldiricileri çok güçlü olsun.';
  const speedConstraints = 'ŞIKLARI (A, B, C, D, E) YAZARKEN CÜMLELERİ ÇOK UZATMA. KISA, NET VE AKADEMİK OLSUN.';
  
  const systemPrompt = `Sen profesyonel bir ÖSYM / KPSS soru yazarı uzmanısın. ${difficultyInstruction} ${speedConstraints}

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

- "type": her zaman "multiple-choice" olmalıdır.
- "highlighted_province_ids": Soru eğer TÜRKİYE HARİTASI üzerinde gösterilmesi gereken bir coğrafya sorusu ise (dağ, ova, göl, nehir, iklim, tarım ürünü vb. konumları içeren sorular) bu diziye ilin/illerin plaka kodlarını ekle. Haritalık bir durum yoksa boş dizi "[]" bırak. EĞER PLAKA KODU EKLERSEN, SORU KÖKÜNÜ VE ÇÖZÜMÜ BUNA GÖRE (İşaretli yerler vb. ifadelerle) TASARLA! Kesinlikle yanlış ilin plakasını verme. ÖSYM tarzında haritada işaretli yer sorusu gibi kurgula!
- Her sorunun cevabı farklı bir seçenek olsun (A, B, C, D, E dağılımı dengeli olsun).
- Çözüm (rational_explanation) kısmı KPSS tarzında açıklayıcı ve eğitici olmalıdır.`;

  const userPrompt = `Sana verilen şu KPSS konularından toplam 5 adet soru üret:
[ "Türkiye'nin Fiziki Coğrafyası (Yer Şekilleri)", "Türkiye'nin İklimi" ]

Her konudan dengeli dağılım yap. Sorular daha önce sorulmuş klasik sorulardan ziyade ayırt edici ve eleyici olsun.

YALNIZCA GEÇERLİ BİR JSON OLUŞTUR. BAŞKA HİÇBİR METİN VEYA İŞARET KULLANMA.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `[SİSTEM TALİMATI]:\n${systemPrompt}\n\n[TALEBİM]:\n${userPrompt}` }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.85,
      responseMimeType: 'application/json'
    }
  };

  try {
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error('API Hatası:', res.status, err);
      return;
    }
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(text);
  } catch(e) {
    console.error(e);
  }
}

testGenerate();
