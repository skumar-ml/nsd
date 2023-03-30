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
class SupplementaryForm {
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
	 * Display single supplementary and form data
	 */
	view(){
		var $this = this;
       if(this.$formslist){
		   let parentForm = this.$formslist;
		   var supplementaryDiv = document.getElementById("supplementary-"+$this.currentIndex);
		   supplementaryDiv.innerHTML = "";
		   var $tabNo = 1;
		   $this.$totalForm = 0;
		   parentForm.sort(function(r,a){return r.sequence-a.sequence}); // order form categories via order specified in MongoDB
		   // for every form category in parentForm, start building supplementary
	       	   parentForm.forEach((form) => {
			   var supplementaryContainerDiv = creEl("div", "supplementary-container", "supplementary-container-"+$tabNo+$this.currentIndex)
			   var labelDiv = creEl("div", "label label-"+$this.currentIndex);
			   // check forms for completion and put corresponding icon & text
			   var checkAllForms = $this.checkAllForms(form.forms);
			   var imgUncheck = creEl("img",'all-img-status');
			   imgUncheck.src = $this.getCheckedIcon(checkAllForms);
			   var textUncheck = $this.getCheckedText(checkAllForms);
			   labelDiv.innerHTML = form.name;
			   labelDiv.prepend(imgUncheck, textUncheck)
			   var supplementaryContentDiv = document.createElement("div");
			   supplementaryContentDiv.className="supplementary-content";
			   var ul= creEl('ul');
			   // for every form in the formCategory
			   form.forms.forEach((cForm) => {
				   //check it's editable
				   let editable = $this.checkform(cForm.formId);
				   let is_live = cForm.is_live;
				   var li=creEl('li');
				   var li_text=creEl('span', 'supplementary_name');
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
			   supplementaryContentDiv.appendChild(ul)
			   supplementaryContainerDiv.prepend(labelDiv, supplementaryContentDiv);
			   supplementaryDiv.appendChild(supplementaryContainerDiv);
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
		  $this.programDates();
		  //$this.viewService();
		  $this.view();
		  $this.renderSupplementaryHeader();
		  $this.setPercentage();
		  $this.initiateSupplementary();
		  $this.initiateLightbox();
		  //var spinner = document.getElementById('half-circle-spinner');
		  //spinner.style.display = 'none';
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
	 * Render Supplementary Header like form completion and deadline
	 */
	renderSupplementaryHeader(){
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var date = this.$programDetail.deadlineDate.replace(/\\/g, '');
		date = date.replace(/"/g, '')
		var deadlineDate = new Date(date);
		let percentageAmount = (this.$completedForm.length) ? (100 * this.$completedForm.length) / this.$totalForm : 0;
		let supplementaryFooter = document.getElementById("supplementary-footer-"+this.currentIndex);
		supplementaryFooter.innerHTML ="";
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
		let deadlineText = document.createElement("div");
		deadlineText.className = "deadline-text";
		let footerText = document.createElement("p");
		if(deadlineDate){
			footerText.innerHTML = "Please complete these required forms prior to: "+months[deadlineDate.getMonth()]+" "+deadlineDate.getDate()+", "+deadlineDate.getFullYear();
		}
		deadlineText.append(footerText);
		supplementaryFooter.prepend(progressbar, deadlineText)
	}
	/**
	 * Set Percentage value on supplementary header
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
	 * Set Program Date
	 */
	programDates(){
		let startDate = new Date(this.$programDetail.startDate);
		let endDate = new Date(this.$programDetail.endDate);
		var program_dates = document.getElementById("program_dates-"+this.currentIndex)
		program_dates.innerHTML = "Supplementary Program Dates: "+ startDate.toLocaleDateString() +" to "+ endDate.toLocaleDateString();
	}
	/**
	 * Script for supplementary feature
	 */
	initiateSupplementary(){
		const supplementary = document.getElementsByClassName('label-'+this.currentIndex);

			function removeActiveItem(cEl){
				for (let x=0; x<supplementary.length; x++) {
					if(cEl !==supplementary[x]){
						supplementary[x].parentNode.classList.remove('active')
					}
				}
			}
		for (let i=0; i<supplementary.length; i++) {
			supplementary[i].addEventListener('click', function () {
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
	 * initialize Lightbox and rerender supplementary after close the lightbox
	 */
	initiateLightbox(){
		var $this = this;
		[].forEach.call(document.getElementsByClassName("iframe-lightbox-link"), function (el) {
		  el.lightbox = new IframeLightbox(el, {
			onClosed: function() {
				var spinner = document.getElementById('half-circle-spinner');
				spinner.style.display = 'block';				
				setTimeout(function() {
					new SupplementaryTabs(this.webflowMemberId, this.accountEmail)
				}, 500);
			},
			scrolling: true,
		  });
		});
	}
}
/*--------------------------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------------------------*/
/**
 * Class for Handling Student list select box
 * @param webflowMemberId - MemberId
 * @param accountEmail - Member Email
 */
class SupplementaryProgram {
	$activeTabID = "";
	$activeMainTabID = "";
	$apiData = '';
	constructor(webflowMemberId, accountEmail){
		this.webflowMemberId = webflowMemberId;
		this.accountEmail = accountEmail;
		this.callApi(); // renders data for each tab
		
	}
  /*Method for create html element*/
	creEl(name,className,idName){
	  var el = document.createElement(name);
		if(className){
		  el.className = className;
		}
		if(idName){
		  el.setAttribute("id", idName)
		}
		return el;
	}
  /*Create Student Select html element */
	makeList(apiData, selectProgram){
		this.$apiData = apiData;
		var supContainer = document.getElementById("supplementary-program");
		var studentList = this.creEl('select', 'student-select-list w-select', 'student-select-list');
		//Add default option
		var defaultoption = document.createElement("option");
			defaultoption.value = "";
			defaultoption.text = "Select Student";
			studentList.appendChild(defaultoption);
		supContainer.appendChild(studentList);
    /* Creating student slect option */
		apiData.forEach(item => {
			var option = document.createElement("option");
			option.value = item.studentDetail.uniqueIdentification;
			option.text = item.studentDetail.studentName.first+' '+item.studentDetail.studentName.last+' ('+item.programDetail.programName+'-'+item.programCategory.programCategoryName+')';
			studentList.appendChild(option);
      option.setAttribute('data-programName', item.programDetail.programName)
		})
		var $this = this;
    /*bind method after selecting student*/
		studentList.onchange = function (){
			$this.selectProgram($this);
		};

	}
	/* Storing selected student data in local storage */
	saveLocalStorageData(studentSelectListValue){
	    if(Array.isArray(this.$apiData)){
			var currentStudentData = this.$apiData.filter(item => item.studentDetail.uniqueIdentification == studentSelectListValue);
			localStorage.setItem("supStuEmail", JSON.stringify(currentStudentData[0].studentDetail));
		}
		
	}
	/* Added supplementary param on checkout page link and hide and show  Minnesota ld program*/
	selectProgram($this){
		var studentSelectList = document.getElementById("student-select-list");
		var supplementaryProgramList = document.getElementById("supplementary-program-list");
		if(!studentSelectList.value){
			supplementaryProgramList.classList.add("hide")
		}else{
			supplementaryProgramList.classList.remove('hide')
			var studentSelectListValue = studentSelectList.value;
			$this.saveLocalStorageData(studentSelectListValue);
			
			var supprolink = document.getElementsByClassName("supprolink");
			Array.from(supprolink).forEach(link => {
				var linkUrl = link.getAttribute('href').split("?");
				link.setAttribute("href", linkUrl[0]+'?productType=supplementary');
			})
			let programName = studentSelectList.options[studentSelectList.selectedIndex].getAttribute("data-programName");
			console.log('programName', programName)
			if(programName == "Minnesota LD"){
				$('.minnesota-ld').show();
			}else{
				$('.minnesota-ld').hide();
			}
		}
	}
	/*Call API to get student list with program details*/
	callApi(){
  	
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCompletedForm/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
    	
		  var responseText =  JSON.parse(xhr.responseText);
		  $this.makeList(responseText)
      var spinner = document.getElementById('half-circle-spinner');
      spinner.style.display = 'none';
		}	
	}
}

/*--------------------------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------------------------*/
/**
 * Class for Handling multiple forms stabs
 * @param webflowMemberId - MemberId
 * @param accountEmail - Member Email
 */
class SupplementaryTabs {
	$activeTabID = "";
	$activeMainTabID = "";
	constructor(webflowMemberId, accountEmail){
		this.webflowMemberId = webflowMemberId;
		this.accountEmail = accountEmail;
		this.renderFormsData(); // renders data for each tab
		
	}
	/**
	 * Render stabs for multiple forms
	 * @param responseText - forms object provided by API
	 */
	viewstabs(responseText){
		var stabsContainer = document.getElementById("stabs-container");
		stabsContainer.innerHTML = "";
		var stabs = creEl("ul", "stabs")
		var contentSection = creEl("div", "content-section");
    // if free student, show free resources
		if(responseText == "No data Found"){
			document.getElementById("free-resources").style.display = "block";
			return false;
    // else, show form supplementary
		}else{
			document.getElementById("paid-resources").style.display = "block";
		}
    // responseText is array corresponding to all payments under familyID
		var is_single = (responseText.length > 1) ? false : true;
		responseText.forEach((formData, index) => {
			  let currentIndex = index+1;
			  var activeliClass = (currentIndex == 1 && is_single) ? "tab_li active_tab" : "tab_li";
			  // if not single, instantiate stabs
        //if(!is_single){
          //Hide service paragraph - SK: what is the service paragraph? 
          //document.getElementById("service-para").style.display = "none";				
          var stabsE = creEl("li", activeliClass, 'li-tab'+currentIndex);
          stabsE.innerHTML = formData.studentDetail.studentName.first+" "+formData.studentDetail.studentName.last+" - "+formData.programDetail.programName+" "+formData.programDetail.debateEvent+" "+formData.programCategory.programCategoryName;
          stabsE.setAttribute("data-tab-id", 'tab'+currentIndex )
          stabs.appendChild(stabsE);
			//  }
        // if single, show single view
			  var activeClass = (currentIndex == 1 && is_single) ? " " : "";
			  var tabContent = creEl("div", "content "+activeClass, "tab"+currentIndex);
			  var supplementaryHeading = creEl('h3', 'totolist-text');
			  supplementaryHeading.innerHTML = "To Do List";
			  var supplementary = creEl("div","supplementary","supplementary-"+currentIndex)
			  var program_dates = creEl("h4","program_dates","program_dates-"+currentIndex)
			  var supplementaryFooter = creEl("div","supplementary-footer","supplementary-footer-"+currentIndex)
			  tabContent.prepend(program_dates, supplementaryHeading, supplementaryFooter, supplementary)
			  contentSection.appendChild(tabContent);
		})
		stabsContainer.prepend(stabs,contentSection)
	}
	/**
	 * initialize  Tabs feature - adds toggle function for folders in supplementary 
	 */
	initiateTabs(){
	  var d = document,
      stabs = d.querySelector('.stabs'),
      tab = d.querySelectorAll('.tab_li'),
      contents = d.querySelectorAll('.content');
	  if(!stabs){
		 return false; 
	  }
	  stabs.addEventListener('click', function(e) {
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
	 * Get current active tab before initiate new supplementary
	 */
	getCurrentActiveTag(){
		const supplementary = document.getElementsByClassName('active');
		var $this = this;
		for (let i=0; i<supplementary.length; i++) {
			$this.$activeTabID = supplementary[i].id;
		}
		const stabs = document.getElementsByClassName('active_tab');
		var $this = this; // makes global
		for (let i=0; i<stabs.length; i++) {
			$this.$activeMainTabID = stabs[i].id;
		}
	}
	/**
   If form is submitted/closed, set active tab to know which supplementary folder to display as open
	 */
	setCurrentActiveTag(){
		var $this = this;
		const supplementary = document.getElementById($this.$activeTabID);
		if(supplementary){
			supplementary.classList.add("active");
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
    var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'block';
    
		this.getCurrentActiveTag();
    // calls api using webflow member ID
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getSupplimentaryForm/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
      spinner.style.display = 'none';
		  let responseText =  JSON.parse(xhr.responseText); 
		  $this.viewstabs(responseText);
		  $this.initiateTabs();
		  if(responseText == "No data Found"){
			  return false;
		  }
      // formData = responseText[index]
		  responseText.forEach((formData,index) => {
			  setTimeout(function(){
				  let currentIndex = index+1;
				  new SupplementaryForm($this.webflowMemberId, formData,currentIndex, $this.accountEmail);
			  },30)
		  })
		  setTimeout(function(){
		  $this.setCurrentActiveTag();
		  },500) // YY: may remove timeout
		}
	}
}
