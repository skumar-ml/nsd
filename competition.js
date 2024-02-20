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
	$competition = [];
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
	
	/**
	 * Display single accordion and form data
	 */
	view(){
		var $this = this;
       if(this.$competition){
		   let competition = this.$competition;
		   var accordionDiv = document.getElementById("accordion-"+$this.currentIndex);
		   accordionDiv.innerHTML = "";
		   var $tabNo = 1;
		   $this.$totalForm = 0;
				competition.sort(function(a,b){
				  // Turn your strings into dates, and then subtract them
				  // to get a value that is either negative, positive, or zero.
				  return new Date(b.startDate) - new Date(a.startDate);
				});
		   // for every form category in competition, start building accordion
	       	   competition.forEach((competi) => {
				   
			   
			   var accordionContainerDiv = creEl("div", "accordion-container", "accordion-container-"+$tabNo+$this.currentIndex)
			   var labelDiv = creEl("div", "label label-"+$this.currentIndex);
			   // check forms for completion and put corresponding icon & text
			   var checkAllForms = false;
			   var imgUncheck = creEl("img",'all-img-status');
			   imgUncheck.src = $this.getCheckedIcon(checkAllForms);
			   var textUncheck = $this.getCheckedText(competi.is_live);
			   labelDiv.innerHTML = competi.competitionName;
			   labelDiv.prepend(imgUncheck, textUncheck)
			   
			   var accordionContentDiv = document.createElement("div");
			   accordionContentDiv.className="accordion-content";
			   var ul= creEl('ul');
			   // for every form in the formCategory
			   var li=creEl('li');
			   var li_text=creEl('span', 'accordion_name bold');
				   li_text.innerHTML = 'Teams';
				   li.prepend(li_text);
			   var span=creEl('span', 'action_text bold');
				   span.innerHTML = 'Points';
				   li.append(span);
			   ul.appendChild(li);
			   //Object.values()
			   console.log('competi.points', competi.points)
			   competi.points.sort(function(r,a){return Object.values(a)[0] - Object.values(r)[0]});			   
			   competi.points.forEach((cForm,index) => {
				   
				   //check it's editable
				   let editable = false;
				   let is_live = true;
				   var li=creEl('li');
				   //var li_text=creEl('span', 'accordion_name');
				   // Added cross line for completed forms
				   var li_text=creEl('span', 'accordion_name'+((editable)? ' completed_form': ''));
				   li_text.innerHTML = Object.keys(cForm)[0];
				   li.prepend(li_text);
				   var span=creEl('span', 'action_text');
				   span.innerHTML = Object.values(cForm)[0];
				   li.append(span);
				   
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
	
	}
	
	/**
	 * Render single json form data
	 * @param responseText - single form object provided by API
	 */
	// responseText is an object corresponding to MongoDB collection
	renderFormData(responseText){
		var $this = this;
		  $this.$completedForm = responseText.formCompletedList;
		  $this.$competition = responseText.competition;
		  $this.$programCategory = responseText.programCategory;
		  $this.$studentDetail = responseText.studentDetail;
		  $this.$programDetail = responseText.programDetail;
		  $this.$uploadedContent = responseText.uploadedContent;
		  $this.checkProgramDeadline();
		  $this.viewService();
		  $this.view();
		  $this.initiateAccordion();
		  $this.initiateLightbox();
		  var spinner = document.getElementById('half-circle-spinner');
		  spinner.style.display = 'none';
		  if(this.page == 'portal'){
		  	$this.initiateCampResources();
		  }
	}
	/**
	 * Display Program name for single program
	 */
	viewService(){
		var service = document.getElementById('service');
		service.innerHTML = this.$programDetail.programName;
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
			imgCheck.innerHTML = '&#10003;  Running';
		}else{
			imgCheck = creEl("span", 'forms_incomplete_status');
			imgCheck.innerHTML = 'Completed';
		}
		return imgCheck;
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
			topicText.textContent = "Resolved: The United States ought to guarantee the right to housing.";
		}
		else if (debateEvent === "Public Forum") {
			topicText.textContent = "Resolved: The United States federal government should substantially increase its military presence in the Arctic.";
		}
		topicDiv.appendChild(topicText);
		parentAccordionDiv.appendChild(topicDiv);

		// create Resources div
		const resourcesDiv = document.createElement('div');
		resourcesDiv.classList.add('portal-dash-resources');

		// Resources heading
		headingEl = document.createElement('p');
		headingEl.classList.add('portal-subheader');
		headingEl.textContent = "Resources";
		resourcesDiv.appendChild(headingEl);

		// Resources grid
		const resourceGrid = document.createElement('div');
		resourceGrid.classList.add('w-layout-grid', 'portal-resources-grid');

		// Packing List
		const packingHTML = '<a href="https://global-uploads.webflow.com/6271a4bf060d543533060f47/645c80eecc019a3d39d67ce6_2023%20NSD%20Packing%20List.pdf" target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Packing List</p></a>';
		resourceGrid.insertAdjacentHTML('beforeend', packingHTML);

		// Skill Builder
		var skillBuilderLink = "#";
		if (debateEvent === "Lincoln-Douglas") {
			skillBuilderLink = "https://drive.google.com/drive/folders/1xaIDK1lEBSYXMH86mIs1M7-Wlu2sBXCl?usp=sharing";
		}
		else if (debateEvent === "Public Forum") {
			skillBuilderLink = "https://drive.google.com/drive/folders/1ePKoI9HiyyDlJx0oKwQE1MZW81FejpDu?usp=sharing";
		}
		else if (debateEvent === "All Events" || debateEvent === "Worlds School") {
			var allEventSkillLink = "https://drive.google.com/drive/folders/1xaIDK1lEBSYXMH86mIs1M7-Wlu2sBXCl?usp=sharing";
			var allEventSkillHTML = '<a href=' + allEventSkillLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">LD Skill Builder</p></a>';
			resourceGrid.insertAdjacentHTML('beforeend', allEventSkillHTML);

			allEventSkillLink = "https://drive.google.com/drive/folders/1ePKoI9HiyyDlJx0oKwQE1MZW81FejpDu?usp=sharing";
			allEventSkillHTML = '<a href=' + allEventSkillLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">PF Skill Builder</p></a>';
			resourceGrid.insertAdjacentHTML('beforeend', allEventSkillHTML);
		}
			
		if (skillBuilderLink !== "#") {
			const skillBuilderHTML = '<a href=' + skillBuilderLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">NSD Skill Builder</p></a>';
			resourceGrid.insertAdjacentHTML('beforeend', skillBuilderHTML);
		}

		// Schedule
		const scheduleLink = this.$programDetail.scheduleLink;
		if (scheduleLink !== "#") {
			const scheduleHTML = '<a href=' + scheduleLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Daily Schedule</p></a>';
			resourceGrid.insertAdjacentHTML('beforeend', scheduleHTML);
		}

		// Info Sheet
		const infoLink = this.$programDetail.logisticLink;
		if (infoLink !== "#") {
			const infoHTML = '<a href=' + infoLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Info Sheet</p></a>';
			resourceGrid.insertAdjacentHTML('beforeend', infoHTML);
		}
		
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



/**
 * Class for Handling multiple forms tabs
 * @param webflowMemberId - MemberId
 * @param accountEmail - Member Email
 */
class AccordionTabs {
	$activeTabID = "";
	$activeMainTabID = "";
	constructor(webflowMemberId, accountEmail){
		this.webflowMemberId = webflowMemberId;
		this.accountEmail = accountEmail;
		this.renderFormsData(); // renders data for each tab
		
	}
	/**
	 * Render tabs for multiple forms
	 * @param responseText - forms object provided by API
	 */
	viewtabs(responseText){
		var tabsContainer = document.getElementById("tabs-container");
		tabsContainer.innerHTML = "";
		var tabs = creEl("ul", "tabs")
		var notificationDiv = creEl('div', 'notification_container');
		var is_notification = false;
		var contentSection = creEl("div", "content-section");
    // if free student, show free resources
		if(responseText == "No data Found"){
			document.getElementById("free-resources").style.display = "block";
			return false;
    // else, show form accordion
		}else{
			document.getElementById("paid-resources").style.display = "block";
		}
    // responseText is array corresponding to all payments under familyID
		var is_single = (responseText.length > 1) ? false : true;
		responseText.forEach((formData, index) => {
			if(formData.failedPayment == undefined){
			
			  let currentIndex = index+1;
			  var activeliClass = (currentIndex == 1 && is_single) ? "tab_li active_tab" : "tab_li";
			  // if not single, instantiate tabs
        if(!is_single){
          //Hide service paragraph - SK: what is the service paragraph? 
          document.getElementById("service-para").style.display = "none";				
          var tabsE = creEl("li", activeliClass, 'li-tab'+currentIndex);
          tabsE.innerHTML = formData.programDetail.programName+" "+formData.programDetail.debateEvent;
          tabsE.setAttribute("data-tab-id", 'tab'+currentIndex )
          tabs.appendChild(tabsE);
			  }
        // if single, show single view
			  var activeClass = (currentIndex == 1 && is_single) ? "active_tab" : "";
			  var tabContent = creEl("div", "content "+activeClass, "tab"+currentIndex);
			  var accordion = creEl("div","accordion","accordion-"+currentIndex)
			  var program_dates = creEl("h4","program_dates","program_dates-"+currentIndex)
			  var accordionFooter = creEl("div","accordion-footer","accordion-footer-"+currentIndex)
			  tabContent.prepend(program_dates, accordionFooter, accordion)
			  contentSection.appendChild(tabContent);
			  }
			  //else{
				  is_notification = true;
				  //formData.failedPayment.forEach(item => {
					let noText = creEl('span', 'noti_text');
					noText.innerHTML = 'Exciting news!  Self-check-in is live for  '+formData.programDetail.programName+', and points are up for grabs!';
					notificationDiv.appendChild(noText);
				 //})
			 // }
		})
		if(is_notification){
			tabsContainer.prepend(notificationDiv, tabs,contentSection)
		}else{
			tabsContainer.prepend(tabs,contentSection)
		}
	}
	/**
	 * initialize  Tabs feature - adds toggle function for folders in accordion 
	 */
	initiateTabs(){
	  var d = document,
      tabs = d.querySelector('.tabs'),
      tab = d.querySelectorAll('.tab_li'),
      contents = d.querySelectorAll('.content');
	  if(!tabs){
		 return false; 
	  }
	  tabs.addEventListener('click', function(e) {
		  if (e.target && e.target.nodeName === 'LI') {
			for (var i = 0; i < tab.length; i++) {
			  tab[i].classList.remove('active_tab');
			}
			e.target.classList.toggle('active_tab');
			for (i = 0; i < contents.length; i++) {
			  contents[i].classList.remove('active_tab');
			}
			var tabId = '#' + e.target.dataset.tabId;
	 d.querySelector(tabId).classList.toggle('active_tab'); 
		  }  
	  });
	}
	/**
	 * Get current active tab before initiate new accordion
	 */
	getCurrentActiveTag(){
		const accordion = document.getElementsByClassName('active');
		var $this = this;
		for (let i=0; i<accordion.length; i++) {
			$this.$activeTabID = accordion[i].id;
		}
		const tabs = document.getElementsByClassName('active_tab');
		var $this = this; // makes global
		for (let i=0; i<tabs.length; i++) {
			$this.$activeMainTabID = tabs[i].id;
		}
	}
	/**
   If form is submitted/closed, set active tab to know which accordion folder to display as open
	 */
	setCurrentActiveTag(){
		var $this = this;
		const accordion = document.getElementById($this.$activeTabID);
		if(accordion){
			accordion.classList.add("active");
		}
		const activeMainTabID = document.getElementById($this.$activeMainTabID);
		if(activeMainTabID){
			activeMainTabID.classList.add("active_tab");
		}
		const activeMainTabLi = document.getElementById('li-'+$this.$activeMainTabID);
		if(activeMainTabLi){
			activeMainTabLi.classList.add("active_tab");
		}
	}
	/**
	 * Render multiple forms data
	 */
	renderFormsData(){
		this.getCurrentActiveTag();
		var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'block';
    // calls api using webflow member ID
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCompetitionDetails/639ae841e3d1790004f29b80", true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
		  
		  let responseText =  JSON.parse(xhr.responseText); 
		  if(responseText.length > 0){
					 responseText =  responseText.reverse();
					 console.log('te', responseText)
		  }
		  $this.viewtabs(responseText);
		  $this.initiateTabs();
		  if(responseText == "No data Found"){
			  return false;
		  }
      // formData = responseText[index]
		  
		  responseText.forEach((formData,index) => {
			  setTimeout(function(){
				  console.log('formData.failedPayment', formData.failedPayment)
				  if(formData.failedPayment == undefined){
					let currentIndex = index+1;
					new AccordionForm($this.webflowMemberId, formData,currentIndex, $this.accountEmail, 'portal1');
				  }
			  },30)
		  })
		  setTimeout(function(){
		  $this.setCurrentActiveTag();
		  },500) // YY: may remove timeout
		}
	}
}

