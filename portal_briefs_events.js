class BriefManager {
    constructor(briefs, data) {
        // Array of briefs (each brief should have: title, pdf_url, doc_url)
        this.$briefs = briefs;
        
        // Store API data for making requests
        this.data = data;

        // Index of the currently selected brief
        this.currentBriefIndex = 0;

        // Store DOM element references
        this.elements = {
            selectBriefs: null,   // Dropdown(s) for selecting briefs
            downloadPDFs: null,   // Links/buttons for downloading PDF
            downloadWords: null,  // Links/buttons for downloading Word
            pdfPreviews: null,    // Iframes for previewing PDFs
            containers: null,     // Main container(s) for briefs
            spinner: null         // Loading spinner
        };

        this.init();
    }

    /**
     * Initialize the manager: cache DOM, handle empty state, bind events, update UI
     */
    async init() {
        this.cacheElements();
        this.checkEmptyState();
        this.bindEvents();
        this.updateAllElements();
        await this.initializeUpsell();
    }

    /**
     * Cache DOM elements into this.elements for reuse
     */
    cacheElements() {
        this.elements.selectBriefs = document.querySelectorAll('[data-brief="select-brief"]');
        this.elements.downloadPDFs = document.querySelectorAll('[data-brief="download-pdf"]');
        this.elements.downloadWords = document.querySelectorAll('[data-brief="download-word"]');
        this.elements.pdfPreviews = document.querySelectorAll('[data-brief="pdf-preview"]');
        this.elements.containers = document.querySelectorAll('.pdf-briefs-main-container');
        // this.elements.spinner = document.getElementById('half-circle-spinner');
    }

    async fetchData(endpoint) {
        try {
            let url = `${this.data.baseUrl}${endpoint}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const apiData = await response.json();
            return apiData;
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }
   // return data {"briefEvents":[{"created_at":"2025-08-13 19:01:20.567000","description":"All LD briefs for the season","displayOrder":0,"eventId":1,"features":["Single event access","Comprehensive research","Strategic analysis"],"highlighted":false,"price":100,"saved_amount":35,"title":"PF Annual"},{"created_at":"2025-08-13 19:01:20.567000","description":"All PF briefs for the season","displayOrder":1,"eventId":2,"features":["Single event access","Comprehensive research","Strategic analysis"],"highlighted":false,"price":140,"saved_amount":"25","title":"LD Annual"},{"created_at":"2025-08-13 19:01:20.567000","description":"Both formats, one great price","displayOrder":3,"eventId":3,"features":["LD & PF formats","All season topics","Comprehensive research"],"highlighted":true,"price":216,"saved_amount":"84","title":"LD + PF Bundle"}],"briefs":[{"briefId":"68963c8bde6993aa325c7bfc","created_at":"2025-08-13 19:01:20.567000","description":"120+ cards, over 100 pages of evidence. Word and PDF format","displayOrder":0,"price":25,"title":"Sept/Oct 2025 (PF)","topic":"Resolved: The United Kingdom should rejoin the European Union."},{"briefId":"68963cec90f4f5fba187db31","created_at":"2025-08-13 19:01:37.980000","description":"120+ cards, over 100 pages of evidence. Word and PDF format","displayOrder":1,"price":25,"title":"Sept/Oct 2025 (LD)","topic":"Resolved: In the United States criminal justice system, plea bargaining is just."}]} 
   async getEvents() {
        const response = await this.fetchData('getBriefDetails');
        if(response){
            return response.briefEvents;
        }else{
            return [];
        }
    }

    /**
     * Initialize the subscription upsell system
     */
    async initializeUpsell() {
        try {
            // Get subscription options from API
            const subscriptionOptions = await this.getEvents();
            if (!subscriptionOptions || subscriptionOptions.length === 0) return;

            // Analyze user's current briefs to determine recommendations
            const briefAnalysis = this.analyzeUserBriefs();
            
            // Get recommended subscription based on user's briefs
            const recommendedSubscription = this.getRecommendedSubscription(subscriptionOptions, briefAnalysis);
            
            const getAccessBriefsContainer = document.querySelector('.get-access-briefs');
            if(recommendedSubscription){
                getAccessBriefsContainer.style.display = 'block';
            }
            // Update the upsell elements with dynamic content
            this.updateUpsellElements(recommendedSubscription, briefAnalysis);
            
        } catch (error) {
            console.error('Error initializing upsell:', error);
        }
    }

    /**
     * Analyze user's current briefs to determine subscription recommendations
     */
    analyzeUserBriefs() {
        const analysis = {
            hasLD: false,
            hasPF: false,
            totalBriefs: this.$briefs.length,
            totalSpent: 0,
            discountPerBrief: 25,
            totalDiscount: 0
        };
        var briefsData =  this.$briefs.filter(option => !option.subscription);
        // Analyze each brief to determine types
        briefsData.forEach(brief => {
            const title = brief.title || '';
            if (title.includes('(LD)')) {
                analysis.hasLD = true;
            } else if (title.includes('(PF)')) {
                analysis.hasPF = true;
            }
            analysis.totalSpent += brief.price || 0;
        });

        // Calculate total discount based on number of briefs owned
        analysis.totalDiscount = analysis.totalBriefs * analysis.discountPerBrief;

        return analysis;
    }

    /**
     * Get recommended subscription based on user's brief analysis
     */
    getRecommendedSubscription(subscriptionOptions, briefAnalysis) {
        let recommended = null;

        if (briefAnalysis.hasLD && briefAnalysis.hasPF) {
            // User has both LD and PF briefs → recommend bundle
            recommended = subscriptionOptions.find(option => 
                option.title.includes('Bundle') || option.title.includes('Both')
            );
        } else if (briefAnalysis.hasLD) {
            // User has LD briefs → recommend LD Annual
            recommended = subscriptionOptions.find(option => 
                option.title.includes('LD') && !option.title.includes('Bundle')
            );
        } else if (briefAnalysis.hasPF) {
            // User has PF briefs → recommend PF Annual
            recommended = subscriptionOptions.find(option => 
                option.title.includes('PF') && !option.title.includes('Bundle')
            );
        }

        return recommended; // Fallback to first option
    }

    /**
     * Update the upsell elements with dynamic content
     */
    updateUpsellElements(recommendedSubscription, briefAnalysis) {
        if (!recommendedSubscription) return;

        // Store current subscription and analysis for payNow method
        this.currentRecommendedSubscription = recommendedSubscription;
        this.currentBriefAnalysis = briefAnalysis;

        // Update title based on recommendation
        const titleElement = document.querySelector('[data-brief-upsell="title"]');
        if (titleElement) {
            titleElement.textContent = `Get access to ${recommendedSubscription.title}`;
        }

        // Calculate discounted price
        const originalPrice = recommendedSubscription.price;
        const discountedPrice = Math.max(0, originalPrice - briefAnalysis.totalDiscount);
        const savings = originalPrice - discountedPrice;

        // Update discount amount
        const discountElement = document.querySelector('[data-brief-upsell="discount-amount"]');
        if (discountElement) {
            discountElement.textContent = `$${discountedPrice}`;
        }

        // Update original amount
        const originalElement = document.querySelector('[data-brief-upsell="original-amount"]');
        if (originalElement) {
            originalElement.textContent = `$${originalPrice}`;
        }

        // Update save amount
        const saveElement = document.querySelector('[data-brief-upsell="save-amount"]');
        if (saveElement) {
            if (savings > 0) {
                saveElement.textContent = `Save $${savings}`;
            } else {
                saveElement.textContent = 'No additional savings';
            }
        }

        // Add click handler for the enroll button
        const enrollButton = document.querySelector('.enroll-now');
        if (enrollButton) {
            // Remove existing event listeners to prevent duplicates
            enrollButton.removeEventListener('click', this.handleEnrollClick);
            
            // Create bound event handler
            this.handleEnrollClick = (e) => {
                e.preventDefault();
                this.payNow();
            };
            
            // Add new event listener
            enrollButton.addEventListener('click', this.handleEnrollClick);
        }
    }

    /**
     * Handle subscription purchase
     */
    async handleSubscriptionPurchase(subscription, briefAnalysis) {
        const discountedPrice = Math.max(0, subscription.price - briefAnalysis.totalDiscount);
        
        try {
            // Create checkout session with your backend
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventId: subscription.eventId,
                    title: subscription.title,
                    price: discountedPrice,
                    originalPrice: subscription.price,
                    discount: briefAnalysis.totalDiscount,
                    userBriefs: this.$briefs.map(brief => brief.briefId || brief.title),
                    memberId: this.data?.memberId
                })
            });

            if (response.ok) {
                const session = await response.json();
                // Redirect to checkout or handle payment flow
                console.log('Checkout session created:', session);
                alert(`Redirecting to checkout for ${subscription.title} at $${discountedPrice}`);
            } else {
                throw new Error('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            // Fallback for demo/testing
            alert(`Demo mode: Would purchase ${subscription.title} at $${discountedPrice}\nDiscount applied: $${briefAnalysis.totalDiscount}`);
        }
    }

    /**
     * Check if credit card payment is selected
     */
    isCreditCardSelected() {
        // For now, default to credit card. In a real implementation, 
        // this would check radio buttons or other UI elements
        return true;
    }

    /**
     * Validate payment data before processing
     */
    validatePaymentData() {
        // Basic validation - in a real implementation, this would validate
        // payment forms, required fields, etc.
        if (!this.currentRecommendedSubscription) {
            alert('No subscription selected. Please try again.');
            return false;
        }
        return true;
    }

    /**
     * Process payment for subscription
     */
    payNow() {
        // Validate that we have a subscription to purchase
        if (!this.currentRecommendedSubscription) {
            alert('Please select a subscription before proceeding to payment.');
            return;
        }

        var isCreditCardSelected = this.isCreditCardSelected();
        
        // Validate payment data
        if (!this.validatePaymentData()) {
            return;
        }

        // Show processing state on enroll button
        const enrollButton = document.querySelector('.enroll-now');
        if (enrollButton) {
            enrollButton.innerHTML = "Processing...";
            enrollButton.style.pointerEvents = "none";
        }

        // Create cancel URL
        const cancelUrl = new URL("https://www.nsdebatecamp.com/" + window.location.pathname);
        if (!cancelUrl.searchParams.has('returnType')) {
            cancelUrl.searchParams.set('returnType', 'back');
        }
        let localUtmSource = localStorage.getItem("utm_source");

        // Calculate discounted price
        const originalPrice = this.currentRecommendedSubscription.price;
        const discountedPrice = Math.max(0, originalPrice - this.currentBriefAnalysis.totalDiscount);

        // Prepare checkout data for subscription purchase
        const checkoutData = {
            email: this.data.accountEmail || "user@example.com",
            briefIds: [], // No individual briefs for subscription
            briefEventIds: [this.currentRecommendedSubscription.eventId],
            memberId: this.data.memberId,
            productType: "briefPortal",
            device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
            deviceUserAgent: navigator.userAgent,
            successUrl: "https://www.nsdebatecamp.com/members/" + this.data.memberId + "?briefsPayment=true",
            cancelUrl: cancelUrl,
            source: "brief-checkout",
            utm_source: (localUtmSource != null) ? localUtmSource : "",
            paymentId: "",
            // Add subscription-specific data
            // subscriptionTitle: this.currentRecommendedSubscription.title,
            // originalPrice: originalPrice,
            // discountedPrice: discountedPrice,
            // discountAmount: this.currentBriefAnalysis.totalDiscount
        };

        console.log('Checkout data:', checkoutData);

        // Make API call
        const xhr = new XMLHttpRequest();
        const self = this;
        
        // Use the brief event endpoint for subscription purchases
        xhr.open("POST", `${this.data.baseUrl}createCheckoutUrlForBriefEvent`, true);
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
                        // Reset button state
                        if (enrollButton) {
                            enrollButton.innerHTML = "Enroll Now";
                            enrollButton.style.pointerEvents = "auto";
                        }
                    }
                } else {
                    alert("Payment processing failed. Please try again.");
                    // Reset button state
                    if (enrollButton) {
                        enrollButton.innerHTML = "Enroll Now";
                        enrollButton.style.pointerEvents = "auto";
                    }
                }
            } catch (error) {
                console.error('Error parsing response:', error);
                alert("An error occurred. Please try again.");
                // Reset button state
                if (enrollButton) {
                    enrollButton.innerHTML = "Enroll Now";
                    enrollButton.style.pointerEvents = "auto";
                }
            }
        };

        xhr.onerror = function () {
            console.error('Network error occurred');
            alert("Network error. Please check your connection and try again.");
            // Reset button state
            if (enrollButton) {
                enrollButton.innerHTML = "Enroll Now";
                enrollButton.style.pointerEvents = "auto";
            }
        };

        xhr.send(JSON.stringify(checkoutData));
    }
    /**
     * Handle empty state: hide containers if no briefs
     */
    checkEmptyState() {
        if (!this.elements.containers || this.elements.containers.length === 0) return;

        if (this.$briefs.length === 0) {
            // No briefs → hide content, show loader
            this.elements.containers.forEach(container => {
                container.style.display = 'none';
            });
            // this.elements.spinner.style.display = 'block';
        } else {
            // Briefs available → show content, hide loader
            this.elements.containers.forEach(container => {
                container.style.display = 'block';
            });
            // this.elements.spinner.style.display = 'none';
        }
    }

    /**
     * Bind events to DOM elements
     */
    bindEvents() {
        // Handle dropdown change to switch briefs
        if (this.elements.selectBriefs && this.elements.selectBriefs.length > 0) {
            this.elements.selectBriefs.forEach(select => {
                select.addEventListener('change', (e) => {
                    this.setCurrentBrief(parseInt(e.target.value));
                });
            });
        }
    }

    /**
     * Set the current brief index and update UI
     */
    setCurrentBrief(index) {
        if (index >= 0 && index < this.$briefs.length) {
            this.currentBriefIndex = index;
            this.updateAllElements();
        }
    }

    /**
     * Get the currently selected brief object
     */
    getCurrentBrief() {
        return this.$briefs[this.currentBriefIndex];
    }

    /**
     * Update dropdowns with list of briefs
     */
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

    /**
     * Update PDF download links with current brief
     */
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

    /**
     * Update Word download links with current brief
     */
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

    /**
     * Update PDF preview iframe with current brief
     */
    updatePDFPreview() {
        if (!this.elements.pdfPreviews || this.elements.pdfPreviews.length === 0) return;

        const currentBrief = this.getCurrentBrief();
        if (currentBrief) {
            const previewUrl = currentBrief.pdf_url; // Direct PDF link
            this.elements.pdfPreviews.forEach(iframe => {
                iframe.src = previewUrl + "?#toolbar=0"; // Hide toolbar for cleaner look
            });
        }
    }

    /**
     * Update all UI elements (dropdown, downloads, previews)
     */
    updateAllElements() {
        this.updateBriefSelect();
        this.updateDownloadPDF();
        this.updateDownloadWord();
        this.updatePDFPreview();
    }
}


