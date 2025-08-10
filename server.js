const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const cron = require('node-cron');
const path = require('path');

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Haber verileri için bellek içi depolama
let haberler = [];

// Kategori belirleme fonksiyonu
function kategoriBelirle(metin) {
    const text = metin.toLowerCase();
    
    // Spor
    if (text.includes('futbol') || text.includes('basketbol') || text.includes('spor') || 
        text.includes('maç') || text.includes('takım') || text.includes('galatasaray') || 
        text.includes('fenerbahçe') || text.includes('beşiktaş') || text.includes('trabzonspor') ||
        text.includes('liga') || text.includes('şampiyonlar') || text.includes('uefa')) {
        return { name: 'Spor', color: '#e74c3c', icon: 'fa-futbol' };
    }
    
    // Politika
    if (text.includes('başkan') || text.includes('hükümet') || text.includes('parti') || 
        text.includes('seçim') || text.includes('meclis') || text.includes('erdoğan') ||
        text.includes('politika') || text.includes('bakanl') || text.includes('milletvekil') ||
        text.includes('chp') || text.includes('akp') || text.includes('mhp')) {
        return { name: 'Politika', color: '#3498db', icon: 'fa-landmark' };
    }
    
    // Ekonomi
    if (text.includes('ekonomi') || text.includes('dolar') || text.includes('euro') || 
        text.includes('borsa') || text.includes('faiz') || text.includes('enflasyon') ||
        text.includes('tl') || text.includes('merkez bankası') || text.includes('altın') ||
        text.includes('yatırım') || text.includes('büyüme')) {
        return { name: 'Ekonomi', color: '#f39c12', icon: 'fa-chart-line' };
    }
    
    // Teknoloji
    if (text.includes('teknoloji') || text.includes('yapay zeka') || text.includes('internet') || 
        text.includes('telefon') || text.includes('uygulama') || text.includes('dijital') ||
        text.includes('siber') || text.includes('yazılım') || text.includes('apple') ||
        text.includes('google') || text.includes('microsoft')) {
        return { name: 'Teknoloji', color: '#9b59b6', icon: 'fa-microchip' };
    }
    
    // Sağlık
    if (text.includes('sağlık') || text.includes('hastane') || text.includes('doktor') || 
        text.includes('covid') || text.includes('aşı') || text.includes('tıp') ||
        text.includes('hastalık') || text.includes('tedavi') || text.includes('ilaç')) {
        return { name: 'Sağlık', color: '#27ae60', icon: 'fa-heartbeat' };
    }
    
    // Eğitim
    if (text.includes('eğitim') || text.includes('okul') || text.includes('üniversite') || 
        text.includes('öğrenci') || text.includes('öğretmen') || text.includes('sınav') ||
        text.includes('yks') || text.includes('lgs') || text.includes('meb')) {
        return { name: 'Eğitim', color: '#e67e22', icon: 'fa-graduation-cap' };
    }
    
    // Güvenlik
    if (text.includes('polis') || text.includes('asker') || text.includes('güvenlik') || 
        text.includes('terör') || text.includes('operasyon') || text.includes('tsk') ||
        text.includes('emniyet') || text.includes('jandarma')) {
        return { name: 'Güvenlik', color: '#34495e', icon: 'fa-shield-alt' };
    }
    
    // Hava Durumu/Doğa
    if (text.includes('hava') || text.includes('sıcaklık') || text.includes('yağmur') || 
        text.includes('kar') || text.includes('fırtına') || text.includes('deprem') ||
        text.includes('meteoroloji') || text.includes('sel') || text.includes('yangın')) {
        return { name: 'Hava & Doğa', color: '#1abc9c', icon: 'fa-cloud-sun' };
    }
    
    // Magazin
    if (text.includes('magazin') || text.includes('ünlü') || text.includes('sanatçı') || 
        text.includes('oyuncu') || text.includes('şarkıcı') || text.includes('dizi') ||
        text.includes('aşk') || text.includes('evlilik') || text.includes('boşanma') ||
        text.includes('sosyal medya') || text.includes('instagram') || text.includes('twitter') ||
        text.includes('nişan') || text.includes('düğün') || text.includes('ilişki')) {
        return { name: 'Magazin', color: '#ff6b9d', icon: 'fa-star' };
    }
    
    // Dünya
    if (text.includes('dünya') || text.includes('amerika') || text.includes('avrupa') || 
        text.includes('rusya') || text.includes('çin') || text.includes('almanya') ||
        text.includes('fransa') || text.includes('ukrayna') || text.includes('suriye') ||
        text.includes('uluslararası') || text.includes('nato') || text.includes('ab') ||
        text.includes('biden') || text.includes('putin') || text.includes('trump')) {
        return { name: 'Dünya', color: '#607d8b', icon: 'fa-globe' };
    }
    
    // Kültür/Sanat
    if (text.includes('film') || text.includes('müzik') || text.includes('sanat') || 
        text.includes('kitap') || text.includes('tiyatro') || text.includes('festival') ||
        text.includes('sinema') || text.includes('konser') || text.includes('sergi') ||
        text.includes('müze') || text.includes('tarih') || text.includes('arkeoloji')) {
        return { name: 'Kültür & Sanat', color: '#e91e63', icon: 'fa-palette' };
    }
    
    // Varsayılan - Genel Haberler
    return { name: 'Genel', color: '#95a5a6', icon: 'fa-newspaper' };
}

// Özet kalitesini iyileştiren fonksiyon
function iyiOzetOlustur(ozet, baslik) {
    if (!ozet || ozet.trim().length === 0) {
        return baslik ? `${baslik}. Haber detayları için devamını okuyun.` : '';
    }
    
    // Başlık ile özet aynıysa, sadece özeti döndür
    if (ozet.toLowerCase().includes(baslik?.toLowerCase() || '')) {
        // Başlığı özetten çıkar
        const baslikTemizlenmis = baslik?.toLowerCase().replace(/[^\w\s]/g, '') || '';
        if (baslikTemizlenmis.length > 10) {
            ozet = ozet.replace(new RegExp(baslikTemizlenmis, 'gi'), '').trim();
        }
    }
    
    // Özeti cümleler halinde böl
    let cumleler = ozet.split(/[.!?]+/).filter(cumle => cumle.trim().length > 10);
    
    if (cumleler.length === 0) {
        return baslik ? `${baslik}. Haber detayları için devamını okuyun.` : '';
    }
    
    // İlk cümle çok kısaysa ve başlık varsa, başlığı ekle
    if (cumleler[0].trim().length < 50 && baslik && !cumleler[0].toLowerCase().includes(baslik.toLowerCase())) {
        cumleler[0] = baslik + '. ' + cumleler[0].trim();
    }
    
    // Cümleleri birleştir ve noktalama düzelt
    let iyiOzet = cumleler.join('. ').trim();
    
    // Son nokta kontrolü
    if (!iyiOzet.endsWith('.') && !iyiOzet.endsWith('!') && !iyiOzet.endsWith('?')) {
        iyiOzet += '.';
    }
    
    // Çok tekrarlanan kelimeleri temizle
    iyiOzet = iyiOzet.replace(/\b(\w+)\s+\1\b/gi, '$1'); // Tekrarlanan kelimeleri kaldır
    
    return iyiOzet;
}

// RSS kaynaklarını tanımla - Çeşitli kategorilerden
const rssKaynaklar = [
    // Genel Haberler
    'https://www.bbc.com/turkce/index.xml',
    'https://www.ntv.com.tr/gundem.rss',
    'https://www.cnnturk.com/feed/rss/all/news',
    'https://www.hurriyet.com.tr/rss/gundem',
    'https://www.sabah.com.tr/rss/gundem.xml',
    'https://www.haberturk.com/rss',
    'https://www.milliyet.com.tr/rss/rssnew/gundemrss.xml',
    'https://www.sozcu.com.tr/feed/',
    
    // Ekonomi
    'https://www.hurriyet.com.tr/rss/ekonomi',
    'https://www.ntv.com.tr/ekonomi.rss',
    'https://www.cnnturk.com/feed/rss/ekonomi',
    'https://www.haberturk.com/ekonomi/rss',
    
    // Teknoloji
    'https://www.ntv.com.tr/teknoloji.rss',
    'https://www.hurriyet.com.tr/rss/teknoloji',
    'https://www.haberturk.com/teknoloji/rss',
    'https://www.sabah.com.tr/rss/teknoloji.xml',
    
    // Spor
    'https://www.hurriyet.com.tr/rss/spor',
    'https://www.ntv.com.tr/spor.rss',
    'https://www.haberturk.com/spor/rss',
    'https://www.sabah.com.tr/rss/spor.xml',
    
    // Magazin
    'https://www.hurriyet.com.tr/rss/magazin',
    'https://www.sabah.com.tr/rss/magazin.xml',
    'https://www.haberturk.com/magazin/rss',
    
    // Sağlık
    'https://www.hurriyet.com.tr/rss/saglik',
    'https://www.ntv.com.tr/saglik.rss',
    'https://www.sabah.com.tr/rss/saglik.xml',
    
    // Eğitim
    'https://www.hurriyet.com.tr/rss/egitim',
    'https://www.ntv.com.tr/egitim.rss',
    
    // Dünya
    'https://www.hurriyet.com.tr/rss/dunya',
    'https://www.ntv.com.tr/dunya.rss',
    'https://www.cnnturk.com/feed/rss/dunya',
    
    // Kültür & Sanat
    'https://www.hurriyet.com.tr/rss/kultur-sanat',
    'https://www.sabah.com.tr/rss/kultur.xml'
];

// RSS'den haberleri çek
async function haberleriCek() {
    console.log('Haberler güncelleniyor...');
    const tumHaberler = [];

    // 3 gün öncesine kadar olan haberleri filtrele
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    for (const rssUrl of rssKaynaklar) {
        try {
            const feed = await parser.parseURL(rssUrl);
            console.log(`${feed.title} - ${feed.items.length} haber bulundu`);
            
            // Sadece son 3 gün içindeki haberleri al
            const recentItems = feed.items.filter(item => {
                const itemDate = new Date(item.pubDate || item.isoDate || Date.now());
                return itemDate >= threeDaysAgo;
            });
            
            console.log(`${feed.title} - ${recentItems.length} güncel haber (son 3 gün)`);
            
            recentItems.slice(0, 15).forEach(item => {
                // Daha detaylı haber özeti oluştur
                let ozet = '';
                
                // Önce content'i dene (genellikle en detaylı)
                if (item.content) {
                    ozet = item.content;
                } else if (item.contentSnippet) {
                    ozet = item.contentSnippet;
                } else if (item.description) {
                    ozet = item.description;
                } else if (item.summary) {
                    ozet = item.summary;
                }
                
                // HTML taglerini kaldır ve temizle
                ozet = ozet.replace(/<[^>]*>/g, ''); // HTML taglerini kaldır
                ozet = ozet.replace(/&[^;]+;/g, ' '); // HTML entity'lerini temizle
                ozet = ozet.replace(/\s+/g, ' '); // Çoklu boşlukları tek boşluk yap
                
                // Gereksiz ifadeleri temizle
                ozet = ozet.replace(/Devamı için tıklayın/gi, '');
                ozet = ozet.replace(/Haberin devamı/gi, '');
                ozet = ozet.replace(/Kaynak:/gi, '');
                ozet = ozet.replace(/\[.*?\]/g, ''); // Köşeli parantez içindeki ifadeleri kaldır
                ozet = ozet.replace(/\(.*?\)/g, ''); // Parantez içindeki kısa ifadeleri kaldır (ama uzun açıklamaları koru)
                
                // Tekrarlanan noktalama işaretlerini düzelt
                ozet = ozet.replace(/\.{2,}/g, '.');
                ozet = ozet.replace(/,{2,}/g, ',');
                ozet = ozet.replace(/;{2,}/g, ';');
                
                ozet = ozet.trim(); // Baş ve sondaki boşlukları kaldır
                
                // Eğer hala çok kısa ise, başlığı da ekle ve genişlet
                if (ozet.length < 200 && item.title) {
                    // Başlık zaten özette varsa ekleme
                    if (!ozet.toLowerCase().includes(item.title.toLowerCase().substring(0, 20))) {
                        ozet = item.title + '. ' + ozet;
                    }
                    
                    // Hala çok kısaysa, açıklayıcı metin ekle
                    if (ozet.length < 150) {
                        ozet += ` Bu haberin detaylarına "Devamını Oku" butonundan ulaşabilirsiniz.`;
                    }
                }
                
                // Özet kalitesini iyileştir
                ozet = iyiOzetOlustur(ozet, item.title);
                
                // Daha uzun özet (maksimum 600 karakter - okunabilir uzunluk)
                if (ozet.length > 600) {
                    // Cümle sonunda kes
                    let cutPoint = ozet.lastIndexOf('.', 600);
                    if (cutPoint === -1 || cutPoint < 300) {
                        cutPoint = ozet.lastIndexOf(' ', 600);
                    }
                    ozet = ozet.substring(0, cutPoint > 0 ? cutPoint : 600);
                    
                    // Son karakterin nokta olup olmadığını kontrol et
                    if (!ozet.endsWith('.') && !ozet.endsWith('!') && !ozet.endsWith('?')) {
                        ozet += '...';
                    }
                }
                
                // Minimum uzunluk kontrolü - daha uzun özetler için
                if (ozet.length < 120) {
                    ozet = `${item.title}. Bu önemli haber hakkında daha fazla ayrıntı ve güncel gelişmeler için "Devamını Oku" butonuna tıklayabilirsiniz.`;
                }

                // Kategori belirle
                const kategori = kategoriBelirle(item.title + ' ' + ozet);

                tumHaberler.push({
                    id: Date.now() + Math.random(),
                    baslik: item.title,
                    ozet: ozet,
                    link: item.link,
                    tarih: new Date(item.pubDate || Date.now()),
                    kaynak: feed.title || 'Bilinmeyen Kaynak',
                    kategori: kategori
                });
            });
        } catch (error) {
            console.error(`RSS kaynağı okuma hatası (${rssUrl}):`, error.message);
        }
    }

    // Haberleri tarihe göre sırala (en yeni önce) - sınırsız
    haberler = tumHaberler
        .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

    console.log(`${haberler.length} haber güncellendi`);
}

// API endpoint'leri
app.get('/api/haberler', (req, res) => {
    const kategori = req.query.kategori;
    
    if (kategori && kategori !== 'Tümü') {
        const filtrelenmisHaberler = haberler.filter(haber => haber.kategori.name === kategori);
        res.json(filtrelenmisHaberler);
    } else {
        res.json(haberler);
    }
});

// Kategorileri getir
app.get('/api/kategoriler', (req, res) => {
    const kategoriler = [...new Set(haberler.map(haber => haber.kategori.name))];
    const kategoriListesi = kategoriler.map(kategoriAdi => {
        const ornekHaber = haberler.find(haber => haber.kategori.name === kategoriAdi);
        return {
            name: kategoriAdi,
            color: ornekHaber.kategori.color,
            icon: ornekHaber.kategori.icon,
            count: haberler.filter(haber => haber.kategori.name === kategoriAdi).length
        };
    });
    
    // "Tümü" kategorisini başa ekle
    kategoriListesi.unshift({
        name: 'Tümü',
        color: '#2c3e50',
        icon: 'fa-th-large',
        count: haberler.length
    });
    
    res.json(kategoriListesi);
});

// API endpoint - Haberleri manuel güncelle
app.get('/api/yenile', async (req, res) => {
    try {
        console.log('Manuel haber güncelleme başlatıldı...');
        await haberleriCek();
        res.json({ 
            success: true, 
            message: 'Haberler başarıyla güncellendi',
            count: haberler.length 
        });
    } catch (error) {
        console.error('Manuel güncelleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Haber güncelleme sırasında hata oluştu' 
        });
    }
});

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// İlk başta haberleri çek
haberleriCek();

// Her 15 dakikada bir haberleri güncelle
cron.schedule('*/15 * * * *', () => {
    haberleriCek();
});

app.listen(PORT, () => {
    console.log(`Kısa Gündem sunucusu ${PORT} portunda çalışıyor`);
    console.log(`Web sitesi: http://localhost:${PORT}`);
});
