/**
 * 	
 * @param name - HTML element name
 * @param className - HTML element class attribute
 * @param idName - HTML element id attribute
 */
function creEl(name,className,idName){
  var el = document.createElement(name);
	if(className){
	  el.className = className;
	}
	if(idName){
	  el.setAttribute("id", idName)
	}
	return el;
}
/**
 * Class for handling single form
 * @param webflowMemberId - memberId
 * @param responseText - single form object provided by API
 * @param currentIndex - current index for form object
 * @param accountEmail - email id of member
 */
class AccordionForm {
	$completedForm = [];
	$formslist = [];
	$programCategory = {};
	$programDetail = {};
	$studentDetail = {};
	$totalForm = 0;
	$isLiveProgram = true;
	$uploadedContent = {};
	constructor(webflowMemberId,responseText,currentIndex, accountEmail, page){
		this.webflowMemberId = webflowMemberId;
		this.currentIndex = currentIndex;
		this.accountEmail = accountEmail;
		this.page = page;
		this.$completedForm = [];
		this.renderFormData(responseText) // gets mongoDB data from responseText object for specific registrations
		
	}

	/*Filter Ivoice Related Forms based on forms id*/
	filterInvoiceForms(forms){
		var newForms = forms.filter(item=>{
			if(item.form_sub_type == 'dropoff_invoice'){
				var dFD = this.$completedForm.find(item => item.form_sub_type == 'dropoff' && item.isInvoice == 'Yes')
				if(dFD != undefined){
				  return true
				}else{
				  return false
				}
				
			  }else if(item.form_sub_type == 'pickup_invoice'){
				var aFD = this.$completedForm.find(item=> item.form_sub_type == 'pickup' && item.isInvoice == 'Yes')
				if(aFD != undefined){
				  return true
				}else{
				  return false
				}
			  }else{
				return true
			  }
		})
		return newForms;
	}
	/**
	 * Display single accordion and form data
	 */
	view(){
		var $this = this;
       if(this.$formslist){
		   let parentForm = this.$formslist;
		   var accordionDiv = document.getElementById("accordion-"+$this.currentIndex);
		   accordionDiv.innerHTML = "";
		   var $tabNo = 1;
		   $this.$totalForm = 0;
		   parentForm.sort(function(r,a){return r.sequence-a.sequence}); // order form categories via order specified in MongoDB
		   // for every form category in parentForm, start building accordion
	       	   parentForm.forEach((form) => {
			   // Filter invoice Form
			   form.forms = $this.filterInvoiceForms(form.forms);
			   if(!form.forms.length){
				   return;
			   }
			   var accordionContainerDiv = creEl("div", "accordion-container", "accordion-container-"+$tabNo+$this.currentIndex)
			   var labelDiv = creEl("div", "label label-"+$this.currentIndex);
			   // check forms for completion and put corresponding icon & text
			   var checkAllForms = $this.checkAllForms(form.forms);
			   var imgUncheck = creEl("img",'all-img-status');
			   imgUncheck.src = $this.getCheckedIcon(checkAllForms);
			   var textUncheck = $this.getCheckedText(checkAllForms);
			   labelDiv.innerHTML = form.name;
			   labelDiv.prepend(imgUncheck, textUncheck)
			   var accordionContentDiv = document.createElement("div");
			   accordionContentDiv.className="accordion-content";
			   var ul= creEl('ul');
			   //sorting forms based on sequence
			   form.forms.sort(function(r,a){return r.sequence-a.sequence});
			   // for every form in the formCategory
			   form.forms.forEach((cForm) => {
				   //check it's editable
				   let editable = $this.checkform(cForm.formId);
				   let is_live = cForm.is_live;
				   var li=creEl('li');
				   //var li_text=creEl('span', 'accordion_name');
				   // Added cross line for completed forms
				   var li_text=creEl('span', 'accordion_name'+((editable)? ' completed_form': ''));
				   var imgCheck = creEl("img");
			       imgCheck.src = $this.getCheckedIcon(editable);
				   li_text.innerHTML = cForm.name;
				   //li_text.prepend(imgCheck)
				   li.prepend(imgCheck, li_text);
				   var formLink=creEl('a');
				   // display link/text depending on if form is live/editable
				   var added_by_admin = false;
				   if(is_live){
				   if(editable){
					   let dbData = $this.getformData(cForm.formId)
					   if(dbData.submissionId){
						if(this.$isLiveProgram  && cForm.is_editable){
							formLink.href = (cForm.formId) ? "https://www.jotform.com/edit/"+dbData.submissionId+"?memberId="+$this.webflowMemberId+"&studentEmail="+$this.$studentDetail.studentEmail+"&accountEmail="+$this.accountEmail+"&paymentId="+$this.$studentDetail.uniqueIdentification+"&programDetailId="+$this.$programDetail.programDetailId : "";
						}else{
						   formLink.href = "https://www.jotform.com/submission/"+dbData.submissionId;
					   }
					   }else{
						   added_by_admin = true;
					   }
				   }else{
					formLink.href = (cForm.formId) ? "https://form.jotform.com/"+cForm.formId+"?memberId="+$this.webflowMemberId+"&studentEmail="+$this.$studentDetail.studentEmail+"&accountEmail="+$this.accountEmail+"&paymentId="+$this.$studentDetail.uniqueIdentification+"&programDetailId="+$this.$programDetail.programDetailId : "";
				    }
				   }
				   //Add iframe when it's live and above certain screenwidth
				   formLink.className = (is_live && window.innerWidth > 1200 && !added_by_admin) ? "iframe-lightbox-link" : "";
				   var span=creEl('span', 'action_text');
				    if(added_by_admin){
					span.innerHTML = "Completed";
					formLink.className = "admin_completed_form";
				    }else if(is_live){
					span.innerHTML = (editable) ? ((this.$isLiveProgram && cForm.is_editable) ? "Edit form" : "View Form" ): "Go to form";
				    }else{
					span.innerHTML = "Coming Soon";
				    }
				   formLink.append(span)
				   li.append(formLink);
				   
				   /* Resubmission allow based db condition form code*/
				   if(cForm.is_resubmission && (editable && this.$isLiveProgram && cForm.is_editable)){
					var resubmissionFormLink=creEl('a');
					resubmissionFormLink.href = (cForm.formId) ? "https://form.jotform.com/"+cForm.formId+"?memberId="+$this.webflowMemberId+"&studentEmail="+$this.$studentDetail.studentEmail+"&accountEmail="+$this.accountEmail+"&paymentId="+$this.$studentDetail.uniqueIdentification : "";
					resubmissionFormLink.className = (is_live && window.innerWidth > 1200) ? "iframe-lightbox-link" : "";
					var span2=creEl('span', 'resubmit_text');
					span2.innerHTML = "Resubmit";
					resubmissionFormLink.append(span2)
					li.append(resubmissionFormLink);
				    }
				   
				   ul.appendChild(li);
				   if(is_live){
				    $this.$totalForm++;
				   }
			   })
			   accordionContentDiv.appendChild(ul)
			   accordionContainerDiv.prepend(labelDiv, accordionContentDiv);
			   accordionDiv.appendChild(accordionContainerDiv);
			   $tabNo++;
		   })
	   }
	// add timer script after accordions are built	
	var script = document.createElement("script");
	script.setAttribute("src", "https://cdn.logwork.com/widget/countdown.js");
	document.body.appendChild(script);
	// added class for completed form	
	let percentageAmount = (this.$completedForm.length) ? (100 * this.$completedForm.length) / this.$totalForm : 0;
	if(percentageAmount == '100'){
		accordionDiv.classList.add("all_completed_form")
	}
	}
	
	/**
	 * Render single json form data
	 * @param responseText - single form object provided by API
	 */
	// responseText is an object corresponding to MongoDB collection
	renderFormData(responseText){
		var $this = this;
		  $this.$completedForm = responseText.formCompletedList;
		  $this.$formslist = responseText.formList;
		  $this.$programCategory = responseText.programCategory;
		  $this.$studentDetail = responseText.studentDetail;
		  $this.$programDetail = responseText.programDetail;
		  $this.$uploadedContent = responseText.uploadedContent;
		  $this.checkProgramDeadline();
		  $this.viewService();
		  $this.view();
		  $this.renderAccordionHeader();
		  $this.setPercentage();
		  $this.initiateAccordion();
		  $this.initiateLightbox();
		  var spinner = document.getElementById('half-circle-spinner');
		  spinner.style.display = 'none';
		  $this.updateMemberFirstName();
		  if(this.page == 'portal'){
		  	$this.initiateCampResources();
		  }
	}

	/**
	 * Update Member's first name in portal after user profile update
	 */
	updateMemberFirstName(){
		var elements = document.getElementsByClassName("ms-portal-exit");
		var myFunctionNew = function() {
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
	
	/**
	 * Display Program name for single program
	 */
	viewService(){
		var service = document.getElementById('service');
		service.innerHTML = this.$programDetail.programName+" "+this.$programCategory.programCategoryName;
	}
	/**
	 * Check form's id in completedForm list (from MongoDB) and use to determine if form is editable
	 * @param formId - Jotform Id
	 */
	checkform($formId){
		if($formId){
			const found = this.$completedForm.some(el => el.formId == $formId);
			return found;
		}
		return false;
	}
	/**
	 * Check Program Deadline
	 */
	checkProgramDeadline(){
		var deadlineDate = this.$programDetail.deadlineDate.replace(/\\/g, '');
		deadlineDate = deadlineDate.replace(/"/g, '')
		var formatedDeadlineDate = new Date(deadlineDate);
		var currentDate = new Date(); 
		this.$isLiveProgram = (currentDate < formatedDeadlineDate) ? true : false;
	}
	/**
	 * Check all form status
	 * @param forms - forms Array Object
	 */
	checkAllForms(forms){
		if(forms){
			// showing status only for live forms
			var form = forms.filter((item => item.is_live));
			var formsId = form.map((formItem) => formItem.formId.toString());
			//var formsId = forms.map((formItem) => formItem.formId.toString());
			var completedFormsId = this.$completedForm.map((formItem) => formItem.formId.toString());
			const compareForm = completedFormsId.filter((obj) => formsId.indexOf(obj) !== -1);
			const uniqueform = compareForm.filter((value, index, self) => self.indexOf(value) === index)
			return ((formsId.length === uniqueform.length) && (formsId.every(val => uniqueform.includes(val))));
		}
	}
	/**
	 * Get Completed Form data by form id
	 * @param formId - Jotform Id
	 */
	getformData($formId){
		let data = this.$completedForm.find(o => o.formId == $formId);
		return data;
	}
	/**
	 * Get Checkbox icon for form complete or complete
	 */
	getCheckedIcon(status){
		if(status){
			return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495f35742c15354b2e0d_circle-check-regular.png";
		}else{
			return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495fdc487955887ade5b_circle-regular.png";
		}
	}
	/**
	 * Get category all form status as a text like it's complete or not
	 */
	getCheckedText(status){
		var imgCheck = "";
		if(status){
			imgCheck = creEl("span", 'forms_complete_status');
			imgCheck.innerHTML = '&#10003;  Done';
		}else{
			imgCheck = creEl("span", 'forms_incomplete_status');
			imgCheck.innerHTML = 'Needs to be Completed';
		}
		return imgCheck;
	}
	/**
	 * Render Accordion Header like form completion and deadline
	 */
	renderAccordionHeader(){
		// Define months
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		
		// Get and format deadline date
		var date = this.$programDetail.deadlineDate.replace(/\\/g, '');
		date = date.replace(/"/g, '');
		var deadlineDate = new Date(date);

		var timerDate = this.$programDetail.startDate.replace(/\\/g, '');
		timerDate = timerDate.replace(/"/g, '');
		timerDate = timerDate.substring(0,16); //remove the final ':00' for countdown timer
		
		// Get and format program dates
		let startDate = new Date(this.$programDetail.startDate);
		let endDate = new Date(this.$programDetail.endDate);
		const program_dates_text = "Camp is " + months[startDate.getMonth()] + " " + startDate.getDate() + " to " + months[endDate.getMonth()] + " " + endDate.getDate();
		//var program_dates = document.getElementById("program_dates-"+this.currentIndex)
		//program_dates.innerHTML = "Camp is " + months[startDate.getMonth()] + " " + startDate.getDate() + " to " + months[endDate.getMonth()] + " " + endDate.getDate();
		
		// create and set progress bar & percentage
		let percentageAmount = (this.$completedForm.length) ? (100 * this.$completedForm.length) / this.$totalForm : 0;
		let accordionFooter = document.getElementById("accordion-footer-"+this.currentIndex);
		// added class for completed form
		if(percentageAmount == '100'){
			accordionFooter.classList.add("all_completed_form")
		}
		accordionFooter.innerHTML ="";
		let progressbar = document.createElement("div");
		progressbar.className = "form-progressbar";
		let protext = document.createElement("p");
		protext.innerHTML = "<span class='percentage-value-"+this.currentIndex+"'>0%</span> / "+this.$completedForm.length+" of "+this.$totalForm+" forms complete &nbsp;";
		let progressContainer = document.createElement("div");
		progressContainer.className = "progress-container progress-container-"+this.currentIndex;
		progressContainer.setAttribute("data-percentage", (Math.round(percentageAmount)) ? Math.round(percentageAmount) : 0);
		let progress = document.createElement("div");
		progress.className = "progress progress-"+this.currentIndex;
		let percentage = document.createElement("div");
		percentage.className = "percentage percentage-"+this.currentIndex;
		progressContainer.prepend(progress, percentage);
		progressbar.prepend(progressContainer, protext)
		
		// accordian header text
		let deadlineText = document.createElement("div");
		deadlineText.className = "deadline-text";
		let footerText = document.createElement("p");
		footerText.className = "dm-sans";
		if(deadlineDate){
			footerText.innerHTML = "Please complete these required forms prior to: "+months[deadlineDate.getMonth()]+" "+deadlineDate.getDate()+", "+deadlineDate.getFullYear();
		}		
		
		// Countdown timer
		if(this.page == 'portal'){
			let timer_div = document.createElement("div");
			timer_div.style.width = '50%';
			timer_div.style.display = 'flex';
			timer_div.style.marginLeft = 'auto';
			timer_div.style.marginRight = 'auto';
			
			let timer_clock = document.createElement("a");
			timer_clock.href = "https://logwork.com/countdown-xknf";
			timer_clock.className = "countdown-timer"; 
			timer_clock.setAttribute("data-style", "columns"); timer_clock.setAttribute("data-timezone", "America/Los_Angeles"); timer_clock.setAttribute("data-date", timerDate); timer_clock.setAttribute("data-digitscolor", "#a51c30");
			timer_clock.innerHTML = program_dates_text;
			
			let parent = accordionFooter.parentNode;
			timer_div.appendChild(timer_clock);
			parent.insertBefore(timer_div, accordionFooter);		
		}
		// add elements to DOM
		deadlineText.append(footerText);
		accordionFooter.prepend(progressbar, deadlineText)
	}
	/**
	 * Set Percentage value on accordion header
	 */
	setPercentage() {
	  const progressContainer = document.querySelector('.progress-container-'+this.currentIndex);
	  const percentage = progressContainer.getAttribute('data-percentage') + '%';
	  const progressEl = progressContainer.querySelector('.progress-'+this.currentIndex);
	  progressEl.style.width = percentage;
	  const percentageValue = document.querySelector('.percentage-value-'+this.currentIndex);
	  percentageValue.innerText = percentage;
	}
	
	/**
	 * Script for accordion feature
	 */
	initiateAccordion(){
		const accordion = document.getElementsByClassName('label-'+this.currentIndex);

			function removeActiveItem(cEl){
				for (let x=0; x<accordion.length; x++) {
					if(cEl !==accordion[x]){
						accordion[x].parentNode.classList.remove('active')
					}
				}
			}
		for (let i=0; i<accordion.length; i++) {
			accordion[i].addEventListener('click', function () {
			  removeActiveItem(this)
			  this.parentNode.classList.toggle('active')
		  })
		}
	}
	/**
	 * initialize  ProgressBar and display
	 */
	initiateProgressBar(){
		const progressContainer = document.querySelector('.progress-container');
		function setPercentage() {
		  const percentage = progressContainer.getAttribute('data-percentage') + '%';
		  const progressEl = progressContainer.querySelector('.progress');
		  const percentageEl = progressContainer.querySelector('.percentage');
		  progressEl.style.width = percentage;
		  percentageEl.innerText = percentage;
		  percentageEl.style.left = percentage;
		}
	}
	/**
	 * initialize Lightbox and rerender accordion after close the lightbox
	 */
	initiateLightbox(){
		var $this = this;
		[].forEach.call(document.getElementsByClassName("iframe-lightbox-link"), function (el) {
		  el.lightbox = new IframeLightbox(el, {
			onClosed: function() {
				// Discuss with shubham and commented the code
				/* var spinner = document.getElementById('half-circle-spinner');
				spinner.style.display = 'block';				
				setTimeout(function() {
					new AccordionTabs(this.webflowMemberId, this.accountEmail)
				}, 500); */
			},
			scrolling: true,
		  });
		});
	}

	/**
	 * Script for accordion feature
	 */
	initiateCampResources(){
		// get Div to insert child into
		const parentAccordionDiv = document.getElementById('tab'+this.currentIndex);
		const debateEvent = this.$programDetail.debateEvent;

		// create Topic div
		const topicDiv = document.createElement('div');
		topicDiv.classList.add('portal-dash-resources');

		// Topic heading
		var headingEl = document.createElement('p');
		headingEl.classList.add('portal-subheader');
		headingEl.textContent = "Camp Topic";
		topicDiv.appendChild(headingEl);

		// Topic text
		const topicText = document.createElement('p');
		topicText.classList.add('dm-sans', 'bold');
		if (debateEvent === "Lincoln-Douglas") {
			topicText.textContent = "Resolved: The United States ought to adopt carbon pricing.";
		}
		else if (debateEvent === "Public Forum") {
			topicText.textContent = "Resolved: The United States federal government should substantially expand its surveillance infrastructure along its southern border.";
		}
		topicDiv.appendChild(topicText);
		parentAccordionDiv.appendChild(topicDiv);

		// create Resources div
		const resourcesDiv = document.createElement('div');
		resourcesDiv.classList.add('portal-dash-resources');

		// Resources heading
		var headingEl = document.createElement('p');
		headingEl.classList.add('portal-subheader');
		headingEl.textContent = "Resources";
		resourcesDiv.appendChild(headingEl);

		// Resources grid
		const resourceGrid = document.createElement('div');
		resourceGrid.classList.add('w-layout-grid', 'portal-resources-grid');

		// Packing List
		// const packingHTML = '<a href="https://global-uploads.webflow.com/6271a4bf060d543533060f47/645c80eecc019a3d39d67ce6_2023%20NSD%20Packing%20List.pdf" target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Packing List</p></a>';
		// resourceGrid.insertAdjacentHTML('beforeend', packingHTML);

		// Skill Builder
		// var skillBuilderLink = "#";
		// if (debateEvent === "Lincoln-Douglas") {
		// 	skillBuilderLink = "https://drive.google.com/drive/folders/1xaIDK1lEBSYXMH86mIs1M7-Wlu2sBXCl?usp=sharing";
		// }
		// else if (debateEvent === "Public Forum") {
		// 	skillBuilderLink = "https://drive.google.com/drive/folders/1ePKoI9HiyyDlJx0oKwQE1MZW81FejpDu?usp=sharing";
		// }
		// else if (debateEvent === "All Events" || debateEvent === "Worlds School") {
		// 	var allEventSkillLink = "https://drive.google.com/drive/folders/1xaIDK1lEBSYXMH86mIs1M7-Wlu2sBXCl?usp=sharing";
		// 	var allEventSkillHTML = '<a href=' + allEventSkillLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">LD Skill Builder</p></a>';
		// 	resourceGrid.insertAdjacentHTML('beforeend', allEventSkillHTML);

		// 	allEventSkillLink = "https://drive.google.com/drive/folders/1ePKoI9HiyyDlJx0oKwQE1MZW81FejpDu?usp=sharing";
		// 	allEventSkillHTML = '<a href=' + allEventSkillLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">PF Skill Builder</p></a>';
		// 	resourceGrid.insertAdjacentHTML('beforeend', allEventSkillHTML);
		// }
			
		// if (skillBuilderLink !== "#") {
		// 	const skillBuilderHTML = '<a href=' + skillBuilderLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">NSD Skill Builder</p></a>';
		// 	resourceGrid.insertAdjacentHTML('beforeend', skillBuilderHTML);
		// }

		// Schedule
		// const scheduleLink = this.$programDetail.scheduleLink;
		// if (scheduleLink !== "#") {
		// 	const scheduleHTML = '<a href=' + scheduleLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Daily Schedule</p></a>';
		// 	resourceGrid.insertAdjacentHTML('beforeend', scheduleHTML);
		// }

		// Info Sheet
		// const infoLink = this.$programDetail.logisticLink;
		// if (infoLink !== "#") {
		// 	const infoHTML = '<a href=' + infoLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Info Sheet</p></a>';
		// 	resourceGrid.insertAdjacentHTML('beforeend', infoHTML);
		// }
		// Added Resources from database
		if(this.$uploadedContent.length){
			this.$uploadedContent.forEach((uploadData)=>{
				if(uploadData.label && uploadData.uploadedFiles[0]){
					const uploadedHTML = '<a href=' + uploadData.uploadedFiles[0] + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">'+uploadData.label+'</p></a>';
					resourceGrid.insertAdjacentHTML('beforeend', uploadedHTML);
				}
			})
		}

		// Append resourceGrid and add entire div to DOM
		resourcesDiv.appendChild(resourceGrid);	
		parentAccordionDiv.appendChild(resourcesDiv);		
		
	}
}
