/**
 * YORUNOSEKAI CORE ENGINE
 * Mengatur data dinamis, Theme, NSFW Filter, dan Statistik Otomatis.
 */

let allPosts = [];
let displayedCount = 12; // Jumlah item awal di Homepage
const increment = 6;     // Tambahan item saat scroll

// 1. INISIALISASI UTAMA
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    initTheme();
    initNSFW();
    setupGlobalEvents();
});

// 2. AMBIL DATA DARI JSON
async function fetchData() {
    try {
        const response = await fetch('data/post.json');
        allPosts = await response.json();
        
        const pageType = document.body.getAttribute('data-page');

        if (pageType === 'home') {
            renderGrid(allPosts.slice(0, displayedCount));
            setupInfiniteScroll();
        } else if (pageType === 'detail') {
            renderDetailPage();
        } else if (pageType.includes('-list')) {
            renderCategoryList(pageType); // Menghitung & Render Daftar Genre/Artis/Negara
        } else if (pageType === 'archive') {
            renderArchivePage(); // Menampilkan isi dari Genre/Artis yang diklik
        } else if (pageType === 'az-list') {
            renderAZPage();
        }
    } catch (error) {
        console.error("Gagal memuat data JSON:", error);
    }
}

// 3. RENDER GRID VIDEO (HOME & ARCHIVE)
function renderGrid(posts) {
    const container = document.getElementById('post-grid');
    if (!container) return;

    // Filter SFW jika aktif
    const isSFW = localStorage.getItem('sfw-mode') === 'true';
    const filteredPosts = isSFW ? posts.filter(p => !p.is_nsfw) : posts;

    if (displayedCount === 12 || container.innerHTML === "") container.innerHTML = "";

    filteredPosts.forEach(post => {
        const card = `
            <div class="card ${post.is_nsfw ? 'nsfw-item' : ''}" onclick="location.href='detail.html?id=${post.id}'">
                <div class="thumb-container">
                    <img src="${post.image}" alt="${post.title}" loading="lazy">
                    <div class="play-overlay"><i class="fas fa-play"></i></div>
                </div>
                <div class="card-title">${post.title}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', card);
    });
}

// 4. MENGHITUNG OTOMATIS & RENDER DAFTAR (GENRE, ARTIST, COUNTRY)
function renderCategoryList(pageType) {
    const container = document.getElementById('list-container');
    if (!container) return;

    let key = "";
    let targetFile = "";
    
    if (pageType === 'genre-list') { key = "genres"; targetFile = "genre.html"; }
    if (pageType === 'artist-list') { key = "stars"; targetFile = "Artist.html"; }
    if (pageType === 'country-list') { key = "country"; targetFile = "country.html"; }

    // Hitung kemunculan teks otomatis
    let stats = {};
    allPosts.forEach(post => {
        const dataField = post[key];
        if (Array.isArray(dataField)) {
            dataField.forEach(item => stats[item] = (stats[item] || 0) + 1);
        } else {
            stats[dataField] = (stats[dataField] || 0) + 1;
        }
    });

    // Render ke HTML
    const sortedItems = Object.keys(stats).sort();
    container.innerHTML = "";
    sortedItems.forEach(name => {
        container.innerHTML += `
            <a href="${targetFile}?name=${encodeURIComponent(name)}" class="list-item">
                <span class="item-name">${name}</span>
                <span class="item-count">${stats[name]}</span>
            </a>
        `;
    });
}

// 5. RENDER ISI KATEGORI (MISAL: SEMUA VIDEO DENGAN GENRE 'TEACHER')
function renderArchivePage() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('name');
    const type = document.body.getAttribute('data-archive-type'); // Dari HTML

    if (!query) return;
    document.getElementById('archive-title').innerText = query;

    let filtered = [];
    if (type === 'genre') filtered = allPosts.filter(p => p.genres.includes(query));
    if (type === 'artist') filtered = allPosts.filter(p => p.stars.includes(query));
    if (type === 'country') filtered = allPosts.filter(p => p.country === query);

    renderGrid(filtered);
}

// 6. RENDER HALAMAN DETAIL
function renderDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const post = allPosts.find(p => p.id === id);

    if (post) {
        document.title = post.title;
        document.getElementById('video-player').src = post.video_url;
        document.getElementById('post-title').innerText = post.title;
        document.getElementById('val-release').innerText = post.release_date;
        document.getElementById('val-country').innerText = post.country;
        document.getElementById('val-duration').innerText = post.duration;
        
        // Stars & Genres dengan link otomatis
        document.getElementById('val-stars').innerHTML = post.stars.map(s => 
            `<a href="Artist.html?name=${encodeURIComponent(s)}">${s}</a>`).join(', ');
        
        document.getElementById('val-genres').innerHTML = post.genres.map(g => 
            `<span class="genre-tag" onclick="location.href='genre.html?name=${encodeURIComponent(g)}'">${g}</span>`).join('');
    }
}

// 7. INFINITE SCROLL (UNLIMITED PAGINATION)
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
            if (displayedCount < allPosts.length) {
                const nextItems = allPosts.slice(displayedCount, displayedCount + increment);
                renderGrid(nextItems);
                displayedCount += increment;
            }
        }
    });
}

// 8. THEME & NSFW TOGGLE
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
}

function initNSFW() {
    const sfw = localStorage.getItem('sfw-mode') === 'true';
    if (sfw) document.body.classList.add('sfw-mode');
}

function toggleNSFW() {
    const current = document.body.classList.toggle('sfw-mode');
    localStorage.setItem('sfw-mode', current);
    location.reload(); // Reload untuk menyaring konten
}

// 9. SEARCH LOGIC
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const results = allPosts.filter(p => p.title.toLowerCase().includes(query));
    const container = document.getElementById('post-grid');
    if (container) {
        container.innerHTML = "";
        renderGrid(results);
    }
}

// 10. GLOBAL EVENTS (HAMBURGER & SEARCH BTN)
function setupGlobalEvents() {
    const menuBtn = document.getElementById('menu-btn');
    const menuNav = document.getElementById('menu-nav');
    if (menuBtn) {
        menuBtn.onclick = () => menuNav.classList.toggle('active');
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

// A-Z Logic
function renderAZPage() {
    const params = new URLSearchParams(window.location.search);
    const char = params.get('char');
    const container = document.getElementById('post-grid');
    if (!container) return;

    // 1. Urutkan semua postingan berdasarkan judul (A-Z) secara default
    let filtered = allPosts.sort((a, b) => a.title.localeCompare(b.title));

    // 2. Jika user klik huruf (misal ?char=F), saring datanya
    if (char) {
        filtered = filtered.filter(p => p.title.toUpperCase().startsWith(char.toUpperCase()));
        document.getElementById('az-status').innerText = `Menampilkan Huruf: ${char}`;
    } else {
        document.getElementById('az-status').innerText = `Menampilkan Semua (A-Z)`;
    }

    // 3. Render ke Grid
    container.innerHTML = ""; // Bersihkan container sebelum render
    renderGrid(filtered);
}
