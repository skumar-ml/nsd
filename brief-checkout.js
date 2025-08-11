class BriefsCheckout {
    constructor(data) {
        this.data = data;
        this.selectedBriefs = [];
        this.init();
        this.getBriefs();
    }

    async fetchData(endpoint, memberId = null) {
        try {
            let url = `${this.data.apiBaseURL}${endpoint}`;
            if (memberId) {
                url = `${this.data.apiBaseURL}${endpoint}/${memberId}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const apiData = await response.json();
            return apiData;
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }

    async getBriefs() {
        const nextPage2Btn = document.getElementById('next_page_2');
        nextPage2Btn.style.display = 'none';

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
                console.error('No briefs data received');
                this.showError('Unable to load briefs. Please try again later.');
            }
        } catch (error) {
            console.error('Error fetching briefs:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
    }

    renderBriefs(briefs) {
        const container = document.querySelector('[data-briefs-checkout="select-briefs"] .pdf-briefs-grid-wrapper');
        if (!container) {
            console.error('Briefs container not found');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Sort briefs by displayOrder if available
        const sortedBriefs = briefs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        // Create brief cards
        sortedBriefs.forEach((brief, index) => {
            const briefCard = this.createBriefCard(brief, index === 0); // First brief is selected by default
            container.appendChild(briefCard);
        });

        // Update total if there are briefs
        if (sortedBriefs.length > 0) {
            this.updateTotal();
        } else {
            // Update order details even if no briefs
            this.updateOrderDetails();
        }
    }

    showLoading() {
        const container = document.querySelector('[data-briefs-checkout="select-briefs"] .pdf-briefs-grid-wrapper');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;grid-column: 1 / 4">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #d38d97; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 20px;">Loading briefs...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    }

    createBriefCard(brief, isSelected = false) {
        const card = document.createElement('div');
        card.className = `pdf-brief-card ${isSelected ? 'red-border' : ''}`;
        card.dataset.briefId = brief.briefId;

        card.innerHTML = `
            <div class="pdf-brief-flex-wrapper">
                <div>
                    <img loading="lazy" src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/675c15fe5f8aea4cf0c7c9f5_check_box.svg" alt="" class="check_inactive-icon" ${isSelected ? 'style="display: none;"' : ''} />
                    <img loading="lazy" src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/675c15fe5f8aea4cf0c7c9fb_check%20(3).svg" alt="" class="check_active-icon" ${isSelected ? '' : 'style="display: none;"'} />
                </div>
                <p class="pdf-briefs-title">${brief.title}<br /></p>
                <img src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/688c7c07e7e21bc1cfcce250_pdf-brief.svg" loading="lazy" alt="" class="pdf-brief-icon" />
            </div>
            <p class="pdf-brief-text-medium">${brief.description}<br /></p>
            <p class="pdf-brief-text-small">Topic: ${brief.topic}<br /></p>
            <p class="pdf-brief-price">$${parseFloat(brief.price).toFixed(2)}<br /></p>
        `;

        // Add click handler
        card.addEventListener('click', () => this.toggleBriefSelection(brief.briefId, card));

        // Add to selected briefs if initially selected
        if (isSelected) {
            this.selectedBriefs.push(brief.briefId);
        }

        return card;
    }

    toggleBriefSelection(briefId, card) {
        const isSelected = card.classList.contains('red-border');

        if (isSelected) {
            // Deselect
            card.classList.remove('red-border');
            this.selectedBriefs = this.selectedBriefs.filter(id => id !== briefId);

            // Update icons
            const inactiveIcon = card.querySelector('.check_inactive-icon');
            const activeIcon = card.querySelector('.check_active-icon');
            if (inactiveIcon) inactiveIcon.style.display = 'block';
            if (activeIcon) activeIcon.style.display = 'none';
        } else {
            // Select
            card.classList.add('red-border');
            this.selectedBriefs.push(briefId);

            // Update icons
            const inactiveIcon = card.querySelector('.check_inactive-icon');
            const activeIcon = card.querySelector('.check_active-icon');
            if (inactiveIcon) inactiveIcon.style.display = 'none';
            if (activeIcon) activeIcon.style.display = 'block';
        }

        this.updateTotal();
    }

    updateTotal() {
        // Calculate total from selected briefs
        const isCreditCardSelected = this.isCreditCardSelected();
        const total = this.selectedBriefs.reduce((sum, briefId) => {
            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (card) {
                const priceText = card.querySelector('.pdf-brief-price').textContent;
                const price = parseFloat(priceText.replace('$', '').replace('\n', '').trim());
                const basePrice = isNaN(price) ? 0 : price;

                // Apply credit card fee formula if credit card is selected
                const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;
                return sum + finalPrice;
            }
            return sum;
        }, 0);

        // Update total amount display if it exists
        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.value = parseFloat(total);
        }

        // Update selected briefs for form submission
        const suppProIdsElement = document.getElementById('suppProIds');
        if (suppProIdsElement) {
            suppProIdsElement.value = JSON.stringify(this.selectedBriefs);
        }

        // Update order details sidebar
        this.updateOrderDetails();

        console.log('Selected briefs:', this.selectedBriefs);
        console.log('Total amount:', total);
        console.log('Credit card selected:', isCreditCardSelected);

        if (isCreditCardSelected) {
            const individualAmounts = this.getIndividualBriefAmounts();
            console.log('Individual brief amounts with credit card fees:', individualAmounts);
        }
    }

    showError(message) {
        const container = document.querySelector('[data-briefs-checkout="select-briefs"] .pdf-briefs-grid-wrapper');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>${message}</p>
                </div>
            `;
        }
    }

    init() {
        console.log('BriefsCheckout initialized');
        this.setupNavigation();
        this.setInitialState();        
    }

    setInitialState() {
        // Ensure payment method section is initially hidden
        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        if (paymentSection) {
            paymentSection.style.display = 'none';
        }

        // Ensure briefs selection is visible
        const briefsSection = document.querySelector('[data-briefs-checkout="select-briefs"]');
        if (briefsSection) {
            briefsSection.style.display = 'block';
        }

        // Ensure pay now button visibility matches current tab
        this.updatePayNowButtonVisibility();
    }

    showPayNowButton() {
        // Show pay now button in order details sidebar
        const payNowButton = document.querySelector('[data-briefs-checkout="pay-now"]');
        if (payNowButton) {
            payNowButton.style.display = 'inline-block';
        }

        // Show pay now button in payment method section
        const payNowLink3 = document.getElementById('pay-now-link-3');
        if (payNowLink3) {
            payNowLink3.style.display = 'inline-block';
        }
    }

    hidePayNowButton() {
        // Hide pay now button in order details sidebar
        const payNowButton = document.querySelector('[data-briefs-checkout="pay-now"]');
        if (payNowButton) {
            payNowButton.style.display = 'none';
        }

        // Hide pay now button in payment method section
        const payNowLink3 = document.getElementById('pay-now-link-3');
        if (payNowLink3) {
            payNowLink3.style.display = 'none';
        }
    }

    setupNavigation() {
        // Setup next_page_2 button to show payment method
        const nextPage2Btn = document.getElementById('next_page_2');
        if (nextPage2Btn) {
            nextPage2Btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPaymentMethod();
                // scroll top 
                window.scrollTo(0, 0);
                this.activeBreadCrumb('pay-deposite');
            });
        }

        // Setup prev_page_1 button to show briefs selection
        const prevPage1Btn = document.getElementById('prev_page_1');
        if (prevPage1Btn) {
            prevPage1Btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showBriefsSelection();
                window.scrollTo(0, 0);
                this.activeBreadCrumb('pdf-briefs');
            });
        }

        // Setup payment method tab listeners
        this.setupPaymentMethodTabs();

        // Setup pay now button listeners
        this.setupPayNowButtons();
    }

    setupPaymentMethodTabs() {
        const paymentTabs = document.querySelectorAll('.payment-cards-tabs-menu .w-tab-link');
        paymentTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Wait a bit for the tab to switch, then update order details
                setTimeout(() => {
                    this.updateOrderDetails();
                    // Ensure pay now button is visible when on payment method tab
                    this.updatePayNowButtonVisibility();
                }, 100);
            });
        });
    }

    updatePayNowButtonVisibility() {
        // Check if we're currently on the payment method tab
        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        if (paymentSection && paymentSection.style.display !== 'none') {
            // We're on payment method tab, show pay now button
            this.showPayNowButton();
        } else {
            // We're on briefs selection tab, hide pay now button
            this.hidePayNowButton();
        }
    }

    setupPayNowButtons() {
        // Setup pay now button with data-briefs-checkout="pay-now"
        const payNowElements = document.querySelectorAll('[data-briefs-checkout="pay-now"]');
        payNowElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.payNow();
            });
        });

        // Setup pay now button with id="pay-now-link-3"
        const payNowButton = document.getElementById('pay-now-link-3');
        if (payNowButton) {
            payNowButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.payNow();
            });
        }
    }

    showPaymentMethod() {
        // Validate that at least one brief is selected
        if (this.selectedBriefs.length === 0) {
            alert('Please select at least one brief before proceeding to payment.');
            return;
        }

        // Hide briefs selection
        const briefsSection = document.querySelector('[data-briefs-checkout="select-briefs"]');
        if (briefsSection) {
            briefsSection.style.display = 'none';
        }

        // Show payment method
        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        if (paymentSection) {
            paymentSection.style.display = 'block';
        }

        // Show pay now button
        this.showPayNowButton();

        // Update order details if needed
        this.updateOrderDetails();
    }

    showBriefsSelection() {
        // Show briefs selection
        const briefsSection = document.querySelector('[data-briefs-checkout="select-briefs"]');
        if (briefsSection) {
            briefsSection.style.display = 'block';
        }

        // Hide payment method
        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        if (paymentSection) {
            paymentSection.style.display = 'none';
        }

        // Hide pay now button
        this.hidePayNowButton();
    }

    updateOrderDetails() {
        const emptyOrderDetails = document.querySelector('[data-briefs-checkout="empty-order-details"]');
        const briefsOrderDetails = document.querySelector('[data-briefs-checkout="briefs-order-details"]');

        if (this.selectedBriefs.length === 0) {
            // Show empty state
            if (emptyOrderDetails) emptyOrderDetails.style.display = 'block';
            if (briefsOrderDetails) briefsOrderDetails.style.display = 'none';
        } else {
            // Show briefs details
            if (emptyOrderDetails) emptyOrderDetails.style.display = 'none';
            if (briefsOrderDetails) briefsOrderDetails.style.display = 'block';

            // Update the briefs list in order details
            this.updateBriefsListInOrderDetails();
        }
    }

    updateBriefsListInOrderDetails() {
        const briefsContainer = document.querySelector('[data-briefs-checkout="briefs-order-details"] .brief-flex-wrapper');
        if (!briefsContainer) return;

        // Clear existing briefs
        const existingBriefs = briefsContainer.parentElement.querySelectorAll('.brief-flex-wrapper');
        existingBriefs.forEach(brief => {
            if (brief !== briefsContainer) {
                brief.remove();
            }
        });

        // Add selected briefs
        this.selectedBriefs.forEach(briefId => {
            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (card) {
                const title = card.querySelector('.pdf-briefs-title').textContent.trim();
                const basePriceText = card.querySelector('.pdf-brief-price').textContent.trim();
                const basePrice = parseFloat(basePriceText.replace('$', '').replace('\n', '').trim());

                // Calculate final price based on payment method
                const isCreditCardSelected = this.isCreditCardSelected();
                const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;
                const displayPrice = `$${finalPrice.toFixed(2)}`;

                const briefElement = document.createElement('div');
                briefElement.className = 'brief-flex-wrapper';
                briefElement.innerHTML = `
                    <p class="dm-sans brief-medium">${title}</p>
                    <p class="dm-sans brief-medium">${displayPrice}</p>
                `;

                briefsContainer.parentElement.insertBefore(briefElement, briefsContainer.nextSibling);
            }
        });

        // Update total
        this.updateOrderTotal();
    }

    updateOrderTotal() {
        const totalElement = document.querySelector('[data-briefs-checkout="briefs-order-details"] .total-price-bold');
        if (totalElement) {
            const isCreditCardSelected = this.isCreditCardSelected();
            const total = this.selectedBriefs.reduce((sum, briefId) => {
                const card = document.querySelector(`[data-brief-id="${briefId}"]`);
                if (card) {
                    const priceText = card.querySelector('.pdf-brief-price').textContent;
                    const price = parseFloat(priceText.replace('$', '').replace('\n', '').trim());
                    const basePrice = isNaN(price) ? 0 : price;

                    // Apply credit card fee formula if credit card is selected
                    const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;
                    return sum + finalPrice;
                }
                return sum;
            }, 0);
            let truncated = Math.floor(total * 100) / 100;
            // add comma in the truncated price
            let formattedPrice = truncated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            totalElement.textContent = `$${formattedPrice}`;
        }
    }

    calculateCreditCardAmount(amount) {
        var total = (parseFloat(amount) + 0.3) / 0.971;
        let truncated = Math.floor(total * 100) / 100;
        return truncated;
    }

    isCreditCardSelected() {
        const creditCardTab = document.querySelector('.credit-card-tab');
        return creditCardTab && creditCardTab.classList.contains('w--current');
    }

    getIndividualBriefAmounts() {
        const amounts = [];
        this.selectedBriefs.forEach(briefId => {
            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (card) {
                const title = card.querySelector('.pdf-briefs-title').textContent.trim();
                const basePriceText = card.querySelector('.pdf-brief-price').textContent.trim();
                const basePrice = parseFloat(basePriceText.replace('$', '').replace('\n', '').trim());

                const isCreditCardSelected = this.isCreditCardSelected();
                const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;

                amounts.push({
                    briefId: briefId,
                    title: title,
                    basePrice: basePrice,
                    finalPrice: finalPrice,
                    isCreditCard: isCreditCardSelected
                });
            }
        });
        return amounts;
    }

    validatePaymentData() {
        // Check if member ID is available
        if (!this.data.memberId) {
            alert('Member ID is required for payment. Please log in again.');
            return false;
        }

        // Check if account email is available
        if (!this.data.accountEmail) {
            alert('Account email is required for payment. Please check your account settings.');
            return false;
        }

        // Check if we're on the payment method page
        const paymentSection = document.querySelector('[data-briefs-checkout="select-payment-method"]');
        if (paymentSection && paymentSection.style.display !== 'none') {
            // We're on payment page, check if a payment method is selected
            const isCreditCardSelected = this.isCreditCardSelected();
            const isBankTransferSelected = document.querySelector('.bank-transfer-tab.w--current');

            if (!isCreditCardSelected && !isBankTransferSelected) {
                alert('Please select a payment method before proceeding.');
                return false;
            }
        }

        return true;
    }
    payNow() {
        // Validate that at least one brief is selected
        if (this.selectedBriefs.length === 0) {
            alert('Please select at least one brief before proceeding to payment.');
            return;
        }
        var isCreditCardSelected = this.isCreditCardSelected();
        // Validate payment data
        if (!this.validatePaymentData()) {
            return;
        }

        // Show processing state on all pay now buttons
        const payNowButtons = document.querySelectorAll('[data-briefs-checkout="pay-now"], #pay-now-link-3');
        payNowButtons.forEach(element => {
            element.innerHTML = "Processing...";
            element.style.pointerEvents = "none";
        });

        // Create cancel URL
        const cancelUrl = new URL("https://www.nsdebatecamp.com/" + window.location.pathname);
        if (!cancelUrl.searchParams.has('returnType')) {
            cancelUrl.searchParams.set('returnType', 'back');
        }
        let localUtmSource = localStorage.getItem("utm_source");

        // Prepare checkout data
        const checkoutData = {
            email: this.data.accountEmail || "user@example.com", // Use accountEmail from data or fallback
            briefIds: this.selectedBriefs,
            memberId: this.data.memberId,
            productType: "brief",
            device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
            deviceUserAgent: navigator.userAgent,
            successUrl: "https://www.nsdebatecamp.com/members/" + this.data.memberId+"?briefsPayment=true",
            cancelUrl: cancelUrl.href,
            // cancelUrl: "https://www.nsdebatecamp.com",
            source: "brief-checkout",
            utm_source: (localUtmSource != null) ? localUtmSource : "",
            paymentId: ""
        };

        console.log('Checkout data:', checkoutData);

        // Make API call
        const xhr = new XMLHttpRequest();
        const self = this;
        xhr.open("POST", `${this.data.apiBaseURL}createCheckoutUrlForBrief`, true);
        xhr.withCredentials = false;
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function () {
            try {
                const responseText = JSON.parse(xhr.responseText);
                console.log('Payment response:', responseText);

                if (responseText.success) {
                    self.$checkoutData = responseText;

                    if (responseText.cardUrl && isCreditCardSelected) {
                        window.location = responseText.cardUrl;
                    } else if (responseText.achUrl && !isCreditCardSelected) {
                        window.location = responseText.achUrl;
                    } else {
                        alert("Something went wrong. Please try again later.");
                    }
                } else {
                    alert("Payment processing failed. Please try again.");
                    // Reset button states
                    payNowButtons.forEach(element => {
                        element.innerHTML = "Pay Now";
                        element.style.pointerEvents = "auto";
                    });
                }
            } catch (error) {
                console.error('Error parsing response:', error);
                alert("An error occurred. Please try again.");
                // Reset button states
                payNowButtons.forEach(element => {
                    element.innerHTML = "Pay Now";
                    element.style.pointerEvents = "auto";
                });
            }
        };

        xhr.onerror = function () {
            console.error('Network error occurred');
            alert("Network error. Please check your connection and try again.");
            // Reset button states
            payNowButtons.forEach(element => {
                element.innerHTML = "Pay Now";
                element.style.pointerEvents = "auto";
            });
        };

        xhr.send(JSON.stringify(checkoutData));
    }
    activeBreadCrumb(activeId) {
        let breadCrumbList = document.querySelectorAll('.stepper-container ul li');
        breadCrumbList.forEach(element => element.classList.remove('active'))
        document.getElementById(activeId).classList.add('active')

    }
}







