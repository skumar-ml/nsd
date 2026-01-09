/**
 * NSD Portal - Staging
 * Fetches and renders portal data from getPortalDetails API
 * Based on dummy_api_responce.json structure
 */

class NSDPortal {
    constructor(config) {
        this.webflowMemberId = config.memberId || config.webflowMemberId;
        this.accountEmail = config.accountEmail;
        this.baseUrl = config.baseUrl;
        this.allSessions = [];
        this.invoiceData = [];

        this.init();
    }

    async init() {
        await this.loadPortalData();
    }

    // Fetch data from API
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    // Transform API response to flat session array
    transformApiResponse(apiResponse) {
        const sessions = [];

        if (!apiResponse || !apiResponse.studentData) {
            console.warn('No studentData in API response');
            return sessions;
        }

        console.log('Transforming API response, studentData length:', apiResponse.studentData.length);

        // Process each student in studentData array
        apiResponse.studentData.forEach((studentObj, studentIndex) => {
            const studentName = Object.keys(studentObj)[0];
            const studentData = studentObj[studentName];

            console.log(`Processing student ${studentIndex + 1}: ${studentName}`);

            // Process currentSession
            if (studentData.currentSession && Array.isArray(studentData.currentSession)) {
                console.log(`  - Found ${studentData.currentSession.length} current sessions`);
                studentData.currentSession.forEach((session, sessionIndex) => {
                    if (session && session.programDetail && session.studentDetail) {
                        sessions.push({
                            ...session,
                            sessionType: 'current',
                            studentKey: studentName
                        });
                        console.log(`    Added current session ${sessionIndex + 1}: ${session.programDetail.programName}`);
                    } else {
                        console.warn(`    Skipping invalid current session ${sessionIndex + 1}`);
                    }
                });
            }

            // Process futureSession
            if (studentData.futureSession && Array.isArray(studentData.futureSession)) {
                console.log(`  - Found ${studentData.futureSession.length} future sessions`);
                studentData.futureSession.forEach((session, sessionIndex) => {
                    if (session && session.programDetail && session.studentDetail) {
                        sessions.push({
                            ...session,
                            sessionType: 'future',
                            studentKey: studentName
                        });
                        console.log(`    Added future session ${sessionIndex + 1}: ${session.programDetail.programName}`);
                    } else {
                        console.warn(`    Skipping invalid future session ${sessionIndex + 1}`);
                    }
                });
            }

            // Process pastSession
            if (studentData.pastSession && Array.isArray(studentData.pastSession)) {
                console.log(`  - Found ${studentData.pastSession.length} past sessions`);
                studentData.pastSession.forEach((session, sessionIndex) => {
                    if (session && session.programDetail && session.studentDetail) {
                        sessions.push({
                            ...session,
                            sessionType: 'past',
                            studentKey: studentName
                        });
                        console.log(`    Added past session ${sessionIndex + 1}: ${session.programDetail.programName}`);
                    } else {
                        console.warn(`    Skipping invalid past session ${sessionIndex + 1}`);
                    }
                });
            }
        });

        console.log(`Total sessions transformed: ${sessions.length}`);
        return sessions;
    }

    // Load portal data from API
    async loadPortalData() {
        const spinner = document.getElementById('half-circle-spinner');
        const nsdPortal = document.getElementById('nsdPortal');

        if (spinner) spinner.style.display = 'block';
        if (nsdPortal) nsdPortal.style.display = 'none';

        try {
            // Fetch portal details
            const apiResponse = await this.fetchData(`getPortalDetails/${this.webflowMemberId}`);

            if (!apiResponse) {
                throw new Error('No data received from API');
            }

            // Transform and store sessions
            this.allSessions = this.transformApiResponse(apiResponse);
            console.log('Transformed sessions:', this.allSessions.length);

            // Fetch invoice data
            this.invoiceData = await this.fetchData(`getInvoiceList/${this.webflowMemberId}/current`) || [];
            console.log('Invoice data:', this.invoiceData);

            // Handle briefs
            if (apiResponse.brief && apiResponse.brief.length > 0 && typeof BriefManager !== 'undefined') {
                new BriefManager(apiResponse.brief, {
                    webflowMemberId: this.webflowMemberId,
                    accountEmail: this.accountEmail,
                    baseUrl: this.baseUrl
                });
            }

            // Render portal
            this.renderPortal();

        } catch (error) {
            console.error('Error loading portal data:', error);
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (nsdPortal) nsdPortal.style.display = 'block';
        }
    }

    // Render the main portal
    renderPortal() {
        const container = document.getElementById('nsdPortal');
        if (!container) {
            console.error('Portal container not found');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        if (this.allSessions.length === 0) {
            container.innerHTML = '<div class="no-data-message">No programs found</div>';
            return;
        }

        console.log('Rendering portal with', this.allSessions.length, 'sessions');

        // Group sessions by student
        const studentsMap = this.groupSessionsByStudent();
        const students = Object.keys(studentsMap);

        if (students.length === 0) {
            container.innerHTML = '<div class="no-data-message">No students found</div>';
            return;
        }

        // Create student tabs structure
        const tabsContainer = this.createStudentTabsContainer(studentsMap, students);
        container.appendChild(tabsContainer);

        // Initialize Webflow tabs and add event listeners
        this.initializeWebflowTabs();
    }

    // Group sessions by student
    groupSessionsByStudent() {
        const studentsMap = {};

        this.allSessions.forEach(session => {
            const studentKey = session.studentKey || this.getStudentName(session);
            const studentEmail = session.studentDetail?.studentEmail || '';

            if (!studentsMap[studentKey]) {
                studentsMap[studentKey] = {
                    studentName: studentKey,
                    studentEmail: studentEmail,
                    sessions: []
                };
            }

            studentsMap[studentKey].sessions.push(session);
        });

        return studentsMap;
    }

    // Initialize Webflow tabs with proper event handling
    initializeWebflowTabs() {
        // Wait for DOM to be ready
        setTimeout(() => {
            try {
                // Initialize Webflow tabs if available
                if (typeof Webflow !== 'undefined' && Webflow.require('tabs')) {
                    Webflow.require('tabs').redraw();
                }

                // Initialize nested program tabs for the first (active) student tab
                this.initializeNestedProgramTabs(0);

                // Use MutationObserver to watch for tab changes
                this.setupTabObserver();

                // Initialize lightbox for forms
                this.initiateLightbox();

                // Initialize tooltips for invoice payment messages
                this.initializeToolTips();

                // Attach event handlers to invoice payment links
                this.attachInvoicePaymentHandlers();

                console.log('Webflow tabs initialized successfully');
            } catch (error) {
                console.error('Error initializing Webflow tabs:', error);
            }
        }, 300);
    }

    // Setup observer for tab changes
    setupTabObserver() {
        const tabsContainer = document.querySelector('.portal-tab');
        if (!tabsContainer) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Check for student tab changes
                    const activeStudentTab = tabsContainer.querySelector('.student-program-info-link.w--current');
                    if (activeStudentTab) {
                        const studentTabIndex = Array.from(tabsContainer.querySelectorAll('.student-program-info-link')).indexOf(activeStudentTab);
                        if (studentTabIndex >= 0) {
                            this.onStudentTabChange(studentTabIndex);
                        }
                    }

                    // Check for program tab changes within nested tabs
                    const activeProgramTab = document.querySelector('.program-tab-content .w-tab-link.w--current');
                    if (activeProgramTab) {
                        // Re-initialize lightbox when program tab changes
                        setTimeout(() => {
                            this.initiateLightbox();
                        }, 150);
                    }
                }
            });
        });

        observer.observe(tabsContainer, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });
    }

    // Handle student tab change event
    onStudentTabChange(studentIndex) {
        console.log('Student tab changed to index:', studentIndex);

        // Initialize nested program tabs for this student
        setTimeout(() => {
            this.initializeNestedProgramTabs(studentIndex);
            this.initiateLightbox();
        }, 200);
    }

    // Handle tab change event (legacy - for backward compatibility)
    onTabChange(tabIndex) {
        if (tabIndex >= 0 && tabIndex < this.allSessions.length) {
            const session = this.allSessions[tabIndex];
            console.log('Tab changed to:', session.programDetail?.programName);

            // Update the active tab pane content if needed
            this.updateTabContent(tabIndex);

            // Re-initialize lightbox for the active tab
            setTimeout(() => {
                this.initiateLightbox();
            }, 150);
        }
    }

    // Initialize nested program tabs for a specific student
    initializeNestedProgramTabs(studentIndex) {
        // Find the student tab pane
        const studentTabPane = document.querySelector(`#w-tabs-1-data-w-pane-${studentIndex}`);
        if (!studentTabPane) {
            console.warn(`Student tab pane not found for index ${studentIndex}`);
            return;
        }

        // Find the nested program tabs container within this student tab pane
        const nestedTabsContainer = studentTabPane.querySelector('.portal-tab.w-tabs');
        if (!nestedTabsContainer) {
            console.warn(`Nested program tabs container not found for student index ${studentIndex}`);
            return;
        }

        // Re-initialize Webflow tabs for the nested container
        if (typeof Webflow !== 'undefined' && Webflow.require('tabs')) {
            try {
                // Force Webflow to re-initialize the nested tabs
                Webflow.require('tabs').redraw();
                console.log(`Nested program tabs initialized for student index ${studentIndex}`);
            } catch (error) {
                console.error('Error initializing nested program tabs:', error);
            }
        }
    }

    // Update tab content dynamically
    updateTabContent(tabIndex) {
        const session = this.allSessions[tabIndex];
        const tabPane = document.querySelector(`#w-tabs-0-data-w-pane-${tabIndex}`);

        if (!tabPane || !session) {
            return;
        }

        // Re-render the entire tab pane content to ensure it's up to date
        this.renderTabPaneContent(tabPane, session, tabIndex);

        // Get invoice data for this session
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;
        const sessionInvoices = this.invoiceData.find(i => i.paymentId === paymentId);

        // Update invoice containers if they exist
        if (sessionInvoices && sessionInvoices.invoiceList) {
            const invoiceContainer = document.getElementById(`invoice_${paymentId}`);
            const duringInvoiceContainer = document.getElementById(`during_invoice_${paymentId}`);

            if (invoiceContainer) {
                this.updateInvoiceList(invoiceContainer, sessionInvoices.invoiceList, paymentId);
            }

            if (duringInvoiceContainer) {
                this.updateInvoiceList(duringInvoiceContainer, sessionInvoices.invoiceList, paymentId);
            }
        }
    }

    // Create student tabs container with nested program tabs
    createStudentTabsContainer(studentsMap, students) {
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'portal-tab w-tabs';
        tabsDiv.setAttribute('data-current', 'Tab 1');
        tabsDiv.setAttribute('data-easing', 'ease');
        tabsDiv.setAttribute('data-duration-in', '300');
        tabsDiv.setAttribute('data-duration-out', '100');

        const tabMenu = document.createElement('div');
        tabMenu.className = 'portal-tab-menus no-margin-bottom w-tab-menu';
        tabMenu.setAttribute('role', 'tablist');

        const tabContent = document.createElement('div');
        tabContent.className = 'portal-tab-content mob-margin-top-20 w-tab-content';

        // Create tabs for each student
        students.forEach((studentKey, studentIndex) => {
            const studentData = studentsMap[studentKey];
            const tabIndex = studentIndex + 1;
            const isActive = studentIndex === 0 ? 'w--current' : '';
            const isTabActive = studentIndex === 0 ? 'w--tab-active' : '';

            // Create student tab header
            const studentTabHeader = this.createStudentTabHeader(studentData, tabIndex, isActive, studentIndex);
            tabMenu.appendChild(studentTabHeader);

            // Create student tab pane with nested program tabs
            const studentTabPane = this.createStudentTabPane(studentData, tabIndex, isTabActive, studentIndex);
            tabContent.appendChild(studentTabPane);
        });

        tabsDiv.appendChild(tabMenu);
        tabsDiv.appendChild(tabContent);

        return tabsDiv;
    }

    // Create student tab header
    createStudentTabHeader(studentData, tabIndex, isActive, studentIndex) {
        const tabHeader = document.createElement('a');
        tabHeader.className = `student-program-info-link w-inline-block w-tab-link ${isActive}`;
        tabHeader.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabHeader.setAttribute('id', `w-tabs-1-data-w-tab-${studentIndex}`);
        tabHeader.setAttribute('href', `#w-tabs-1-data-w-pane-${studentIndex}`);
        tabHeader.setAttribute('role', 'tab');
        tabHeader.setAttribute('aria-controls', `w-tabs-1-data-w-pane-${studentIndex}`);
        tabHeader.setAttribute('aria-selected', studentIndex === 0 ? 'true' : 'false');
        tabHeader.setAttribute('tabindex', studentIndex === 0 ? '0' : '-1');

        // Get unique program names for tags
        const programNames = [...new Set(studentData.sessions.map(s => s.programDetail?.programName).filter(Boolean))];
        const programTagsHTML = programNames.map((programName, idx) => {
            // Find sessions for this program and check if any have forms available
            const programSessions = studentData.sessions.filter(s => s.programDetail?.programName === programName);
            const hasForms = programSessions.some(s => s.formList && s.formList.length > 0);
            const tagClass = hasForms ? 'student-program-pink-tag' : 'student-program-blue-tag';
            return `
                <div class="${tagClass}">
                    <div class="student-prog-text">${programName}</div>
                </div>
            `;
        }).join('');

        tabHeader.innerHTML = `
            <div class="width-100">
                <div class="student-program-info-wrapper">
                    <div class="student-name">${studentData.studentName}</div>
                    <div class="student-id">${studentData.studentEmail}</div>
                </div>
                <div class="student-programs-wrapper">
                    ${programTagsHTML}
                </div>
            </div>
        `;

        return tabHeader;
    }

    // Create student tab pane with nested program tabs
    createStudentTabPane(studentData, tabIndex, isTabActive, studentIndex) {
        const tabPane = document.createElement('div');
        tabPane.className = `w-tab-pane ${isTabActive}`;
        tabPane.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabPane.setAttribute('id', `w-tabs-1-data-w-pane-${studentIndex}`);
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `w-tabs-1-data-w-tab-${studentIndex}`);

        // Create nested program tabs for this student
        const programTabsContainer = this.createProgramTabsContainer(studentData.sessions, studentIndex);
        tabPane.appendChild(programTabsContainer);

        return tabPane;
    }

    // Create nested program tabs container for a student's sessions
    createProgramTabsContainer(sessions, studentIndex) {
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'portal-tab w-tabs';
        tabsDiv.setAttribute('data-current', 'Tab 1');
        tabsDiv.setAttribute('data-easing', 'ease');
        tabsDiv.setAttribute('data-duration-in', '300');
        tabsDiv.setAttribute('data-duration-out', '100');

        const tabMenu = document.createElement('div');
        tabMenu.className = 'camp-tabs-wrapper w-tab-menu';
        tabMenu.setAttribute('data-portal', 'program-tabs');
        tabMenu.setAttribute('role', 'tablist');

        const tabContent = document.createElement('div');
        tabContent.className = 'w-tab-content program-tab-content';

        // Create tabs for each program/session
        sessions.forEach((session, sessionIndex) => {
            if (session.sessionType === "past") {
                return;
            }
            const programTabIndex = sessionIndex + 1;
            const isActive = sessionIndex === 0 ? 'w--current' : '';
            const isTabActive = sessionIndex === 0 ? 'w--tab-active' : '';

            // Create program tab button
            const programTabButton = this.createProgramTabButton(session, programTabIndex, isActive, studentIndex, sessionIndex);
            tabMenu.appendChild(programTabButton);

            // Create program tab pane
            const programTabPane = this.createProgramTabPane(session, programTabIndex, isTabActive, studentIndex, sessionIndex);
            tabContent.appendChild(programTabPane);
        });

        tabsDiv.appendChild(tabMenu);
        tabsDiv.appendChild(tabContent);

        return tabsDiv;
    }

    // Create program tab button
    createProgramTabButton(session, tabIndex, isActive, studentIndex, sessionIndex) {
        const button = document.createElement('a');
        const programName = session.programDetail?.programName || 'Program';
        button.href = `#w-tabs-${studentIndex + 2}-data-w-pane-${sessionIndex}`;
        button.className = `main-button ${isActive ? ' camp-program' : 'camp'} w-button w-tab-link ${isActive}`;
        button.textContent = programName;
        button.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        button.setAttribute('id', `w-tabs-${studentIndex + 2}-data-w-tab-${sessionIndex}`);
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', `w-tabs-${studentIndex + 2}-data-w-pane-${sessionIndex}`);
        button.setAttribute('aria-selected', sessionIndex === 0 ? 'true' : 'false');
        button.setAttribute('tabindex', sessionIndex === 0 ? '0' : '-1');
        return button;
    }

    // Create program tab pane
    createProgramTabPane(session, tabIndex, isTabActive, studentIndex, sessionIndex) {
        const tabPane = document.createElement('div');
        tabPane.className = `w-tab-pane ${isTabActive}`;
        tabPane.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabPane.setAttribute('id', `w-tabs-${studentIndex + 2}-data-w-pane-${sessionIndex}`);
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `w-tabs-${studentIndex + 2}-data-w-tab-${sessionIndex}`);

        // Get invoice data for this session
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;
        const sessionInvoices = this.invoiceData.find(i => i.paymentId === paymentId);

        // Create camp info wrapper
        const campInfoWrapper = document.createElement('div');
        campInfoWrapper.className = 'camp-info-wrapper';

        // Create pre-camp content
        const preCampContent = this.createPreCampContent(session, sessionInvoices);
        if (preCampContent) {
            // Append all children from the fragment to the wrapper
            if (preCampContent.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                while (preCampContent.firstChild) {
                    campInfoWrapper.appendChild(preCampContent.firstChild);
                }
            } else {
                campInfoWrapper.appendChild(preCampContent);
            }
        }

        // Create during-camp content if program has started
        if (this.hasProgramStarted(session)) {
            const duringCampContent = this.createDuringCampContent(session, sessionInvoices);
            if (duringCampContent) {
                campInfoWrapper.appendChild(duringCampContent);
            }
        }

        tabPane.appendChild(campInfoWrapper);

        return tabPane;
    }

    // Create tab header
    createTabHeader(session, tabIndex, isActive, index) {
        const tabHeader = document.createElement('a');
        tabHeader.className = `current-programs_sub-div w-inline-block w-tab-link ${isActive}`;
        tabHeader.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabHeader.setAttribute('id', `w-tabs-0-data-w-tab-${index}`);
        tabHeader.setAttribute('href', `#w-tabs-0-data-w-pane-${index}`);
        tabHeader.setAttribute('role', 'tab');
        tabHeader.setAttribute('aria-controls', `w-tabs-0-data-w-pane-${index}`);
        tabHeader.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        tabHeader.setAttribute('tabindex', index === 0 ? '0' : '-1');

        const programName = session.programDetail?.programName || 'Program';
        const studentName = this.getStudentName(session);
        const dateString = this.getDateString(session);

        tabHeader.innerHTML = `
            <div>
                <div class="current-program_content-div">
                    <div class="dm-sans current-program_subtitle">${programName}</div>
                    <div class="dm-sans opacity-70">${studentName} ${dateString}</div>
                </div>
            </div>
        `;

        return tabHeader;
    }

    // Create tab pane content
    createTabPane(session, tabIndex, isTabActive, index) {
        const tabPane = document.createElement('div');
        tabPane.className = `w-tab-pane ${isTabActive}`;
        tabPane.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabPane.setAttribute('id', `w-tabs-0-data-w-pane-${index}`);
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `w-tabs-0-data-w-tab-${index}`);

        // Store session reference for dynamic updates
        tabPane.dataset.sessionIndex = index;
        tabPane.dataset.paymentId = session.studentDetail?.uniqueIdentification || session.paymentId || '';

        // Render tab content
        this.renderTabPaneContent(tabPane, session, index);

        return tabPane;
    }

    // Render tab pane content (can be called to update dynamically)
    renderTabPaneContent(tabPane, session, index) {
        // Get invoice data for this session
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;
        const sessionInvoices = this.invoiceData.find(i => i.paymentId === paymentId);

        // Create pre-camp content
        const preCampContent = this.createPreCampContent(session, sessionInvoices);

        // Create during-camp content
        const duringCampContent = this.createDuringCampContent(session, sessionInvoices);

        // Clear and populate tab pane
        while (tabPane.firstChild) {
            tabPane.removeChild(tabPane.firstChild);
        }

        // Add pre-camp section
        if (preCampContent) {
            tabPane.appendChild(preCampContent);
        }

        // Add during-camp section if program has started
        if (duringCampContent && this.hasProgramStarted(session)) {
            tabPane.appendChild(duringCampContent);
        }
    }

    // Create pre-camp content
    createPreCampContent(session, invoiceData) {
        // Create a container fragment to hold all content (no wrapper class)
        const contentContainer = document.createDocumentFragment();

        const formList = session.formList || [];
        const formCompletedList = session.formCompletedList || [];
        const deadlineDate = session.programDetail?.deadlineDate;

        // Calculate total forms FIRST (count all forms, not just live ones, for display)
        // This ensures we show the total count even if forms aren't live yet
        const totalForms = this.countTotalForms(formList, false, true);

        // Initialize total form count (will be incremented as forms are rendered for verification)
        session._totalFormCount = 0;

        // Calculate completed forms - filter out invoice forms from completed count
        // Only count forms where isInvoice == "No" OR form_sub_type is 'dropoff' or 'pickup'
        const completedFormsOnly = formCompletedList.filter(i =>
            i.isInvoice == "No" || i.form_sub_type == 'dropoff' || i.form_sub_type == 'pickup'
        );
        const completedForms = completedFormsOnly.length;

        const deadlineText = deadlineDate
            ? `Needs to be completed by ${this.formatDate(deadlineDate)}`
            : '';

        // Create header section
        const headerDiv = document.createElement('div');
        headerDiv.className = 'camp-header-flex';
        headerDiv.innerHTML = `
            <div>
                <div class="dashboard-node-header">Registration Forms &amp; Resources</div>
            </div>
            <div class="cross-icon">
                <img src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/667bd034e71af9888d9eb91d_icon%20(1).svg" loading="lazy" alt="">
            </div>
        `;
        contentContainer.appendChild(headerDiv);

        // Create forms section
        let formsSection = null;
        if (formList.length > 0) {
            formsSection = this.createFormsSection(formList, formCompletedList, session);
        }

        // Calculate progress percentage
        const progressPercentage = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0;

        // Create progress section - only show if deadline exists AND forms are available
        if (deadlineText && formList.length > 0 && totalForms > 0) {
            const progressDiv = document.createElement('div');
            progressDiv.className = 'camp-progress-wrapper';
            progressDiv.innerHTML = `
                <div class="dm-sans camp-text">${deadlineText}</div>
                <div class="camp-progress-container">
                    <div class="camp-gray-text">${progressPercentage}% / ${completedForms} of ${totalForms} forms complete</div>
                    <div class="camp-progress-bar">
                        <div class="sub-div" style="width: ${progressPercentage}%;"></div>
                    </div>
                </div>
            `;
            contentContainer.appendChild(progressDiv);
        }

        // Check if all forms are completed
        const allFormsCompleted = totalForms > 0 && completedForms >= totalForms && progressPercentage === 100;

        // Add forms section after progress, or show message if no forms
        if (allFormsCompleted && formList.length > 0) {
            // Show "View All Forms" button when all forms are completed
            const viewAllFormsButton = document.createElement('a');
            viewAllFormsButton.href = '#';
            viewAllFormsButton.setAttribute('data-portal', 'view-all-forms');
            viewAllFormsButton.className = 'main-button inline-block w-button';
            viewAllFormsButton.textContent = 'Registration Forms';
            contentContainer.appendChild(viewAllFormsButton);
        } else if (formsSection) {
            contentContainer.appendChild(formsSection);
        } else if (formList.length === 0 || totalForms === 0) {
            // Show message when forms list is empty
            const noFormsMessage = document.createElement('div');
            noFormsMessage.className = 'pre-camp_subtitle';
            noFormsMessage.style.opacity = '0.7';
            noFormsMessage.textContent = 'Forms not available for this program';
            contentContainer.appendChild(noFormsMessage);
        }

        // Create invoices section - only show if not all invoices are completed
        if (invoiceData && invoiceData.invoiceList) {
            const invoices = invoiceData.invoiceList || [];
            const completedInvoices = invoices.filter(i => i.is_completed).length;
            const totalInvoices = invoices.length;
            const allInvoicesCompleted = totalInvoices > 0 && completedInvoices >= totalInvoices;

            // Hide invoice section if all invoices are completed
            if (!allInvoicesCompleted) {
                const invoicesSection = this.createInvoicesSection(invoiceData, session);
                if (invoicesSection) {
                    contentContainer.appendChild(invoicesSection);
                }
            }
        }

        // Create resources section
        const resourcesSection = this.createResourcesSection(session);
        if (resourcesSection) {
            contentContainer.appendChild(resourcesSection);
        }

        return contentContainer;
    }

    // Create forms section
    createFormsSection(formList, formCompletedList, session) {
        const container = document.createElement('div');

        let formsHTML = this.renderFormCategories(formList, formCompletedList, session);
        if (!formsHTML) {
            return null;
        }

        container.innerHTML = `
            <a href="#" data-portal="view-all-forms" class="main-button inline-block hide w-button">View All forms</a>
            ${formsHTML}
        `;

        return container;
    }

    // Create invoices section
    createInvoicesSection(invoiceData, session) {
        const container = document.createElement('div');
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;
        const invoices = invoiceData.invoiceList || [];
        const completedInvoices = invoices.filter(i => i.is_completed).length;
        const totalInvoices = invoices.length;
        const progressPercentage = totalInvoices > 0 ? Math.round((completedInvoices / totalInvoices) * 100) : 0;

        container.innerHTML = `
            <a href="#" data-portal="view-all-invoices" class="main-button inline-block hide w-button">View All Invoices</a>
                <div>
                <div class="pre-camp_subtitle blue">Invoices</div>
                <div class="pre-camp_grid" id="invoice_${paymentId}">
                </div>
                </div>
        `;

        // Add invoices with proper event handlers
        const invoiceContainer = container.querySelector(`#invoice_${paymentId}`);
        if (invoiceContainer && invoices.length > 0) {
            this.updateInvoiceList(invoiceContainer, invoices, paymentId);
        }

        return container;
    }

    // Create resources section
    createResourcesSection(session) {
        const container = document.createElement('div');
        const uploadedContent = session.uploadedContent || [];

        // Get past programs for this student
        const pastPrograms = this.getPastProgramsForStudent(session);

        // Build resources HTML (uploadedContent goes in resources_wrapper)
        const resourcesHTML = uploadedContent
            .filter(item => item.label && item.uploadedFiles && item.uploadedFiles[0])
            .map(item => `
                <a href="${item.uploadedFiles[0]}" target="_blank" class="resources-link-block w-inline-block">
                    <div class="resources-div">
                        <div class="resources-text-blue">${item.label}</div>
                    </div>
                </a>
            `).join('');

        // Build past programs HTML (goes in sem-classes-info-div)
        const pastProgramsHTML = pastPrograms
            .map(program => `
                <div class="announcement-flex-wrapper">
                    <img loading="lazy" src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/695246e72a37f4a86f9e7878_history.svg" alt="">
                    <p class="poppins-para no-margin-bottom">${program.programName}</p>
                </div>
            `).join('');

        // Only show section if there are resources or past programs
        if (uploadedContent.length === 0 && pastPrograms.length === 0) {
            return null;
        }

        container.innerHTML = `
            <div>
                ${uploadedContent.length > 0 ? `
                <div class="dashboard-node-header margin-bottom-20">Resources</div>
                <div class="resources_wrapper">
                    ${resourcesHTML}
                </div> 
            </div>` : ''}
                ${pastPrograms.length > 0 ? `
                <div class="sem-classes-info-div">
                    <p class="portal-node-title-dashboard">Past Program</p>
                    <div data-portal="past-classe-list">
                        ${pastProgramsHTML}
                    </div>
                </div>
                ` : ''}
            
        `;

        return container;
    }

    // Get past programs for a specific student
    getPastProgramsForStudent(session) {
        const studentKey = session.studentKey || this.getStudentName(session);
        const studentEmail = session.studentDetail?.studentEmail || '';

        // Find all past sessions for this student
        const pastSessions = this.allSessions.filter(s => {
            const sessionStudentKey = s.studentKey || this.getStudentName(s);
            const sessionStudentEmail = s.studentDetail?.studentEmail || '';
            return s.sessionType === 'past' &&
                (sessionStudentKey === studentKey || sessionStudentEmail === studentEmail);
        });

        // Extract unique program names
        const uniquePrograms = [];
        const seenPrograms = new Set();

        pastSessions.forEach(session => {
            const programName = session.programDetail?.programName;
            if (programName && !seenPrograms.has(programName)) {
                seenPrograms.add(programName);
                uniquePrograms.push({
                    programName: programName,
                    programDetailId: session.programDetail?.programDetailId
                });
            }
        });

        return uniquePrograms;
    }

    // Create during-camp content
    createDuringCampContent(session, invoiceData) {
        const duringCampDiv = document.createElement('div');
        duringCampDiv.className = 'during-camp_div';

        const campTopic = session.programDetail?.campTopic || '';
        const uploadedContent = session.uploadedContent || [];
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;

        duringCampDiv.innerHTML = `
            <div class="pre-camp_title-content-wrapper">
                <div class="pre-camp_title-div bg-blue">
                    <div class="dm-sans line-height-20">During camp</div>
                </div>
                <div class="pre-camp_title-div">
                    <div class="dashboard-node-header">Resources/Camp Topic</div>
                </div>
            </div>
            ${campTopic ? `
            <div>
                <div class="pre-camp_subtitle-wrapper">
                    <div class="pre-camp_subtitle">Camp Topic</div>
                </div>
                <div>${campTopic}</div>
            </div>
            ` : 'Camp topic is not available for this camp'}
            ${invoiceData && invoiceData.invoiceList ? `
            <div>
                <div class="pre-camp_subtitle">Invoice</div>
                <div class="pre-camp_grid" id="during_invoice_${paymentId}">
                </div>
            </div>
            ` : ''}
            ${this.renderResources(session, true)}
        `;

        // Add invoices with proper event handlers for during-camp section
        if (invoiceData && invoiceData.invoiceList) {
            const duringInvoiceContainer = duringCampDiv.querySelector(`#during_invoice_${paymentId}`);
            if (duringInvoiceContainer && invoiceData.invoiceList.length > 0) {
                this.updateInvoiceList(duringInvoiceContainer, invoiceData.invoiceList, paymentId);
            }
        }

        return duringCampDiv;
    }

    // Render form categories
    renderFormCategories(formList, formCompletedList, session) {
        let html = '';

        // Track total forms count (only non-invoice forms)
        let totalFormCount = 0;

        formList.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        formList.forEach(category => {
            if (!category.forms || category.forms.length === 0) {
                return;
            }

            const categoryHTML = this.renderFormCategory(category, formCompletedList, session, (count) => {
                if (category.name !== 'Invoice') {
                    totalFormCount += count;
                }
            });
            if (categoryHTML) {
                html += categoryHTML;
            }
        });

        // Store total form count for progress calculation
        session._totalFormCount = totalFormCount;

        return html;
    }

    // Render single form category
    renderFormCategory(category, formCompletedList, session, countCallback) {
        const categoryName = category.name || 'Forms';
        let forms = category.forms || [];
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;
        const isInvoiceCategory = categoryName === 'Invoice';

        // Filter invoice-related forms based on completion status
        if (isInvoiceCategory) {
            forms = this.filterInvoiceForms(forms, formCompletedList);
        }

        if (forms.length === 0) {
            return '';
        }

        const gridId = isInvoiceCategory
            ? `invoice_${paymentId}`
            : `form_${paymentId}`;
        const gridClass = isInvoiceCategory ? 'invoice_grid' : 'form_grid';

        // Count live forms for progress (only non-invoice categories)
        let liveFormCount = 0;
        if (!isInvoiceCategory) {
            liveFormCount = forms.filter(f => f.is_live).length;
        }

        let formsHTML = forms
            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
            .map(form => this.renderSingleForm(form, formCompletedList, session, isInvoiceCategory ? 'invoices' : 'forms'))
            .join('');

        // Call callback to update total count
        if (countCallback && !isInvoiceCategory) {
            countCallback(liveFormCount);
        }

        return `
            <div>
                <div class="pre-camp_subtitle blue">${categoryName}</div>
                <div class="pre-camp_grid ${gridClass}" id="${gridId}">
                    ${formsHTML}
                </div>
            </div>
        `;
    }

    // Filter invoice-related forms based on completion status of dropoff/pickup forms
    filterInvoiceForms(forms, formCompletedList) {
        return forms.filter(item => {
            if (item.form_sub_type == 'dropoff_invoice') {
                const dFD = formCompletedList.find(item => item.form_sub_type == 'dropoff' && item.isInvoice == 'Yes');
                return dFD != undefined;
            } else if (item.form_sub_type == 'pickup_invoice') {
                const aFD = formCompletedList.find(item => item.form_sub_type == 'pickup' && item.isInvoice == 'Yes');
                return aFD != undefined;
            } else {
                return true;
            }
        });
    }

    // Render single form
    renderSingleForm(form, formCompletedList, session, type = 'forms') {
        const isCompleted = formCompletedList.some(f => f.formId === form.formId);
        const isLive = form.is_live || false;
        const formId = form.formId;
        const formName = form.name || 'Form';
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;
        const studentEmail = session.studentDetail?.studentEmail || '';
        const programDetailId = session.programDetail?.programDetailId || '';

        // Check if program is live (before deadline)
        const deadlineDate = session.programDetail?.deadlineDate;
        const isLiveProgram = this.checkProgramDeadline(deadlineDate);

        // Track total form count (only for live forms with type == 'forms')
        // This matches portal.js logic where $totalForm++ only happens when is_live && type == 'forms'
        if (isLive && type === 'forms') {
            if (!session._totalFormCount) {
                session._totalFormCount = 0;
            }
            session._totalFormCount++;
        }

        let link = '#';
        let linkText = 'Coming Soon';
        let added_by_admin = false;

        if (isLive) {
            if (isCompleted) {
                const completedForm = formCompletedList.find(f => f.formId === formId);
                if (completedForm && completedForm.submissionId) {
                    if (isLiveProgram && form.is_editable) {
                        link = `https://www.jotform.com/edit/${completedForm.submissionId}?memberId=${this.webflowMemberId}&studentEmail=${studentEmail}&accountEmail=${this.accountEmail}&paymentId=${paymentId}&programDetailId=${programDetailId}`;
                        linkText = 'Edit Form';
                    } else {
                        link = `https://www.jotform.com/submission/${completedForm.submissionId}`;
                        linkText = 'View Form';
                    }
                } else {
                    added_by_admin = true;
                    linkText = 'Completed';
                }
            } else {
                link = `https://form.jotform.com/${formId}?memberId=${this.webflowMemberId}&studentEmail=${studentEmail}&accountEmail=${this.accountEmail}&paymentId=${paymentId}&programDetailId=${programDetailId}`;
                linkText = 'Go to Form';
            }
        }

        // Add iframe when it's live and above certain screenwidth
        const iframeClassName = (isLive && window.innerWidth > 1200 && !added_by_admin) ? "iframe-lightbox-link" : "";
        const form_link_text = (form.form_sub_type == 'dropoff_invoice' || form.form_sub_type == 'pickup_invoice') ? 'Invoice' : 'Form';

        // Update link text for invoice forms
        if (isLive && !added_by_admin && (form.form_sub_type == 'dropoff_invoice' || form.form_sub_type == 'pickup_invoice')) {
            if (isCompleted) {
                linkText = (isLiveProgram && form.is_editable) ? `Edit ${form_link_text}` : `View ${form_link_text}`;
            } else {
                linkText = `Go to ${form_link_text}`;
            }
        }

        const iconUrl = isCompleted
            ? 'https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495f35742c15354b2e0d_circle-check-regular.png'
            : 'https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495fdc487955887ade5b_circle-regular.png';

        const completedClass = isCompleted ? ' completed_form' : '';

        return `
            <div class="pre-camp_row">
                <img width="20" loading="lazy" src="${iconUrl}" alt="">
                <div class="dm-sans bold-500${completedClass}">${formName}</div>
                <a href="${link}" class="dashboard_link-block w-inline-block ${iframeClassName}">
                    <div class="dm-sans medium-red-with-opacity">${linkText}</div>
                </a>
            </div>
        `;
    }

    // Render invoice section
    renderInvoiceSection(invoiceData, session) {
        const paymentId = session.studentDetail?.uniqueIdentification || session.paymentId;
        const invoices = invoiceData.invoiceList || [];
        const completedInvoices = invoices.filter(i => i.is_completed).length;
        const totalInvoices = invoices.length;
        const progressPercentage = totalInvoices > 0 ? Math.round((completedInvoices / totalInvoices) * 100) : 0;

        return `
            <div>
                <div class="pre-camp_subtitle-wrapper">
                    <div class="pre-camp_subtitle">Invoices</div>
                    <div class="pre-camp_progress-container">
                        <div class="pre-camp_subtitle opacity-50">${progressPercentage}% / ${completedInvoices} of ${totalInvoices} invoices complete</div>
                        <div class="pre-camp_progress-bar">
                            <div class="sub-div" style="width: ${progressPercentage}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="pre-camp_grid invoice_grid" id="invoice_${paymentId}">
                    ${this.renderInvoiceList(invoices, paymentId)}
                </div>
            </div>
        `;
    }

    // Render invoice list
    renderInvoiceList(invoices, paymentId) {
        if (!invoices || invoices.length === 0) {
            return '';
        }

        return invoices.map(invoice => this.renderSingleInvoice(invoice, paymentId)).join('');
    }

    // Update invoice list with event handlers (for dynamic updates)
    updateInvoiceList(container, invoices, paymentId) {
        if (!container || !invoices || invoices.length === 0) {
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Add each invoice with proper event handlers
        invoices.forEach(invoice => {
            const invoiceElement = this.createSingleInvoiceElement(invoice, paymentId);
            container.appendChild(invoiceElement);
        });

        // Initialize tooltips for payment process messages
        this.initializeToolTips();
    }

    // Render single invoice (returns HTML string for initial render)
    renderSingleInvoice(invoice, paymentId) {
        const isCompleted = invoice.is_completed || false;
        const status = invoice.status || '';
        const isProcessing = status === 'Processing';
        const isFailed = status === 'Failed';
        const invoiceName = invoice.invoiceName || 'Invoice';
        const editable = isCompleted;
        const completed = (editable && (status == 'Complete' || !status));

        let iconUrl = this.getCheckedInvoiceIcon(completed, isFailed, isProcessing);

        const completedClass = completed ? ' completed_form' : 'inprogress';
        let linkHTML = '';

        if (editable && !isFailed) {
            linkHTML = `<a href="#" class="dashboard_link-block w-inline-block"><div class="dm-sans opacity-70">${isProcessing ? 'Processing...' : 'Completed'}</div></a>`;
        } else {
            const paymentLinks = invoice.jotFormUrlLink || [];
            if (paymentLinks.length > 0) {
                // Sort payment links by title
                const sortedLinks = [...paymentLinks].sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
                linkHTML = sortedLinks.map(link =>
                    `<a href="#" class="dashboard_link-block w-inline-block ${link.paymentType}" data-invoice-id="${invoice.invoice_id}" data-payment-link-id="${link.paymentLinkId}" data-amount="${link.amount}" data-payment-id="${paymentId}" data-invoice-name="${invoiceName}">
                        <div class="dm-sans opacity-70">${link.title}</div>
                    </a>`
                ).join('');
            } else {
                linkHTML = '<a href="#" class="dashboard_link-block w-inline-block"><div class="dm-sans opacity-70">Go to Invoice</div></a>';
            }
        }

        // Add tooltip info if payment process message exists
        const paymentProcessMsg = invoice.paymentProcessMsg || '';
        const tooltipHTML = paymentProcessMsg ? `<span class="info_text" tip="${paymentProcessMsg}" tip-top tip-left>i</span>` : '';

        return `
            <div class="pre-camp_row" data-invoice-id="${invoice.invoice_id}">
                <img width="20" loading="lazy" src="${iconUrl}" alt="">
                <div class="dm-sans bold-500 ${completedClass}">${invoiceName}</div>
                <div class="linkContainer">
                    ${tooltipHTML}
                    ${linkHTML}
                </div>
            </div>
        `;
    }

    // Create single invoice DOM element (for dynamic updates)
    createSingleInvoiceElement(invoice, paymentId) {
        const $this = this;
        const preCampRow = document.createElement('div');
        preCampRow.classList.add('pre-camp_row');

        const editable = invoice.is_completed || false;
        const completed = (editable && (invoice.status == 'Complete' || !invoice.status));
        const failed = (invoice.status == 'Failed');
        const processing = (invoice.status == 'Processing');
        const paymentProcessMsg = invoice.paymentProcessMsg || '';
        const checkedInIcon = this.getCheckedInvoiceIcon(completed, failed, processing);

        const img = document.createElement('img');
        img.setAttribute('width', '20');
        img.setAttribute('src', checkedInIcon);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('alt', '');

        const comClass = completed ? "completed_form" : 'inprogress';
        const completedForm = document.createElement('div');
        completedForm.classList.add('dm-sans', 'bold-500', comClass);
        completedForm.textContent = invoice.invoiceName;

        const linkContainer = document.createElement('div');
        linkContainer.classList.add('linkContainer');
        const jotFormUrlLink = invoice.jotFormUrlLink || [];

        let info_text = null;
        if (paymentProcessMsg) {
            info_text = document.createElement('span');
            info_text.className = 'info_text';
            info_text.innerHTML = 'i';
            info_text.setAttribute('tip', paymentProcessMsg);
            info_text.setAttribute('tip-top', '');
            info_text.setAttribute('tip-left', '');
        }

        if (!editable || failed) {
            const sortedLinks = [...jotFormUrlLink].sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
            if (sortedLinks.length > 0) {
                sortedLinks.forEach(link => {
                    const paymentLink = document.createElement('a');
                    paymentLink.classList.add('dashboard_link-block', 'w-inline-block', link.paymentType);
                    const paymentText = document.createElement('div');
                    paymentText.classList.add('dm-sans', 'opacity-70');
                    paymentText.textContent = link.title;
                    paymentLink.appendChild(paymentText);

                    paymentLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        paymentLink.innerHTML = "<div class='dm-sans opacity-70'>Processing...</div>";
                        $this.initializeStripePayment(
                            invoice.invoice_id,
                            invoice.invoiceName,
                            link.amount,
                            link.paymentLinkId,
                            paymentLink,
                            link.title,
                            link.paymentType,
                            paymentId
                        );
                    });
                    linkContainer.appendChild(paymentLink);
                });
            }
        } else {
            const paymentLink = document.createElement('a');
            paymentLink.classList.add('dashboard_link-block', 'w-inline-block');
            const paymentText = document.createElement('div');
            paymentText.classList.add('dm-sans', 'opacity-70');
            paymentText.textContent = processing ? 'Processing...' : 'Completed';
            paymentLink.appendChild(paymentText);
            linkContainer.appendChild(paymentLink);
        }

        preCampRow.appendChild(img);
        preCampRow.appendChild(completedForm);

        if (info_text) {
            linkContainer.prepend(info_text);
        }

        preCampRow.appendChild(linkContainer);
        return preCampRow;
    }

    // Returns the appropriate icon URL based on invoice status
    getCheckedInvoiceIcon(status, failed, processing) {
        if (processing) {
            return "https://uploads-ssl.webflow.com/64091ce7166e6d5fb836545e/653a046b720f1634ea7288cc_loading-circles.gif";
        } else if (failed) {
            return "https://uploads-ssl.webflow.com/64091ce7166e6d5fb836545e/6539ec996a84c0196f6009bc_circle-xmark-regular.png";
        } else if (status) {
            return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495f35742c15354b2e0d_circle-check-regular.png";
        } else {
            return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495fdc487955887ade5b_circle-regular.png";
        }
    }

    // Initializes Stripe payment checkout for invoice payment
    initializeStripePayment(invoice_id, title, amount, paymentLinkId, span, link_title, paymentType, paymentId) {
        const centAmount = (amount * 100).toFixed(2);
        const session = this.allSessions.find(s => {
            const sessionPaymentId = s.studentDetail?.uniqueIdentification || s.paymentId;
            return sessionPaymentId === paymentId;
        });

        const studentName = session?.studentDetail?.studentName || { first: '', last: '' };

        const data = {
            "email": this.accountEmail,
            "name": studentName,
            "label": title,
            "paymentType": paymentType,
            "amount": parseFloat(centAmount),
            "invoiceId": invoice_id,
            "paymentId": paymentId,
            "paymentLinkId": paymentLinkId,
            "memberId": this.webflowMemberId,
            "successUrl": encodeURI("https://www.nsdebatecamp.com/members/" + this.webflowMemberId + "?programName=" + title),
            "cancelUrl": "https://www.nsdebatecamp.com/members/" + this.webflowMemberId,
        };

        const xhr = new XMLHttpRequest();
        const $this = this;
        xhr.open("POST", this.baseUrl + "createCheckoutUrlForInvoice", true);
        xhr.withCredentials = false;
        xhr.send(JSON.stringify(data));
        xhr.onload = function () {
            try {
                const responseText = JSON.parse(xhr.responseText);
                console.log('responseText', responseText);
                if (responseText.success) {
                    if (span) {
                        span.innerHTML = `<div class='dm-sans opacity-70'>${link_title}</div>`;
                    }
                    window.location.href = responseText.stripe_url;
                }
            } catch (error) {
                console.error('Error processing payment response:', error);
            }
        };
    }

    // Render resources
    renderResources(session, isDuringCamp = false) {
        const uploadedContent = session.uploadedContent || [];

        if (uploadedContent.length === 0) {
            return '';
        }

        const resourcesHTML = uploadedContent
            .filter(item => item.label && item.uploadedFiles && item.uploadedFiles[0])
            .map(item => `
                <a href="${item.uploadedFiles[0]}" target="_blank" class="resources-link-block w-inline-block">
                    <div class="resources-div">
                        <div class="resources-text-blue">${item.label}</div>
                    </div>
                </a>
            `).join('');

        if (!resourcesHTML) {
            return '';
        }

        return `
            <div>
                <div class="pre-camp_subtitle-wrapper">
                    <div class="pre-camp_subtitle">Resources</div>
                </div>
                <div class="resources_wrapper">
                    ${resourcesHTML}
                </div>
            </div>
        `;
    }

    // Render progress bar
    renderProgressBar(completed, total, percentage) {
        return `
            <div class="pre-camp_subtitle opacity-50">${percentage}% / ${completed} of ${total} forms complete</div>
            <div class="pre-camp_progress-bar">
                <div class="sub-div" style="width: ${percentage}%;"></div>
            </div>
        `;
    }

    // Helper methods
    getStudentName(session) {
        const studentDetail = session.studentDetail;
        if (!studentDetail || !studentDetail.studentName) {
            return '';
        }
        const first = studentDetail.studentName.first || '';
        const last = studentDetail.studentName.last || '';
        return `${first} ${last}`.trim();
    }

    getDateString(session) {
        const programDetail = session.programDetail;
        if (!programDetail || programDetail.hideDates) {
            return '';
        }

        const startDate = programDetail.startDate;
        const endDate = programDetail.endDate;

        if (!startDate || !endDate) {
            return '';
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startMonth = start.toLocaleString('default', { month: 'long' });
            const endMonth = end.toLocaleString('default', { month: 'long' });
            return `| ${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
        } catch (e) {
            return '';
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const month = date.toLocaleString('default', { month: 'long' });
            const day = date.getDate();
            const suffix = this.getOrdinalSuffix(day);
            return `${month} ${day}${suffix}`;
        } catch (e) {
            return '';
        }
    }

    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    countTotalForms(formList, includeInvoices = false, countAllForms = false) {
        if (!formList || !Array.isArray(formList)) {
            return 0;
        }
        return formList.reduce((total, category) => {
            const forms = category.forms || [];
            // Filter forms based on whether to include invoices
            if (includeInvoices) {
                return total + forms.filter(f => countAllForms || f.is_live).length;
            } else {
                // Exclude invoice forms (dropoff_invoice, pickup_invoice) from count
                return total + forms.filter(f => {
                    const isInvoiceForm = f.form_sub_type == 'dropoff_invoice' || f.form_sub_type == 'pickup_invoice';
                    return (countAllForms || f.is_live) && !isInvoiceForm;
                }).length;
            }
        }, 0);
    }

    hasProgramStarted(session) {
        const startDate = session.programDetail?.startDate;
        if (!startDate) {
            return false;
        }
        try {
            const start = new Date(startDate);
            const now = new Date();
            return now >= start;
        } catch (e) {
            return false;
        }
    }

    // Initialize iframe lightbox for form previews
    initiateLightbox() {
        if (typeof IframeLightbox === 'undefined') {
            return;
        }

        const iframeLinks = document.querySelectorAll('.iframe-lightbox-link');
        iframeLinks.forEach(el => {
            if (!el.lightbox) {
                try {
                    el.lightbox = new IframeLightbox(el, {
                        onClosed: function () {
                            console.log('Iframe closed');
                        },
                        scrolling: true,
                    });
                } catch (error) {
                    console.error('Error initializing lightbox:', error);
                }
            }
        });
    }

    // Check if program deadline has passed
    checkProgramDeadline(deadlineDate) {
        if (!deadlineDate) {
            return true; // Default to live if no deadline
        }
        try {
            const deadline = deadlineDate.replace(/\\/g, '').replace(/"/g, '');
            const formatedDeadlineDate = new Date(deadline);
            const currentDate = new Date();
            return currentDate < formatedDeadlineDate;
        } catch (e) {
            return true; // Default to live on error
        }
    }

    // Initializes tooltips for elements with tip attributes
    initializeToolTips() {
        const elements = [...document.querySelectorAll('[tip]')];
        for (const el of elements) {
            // Skip if tooltip already initialized
            if (el.querySelector('.tooltip')) {
                continue;
            }

            const tip = document.createElement('div');
            tip.innerHTML = '';
            tip.classList.add('tooltip');
            tip.textContent = el.getAttribute('tip');

            const x = el.hasAttribute('tip-left') ? 'calc(-100% - 5px)' : '16px';
            const y = el.hasAttribute('tip-top') ? '-100%' : '0';
            tip.style.transform = `translate(${x}, ${y})`;

            el.appendChild(tip);
            el.onpointermove = e => {
                if (e.target !== e.currentTarget) return;

                const rect = tip.getBoundingClientRect();
                const rectWidth = rect.width + 16;
                const vWidth = window.innerWidth - rectWidth;
                const rectX = el.hasAttribute('tip-left') ? e.clientX - rectWidth : e.clientX + rectWidth;
                const minX = el.hasAttribute('tip-left') ? 0 : rectX;
                const maxX = el.hasAttribute('tip-left') ? vWidth : window.innerWidth;
                const x = rectX < minX ? rectWidth : rectX > maxX ? vWidth : e.clientX;
                tip.style.left = `${x}px`;
                tip.style.top = `${e.clientY}px`;
            };
        }
    }

    // Attach event handlers to invoice payment links (for HTML string rendered invoices)
    attachInvoicePaymentHandlers() {
        const $this = this;
        const paymentLinks = document.querySelectorAll('[data-invoice-id][data-payment-link-id]');

        paymentLinks.forEach(link => {
            // Skip if already has handler
            if (link.dataset.handlerAttached === 'true') {
                return;
            }

            link.addEventListener('click', function (e) {
                e.preventDefault();
                const invoiceId = this.dataset.invoiceId;
                const paymentLinkId = this.dataset.paymentLinkId;
                const amount = parseFloat(this.dataset.amount);
                const paymentId = this.dataset.paymentId;
                const invoiceName = this.dataset.invoiceName || 'Invoice';
                const paymentType = this.classList.contains('stripe') ? 'stripe' :
                    this.classList.contains('paypal') ? 'paypal' : 'other';
                const linkTitle = this.textContent.trim();

                // Update link text to show processing
                this.innerHTML = '<div class="dm-sans opacity-70">Processing...</div>';

                $this.initializeStripePayment(
                    invoiceId,
                    invoiceName,
                    amount,
                    paymentLinkId,
                    this,
                    linkTitle,
                    paymentType,
                    paymentId
                );
            });

            link.dataset.handlerAttached = 'true';
        });
    }

    // Method to refresh/update portal data
    async refreshPortalData() {
        console.log('Refreshing portal data...');
        await this.loadPortalData();
    }
}
