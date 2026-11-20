# Checkpoint: v.3

Kaydedilme tarihi: 18 Kasım 2026

Selected Works'ün Instagram ve VSCO içerikleriyle yeniden kurulduğu, videoların ve yeni albüm düzeninin eklendiği hâlin tamamı.

## Bu checkpoint'te ne var

- **Selected Works sırası:** İstikbal × Society, Tanabay & Sasha, Sapanca ’26, vasiyet., Çalkala, Lubemak Lounge, Dance, City sights, Portraits, Focus, en sonda Generative Poster Studies (AI, açıkça belirtilir). Ebebek, Kimmi Motor ve ES Kariyer çıkarıldı.
- **Videolar:** Proje penceresinde oynuyor. Birden fazla klipte "N VIDEOS" başlıklı, önizlemeli seçim sırası var. Her videonun kendi kapak karesi var (`public/media/portfolio/video/*.jpg`).
- **Kapaklar:**
  - Sapanca: masa başı karesi.
  - Lubemak: 1907 logosunun ilk göründüğü kare.
  - Focus: "FOCUS" yazılı fotoğraf.
  - vasiyet: geçici kare, Arda asıl kapağı gönderecek.
- **Albümler:**
  - Tanabay & Sasha: filmlerden 11 kare + 2 fotoğraf.
  - vasiyet: trailer'dan 7 kare; büyük/küçük seçimi Arda'nın.
  - City sights: Night studies + 12 VSCO + 3 renk çalışması.
  - Dance: bütün yarışmalar tek albümde.
  - Portraits: editoryal + stüdyo portreleri.
  - Focus: 2 fotoğraf.
- **Albüm düzeni:** VSCO profili gibi sütunlu, organik bir düzen (`src/galleryLayout.js`). Fotoğraflar kırpılmaz. En net ~%40 iki sütun genişliğinde büyük; netlik puanları `src/data/mediaSharpness.json` içinde. Fotoğrafa basınca tam ekran görüntüleyici açılır (oklar, klavye, kaydırma).
- **Diğer:**
  - Instagram simgesi menüde sabit.
  - Mobilde Get in touch'ta mail tuşu var.
  - Hikâyelerde telefonda sağa-sola kaydırma çalışır.
  - Oklar SVG.
  - Hero'daki üst servis satırı kaldırıldı.

Kopyalanan: `src/`, `scripts/`, kökteki tüm `.md` dosyaları, `index.html`, `package.json`, `package-lock.json`, `preview_concept.html`, `.gitignore`, `netlify.toml`.

`public/` medyası (fotoğraflar ve videolar, yaklaşık 160 MB) depoyu şişirmemek için kopyalanmadı. Değişmediğini doğrulamak için `public-media-checksums.txt` içinde her dosyanın SHA-256 özeti var.

## Geri dönmek için

Claude'a "v.3'e dön" demen yeterli. Elle yapmak istersen proje klasöründe:

```bash
rm -rf src scripts && cp -R checkpoints/v.3/src checkpoints/v.3/scripts .
cp checkpoints/v.3/*.md checkpoints/v.3/index.html checkpoints/v.3/package.json checkpoints/v.3/package-lock.json checkpoints/v.3/preview_concept.html checkpoints/v.3/.gitignore checkpoints/v.3/netlify.toml .
rm CHECKPOINT.md
```

Medyanın aynı olduğunu kontrol etmek için:

```bash
cd public && shasum -a 256 -c ../checkpoints/v.3/public-media-checksums.txt
```
