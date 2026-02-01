// API Configuration
const API_BASE = 'https://consumet3.vercel.app/manga/mangadex';

// App State
const app = {
    currentView: 'popular',
    currentPage: 1,
    currentManga: null,
    cache: new Map(),

    // Initialize the app
    init() {
        console.log('App initializing...');
        this.setupEventListeners();
        this.loadPopular();
    },

    // Setup event listeners
    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    this.searchManga(query);
                }
            }
        });
    },

    // Switch view
    switchView(view) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.currentView = view;
        this.currentPage = 1;

        switch(view) {
            case 'popular':
                this.loadPopular();
                break;
            case 'latest':
                this.loadLatest();
                break;
            case 'recent':
                this.loadRecent();
                break;
        }
    },

    // Show loading state
    showLoading(message = 'Loading...') {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="loading-screen">
                <div class="loader"></div>
                <p>${message}</p>
            </div>
        `;
    },

    // Show error
    showError(message) {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="error-message">
                <h2>⚠️ ${message}</h2>
                <p>Please try again later</p>
            </div>
        `;
    },

    // Load popular manga
    async loadPopular(page = 1) {
        console.log('Loading popular manga, page:', page);
        this.showLoading('Loading popular manga...');
        
        try {
            const response = await fetch(`${API_BASE}/popular?page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            console.log('Popular manga data:', data);
            this.renderMangaGrid(data, page);
        } catch (error) {
            console.error('Error loading popular manga:', error);
            this.showError('Failed to load popular manga');
        }
    },

    // Load latest manga
    async loadLatest(page = 1) {
        console.log('Loading latest manga, page:', page);
        this.showLoading('Loading latest manga...');
        
        try {
            const response = await fetch(`${API_BASE}/latest?page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            console.log('Latest manga data:', data);
            this.renderMangaGrid(data, page);
        } catch (error) {
            console.error('Error loading latest manga:', error);
            this.showError('Failed to load latest manga');
        }
    },

    // Load recent manga
    async loadRecent(page = 1) {
        console.log('Loading recent manga, page:', page);
        this.showLoading('Loading recent manga...');
        
        try {
            const response = await fetch(`${API_BASE}/recent?page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            console.log('Recent manga data:', data);
            this.renderMangaGrid(data, page);
        } catch (error) {
            console.error('Error loading recent manga:', error);
            this.showError('Failed to load recent manga');
        }
    },

    // Search manga
    async searchManga(query) {
        console.log('Searching manga:', query);
        this.showLoading('Searching...');
        
        try {
            const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            console.log('Search results:', data);
            this.renderMangaGrid(data, 1);
        } catch (error) {
            console.error('Error searching manga:', error);
            this.showError('Search failed');
        }
    },

    // Render manga grid
    renderMangaGrid(data, page) {
        const content = document.getElementById('mainContent');
        
        if (!data.results || data.results.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h2>No manga found</h2>
                    <p>Try a different search or browse our collection</p>
                </div>
            `;
            return;
        }

        let html = '<div class="manga-grid">';
        
        data.results.forEach(manga => {
            const imageUrl = this.getImageUrl(manga.image);
            const title = manga.title || 'Unknown Title';
            const subtitle = manga.altTitles && manga.altTitles.length > 0 ? manga.altTitles[0] : '';
            
            html += `
                <div class="manga-card" onclick="app.loadMangaDetail('${manga.id}')">
                    <img 
                        class="manga-card-image" 
                        src="${imageUrl}" 
                        alt="${this.escapeHtml(title)}"
                        loading="lazy"
                        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E%3Crect fill=%22%232a2a2a%22 width=%22200%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%23666%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                    >
                    <div class="manga-card-info">
                        <div class="manga-card-title">${this.escapeHtml(title)}</div>
                        ${subtitle ? `<div class="manga-card-subtitle">${this.escapeHtml(subtitle)}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';

        // Add pagination
        if (data.hasNextPage || page > 1) {
            html += '<div class="pagination">';
            
            if (page > 1) {
                html += `<button class="page-btn" onclick="app.changePage(${page - 1})">← Previous</button>`;
            }
            
            html += `<button class="page-btn active">${page}</button>`;
            
            if (data.hasNextPage) {
                html += `<button class="page-btn" onclick="app.changePage(${page + 1})">Next →</button>`;
            }
            
            html += '</div>';
        }

        content.innerHTML = html;
    },

    // Change page
    changePage(page) {
        this.currentPage = page;
        
        switch(this.currentView) {
            case 'popular':
                this.loadPopular(page);
                break;
            case 'latest':
                this.loadLatest(page);
                break;
            case 'recent':
                this.loadRecent(page);
                break;
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Load manga detail
    async loadMangaDetail(mangaId) {
        console.log('Loading manga detail:', mangaId);
        this.showLoading('Loading manga details...');
        
        try {
            const response = await fetch(`${API_BASE}/info/${mangaId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const manga = await response.json();
            console.log('Manga detail:', manga);
            this.currentManga = manga;
            this.renderMangaDetail(manga);
        } catch (error) {
            console.error('Error loading manga detail:', error);
            this.showError('Failed to load manga details');
        }
    },

    // Render manga detail
    renderMangaDetail(manga) {
        const content = document.getElementById('mainContent');
        const imageUrl = this.getImageUrl(manga.image);
        const title = manga.title || 'Unknown Title';
        const subtitle = manga.altTitles && manga.altTitles.length > 0 ? manga.altTitles[0] : '';
        
        let html = `
            <div class="manga-detail">
                <div class="detail-header">
                    <div class="detail-cover">
                        <img 
                            src="${imageUrl}" 
                            alt="${this.escapeHtml(title)}"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22400%22%3E%3Crect fill=%22%232a2a2a%22 width=%22280%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%23666%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                        >
                    </div>
                    <div class="detail-info">
                        <h1 class="detail-title">${this.escapeHtml(title)}</h1>
                        ${subtitle ? `<div class="detail-subtitle">${this.escapeHtml(subtitle)}</div>` : ''}
                        
                        ${manga.genres && manga.genres.length > 0 ? `
                            <div class="detail-genres">
                                ${manga.genres.map(genre => `<span class="genre-badge">${this.escapeHtml(genre)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="chapters-section">
                    <h2 class="chapters-header">Chapters</h2>
                    <div class="chapters-list">
        `;

        if (manga.chapters && manga.chapters.length > 0) {
            manga.chapters.forEach(chapter => {
                const chapterTitle = chapter.title || `Chapter ${chapter.id}`;
                const releaseDate = chapter.releaseDate || '';
                
                html += `
                    <div class="chapter-item" onclick="app.readChapter('${chapter.id}')">
                        <div class="chapter-title">${this.escapeHtml(chapterTitle)}</div>
                        ${releaseDate ? `<div class="chapter-date">${this.escapeHtml(releaseDate)}</div>` : ''}
                    </div>
                `;
            });
        } else {
            html += '<div class="empty-state">No chapters available</div>';
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;
    },

    // Read chapter
    async readChapter(chapterId) {
        console.log('Reading chapter:', chapterId);
        
        const readerHtml = `
            <div class="reader-view">
                <div class="reader-header">
                    <button class="reader-back-btn" onclick="app.backToManga()">← Back</button>
                    <div class="reader-info">
                        <div class="reader-manga-title">${this.escapeHtml(this.currentManga.title)}</div>
                        <div class="reader-chapter-title">Loading chapter...</div>
                    </div>
                    <div class="reader-controls">
                        <button class="reader-control-btn" id="prevChapter">← Prev</button>
                        <button class="reader-control-btn" id="nextChapter">Next →</button>
                    </div>
                </div>
                <div class="reader-pages">
                    <div class="loading-screen">
                        <div class="loader"></div>
                        <p>Loading pages...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = readerHtml;
        
        try {
            const response = await fetch(`${API_BASE}/read/${chapterId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const pages = await response.json();
            console.log('Chapter pages:', pages);
            this.renderChapterPages(pages, chapterId);
        } catch (error) {
            console.error('Error loading chapter:', error);
            document.querySelector('.reader-pages').innerHTML = `
                <div class="error-message">Failed to load chapter pages</div>
            `;
        }
    },

    // Render chapter pages
    renderChapterPages(pages, chapterId) {
        if (!pages || pages.length === 0) {
            document.querySelector('.reader-pages').innerHTML = `
                <div class="empty-state">No pages found for this chapter</div>
            `;
            return;
        }

        // Update chapter title
        const currentChapter = this.currentManga.chapters.find(ch => ch.id === chapterId);
        if (currentChapter) {
            document.querySelector('.reader-chapter-title').textContent = 
                currentChapter.title || `Chapter ${chapterId}`;
        }

        // Render pages
        const pagesContainer = document.querySelector('.reader-pages');
        let html = '';
        
        pages.forEach((page, index) => {
            const imageUrl = this.getImageUrl(page.img);
            html += `
                <img 
                    class="reader-page-img" 
                    src="${imageUrl}" 
                    alt="Page ${page.page || index + 1}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            `;
        });
        
        pagesContainer.innerHTML = html;

        // Setup navigation
        this.setupChapterNavigation(chapterId);
    },

    // Setup chapter navigation
    setupChapterNavigation(currentChapterId) {
        const chapters = this.currentManga.chapters;
        const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
        
        const prevBtn = document.getElementById('prevChapter');
        const nextBtn = document.getElementById('nextChapter');

        if (currentIndex > 0) {
            const prevChapter = chapters[currentIndex - 1];
            prevBtn.onclick = () => this.readChapter(prevChapter.id);
            prevBtn.disabled = false;
        } else {
            prevBtn.disabled = true;
        }

        if (currentIndex < chapters.length - 1) {
            const nextChapter = chapters[currentIndex + 1];
            nextBtn.onclick = () => this.readChapter(nextChapter.id);
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
    },

    // Back to manga detail
    backToManga() {
        if (this.currentManga) {
            this.renderMangaDetail(this.currentManga);
        } else {
            this.loadPopular();
        }
    },

    // Get image URL with proxy
    getImageUrl(imageUrl) {
        if (!imageUrl) {
            return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E%3Crect fill=%22%232a2a2a%22 width=%22200%22 height=%22300%22/%3E%3C/svg%3E';
        }
        
        // Use the consumet proxy
        return `https://consumet3.vercel.app/manga/mangadex/proxy?url=${encodeURIComponent(imageUrl)}`;
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    app.init();
});
