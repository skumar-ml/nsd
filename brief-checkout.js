class BriefsCheckout {
    constructor(data) {
        this.data = data;              // Configuration + user/session data (apiBaseURL, memberId, accountEmail, etc.)
        this.selectedBriefs = [];      // Track IDs of selected briefs
        this.init();
        this.getBriefs();              // Fetch available briefs on init
    }

    /**
     * Generic API fetcher
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {string|null} memberId - Optional member ID to append
     */
    async fetchData(endpoint, memberId = null) {
        try {
            let url = `${this.data.apiBaseURL}${endpoint}`;
            if (memberId) url += `/${memberId}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }

    /**
     * Fetch briefs from API and render them
     */
    async getBriefs() {
        const nextPage2Btn = document.getElementById('next_page_2');
        nextPage2Btn.style.display = 'none'; // Hide next button until data is ready

        this.showLoading();
        try {
            const response = await this.fetchData('getBriefDetails');
            if (response && response.briefs) {
                if (response.briefs.length === 0) {
                    this.showError('No briefs are currently available.');
                } else {
                    nextPage2Btn.style.display = 'block';
                    this.renderBriefs(response.briefs);
                }
            } else {
                this.showError('Unable to load briefs. Please try again later.');
            }
        } catch (error) {
            console.error('Error fetching briefs:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
    }

    /**
     * Render briefs in grid container
     */
    renderBriefs(briefs) {
        const container = document.querySelector('[data-briefs-checkout="select-briefs"] .pdf-briefs-grid-wrapper');
        if (!container) return console.error('Briefs container not found');

        container.innerHTML = ''; // Clear existing

        // Sort by displayOrder if provided
        const sortedBriefs = briefs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        // Create cards for briefs
        sortedBriefs.forEach((brief, index) => {
            const briefCard = this.createBriefCard(brief, index === 0); // first is preselected
            container.appendChild(briefCard);
        });

        // Update totals
        sortedBriefs.length > 0 ? this.updateTotal() : this.updateOrderDetails();
    }

    /**
     * Show loading spinner in briefs container
     */
    showLoading() {
        const container = document.querySelector('[data-briefs-checkout="select-briefs"] .pdf-briefs-grid-wrapper');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;grid-column: 1 / 4">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #d38d97; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 20px;">Loading briefs...</p>
                </div>
                <style>
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;
        }
    }

    /**
     * Create a brief card element
     * @param {object} brief - Brief object
     * @param {boolean} isSelected - Whether this brief is selected initially
     */
    createBriefCard(brief, isSelected = false) {
        const card = document.createElement('div');
        card.className = `pdf-brief-card ${isSelected ? 'red-border' : ''}`;
        card.dataset.briefId = brief.briefId;

        card.innerHTML = `
            <div class="pdf-brief-flex-wrapper">
                <div>
                    <img src=".../check_box.svg" class="check_inactive-icon" ${isSelected ? 'style="display: none;"' : ''} />
                    <img src=".../check_active.svg" class="check_active-icon" ${isSelected ? '' : 'style="display: none;"'} />
                </div>
                <p class="pdf-briefs-title">${brief.title}</p>
                <img src=".../pdf-brief.svg" class="pdf-brief-icon" />
            </div>
            <p class="pdf-brief-text-medium">${brief.description}</p>
            <p class="pdf-brief-text-small">Topic: ${brief.topic}</p>
            <p class="pdf-brief-price">$${parseFloat(brief.price).toFixed(2)}</p>
        `;

        card.addEventListener('click', () => this.toggleBriefSelection(brief.briefId, card));
        if (isSelected) this.selectedBriefs.push(brief.briefId);

        return card;
    }

    /**
     * Toggle a brief card selection
     */
    toggleBriefSelection(briefId, card) {
        const isSelected = card.classList.contains('red-border');
        if (isSelected) {
            card.classList.remove('red-border');
            this.selectedBriefs = this.selectedBriefs.filter(id => id !== briefId);
            card.querySelector('.check_inactive-icon').style.display = 'block';
            card.querySelector('.check_active-icon').style.display = 'none';
        } else {
            card.classList.add('red-border');
            this.selectedBriefs.push(briefId);
            card.querySelector('.check_inactive-icon').style.display = 'none';
            card.querySelector('.check_active-icon').style.display = 'block';
        }
        this.updateTotal();
    }

    /**
     * Update total price, hidden inputs, and order details
     */
    updateTotal() {
        const isCreditCardSelected = this.isCreditCardSelected();
        const total = this.selectedBriefs.reduce((sum, briefId) => {
            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (card) {
                const price = parseFloat(card.querySelector('.pdf-brief-price').textContent.replace('$', '').trim()) || 0;
                const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(price) : price;
                return sum + finalPrice;
            }
            return sum;
        }, 0);

        const totalElement = document.getElementById('totalAmount');
        if (totalElement) totalElement.value = total;

        this.updateOrderDetails();
    }

    /**
     * Show error message in container
     */
    showError(message) {
        const container = document.querySelector('[data-briefs-checkout="select-briefs"] .pdf-briefs-grid-wrapper');
        if (container) {
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;"><p>${message}</p></div>`;
        }
    }

    /**
     * Initialization
     */
    init() {
        this.setupNavigation();
        this.setInitialState();
    }

    /**
     * Set initial tab states
     */
    setInitialState() {
        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        if (paymentSection) paymentSection.style.display = 'none';

        const briefsSection = document.querySelector('[data-briefs-checkout="select-briefs"]');
        if (briefsSection) briefsSection.style.display = 'block';

        this.updatePayNowButtonVisibility();
    }

    /**
     * Show/hide Pay Now buttons depending on tab
     */
    updatePayNowButtonVisibility() {
        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        paymentSection && paymentSection.style.display !== 'none'
            ? this.showPayNowButton()
            : this.hidePayNowButton();
    }

    /**
     * Show Pay Now buttons
     */
    showPayNowButton() {
        document.querySelectorAll('[data-briefs-checkout="pay-now"], #pay-now-link-3')
            .forEach(btn => btn.style.display = 'inline-block');
    }

    /**
     * Hide Pay Now buttons
     */
    hidePayNowButton() {
        document.querySelectorAll('[data-briefs-checkout="pay-now"], #pay-now-link-3')
            .forEach(btn => btn.style.display = 'none');
    }

    /**
     * Setup navigation buttons (next/prev/payment tabs/pay-now)
     */
    setupNavigation() {
        const nextPage2Btn = document.getElementById('next_page_2');
        if (nextPage2Btn) {
            nextPage2Btn.addEventListener('click', e => {
                e.preventDefault();
                this.showPaymentMethod();
                window.scrollTo(0, 0);
                this.activeBreadCrumb('pay-deposite');
            });
        }

        const prevPage1Btn = document.getElementById('prev_page_1');
        if (prevPage1Btn) {
            prevPage1Btn.addEventListener('click', e => {
                e.preventDefault();
                this.showBriefsSelection();
                window.scrollTo(0, 0);
                this.activeBreadCrumb('pdf-briefs');
            });
        }

        this.setupPaymentMethodTabs();
        this.setupPayNowButtons();
    }

    /**
     * Handle payment method tab clicks
     */
    setupPaymentMethodTabs() {
        document.querySelectorAll('.payment-cards-tabs-menu .w-tab-link').forEach(tab => {
            tab.addEventListener('click', () => {
                setTimeout(() => {
                    this.updateOrderDetails();
                    this.updatePayNowButtonVisibility();
                }, 100);
            });
        });
    }

    /**
     * Attach click events to pay now buttons
     */
    setupPayNowButtons() {
        document.querySelectorAll('[data-briefs-checkout="pay-now"], #pay-now-link-3')
            .forEach(element => element.addEventListener('click', e => {
                e.preventDefault();
                this.payNow();
            }));
    }

    /**
     * Show payment method section (after validation)
     */
    showPaymentMethod() {
        if (this.selectedBriefs.length === 0) {
            alert('Please select at least one brief before proceeding to payment.');
            return;
        }

        document.querySelector('[data-briefs-checkout="select-briefs"]').style.display = 'none';
        document.querySelector('[data-briefs-checkout="select-payment-method"]').style.display = 'block';

        this.showPayNowButton();
        this.updateOrderDetails();
    }

    /**
     * Show briefs selection section
     */
    showBriefsSelection() {
        document.querySelector('[data-briefs-checkout="select-briefs"]').style.display = 'block';
        document.querySelector('[data-briefs-checkout="select-payment-method"]').style.display = 'none';
        this.hidePayNowButton();
    }

    /**
     * Update order details sidebar
     */
    updateOrderDetails() {
        const emptyOrderDetails = document.querySelector('[data-briefs-checkout="empty-order-details"]');
        const briefsOrderDetails = document.querySelector('[data-briefs-checkout="briefs-order-details"]');

        if (this.selectedBriefs.length === 0) {
            if (emptyOrderDetails) emptyOrderDetails.style.display = 'block';
            if (briefsOrderDetails) briefsOrderDetails.style.display = 'none';
        } else {
            if (emptyOrderDetails) emptyOrderDetails.style.display = 'none';
            if (briefsOrderDetails) briefsOrderDetails.style.display = 'block';
            this.updateBriefsListInOrderDetails();
        }
    }

    /**
     * Update selected briefs in sidebar order details
     */
    updateBriefsListInOrderDetails() {
        const briefsContainer = document.querySelector('[data-briefs-checkout="briefs-order-details"] .brief-flex-wrapper');
        if (!briefsContainer) return;

        // Remove old brief rows except the template one
        briefsContainer.parentElement.querySelectorAll('.brief-flex-wrapper').forEach(brief => {
            if (brief !== briefsContainer) brief.remove();
        });

        this.selectedBriefs.forEach(briefId => {
            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (!card) return;

            const title = card.querySelector('.pdf-briefs-title').textContent.trim();
            const basePrice = parseFloat(card.querySelector('.pdf-brief-price').textContent.replace('$', '').trim()) || 0;
            const isCreditCardSelected = this.isCreditCardSelected();
            const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;

            const briefElement = document.createElement('div');
            briefElement.className = 'brief-flex-wrapper';
            briefElement.innerHTML = `
                <p class="dm-sans brief-medium">${title}</p>
                <p class="dm-sans brief-medium">$${finalPrice.toFixed(2)}</p>
            `;
            briefsContainer.parentElement.insertBefore(briefElement, briefsContainer.nextSibling);
        });

        this.updateOrderTotal();
    }

    /**
     * Update total in sidebar order details
     */
    updateOrderTotal() {
        const totalElement = document.querySelector('[data-briefs-checkout="briefs-order-details"] .total-price-bold');
        if (totalElement) {
            const isCreditCardSelected = this.isCreditCardSelected();
            const total = this.selectedBriefs.reduce((sum, briefId) => {
                const card = document.querySelector(`[data-brief-id="${briefId}"]`);
                if (card) {
                    const price = parseFloat(card.querySelector('.pdf-brief-price').textContent.replace('$', '').trim()) || 0;
                    const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(price) : price;
                    return sum + finalPrice;
                }
                return sum;
            }, 0);

            const formattedPrice = (Math.floor(total * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
            totalElement.textContent = `$${formattedPrice}`;
        }
    }

    /**
     * Credit card fee calculation
     */
    calculateCreditCardAmount(amount) {
        return Math.floor(((parseFloat(amount) + 0.3) / 0.971) * 100) / 100;
    }

    /**
     * Check if credit card tab is active
     */
    isCreditCardSelected() {
        const creditCardTab = document.querySelector('.credit-card-tab');
        return creditCardTab && creditCardTab.classList.contains('w--current');
    }

    /**
     * Validate user + payment data before checkout
     */
    validatePaymentData() {
        if (!this.data.memberId) {
            alert('Member ID is required. Please log in again.');
            return false;
        }
        if (!this.data.accountEmail) {
            alert('Account email is required. Please check your settings.');
            return false;
        }

        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        if (paymentSection && paymentSection.style.display !== 'none') {
            if (!this.isCreditCardSelected() && !document.querySelector('.bank-transfer-tab.w--current')) {
                alert('Please select a payment method before proceeding.');
                return false;
            }
        }
        return true;
    }

    /**
     * Handle Pay Now button click → start checkout flow
     */
    payNow() {
        if (this.selectedBriefs.length === 0) {
            alert('Please select at least one brief before proceeding.');
            return;
        }
        if (!this.validatePaymentData()) return;

        // Lock buttons
        document.querySelectorAll('[data-briefs-checkout="pay-now"], #pay-now-link-3')
            .forEach(el => { el.innerHTML = "Processing..."; el.style.pointerEvents = "none"; });

        const isCreditCardSelected = this.isCreditCardSelected();

        // Cancel URL
        const cancelUrl = new URL("https://www.nsdebatecamp.com/" + window.location.pathname);
        if (!cancelUrl.searchParams.has('returnType')) cancelUrl.searchParams.set('returnType', 'back');
        let localUtmSource = localStorage.getItem("utm_source");

        // Payload
        const checkoutData = {
            email: this.data.accountEmail,
            briefIds: this.selectedBriefs,
            memberId: this.data.memberId,
            productType: "brief",
            device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
            deviceUserAgent: navigator.userAgent,
            successUrl: `https://www.nsdebatecamp.com/members/${this.data.memberId}?briefsPayment=true`,
            cancelUrl: cancelUrl.href,
            source: "brief-checkout",
            utm_source: localUtmSource || "",
            paymentId: ""
        };

        // Send checkout request
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${this.data.apiBaseURL}createCheckoutUrlForBrief`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    if (response.cardUrl && isCreditCardSelected) window.location = response.cardUrl;
                    else if (response.achUrl && !isCreditCardSelected) window.location = response.achUrl;
                    else alert("Something went wrong. Please try again.");
                } else {
                    alert("Payment failed. Please try again.");
                    this.resetPayNowButtons();
                }
            } catch (err) {
                console.error('Error parsing response:', err);
                alert("An error occurred. Please try again.");
                this.resetPayNowButtons();
            }
        };

        xhr.onerror = () => {
            console.error('Network error');
            alert("Network error. Please try again.");
            this.resetPayNowButtons();
        };

        xhr.send(JSON.stringify(checkoutData));
    }

    /**
     * Reset Pay Now buttons back to normal
     */
    resetPayNowButtons() {
        document.querySelectorAll('[data-briefs-checkout="pay-now"], #pay-now-link-3')
            .forEach(el => { el.innerHTML = "Pay Now"; el.style.pointer
