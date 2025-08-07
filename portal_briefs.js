class BriefManager {
    constructor(briefs) {
        this.$briefs = briefs;
        this.currentBriefIndex = 0;
        this.elements = {
            selectBriefs: null,
            downloadPDFs: null,
            downloadWords: null,
            pdfPreviews: null,
            containers: null,
            spinner: null
        };
        this.init();
    }



    async init() {
        this.cacheElements();
        this.checkEmptyState();
        this.bindEvents();
        this.updateAllElements();
    }

    cacheElements() {
        this.elements.selectBriefs = document.querySelectorAll('[data-brief="select-brief"]');
        this.elements.downloadPDFs = document.querySelectorAll('[data-brief="download-pdf"]');
        this.elements.downloadWords = document.querySelectorAll('[data-brief="download-word"]');
        this.elements.pdfPreviews = document.querySelectorAll('[data-brief="pdf-preview"]');
        this.elements.containers = document.querySelectorAll('.pdf-briefs-main-container');
        this.elements.spinner = document.getElementById('half-circle-spinner');
    }

    checkEmptyState() {
        if (!this.elements.containers || this.elements.containers.length === 0) return;

        if (this.$briefs.length === 0) {
            this.elements.containers.forEach(container => {
                container.style.display = 'none';
            });
            this.elements.spinner.style.display = 'block';
        } else {
            this.elements.containers.forEach(container => {
                container.style.display = 'block';
            });
            this.elements.spinner.style.display = 'none';
        }
    }

    bindEvents() {
        if (this.elements.selectBriefs && this.elements.selectBriefs.length > 0) {
            this.elements.selectBriefs.forEach(select => {
                select.addEventListener('change', (e) => {
                    this.setCurrentBrief(parseInt(e.target.value));
                });
            });
        }
    }

    setCurrentBrief(index) {
        if (index >= 0 && index < this.$briefs.length) {
            this.currentBriefIndex = index;
            this.updateAllElements();
        }
    }

    getCurrentBrief() {
        return this.$briefs[this.currentBriefIndex];
    }

    updateBriefSelect() {
        if (!this.elements.selectBriefs || this.elements.selectBriefs.length === 0) return;

        this.elements.selectBriefs.forEach(select => {
            select.innerHTML = '';
            this.$briefs.forEach((brief, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = brief.title;
                select.appendChild(option);
            });
            select.value = this.currentBriefIndex;
        });
    }

    updateDownloadPDF() {
        if (!this.elements.downloadPDFs || this.elements.downloadPDFs.length === 0) return;

        const currentBrief = this.getCurrentBrief();
        if (currentBrief) {
            this.elements.downloadPDFs.forEach(link => {
                link.href = currentBrief.pdf_url;
                link.setAttribute('target', "_blank");
            });
        }
    }

    updateDownloadWord() {
        if (!this.elements.downloadWords || this.elements.downloadWords.length === 0) return;

        const currentBrief = this.getCurrentBrief();
        if (currentBrief) {
            this.elements.downloadWords.forEach(link => {
                link.href = currentBrief.doc_url;
                link.setAttribute('target', "_blank");
            });
        }
    }

    updatePDFPreview() {
        if (!this.elements.pdfPreviews || this.elements.pdfPreviews.length === 0) return;

        const currentBrief = this.getCurrentBrief();
        if (currentBrief) {
            let previewUrl = currentBrief.pdf_url;

            // Handle Google Drive links
            // if (previewUrl.includes('drive.google.com') && !previewUrl.includes('/preview')) {
            //     const fileId = previewUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            //     if (fileId) {
            //         previewUrl = `https://drive.google.com/file/d/${fileId[1]}/preview`;
            //     }
            // }

            this.elements.pdfPreviews.forEach(iframe => {
                iframe.src = previewUrl+"?#toolbar=0";
            });
        }
    }

    updateAllElements() {
        this.updateBriefSelect();
        this.updateDownloadPDF();
        this.updateDownloadWord();
        this.updatePDFPreview();
    }
}



