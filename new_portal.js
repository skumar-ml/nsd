class NSDPortal {
    $completedForm = [];
    $formsList = [];
    $programCategory = {};
    $programDetail = {};
    $studentDetail = {};
    $totalForm = 0;
    $isLiveProgram = true;
    $uploadedContent = {};
    $startDate = '';
    $endDate = '';
    constructor(webflowMemberId, accountEmail, apiBaseUrl, duringCampData) {
        this.webflowMemberId = webflowMemberId;
        this.accountEmail = accountEmail;
        this.baseUrl = apiBaseUrl;
        this.duringCampData = duringCampData;
        this.getPortalData();
        this.getSuppPortalData();
    }
    // Get API data with the help of endpoint
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            return data;
        } catch (error) {
            //console.error("Error fetching data:", error);
            //throw error;
        }
    }
    async getPortalData() {
        // API call
        const nsdSuppDataPortal = document.getElementById('nsdSuppDataPortal');
        var spinner = document.getElementById('half-circle-spinner');
        spinner.style.display = 'block';
        const data = await this.fetchData("getCompletedForm/" + this.webflowMemberId + "/current");
        // Hide free and paid resources
        this.hidePortalData(data)
        // hide spinner
        spinner.style.display = 'none';
        // display supplementary program dom element 
        nsdSuppDataPortal.style.display = 'block';
        // create portal student program tabs
        this.createPortalTabs(data);
        // Re initialize webflow tabs after API call 
        Webflow.require('tabs').redraw();
    }
    // Hide free and paid resources after api response data
    hidePortalData(responseText) {
        if (responseText == "No data Found") {
            document.getElementById("free-resources").style.display = "block";
            // commented for update profile modal 
            // setTimeout(() => {
            //     console.log("ready!");
            //     this.updateMemberFirstName();
            // }, "3000");
        } else if (responseText.length == 0) {
            document.getElementById("free-resources").style.display = "block";
            // commented for update profile modal 
            // setTimeout(() => {
            //     console.log("ready!");
            //     this.updateMemberFirstName();
            // }, "3000");
        } else {
            if (!(localStorage.getItem('locat') === null)) {
                localStorage.removeItem('locat');
            }
            document.getElementById("paid-resources").style.display = "block";
        }
    }
    createPortalTabs(tabsData) {
        const nsd_portal_container = document.getElementById('nsdPortal');
        var is_notification = false;
        var notificationDiv = this.creEl('div', 'notification_container');
        // Create the main portal tab container
        const portalTabs = document.createElement('div');
        portalTabs.className = 'portal-tab w-tabs';
        portalTabs.setAttribute('data-current', 'Tab 1');
        portalTabs.setAttribute('data-easing', 'ease');
        portalTabs.setAttribute('data-duration-in', '300');
        portalTabs.setAttribute('data-duration-out', '100');

        // Create the tab menu container
        const tabMenus = document.createElement('div');
        tabMenus.className = 'portal-tab-menus w-tab-menu';
        tabMenus.setAttribute('role', 'tablist');

        // Create the tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'portal-tab-content w-tab-content';

        // Loop through the tab data to create each tab and its content
        tabsData.forEach((tab, index) => {
            if (tab.failedPayment == undefined) {
                const tabIndex = index + 1;
                const isActive = index === 0 ? 'w--current' : '';
                const isTabActive = index === 0 ? 'w--tab-active' : '';
                this.updateGlobalVariable(tab);
                // Create the tab header
                const tabHeader = document.createElement('a');
                tabHeader.className = `current-programs_sub-div w-inline-block w-tab-link ${isActive}`;
                tabHeader.setAttribute('data-w-tab', `Tab ${tabIndex}`);
                tabHeader.setAttribute('id', `w-tabs-0-data-w-tab-${index}`);
                tabHeader.setAttribute('href', `#w-tabs-0-data-w-pane-${index}`);
                tabHeader.setAttribute('role', 'tab');
                tabHeader.setAttribute('aria-controls', `w-tabs-0-data-w-pane-${index}`);
                tabHeader.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
                tabHeader.setAttribute('tabindex', index === 0 ? '0' : '-1');
                tabHeader.innerHTML = `
                <div>
                    <div class="current-program_content-div">
                        <div class="dm-sans current-program_subtitle">${tab.programDetail.programName}</div>
                        <div class="dm-sans opacity-70">${tab.studentDetail.studentName.first} ${tab.studentDetail.studentName.last} ${ this.$startDate.toLocaleString('default', { month: 'long' })} ${this.$startDate.getDate()} - ${ this.$endDate.toLocaleString('default', { month: 'long' })} ${this.$endDate.getDate()} </div>
                    </div>
                </div>
            `;
                var tabPane = this.tabPane(index, tabIndex, isTabActive, tab);
                // Append the tab header and content to their respective containers
                tabMenus.appendChild(tabHeader);
                tabContent.appendChild(tabPane);
            } else {
                is_notification = true;
                tab.failedPayment.forEach(item => {
                    let noText = this.creEl('span', 'noti_text');
                    noText.innerHTML = 'A recent payment for ' + item['Student Name'] + ' register for the program ' + item['Program Name'] + ' has failed.';
                    notificationDiv.appendChild(noText);
                })
            }
        });

        // Append the tab menus and content to the main portal tab container
        if (tabMenus) {
            portalTabs.appendChild(tabMenus);
        }
        if (tabContent) {
            portalTabs.appendChild(tabContent);
        }
        // Append the portal tabs to the body or a specific container
        if (tabMenus && tabContent) {
            if (is_notification) {
                nsd_portal_container.prepend(notificationDiv, portalTabs);
            } else {
                nsd_portal_container.appendChild(portalTabs);
            }
        }
        //Initiate lightbox after dom element added
        this.initiateLightbox()
        // Update memberStack firstname after update modal closed
        this.updateMemberFirstName();

    }
    updateGlobalVariable(tab) {
        this.$completedForm = tab.formCompletedList;
        this.$formsList = tab.formList;
        this.$programCategory = tab.programCategory;
        this.$studentDetail = tab.studentDetail;
        this.$programDetail = tab.programDetail;
        this.$uploadedContent = tab.uploadedContent;
        this.$totalForm = 0;
        this.checkProgramDeadline();
        this.$startDate = new Date(this.$programDetail.startDate);
        this.$endDate = new Date(this.$programDetail.endDate);
    }
    tabPane(index, tabIndex, isTabActive, tab) {
        // Update global data
        // Create the tab content
        const tabPane = document.createElement('div');
        tabPane.className = `w-tab-pane ${isTabActive}`;
        tabPane.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabPane.setAttribute('id', `w-tabs-0-data-w-pane-${index}`);
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `w-tabs-0-data-w-tab-${index}`);
        this.$formsList.sort(function (r, a) {
            return r.sequence - a.sequence
        });
        var formList = this.$formsList.map(formCategory => this.formCategoryList(formCategory)).join('');
        var pre_camp_html = this.createPreCampContent(formList);
        var during_camp_html = this.createDuringCampContent(duringCampData);
        let percentageAmount = (this.$completedForm.length) ? (100 * this.$completedForm.length) / this.$totalForm : 0;
        if (percentageAmount != 100) {
            tabPane.innerHTML = `
           <div class="pre-camp_div">
               <!-- Pre camp content will come conditionally here -->
               ${pre_camp_html.innerHTML || ''}
           </div>
       `;
        } else {
            tabPane.innerHTML = `
           <div class="during-camp_div">
               <!-- During camp content will come conditionally here -->
               ${during_camp_html.innerHTML || ''}
           </div>
       `;
        }

        return tabPane
    }
    createPreCampContent(formList) {
        const preCampDiv = document.createElement('div');
        preCampDiv.className = 'pre-camp_div';
        preCampDiv.innerHTML = `
            <div class="pre-camp_title-content-wrapper">
                <div class="pre-camp_title-div bg-blue">
                    <div class="dm-sans line-height-20">Pre-camp</div>
                </div>
                <div>
                    <div class="pre-camp_title-text">Registration Forms & Resources</div>
                </div>
                <!--Add Cross Icon -->
            </div>
            <div class="pre-camp_subtitle-wrapper">
                <div class="pre-camp_subtitle">Needs to be completed by ${ this.$startDate.toLocaleString('default', { month: 'long' })} ${this.$startDate.getDate()+this.getOrdinalSuffix(this.$startDate.getDate())}</div>
                <div class="pre-camp_progress-container">
                ${this.progressBar()}
                </div>
            </div>
            ${formList}
            ${this.resourceList()}
        `;


        return preCampDiv;
    }
    formCategoryList(formCategory) {
        var isInvoiceForm = this.filterInvoiceForms(formCategory.forms);
        if (!isInvoiceForm.length) {
            return;
        }
        var formCategory = `<div>
                <div class="pre-camp_subtitle">${formCategory.name}</div>
                <div class="pre-camp_grid">
                    ${this.formsList(formCategory)}
                </div>
            </div>`;
        return formCategory;
    }
    formsList(formCategory) {
        if (formCategory.forms.length == 0) {
            return ''
        }
        var forms = formCategory.forms.sort(function (r, a) {
            return r.sequence - a.sequence
        }).map(form => this.singleForm(form)).join('')
        return forms;
    }
    singleForm(form) {
        //check it's editable
        let editable = this.checkForm(form.formId);
        let is_live = form.is_live;
        let completed_form = (editable) ? ' completed_form' : '';
        let checkedInIcon = this.getCheckedIcon(editable);
        var added_by_admin = false;
        var link;
        if (is_live) {
            if (editable) {
                let dbData = this.getFormData(form.formId)
                if (dbData.submissionId) {
                    if (this.$isLiveProgram && form.is_editable) {
                        link = (form.formId) ? "https://www.jotform.com/edit/" + dbData.submissionId + "?memberId=" + this.webflowMemberId + "&studentEmail=" + this.$studentDetail.studentEmail + "&accountEmail=" + this.accountEmail + "&paymentId=" + this.$studentDetail.uniqueIdentification + "&programDetailId=" + this.$programDetail.programDetailId : "";
                    } else {
                        link = "https://www.jotform.com/submission/" + dbData.submissionId;
                    }
                } else {
                    added_by_admin = true;
                }
            } else {
                link = (form.formId) ? "https://form.jotform.com/" + form.formId + "?memberId=" + this.webflowMemberId + "&studentEmail=" + this.$studentDetail.studentEmail + "&accountEmail=" + this.accountEmail + "&paymentId=" + this.$studentDetail.uniqueIdentification + "&programDetailId=" + this.$programDetail.programDetailId : "";
            }
        }

        //Add iframe when it's live and above certain screenwidth
        var iframeClassName = (is_live && window.innerWidth > 1200 && !added_by_admin) ? "iframe-lightbox-link" : "";
        var link_text;
        if (added_by_admin) {
            link_text = "Completed";
        } else if (is_live) {
            link_text = (editable) ? ((this.$isLiveProgram && form.is_editable) ? "Edit form" : "View Form") : "Go to form";
        } else {
            link_text = "Coming Soon";
        }
        if (is_live) {
            this.$totalForm++;
        }
        var singleForm = `
            <div class="pre-camp_row">
                <img width="20" src="${checkedInIcon}" loading="lazy" alt="">
                <div class="dm-sans bold-500 ${completed_form}">${form.name}</div>
                <a href="${link}" class="dashboard_link-block w-inline-block ${iframeClassName}">
                    <div class="dm-sans opacity-70">${link_text}</div>
                </a>
            </div>
        `;
        return singleForm;
    }
    progressBar() {
        let percentageAmount = (this.$completedForm.length) ? (100 * this.$completedForm.length) / this.$totalForm : 0;
        return `<div class="pre-camp_subtitle opacity-50">0% / ${this.$completedForm.length} of ${this.$totalForm} forms complete</div>
                <div class="pre-camp_progress-bar">
                    <div class="sub-div" style="width: ${percentageAmount+'%'};"></div>
                </div>`;
    }
    createDuringCampContent(duringCampData) {
        const duringCampDiv = document.createElement('div');
        duringCampDiv.className = 'during-camp_div';

        duringCampDiv.innerHTML = `
            <div class="pre-camp_title-content-wrapper">
                <div id="w-node-_8e292b85-7013-e53b-a349-66617a361c36-b55b4cc9" class="pre-camp_title-div bg-blue">
                    <div class="dm-sans line-height-20">During camp</div>
                </div>
                <div class="pre-camp_title-div">
                    <div class="pre-camp_title-text">${duringCampData.resourcesTitle}</div>
                </div>
            </div>
            <div>
                <div class="resources_wrapper during-camp">
                    ${this.duringCampData.duringCampResources.map(resource => `
                        <a href="${resource.link}" class="resources-link-block w-inline-block">
                            <div class="resources-div">
                                <div class="resources-text">${resource.title}</div>
                            </div>
                        </a>
                    `).join('')}
                </div>
                <div class="resources_wrapper">
                    ${this.$uploadedContent.map(uploadData => this.resourceLink(uploadData)).join('')}
                </div>
            </div>
        `;

        return duringCampDiv;
    }
    resourceList() {
        if (this.$uploadedContent.length) {
            return `<div>
                <div class="pre-camp_subtitle">Resources</div>
                <div class="resources_wrapper">
                    ${this.$uploadedContent.map(uploadData => this.resourceLink(uploadData)).join('')}
                </div>
            </div>`;
        } else {
            return '';
        }
    }
    resourceLink(uploadData) {
        if (uploadData.label && uploadData.uploadedFiles[0]) {
            return `<a href="${uploadData.uploadedFiles[0]}" target="_blank" class="resources-link-block w-inline-block">
                    <div class="resources-div">
                        <div class="resources-text">${uploadData.label}</div>
                        </div>
                </a>`;
        } else {
            return '';
        }
    }
    /*Filter Ivoice Related Forms based on forms id*/
    filterInvoiceForms(forms) {
        var newForms = forms.filter(item => {
            if (item.form_sub_type == 'dropoff_invoice') {
                var dFD = this.$completedForm.find(item => item.form_sub_type == 'dropoff' && item.isInvoice == 'Yes')
                if (dFD != undefined) {
                    return true
                } else {
                    return false
                }

            } else if (item.form_sub_type == 'pickup_invoice') {
                var aFD = this.$completedForm.find(item => item.form_sub_type == 'pickup' && item.isInvoice == 'Yes')
                if (aFD != undefined) {
                    return true
                } else {
                    return false
                }
            } else {
                return true
            }
        })
        return newForms;
    }
    /**
     * Check form's id in completedForm list (from MongoDB) and use to determine if form is editable
     * @param formId - Jotform Id
     */
    checkForm($formId) {
        if ($formId) {
            const found = this.$completedForm.some(el => el.formId == $formId);
            return found;
        }
        return false;
    }
    /*Creating Read and unread icon for list page*/
    getCheckedIcon(status) {
        if (status) {
            return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495f35742c15354b2e0d_circle-check-regular.png";
        } else {
            return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495fdc487955887ade5b_circle-regular.png";
        }
    }
    /**
     * Get Completed Form data by form id
     * @param formId - Jotform Id
     */
    getFormData($formId) {
        let data = this.$completedForm.find(o => o.formId == $formId);
        return data;
    }
    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th'; // Covers 11th to 20th
        switch (day % 10) {
            case 1:
                return 'st';
            case 2:
                return 'nd';
            case 3:
                return 'rd';
            default:
                return 'th';
        }
    }
    /**
     * Check Program Deadline
     */
    checkProgramDeadline() {
        var deadlineDate = this.$programDetail.deadlineDate.replace(/\\/g, '');
        deadlineDate = deadlineDate.replace(/"/g, '')
        var formatedDeadlineDate = new Date(deadlineDate);
        var currentDate = new Date();
        this.$isLiveProgram = (currentDate < formatedDeadlineDate) ? true : false;
    }
    /**
     * initialize Lightbox and rerender accordion after close the lightbox
     */
    initiateLightbox() {
        var $this = this;
        [].forEach.call(document.getElementsByClassName("iframe-lightbox-link"), function (el) {
            el.lightbox = new IframeLightbox(el, {
                onClosed: function () {
                    console.log('Iframe closed')
                },
                scrolling: true,
            });
        });
    }
    /** Update Member Data using iframe code */
    /**
     * Update Member first name in portal after user profile update
     */
    updateMemberFirstName() {
        var elements = document.getElementsByClassName("ms-portal-exit");
        var myFunctionNew = function () {
            var memberstack = localStorage.getItem("memberstack");
            var memberstackData = JSON.parse(memberstack);
            var webflowMemberId = memberstackData.information.id;
            var firstName = memberstackData.information['first-name'];
            var userFirstName2 = document.getElementById('userFirstName2');
            var userFirstName1 = document.getElementById('userFirstName1');
            userFirstName1.innerHTML = firstName;
            userFirstName2.innerHTML = firstName;
            console.log('firstName', firstName)
        };
        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener('click', myFunctionNew, false);
        }
    }
    /** Supplementary Program Code */
    async getSuppPortalData() {
        // API call
        const tabsData = await this.fetchData("getSupplimentaryForm/" + this.webflowMemberId + "/current");

        this.createSuppPortalTabs(tabsData);

    }
    createSuppPortalTabs(tabsData) {
        const nsd_portal_container = document.getElementById('nsdSuppDataPortal');
        if (tabsData != "No data Found") {
            // Create the main portal tab container
            const portalTabs = document.createElement('div');
            portalTabs.className = 'portal-tab w-tabs';
            portalTabs.setAttribute('data-current', 'Tab 1');
            portalTabs.setAttribute('data-easing', 'ease');
            portalTabs.setAttribute('data-duration-in', '300');
            portalTabs.setAttribute('data-duration-out', '100');

            // Create the tab menu container
            const tabMenus = document.createElement('div');
            tabMenus.className = 'portal-tab-menus w-tab-menu';
            tabMenus.setAttribute('role', 'tablist');

            // Create the tab content container
            const tabContent = document.createElement('div');
            tabContent.className = 'portal-tab-content w-tab-content';

            // Loop through the tab data to create each tab and its content
            tabsData.forEach((tab, index) => {

                const tabIndex = index + 1;
                const isActive = index === 0 ? 'w--current' : '';
                const isTabActive = index === 0 ? 'w--tab-active' : '';
                var startDate = new Date(tab.programDetail.startDate);
                var endDate = new Date(tab.programDetail.endDate);

                // Create the tab header
                const tabHeader = document.createElement('a');
                tabHeader.className = `current-programs_sub-div w-inline-block w-tab-link`;
                tabHeader.setAttribute('data-w-tab', `Tab ${tabIndex}`);
                tabHeader.setAttribute('id', `w-tabs-0-data-w-tab-${index}`);
                tabHeader.setAttribute('href', `#w-tabs-0-data-w-pane-${index}`);
                tabHeader.setAttribute('role', 'tab');
                tabHeader.setAttribute('aria-controls', `w-tabs-0-data-w-pane-${index}`);
                tabHeader.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
                tabHeader.setAttribute('tabindex', index === 0 ? '0' : '-1');
                tabHeader.innerHTML = `
                    <div>
                        <div class="current-program_content-div">
                            <div class="dm-sans current-program_subtitle">${tab.programDetail.programName}</div>
                            <div class="dm-sans opacity-70">${tab.studentDetail.studentName.first} ${tab.studentDetail.studentName.last} ${ startDate.toLocaleString('default', { month: 'long' })} ${startDate.getDate()} - ${ endDate.toLocaleString('default', { month: 'long' })} ${endDate.getDate()} </div>
                        </div>
                    </div>
                `;
                var tabPane = this.suppTabPane(index, tabIndex, isTabActive);
                tabMenus.appendChild(tabHeader);
                tabContent.appendChild(tabPane);
            });

            // Append the tab menus and content to the main portal tab container
            portalTabs.appendChild(tabMenus);
            portalTabs.appendChild(tabContent);

            // Append the portal tabs to the body or a specific container
            nsd_portal_container.appendChild(portalTabs);
            //Initiate lightbox after dom element added
            this.initiateLightbox()
        } else {
            nsd_portal_container.innerHTML = "No Records found"
        }
    }
    suppTabPane(index, tabIndex, isTabActive) {
        // Update global data
        // Create the tab content
        const tabPane = document.createElement('div');
        tabPane.className = `w-tab-pane`;
        tabPane.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabPane.setAttribute('id', `w-tabs-0-data-w-pane-${index}`);
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `w-tabs-0-data-w-tab-${index}`);
        tabPane.innerHTML = `
           <div>
               <!-- Pre camp content will come conditionally here -->
           </div>`;

        return tabPane
    }
    creEl(name, className, idName) {
        var el = document.createElement(name);
        if (className) {
            el.className = className;
        }
        if (idName) {
            el.setAttribute("id", idName)
        }
        return el;
    }
}
