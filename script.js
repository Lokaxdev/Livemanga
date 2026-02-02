// API Base
const API_BASE = 'https://consumet3.vercel.app/manga/mangadex';

// App State
const app = {
    currentView: 'popular',
    currentPage: 1,
    currentManga: null,

    init() {
        console.log('MangaPlus initializing...');
        this.setupEventListeners();
        this.loadPopular();
    },

    setupEventListeners() {
        // Search
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

    showLoading(message = 'Loading...') {
        document.getElementById('mainContent').innerHTML = `
            <div class="loading-screen">
                <div class="loader"></div>
                <p>${message}</p>
            </div>
        `;
    },

    showError(message) {
        document.getElementById('mainContent').innerHTML = `
            <div class="error-message">
                <h2>⚠️ ${message}</h2>
                <p>Please try again</p>
            </div>
        `;
    },

    // Load Popular
    async loadPopular(page = 1) {
        console.log('Loading popular manga, page:', page);
        this.showLoading('Loading popular manga...');
        this.currentView = 'popular';
        document.getElementById('currentPage').textContent = 'updates';
        
        try {
            const response = await fetch(`${API_BASE}/popular?page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            console.log('Popular data:', data);
            this.renderMangaList(data, page, true);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to load manga');
        }
    },

    // Search
    async searchManga(query) {
        console.log('Searching:', query);
        this.showLoading('Searching...');
        document.getElementById('currentPage').textContent = `search: ${query}`;
        
        try {
            const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            console.log('Search results:', data);
            this.renderMangaList(data, 1, false);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Search failed');
        }
    },

    // Render manga list
    renderMangaList(data, page, showLatestBadge) {
        const content = document.getElementById('mainContent');
        
        if (!data.results || data.results.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h2>No manga found</h2>
                    <p>Try a different search</p>
                </div>
            `;
            return;
        }

        // Featured manga (first one)
        const featuredManga = data.results[0];
        
        let html = `
            <div class="featured-section">
                <div class="featured-card" onclick="app.loadMangaDetail('${featuredManga.id}')">
                    <div class="featured-info">
                        ${showLatestBadge ? '<div class="featured-badge">Latest 24hours</div>' : ''}
                        <h2 class="featured-title">${this.escapeHtml(featuredManga.title || 'Unknown Title')}</h2>
                        <div class="featured-author">${this.escapeHtml(featuredManga.altTitles && featuredManga.altTitles.length > 0 ? featuredManga.altTitles[0] : '')}</div>
                        <div class="featured-chapter">#001</div>
                    </div>
                    <div class="featured-image">
                        <img 
                            src="${this.getImageUrl(featuredManga.image)}" 
                            alt="${this.escapeHtml(featuredManga.title)}"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23333%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%22200%22 y=%22150%22 fill=%22%23666%22 text-anchor=%22middle%22 font-size=%2218%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                        >
                    </div>
                </div>
            </div>
        `;

        // Grid section
        html += `
            <div class="manga-grid-section">
                ${showLatestBadge ? '<div class="section-header"><div class="section-badge">Latest 24hours</div></div>' : ''}
                <div class="manga-grid">
        `;
        
        // Render all manga (including first one in grid)
        data.results.forEach(manga => {
            const imageUrl = this.getImageUrl(manga.image);
            const title = this.escapeHtml(manga.title || 'Unknown Title');
            
            html += `
                <div class="manga-card" onclick="app.loadMangaDetail('${manga.id}')">
                    <div class="manga-card-image-wrapper">
                        ${showLatestBadge ? '<div class="manga-card-badge">Latest 24hours</div>' : ''}
                        <img 
                            class="manga-card-image" 
                            src="${imageUrl}" 
                            alt="${title}"
                            loading="lazy"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22 viewBox=%220 0 200 300%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22300%22/%3E%3Ctext x=%22100%22 y=%22150%22 fill=%22%23666%22 text-anchor=%22middle%22 font-size=%2214%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                        >
                    </div>
                    <div class="manga-card-info">
                        <div class="manga-card-title">${title}</div>
                        <div class="manga-card-meta">
                            <span class="manga-card-chapter">#001</span>
                            <span class="manga-card-views">0</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';

        // Pagination
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

    changePage(page) {
        this.currentPage = page;
        this.loadPopular(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Load manga detail
    async loadMangaDetail(mangaId) {
        console.log('Loading detail:', mangaId);
        this.showLoading('Loading manga details...');
        
        try {
            const response = await fetch(`${API_BASE}/info/${mangaId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const manga = await response.json();
            console.log('Manga detail:', manga);
            this.currentManga = manga;
            this.renderMangaDetail(manga);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to load manga details');
        }
    },

    renderMangaDetail(manga) {
        const content = document.getElementById('mainContent');
        const imageUrl = this.getImageUrl(manga.image);
        const title = this.escapeHtml(manga.title || 'Unknown Title');
        const subtitle = manga.altTitles && manga.altTitles.length > 0 ? 
            this.escapeHtml(manga.altTitles[0]) : '';
        
        document.getElementById('currentPage').textContent = title;
        
        let html = `
            <div class="manga-detail">
                <div class="detail-header">
                    <div class="detail-cover">
                        <img 
                            src="${imageUrl}" 
                            alt="${title}"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22340%22 viewBox=%220 0 240 340%22%3E%3Crect fill=%22%23333%22 width=%22240%22 height=%22340%22/%3E%3Ctext x=%22120%22 y=%22170%22 fill=%22%23666%22 text-anchor=%22middle%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                        >
                    </div>
                    <div class="detail-info">
                        <h1 class="detail-title">${title}</h1>
                        ${subtitle ? `<div class="detail-subtitle">${subtitle}</div>` : ''}
                        
                        <div class="detail-meta">
                            ${manga.status ? `<div class="detail-meta-item"><strong>Status:</strong> ${this.escapeHtml(manga.status)}</div>` : ''}
                            ${manga.releaseDate ? `<div class="detail-meta-item"><strong>Year:</strong> ${manga.releaseDate}</div>` : ''}
                        </div>
                        
                        ${manga.genres && manga.genres.length > 0 ? `
                            <div class="detail-genres">
                                ${manga.genres.map(g => `<span class="genre-badge">${this.escapeHtml(g)}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        ${manga.description ? `<div class="detail-description">${this.escapeHtml(manga.description)}</div>` : ''}
                    </div>
                </div>

                <div class="chapters-section">
                    <h2 class="chapters-header">Chapters</h2>
                    <div class="chapters-list">
        `;

        if (manga.chapters && manga.chapters.length > 0) {
            manga.chapters.forEach(chapter => {
                const chapterTitle = this.escapeHtml(chapter.title || `Chapter ${chapter.id}`);
                const releaseDate = chapter.releaseDate ? this.escapeHtml(chapter.releaseDate) : '';
                
                html += `
                    <div class="chapter-item" onclick="app.readChapter('${chapter.id}')">
                        <div class="chapter-title">${chapterTitle}</div>
                        ${releaseDate ? `<div class="chapter-date">${releaseDate}</div>` : ''}
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
                        <div class="reader-chapter-title">Loading...</div>
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
            console.error('Error:', error);
            document.querySelector('.reader-pages').innerHTML = `
                <div class="error-message">Failed to load chapter</div>
            `;
        }
    },

    renderChapterPages(pages, chapterId) {
        if (!pages || pages.length === 0) {
            document.querySelector('.reader-pages').innerHTML = `
                <div class="empty-state">No pages found</div>
            `;
            return;
        }

        const currentChapter = this.currentManga.chapters.find(ch => ch.id === chapterId);
        if (currentChapter) {
            document.querySelector('.reader-chapter-title').textContent = 
                currentChapter.title || `Chapter ${chapterId}`;
        }

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
        this.setupChapterNavigation(chapterId);
    },

    setupChapterNavigation(currentChapterId) {
        const chapters = this.currentManga.chapters;
        const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
        
        const prevBtn = document.getElementById('prevChapter');
        const nextBtn = document.getElementById('nextChapter');

        if (currentIndex > 0) {
            prevBtn.onclick = () => this.readChapter(chapters[currentIndex - 1].id);
            prevBtn.disabled = false;
        } else {
            prevBtn.disabled = true;
        }

        if (currentIndex < chapters.length - 1) {
            nextBtn.onclick = () => this.readChapter(chapters[currentIndex + 1].id);
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
    },

    backToManga() {
        if (this.currentManga) {
            this.renderMangaDetail(this.currentManga);
        } else {
            this.loadPopular();
        }
    },

    // Get image URL - FIXED: Proper proxy handling
    getImageUrl(imageUrl) {
        if (!imageUrl) {
            return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22300%22/%3E%3C/svg%3E';
        }
        
        // If it's already a full URL from MangaDex, use the proxy
        if (imageUrl.startsWith('http')) {
            return `https://consumet3.vercel.app/manga/mangadex/proxy?url=${encodeURIComponent(imageUrl)}`;
        }
        
        return imageUrl;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing MangaPlus...');
    app.init();
});
