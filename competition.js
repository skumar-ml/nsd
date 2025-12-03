/*
Purpose: Builds accordion views of competition standings, sorting events and team point totals.

Brief Logic: Fetches competition data from API and sorts by start date. Builds accordion interface for each competition with timers, notifications, live check-in data, and tab navigation.

Are there any dependent JS files: No
*/
/**
 * 	
 * @param name - HTML element name
 * @param className - HTML element class attribute
 * @param idName - HTML element id attribute
 */
// Creates a DOM element with optional class and id attributes
function creEl(name, className, idName) {
	var el = document.createElement(name);
	if (className) {
		el.className = className;
	}
	if (idName) {
		el.setAttribute("id", idName)
	}
	return el;
}
/**
 * Class for handling single competition
 * @param webflowMemberId - memberId
 * @param responseText - single form object provided by API
 * @param currentIndex - current index for form object
 * @param accountEmail - email id of member
 */
class AccordionCompetition {
	$competition = [];
	$programDetail = {};
	// Initializes AccordionCompetition instance and renders competition data
	constructor(webflowMemberId, responseText, currentIndex, accountEmail) {
		this.webflowMemberId = webflowMemberId;
		this.currentIndex = currentIndex;
		this.accountEmail = accountEmail;
		
		this.renderCompetitionData(responseText) // gets mongoDB data from responseText object for specific registrations

	}
	// Displays the accordion view with competition standings sorted by start date
	view() {
		var $this = this;
		if (this.$competition) {
			let competition = this.$competition;
			var accordionDiv = document.getElementById("accordion-" + $this.currentIndex);
			accordionDiv.innerHTML = "";
			var $tabNo = 1;
			competition.sort(function (a, b) {
				// sorting competition based on start date.
				return new Date(b.startDate) - new Date(a.startDate);
			});
			// for every competition, start building accordion
			competition.forEach((singleCompetition) => {
				var accordionContainerDiv = creEl("div", "accordion-container", "accordion-container-" + $tabNo + $this.currentIndex)
				var labelDiv = creEl("div", "label label-" + $this.currentIndex);
				// check forms for completion and put corresponding icon & text
				var textUncheck = $this.getCheckedText(singleCompetition.is_live);
				labelDiv.innerHTML = singleCompetition.competitionName;
				labelDiv.prepend(textUncheck)

				var accordionContentDiv = document.createElement("div");
				accordionContentDiv.className = "accordion-content";
				var ul = creEl('ul');
				var li = creEl('li');
				var li_text = creEl('span', 'accordion_name bold');
				li_text.innerHTML = 'Teams';
				li.prepend(li_text);
				var span = creEl('span', 'action_text bold');
				span.innerHTML = 'Points';
				li.append(span);
				ul.appendChild(li);
				singleCompetition.points.sort(function (r, a) {
					return Object.values(a)[0] - Object.values(r)[0]
				});
				singleCompetition.points.forEach((cForm, index) => {
					var li = creEl('li');
					var li_text = creEl('span', 'accordion_name');
					li_text.innerHTML = Object.keys(cForm)[0];
					li.prepend(li_text);
					var span = creEl('span', 'action_text');
					span.innerHTML = Object.values(cForm)[0];
					li.append(span);
					ul.appendChild(li);
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
	 * Renders competition data and initializes accordion functionality
	 * @param responseText - single competition object provided by API
	 */
	renderCompetitionData(responseText) {
		var $this = this;
		$this.$competition = responseText.competition;
		$this.$programDetail = responseText.programDetail;
		$this.viewService();
		$this.view();
		$this.initiateAccordion();
		var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'none';
	}
	// Displays the program name for the current competition
	viewService() {
		var service = document.getElementById('service');
		service.innerHTML = this.$programDetail.programName;
	}
	// Returns the URL for the checked or unchecked icon based on status
	getCheckedIcon(status) {
		if (status) {
			return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495f35742c15354b2e0d_circle-check-regular.png";
		} else {
			return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495fdc487955887ade5b_circle-regular.png";
		}
	}
	// Returns a span element with competition status text (Running or Completed)
	getCheckedText(status) {
		var imgCheck = "";
		if (status) {
			imgCheck = creEl("span", 'forms_complete_status');
			imgCheck.innerHTML = '&#10003;  Running';
		} else {
			imgCheck = creEl("span", 'forms_incomplete_status');
			imgCheck.innerHTML = 'Completed';
		}
		return imgCheck;
	}
	// Initializes accordion functionality with click handlers for expanding/collapsing
	initiateAccordion() {
		const accordion = document.getElementsByClassName('label-' + this.currentIndex);

		function removeActiveItem(cEl) {
			for (let x = 0; x < accordion.length; x++) {
				if (cEl !== accordion[x]) {
					accordion[x].parentNode.classList.remove('active')
				}
			}
		}
		for (let i = 0; i < accordion.length; i++) {
			accordion[i].addEventListener('click', function () {
				removeActiveItem(this)
				this.parentNode.classList.toggle('active')
			})
		}
	}
}

/**
 * Class for Handling multiple competitions tabs
 * @param webflowMemberId - MemberId
 * @param accountEmail - Member Email
 */
class AccordionTabs {
	// Initializes AccordionTabs instance and fetches competition data
	constructor(webflowMemberId, accountEmail) {
		this.webflowMemberId = webflowMemberId;
		this.accountEmail = accountEmail;
		//this.renderCompetitionsData(); // renders data for each tab
		this.getCompetitionsData();

	}
	/**
	 *  Renders tabs for multiple competitions with notification support
	 * @param responseText - forms object provided by API
	 */
	viewTabs(responseText) {
		var tabsContainer = document.getElementById("tabs-container");
		tabsContainer.innerHTML = "";
		var tabs = creEl("ul", "tabs")
		var notificationDiv = creEl('div', 'notification_container', 'notification_container');
		var is_notification = true;
		var contentSection = creEl("div", "content-section");
		// if free student, show free resources
		if (responseText == "No data Found") {
			document.getElementById("free-resources").style.display = "block";
			return false;
			// else, show form accordion
		} else {
			document.getElementById("paid-resources").style.display = "block";
		}
		// responseText is array corresponding to all payments under familyID
		var is_single = (responseText.length > 1) ? false : true;
		responseText.forEach((formData, index) => {

			let currentIndex = index + 1;
			var activeLiClass = (currentIndex == 1 && is_single) ? "tab_li active_tab" : "tab_li";
			// if not single, instantiate tabs
			if (!is_single) {
				//Hide service paragraph - SK: what is the service paragraph? 
				document.getElementById("service-para").style.display = "none";
				var tabsE = creEl("li", activeLiClass, 'li-tab' + currentIndex);
				tabsE.innerHTML = formData.programDetail.programName + " " + formData.programDetail.debateEvent;
				tabsE.setAttribute("data-tab-id", 'tab' + currentIndex)
				tabs.appendChild(tabsE);
			}
			// if single, show single view
			var activeClass = (currentIndex == 1 && is_single) ? "active_tab" : "";
			var tabContent = creEl("div", "content " + activeClass, "tab" + currentIndex);
			var accordion = creEl("div", "accordion", "accordion-" + currentIndex)
			var program_dates = creEl("h4", "program_dates", "program_dates-" + currentIndex)
			var accordionFooter = creEl("div", "accordion-footer", "accordion-footer-" + currentIndex)
			tabContent.prepend(program_dates, accordionFooter, accordion)
			contentSection.appendChild(tabContent);

		})
		if (is_notification) {
			tabsContainer.prepend(notificationDiv, tabs, contentSection)
		} else {
			tabsContainer.prepend(tabs, contentSection)
		}
		this.getLiveCheckInData()
	}
	// Initializes tab functionality with click handlers for switching between tabs
	initiateTabs() {
		var d = document,
			tabs = d.querySelector('.tabs'),
			tab = d.querySelectorAll('.tab_li'),
			contents = d.querySelectorAll('.content');
		if (!tabs) {
			return false;
		}
		tabs.addEventListener('click', function (e) {
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

	// Fetches data from the specified URL endpoint
	async fetchData(url) {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error fetching data:', error);
			throw error;
		}
	}
	// Fetches competition data from API or localStorage and renders it
	async getCompetitionsData(){
		var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'block';
		var competitionLocalData =  localStorage.getItem("competitionData");
		var $this =this;
		if(competitionLocalData != undefined){
			var responseText = JSON.parse(competitionLocalData);
			$this.renderLocalCompetitionsData(responseText)
			spinner.style.display = 'none';
		}else {
			try {
				const data = await $this.fetchData("https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCompetitionDetails/" + $this.webflowMemberId);
				$this.renderLocalCompetitionsData(data)
				spinner.style.display = 'none';
				
			} catch (error) {
				console.error('Error fetching data:', error);
				throw error;
			}
		}
		const bgData = await $this.fetchData("https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCompetitionDetails/" + $this.webflowMemberId);
		localStorage.setItem("competitionData", JSON.stringify(bgData));
	}
	// Renders competition data from localStorage or API response
    renderLocalCompetitionsData(responseText){
		var $this = this;
		if (responseText.length > 0) {
			responseText = responseText.reverse();
			console.log('te', responseText)
		}
		$this.viewTabs(responseText);
		$this.initiateTabs();
		if (responseText == "No data Found") {
			return false;
		}

		responseText.forEach((formData, index) => {
			setTimeout(function () {
				console.log('formData.failedPayment', formData.failedPayment)
				if (formData.failedPayment == undefined) {
					let currentIndex = index + 1;
					new AccordionCompetition($this.webflowMemberId, formData, currentIndex, $this.accountEmail);
				}
			}, 30)
		})
	}
	// Fetches and renders multiple competitions data from API
	renderCompetitionsData() {
		var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'block';
		// calls api using webflow member ID
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCompetitionDetails/" + $this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function () {

			let responseText = JSON.parse(xhr.responseText);
			if (responseText.length > 0) {
				responseText = responseText.reverse();
				console.log('te', responseText)
			} else {
				spinner.style.display = 'none';
			}
			$this.viewTabs(responseText);
			$this.initiateTabs();
			if (responseText == "No data Found") {
				return false;
			}

			responseText.forEach((formData, index) => {
				setTimeout(function () {
					console.log('formData.failedPayment', formData.failedPayment)
					if (formData.failedPayment == undefined) {
						let currentIndex = index + 1;
						new AccordionCompetition($this.webflowMemberId, formData, currentIndex, $this.accountEmail);
					}
				}, 30)
			})
		}
	}
	// Displays live check-in notification messages for competitions in time range
	displayNotification(notification) {
		if (notification.length < 0) {
			return false;
		}
		var notificationDiv = document.getElementById('notification_container');
		notification.forEach(item => {
			if (item.inTimeRange) {
				let noText = creEl('span', 'noti_text');
				noText.innerHTML = 'Exciting news!  Self-check-in is live for  ' + item.programName + ', and points are up for grabs!';
				notificationDiv.appendChild(noText);

				var live_com_budge = document.getElementsByClassName("live_com_budge")[0];
				var blink = creEl('span', 'blink');
				live_com_budge.appendChild(blink)
			}
		})

	}
	
	// Fetches live check-in data from API and displays notifications
	async getLiveCheckInData() {
		try {
			const response = await fetch('https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/checkForLiveAttendanceTime/' + this.webflowMemberId);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data = await response.json();
			this.displayNotification(data)
			//return data;
		} catch (error) {
			console.error('Error fetching data:', error);
			throw error;
		}
	}
}

