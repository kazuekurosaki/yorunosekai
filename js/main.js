/**
 * YORUNOSEKAI CORE ENGINE
 * Berfungsi untuk mengelola data, theme, filter nsfw, dan navigasi.
 */

let allPosts = []; // Menyimpan semua data dari JSON
let displayedCount = 12; // Jumlah post awal yang ditampilkan
const increment = 6; // Jumlah post yang ditambah saat scroll (Infinite Scroll)

// 1. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    initTheme();
    initNSFW();
    setupEventListeners();
});

// 2. FETCH DATA DARI JSON
async function fetchData() {
    try {
        const response = await fetch('data/post.json');
        allPosts = await response.json();
        
        // Tentukan halaman mana yang sedang aktif
        const path = window.location.pathname;
        const bodyPage = document.body.getAttribute('data-page');

        if (bodyPage === 'home') {
            renderGrid(allPosts.slice(0, displayedCount));
            initInfiniteScroll();
        } else if (bodyPage === 'detail') {
            renderDetail();
        } else if (bodyPage === 'archive') {
            renderArchive(); // Untuk Genre, Artist, Country, A-Z
        }
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
}

// 3. RENDER GRID VIDEO (HOME/ARCHIVE)
function renderGrid(posts) {
    const container = document.getElementById('post-grid');
    if (!container) return;

    container.innerHTML = ''; // Clear container

    posts.forEach(post => {
        const isNSFW = post.is_nsfw ? 'nsfw-item' : '';
        const card = `
            <div class="card ${isNSFW}" onclick="location.href='detail.html?id=${post.id}'">
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

// 4. LOGIKA HALAMAN DETAIL
function renderDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const post = allPosts.find(p => p.id === id);

    if (post) {
        // Update Meta & Title (SEO Friendly)
        document.title = `${post.title} - Yorunosekai`;
        
        // Render Konten
        document.getElementById('video-player').src = post.video_url;
        document.getElementById('post-title').innerText = post.title;
        document.getElementById('post-desc').innerText = post.description;
        document.getElementById('val-release').innerText = post.release_date;
        document.getElementById('val-duration').innerText = post.duration;
        document.getElementById('val-country').innerText = post.country;
        
        // Render Stars
        const starContainer = document.getElementById('val-stars');
        starContainer.innerHTML = post.stars.map(s => `<a href="artist.html?name=${s}">${s}</a>`).join(', ');

        // Render Genres
        const genreContainer = document.getElementById('val-genres');
        genreContainer.innerHTML = post.genres.map(g => `<span class="genre-tag" onclick="location.href='genre.html?name=${g}'">${g}</span>`).join('');
    }
}

// 5. LOGIKA ARCHIVE (A-Z, GENRE, ARTIST, COUNTRY)
function renderArchive() {
    const params = new URLSearchParams(window.location.search);
    const type = document.body.getAttribute('data-archive-type'); // Misal: 'genre'
    const query = params.get('name'); // Misal: 'Teacher'
    const char = params.get('char'); // Untuk A-Z

    let filtered = allPosts;

    if (query) {
        if (type === 'genre') filtered = allPosts.filter(p => p.genres.includes(query));
        if (type === 'artist') filtered = allPosts.filter(p => p.stars.includes(query));
        if (type === 'country') filtered = allPosts.filter(p => p.country === query);
        document.getElementById('archive-title').innerText = `${type.toUpperCase()}: ${query}`;
    } else if (char) {
        filtered = allPosts.filter(p => p.title.toUpperCase().startsWith(char));
        document.getElementById('archive-title').innerText = `LIST: ${char}`;
    }

    renderGrid(filtered);
}

// 6. INFINITE SCROLL (UNLIMITED PAGINATION)
function initInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
            if (displayedCount < allPosts.length) {
                const nextPosts = allPosts.slice(displayedCount, displayedCount + increment);
                renderGrid([...allPosts.slice(0, displayedCount), ...nextPosts]);
                displayedCount += increment;
            }
        }
    });
}

// 7. DARK/LIGHT MODE & NSFW TOGGLE
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
}

function initNSFW() {
    const sfwStatus = localStorage.getItem('sfw-mode') === 'true';
    if (sfwStatus) document.body.classList.add('sfw-mode');
}

function toggleNSFW() {
    const isSFW = document.body.classList.toggle('sfw-mode');
    localStorage.setItem('sfw-mode', isSFW);
    alert(isSFW ? "SFW Mode Aktif (NSFW Disembunyikan)" : "NSFW Mode Aktif");
}

// 8. SEARCH LOGIC
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const filtered = allPosts.filter(p => p.title.toLowerCase().includes(query));
    renderGrid(filtered);
}

// 9. EVENT LISTENERS
function setupEventListeners() {
    // Hamburger Menu
    const menuBtn = document.getElementById('menu-btn');
    const menuNav = document.getElementById('menu-nav');
    if (menuBtn) {
        menuBtn.onclick = () => menuNav.classList.toggle('active');
    }

    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.oninput = handleSearch;
    }
}
