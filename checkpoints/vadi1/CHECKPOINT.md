# Checkpoint: vadi1

Kaydedilme tarihi: 3 Kasım 2026

## Bu checkpoint'te ne var

Work bölümünün onaylanmış hali:

- Vadi, yol çizgileri, kamera ve proje görselleri tek bir yol formülünü (`pathX`) paylaşır.
- Görseller yolun hemen sağına ve soluna sırayla yerleşir; kamera düz bakarak (tilt yok) yolda ilerler, görseller durmadan kameranın yanından geçer.
- Aynı anda en fazla 2 görsel: en yakındaki net ana öğe, yolun karşısındaki sıradaki küçük ve bulanık. Öndeki çıkınca sıradaki ufuktan belirir.
- Ekranın önündeki hareketli gren katmanı kaldırıldı.
- Görseller CSS scale yerine gerçek piksel boyutunda çizilir ve net görselde filtre kapalıdır (kırpılma/şekil bozulması düzeltmesi).
- Ufukta, tepelerin arkasında kalan hafif sıcak bir ışık (HorizonGlow) vardır.

Medya (`public/media/`) bu checkpoint'e kopyalanmadı; değişmedi.

## Geri dönmek için

Claude'a "vadi1 checkpoint'ine dön" demen yeterli. Elle yapmak istersen proje klasöründe:

```bash
cp -R checkpoints/vadi1/src/. src/
cp checkpoints/vadi1/ARDA_CLAUDE_HANDOFF.md checkpoints/vadi1/index.html checkpoints/vadi1/package.json .
```

Sonra `npm run build` ile kontrol et.
