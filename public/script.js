// TikTok Bulk Downloader Client Script
const API_BASE_URL = window.location.origin;

// DOM Elements
const profileInput = document.getElementById('profile-input');
const fetchBtn = document.getElementById('fetch-btn');
const loader = document.getElementById('loader');
const loaderTitle = document.getElementById('loader-title');
const loaderSubtitle = document.getElementById('loader-subtitle');
const resultsSection = document.getElementById('results-section');

// Creator Banner Elements
const creatorAvatar = document.getElementById('creator-avatar');
const creatorNickname = document.getElementById('creator-nickname');
const creatorUsername = document.getElementById('creator-username');
const statVideoCount = document.getElementById('stat-video-count');

// Toolbar Elements
const selectAllBtn = document.getElementById('select-all-btn');
const selectionCounter = document.getElementById('selection-counter');
const downloadZipBtn = document.getElementById('download-zip-btn');
const downloadSeqBtn = document.getElementById('download-sequential-btn');
const zipCountSpan = document.getElementById('zip-count');

// Grid & Pagination
const videoGrid = document.getElementById('video-grid');
const paginationControls = document.getElementById('pagination-controls');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');

// Progress & Toast
const progressBarContainer = document.getElementById('download-progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercentage = document.getElementById('progress-percentage');
const progressFill = document.getElementById('progress-fill');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// State
let allVideos = [];
let selectedVideoIds = new Set();
let currentProfile = '';
let currentPage = 1;
const videosPerPage = 20;

// Event Listeners
fetchBtn.addEventListener('click', handleFetch);
profileInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleFetch();
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderGrid();
        updatePagination();
        window.scrollTo({ top: resultsSection.offsetTop - 40, behavior: 'smooth' });
    }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(allVideos.length / videosPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderGrid();
        updatePagination();
        window.scrollTo({ top: resultsSection.offsetTop - 40, behavior: 'smooth' });
    }
});

selectAllBtn.addEventListener('click', toggleSelectAll);
downloadZipBtn.addEventListener('click', handleZipDownload);
downloadSeqBtn.addEventListener('click', handleSequentialDownload);

// Loader Countdown Timer
let countdownInterval = null;
let remainingSeconds = 15;

function startLoaderCountdown(seconds = 15) {
    stopLoaderCountdown();
    remainingSeconds = seconds;
    const timerDisplay = document.getElementById('timer-display');
    const updateCountdown = () => {
        if (!timerDisplay) return;
        if (remainingSeconds > 0) {
            const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
            const secs = String(remainingSeconds % 60).padStart(2, '0');
            timerDisplay.innerHTML = `<i class="fas fa-hourglass-half"></i> ${mins}:${secs}`;
            if (loaderSubtitle) loaderSubtitle.textContent = `Fetching videos from TikTok (Estimated: ${remainingSeconds}s)`;
        } else {
            timerDisplay.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Finalizing...`;
            if (loaderSubtitle) loaderSubtitle.textContent = 'Almost done, preparing video stream...';
        }
    };

    updateCountdown();
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        updateCountdown();
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }, 1000);
}

function stopLoaderCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Fetch Handler
async function handleFetch() {
    const input = profileInput.value.trim();
    if (!input) {
        showToast('Please enter a TikTok profile handle or URL', 'warning');
        profileInput.focus();
        return;
    }

    // Reset UI & State
    allVideos = [];
    selectedVideoIds.clear();
    currentPage = 1;
    videoGrid.innerHTML = '';
    resultsSection.classList.add('hidden');
    paginationControls.classList.add('hidden');
    updateSelectionUI();

    loader.classList.remove('hidden');
    loaderTitle.textContent = 'Please wait...';
    startLoaderCountdown(15);

    fetchBtn.disabled = true;

    try {
        const url = `${API_BASE_URL}/api/tiktok/fetch?profile=${encodeURIComponent(input)}&max=100`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        allVideos = data.videos || [];
        currentProfile = data.profile || input;

        if (allVideos.length === 0) {
            showToast('No videos found for this creator. The profile might be private or empty.', 'warning');
            return;
        }

        // Render Profile Banner
        const author = data.author || {};
        creatorNickname.textContent = author.nickname || `@${currentProfile}`;
        creatorUsername.textContent = `@${author.unique_id || currentProfile}`;
        creatorAvatar.src = author.avatar || 'https://via.placeholder.com/150/1f2937/9ca3af?text=TikTok';
        statVideoCount.textContent = allVideos.length;

        // Auto select first 20 videos for convenience
        allVideos.slice(0, Math.min(20, allVideos.length)).forEach(v => selectedVideoIds.add(v.id));

        renderGrid();
        updatePagination();
        updateSelectionUI();

        resultsSection.classList.remove('hidden');
        showToast(`Successfully loaded ${allVideos.length} videos!`, 'success');

        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 150);

    } catch (err) {
        console.error(err);
        showToast(err.message || 'Failed to fetch profile videos', 'error');
    } finally {
        loader.classList.add('hidden');
        stopLoaderCountdown();
        fetchBtn.disabled = false;
    }
}

// Render Video Grid
function renderGrid() {
    videoGrid.innerHTML = '';
    const startIndex = (currentPage - 1) * videosPerPage;
    const endIndex = startIndex + videosPerPage;
    const pageVideos = allVideos.slice(startIndex, endIndex);

    pageVideos.forEach(video => {
        const card = createVideoCard(video);
        videoGrid.appendChild(card);
    });
}

// Create Card Element
function createVideoCard(video) {
    const isSelected = selectedVideoIds.has(video.id);
    const card = document.createElement('div');
    card.className = `video-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = video.id;

    const title = video.description || 'TikTok Video';
    const plays = formatNumber(video.playCount);
    const duration = formatDuration(video.duration);

    card.innerHTML = `
        <div class="select-checkbox ${isSelected ? 'checked' : ''}">
            <i class="fas fa-check"></i>
        </div>
        <div class="thumbnail-wrapper">
            <img src="${video.thumbnail}" alt="${escapeHtml(title)}" loading="lazy" />
            <div class="video-badges">
                ${plays ? `<span class="badge play-badge"><i class="fas fa-play"></i> ${plays}</span>` : ''}
                ${duration ? `<span class="badge time-badge">${duration}</span>` : ''}
            </div>
            <div class="hover-overlay">
                <span class="hover-text">Click to ${isSelected ? 'Deselect' : 'Select'}</span>
            </div>
        </div>
        <div class="card-info">
            <p class="video-caption" title="${escapeHtml(title)}">${escapeHtml(title)}</p>
            <div class="card-action-buttons">
                <button class="action-btn download-video-btn" title="Download HD MP4 without watermark">
                    <i class="fas fa-video"></i> HD MP4
                </button>
                ${video.music_url ? `
                <button class="action-btn download-audio-btn" title="Download MP3 Audio">
                    <i class="fas fa-music"></i> MP3
                </button>` : ''}
            </div>
        </div>
    `;

    // Toggle select on card click (except buttons)
    card.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        toggleVideoSelection(video.id, card);
    });

    // Single HD Download
    const dlVideoBtn = card.querySelector('.download-video-btn');
    dlVideoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDownload(video.download_url, `tiktok_${currentProfile}_${video.id}.mp4`, 'video');
    });

    // Single MP3 Download
    const dlAudioBtn = card.querySelector('.download-audio-btn');
    if (dlAudioBtn && video.music_url) {
        dlAudioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerDownload(video.music_url, `tiktok_${currentProfile}_${video.id}.mp3`, 'audio');
        });
    }

    return card;
}

// Selection Logic
function toggleVideoSelection(id, cardElement) {
    if (selectedVideoIds.has(id)) {
        selectedVideoIds.delete(id);
        if (cardElement) {
            cardElement.classList.remove('selected');
            cardElement.querySelector('.select-checkbox').classList.remove('checked');
        }
    } else {
        selectedVideoIds.add(id);
        if (cardElement) {
            cardElement.classList.add('selected');
            cardElement.querySelector('.select-checkbox').classList.add('checked');
        }
    }
    updateSelectionUI();
}

function toggleSelectAll() {
    if (selectedVideoIds.size === allVideos.length) {
        selectedVideoIds.clear();
    } else {
        allVideos.forEach(v => selectedVideoIds.add(v.id));
    }
    renderGrid();
    updateSelectionUI();
}

function updateSelectionUI() {
    const count = selectedVideoIds.size;
    selectionCounter.textContent = `${count} selected`;
    zipCountSpan.textContent = count;

    downloadZipBtn.disabled = count === 0;
    downloadSeqBtn.disabled = count === 0;

    if (count === allVideos.length && allVideos.length > 0) {
        selectAllBtn.innerHTML = '<i class="fas fa-times"></i> Deselect All';
    } else {
        selectAllBtn.innerHTML = '<i class="fas fa-check-double"></i> Select All';
    }
}

// Bulk ZIP Download Handler
async function handleZipDownload() {
    if (selectedVideoIds.size === 0) return;

    const selectedVideos = allVideos
        .filter(v => selectedVideoIds.has(v.id))
        .map(v => ({
            url: v.download_url,
            id: v.id,
            filename: `tiktok_${currentProfile}_${v.id}.mp4`
        }));

    showToast(`Packaging ${selectedVideos.length} videos into ZIP... Please wait.`, 'info');
    downloadZipBtn.disabled = true;
    showProgressBar(`Zipping ${selectedVideos.length} videos on server...`, 30);

    try {
        const response = await fetch(`${API_BASE_URL}/api/tiktok/download-zip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videos: selectedVideos,
                username: currentProfile
            })
        });

        if (!response.ok) throw new Error('Failed to generate ZIP archive');

        showProgressBar('Downloading ZIP archive...', 90);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `tiktok_${currentProfile}_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);

        showProgressBar('Complete!', 100);
        setTimeout(hideProgressBar, 1500);
        showToast('ZIP downloaded successfully!', 'success');

    } catch (err) {
        console.error(err);
        showToast(err.message || 'ZIP download failed', 'error');
        hideProgressBar();
    } finally {
        downloadZipBtn.disabled = false;
    }
}

// Bulk Sequential Download Handler
async function handleSequentialDownload() {
    if (selectedVideoIds.size === 0) return;

    const selectedVideos = allVideos.filter(v => selectedVideoIds.has(v.id));
    if (!confirm(`Download ${selectedVideos.length} videos individually? Your browser may request permission to download multiple files.`)) {
        return;
    }

    showProgressBar('Starting sequential downloads...', 0);

    for (let i = 0; i < selectedVideos.length; i++) {
        const v = selectedVideos[i];
        const percent = Math.round(((i + 1) / selectedVideos.length) * 100);
        showProgressBar(`Downloading video ${i + 1} of ${selectedVideos.length}...`, percent);

        triggerDownload(v.download_url, `tiktok_${currentProfile}_${v.id}.mp4`, 'video');

        if (i < selectedVideos.length - 1) {
            await new Promise(r => setTimeout(r, 900)); // 0.9s spacing to prevent browser block
        }
    }

    showProgressBar('All downloads initiated!', 100);
    setTimeout(hideProgressBar, 2000);
    showToast('All downloads started!', 'success');
}

// Single Download Trigger
function triggerDownload(url, filename, type = 'video') {
    const proxyUrl = `${API_BASE_URL}/api/tiktok/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&type=${type}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Pagination UI
function updatePagination() {
    const totalPages = Math.ceil(allVideos.length / videosPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
    paginationControls.classList.toggle('hidden', totalPages <= 1);
}

// Progress Bar Helpers
function showProgressBar(text, percent) {
    progressBarContainer.classList.remove('hidden');
    progressText.textContent = text;
    progressPercentage.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
}

function hideProgressBar() {
    progressBarContainer.classList.add('hidden');
    progressFill.style.width = '0%';
}

// Toast Helper
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;

    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
    } else if (type === 'warning') {
        toastIcon.className = 'fas fa-exclamation-triangle';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-times-circle';
    } else {
        toastIcon.className = 'fas fa-info-circle';
    }

    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 4500);
}

// Utility Helpers
function formatNumber(num) {
    if (!num) return '';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDuration(sec) {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
