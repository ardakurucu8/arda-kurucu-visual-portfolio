import {createContext, useContext} from 'react';

// Two languages: English (en) and Turkish (tr). The choice is remembered on this device and
// shared with /card/ and /project/ (same "lang" key). First visit: ?lang=tr|en, otherwise English.
import {LANGS, initialLang, saveLang} from './lang.js';

export {LANGS, initialLang, saveLang};

export const ui = {
  en: {
    skip: 'Skip to content',
    nav: {work: 'WORK', approach: 'APPROACH', about: 'ABOUT', contact: 'CONTACT', card: 'CARD', cardLabel: 'Digital card', menu: 'MENU', close: 'CLOSE', language: 'Language'},
    descriptor: 'Visual Creative',
    city: 'Istanbul',
    loader: {label: 'Preparing the portfolio', role: 'VISUAL CREATIVE', status: 'PREPARING VISUAL JOURNEY'},
    hero: {
      index: 'INDEPENDENT VISUAL CREATIVE',
      title: ['VISUALS WITH', 'A STORY AND STYLE.'],
      summary: ['Videography, photography and design.', 'Built around an idea, made to feel personal.'],
      explore: 'EXPLORE WORK',
      discuss: 'DISCUSS A PROJECT',
      caption: 'a story, and style.',
      reelAlt: "Stills from Arda Kurucu's films: sea, a wedding, a film set and a short-film scene",
      rule: ['SELECTED VISUAL WORKS', 'SCROLL / 01'],
    },
    work: {
      eyebrow: '01 / THE WORK',
      title: ['SELECTED', 'WORK.'],
      intro: 'A considered sequence of moving and still image projects—credit and contribution made visible.',
      viewing: 'VIEWING',
      filterLabel: 'Filter selected work',
      filters: {All: 'All', Video: 'Video', Photography: 'Photography', 'AI / Generative': 'AI / Generative'},
      preparing: 'PREPARING VISUAL JOURNEY…',
      view: 'VIEW PROJECT',
      viewLabel: (title, role) => `View ${title}. ${role}`,
      travel: 'SCROLL TO TRAVEL',
      disclaimer: 'RELEASE STATUS — Public portfolio use of the supplied media was confirmed on 02 November 2026. AI-generated work is kept separate from Photography and explicitly disclosed.',
    },
    approach: {
      eyebrow: '02 / THE APPROACH',
      title: ['CONCEPT FIRST.', 'MEDIUM SECOND.'],
      body: 'A strong visual starts before the camera turns on. The process moves from idea and mood to composition, light and rhythm—then chooses the medium that makes it feel right.',
      steps: ['Idea', 'Image', 'Edit', 'Feeling'],
      services: {
        videography: ['Videography', 'Concept-led moving images for artists and personal projects.'],
        photography: ['Photography', 'Portraits and visual stories shaped around mood, people and place.'],
        illustration: ['Illustration Design', 'Illustrated and designed visuals, from first idea to final artwork.'],
      },
    },
    about: {
      eyebrow: '03 / ABOUT',
      title: ['ARDA KURUCU', 'VISUAL CREATIVE.'],
      body: [
        'Arda is an Istanbul-based visual creative working across video, photography and editing. His practice is grounded in visual concept: finding the image, rhythm and point of view that makes each project feel specific.',
        'This portfolio is designed for collaboration with people making something personal—especially independent artists and individuals.',
      ],
      facts: ['BASED / ISTANBUL', 'AVAILABLE / PROJECT-BASED'],
    },
    contact: {
      eyebrow: '04 / GET IN TOUCH',
      // [plain, italic, plain] for each of the two lines
      title: [['HAVE AN ', 'IDEA?', ''], ["LET'S MAKE IT ", 'VISUAL.', '']],
      start: 'Start a project with Arda',
      prompt: 'Tell me the idea, the format, your location and when you’d like to make it.',
      save: 'Save my details',
      card: 'DIGITAL CARD',
      role: 'VISUAL CREATIVE / ISTANBUL',
      top: 'BACK TO TOP',
    },
    dialog: {
      project: 'PROJECT',
      share: 'SHARE',
      copied: 'LINK COPIED',
      close: 'CLOSE',
      videos: (count) => `${count} VIDEOS`,
      role: 'Role',
      year: 'Year',
      status: 'Status',
      previous: 'PREVIOUS',
      next: 'NEXT',
      shareTitle: (title) => `${title} — Arda Kurucu`,
    },
    photos: {
      selection: (title) => `${title} image selection`,
      open: (n, total) => `Open photo ${n} of ${total}`,
      image: (title, n) => `${title} selected image ${n}`,
      photo: (title, n, total) => `${title} — photo ${n} of ${total}`,
      previous: 'Previous photo',
      next: 'Next photo',
    },
    video: {play: 'Play', pause: 'Pause', seek: 'Seek', mute: 'Mute', unmute: 'Unmute', full: 'Full screen', exitFull: 'Exit full screen'},
    story: {
      eyebrow: 'SERVICE STORY',
      stages: 'Story stages',
      swipe: 'SWIPE', swipeBack: 'SWIPE TO RETURN', scroll: 'SCROLL', scrollBack: 'SCROLL TO RETURN', back: 'RETURN',
      steps: null, // English names live in ServiceStory.jsx
    },
  },

  tr: {
    skip: 'İçeriğe geç',
    nav: {work: 'İŞLER', approach: 'YAKLAŞIM', about: 'HAKKIMDA', contact: 'İLETİŞİM', card: 'KART', cardLabel: 'Dijital kart', menu: 'MENÜ', close: 'KAPAT', language: 'Dil'},
    descriptor: 'Görsel Yaratıcı',
    city: 'İstanbul',
    loader: {label: 'Portfolyo hazırlanıyor', role: 'GÖRSEL YARATICI', status: 'GÖRSEL YOLCULUK HAZIRLANIYOR'},
    hero: {
      index: 'BAĞIMSIZ GÖRSEL YARATICI',
      title: ['HİKAYE VE TARZ', 'SAHİBİ GÖRSELLER.'],
      summary: ['Video, fotoğraf ve tasarım.', 'Bir fikir etrafında kurulan, kişisel hissettiren işler.'],
      explore: 'İŞLERİ KEŞFET',
      discuss: 'PROJENİ KONUŞALIM',
      caption: 'bir hikâye, bir tarz.',
      reelAlt: 'Arda Kurucu’nun filmlerinden kareler: deniz, bir düğün, bir film seti ve bir kısa film sahnesi',
      rule: ['SEÇKİLER', 'KAYDIR / 01'],
    },
    work: {
      eyebrow: '01 / İŞLER',
      title: ['SEÇKİLER.', ''],
      intro: 'Hareketli ve durağan görüntülerden özenle seçilmiş bir dizi—emek ve katkı görünür kılınarak.',
      viewing: 'GÖSTERİLEN',
      filterLabel: 'Seçkileri filtrele',
      filters: {All: 'Tümü', Video: 'Video', Photography: 'Fotoğraf', 'AI / Generative': 'Yapay Zekâ'},
      preparing: 'GÖRSEL YOLCULUK HAZIRLANIYOR…',
      view: 'PROJEYİ GÖR',
      viewLabel: (title, role) => `${title} projesini aç. ${role}`,
      travel: 'GEZMEK İÇİN KAYDIR',
      disclaimer: 'YAYIN DURUMU — Paylaşılan medyanın portfolyoda herkese açık kullanımı 2 Kasım 2026’da onaylandı. Yapay zekâ ile üretilen işler Fotoğraf’tan ayrı tutulur ve açıkça belirtilir.',
    },
    approach: {
      eyebrow: '02 / YAKLAŞIM',
      title: ['ÖNCE KONSEPT.', 'SONRA MECRA.'],
      body: 'Güçlü bir görsel çekimden önce üretilir. Süreç fikir ile başlar, kompozisyon, açı ve ışık ile devam eder. Doğru hissettirecek mecrada izleyiciyle buluşur.',
      steps: ['Fikir', 'Görüntü', 'Kurgu', 'His'],
      services: {
        videography: ['Videografi', 'Sanatçılar ve kişisel projeler için konsept odaklı hareketli görüntüler.'],
        photography: ['Fotoğraf', 'Atmosfer, insan ve mekân etrafında şekillenen portreler ve görsel hikâyeler.'],
        illustration: ['İllüstrasyon Tasarım', 'İlk fikirden son esere, illüstre edilmiş ve tasarlanmış görseller.'],
      },
    },
    about: {
      eyebrow: '03 / HAKKIMDA',
      title: ['ARDA KURUCU', 'GÖRSEL YARATICI.'],
      body: [
        'Arda, İstanbul’da yaşayan; video, fotoğraf ve kurgu alanlarında çalışan bir görsel yaratıcı. Odağında görsel dil ve benzersiz tarz var. Her projede kendine has hikayeyi, görüntüyü ve ritmi bulmak asıl hedefi.',
        'Bu portfolyo, kişisel bir şey üreten insanlarla—özellikle bağımsız sanatçılar ve bireylerle—iş birliği için tasarlandı.',
      ],
      facts: ['KONUM / İSTANBUL', 'ÇALIŞMA / PROJE BAZLI'],
    },
    contact: {
      eyebrow: '04 / İLETİŞİM',
      title: [['BİR ', 'FİKRİN', ' Mİ VAR?'], ['HADİ ', 'GÖRSELE', ' DÖKELİM.']],
      start: 'Arda ile bir proje başlat',
      prompt: 'Fikrini, formatı, konumunu ve ne zaman çekmek istediğini anlat.',
      save: 'Bilgilerimi kaydet',
      card: 'DİJİTAL KART',
      role: 'GÖRSEL YARATICI / İSTANBUL',
      top: 'BAŞA DÖN',
    },
    dialog: {
      project: 'PROJE',
      share: 'PAYLAŞ',
      copied: 'LİNK KOPYALANDI',
      close: 'KAPAT',
      videos: (count) => `${count} VİDEO`,
      role: 'Rol',
      year: 'Yıl',
      status: 'Durum',
      previous: 'ÖNCEKİ',
      next: 'SONRAKİ',
      shareTitle: (title) => `${title} — Arda Kurucu`,
    },
    photos: {
      selection: (title) => `${title} fotoğraf seçkisi`,
      open: (n, total) => `${total} fotoğraftan ${n}. fotoğrafı aç`,
      image: (title, n) => `${title}, seçilmiş fotoğraf ${n}`,
      photo: (title, n, total) => `${title} — fotoğraf ${n} / ${total}`,
      previous: 'Önceki fotoğraf',
      next: 'Sonraki fotoğraf',
    },
    video: {play: 'Oynat', pause: 'Duraklat', seek: 'Sar', mute: 'Sesi kapat', unmute: 'Sesi aç', full: 'Tam ekran', exitFull: 'Tam ekrandan çık'},
    story: {
      eyebrow: 'HİZMET HİKÂYESİ',
      stages: 'Hikâye aşamaları',
      swipe: 'KAYDIR', swipeBack: 'DÖNMEK İÇİN KAYDIR', scroll: 'KAYDIR', scrollBack: 'DÖNMEK İÇİN KAYDIR', back: 'DÖN',
      steps: {
        videography: [['Fikir', 'Brief ve moodboard'], ['Görüntü', 'Sette, kayıt sürüyor'], ['Kurgu', 'Kesme, ritim ve renk'], ['His', 'Ekrana ulaştı']],
        photography: [['Fikir', 'Brief ve moodboard'], ['Görüntü', 'Çekim'], ['Kurgu', 'Seçim ve işleme'], ['His', 'Paylaşıldı ve görüldü']],
        illustration: [['Fikir', 'Brief ve moodboard'], ['Üretim', 'Ekranda şekillendi'], ['His', 'Müşteriye teslim edildi']],
      },
    },
  },
};

// Turkish project texts, by slug. Titles that are names stay as they are.
const projectsTr = {
  'society-istikbal': {
    genre: 'Reklam / Kamera Arkası', role: 'Video / Kurgu', label: 'VİDEO / KAMERA ARKASI',
    videos: ['Kamera arkası I', 'Kamera arkası II'],
    alt: 'Mobilyalı bir odada ekip ve oyuncularla aydınlık bir reklam seti',
    summary: 'İstikbal × Society reklam filminin kamera arkası—parlak bir görüntüyle set enerjisini dengeleyen, sıcak ve gün ışıklı bir set.',
  },
  'tanabay-sasha': {
    genre: 'Düğün Öncesi Film / Portre', role: 'Video / Kurgu / Fotoğraf', label: 'VİDEO / DÜĞÜN ÖNCESİ',
    alt: 'Beyaz sabahlıklı gelin, balkondan Boğaz’a bakıyor',
    summary: 'Tanabay ve Sasha için iki düğün öncesi film—yumuşak sabah ışığı, Boğaz ve küçük jestler.',
  },
  'sapanca-26': {
    genre: 'Seyahat Kurgusu / Müzik', role: 'Video / Kurgu', label: 'VİDEO / KURGU',
    videos: ['Kurgu', 'Teaser'],
    status: 'Portfolyoda kullanımı onaylandı · kişisel proje',
    alt: 'Sapanca’da bir hafta sonu, açık havada bir masanın etrafında toplanmış arkadaşlar',
    summary: 'Sapanca’da arkadaşlarla geçen bir kış hafta sonunun müzik odaklı kurgusu—mutfak kaosu, havuz başı ışığı ve ritme göre kesilmiş geç geceler.',
  },
  vasiyet: {
    genre: 'Kısa Film', role: 'Senarist / Yönetmen, Nafiz Can Yazıcıoğlu ile', label: 'VİDEO / KISA FİLM',
    videos: ['Fragman', 'Kamera arkası I', 'Kamera arkası II'],
    alt: 'vasiyet. kısa filminden bir kare: orman yolunun kenarında bir arabanın yanında duran iki adam.',
    summary: 'Arda Kurucu ve Nafiz Can Yazıcıoğlu’nun yazıp yönettiği kısa film—fragman ve kamera arkasından iki bakış.',
  },
  calkala: {
    genre: 'Müzik / Stüdyo Kaydı', role: 'Video / Kurgu', label: 'VİDEO / STÜDYO KAYDI',
    videos: ['Stüdyo kaydı'],
    alt: 'Karanlık bir odada stüdyo monitöründe parlayan Çalkala yazısı',
    summary: 'Çalkala için bir stüdyo kaydı—canlı başlık tasarımı, loş stüdyo ışığı ve müziğe göre akan tempo.',
  },
  'lubemak-lounge': {
    genre: 'Tanıtım Filmi / Spor', role: 'Video / Kurgu', label: 'VİDEO / TANITIM',
    videos: ['Tanıtım filmi', 'Lounge turu'],
    alt: 'Lubemak Lounge’da ışıklı, çıtalı bir duvarda 1907 arması',
    summary: 'Fenerbahçe Chobani Stadyumu’nun 1907 tribünündeki Lubemak Lounge için tanıtım filmleri—taraftarlar, aileler ve maç günü atmosferi. Lyro Digital iş birliğiyle.',
  },
  dance: {
    title: 'Dans', lang: 'tr',
    genre: 'Dans Sporu / Performans', role: 'Fotoğraf', label: 'FOTOĞRAF / DANS SPORU',
    alt: 'Kırmızı kostümlü bir dansçı, performansın tam ortasında',
    summary: 'Standart ve Latin dans yarışmaları—METU Open, METU Cup, Can Cup, Ankara Open, Türkiye Şampiyonası ve Batum Ten Dance Dünya Kupası—hareket, ifade ve anın yapısına odaklanarak.',
  },
  'city-sights': {
    title: 'Şehir manzaraları', lang: 'tr',
    genre: 'Kent / Renk Çalışmaları', role: 'Fotoğraf', label: 'FOTOĞRAF / ŞEHİR VE RENK',
    alt: 'Gri bir akşam gökyüzünde asılı duran büyük, yanardöner bir sabun köpüğü',
    summary: 'Şehir ışığı, tuhaf ölçekler ve kaçıp giden detaylar—doygun gece sokaklarından sakin gün ışığı renk çalışmalarına.',
  },
  portraits: {
    title: 'Portreler', lang: 'tr',
    genre: 'Editoryal / Stüdyo Portre', role: 'Fotoğraf / Işık', label: 'FOTOĞRAF / PORTRE',
    alt: 'Yumuşak ışıklı bir restoran masasında kitap okuyan bir kadının editoryal portresi',
    summary: 'Mimari, yönlü ışık ve sakin bir atmosferle şekillenen editoryal ve stüdyo portreleri—kişisel ama sıradan değil.',
  },
  tennis: {
    title: 'Tenis', lang: 'tr',
    genre: 'Spor / Tenis', role: 'Fotoğraf', label: 'FOTOĞRAF / SPOR',
    alt: 'Toprak kortta bir tenisçi, karenin üzerinde FOCUS yazısı',
    summary: 'Zamanlama, kortun grafik çizgileri ve canlı bir maçın fiziksel konsantrasyonu üzerine kurulu tenis fotoğrafları.',
  },
  'generative-poster-studies': {
    title: 'Üretken Afiş Çalışmaları', lang: 'tr',
    genre: 'Yapay Zekâ Görseli / Sanat Yönetimi', role: 'Konsept / Prompt Yönetimi / Sanat Yönetimi', label: 'YAPAY ZEKÂ / BELİRTİLDİ',
    status: 'Yapay zekâ ile üretildi · süreç açıkça belirtildi',
    alt: 'Kırmızı ve camgöbeği siluetli, Focus on Her başlıklı, yapay zekâ ile üretilmiş sinematik afiş',
    summary: 'Sinematik ışık, gren, bölünmüş görüntü ve dar başlık harfleriyle etkileyici italik yazı arasındaki gerilimi keşfeden altı üretken afiş çalışması.',
  },
};
const typeTr = {Video: 'Video', Photography: 'Fotoğraf', 'AI / Generative': 'Yapay Zekâ / Üretken'};
const statusTr = {'Public portfolio use confirmed': 'Portfolyoda kullanımı onaylandı'};

/** Project list in the given language. `type` stays English (filters use it); show `typeLabel`. */
export function localizeProjects(projects, lang) {
  return projects.map((project) => {
    if (lang !== 'tr') return {...project, typeLabel: project.type};
    const tr = projectsTr[project.slug] || {};
    const {videos: videoTitles, ...fields} = tr;
    return {
      ...project,
      ...fields,
      typeLabel: typeTr[project.type] || project.type,
      status: tr.status || statusTr[project.status] || project.status,
      videos: project.videos?.map((clip, index) => ({...clip, title: videoTitles?.[index] || clip.title})),
    };
  });
}

export const LangContext = createContext({lang: 'en', t: ui.en, setLang: () => {}});
export const useLang = () => useContext(LangContext);
