# Katkı Sağlama Rehberi 🤝

Kısa Gündem projesine katkıda bulunmak istediğiniz için teşekkürler! Bu rehber size nasıl katkı sağlayabileceğinizi gösterecek.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Git

### Kurulum
```bash
git clone https://github.com/erent8/KisaGundem.git
cd KisaGundem
npm install
npm start
```

## 📋 Katkı Türleri

### 🐛 Bug Raporu
- Hatayı detaylı açıklayın
- Yeniden üretme adımlarını ekleyin
- Ekran görüntüsü/video ekleyin
- Tarayıcı ve işletim sistemi bilgisi verin

### 💡 Özellik Önerisi
- Özelliği detaylı tanımlayın
- Neden gerekli olduğunu açıklayın
- Mockup/wireframe ekleyin (varsa)
- Benzer örnekleri paylaşın

### 💻 Kod Katkısı
- .cursorrules dosyasını okuyun
- Kod standartlarına uyun
- Test yazın
- Dokümantasyon güncelleyin

## 🔧 Geliştirme Süreci

### Branch Stratejisi
```bash
main        # Production branch
develop     # Development branch
feature/*   # Yeni özellikler
bugfix/*    # Hata düzeltmeleri
hotfix/*    # Acil düzeltmeler
```

### Commit Mesajları
```bash
feat: yeni özellik ekleme
fix: hata düzeltme
docs: dokümantasyon değişikliği
style: kod formatı (mantık değişikliği yok)
refactor: kod iyileştirme
test: test ekleme/düzeltme
chore: build process veya yardımcı araçlar
```

### PR (Pull Request) Süreci
1. **Fork** yapın
2. **Feature branch** oluşturun
3. **Değişikliklerinizi** yapın
4. **Test** edin
5. **PR** açın

## 📝 Kod Standartları

### JavaScript
```javascript
// ✅ Doğru
const haberBaslik = 'Örnek başlık';
const haberleriGetir = async () => {
    try {
        const response = await fetch('/api/haberler');
        return await response.json();
    } catch (error) {
        console.error('Hata:', error);
    }
};

// ❌ Yanlış
var haber_baslik = 'Örnek başlık';
function haberleriGetir() {
    return fetch('/api/haberler').then(response => {
        return response.json();
    });
}
```

### CSS
```css
/* ✅ Doğru */
.news-card {
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
}

[data-theme="dark"] .news-card {
    background: #2d2d2d;
}

/* ❌ Yanlış */
.newsCard {
    display: block;
}
```

## 🧪 Test Etme

### Manuel Test Checklist
- [ ] Tüm kategoriler çalışıyor
- [ ] Arama fonksiyonu doğru
- [ ] Dark mode geçişi sorunsuz
- [ ] Klavye kısayolları aktif
- [ ] Mobil responsive
- [ ] PWA kurulumu çalışıyor

### Tarayıcı Testi
- Chrome (son 2 versiyon)
- Firefox (son 2 versiyon)
- Safari (son 2 versiyon)
- Edge (son 2 versiyon)

### Cihaz Testi
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 414x896)

## 📚 Dokümantasyon

### README Güncellemeleri
- Yeni özellikler için kullanım örnekleri
- Kurulum adımlarını güncel tutun
- Ekran görüntüleri ekleyin

### Kod Dokümantasyonu
```javascript
/**
 * Haberleri kategoriye göre filtreler
 * @param {Array} haberler - Tüm haberler listesi
 * @param {string} kategori - Filtre uygulanacak kategori
 * @returns {Array} Filtrelenmiş haberler
 */
function haberleriFiltrele(haberler, kategori) {
    // Implementasyon
}
```

## 🎨 Design Katkısı

### UI/UX İyileştirmeleri
- Figma/Adobe XD tasarımları
- Kullanıcı deneyimi önerileri
- Accessibility iyileştirmeleri
- Responsive design önerileri

### Asset Katkısı
- İkonlar (SVG format)
- İllüstrasyonlar
- Animasyonlar
- Ses efektleri

## 🌍 Çeviri Katkısı

### Desteklenen Diller
- 🇹🇷 Türkçe (ana dil)
- 🇺🇸 İngilizce (planlanan)
- 🇩🇪 Almanca (planlanan)
- 🇫🇷 Fransızca (planlanan)

### Çeviri Süreci
1. `i18n/tr.json` dosyasını inceleyin
2. Yeni dil dosyası oluşturun
3. Tüm metinleri çevirin
4. Context'e uygun çeviri yapın

## 🏆 Katkıda Bulunanlar

### Tanınma Sistemi
- README'de isim/avatar
- Contributors sayfası
- Commit history
- Special mentions

### Roller
- **Core Maintainer**: Proje yöneticisi
- **Contributor**: Düzenli katkı sağlayan
- **Community Helper**: Destek sağlayan
- **Translator**: Çeviri yapan

## 📞 İletişim

### Destek Kanalları
- **GitHub Issues**: Bug report ve feature request
- **Discussions**: Genel tartışmalar
- **Email**: [erenterzi@protonmail.com

### Topluluk Kuralları
- Saygılı ve yapıcı olun
- Başkalarının fikirlerine açık olun
- Yardımlaşmayı teşvik edin
- Spam yapmayın

## 📋 Issue Templates

### Bug Report Template
```markdown
**Bug Açıklaması**
Hatayı kısa ve net açıklayın.

**Yeniden Üretme Adımları**
1. '...' sayfasına gidin
2. '...' butonuna tıklayın
3. Aşağı kaydırın
4. Hatayı görün

**Beklenen Davranış**
Ne olmasını bekliyordunuz?

**Ekran Görüntüleri**
Varsa ekran görüntüsü ekleyin.

**Ortam Bilgileri**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
```

### Feature Request Template
```markdown
**Özellik Açıklaması**
Hangi özelliği istiyorsunuz?

**Motivasyon**
Bu özellik neden gerekli?

**Detaylar**
Özelliğin nasıl çalışmasını istiyorsunuz?

**Alternatifler**
Başka hangi çözümleri düşündünüz?
```

## 🎯 Gelecek Planları

### Yakın Gelecek
- React/Vue.js migration
- Mobile app (React Native)
- API documentation
- Automated testing

### Uzun Vadeli
- Microservices architecture
- Machine learning integration
- Multi-language support
- Enterprise features

---

**Katkılarınız için şimdiden teşekkürler! 🙏**

Bu proje açık kaynak topluluğunun gücüyle büyüyor. Her türlü katkı değerlidir - kod yazmaktan dokümantasyon güncellemesine, bug raporundan özellik önerisine kadar.
