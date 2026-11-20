# Arda için başlangıç

Bu depo, portfolyonun çalışır kaynak kodunu ve web için optimize edilmiş tüm görselleri içerir. 6 GB'lık ham medya arşivi bu depoya gerekmez ve özellikle eklenmemiştir.

## En kolay yöntem: GitHub Desktop

1. [GitHub Desktop](https://desktop.github.com/) ve [Node.js LTS](https://nodejs.org/) kur.
2. Tuna'nın GitHub davetini kabul et.
3. GitHub Desktop'ta **File → Clone repository** seçip bu depoyu klonla.
4. Klasörü Claude Code veya kullandığın editörde aç.
5. Terminalde şu iki komutu çalıştır:

```bash
npm install
npm run dev
```

6. Terminalde gösterilen `http://localhost:...` adresini tarayıcıda aç.
7. Claude'a vermek için [ARDA_CLAUDE_HANDOFF.md](./ARDA_CLAUDE_HANDOFF.md) dosyasındaki hazır promptu kullan.

## Değişikliklerini kaydetme

GitHub Desktop'ta sol alttaki **Summary** alanına kısa bir açıklama yaz, **Commit to main** ve ardından **Push origin** düğmesine bas. Büyük ham videoları veya özel müşteri dosyalarını depoya ekleme.

## Kontrol komutları

Bir değişiklikten sonra en azından:

```bash
npm run build
```

Yerel önizleme:

```bash
npm run preview
```

## İçerik nerede?

- Projeler, başlıklar ve roller: `src/data/projects.js`
- Genel metinler ve iletişim bilgileri: `src/App.jsx`
- Work yolculuğu ve WebGL sahnesi: `src/WorkJourney.jsx`
- Görsel tasarım: `src/styles.css`
- Yayına giren optimize medya: `public/media/portfolio/`
- Lansman öncesi sorular: `ARDA_KREDI_SORULARI_TR.md`
- Lansman kontrolü: `CONTENT_REPLACEMENT_CHECKLIST.md`

## Önemli

Site şu anda bilinçli olarak arama motorlarına kapalıdır (`noindex, nofollow`). Proje kredileri, yıllar, roller ve son yayın metinleri onaylanmadan bunu kaldırma.
