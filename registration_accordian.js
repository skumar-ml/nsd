class AccordionForm {
	$completedForm = [];
	$formslist = [];
	$programCategory = {};
	$programDetail = {};
	$studentDetail = {};
	$totalForm = 0;
	$isLiveProgram = true;
	constructor(webflowMemberId,responseText,currentIndex){
		this.webflowMemberId = webflowMemberId;
		this.currentIndex = currentIndex;
		this.$completedForm = [];
		this.renderFormData(responseText)
		
	}
	view(){
		var $this = this;
       if(this.$formslist){
		   let parentForm = this.$formslist;
		   var accordionDiv = document.getElementById("accordion-"+$this.currentIndex);
		   accordionDiv.innerHTML = "";
		   var $tabNo = 1;
		   $this.$totalForm = 0;
		   parentForm.sort(function(r,a){return r.sequence-a.sequence});
		   parentForm.forEach((form) => {
			   var accordionContainerDiv = creEl("div", "accordion-container", "accordion-container-"+$tabNo+$this.currentIndex)
			   var labelDiv = creEl("div", "label label-"+$this.currentIndex);
			   var checkAllForms = $this.checkAllForms(form.forms);
			   //var imgUncheck = document.createElement("img");
			   //imgUncheck.src = $this.getCheckedIcon(checkAllForms);
			   var imgUncheck = $this.getCheckedText(checkAllForms);
			   labelDiv.innerHTML = form.name;
			   labelDiv.prepend(imgUncheck)
			   var accordionContentDiv = document.createElement("div");
			   accordionContentDiv.className="accordion-content";
			   var ul= document.createElement('ul');
			   form.forms.forEach((cForm) => {
				   //check it's editable
				   let editable = $this.checkform(cForm.formId);
				   let is_live = cForm.is_live;
				   var li=document.createElement('li');
				   var imgCheck = document.createElement("img");
			       imgCheck.src = $this.getCheckedIcon(editable);
				   li.innerHTML = cForm.name;
				   li.prepend(imgCheck)
				   var formLink=document.createElement('a');
				   if(is_live){
				   if(editable){
					   let dbData = $this.getformData(cForm.formId)
						if(this.$isLiveProgram){
							formLink.href = (cForm.formId) ? "https://www.jotform.com/edit/"+dbData.submissionId+"?memberId=6352377431172a00041184b1&studentEmail="+$this.$studentDetail.studentEmail : "";
						}else{
						   formLink.href = "https://www.jotform.com/submission/"+dbData.submissionId;
					   }
				   }else{
					formLink.href = (cForm.formId) ? "https://form.jotform.com/"+cForm.formId+"?memberId="+$this.webflowMemberId+"&studentEmail="+$this.$studentDetail.studentEmail : "";
				    }
				   }
				   //Add iframe when it's live
				   formLink.className = (is_live) ? "iframe-lightbox-link" : "";
				   var span=document.createElement('span');
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
	renderFormData(responseText){
		var $this = this;
		  $this.$completedForm = responseText.formCompletedList;
		  $this.$formslist = responseText.formList;
		  $this.$programCategory = responseText.programCategory;
		  $this.$studentDetail = responseText.studentDetail;
		  $this.$programDetail = responseText.programDetail;
		  $this.checkProgramDeadline();
		  $this.programDates();
		  $this.viewService();
		  $this.view();
		  $this.renderAccordionHeader();
		  $this.setPercentage();
		  $this.initiateAccordion();
		  $this.initiateLightbox();
		  var spinner = document.getElementById('half-circle-spinner');
		  spinner.style.display = 'none';
	}
	viewService(){
		var service = document.getElementById('service');
		service.innerHTML = this.$programDetail.programName+" "+this.$programCategory.programCategoryName;
	}
	checkform($formId){
		if($formId){
			const found = this.$completedForm.some(el => el.formId == $formId);
			return found;
		}
		return false;
	}
	checkProgramDeadline(){
		var deadlineDate = this.$programDetail.deadlineDate.replace(/\\/g, '');
		deadlineDate = deadlineDate.replace(/"/g, '')
		var formatedDeadlineDate = new Date(deadlineDate);
		var currentDate = new Date(); 
		this.$isLiveProgram = (currentDate < formatedDeadlineDate) ? true : false;
	}
	checkAllForms(forms){
		if(forms){
			var formsId = forms.map((formItem) => formItem.formId.toString());
			var completedFormsId = this.$completedForm.map((formItem) => formItem.formId.toString());
			const compareForm = completedFormsId.filter((obj) => formsId.indexOf(obj) !== -1);
			const uniqueform = compareForm.filter((value, index, self) => self.indexOf(value) === index)
			return ((formsId.length === uniqueform.length) && (formsId.every(val => uniqueform.includes(val))));
		}
	}
	getformData($formId){
		let data = this.$completedForm.find(o => o.formId == $formId);
		return data;
	}
	getCheckedIcon(status){
		if(status){
			return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/6397004a34667b0dddf18448_circle-check-regular.svg";
		}else{
			return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/6397004a6204a0430dafe247_circle-regular.svg";
		}
	}
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
	// Render Accordion Header like form completion and deadline
	renderAccordionHeader(){
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var date = this.$programDetail.deadlineDate.replace(/\\/g, '');
		date = date.replace(/"/g, '')
		var deadlineDate = new Date(date);
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
		progressbar.prepend(protext,progressContainer)
		let deadlineText = document.createElement("div");
		deadlineText.className = "deadline-text";
		let footerText = document.createElement("p");
		if(deadlineDate){
			footerText.innerHTML = "Please complete these required document prior to: "+months[deadlineDate.getMonth()]+" "+deadlineDate.getDate()+", "+deadlineDate.getFullYear();
		}
		deadlineText.append(footerText);
		accordionFooter.prepend(progressbar, deadlineText)
	}
	//Set Percentage value on accordion header
	setPercentage() {
	  const progressContainer = document.querySelector('.progress-container-'+this.currentIndex);
	  const percentage = progressContainer.getAttribute('data-percentage') + '%';
	  const progressEl = progressContainer.querySelector('.progress-'+this.currentIndex);
	  progressEl.style.width = percentage;
	  const percentageValue = document.querySelector('.percentage-value-'+this.currentIndex);
	  percentageValue.innerText = percentage;
	}
	// Set Program Date
	programDates(){
		let startDate = new Date(this.$programDetail.startDate);
		let endDate = new Date(this.$programDetail.endDate);
		var program_dates = document.getElementById("program_dates-"+this.currentIndex)
		program_dates.innerHTML = "Camp Dates: "+ startDate.toLocaleDateString() +" to "+ endDate.toLocaleDateString();
	}
	// Script for accordion feature
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
	// initialize  ProgressBar and display
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
	// initialize Lightbox and rerender accordion after close the lightbox
	initiateLightbox(){
		var $this = this;
		[].forEach.call(document.getElementsByClassName("iframe-lightbox-link"), function (el) {
		  el.lightbox = new IframeLightbox(el, {
			onClosed: function() {
				var spinner = document.getElementById('half-circle-spinner');
				spinner.style.display = 'block';				
				setTimeout(function() {
					new AccordionTabs(this.webflowMemberId)
				}, 500);
			},
			scrolling: true,
		  });
		});
	}
}
