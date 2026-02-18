// ===== Configuration =====
const TOTAL_TEAMS = 75;
const QR_SIZE = 256; // Resolution for download quality
const QR_DISPLAY_SIZE = 140;

// ===== State =====
let qrDataURLs = []; // Store data URLs for download/print

// ===== Generate All QR Codes =====
async function generateAllQR() {
    const generateBtn = document.getElementById('generateBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const printBtn = document.getElementById('printBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const qrGridContainer = document.getElementById('qrGridContainer');
    const qrGrid = document.getElementById('qrGrid');
    const statsBar = document.getElementById('statsBar');
    const totalGenerated = document.getElementById('totalGenerated');

    // Disable generate button
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="spinner">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="40" stroke-dashoffset="10" stroke-linecap="round"/>
        </svg>
        Generating...
    `;
    generateBtn.style.opacity = '0.7';

    // Show progress bar
    progressContainer.style.display = 'block';
    qrGrid.innerHTML = '';
    qrDataURLs = [];

    // Generate QR codes in batches
    const batchSize = 5;
    for (let i = 1; i <= TOTAL_TEAMS; i += batchSize) {
        const batchEnd = Math.min(i + batchSize - 1, TOTAL_TEAMS);
        const promises = [];

        for (let teamNum = i; teamNum <= batchEnd; teamNum++) {
            promises.push(createQRCard(teamNum, qrGrid));
        }

        await Promise.all(promises);

        // Update progress
        const progress = Math.round((batchEnd / TOTAL_TEAMS) * 100);
        progressFill.style.width = progress + '%';
        progressText.textContent = `Generated ${batchEnd} of ${TOTAL_TEAMS} QR codes...`;
        totalGenerated.textContent = batchEnd;

        // Small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Show completion state
    progressFill.style.width = '100%';
    progressText.textContent = `All ${TOTAL_TEAMS} QR codes generated successfully!`;
    progressText.style.color = '#34d399';

    // Show containers and buttons
    qrGridContainer.style.display = 'block';
    downloadAllBtn.style.display = 'inline-flex';
    printBtn.style.display = 'inline-flex';
    statsBar.style.display = 'flex';

    // Update button to "Regenerate"
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
    generateBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10C4 6.68629 6.68629 4 10 4C12.0736 4 13.8957 5.04452 15 6.63636" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M16 10C16 13.3137 13.3137 16 10 16C7.92638 16 6.10435 14.9555 5 13.3636" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M15 3V7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 17V13H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Regenerate All
    `;

    // Hide progress after delay
    setTimeout(() => {
        progressContainer.style.display = 'none';
    }, 2000);

    // Build print layout
    buildPrintLayout();
}

// ===== Create a Single QR Card =====
function createQRCard(teamNum, container) {
    return new Promise((resolve) => {
        const card = document.createElement('div');
        card.className = 'qr-card';
        card.id = `qr-card-${teamNum}`;
        card.style.animationDelay = `${(teamNum % 10) * 50}ms`;
        card.onclick = () => downloadSingleQR(teamNum);

        // Team number badge
        const teamBadge = document.createElement('div');
        teamBadge.className = 'team-number';
        teamBadge.textContent = `Team #${teamNum}`;

        // QR wrapper
        const qrWrapper = document.createElement('div');
        qrWrapper.className = 'qr-wrapper';
        qrWrapper.id = `qr-wrapper-${teamNum}`;

        // Team label
        const teamLabel = document.createElement('div');
        teamLabel.className = 'team-label';
        teamLabel.textContent = `Team ${teamNum}`;

        // Download hint
        const downloadHint = document.createElement('div');
        downloadHint.className = 'download-hint';
        downloadHint.textContent = 'Click to download';

        card.appendChild(teamBadge);
        card.appendChild(qrWrapper);
        card.appendChild(teamLabel);
        card.appendChild(downloadHint);
        container.appendChild(card);

        // The QR code text content — what the camera will show
        const qrText = `Team ${teamNum}`;

        // Generate QR code
        const qr = new QRCode(qrWrapper, {
            text: qrText,
            width: QR_DISPLAY_SIZE,
            height: QR_DISPLAY_SIZE,
            colorDark: '#1a1a2e',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H,
        });

        // Wait for canvas to render, then capture data URL
        setTimeout(() => {
            const canvas = qrWrapper.querySelector('canvas');
            if (canvas) {
                // Create high-res version for download
                const hiResCanvas = document.createElement('canvas');
                hiResCanvas.width = QR_SIZE;
                hiResCanvas.height = QR_SIZE + 60; // Extra space for team label
                const ctx = hiResCanvas.getContext('2d');

                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, hiResCanvas.width, hiResCanvas.height);

                // Draw QR code scaled up
                ctx.drawImage(canvas, 0, 0, QR_SIZE, QR_SIZE);

                // Add team label below QR
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 28px Inter, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Team ${teamNum}`, QR_SIZE / 2, QR_SIZE + 40);

                qrDataURLs[teamNum] = hiResCanvas.toDataURL('image/png');
            }
            resolve();
        }, 100);
    });
}

// ===== Download Single QR Code =====
function downloadSingleQR(teamNum) {
    const dataUrl = qrDataURLs[teamNum];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `Team_${teamNum}_QR.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== Download All as ZIP =====
async function downloadAllQR() {
    const downloadBtn = document.getElementById('downloadAllBtn');
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="spinner">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="40" stroke-dashoffset="10" stroke-linecap="round"/>
        </svg>
        Creating ZIP...
    `;

    try {
        const zip = new JSZip();
        const folder = zip.folder('Hackathon_QR_Codes');

        for (let i = 1; i <= TOTAL_TEAMS; i++) {
            if (qrDataURLs[i]) {
                const base64Data = qrDataURLs[i].split(',')[1];
                folder.file(`Team_${String(i).padStart(2, '0')}_QR.png`, base64Data, { base64: true });
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'Hackathon_QR_Codes.zip');
    } catch (err) {
        console.error('ZIP creation failed:', err);
        alert('Failed to create ZIP. You can download individual QR codes by clicking on them.');
    }

    downloadBtn.disabled = false;
    downloadBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3V13M10 13L6 9M10 13L14 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 15V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Download All as ZIP
    `;
}

// ===== Build Print Layout =====
function buildPrintLayout() {
    const printLayout = document.getElementById('printLayout');
    printLayout.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'print-grid';

    for (let i = 1; i <= TOTAL_TEAMS; i++) {
        const card = document.createElement('div');
        card.className = 'print-card';

        if (qrDataURLs[i]) {
            const img = document.createElement('img');
            img.src = qrDataURLs[i];
            img.alt = `Team ${i} QR Code`;
            card.appendChild(img);
        }

        const label = document.createElement('div');
        label.className = 'print-team-label';
        label.textContent = `Team ${i}`;
        card.appendChild(label);

        grid.appendChild(card);
    }

    printLayout.appendChild(grid);
}

// ===== Print QR Codes =====
function printQRCodes() {
    window.print();
}

// ===== CSS for spinner animation =====
const style = document.createElement('style');
style.textContent = `
    .spinner {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
