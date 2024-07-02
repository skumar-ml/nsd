class NSDPortal {
    $completedForm = [];
    $formsList = [];
    $programCategory = {};
    $programDetail = {};
    $studentDetail = {};
    $totalForm = 0;
    $isLiveProgram = true;
    $uploadedContent = {};
    constructor(webflowMemberId, accountEmail, apiBaseUrl, duringCampData) {
        this.webflowMemberId = webflowMemberId;
        this.accountEmail = accountEmail;
        this.baseUrl = apiBaseUrl;
        this.duringCampData = duringCampData;
        this.getPortalData();
    }
    // Get API data with the help of endpoint
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            this.hidePortalData(data)
            return data;
        } catch (error) {
            this.hidePortalData("No data Found")
            //console.error("Error fetching data:", error);
            //throw error;
        }
    }
    async getPortalData() {
        // API call
        var spinner = document.getElementById('half-circle-spinner');
        spinner.style.display = 'block';
        const data = await this.fetchData("getCompletedForm/" + this.webflowMemberId + "/current");
        console.log('data', data)
        spinner.style.display = 'none';
        this.createPortalTabs(data);
        // Re initialize webflow tabs after API call 
        Webflow.require('tabs').redraw();
    }
    hidePortalData(responseText) {
        if (responseText == "No data Found") {
            document.getElementById("free-resources").style.display = "block";
            return false;
            // else, show form accordion
        } else {
            // remove locat if exists (parent has paid)
            if (!(localStorage.getItem('locat') === null)) {
                localStorage.removeItem('locat');
            }
            document.getElementById("paid-resources").style.display = "block";
        }
    }
    createPortalTabs(tabsData) {
        const nsd_portal_container = document.getElementById('nsdPortal');
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
            let startDate = new Date(this.$programDetail.startDate);
            let endDate = new Date(this.$programDetail.endDate);
            tabHeader.innerHTML = `
                <div>
                    <div class="current-program_content-div">
                        <div class="dm-sans current-program_subtitle">${tab.programDetail.programName}</div>
                        <div class="dm-sans opacity-70">${tab.studentDetail.studentName.first} ${tab.studentDetail.studentName.last} ${ startDate.toLocaleString('default', { month: 'long' })} ${startDate.getDate()} - ${ endDate.toLocaleString('default', { month: 'long' })} ${endDate.getDate()} </div>
                    </div>
                </div>
            `;
            var tabPane = this.tabPane(index, tabIndex, isTabActive, tab);
            // Append the tab header and content to their respective containers
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

    }
    updateGlobalVariable(tab) {
        this.$completedForm = tab.formCompletedList;
        this.$formsList = tab.formList;
        this.$programCategory = tab.programCategory;
        this.$studentDetail = tab.studentDetail;
        this.$programDetail = tab.programDetail;
        this.$uploadedContent = tab.uploadedContent;
        this.$totalForm = 0;
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
        console.log('this.$formsList', this.$formsList)

        let startDate = new Date(this.$programDetail.startDate);

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
                <div class="pre-camp_subtitle">Needs to be completed by ${ startDate.toLocaleString('default', { month: 'long' })} ${startDate.getDate()+this.getOrdinalSuffix(startDate.getDate())}</div>
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
                console.log('dFD', dFD)
                if (dFD != undefined) {
                    return true
                } else {
                    return false
                }

            } else if (item.form_sub_type == 'pickup_invoice') {
                var aFD = this.$completedForm.find(item => item.form_sub_type == 'pickup' && item.isInvoice == 'Yes')
                console.log('aFD', aFD)
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
}