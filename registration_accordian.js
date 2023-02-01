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
	constructor(webflowMemberId,responseText,currentIndex, accountEmail){
		this.webflowMemberId = webflowMemberId;
		this.currentIndex = currentIndex;
		this.accountEmail = accountEmail;
		this.$completedForm = [];
		this.renderFormData(responseText) // gets mongoDB data from responseText object for specific registrations
		
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
			   // for every form in the formCategory
			   form.forms.forEach((cForm) => {
				   //check it's editable
				   let editable = $this.checkform(cForm.formId);
				   let is_live = cForm.is_live;
				   var li=creEl('li');
				   var li_text=creEl('span', 'accordion_name');
				   var imgCheck = creEl("img");
			       imgCheck.src = $this.getCheckedIcon(editable);
				   li_text.innerHTML = cForm.name;
				   //li_text.prepend(imgCheck)
				   li.prepend(imgCheck, li_text);
				   var formLink=creEl('a');
				   // display link/text depending on if form is live/editable
				   if(is_live){
				   if(editable){
					   let dbData = $this.getformData(cForm.formId)
						if(this.$isLiveProgram){
							formLink.href = (cForm.formId) ? "https://www.jotform.com/edit/"+dbData.submissionId+"?memberId="+$this.webflowMemberId+"&studentEmail="+$this.$studentDetail.studentEmail+"&accountEmail="+$this.accountEmail+"&paymentId="+$this.$studentDetail.uniqueIdentification : "";
						}else{
						   formLink.href = "https://www.jotform.com/submission/"+dbData.submissionId;
					   }
				   }else{
					formLink.href = (cForm.formId) ? "https://form.jotform.com/"+cForm.formId+"?memberId="+$this.webflowMemberId+"&studentEmail="+$this.$studentDetail.studentEmail+"&accountEmail="+$this.accountEmail+"&paymentId="+$this.$studentDetail.uniqueIdentification : "";
				    }
				   }
				   //Add iframe when it's live and above certain screenwidth
				   formLink.className = (is_live && window.innerWidth > 1200) ? "iframe-lightbox-link" : "";
				   var span=creEl('span', 'action_text');
				    if(is_live){
						span.innerHTML = (editable) ? ((this.$isLiveProgram) ? "Edit form" : "View Form" ): "Go to form";
					}else{
						span.innerHTML = "Coming Soon";
					}
				   formLink.append(span)
				   li.append(formLink);
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
		  $this.checkProgramDeadline();
		  $this.viewService();
		  $this.view();
		  $this.renderAccordionHeader();
		  $this.setPercentage();
		  $this.initiateAccordion();
		  $this.initiateLightbox();
		  var spinner = document.getElementById('half-circle-spinner');
		  spinner.style.display = 'none';
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
			var formsId = forms.map((formItem) => formItem.formId.toString());
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
		date = date.replace(/"/g, '')
		var deadlineDate = new Date(date);
		date = date.substring(0,16); //remove the final ':00' for countdown timer
		
		// Get and format program dates
		let startDate = new Date(this.$programDetail.startDate);
		let endDate = new Date(this.$programDetail.endDate);
		const program_dates_text = "Camp is " + months[startDate.getMonth()] + " " + startDate.getDate() + " to " + months[endDate.getMonth()] + " " + endDate.getDate();
		var program_dates = document.getElementById("program_dates-"+this.currentIndex)
		program_dates.innerHTML = "Camp is " + months[startDate.getMonth()] + " " + startDate.getDate() + " to " + months[endDate.getMonth()] + " " + endDate.getDate();
		
		// create and set progress bar & percentage
		let percentageAmount = (this.$completedForm.length) ? (100 * this.$completedForm.length) / this.$totalForm : 0;
		let accordionFooter = document.getElementById("accordion-footer-"+this.currentIndex);
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
		let timer_clock = document.createElement("a");
		timer_clock.href = "https://logwork.com/countdown-xknf";
		timer_clock.className = "countdown-timer"; 
		timer_clock.setAttribute("data-style", "columns"); timer_clock.setAttribute("data-timezone", "America/Los_Angeles"); timer_clock.setAttribute("data-date", date); timer_clock.setAttribute("data-digitscolor", "#a51c30");
		timer_clock.innerHTML = program_dates_text;
		let parent = accordionFooter.parentNode;
		parent.insertBefore(timer_clock, accordionFooter);
		
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
				var spinner = document.getElementById('half-circle-spinner');
				spinner.style.display = 'block';				
				setTimeout(function() {
					new AccordionTabs(this.webflowMemberId, this.accountEmail)
				}, 500);
			},
			scrolling: true,
		  });
		});
	}
}
