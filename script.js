const API_BASE = 'https://consumet3.vercel.app/manga/mangadex';

const app = {
    currentView: 'popular',
    currentPage: 1,
    currentManga: null,
    currentChapter: null,

    init() {
        this.showPopular();
    },

    async showPopular() {
        this.updateActiveTab('Popular');
        this.currentView = 'popular';
        this.currentPage = 1;
        await this.loadMangaList('popular');
    },

    async showLatest() {
        this.updateActiveTab('Latest');
        this.currentView = 'latest';
        this.currentPage = 1;
        await this.loadMangaList('latest');
    },

    async showRecent() {
        this.updateActiveTab('Recent');
        this.currentView = 'recent';
        this.currentPage = 1;
        await this.loadMangaList('recent');
    },

    async showHome() {
        document.getElementById('searchInput').value = '';
        await this.showPopular();
    },

    updateActiveTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent === tabName);
        });
    },

    async loadMangaList(type, page = 1) {
        const content = document.getElementById('mainContent');
        content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading manga...</div>';

        try {
            const response = await fetch(`${API_BASE}/${type}?page=${page}`);
            const data = await response.json();

            this.renderMangaGrid(data, page);
        } catch (error) {
            content.innerHTML = `<div class="error">Failed to load manga. Please try again.</div>`;
            console.error('Error loading manga:', error);
        }
    },

    renderMangaGrid(data, page) {
        const content = document.getElementById('mainContent');
        
        let html = '<div class="manga-grid">';
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(manga => {
                const imageUrl = manga.image ? 
                    `https://consumet3.vercel.app/manga/mangadex/proxy?url=${encodeURIComponent(manga.image)}` : 
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%23333" width="200" height="300"/%3E%3C/svg%3E';
                
                const altTitle = manga.altTitles && manga.altTitles.length > 0 ? manga.altTitles[0] : '';
                
                html += `
                    <div class="manga-card" onclick="app.showMangaDetail('${manga.id}')">
                        <img class="manga-image" src="${imageUrl}" alt="${manga.title}" loading="lazy">
                        <div class="manga-info">
                            <div class="manga-title">${manga.title}</div>
                            ${altTitle ? `<div class="manga-alt-title">${altTitle}</div>` : ''}
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<div class="error">No manga found.</div>';
        }
        
        html += '</div>';

        // Add pagination
        if (data.hasNextPage || page > 1) {
            html += '<div class="pagination">';
            if (page > 1) {
                html += `<button class="page-button" onclick="app.changePage(${page - 1})">← Previous</button>`;
            }
            html += `<button class="page-button active">${page}</button>`;
            if (data.hasNextPage) {
                html += `<button class="page-button" onclick="app.changePage(${page + 1})">Next →</button>`;
            }
            html += '</div>';
        }

        content.innerHTML = html;
    },

    async changePage(page) {
        this.currentPage = page;
        await this.loadMangaList(this.currentView, page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    async searchManga(query) {
        if (!query.trim()) {
            this.showPopular();
            return;
        }

        const content = document.getElementById('mainContent');
        content.innerHTML = '<div class="loading"><div class="spinner"></div>Searching...</div>';

        try {
            const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}`);
            const data = await response.json();

            this.renderMangaGrid(data, 1);
        } catch (error) {
            content.innerHTML = `<div class="error">Search failed. Please try again.</div>`;
            console.error('Error searching manga:', error);
        }
    },

    handleSearchKeypress(event) {
        if (event.key === 'Enter') {
            const query = event.target.value;
            this.searchManga(query);
        }
    },

    async showMangaDetail(mangaId) {
        const content = document.getElementById('mainContent');
        content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading manga details...</div>';

        try {
            const response = await fetch(`${API_BASE}/info/${mangaId}`);
            const manga = await response.json();
            this.currentManga = manga;

            this.renderMangaDetail(manga);
        } catch (error) {
            content.innerHTML = `<div class="error">Failed to load manga details. Please try again.</div>`;
            console.error('Error loading manga detail:', error);
        }
    },

    renderMangaDetail(manga) {
        const content = document.getElementById('mainContent');
        
        const imageUrl = manga.image ? 
            `https://consumet3.vercel.app/manga/mangadex/proxy?url=${encodeURIComponent(manga.image)}` : 
            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="420"%3E%3Crect fill="%23333" width="300" height="420"/%3E%3C/svg%3E';

        let html = `
            <div class="manga-detail">
                <div class="detail-header">
                    <img class="detail-image" src="${imageUrl}" alt="${manga.title}">
                    <div class="detail-info">
                        <div class="detail-title">${manga.title}</div>
        `;

        if (manga.altTitles && manga.altTitles.length > 0) {
            html += `<div style="color: rgba(255,255,255,0.6); margin-bottom: 1rem;">${manga.altTitles[0]}</div>`;
        }

        if (manga.genres && manga.genres.length > 0) {
            html += '<div class="detail-genres">';
            manga.genres.forEach(genre => {
                html += `<span class="genre-tag">${genre}</span>`;
            });
            html += '</div>';
        }

        html += `
                    </div>
                </div>

                <div class="chapters-section">
                    <div class="chapters-title">Chapters</div>
                    <div class="chapter-list">
        `;

        if (manga.chapters && manga.chapters.length > 0) {
            manga.chapters.forEach(chapter => {
                const chapterTitle = chapter.title || `Chapter ${chapter.id}`;
                const releaseDate = chapter.releaseDate || '';
                
                html += `
                    <div class="chapter-item" onclick="app.readChapter('${chapter.id}', '${manga.title.replace(/'/g, "\\'")}', '${chapterTitle.replace(/'/g, "\\'")}')">
                        <div class="chapter-title">${chapterTitle}</div>
                        <div class="chapter-date">${releaseDate}</div>
                    </div>
                `;
            });
        } else {
            html += '<div style="padding: 2rem; text-align: center; color: rgba(255,255,255,0.5);">No chapters available</div>';
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;
    },

    async readChapter(chapterId, mangaTitle, chapterTitle) {
        const content = document.getElementById('mainContent');
        
        content.innerHTML = `
            <div class="reader-container">
                <div class="reader-header">
                    <button class="back-button" onclick="app.showMangaDetail('${this.currentManga.id}')">← Back</button>
                    <div class="reader-info">
                        <div class="reader-title">${mangaTitle}</div>
                        <div class="reader-chapter">${chapterTitle}</div>
                    </div>
                    <div class="reader-controls">
                        <button class="control-button" id="prevChapter">← Prev</button>
                        <button class="control-button" id="nextChapter">Next →</button>
                    </div>
                </div>
                <div class="pages-container">
                    <div class="loading"><div class="spinner"></div>Loading chapter...</div>
                </div>
            </div>
        `;

        try {
            const response = await fetch(`${API_BASE}/read/${chapterId}`);
            const pages = await response.json();

            this.renderChapterPages(pages, chapterId);
        } catch (error) {
            document.querySelector('.pages-container').innerHTML = 
                `<div class="error">Failed to load chapter. Please try again.</div>`;
            console.error('Error loading chapter:', error);
        }
    },

    renderChapterPages(pages, chapterId) {
        const pagesContainer = document.querySelector('.pages-container');
        
        if (!pages || pages.length === 0) {
            pagesContainer.innerHTML = '<div class="error">No pages found for this chapter.</div>';
            return;
        }

        let html = '';
        pages.forEach(page => {
            const imageUrl = `https://consumet3.vercel.app/manga/mangadex/proxy?url=${encodeURIComponent(page.img)}`;
            html += `<img class="manga-page" src="${imageUrl}" alt="Page ${page.page}" loading="lazy">`;
        });

        pagesContainer.innerHTML = html;

        // Setup chapter navigation
        this.setupChapterNavigation(chapterId);
    },

    setupChapterNavigation(currentChapterId) {
        const chapters = this.currentManga.chapters;
        const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
        
        const prevButton = document.getElementById('prevChapter');
        const nextButton = document.getElementById('nextChapter');

        if (currentIndex > 0) {
            const prevChapter = chapters[currentIndex - 1];
            prevButton.onclick = () => this.readChapter(
                prevChapter.id, 
                this.currentManga.title, 
                prevChapter.title || `Chapter ${prevChapter.id}`
            );
        } else {
            prevButton.disabled = true;
        }

        if (currentIndex < chapters.length - 1) {
            const nextChapter = chapters[currentIndex + 1];
            nextButton.onclick = () => this.readChapter(
                nextChapter.id, 
                this.currentManga.title, 
                nextChapter.title || `Chapter ${nextChapter.id}`
            );
        } else {
            nextButton.disabled = true;
        }
    }
};

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
