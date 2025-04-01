class NSDPortal {
    $completedForm = [];
    $completedFormOnly = [];
    $completedInvoiceOnly = [];
    $formsList = [];
    $programCategory = {};
    $programDetail = {};
    $studentDetail = {};
    $totalForm = 0;
    $totalInvoice = 0;	 
    $isLiveProgram = true;
    $uploadedContent = {};
    $startDate = '';
    $endDate = '';
    $deadlineDate = '';
    /**New Variable */
    $allStudentData = []
    constructor(webflowMemberId, accountEmail, apiBaseUrl) {
        this.webflowMemberId = webflowMemberId;
        this.accountEmail = accountEmail;
        this.baseUrl = apiBaseUrl;
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
        const curr_dashboard_title = document.getElementById('curr_dashboard_title');
        const supp_dashboard_title = document.getElementById('supp_dashboard_title');
        var spinner = document.getElementById('half-circle-spinner');
        spinner.style.display = 'block';
        // const data = await this.fetchData("getCompletedForm/" + this.webflowMemberId + "/current");
	 try {
		//Invoice Changes, Calling invoice and form API 
	        const [data, invoiceData] = await Promise.all(
	            [this.fetchData("getCompletedForm/" + this.webflowMemberId + "/current"),
	                this.fetchData("getInvoiceList/" + this.webflowMemberId + "/current")
	            ]
	        );
	} catch (error) {
	    const data = [];
	    const invoiceData = [];
            spinner.style.display = 'none';
        }
        // Hide free and paid resources
        this.hidePortalData(data)
        // hide spinner
        spinner.style.display = 'none';
        // display supplementary program dom element 
        nsdSuppDataPortal.style.display = 'block';
        curr_dashboard_title.style.display = 'block';
        supp_dashboard_title.style.display = 'block';
        // create portal student program tabs
        //this.createPortalTabs(data);

	//Invoice Changes
	this.$allStudentData = data;
        this.createPortalTabs(data, invoiceData);
        setTimeout(this.updateInvoiceData(invoiceData), 1000)
        this.initializeToolTips();
	
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
    createPortalTabs(tabsData, invoiceData) {
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
		let dateString = "| "+this.$startDate.toLocaleString('default', { month: 'long' }) +" "+this.$startDate.getDate()+" - "+this.$endDate.toLocaleString('default', { month: 'long' })+" "+this.$endDate.getDate()
                tabHeader.innerHTML = `
                <div>
                    <div class="current-program_content-div">
                        <div class="dm-sans current-program_subtitle">${tab.programDetail.programName}</div>
                        <div class="dm-sans opacity-70">${tab.studentDetail.studentName.first} ${tab.studentDetail.studentName.last} ${ (!tab.programDetail.hideDates) ? dateString: "" } </div>
                    </div>
                </div>
            `;
		
		//Invoice Changes, Getting current tab invoice data
                this.$invoices = invoiceData.find(i => i.paymentId == tab.studentDetail.uniqueIdentification)
		if(this.$invoices.invoiceList != null){
                    this.$completedInvoiceOnly = this.$completedInvoiceOnly + this.$invoices.invoiceList.filter(i=> i.is_completed == true).length
                    console.log('this.$completedInvoiceOnly', this.$completedInvoiceOnly)
                }
		    
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
            // if (is_notification) {
            //     nsd_portal_container.prepend(notificationDiv, portalTabs);
            // } else {
                nsd_portal_container.appendChild(portalTabs);
            // }
        }
        //Initiate lightbox after dom element added
        this.initiateLightbox()
        // Cross Icon code
        this.crossEvent();
        // Update memberStack firstname after update modal closed
        this.updateMemberFirstName();

    }
    crossEvent() {
        var crossIcon = document.querySelectorAll('.cross-icon')
        crossIcon.forEach(e =>{
            e.addEventListener("click", function (event) {
                event.preventDefault();
                const panLink = document.querySelectorAll('.w-tab-link');
                panLink.forEach(element => {
                    element.classList.remove('w--current');
                });
                const tabPan = document.querySelectorAll('.w-tab-pane');
                tabPan.forEach(element => {
                    element.classList.remove('w--tab-active');
                });
                Webflow.require('tabs').redraw();
            });
        })
    }
    updateGlobalVariable(tab) {
        this.$completedForm = tab.formCompletedList;
	    
	//Invoice Changes, Only getting form and invoice related completed form
        this.$completedFormOnly = tab.formCompletedList.filter(i => i.isInvoice == "No");
        this.$completedInvoiceOnly = tab.formCompletedList.filter(i => i.isInvoice == "Yes").length;
        this.invoiceData = []
	this.$totalInvoice = 0;    
        this.$formsList = tab.formList;
        this.$programCategory = tab.programCategory;
        this.$studentDetail = tab.studentDetail;
        this.$programDetail = tab.programDetail;
        this.$uploadedContent = tab.uploadedContent;
        this.$totalForm = 0;
        this.checkProgramDeadline();
        this.$startDate = new Date(this.$programDetail.startDate);
        this.$endDate = new Date(this.$programDetail.endDate);
        this.$deadlineDate = new Date(this.$programDetail.deadlineDate);
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

	// for online program invoice list
        if(this.$programCategory.programCategoryId == 3333 && this.$invoices.invoiceList != null){
            formList += this.invoiceList()
        }
	
        var pre_camp_html = this.createPreCampContent(formList);
        var during_camp_html = this.createDuringCampContent();
        let percentageAmount = (this.$completedForm.length) ? (100 * this.$completedForm.length) / this.$totalForm : 0;
	    tabPane.innerHTML = ``;
       if (percentageAmount != 100) {
	      tabPane.innerHTML += `
            <div class="pre-camp_div">
                <!-- Pre camp content will come conditionally here -->
                ${pre_camp_html.innerHTML || ''}
            </div>
        `;
         } 
        
         if (this.checkProgramStartDate() || percentageAmount == 100) {
             tabPane.innerHTML += `
            <div class="during-camp_div">
                <!-- During camp content will come conditionally here -->
                ${during_camp_html.innerHTML || ''}
            </div>
        `;
         }

	// if (true) {
 	//    		tabPane.insertAdjacentHTML('beforeend', `
 	//       		<div class="pre-camp_div">
	//            	<!-- Pre camp content will come conditionally here -->
	//            	${pre_camp_html.innerHTML || ''}
 	//       		</div>
 	//   		`);
	// }
	// if (true) {
 	//    		tabPane.insertAdjacentHTML('beforeend', `
 	//       		<div class="during-camp_div">
	//            <!-- During camp content will come conditionally here -->
	//            ${during_camp_html.innerHTML || ''}
 	//       		</div>
 	//   		`);
	// }

        return tabPane
    }


   //Invoice Changes
    updateInvoiceData(invoiceData) {
        invoiceData.forEach(item => {
            if (item.invoiceList != null) {
                var invoiceContainer = document.getElementById('invoice_' + item.paymentId)
                var duringInvoiceContainer = document.getElementById('during_invoice_' + item.paymentId)
                if (invoiceContainer != null) {
                    item.invoiceList.forEach(invoice => {

                        let preCampRow = this.singleInvoiceForm(invoice, item.paymentId)
                        invoiceContainer.appendChild(preCampRow);

                        let duringCampRow = this.singleInvoiceForm(invoice, item.paymentId)
                        duringInvoiceContainer.appendChild(duringCampRow)
                    })
                }
            }
        })
    }
    //Invoice Changes
    singleInvoiceForm(invoice, paymentId) {
        var $this = this;

        // Create the main container div with class 'pre-camp_row'
        const preCampRow = document.createElement('div');
        preCampRow.classList.add('pre-camp_row');


        let editable = (invoice.is_completed) ? true : false;
        let completed = (editable && (invoice.status == 'Complete' || !invoice.status));
        let failed = (invoice.status == 'Failed');
        let processing = (invoice.status == 'Processing');
        let paymentProcessMsg = (invoice.paymentProcessMsg != '');
        let checkedInIcon = this.getCheckedInvoiceIcon(completed, failed, processing);

        // Create the image element
        const img = document.createElement('img');
        img.setAttribute('width', '20');
        img.setAttribute('src', checkedInIcon);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('alt', '');

        // Create the div with the text 'Dropoff Invoice Form'
        let comClass = (completed)? "completed_form": 'inprogress';
        const completedForm = document.createElement('div');
        completedForm.classList.add('dm-sans', 'bold-500', comClass );
        completedForm.textContent = invoice.invoiceName;

        // Create the linkContainer div
        const linkContainer = document.createElement('div');
        linkContainer.classList.add('linkContainer');
        var jotFormUrlLink = invoice.jotFormUrlLink;

        let info_text = this.creEl('span', 'info_text')
        info_text.innerHTML = 'i';
        if (!editable || failed) {
            jotFormUrlLink.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
            if (jotFormUrlLink.length > 0) {
                jotFormUrlLink.forEach(link => {
                    let paymentLink = document.createElement('a');
                    paymentLink.classList.add('dashboard_link-block', 'w-inline-block', link.paymentType);
                    const paymentText = document.createElement('div');
                    paymentText.classList.add('dm-sans', 'opacity-70');
                    paymentText.textContent = link.title;
                    paymentLink.appendChild(paymentText);

                    paymentLink.addEventListener('click', function () {
                        paymentLink.innerHTML = "Processing..."
                        $this.initializeStripePayment(invoice.invoice_id, invoice.invoiceName, link.amount, link.paymentLinkId, paymentLink, link.title, link.paymentType, paymentId)
                    })
                    linkContainer.appendChild(paymentLink)
                })
            }
        } else {
	    let paymentLink = document.createElement('a');
            paymentLink = document.createElement('a');
            paymentLink.classList.add('dashboard_link-block', 'w-inline-block');
            const paymentText = document.createElement('div');
            paymentText.classList.add('dm-sans', 'opacity-70');
            paymentText.textContent = (processing)? 'Processing...' : 'Completed';
            paymentLink.appendChild(paymentText);
            linkContainer.appendChild(paymentLink)
        }
        // Append image, completedForm, and linkContainer to preCampRow
        preCampRow.appendChild(img);
        preCampRow.appendChild(completedForm);

        if (paymentProcessMsg) {
            linkContainer.prepend(info_text)
            info_text.setAttribute('tip', invoice.paymentProcessMsg)

            info_text.setAttribute('tip-top', '')
            info_text.setAttribute('tip-left', '')
        }

        preCampRow.appendChild(linkContainer);
        return preCampRow;
    }
    //Invoice Changes
    /**  Initialize tooltip */
    initializeToolTips() {
        const elements = [...document.querySelectorAll('[tip]')]
        var i = 0;
        for (const el of elements) {
            console.log('el', el)
            const tip = document.createElement('div')
            tip.innerHTML = '';
            tip.classList.add('tooltip')
            tip.textContent = el.getAttribute('tip')
            const x = el.hasAttribute('tip-left') ? 'calc(-100% - 5px)' : '16px'
            const y = el.hasAttribute('tip-top') ? '-100%' : '0'
            tip.style.transform = `translate(${x}, ${y})`
            el.appendChild(tip)
            el.onpointermove = e => {
                if (e.target !== e.currentTarget) return

                const rect = tip.getBoundingClientRect()
                const rectWidth = rect.width + 16
                const vWidth = window.innerWidth - rectWidth
                const rectX = el.hasAttribute('tip-left') ? e.clientX - rectWidth : e.clientX + rectWidth
                const minX = el.hasAttribute('tip-left') ? 0 : rectX
                const maxX = el.hasAttribute('tip-left') ? vWidth : window.innerWidth
                const x = rectX < minX ? rectWidth : rectX > maxX ? vWidth : e.clientX
                tip.style.left = `${x}px`
                tip.style.top = `${e.clientY}px`
            }
        }
    }
    /**
     * Get Checkbox icon for form complete or complete
     */
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

    /** Initialize stripe payment for invoice */
    initializeStripePayment(invoice_id, title, amount, paymentLinkId, span, link_title, paymentType, paymentId) {
        var centAmount = (amount*100).toFixed(2);
        var data = {
            "email": this.accountEmail,
            "name": this.$allStudentData.find(d => d.studentDetail.uniqueIdentification == paymentId).studentDetail.studentName,
            "label": title,
            "paymentType": paymentType,
            "amount": parseFloat(centAmount),
            "invoiceId": invoice_id,
            "paymentId": paymentId,
            "paymentLinkId": paymentLinkId,
            "memberId": this.webflowMemberId,
            "successUrl": encodeURI("https://www.nsdebatecamp.com/members/" + this.webflowMemberId + "?programName=" + title),
            "cancelUrl": "https://www.nsdebatecamp.com/members/" + this.webflowMemberId,
        }
        // console.log('data', data)
        // return;
        var xhr = new XMLHttpRequest()
        var $this = this;
        xhr.open("POST", this.baseUrl + "createCheckoutUrlForInvoice", true)
        xhr.withCredentials = false
        xhr.send(JSON.stringify(data))
        xhr.onload = function () {
            let responseText = JSON.parse(xhr.responseText);
            console.log('responseText', responseText)
            if (responseText.success) {
                span.innerHTML = link_title;
                window.location.href = responseText.stripe_url;
            }

        }
    }

   progressBarInvoice() {
        let percentageAmount = (this.$completedInvoiceOnly) ? (100 * this.$completedInvoiceOnly) / this.$totalInvoice : 0;
        return `<div class="pre-camp_subtitle opacity-50"> ${parseInt(percentageAmount)+'%'} / ${this.$completedInvoiceOnly} of ${(this.$totalInvoice)? this.$totalInvoice : 1} invoices complete</div>
                <div class="pre-camp_progress-bar">
                    <div class="sub-div" style="width: ${percentageAmount+'%'};"></div>
                </div>`;
    }

	
    /**
     * check program is started or not based on current date
     */
	checkProgramStartDate(){
		var currentDate = new Date(); 
		return (currentDate >= this.$startDate) ? true : false;
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
                <div class="cross-icon" id="cross-icon"><img
                src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/667bd034e71af9888d9eb91d_icon%20(1).svg"
                loading="lazy" alt=""></div>
            </div>
            <div class="pre-camp_subtitle-wrapper">
                <div class="pre-camp_subtitle">Needs to be completed by ${ this.$deadlineDate.toLocaleString('default', { month: 'long' })} ${this.$deadlineDate.getDate()+this.getOrdinalSuffix(this.$deadlineDate.getDate())}</div>
                <div class="pre-camp_progress-container">
                ${this.progressBar()}
                </div>
            </div>
            ${formList}
            ${this.resourceList()}
        `;


        return preCampDiv;
    }

   invoiceList() {
	   this.$totalInvoice +=  this.$invoices.invoiceList.length;
        return `<div>
                    <div class="pre-camp_subtitle-wrapper">
                        <div class="pre-camp_subtitle">Invoices</div>
                        <div class="pre-camp_progress-container">
                        ${this.progressBarInvoice()}
                        </div>
                    </div>
                    <div class="pre-camp_grid invoice_grid" id="invoice_${this.$studentDetail.uniqueIdentification}">
                    </div>
                </div>`;
    }	
   
    formCategoryList(formCategory) {
        let invoiceForm = formCategory.name;
        let invoiceClass = (invoiceForm == 'Invoice') ? "invoice_grid" : "form_grid";
        formCategory.forms = this.filterInvoiceForms(formCategory.forms);
        //Invoice Changes, Added div for preCamp section, when no form invoice present.
        if (invoiceForm == 'Invoice' && !formCategory.forms.length) {
            if (this.$invoices.invoiceList != null) {

                return this.invoiceList();
            }
        }

        if (!formCategory.forms.length) {
            return;

        }
        //*Invoice Changes, updated grid item div class below, to append invoice related forms
        let gridItem = (invoiceForm == 'Invoice') ? `invoice_${this.$studentDetail.uniqueIdentification}` : `form_${this.$studentDetail.uniqueIdentification}`;
        
        
        if(invoiceForm == "Invoice"){
            this.$totalInvoice = formCategory.forms.length + this.$invoices.invoiceList.length;
            return `
            <div>
            <div class="pre-camp_subtitle-wrapper">
                <div class="pre-camp_subtitle">Invoices</div>
                <div class="pre-camp_progress-container">
                ${this.progressBarInvoice()}
                </div>
            </div>
            <div class="pre-camp_grid ${invoiceClass}" id="${gridItem}">
                    ${this.formsList(formCategory,'invoices')}
                </div>
            </div>
            `;
        }
        var formCategory = `<div>
                <div class="pre-camp_subtitle">${formCategory.name}</div>
                <div class="pre-camp_grid ${invoiceClass}" id="${gridItem}">
                    ${this.formsList(formCategory, 'forms')}
                </div>
            </div>`;
        return formCategory;
    }
    formsList(formCategory, type) {
        if (formCategory.forms.length == 0) {
            return ''
        }
        var forms = formCategory.forms.sort(function (r, a) {
            return r.sequence - a.sequence
        }).map(form => this.singleForm(form, type)).join('')
        return forms;
    }
    singleForm(form, type) {
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
        var form_link_text = (form.form_sub_type == 'dropoff_invoice' || form.form_sub_type == 'pickup_invoice') ? 'Invoice' : 'Form';
        if (added_by_admin) {
            link_text = "Completed";
        } else if (is_live) {
           link_text = (editable) ? ((this.$isLiveProgram && form.is_editable) ? "Edit "+form_link_text : "View "+form_link_text) : "Go to "+form_link_text;
        } else {
            link_text = "Coming Soon";
        }
        if (is_live && type == 'forms') {
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
        let percentageAmount = (this.$completedFormOnly.length) ? (100 * this.$completedFormOnly.length) / this.$totalForm : 0;
        return `<div class="pre-camp_subtitle opacity-50"> ${parseInt(percentageAmount)+'%'} / ${this.$completedFormOnly.length} of ${this.$totalForm} forms complete</div>
                <div class="pre-camp_progress-bar">
                    <div class="sub-div" style="width: ${percentageAmount+'%'};"></div>
                </div>`;
    }
    createDuringCampContent() {
        const debateEvent = this.$programDetail.debateEvent;
        const duringCampDiv = document.createElement('div');
        duringCampDiv.className = 'during-camp_div';
	let isInvoiceClass = (this.$invoices.invoiceList == null) ? 'hide' : '';
        duringCampDiv.innerHTML = `
            <div class="pre-camp_title-content-wrapper">
                <div id="w-node-_8e292b85-7013-e53b-a349-66617a361c36-b55b4cc9" class="pre-camp_title-div bg-blue">
                    <div class="dm-sans line-height-20">During camp</div>
                </div>
                <div class="pre-camp_title-div">
                    <div class="pre-camp_title-text">Resources/Camp Topic</div>
                </div>
            </div>
            ${ this.getCampTopicData() ? this.getCampTopicData() : 'Resources not available for this camp'}
            <div class="${isInvoiceClass}">
                    <div class="pre-camp_subtitle">Invoice</div>
                    <div class="pre-camp_grid" id="during_invoice_${this.$studentDetail.uniqueIdentification}">
                    </div>
                </div>
            ${this.getAllResources()}
        `;

        return duringCampDiv;
    }
    getAllResources(){
        if(this.$uploadedContent.length == 0){
            return '';
        }
        return `<div>
                <div class="pre-camp_subtitle-wrapper">
                        <div class="pre-camp_subtitle">Resources</div>
                    </div>
                <div class="resources_wrapper">
                    ${this.$uploadedContent.map(uploadData => this.resourceLink(uploadData)).join('')}
                </div>
            </div>`;
    }
    resourceList() {
        const debateEvent = this.$programDetail.debateEvent;
        if (this.$uploadedContent.length || debateEvent == 'Lincoln-Douglas' ||  debateEvent == 'Public Forum') {
            return `${this.getCampTopicData()}
                    ${this.getAllResources()}`;
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
    /**
     * Get Camp topic data 
     */
    getCampTopicData() {
        let textContent = (this.$programDetail.campTopic) ? this.$programDetail.campTopic : "";
        // const debateEvent = this.$programDetail.debateEvent;
        // if (!textContent && debateEvent === "Lincoln-Douglas") {
        //     textContent = "Resolved: The United States ought to adopt carbon pricing."
        // } else if (!textContent && debateEvent === "Public Forum") {
        //     textContent = "Resolved: The United States federal government should substantially expand its surveillance infrastructure along its southern border.";
        // }
        // console.log('debateEvent', debateEvent)
        if(textContent){
            return `<div>
                        <div class="pre-camp_subtitle-wrapper">
                            <div class="pre-camp_subtitle">Camp Topic</div>
                        </div>
                        ${textContent}
                    </div>`;
        }else{
            return "";
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
                            <div class="dm-sans opacity-70">${tab.studentDetail.studentName.first} ${tab.studentDetail.studentName.last} | ${ startDate.toLocaleString('default', { month: 'long' })} ${startDate.getDate()} - ${ endDate.toLocaleString('default', { month: 'long' })} ${endDate.getDate()} </div>
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
