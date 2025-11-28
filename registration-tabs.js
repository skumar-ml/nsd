/*
Purpose: Handles the registration tabs for the NSD portal.

Brief Logic: Fetches registration data from API and displays it in accordion tabs. Manages tab switching and form display based on program categories and completion status.

Are there any dependent JS files: No
*/
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
		var contentSection = creEl("div", "content-section");
    // if free student, show free resources
		if(responseText == "No data Found"){
			document.getElementById("free-resources").style.display = "block";
			return false;
    // else, show form accordion
		}else{
    	// remove locat if exists (parent has paid)
    	if (!(localStorage.getItem('locat') === null)) {
	        localStorage.removeItem('locat');
      }
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
          tabsE.innerHTML = formData.studentDetail.studentName.first+" "+formData.studentDetail.studentName.last+" - "+formData.programDetail.programName+" "+formData.programDetail.debateEvent+" "+formData.programCategory.programCategoryName+'('+formData.studentDetail.currentYear+')';
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
		})
		tabsContainer.prepend(tabs,contentSection)
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
  	var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'block';
		this.getCurrentActiveTag();
    // calls api using webflow member ID
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCompletedForm/"+$this.webflowMemberId+"/all", true)
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
         if(formData.failedPayment == undefined){
				  	let currentIndex = index+1;
				  	new AccordionForm($this.webflowMemberId, formData,currentIndex, $this.accountEmail, 'registration');
          }
			  },30)
		  })
		  setTimeout(function(){
		  $this.setCurrentActiveTag();
      spinner.style.display = 'none';
		  },40) // YY: may remove timeout
		}
	}
}