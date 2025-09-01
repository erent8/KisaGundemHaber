class KisaGundem {
    constructor() {
        this.haberler = [];
        this.tumHaberler = []; // Arama için orijinal liste
        this.kategoriler = [];
        this.aktifKategori = 'Tümü';
        this.aktifIndex = 0;
        this.yukleniyor = false;
        this.aramaMetni = '';
        this.autoScrollSpeed = 0; // Başlangıçta kapalı
        this.autoScrollEnabled = false; // Açık/kapalı durumu
        
        // Basitleştirilmiş ayarlar
        this.settings = {
            fontSize: 'medium',
            autoScrollSpeed: 0,
            viewMode: 'comfortable',
            colorTheme: 'default'
        };
        
        // Favoriler sistemi
        this.favorites = JSON.parse(localStorage.getItem('kisaGundemFavorites') || '[]');
        
        this.initializeElements();
        // Dark mode kaldırıldı
        this.initializeSettings(); // Ayarları önce yükle
        this.setupEventListeners();
        this.updateFavoritesCount(); // İlk yüklemede favori sayısını göster
        this.kategorileriYukle();
        this.haberleriYukle();
        
        // Otomatik kaydırma için timer
        this.autoScrollTimer = null;
        // Otomatik başlatma YOK - sadece ayarlar yüklendikten sonra kontrol et
    }

    initializeElements() {
        this.mainContent = document.getElementById('mainContent');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.newsContainer = document.getElementById('newsContainer');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.currentIndexEl = document.getElementById('currentIndex');
        this.totalNewsEl = document.getElementById('totalNews');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        // Dark mode toggle kaldırıldı
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.settingsClose = document.getElementById('settingsClose');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.resetSettingsBtn = document.getElementById('resetSettings');
        this.favoritesToggle = document.getElementById('favoritesToggle');
        this.favoritesCount = document.getElementById('favoritesCount');
        this.favoritesPanel = document.getElementById('favoritesPanel');
        this.favoritesClose = document.getElementById('favoritesClose');
        this.favoritesList = document.getElementById('favoritesList');
        this.favoritesEmpty = document.getElementById('favoritesEmpty');
        this.clearAllFavoritesBtn = document.getElementById('clearAllFavorites');
    }

    setupEventListeners() {
        // Kontrol butonları
        this.prevBtn.addEventListener('click', () => this.oncekiHaber());
        this.nextBtn.addEventListener('click', () => this.sonrakiHaber());
        this.refreshBtn.addEventListener('click', () => this.haberleriYenile());

        // Arama sistemi
        this.searchInput.addEventListener('input', (e) => this.aramaYap(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.aramaTemizle());

        // Dark mode toggle kaldırıldı

        // Settings panel
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.settingsClose.addEventListener('click', () => this.closeSettings());
        
        // Modal dışına tıklayınca kapat
        this.settingsPanel.addEventListener('click', (e) => {
            if (e.target === this.settingsPanel) {
                this.closeSettings();
            }
        });

        // Settings options - sadece temel ayarlar
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSetting('fontSize', e.target.dataset.size));
        });

        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSetting('autoScrollSpeed', parseInt(e.target.dataset.speed)));
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSetting('viewMode', e.target.dataset.view));
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSetting('colorTheme', e.target.dataset.theme));
        });

        // Kaydet ve sıfırla butonları
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());

        // Favoriler butonu
        this.favoritesToggle.addEventListener('click', () => this.showFavorites());
        this.favoritesClose.addEventListener('click', () => this.closeFavorites());
        this.clearAllFavoritesBtn.addEventListener('click', () => this.clearAllFavorites());
        
        // Modal dışına tıklayınca kapatma
        this.favoritesPanel.addEventListener('click', (e) => {
            if (e.target === this.favoritesPanel) {
                this.closeFavorites();
            }
        });

        // Klavye kontrolleri
        document.addEventListener('keydown', (e) => {
            // Arama kutusunda yazarken kısayolları devre dışı bırak
            if (e.target === this.searchInput) return;

            switch(e.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                case 'k':
                case 'K':
                    e.preventDefault();
                    this.oncekiHaber();
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                case 'j':
                case 'J':
                case ' ':
                    e.preventDefault();
                    this.sonrakiHaber();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    this.haberleriYenile();
                    break;
                case '/':
                    e.preventDefault();
                    this.searchInput.focus();
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (this.favoritesPanel.classList.contains('open')) {
                        this.closeFavorites();
                    } else if (this.settingsPanel.classList.contains('open')) {
                        this.closeSettings();
                    } else if (this.aramaMetni) {
                        this.aramaTemizle();
                        this.searchInput.blur();
                    }
                    break;
                // Dark mode kaldırıldı
                case 's':
                case 'S':
                    e.preventDefault();
                    this.toggleSettings();
                    break;
            }
        });

        // Touch/Swipe kontrolleri
        let startY = 0;
        let startTime = 0;

        this.newsContainer.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
            this.stopAutoScroll(); // Dokunma sırasında otomatik kaydırmayı durdur
        }, { passive: true });

        this.newsContainer.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            const deltaY = startY - endY;
            const deltaTime = endTime - startTime;

            // Minimum mesafe ve maksimum süre kontrolü
            if (Math.abs(deltaY) > 50 && deltaTime < 300) {
                if (deltaY > 0) {
                    this.sonrakiHaber(); // Yukarı kaydır -> sonraki haber
                } else {
                    this.oncekiHaber(); // Aşağı kaydır -> önceki haber
                }
            }
            
            // Dokunma bitince otomatik kaydırmayı başlat (sadece açıksa)
            if (this.autoScrollEnabled) {
                this.startAutoScroll();
            }
        }, { passive: true });

        // Mouse wheel kontrolü
        this.newsContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.stopAutoScroll();
            
            if (e.deltaY > 0) {
                this.sonrakiHaber();
            } else {
                this.oncekiHaber();
            }
            
            // Biraz bekleyip otomatik kaydırmayı başlat (sadece açıksa)
            clearTimeout(this.wheelTimeout);
            this.wheelTimeout = setTimeout(() => {
                if (this.autoScrollEnabled) {
                    this.startAutoScroll();
                }
            }, 3000);
        }, { passive: false });

        // Sayfa görünürlük değişikliği
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoScroll();
            } else if (this.autoScrollEnabled) {
                this.startAutoScroll();
            }
        });
    }

    async kategorileriYukle() {
        try {
            const response = await fetch('/api/kategoriler');
            if (response.ok) {
                this.kategoriler = await response.json();
                this.kategorileriRender();
            }
        } catch (error) {
            console.error('Kategori yükleme hatası:', error);
        }
    }

    async haberleriYukle(kategori = null) {
        try {
            this.yukleniyor = true;
            if (!kategori) {
                this.loadingScreen.style.display = 'flex';
                this.mainContent.setAttribute("aria-busy", true)
            }

            const url = kategori ? `/api/haberler?kategori=${encodeURIComponent(kategori)}` : '/api/haberler';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Haberler yüklenemedi');
            
            this.tumHaberler = await response.json();
            this.haberler = [...this.tumHaberler]; // Kopya oluştur
            this.aktifIndex = 0;
            
            this.haberleriRender();
            this.navigationUpdate();
            this.totalNewsEl.textContent = this.haberler.length;
            
            // Loading ekranını gizle
            if (!kategori) {
                setTimeout(() => {
                    this.loadingScreen.style.display = 'none';
                    this.mainContent.setAttribute("aria-busy", false)
                    this.yukleniyor = false;
                }, 1000);
            } else {
                this.yukleniyor = false;
            }

            // Kategorileri güncelle
            if (!kategori) {
                await this.kategorileriYukle();
            }

        } catch (error) {
            console.error('Haber yükleme hatası:', error);
            if (!kategori) {
                this.loadingScreen.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <p>Haberler yüklenirken hata oluştu</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: white; border: none; border-radius: 5px; cursor: pointer;">Yeniden Dene</button>
                `;
            }
        }
    }

    haberleriRender() {
        // Skeleton loading göster
        if (this.haberler.length === 0) {
            this.showSkeletonLoading();
            return;
        }

        this.newsContainer.innerHTML = '';
        
        this.haberler.forEach((haber, index) => {
            const haberCard = this.createNewsCard(haber, index);
            this.newsContainer.appendChild(haberCard);
        });

        this.updateActiveCard();
    }

    showSkeletonLoading() {
        this.newsContainer.innerHTML = `
            <div class="news-card active">
                <div class="news-content-area">
                    <div class="skeleton skeleton-text" style="width: 40%; height: 0.8rem; margin-bottom: 1rem;"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
        `;
    }

    createNewsCard(haber, index) {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.dataset.index = index;

        const tarih = new Date(haber.tarih);
        const zamanFarki = this.getTimeAgo(tarih);

        // Haber kategorisine göre ikon seç
        const kategoriIkon = this.getKategoriIcon(haber.baslik, haber.ozet);

        const isFavorite = this.isFavorite(haber.id);
        
        card.innerHTML = `
            <div class="news-content-area category-colored" style="border-left-color: ${haber.kategori.color}">
                <div class="news-header">
                    <div class="news-source">${this.highlightSearchText(haber.kaynak)} • ${zamanFarki}</div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-news-id="${haber.id}" title="${isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <h2 class="news-title">${this.highlightSearchText(haber.baslik)}</h2>
                <div class="news-summary">${this.highlightSearchText(haber.ozet)}</div>
                <div class="news-category" style="color: ${haber.kategori.color}">
                    <i class="fas ${haber.kategori.icon}"></i> ${haber.kategori.name}
                </div>
            </div>
            <a href="${haber.link}" target="_blank" class="read-more-btn">
                Devamını Oku <i class="fas fa-external-link-alt"></i>
            </a>
        `;

        // Kategori bilgisini ayarla
        card.dataset.categoryIcon = kategoriIkon;
        
        // Favori butonuna event listener ekle
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(haber);
        });

        return card;
    }

    updateActiveCard() {
        const cards = this.newsContainer.querySelectorAll('.news-card');
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev');
            
            if (index === this.aktifIndex) {
                card.classList.add('active');
            } else if (index < this.aktifIndex) {
                card.classList.add('prev');
            }
        });

        this.updateControls();
    }

    updateControls() {
        this.prevBtn.disabled = this.aktifIndex === 0;
        this.nextBtn.disabled = this.aktifIndex === this.haberler.length - 1;
    }

    navigationUpdate() {
        this.currentIndexEl.textContent = this.aktifIndex + 1;
    }

    oncekiHaber() {
        if (this.aktifIndex > 0) {
            this.aktifIndex--;
            this.updateActiveCard();
            this.navigationUpdate();
            // Sadece otomatik geçiş açıksa yeniden başlat
            if (this.autoScrollEnabled) {
                this.restartAutoScroll();
            }
        }
    }

    sonrakiHaber() {
        if (this.aktifIndex < this.haberler.length - 1) {
            this.aktifIndex++;
            this.updateActiveCard();
            this.navigationUpdate();
            // Sadece otomatik geçiş açıksa yeniden başlat
            if (this.autoScrollEnabled) {
                this.restartAutoScroll();
            }
        }
    }

    kategorileriRender() {
        this.categoryFilter.innerHTML = '';
        
        this.kategoriler.forEach(kategori => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.style.backgroundColor = kategori.color;
            btn.style.borderColor = kategori.color;
            
            if (kategori.name === this.aktifKategori) {
                btn.classList.add('active');
            }
            
            btn.innerHTML = `
                <i class="fas ${kategori.icon}"></i>
                ${kategori.name}
                <span class="category-count">${kategori.count}</span>
            `;
            
            btn.addEventListener('click', () => {
                this.kategoriDegistir(kategori.name);
            });
            
            this.categoryFilter.appendChild(btn);
        });
    }

    async kategoriDegistir(kategori) {
        this.aktifKategori = kategori;
        
        // Aktif kategori butonunu güncelle
        this.categoryFilter.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const aktifBtn = [...this.categoryFilter.querySelectorAll('.category-btn')]
            .find(btn => btn.textContent.includes(kategori));
        if (aktifBtn) {
            aktifBtn.classList.add('active');
        }
        
        // Haberleri filtrele
        await this.haberleriYukle(kategori);
        // Sadece otomatik geçiş açıksa yeniden başlat
        if (this.autoScrollSpeed > 0) {
            this.restartAutoScroll();
        }
    }

    async haberleriYenile() {
        this.refreshBtn.classList.add('spinning');
        await this.haberleriYukle(this.aktifKategori === 'Tümü' ? null : this.aktifKategori);
        setTimeout(() => {
            this.refreshBtn.classList.remove('spinning');
        }, 1000);
    }

    startAutoScroll() {
        this.stopAutoScroll();
        
        // Eğer otomatik kaydırma kapalıysa başlatma
        if (!this.autoScrollEnabled || this.autoScrollSpeed === 0) return;
        
        this.autoScrollTimer = setInterval(() => {
            if (this.aktifIndex < this.haberler.length - 1) {
                this.sonrakiHaber();
            } else {
                // Son habere gelince başa dön
                this.aktifIndex = 0;
                this.updateActiveCard();
                this.navigationUpdate();
            }
        }, this.autoScrollSpeed);
    }

    stopAutoScroll() {
        if (this.autoScrollTimer) {
            clearInterval(this.autoScrollTimer);
            this.autoScrollTimer = null;
        }
    }

    restartAutoScroll() {
        this.stopAutoScroll();
        this.startAutoScroll();
    }

    getKategoriIcon(baslik, ozet) {
        const metin = (baslik + ' ' + ozet).toLowerCase();
        
        // Spor
        if (metin.includes('futbol') || metin.includes('basketbol') || metin.includes('spor') || 
            metin.includes('maç') || metin.includes('takım') || metin.includes('galatasaray') || 
            metin.includes('fenerbahçe') || metin.includes('beşiktaş')) {
            return 'fa-futbol';
        }
        
        // Politika/Hükümet
        if (metin.includes('başkan') || metin.includes('hükümet') || metin.includes('parti') || 
            metin.includes('seçim') || metin.includes('meclis') || metin.includes('erdoğan') ||
            metin.includes('politika') || metin.includes('bakanl')) {
            return 'fa-landmark';
        }
        
        // Ekonomi
        if (metin.includes('ekonomi') || metin.includes('dolar') || metin.includes('euro') || 
            metin.includes('borsa') || metin.includes('faiz') || metin.includes('enflasyon') ||
            metin.includes('tl') || metin.includes('merkez bankası')) {
            return 'fa-chart-line';
        }
        
        // Teknoloji
        if (metin.includes('teknoloji') || metin.includes('yapay zeka') || metin.includes('internet') || 
            metin.includes('telefon') || metin.includes('uygulama') || metin.includes('dijital') ||
            metin.includes('siber')) {
            return 'fa-microchip';
        }
        
        // Sağlık
        if (metin.includes('sağlık') || metin.includes('hastane') || metin.includes('doktor') || 
            metin.includes('covid') || metin.includes('aşı') || metin.includes('tıp') ||
            metin.includes('hastalık')) {
            return 'fa-heartbeat';
        }
        
        // Eğitim
        if (metin.includes('eğitim') || metin.includes('okul') || metin.includes('üniversite') || 
            metin.includes('öğrenci') || metin.includes('öğretmen') || metin.includes('sınav')) {
            return 'fa-graduation-cap';
        }
        
        // Hava durumu/Doğa
        if (metin.includes('hava') || metin.includes('sıcaklık') || metin.includes('yağmur') || 
            metin.includes('kar') || metin.includes('fırtına') || metin.includes('deprem') ||
            metin.includes('meteoroloji')) {
            return 'fa-cloud-sun';
        }
        
        // Trafik/Ulaşım
        if (metin.includes('trafik') || metin.includes('kaza') || metin.includes('yol') || 
            metin.includes('metro') || metin.includes('otobüs') || metin.includes('ulaşım')) {
            return 'fa-car';
        }
        
        // Güvenlik/Askeriye
        if (metin.includes('polis') || metin.includes('asker') || metin.includes('güvenlik') || 
            metin.includes('terör') || metin.includes('operasyon') || metin.includes('tsk')) {
            return 'fa-shield-alt';
        }
        
        // Kültür/Sanat
        if (metin.includes('film') || metin.includes('müzik') || metin.includes('sanat') || 
            metin.includes('kitap') || metin.includes('tiyatro') || metin.includes('festival')) {
            return 'fa-palette';
        }
        
        // Varsayılan haber ikonu
        return 'fa-newspaper';
    }

    // Dark mode tamamen kaldırıldı

    // Settings İşlemleri
    initializeSettings() {
        // Kayıtlı ayarları yükle
        const savedSettings = JSON.parse(localStorage.getItem('kisaGundemSettings') || '{}');
        
        // Varsayılan değerlerle birleştir
        this.settings = {
            fontSize: savedSettings.fontSize || 'medium',
            autoScrollSpeed: savedSettings.autoScrollSpeed || 0,
            viewMode: savedSettings.viewMode || 'comfortable',
            colorTheme: savedSettings.colorTheme || 'default'
        };

        // Ayarları uygula (sadece görsel, kaydetme yok)
        this.applySettings();
    }

    applySettings() {
        // Font boyutu
        document.documentElement.setAttribute('data-font-size', this.settings.fontSize);
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === this.settings.fontSize);
        });

        // Otomatik geçiş hızı
        this.autoScrollSpeed = this.settings.autoScrollSpeed;
        this.autoScrollEnabled = this.settings.autoScrollSpeed > 0;
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.speed) === this.settings.autoScrollSpeed);
        });

        // Görünüm modu
        document.documentElement.setAttribute('data-view', this.settings.viewMode);
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.settings.viewMode);
        });

        // Renk teması
        document.documentElement.setAttribute('data-color-theme', this.settings.colorTheme);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.colorTheme);
        });

        // Otomatik kaydırmayı başlat/durdur
        if (this.autoScrollEnabled) {
            this.startAutoScroll();
        } else {
            this.stopAutoScroll();
        }
    }

    selectSetting(key, value) {
        // Ayarı geçici olarak değiştir (henüz kaydetme)
        this.settings[key] = value;
        
        // Sadece buton durumunu güncelle
        if (key === 'fontSize') {
            document.querySelectorAll('.font-size-btn').forEach(btn => {
                const isActive = btn.dataset.size === value;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
            });
        } else if (key === 'autoScrollSpeed') {
            document.querySelectorAll('.speed-btn').forEach(btn => {
                const isActive = parseInt(btn.dataset.speed) === value;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
            });
        } else if (key === 'viewMode') {
            document.querySelectorAll('.view-btn').forEach(btn => {
                const isActive = btn.dataset.view === value;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
            });
        } else if (key === 'colorTheme') {
            document.querySelectorAll('.theme-btn').forEach(btn => {
                const isActive = btn.dataset.theme === value;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
            });
        }
    }

    saveSettings() {
        // Ayarları localStorage'a kaydet
        localStorage.setItem('kisaGundemSettings', JSON.stringify(this.settings));
        
        // Ayarları uygula
        this.applySettings();
        
        // Başarı mesajı
        this.showSimpleNotification('Ayarlar kaydedildi!', 'success');
        
        // Paneli kapat
        setTimeout(() => this.closeSettings(), 1000);
    }

    resetSettings() {
        // Varsayılan ayarlara dön
        this.settings = {
            fontSize: 'medium',
            autoScrollSpeed: 0,
            viewMode: 'comfortable',
            colorTheme: 'default'
        };
        
        // Ayarları uygula
        this.applySettings();
        
        // localStorage'ı temizle
        localStorage.removeItem('kisaGundemSettings');
        
        // Bilgi mesajı
        this.showSimpleNotification('Ayarlar sıfırlandı!', 'info');
    }

    showSimpleNotification(message, type = 'info') {
        // Basit notification sistemi
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} show`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('open');
        this.settingsToggle.classList.toggle('active');
    }

    closeSettings() {
        this.settingsPanel.classList.remove('open');
        this.settingsToggle.classList.remove('active');
    }

    // Favoriler İşlemleri
    isFavorite(newsId) {
        return this.favorites.some(fav => fav.id === newsId);
    }

    toggleFavorite(haber) {
        const existingIndex = this.favorites.findIndex(fav => fav.id === haber.id);
        
        if (existingIndex > -1) {
            // Favorilerden çıkar
            this.favorites.splice(existingIndex, 1);
            this.showSimpleNotification('Favorilerden çıkarıldı', 'info');
        } else {
            // Favorilere ekle
            this.favorites.push({
                id: haber.id,
                baslik: haber.baslik,
                ozet: haber.ozet,
                link: haber.link,
                kaynak: haber.kaynak,
                tarih: haber.tarih,
                kategori: haber.kategori,
                addedAt: new Date().toISOString()
            });
            this.showSimpleNotification('Favorilere eklendi ⭐', 'success');
        }
        
        // LocalStorage'ı güncelle
        localStorage.setItem('kisaGundemFavorites', JSON.stringify(this.favorites));
        
        // UI'ı güncelle
        this.updateFavoriteButtons();
        this.updateFavoritesCount();
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            const newsId = btn.dataset.newsId;
            const isFav = this.isFavorite(newsId);
            
            btn.classList.toggle('active', isFav);
            btn.title = isFav ? 'Favorilerden çıkar' : 'Favorilere ekle';
        });
    }

    updateFavoritesCount() {
        const count = this.favorites.length;
        this.favoritesCount.textContent = count;
        this.favoritesCount.dataset.count = count;
        
        // Favoriler butonunun rengini güncelle
        this.favoritesToggle.classList.toggle('active', count > 0);
    }

    showFavorites() {
        this.renderFavorites();
        this.favoritesPanel.classList.add('open');
    }

    closeFavorites() {
        this.favoritesPanel.classList.remove('open');
    }

    renderFavorites() {
        if (this.favorites.length === 0) {
            this.favoritesEmpty.style.display = 'block';
            this.favoritesList.style.display = 'none';
            this.clearAllFavoritesBtn.disabled = true;
            return;
        }

        this.favoritesEmpty.style.display = 'none';
        this.favoritesList.style.display = 'block';
        this.clearAllFavoritesBtn.disabled = false;

        // Favoriler listesini oluştur
        this.favoritesList.innerHTML = '';
        
        this.favorites.forEach(favorite => {
            const favoriteItem = this.createFavoriteItem(favorite);
            this.favoritesList.appendChild(favoriteItem);
        });
    }

    createFavoriteItem(favorite) {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        
        const addedDate = new Date(favorite.addedAt);
        const dateStr = addedDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        item.innerHTML = `
            <div class="favorite-item-header">
                <div class="favorite-source">${favorite.kaynak}</div>
                <div class="favorite-date">${dateStr}</div>
            </div>
            <h4 class="favorite-title">${favorite.baslik}</h4>
            <p class="favorite-summary">${favorite.ozet}</p>
            <div class="favorite-actions">
                <a href="${favorite.link}" target="_blank" class="favorite-read-btn">
                    <i class="fas fa-external-link-alt"></i> Haberi Oku
                </a>
                <button class="favorite-remove-btn" data-favorite-id="${favorite.id}" title="Favorilerden çıkar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Silme butonuna event listener ekle
        const removeBtn = item.querySelector('.favorite-remove-btn');
        removeBtn.addEventListener('click', () => this.removeFavorite(favorite.id));

        return item;
    }

    removeFavorite(favoriteId) {
        const index = this.favorites.findIndex(fav => fav.id === favoriteId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            localStorage.setItem('kisaGundemFavorites', JSON.stringify(this.favorites));
            
            // UI'ı güncelle
            this.updateFavoriteButtons();
            this.updateFavoritesCount();
            this.renderFavorites();
            
            this.showSimpleNotification('Favorilerden çıkarıldı', 'info');
        }
    }

    clearAllFavorites() {
        if (this.favorites.length === 0) return;
        
        if (confirm(`${this.favorites.length} favori haberi silmek istediğinizden emin misiniz?`)) {
            this.favorites = [];
            localStorage.setItem('kisaGundemFavorites', JSON.stringify(this.favorites));
            
            // UI'ı güncelle
            this.updateFavoriteButtons();
            this.updateFavoritesCount();
            this.renderFavorites();
            
            this.showSimpleNotification('Tüm favoriler temizlendi', 'info');
        }
    }



    // Arama İşlemleri
    aramaYap(metin) {
        this.aramaMetni = metin.toLowerCase().trim();
        
        if (this.aramaMetni === '') {
            this.haberler = [...this.tumHaberler];
            this.clearSearchBtn.classList.add('hidden');
        } else {
            this.haberler = this.tumHaberler.filter(haber => 
                haber.baslik.toLowerCase().includes(this.aramaMetni) ||
                haber.ozet.toLowerCase().includes(this.aramaMetni) ||
                haber.kaynak.toLowerCase().includes(this.aramaMetni)
            );
            this.clearSearchBtn.classList.remove('hidden');
        }

        this.aktifIndex = 0;
        this.haberleriRender();
        this.navigationUpdate();
        this.totalNewsEl.textContent = this.haberler.length;
        // Sadece otomatik geçiş açıksa yeniden başlat
        if (this.autoScrollSpeed > 0) {
            this.restartAutoScroll();
        }
    }

    aramaTemizle() {
        this.searchInput.value = '';
        this.aramaYap('');
    }

    highlightSearchText(text) {
        if (!this.aramaMetni) return text;
        
        const regex = new RegExp(`(${this.aramaMetni})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffHours < 24) return `${diffHours} sa önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short'
        });
    }
}

// Uygulama başlat
document.addEventListener('DOMContentLoaded', () => {
    new KisaGundem();
});

// Service Worker kaydı (PWA için)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW kaydedildi: ', registration);
            })
            .catch(registrationError => {
                console.log('SW kayıt hatası: ', registrationError);
            });
    });
}
