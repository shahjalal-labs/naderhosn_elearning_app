// Configuration
const API_BASE_URL = "http://localhost:5555/api/v1/book";

// State
let currentPage = 1;
let totalPages = 1;
let searchTerm = '';

// PDF.js viewer state
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let isFlipBookMode = false;
let renderedPages = {}; // Cache for rendered pages
let currentTool = 'cursor'; // Current annotation tool
let currentColor = '#FF6B6B'; // Current annotation color
let currentPdfUrl = ''; // Store current PDF URL for download

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    
    // Add enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadBooks();
        }
    });
});

// Load Books
async function loadBooks(page = 1) {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const booksGrid = document.getElementById('booksGrid');
    const searchInput = document.getElementById('searchInput');
    
    // Show loading
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    booksGrid.innerHTML = '';
    
    searchTerm = searchInput.value.trim();
    currentPage = page;
    
    try {
        const url = `${API_BASE_URL}/test-all-book-fecth`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        
        const result = await response.json();
        let books = result.data || [];

        console.log({books})
        
        // Client-side filtering if search term exists
        if (searchTerm) {
            books = books.filter(book => 
                book.bookName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Client-side pagination
        const itemsPerPage = 12;
        totalPages = Math.ceil(books.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedBooks = books.slice(startIndex, endIndex);
        
        loading.style.display = 'none';
        
        if (paginatedBooks.length === 0) {
            booksGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: white; font-size: 1.2rem;">
                    <p>📚 No books found</p>
                    <p style="font-size: 1rem; margin-top: 10px; opacity: 0.8;">Try a different search term</p>
                </div>
            `;
            document.getElementById('pagination').innerHTML = '';
            return;
        }
        
        displayBooks(paginatedBooks);
        displayPagination(books.length, itemsPerPage);
        
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
        console.error('Error loading books:', error);
    }
}

// Display Books
function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    booksGrid.innerHTML = '';
    
    books.forEach(book => {
        const bookCard = createBookCard(book);
        booksGrid.appendChild(bookCard);
    });
}

// Create Book Card
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const coverImg = book.coverImg || 'https://via.placeholder.com/280x300?text=No+Cover';
    const bookName = book.bookName || 'Untitled';
    const author = book.author || 'Unknown Author';
    const description = book.description || 'No description available';
    const categoryName = book.category?.name || 'Uncategorized';
    
    card.innerHTML = `
        <img src="${coverImg}" alt="${bookName}" class="book-cover" onerror="this.src='https://via.placeholder.com/280x300?text=No+Cover'">
        <div class="book-info">
            <h3 class="book-title">${bookName}</h3>
            <p class="book-author">👤 ${author}</p>
            <span class="book-category">${categoryName}</span>
            <p class="book-description">${description}</p>
            ${book.file ? `<button class="view-pdf-btn" onclick="openPDF('${book.file}', '${bookName}')">
                📖 View PDF
            </button>` : '<p style="color: #999; text-align: center; margin-top: 15px;">PDF not available</p>'}
        </div>
    `;
    
    return card;
}

// Display Pagination
function displayPagination(totalItems, itemsPerPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadBooks(currentPage - 1);
    pagination.appendChild(prevBtn);
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pagination.appendChild(pageInfo);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadBooks(currentPage + 1);
    pagination.appendChild(nextBtn);
}

// Open PDF in Modal with PDF.js for fast streaming
async function openPDF(pdfUrl, bookName) {
    const modal = document.getElementById('pdfModal');
    const modalTitle = document.getElementById('modalTitle');
    const loadingIndicator = document.getElementById('pdfLoadingIndicator');
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    
    modalTitle.textContent = bookName;
    modal.style.display = 'block';
    loadingIndicator.style.display = 'block';
    
    // Store current PDF URL
    currentPdfUrl = pdfUrl;
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    try {
        // Use the streaming endpoint
        const encodedUrl = encodeURIComponent(pdfUrl);
        const streamUrl = `${API_BASE_URL}/test-pdf-reader/${encodedUrl}`;
        
        // Load PDF with range request support
        const loadingTask = pdfjsLib.getDocument({
            url: streamUrl,
            rangeChunkSize: 65536, // 64KB chunks for streaming
            disableAutoFetch: true, // Don't fetch entire PDF at once
            disableStream: false, // Enable streaming
        });
        
        pdfDoc = await loadingTask.promise;
        pageNum = 1;
        
        loadingIndicator.style.display = 'none';
        
        // Render first page
        renderPage(pageNum);
        
        // Update page info
        updatePageInfo();
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        loadingIndicator.innerHTML = `
            <p style=\"color: #ff4444;\">Failed to load PDF</p>
            <p style=\"font-size: 0.9rem;\">Please try again or contact support</p>
        `;
    }
}

// Render a page from PDF
function renderPage(num) {
    pageRendering = true;
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    
    // Get page
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
}

// Queue page rendering
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Toggle between single page and flip book mode
function toggleViewMode() {
    isFlipBookMode = !isFlipBookMode;
    const viewModeBtn = document.getElementById('viewModeBtn');
    const singlePageView = document.getElementById('singlePageView');
    const flipBookView = document.getElementById('flipBookView');
    
    if (isFlipBookMode) {
        viewModeBtn.innerHTML = '📄 Single Page';
        singlePageView.style.display = 'none';
        flipBookView.style.display = 'flex';
        initFlipBook();
    } else {
        viewModeBtn.innerHTML = '📖 Flip Book';
        singlePageView.style.display = 'flex';
        flipBookView.style.display = 'none';
        renderPage(pageNum);
    }
}

// Initialize flip book
async function initFlipBook() {
    if (!pdfDoc) return;
    
    // Check if jQuery and Turn.js are loaded
    if (typeof $ === 'undefined' || typeof $.fn.turn === 'undefined') {
        console.error('jQuery or Turn.js not loaded');
        alert('Page flip library not loaded. Please refresh the page.');
        return;
    }
    
    const flipbookContainer = document.getElementById('flipbook');
    flipbookContainer.innerHTML = '';
    
    const numPages = pdfDoc.numPages;
    
    // Responsive sizing
    const containerWidth = flipbookContainer.parentElement.clientWidth;
    const containerHeight = flipbookContainer.parentElement.clientHeight;
    const pageWidth = Math.min(450, (containerWidth - 100) / 2);
    const pageHeight = Math.min(650, containerHeight - 100);
    
    // Always create even number of pages for proper double display
    const totalPages = numPages % 2 === 0 ? numPages : numPages + 1;
    
    // Create all pages including covers
    for (let i = 0; i <= totalPages + 1; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.id = `flip-page-${i}`;
        
        // First and last pages are covers
        if (i === 0 || i === totalPages + 1) {
            pageDiv.classList.add('hard');
            pageDiv.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #fff; font-size: 24px; font-weight: bold; font-family: Georgia, serif;">Book</div>`;
        }
        
        flipbookContainer.appendChild(pageDiv);
    }
    
    // Destroy existing Turn.js instance if any
    try {
        if ($('#flipbook').turn('is')) {
            $('#flipbook').turn('destroy');
        }
    } catch(e) {
        console.log('No existing flipbook to destroy');
    }
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        // Initialize Turn.js
        $('#flipbook').turn({
            width: pageWidth * 2,
            height: pageHeight,
            autoCenter: true,
            display: 'double',
            acceleration: true,
            gradients: true,
            elevation: 50,
            duration: 1000,
            pages: totalPages + 2,
            page: 2, // Start at first content page (after cover)
            when: {
                turning: function(event, page, view) {
                    console.log('Turning to page:', page);
                    // Update page number (accounting for cover pages)
                    const actualPage = page - 1;
                    if (actualPage >= 1 && actualPage <= numPages) {
                        pageNum = actualPage;
                        updatePageInfo();
                    }
                },
                turned: function(event, page, view) {
                    console.log('Turned to page:', page, 'View:', view);
                    // Render current and nearby pages
                    const actualPage = page - 1;
                    
                    // Render current spread
                    if (actualPage >= 1 && actualPage <= numPages) {
                        renderFlipPage(actualPage);
                    }
                    if (actualPage + 1 <= numPages) {
                        renderFlipPage(actualPage + 1);
                    }
                    
                    // Pre-render adjacent spreads
                    if (actualPage > 1) renderFlipPage(actualPage - 1);
                    if (actualPage + 2 <= numPages) renderFlipPage(actualPage + 2);
                }
            }
        });
        
        console.log('Turn.js initialized with', totalPages + 2, 'pages');
        
        // Render first visible spread (pages 1 and 2)
        setTimeout(() => {
            console.log('Rendering initial pages...');
            renderFlipPage(1);
            if (numPages > 1) renderFlipPage(2);
            if (numPages > 2) renderFlipPage(3);
            if (numPages > 3) renderFlipPage(4);
        }, 200);
        
        pageNum = 1;
        updatePageInfo();
    }, 100);
}

// Render a page for flip book (separate from single page rendering)
async function renderFlipPage(num) {
    if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;
    if (renderedPages[num]) return; // Already rendered
    
    try {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.3 });
        
        // Create canvas for this page
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render page
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        
        // Add to flipbook (num + 1 because of cover page)
        const pageDiv = document.getElementById(`flip-page-${num + 1}`);
        if (pageDiv) {
            pageDiv.innerHTML = '';
            pageDiv.appendChild(canvas);
            renderedPages[num] = true;
        }
    } catch (error) {
        console.error(`Error rendering flip page ${num}:`, error);
    }
}

// Previous page - works for both modes
function previousPage() {
    if (!pdfDoc) return;
    
    if (isFlipBookMode) {
        try {
            if (typeof $ !== 'undefined' && $('#flipbook').turn('is')) {
                $('#flipbook').turn('previous');
                console.log('Turned to previous page');
            } else {
                console.error('Turn.js not initialized');
            }
        } catch(e) {
            console.error('Error turning page:', e);
        }
    } else {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
        updatePageInfo();
    }
}

// Next page - works for both modes
function nextPage() {
    if (!pdfDoc) return;
    
    if (isFlipBookMode) {
        try {
            if (typeof $ !== 'undefined' && $('#flipbook').turn('is')) {
                $('#flipbook').turn('next');
                console.log('Turned to next page');
            } else {
                console.error('Turn.js not initialized');
            }
        } catch(e) {
            console.error('Error turning page:', e);
        }
    } else {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
        updatePageInfo();
    }
}

// Zoom in
function zoomIn() {
    if (scale < 3) {
        scale += 0.25;
        queueRenderPage(pageNum);
        updateZoomInfo();
    }
}

// Zoom out
function zoomOut() {
    if (scale > 0.5) {
        scale -= 0.25;
        queueRenderPage(pageNum);
        updateZoomInfo();
    }
}

// Update page info
function updatePageInfo() {
    if (!pdfDoc) return;
    
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    pageInfo.textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
    
    prevBtn.disabled = pageNum <= 1;
    nextBtn.disabled = pageNum >= pdfDoc.numPages;
}

// Update zoom info
function updateZoomInfo() {
    const zoomInfo = document.getElementById('zoomInfo');
    zoomInfo.textContent = `${Math.round(scale * 100)}%`;
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('pdfModal');
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    
    modal.style.display = 'none';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Destroy flip book if active
    try {
        if (isFlipBookMode && typeof $ !== 'undefined' && $('#flipbook').turn('is')) {
            $('#flipbook').turn('destroy');
            console.log('Flipbook destroyed');
        }
    } catch(e) {
        console.log('Error destroying flipbook:', e);
    }
    
    // Reset PDF state
    if (pdfDoc) {
        pdfDoc.destroy();
        pdfDoc = null;
    }
    pageNum = 1;
    scale = 1.5;
    isFlipBookMode = false;
    renderedPages = {};
    
    // Reset view
    document.getElementById('singlePageView').style.display = 'flex';
    document.getElementById('flipBookView').style.display = 'none';
    document.getElementById('viewModeBtn').innerHTML = '📖 Flip Book';
    
    // Re-enable body scroll
    document.body.style.overflow = 'auto';
}

// Reset Search
function resetSearch() {
    document.getElementById('searchInput').value = '';
    searchTerm = '';
    loadBooks(1);
}

// Annotation Tool Selection
function selectTool(tool) {
    currentTool = tool;
    
    // Remove active class from all tool buttons
    ['cursorBtn', 'penBtn', 'highlightBtn', 'underlineBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    
    // Add active class to selected tool
    const selectedBtn = document.getElementById(tool + 'Btn');
    if (selectedBtn) selectedBtn.classList.add('active');
    
    // Show/hide color picker for drawing tools
    const colorPicker = document.getElementById('colorPicker');
    if (tool === 'pen' || tool === 'highlight') {
        colorPicker.style.display = 'flex';
    } else {
        colorPicker.style.display = 'none';
    }
    
    console.log('Tool selected:', tool);
}

// Color Selection
function selectColor(color) {
    currentColor = color;
    
    // Remove selected class from all color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to clicked color
    event.target.classList.add('selected');
    
    console.log('Color selected:', color);
}

// Search in PDF
function searchInPDF() {
    const searchQuery = prompt('Enter text to search in this PDF:');
    if (searchQuery && searchQuery.trim()) {
        alert('Search functionality will highlight all instances of: ' + searchQuery);
        // TODO: Implement actual PDF text search
        console.log('Searching for:', searchQuery);
    }
}

// Download PDF
function downloadPDF() {
    if (!currentPdfUrl) {
        alert('No PDF is currently open');
        return;
    }
    
    const link = document.createElement('a');
    link.href = currentPdfUrl;
    link.download = document.getElementById('modalTitle').textContent + '.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Downloading PDF:', currentPdfUrl);
}

// Print PDF
function printPDF() {
    if (!pdfDoc) {
        alert('No PDF is currently open');
        return;
    }
    
    window.print();
    console.log('Printing PDF');
}

// Copy Text
function copyText() {
    alert('Text copying enabled. Select text on the PDF to copy.');
    console.log('Copy text mode enabled');
    // TODO: Implement text selection and copying
}

// Share Document
function shareDocument() {
    if (!currentPdfUrl) {
        alert('No PDF is currently open');
        return;
    }
    
    const shareData = {
        title: document.getElementById('modalTitle').textContent,
        text: 'Check out this book!',
        url: currentPdfUrl
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Shared successfully'))
            .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback: copy link to clipboard
        navigator.clipboard.writeText(currentPdfUrl)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => alert('Unable to share. Link: ' + currentPdfUrl));
    }
}

// Toggle Bookmark
function toggleBookmark() {
    if (!pdfDoc || !pageNum) {
        alert('No page is currently displayed');
        return;
    }
    
    const bookmarkKey = 'bookmark_' + currentPdfUrl + '_page_' + pageNum;
    const existingBookmark = localStorage.getItem(bookmarkKey);
    
    if (existingBookmark) {
        localStorage.removeItem(bookmarkKey);
        alert('Bookmark removed from page ' + pageNum);
    } else {
        localStorage.setItem(bookmarkKey, JSON.stringify({
            url: currentPdfUrl,
            page: pageNum,
            date: new Date().toISOString()
        }));
        alert('Page ' + pageNum + ' bookmarked!');
    }
}

// Reset Search
function resetSearch() {
    document.getElementById('searchInput').value = '';
    searchTerm = '';
    loadBooks(1);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('pdfModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
    // Arrow keys for page navigation when modal is open
    if (document.getElementById('pdfModal').style.display === 'block') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            previousPage();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextPage();
        }
    }
});
