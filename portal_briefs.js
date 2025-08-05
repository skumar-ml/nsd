class BriefManager {
    $briefs = [];
    constructor(data) {
        this.data = data;
        this.currentBriefIndex = 0;
        this.elements = {
            selectBrief: null,
            downloadPDF: null,
            downloadWord: null,
            pdfPreview: null,
            container: null
        };
        this.checkEmptyState()
        this.cacheElements();
        this.init();
    }

    // Get API data with the help of endpoint
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.data.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return null;
        }
    }

    async init() {
        this.elements.container.style.display = 'none';
        try {
            const data = await this.fetchData(`getCompletedForm/${this.data.memberId}/current`);
            if (data && data.brief) {
                this.$briefs = data.brief;
                console.log('Briefs loaded:', this.$briefs);
            } else {
                console.log('No briefs data available');
                this.$briefs = [];
            }
            this.elements.container.style.display = 'block';
        } catch (error) {
            console.error('Failed to initialize briefs:', error);
            this.$briefs = [];
            this.elements.container.style.display = 'none';
        }


        this.checkEmptyState();
        this.bindEvents();
        this.updateAllElements();
    }

    cacheElements() {
        this.elements.selectBrief = document.querySelector('[data-brief="select-brief"]');
        this.elements.downloadPDF = document.querySelector('[data-brief="download-pdf"]');
        this.elements.downloadWord = document.querySelector('[data-brief="download-word"]');
        this.elements.pdfPreview = document.querySelector('[data-brief="pdf-preview"]');
        this.elements.container = document.querySelector('.pdf-briefs-main-container');
    }

    checkEmptyState() {
        if (!this.elements.container) return;

        if (this.$briefs.length === 0) {
            this.elements.container.style.display = 'none';
        } else {
            this.elements.container.style.display = 'block';
        }
    }

    bindEvents() {
        if (this.elements.selectBrief) {
            this.elements.selectBrief.addEventListener('change', (e) => {
                this.setCurrentBrief(parseInt(e.target.value));
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
        if (!this.elements.selectBrief) return;

        this.elements.selectBrief.innerHTML = '';
        this.$briefs.forEach((brief, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = brief.title;
            this.elements.selectBrief.appendChild(option);
        });
        this.elements.selectBrief.value = this.currentBriefIndex;
    }

    updateDownloadPDF() {
        if (!this.elements.downloadPDF) return;

        const currentBrief = this.getCurrentBrief();
        if (currentBrief) {
            this.elements.downloadPDF.href = currentBrief.pdf_url;
            //this.elements.downloadPDF.textContent = `Download PDF - ${currentBrief.title}`;
        }
    }

    updateDownloadWord() {
        if (!this.elements.downloadWord) return;

        const currentBrief = this.getCurrentBrief();
        if (currentBrief) {
            this.elements.downloadWord.href = currentBrief.doc_url;
            //this.elements.downloadWord.textContent = `Download WORD - ${currentBrief.title}`;
        }
    }

    updatePDFPreview() {
        if (!this.elements.pdfPreview) return;

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

            this.elements.pdfPreview.src = previewUrl;
        }
    }

    updateAllElements() {
        this.updateBriefSelect();
        this.updateDownloadPDF();
        this.updateDownloadWord();
        this.updatePDFPreview();
    }
}

