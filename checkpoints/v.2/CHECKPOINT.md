# Checkpoint: v.2

Kaydedilme tarihi: 4 Kasım 2026

Netlify yayını kurulduktan ve mobil düzeltmeler yapıldıktan sonraki sitenin tamamı.

## Bu checkpoint'te ne var

- Work vadisi: masaüstünde tam sürüm, telefonda hafif mobil profil (fotoğrafların üstünde "Open Project" yazısı yok).
- Hero: üstte sadece "INDEPENDENT VISUAL CREATIVE"; VIDEOGRAPHY / PHOTOGRAPHY / DESIGN satırı kaldırıldı. Alt başlık "Videography, photography and design." duruyor.
- Bölümler: 01 Work, 02 Approach (Idea / Image / Edit / Feeling, mobilde de yan yana), 03 About, 04 Contact.
- Videography, Photography, Illustration Design hikâyeleri; telefonda sağa-sola kaydırma (SWIPE). Photography → Feeling sahnesinde kadın telefonu sağ eliyle tutuyor, el küçültüldü.
- Oklar SVG çizgi (telefonda emoji olmaz).
- Instagram logosu: sürükle / tek tık Instagram / çift tık düşür. Masaüstünde fare üstüne gelince, mobilde ilk dokunuşa kadar silik açıklama kutusu.
- Grenli geçiş gradyanı (hero → Work).
- Netlify ayarı: `netlify.toml`.

Kopyalanan: `src/`, `scripts/`, kökteki tüm `.md` dosyaları, `index.html`, `package.json`, `package-lock.json`, `preview_concept.html`, `.gitignore`, `netlify.toml`.

`public/` medyası depoyu şişirmemek için kopyalanmadı; değişmediğini doğrulamak için `public-media-checksums.txt` içinde her dosyanın SHA-256 özeti var.

## Geri dönmek için

Claude'a "v.2'ye dön" demen yeterli. Elle yapmak istersen proje klasöründe:

```bash
rm -rf src scripts && cp -R checkpoints/v.2/src checkpoints/v.2/scripts .
cp checkpoints/v.2/*.md checkpoints/v.2/index.html checkpoints/v.2/package.json checkpoints/v.2/package-lock.json checkpoints/v.2/preview_concept.html checkpoints/v.2/.gitignore checkpoints/v.2/netlify.toml .
rm CHECKPOINT.md
```

Medyanın aynı olduğunu kontrol etmek için:

```bash
cd public && shasum -a 256 -c ../checkpoints/v.2/public-media-checksums.txt
```
