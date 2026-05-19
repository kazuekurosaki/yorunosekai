/**
 * YORUNOSEKAI CORE ENGINE - FULL STACK VERSION
 * Deskripsi: Mengelola database JSON, Theme, SFW Mode, 
 *            Auto-Statistics, dan Navigasi Dinamis.
 */

let allPosts = [];
let displayedCount = 12; // Jumlah awal postingan di Home
const increment = 6;     // Tambahan per scroll (Infinite Scroll)

// 1. BOOTSTRAP: Menjalankan fungsi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    initTheme();      // Memuat tema (Dark/Light)
    initNSFW();       // Memuat status SFW/NSFW
    fetchData();      // Mengambil data dari post.json
    setupGlobalEvents(); // Menjalankan Hamburger & Search
});

// 2. DATA ACQUISITION
async function fetchData() {
    try {
        const response = await fetch('data/post.json');
        if (!response.ok) throw new Error("Database JSON tidak ditemukan!");
        
        allPosts = await response.json();
        
        // Identifikasi halaman berdasarkan atribut 'data-page' di tag <body>
        const pageType = document.body.getAttribute('data-page');

        if (pageType === 'home') {
            renderGrid(allPosts.slice(0, displayedCount), true);
            setupInfiniteScroll();
        } else if (pageType === 'detail') {
            renderDetailPage();
        } else if (pageType.includes('-list')) {
            renderCategoryList(pageType); // Otomatis Hitung Genre/Artis/Negara
        } else if (pageType === 'archive') {
            renderArchivePage(); 
        } else if (pageType === 'az-list') {
            renderAZPage(); // Menampilkan daftar postingan A-Z
        }
    } catch (error) {
        console.error("Gagal memuat data:", error);
    }
}

// 3. CORE RENDERER: Membuat tampilan Grid Video
function renderGrid(posts, clear = false) {
    const container = document.getElementById('post-grid');
    if (!container) return;

    if (clear) container.innerHTML = ""; // Bersihkan kontainer jika diperlukan

    // Logika SFW Filter (Jika SFW Aktif, hilangkan post yang is_nsfw: true)
    const isSFW = localStorage.getItem('sfw-mode') === 'true';
    const dataToRender = isSFW ? posts.filter(p => !p.is_nsfw) : posts;

    if (dataToRender.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5;">Postingan tidak ditemukan.</div>`;
        return;
    }

    dataToRender.forEach(post => {
        const card = `
            <div class="card ${post.is_nsfw ? 'nsfw-item' : ''}" onclick="location.href='detail.html?id=${post.id}'">
                <div class="thumb-container">
                    <img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
                    <div class="play-overlay"><i class="fas fa-play"></i></div>
                </div>
                <div class="card-title">${post.title}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', card);
    });
}

// 4. AUTO-COUNTER: Hitung otomatis Genre, Artist, & Country
function renderCategoryList(pageType) {
    const container = document.getElementById('list-container');
    if (!container) return;

    // Tentukan kunci data berdasarkan tipe halaman
    let key = "genres";
    let targetFile = "genre.html";
    if (pageType === 'artist-list') { key = "stars"; targetFile = "Artist.html"; }
    if (pageType === 'country-list') { key = "country"; targetFile = "country.html"; }

    // Menghitung jumlah kemunculan teks unik secara dinamis
    let stats = {};
    allPosts.forEach(post => {
        const field = post[key];
        if (Array.isArray(field)) {
            field.forEach(val => stats[val] = (stats[val] || 0) + 1);
        } else if (field) {
            stats[field] = (stats[field] || 0) + 1;
        }
    });

    // Urutkan Nama secara Alfabetis
    const sortedKeys = Object.keys(stats).sort();
    container.innerHTML = "";
    sortedKeys.forEach(name => {
        container.innerHTML += `
            <a href="${targetFile}?name=${encodeURIComponent(name)}" class="list-item">
                <span class="item-name">${name}</span>
                <span class="item-count">${stats[name]}</span>
            </a>
        `;
    });
}

// 5. ARCHIVE RENDERER (Grid hasil klik Genre/Artist/Country)
function renderArchivePage() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('name');
    const type = document.body.getAttribute('data-archive-type');
    const titleEl = document.getElementById('archive-title');

    if (!query) return;
    if (titleEl) titleEl.innerText = query;

    let filtered = [];
    if (type === 'genre') filtered = allPosts.filter(p => p.genres.includes(query));
    if (type === 'artist') filtered = allPosts.filter(p => p.stars.includes(query));
    if (type === 'country') filtered = allPosts.filter(p => p.country === query);

    renderGrid(filtered, true);
}

// 6. A-Z RENDERER (Daftar Abjad - Fixed)
function renderAZPage() {
    const params = new URLSearchParams(window.location.search);
    const char = params.get('char');
    const titleEl = document.getElementById('archive-title');

    // Default: Urutkan semua data dari A ke Z
    let results = [...allPosts].sort((a, b) => a.title.trim().localeCompare(b.title.trim()));

    if (char && char !== "") {
        // Filter berdasarkan huruf depan jika tombol diklik
        results = results.filter(p => p.title.trim().toUpperCase().startsWith(char.toUpperCase()));
        if (titleEl) titleEl.innerText = `Menampilkan Huruf: ${char}`;
    } else {
        if (titleEl) titleEl.innerText = `Semua Postingan (Urut A-Z)`;
    }

    renderGrid(results, true);
}

// 7. DETAIL RENDERER (Player & Metadata)
function renderDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const post = allPosts.find(p => p.id === id);

    if (post) {
        document.title = post.title;
        
        const player = document.getElementById('video-player');
        if (player) player.src = post.video_url;
        
        document.getElementById('post-title').innerText = post.title;
        document.getElementById('val-release').innerText = post.release_date;
        document.getElementById('val-country').innerText = post.country;
        document.getElementById('val-duration').innerText = post.duration;
        
        // Link otomatis untuk kategori
        document.getElementById('val-stars').innerHTML = post.stars.map(s => 
            `<a href="Artist.html?name=${encodeURIComponent(s)}">${s}</a>`).join(', ');
        
        document.getElementById('val-genres').innerHTML = post.genres.map(g => 
            `<span class="genre-tag" onclick="location.href='genre.html?name=${encodeURIComponent(g)}'">${g}</span>`).join('');
    }
}

// 8. INFINITE SCROLL (Unlimited Pagination)
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            if (displayedCount < allPosts.length) {
                const nextData = allPosts.slice(displayedCount, displayedCount + increment);
                renderGrid(nextData, false);
                displayedCount += increment;
            }
        }
    });
}

// 9. THEME & NSFW UTILS
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = (current === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
}
function initNSFW() {
    if (localStorage.getItem('sfw-mode') === 'true') document.body.classList.add('sfw-mode');
}
function toggleNSFW() {
    const status = document.body.classList.toggle('sfw-mode');
    localStorage.setItem('sfw-mode', status);
    location.reload(); // Refresh untuk filter grid
}

// 10. GLOBAL EVENTS (Hamburger & Search)
function setupGlobalEvents() {
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.onclick = () => document.getElementById('menu-nav').classList.toggle('active');
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = allPosts.filter(p => p.title.toLowerCase().includes(q));
            renderGrid(filtered, true);
        });
    }
}
