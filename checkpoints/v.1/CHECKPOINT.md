# Checkpoint: v.1

Kaydedilme tarihi: 3 Kasım 2026

Approach / What I Create bölümlerindeki büyük değişiklikten (Videography, Photography, Illustration Design hikâyeleri) **önceki** sitenin tamamı.

## Bu checkpoint'te ne var

- vadi1'deki Work bölümü (ortak yol, düz kamera, en fazla 2 görsel, ufuk ışığı, gren katmanı yok).
- Fontlar: Switzer + Newsreader Italic, yeni harf aralıkları.
- Başlık alanı: ARDA KURUCU | akv logosu, ® yok.
- Hero: "Visuals with a story and style." / "Videography, photography and design."
- Sağ üst etiket: VIDEOGRAPHY / PHOTOGRAPHY / DESIGN.
- Bölümler: 01 Work, 02 Approach (Listen/Shape/Make/Refine), 03 What I Create, 04 About, 05 Contact.

Kopyalanan: `src/`, `scripts/`, kökteki tüm `.md` dosyaları, `index.html`, `package.json`, `package-lock.json`, `preview_concept.html`, `.gitignore`.

`public/` medyası (11 MB) depoyu şişirmemek için kopyalanmadı; değişmediğini doğrulamak için `public-media-checksums.txt` içinde her dosyanın SHA-256 özeti var.

## Geri dönmek için

Claude'a "v.1 checkpoint'ine dön" demen yeterli. Elle yapmak istersen proje klasöründe:

```bash
rm -rf src scripts && cp -R checkpoints/v.1/src checkpoints/v.1/scripts .
cp checkpoints/v.1/*.md checkpoints/v.1/index.html checkpoints/v.1/package.json checkpoints/v.1/package-lock.json checkpoints/v.1/preview_concept.html checkpoints/v.1/.gitignore .
rm CHECKPOINT.md
```

Medyanın aynı olduğunu kontrol etmek için:

```bash
cd public && shasum -a 256 -c ../checkpoints/v.1/public-media-checksums.txt
```

Sonra `npm install` ve `npm run build` ile kontrol et.
