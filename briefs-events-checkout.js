/*
Purpose: Multi-step checkout wizard for briefs/events that pulls inventory, handles accordions, and updates totals.

Brief Logic: Fetches briefs and events data from API and displays them in a grid with accordion navigation. Handles item selection, preview modal, payment method tabs, and dynamically updates total amounts based on selected items.

Are there any dependent JS files: No
*/
class BriefsEventsCheckout {
    constructor(data) {
        this.data = data;
        this.selectedBriefs = [];
        this.selectedEvents = [];
        this.currentView = 'briefs'; // 'briefs' or 'events'
        this.updateTotalTimeout = null; // For debouncing updateTotal calls
        this.selectedAccordion = 'annual-events-accordion'; // Default selected accordion
        // For the preview pdf modal
        this.modal = document.getElementById("briefs-preview-modal");
        this.iframe = document.getElementById("preview-frame");
        this.closeBtn = document.getElementById("close-preview");
        this.addCloseModalHandler();
        
        this.init();
        this.setupAccordion();
        this.getBriefsAndEvents();
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
    // Pdf Modal Close Handler
    addCloseModalHandler() {
        if (this.closeBtn) {
        this.closeBtn.addEventListener("click", () => {
            this.modal.style.display = "none";
            this.iframe.src = "";
        });
        }
    }
    
    async getBriefsAndEvents() {
        const nextPage2Btn = document.getElementById('next_page_2');
        nextPage2Btn.style.display = 'none';

        this.showLoading();
        try {
            const response = await this.fetchData('getBriefDetails');
            if (response) {
                // Store briefs and events data
                this.data.briefs = response.briefs || [];
                this.data.briefEvents = response.briefEvents || [];

                if (this.data.briefs.length === 0 && this.data.briefEvents.length === 0) {
                    this.showError('No briefs or events are currently available.');
                } else {
                    nextPage2Btn.style.display = 'block';

                    // Render content based on selected accordion
                    if (this.selectedAccordion === 'annual-events-accordion' && this.data.briefEvents.length > 0) {
                        this.currentView = 'events';
                        this.renderEvents(this.data.briefEvents);
                        // Fix initial height after rendering
                        setTimeout(() => {
                            this.fixAccordionHeight('annual-events-accordion');
                        }, 100);
                    } else if (this.selectedAccordion === 'single-briefs-accordion' && this.data.briefs.length > 0) {
                        this.currentView = 'briefs';
                        this.renderBriefs(this.data.briefs);
                        // Fix initial height after rendering
                        setTimeout(() => {
                            this.fixAccordionHeight('single-briefs-accordion');
                        }, 100);
                    } else {
                        // Fallback: show available content
                        if (this.data.briefs.length > 0) {
                            this.currentView = 'briefs';
                            this.renderBriefs(this.data.briefs);
                            setTimeout(() => {
                                this.fixAccordionHeight('single-briefs-accordion');
                            }, 100);
                        } else if (this.data.briefEvents.length > 0) {
                            this.currentView = 'events';
                            this.renderEvents(this.data.briefEvents);
                            this.attachPreviewHandlers(this.data.briefEvents);
                            setTimeout(() => {
                                this.fixAccordionHeight('annual-events-accordion');
                            }, 100);
                        }
                    }
                }
            } else {
                console.error('No data received');
                this.showError('Unable to load content. Please try again later.');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            this.showError('Network error. Please check your connection and try again.');
        }
    }

    renderBriefs(briefs) {
        const container = document.querySelector('[data-brief="single-briefs-accordion"] .briefs-accordion-item-body');
        if (!container) {
            console.error('Briefs container not found');
            return;
        }

        // Clear all existing content including loading state
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
            this.debouncedUpdateTotal();
        } else {
            // Update order details even if no briefs
            this.updateOrderDetails();
        }
        this.attachPreviewHandlers(briefs);
    }

    renderEvents(events) {
        const container = document.querySelector('[data-brief="annual-events-accordion"] .annual-subs-item-body');
        if (!container) {
            console.error('Events container not found');
            return;
        }

        // Clear all existing content including loading state
        container.innerHTML = '';

        // Sort events by displayOrder if available
        const sortedEvents = events.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        // Create event cards
        sortedEvents.forEach((event, index) => {
            const eventCard = this.createEventCard(event, index === 0); // First event is selected by default
            container.appendChild(eventCard);
        });

        // Update total if there are events
        if (sortedEvents.length > 0) {
            this.debouncedUpdateTotal();
        } else {
            // Update order details even if no events
            this.updateOrderDetails();
        }
    }



    showLoading() {
        // Show loading in both accordion containers
        const annualContainer = document.querySelector('[data-brief="annual-events-accordion"] .annual-subs-item-body');
        const singleContainer = document.querySelector('[data-brief="single-briefs-accordion"] .briefs-accordion-item-body');

        const loadingHTML = `
    <div style="text-align: center; padding: 40px; color: #666;width: 100%;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #d38d97; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 20px;">Loading content...</p>
    </div>
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
`;

        if (annualContainer) {
            annualContainer.innerHTML = loadingHTML;
        }
        if (singleContainer) {
            singleContainer.innerHTML = loadingHTML;
        }
    }

    createBriefCard(brief, isSelected = false) {
        const card = document.createElement('div');
        card.className = `brief-card ${isSelected ? 'red-border' : ''}`;
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
    <div class="view-pdf-brief-price-flex-wrapper"> 
       <p class="pdf-brief-price">$${parseFloat(brief.price).toFixed(2)}<br /></p>
       <a href="#" data-brief-id="${brief.briefId}" class="main-button briefs-preview-btn w-button">Preview Brief</a>
    </div>
`;

        // Add click handler
        card.addEventListener('click', () => this.toggleBriefSelection(brief.briefId, card));

        // Add to selected briefs if initially selected
        if (isSelected) {
            this.selectedBriefs.push(brief.briefId);
        }

        return card;
    }

    createEventCard(event, isSelected = false) {
        const card = document.createElement('div');
        card.className = `annual-subs-card ${isSelected ? 'red-border' : ''}`;
        card.dataset.eventId = event.eventId;

        // Generate features HTML from event object
        const featuresHTML = event.features ? event.features.map(feature => `
    <div class="annual-subs-flex-wrapper">
        <img src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/68af3f0237cfa9519254cbe6_check_circle%20(2).svg" loading="lazy" alt="">
        <div class="annual-subs-text-regular">${feature}</div>
    </div>
`).join('') : '';

        // Generate saved amount HTML if available
        const savedAmountHTML = event.saved_amount ? `
    <div class="annual-subs-save-text">Save $${parseFloat(event.saved_amount).toFixed(0)}</div>
` : '';

        card.innerHTML = `
    <div class="annual-subs-type">${event.title}</div>
    <div class="annual-subs-price"><span class="price-red">$${parseFloat(event.price).toFixed(2)}</span><span class="price-line">/</span><span class="price-text-medium">year</span></div>
    ${savedAmountHTML}
    <div class="annual-subs-text">${event.description}</div>
    <div class="annual-subs-features-block">
        ${featuresHTML}
    </div>
    <a href="#" class="main-button w-button">${isSelected ? 'Remove' : 'Add to Cart'}</a>
`;

        // Add click handler
        card.addEventListener('click', () => this.toggleEventSelection(event.eventId, card));

        // Add to selected events if initially selected
        if (isSelected) {
            this.selectedEvents.push(event.eventId);
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
            // Clear any selected events first (mutual exclusion)
            this.clearSelectedEvents();

            // Select
            card.classList.add('red-border');
            this.selectedBriefs.push(briefId);

            // Update icons
            const inactiveIcon = card.querySelector('.check_inactive-icon');
            const activeIcon = card.querySelector('.check_active-icon');
            if (inactiveIcon) inactiveIcon.style.display = 'none';
            if (activeIcon) activeIcon.style.display = 'block';
        }

        this.debouncedUpdateTotal();
    }

    debouncedUpdateTotal() {
        // Clear existing timeout
        if (this.updateTotalTimeout) {
            clearTimeout(this.updateTotalTimeout);
        }

        // Set new timeout
        this.updateTotalTimeout = setTimeout(() => {
            this.updateTotal();
        }, 100); // 100ms delay
    }

    clearSelectedBriefs() {
        // Clear selected briefs array
        this.selectedBriefs = [];

        // Clear visual selection from all brief cards
        const briefCards = document.querySelectorAll('[data-brief-id]');
        briefCards.forEach(card => {
            card.classList.remove('red-border');

            // Update icons
            const inactiveIcon = card.querySelector('.check_inactive-icon');
            const activeIcon = card.querySelector('.check_active-icon');
            if (inactiveIcon) inactiveIcon.style.display = 'block';
            if (activeIcon) activeIcon.style.display = 'none';
        });
    }

    clearSelectedEvents() {
        // Clear selected events array
        this.selectedEvents = [];

        // Clear visual selection from all event cards
        const eventCards = document.querySelectorAll('[data-event-id]');
        eventCards.forEach(card => {
            card.classList.remove('red-border');

            // Update button text to "Add to Cart"
            const button = card.querySelector('.main-button');
            if (button) {
                button.textContent = 'Add to Cart';
            }
        });
    }

    toggleEventSelection(eventId, card) {
        const isSelected = card.classList.contains('red-border');
        if (isSelected) {
            // Deselect
            card.classList.remove('red-border');
            this.selectedEvents = this.selectedEvents.filter(id => id !== eventId);

            // Update button text to "Add to Cart"
            const button = card.querySelector('.main-button');
            if (button) {
                button.textContent = 'Add to Cart';
            }
        } else {
            // Clear any selected briefs first (mutual exclusion)
            this.clearSelectedBriefs();

            // Clear any previously selected Annual Subscription Plan cards
            this.clearSelectedEvents();

            // Select
            card.classList.add('red-border');
            this.selectedEvents.push(eventId);

            // Update button text to "Remove"
            const button = card.querySelector('.main-button');
            if (button) {
                button.textContent = 'Remove';
            }
        }

        this.debouncedUpdateTotal();
    }

    calculateTotal() {
        const isCreditCardSelected = this.isCreditCardSelected();

        // Calculate briefs total
        const briefsTotal = this.selectedBriefs.reduce((sum, briefId) => {
            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (card) {
                const priceElement = card.querySelector('.pdf-brief-price');
                if (priceElement) {
                    const priceText = priceElement.textContent;
                    const price = parseFloat(priceText.replace('$', '').replace('\n', '').trim());
                    const basePrice = isNaN(price) ? 0 : price;

                    // Apply credit card fee formula if credit card is selected
                    const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;
                    console.log(`Brief ${briefId}: basePrice=${basePrice}, finalPrice=${finalPrice}`);
                    return sum + finalPrice;
                }
            }
            return sum;
        }, 0);

        // Calculate events total
        const eventsTotal = this.selectedEvents.reduce((sum, eventId) => {
            const card = document.querySelector(`[data-event-id="${eventId}"]`);
            if (card) {
                // For events, we use annual-subs-card structure
                const priceElement = card.querySelector('.annual-subs-price .price-red');
                if (priceElement) {
                    const priceText = priceElement.textContent;
                    const price = parseFloat(priceText.replace('$', '').replace('\n', '').trim());
                    const basePrice = isNaN(price) ? 0 : price;

                    // Apply credit card fee formula if credit card is selected
                    const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;
                    console.log(`Event ${eventId}: basePrice=${basePrice}, finalPrice=${finalPrice}`);
                    return sum + finalPrice;
                }
            }
            return sum;
        }, 0);

        const total = briefsTotal + eventsTotal;
        return { briefsTotal, eventsTotal, total };
    }

    updateTotal() {
        // Calculate total from selected briefs and events
        const { briefsTotal, eventsTotal, total } = this.calculateTotal();

        // Update total amount display if it exists
        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.value = parseFloat(total);
        }

        // Update selected items for form submission
        const suppProIdsElement = document.getElementById('suppProIds');
        if (suppProIdsElement) {
            const selectedItems = {
                briefs: this.selectedBriefs,
                events: this.selectedEvents
            };
            suppProIdsElement.value = JSON.stringify(selectedItems);
        }

        // Update order details sidebar
        this.updateOrderDetails();

        // Update the order total display
        this.updateOrderTotalDisplay(total);
        
        const isCreditCardSelected = this.isCreditCardSelected();

        if (isCreditCardSelected) {
            const individualAmounts = this.getIndividualAmounts();
            console.log('Individual amounts with credit card fees:', individualAmounts);
        }
    }

    showError(message) {
        // Show error in both accordion containers
        const annualContainer = document.querySelector('[data-brief="annual-events-accordion"] .annual-subs-item-body');
        const singleContainer = document.querySelector('[data-brief="single-briefs-accordion"] .briefs-accordion-item-body');

        const errorHTML = `
    <div style="text-align: center; padding: 20px; color: #666;">
        <p>${message}</p>
    </div>
`;

        if (annualContainer) {
            annualContainer.innerHTML = errorHTML;
        }
        if (singleContainer) {
            singleContainer.innerHTML = errorHTML;
        }
    }

    init() {
        console.log('BriefsCheckout initialized');
        this.setupNavigation();
        this.setInitialState();
    }

    setupAccordion() {
        // Set default accordion as selected
        this.selectAccordion('annual-events-accordion', "onload");

        // Add click event listeners to accordion headers
        const annualAccordion = document.querySelector('[data-brief="annual-events-accordion"]');
        const singleAccordion = document.querySelector('[data-brief="single-briefs-accordion"]');

        if (annualAccordion) {
            const annualHeader = annualAccordion.querySelector('.annual-subs-item-header');
            if (annualHeader) {
                annualHeader.addEventListener('click', () => {
                    this.selectAccordion('annual-events-accordion');
                });
            }
        }

        if (singleAccordion) {
            const singleHeader = singleAccordion.querySelector('.briefs-accordion-item-header');
            if (singleHeader) {
                singleHeader.addEventListener('click', () => {
                    this.selectAccordion('single-briefs-accordion');
                });
            }
        }
    }

    selectAccordion(accordionType, type = "") {
        // Check if the same accordion is already selected and open
        // Commented out to allow multiple accordions to be open at the same time
        if (this.selectedAccordion === accordionType && type != "onload") {
            // open single briefs if accordionType is annual-events-accordion   
            if (accordionType === 'annual-events-accordion') {
                this.selectAccordion('single-briefs-accordion');
            } else {
                this.selectAccordion('annual-events-accordion');
            }
            return;
        }

        // Update selected accordion
        this.selectedAccordion = accordionType;

        // Handle annual events accordion
        const annualAccordion = document.querySelector('[data-brief="annual-events-accordion"]');
        if (annualAccordion) {
            const annualBody = annualAccordion.querySelector('.annual-subs-item-body');
            const annualRadio = annualAccordion.querySelector('input[type="radio"]');
            const annualIcon = annualAccordion.querySelector('.accordion-toggle-icon');

            if (accordionType === 'annual-events-accordion') {
                // Open annual accordion
                if (annualBody) {
                    annualBody.style.display = 'flex';
                    annualBody.style.height = 'auto';
                    annualBody.style.opacity = '1';
                }
                annualAccordion.querySelector('.annual-subs-accordion-item').classList.add('open')
                if (annualRadio) annualRadio.checked = true;
                //if (annualIcon) annualIcon.style.transform = 'rotate(180deg)';
            } else {
                // Close annual accordion
                if (annualBody) {
                    annualBody.style.display = 'none';
                    annualBody.style.height = '0';
                    annualBody.style.opacity = '0';
                }
                annualAccordion.querySelector('.annual-subs-accordion-item').classList.remove('open')
                if (annualRadio) annualRadio.checked = false;
                //if (annualIcon) annualIcon.style.transform = 'rotate(0deg)';
            }
        }

        // Handle single briefs accordion
        const singleAccordion = document.querySelector('[data-brief="single-briefs-accordion"]');
        if (singleAccordion) {
            const singleBody = singleAccordion.querySelector('.briefs-accordion-item-body');
            const singleRadio = singleAccordion.querySelector('input[type="radio"]');
            const singleIcon = singleAccordion.querySelector('.accordion-toggle-icon');

            if (accordionType === 'single-briefs-accordion') {
                // Open single accordion
                if (singleBody) {
                    singleBody.style.display = 'grid';
                    singleBody.style.height = 'auto';
                    singleBody.style.opacity = '1';
                }
                singleAccordion.querySelector('.briefs-accordion-item').classList.add('open')
                if (singleRadio) singleRadio.checked = true;
                //if (singleIcon) singleIcon.style.transform = 'rotate(180deg)';
            } else {
                // Close single accordion
                if (singleBody) {
                    singleBody.style.display = 'none';
                    singleBody.style.height = '0';
                    singleBody.style.opacity = '0';
                }
                singleAccordion.querySelector('.briefs-accordion-item').classList.remove('open')
                if (singleRadio) singleRadio.checked = false;
                //if (singleIcon) singleIcon.style.transform = 'rotate(0deg)';
            }
        }

        // Clear selections when switching accordions (mutual exclusion)
        if (accordionType === 'annual-events-accordion') {
            // Switching to events, clear brief selections
            this.clearSelectedBriefs();
            this.currentView = 'events';
            // Render events if available
            if (this.data.briefEvents && this.data.briefEvents.length > 0) {
                this.renderEvents(this.data.briefEvents);
            }
        } else if (accordionType === 'single-briefs-accordion') {
            // Switching to briefs, clear event selections
            this.clearSelectedEvents();
            this.currentView = 'briefs';
            // Render briefs if available
            if (this.data.briefs && this.data.briefs.length > 0) {
                this.renderBriefs(this.data.briefs);
               this.attachPreviewHandlers(this.data.briefs);
            }
        }

        console.log('Selected accordion:', accordionType);
    }

    toggleCurrentAccordion(accordionType) {
        // Toggle the current accordion without re-rendering content
        if (accordionType === 'annual-events-accordion') {
            const annualAccordion = document.querySelector('[data-brief="annual-events-accordion"]');
            if (annualAccordion) {
                const annualBody = annualAccordion.querySelector('.annual-subs-item-body');
                const annualRadio = annualAccordion.querySelector('input[type="radio"]');
                const annualIcon = annualAccordion.querySelector('.accordion-toggle-icon');
                const accordionItem = annualAccordion.querySelector('.annual-subs-accordion-item');

                const isOpen = accordionItem.classList.contains('open');

                if (isOpen) {
                    // Close accordion
                    if (annualBody) annualBody.style.maxHeight = '0px';
                    accordionItem.classList.remove('open');
                    if (annualRadio) annualRadio.checked = false;
                    if (annualIcon) annualIcon.style.transform = 'rotate(0deg)';
                } else {
                    // Open accordion
                    if (annualBody) {
                        // Set a temporary height to ensure content is rendered
                        annualBody.style.maxHeight = 'none';
                        // Use setTimeout to ensure content is fully rendered before calculating height
                        setTimeout(() => {
                            annualBody.style.maxHeight = annualBody.scrollHeight + 'px';
                        }, 10);
                    }
                    accordionItem.classList.add('open');
                    if (annualRadio) annualRadio.checked = true;
                    if (annualIcon) annualIcon.style.transform = 'rotate(180deg)';
                }
            }
        } else if (accordionType === 'single-briefs-accordion') {
            const singleAccordion = document.querySelector('[data-brief="single-briefs-accordion"]');
            if (singleAccordion) {
                const singleBody = singleAccordion.querySelector('.briefs-accordion-item-body');
                const singleRadio = singleAccordion.querySelector('input[type="radio"]');
                const singleIcon = singleAccordion.querySelector('.accordion-toggle-icon');
                const accordionItem = singleAccordion.querySelector('.briefs-accordion-item');

                const isOpen = accordionItem.classList.contains('open');

                if (isOpen) {
                    // Close accordion
                    if (singleBody) singleBody.style.maxHeight = '0px';
                    accordionItem.classList.remove('open');
                    if (singleRadio) singleRadio.checked = false;
                    if (singleIcon) singleIcon.style.transform = 'rotate(0deg)';
                } else {
                    // Open accordion
                    if (singleBody) {
                        // Set a temporary height to ensure content is rendered
                        singleBody.style.maxHeight = 'none';
                        // Use setTimeout to ensure content is fully rendered before calculating height
                        setTimeout(() => {
                            singleBody.style.maxHeight = singleBody.scrollHeight + 'px';
                        }, 10);
                    }
                    accordionItem.classList.add('open');
                    if (singleRadio) singleRadio.checked = true;
                    if (singleIcon) singleIcon.style.transform = 'rotate(180deg)';
                }
            }
        }
    }

    fixAccordionHeight(accordionType) {
        // Fix the height of the accordion after content is rendered
        if (accordionType === 'annual-events-accordion') {
            const annualAccordion = document.querySelector('[data-brief="annual-events-accordion"]');
            if (annualAccordion) {
                const annualBody = annualAccordion.querySelector('.annual-subs-item-body');
                const accordionItem = annualAccordion.querySelector('.annual-subs-accordion-item');

                if (annualBody && accordionItem.classList.contains('open')) {
                    // Ensure the accordion is properly sized
                    annualBody.style.maxHeight = 'none';
                    setTimeout(() => {
                        annualBody.style.maxHeight = annualBody.scrollHeight + 'px';
                    }, 10);
                }
            }
        } else if (accordionType === 'single-briefs-accordion') {
            const singleAccordion = document.querySelector('[data-brief="single-briefs-accordion"]');
            if (singleAccordion) {
                const singleBody = singleAccordion.querySelector('.briefs-accordion-item-body');
                const accordionItem = singleAccordion.querySelector('.briefs-accordion-item');

                if (singleBody && accordionItem.classList.contains('open')) {
                    // Ensure the accordion is properly sized
                    singleBody.style.maxHeight = 'none';
                    setTimeout(() => {
                        singleBody.style.maxHeight = singleBody.scrollHeight + 'px';
                    }, 10);
                }
            }
        }
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
                // Wait a bit for the tab to switch, then update totals and order details
                setTimeout(() => {
                    console.log('Payment method changed, updating totals...');
                    // Update total calculation first
                    this.debouncedUpdateTotal();
                    // Force refresh order details to show updated prices
                    this.refreshOrderDetails();
                    // Ensure pay now button is visible when on payment method tab
                    this.updatePayNowButtonVisibility();
                }, 100);
            });
        });
    }

    refreshOrderDetails() {
        // Force refresh the order details to show updated prices
        if (this.selectedBriefs.length > 0 || this.selectedEvents.length > 0) {
            this.updateItemsListInOrderDetails();
        }
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
        // Validate that at least one item is selected
        if (this.selectedBriefs.length === 0 && this.selectedEvents.length === 0) {
            alert('Please select at least one brief or event before proceeding to payment.');
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

        if (this.selectedBriefs.length === 0 && this.selectedEvents.length === 0) {
            // Show empty state
            if (emptyOrderDetails) emptyOrderDetails.style.display = 'block';
            if (briefsOrderDetails) briefsOrderDetails.style.display = 'none';
        } else {
            // Show order details
            if (emptyOrderDetails) emptyOrderDetails.style.display = 'none';
            if (briefsOrderDetails) briefsOrderDetails.style.display = 'block';

            // Update the items list in order details
            this.updateItemsListInOrderDetails();
        }
    }

    updateItemsListInOrderDetails() {
        const briefsContainer = document.querySelector('[data-briefs-checkout="briefs-order-details"] .brief-flex-wrapper');
        if (!briefsContainer) return;

        // Clear existing items - remove all brief-flex-wrapper elements except the template one
        const existingItems = briefsContainer.parentElement.querySelectorAll('.brief-flex-wrapper');
        existingItems.forEach(item => {
            if (item !== briefsContainer) {
                item.remove();
            }
        });

        // Create a Set to track added items and prevent duplicates
        const addedItems = new Set();

        // Add selected briefs
        this.selectedBriefs.forEach(briefId => {
            if (addedItems.has(`brief-${briefId}`)) return; // Skip if already added

            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (card) {
                const title = card.querySelector('.pdf-briefs-title').textContent.trim();
                const basePriceText = card.querySelector('.pdf-brief-price').textContent.trim();
                const basePrice = parseFloat(basePriceText.replace('$', '').replace('\n', '').trim());

                // Calculate final price based on current payment method selection
                const isCreditCardSelected = this.isCreditCardSelected();
                const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;
                const displayPrice = `$${finalPrice.toFixed(2)}`;

                const itemElement = document.createElement('div');
                itemElement.className = 'brief-flex-wrapper';
                itemElement.innerHTML = `
    <p class="dm-sans brief-medium">${title} (Brief)</p>
    <p class="dm-sans brief-medium">${displayPrice}</p>
`;

                briefsContainer.parentElement.insertBefore(itemElement, briefsContainer.nextSibling);
                addedItems.add(`brief-${briefId}`);
            }
        });

        // Add selected events
        this.selectedEvents.forEach(eventId => {
            if (addedItems.has(`event-${eventId}`)) return; // Skip if already added

            const card = document.querySelector(`[data-event-id="${eventId}"]`);
            if (card) {
                // For events, we use annual-subs-card structure
                const titleElement = card.querySelector('.annual-subs-type');
                const priceElement = card.querySelector('.annual-subs-price .price-red');

                if (titleElement && priceElement) {
                    const title = titleElement.textContent.trim();
                    const basePriceText = priceElement.textContent.trim();
                    const basePrice = parseFloat(basePriceText.replace('$', '').replace('\n', '').trim());

                    // Calculate final price based on current payment method selection
                    const isCreditCardSelected = this.isCreditCardSelected();
                    const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;
                    const displayPrice = `$${finalPrice.toFixed(2)}`;

                    const itemElement = document.createElement('div');
                    itemElement.className = 'brief-flex-wrapper';
                    itemElement.innerHTML = `
        <p class="dm-sans brief-medium">${title}</p>
        <p class="dm-sans brief-medium">${displayPrice}</p>
    `;

                    briefsContainer.parentElement.insertBefore(itemElement, briefsContainer.nextSibling);
                    addedItems.add(`event-${eventId}`);
                }
            }
        });

        // Update total - this will be handled by updateTotal() method
    }

    updateOrderTotalDisplay(total) {
        const totalElement = document.querySelector('[data-briefs-checkout="briefs-order-details"] .total-price-bold');
        if (totalElement) {
            let truncated = Math.floor(total * 100) / 100;
            // add comma in the truncated price
            let formattedPrice = truncated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            totalElement.textContent = `$${formattedPrice}`;
        }
    }

    updateOrderTotal() {
        // This method is now deprecated - use updateOrderTotalDisplay instead
        // Keeping for backward compatibility but it should not be called directly
        console.warn('updateOrderTotal() is deprecated. Use updateOrderTotalDisplay() instead.');
    }

    calculateCreditCardAmount(amount) {
        var total = (parseFloat(amount) + 0.3) / 0.971;
        let truncated = Math.floor(total * 100) / 100;
        return truncated;
    }

    isCreditCardSelected() {
        const creditCardTab = document.querySelector('.credit-card-tab');
        const isSelected = creditCardTab && creditCardTab.classList.contains('w--current');
        console.log('Credit card selected:', isSelected);
        return isSelected;
    }

    getIndividualAmounts() {
        const amounts = [];

        // Add briefs
        this.selectedBriefs.forEach(briefId => {
            const card = document.querySelector(`[data-brief-id="${briefId}"]`);
            if (card) {
                const title = card.querySelector('.pdf-briefs-title').textContent.trim();
                const basePriceText = card.querySelector('.pdf-brief-price').textContent.trim();
                const basePrice = parseFloat(basePriceText.replace('$', '').replace('\n', '').trim());

                const isCreditCardSelected = this.isCreditCardSelected();
                const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;

                amounts.push({
                    id: briefId,
                    type: 'brief',
                    title: title,
                    basePrice: basePrice,
                    finalPrice: finalPrice,
                    isCreditCard: isCreditCardSelected
                });
            }
        });

        // Add events
        this.selectedEvents.forEach(eventId => {
            const card = document.querySelector(`[data-event-id="${eventId}"]`);
            if (card) {
                // For events, we use annual-subs-card structure
                const titleElement = card.querySelector('.annual-subs-type');
                const priceElement = card.querySelector('.annual-subs-price .price-red');

                if (titleElement && priceElement) {
                    const title = titleElement.textContent.trim();
                    const basePriceText = priceElement.textContent.trim();
                    const basePrice = parseFloat(basePriceText.replace('$', '').replace('\n', '').trim());

                    const isCreditCardSelected = this.isCreditCardSelected();
                    const finalPrice = isCreditCardSelected ? this.calculateCreditCardAmount(basePrice) : basePrice;

                    amounts.push({
                        id: eventId,
                        type: 'event',
                        title: title,
                        basePrice: basePrice,
                        finalPrice: finalPrice,
                        isCreditCard: isCreditCardSelected
                    });
                }
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
        // Validate that at least one item is selected
        if (this.selectedBriefs.length === 0 && this.selectedEvents.length === 0) {
            alert('Please select at least one brief or event before proceeding to payment.');
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

        // Prepare checkout data - account will be either brief or event
        let briefIds = [];
        let briefEventIds = [];
        let productType = "brief";

        if (this.selectedEvents.length > 0) {
            // Events selected - send only event data
            briefIds = [];
            briefEventIds = this.selectedEvents;
            productType = "brief";
        } else if (this.selectedBriefs.length > 0) {
            // Briefs selected - send only brief data
            briefIds = this.selectedBriefs;
            briefEventIds = [];
            productType = "brief";
        }

        const checkoutData = {
            email: this.data.accountEmail || "user@example.com", // Use accountEmail from data or fallback
            briefIds: briefIds,
            briefEventIds: briefEventIds,
            memberId: this.data.memberId,
            productType: productType,
            device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
            deviceUserAgent: navigator.userAgent,
            successUrl: "https://www.nsdebatecamp.com/members/" + this.data.memberId + "?briefsPayment=true",
            cancelUrl: cancelUrl.href,
            //cancelUrl: "https://www.nsdebatecamp.com",
            source: "brief-checkout",
            utm_source: (localUtmSource != null) ? localUtmSource : "",
            paymentId: ""
        };

        console.log('Checkout data:', checkoutData);

        // Make API call
        const xhr = new XMLHttpRequest();
        const self = this;
        if (this.selectedEvents.length > 0) {
            xhr.open("POST", `${this.data.apiBaseURL}createCheckoutUrlForBriefEvent`, true);
        } else {
            xhr.open("POST", `${this.data.apiBaseURL}createCheckoutUrlForBrief`, true);
        }
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
    getMemberDetails() {
        // feth
    }
     attachPreviewHandlers(briefs) {
      document.querySelectorAll(".briefs-preview-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
          e.preventDefault();

          const briefId = button.dataset.briefId;
          const brief = briefs.find((b) => b.briefId == briefId);

          if (!brief) return;

          const originalText = button.textContent;
          //button.textContent = "Loading...";
          //button.disabled = true;

          if (brief.preview_pdf_url) {
            this.modal.style.display = "flex";
            this.iframe.src = brief.preview_pdf_url;

            this.iframe.onload = () => {
              button.textContent = originalText;
              button.disabled = false;
            };
          } else {
            button.textContent = "Not Available";
            setTimeout(() => {
              button.textContent = originalText;
              button.disabled = false;
            }, 2000);
          }
        });
      });
    }
}











