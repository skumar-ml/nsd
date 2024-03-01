/**
 * 	
 * @param name - HTML element name
 * @param className - HTML element class attribute
 * @param idName - HTML element id attribute
 */
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
 * Class for handling student self CheckIn
 * @param webflowMemberId - memberId
 * @param labsData - labs data by API
 */
class selfCheckInForm {
	$currentLab = {};
	$selected_labs = [];
	constructor(webflowMemberId, labsData) {
		this.webflowMemberId = webflowMemberId;
		this.labsData = labsData;
		this.view();
	}
	/*Display Self check-in form*/
	view() {
		// Get Parent Div
		var accordionDiv = document.getElementById("attendanceSelfCheckIn");
		// Create parent row div
		var row = creEl('div', 'w-row ');

		var col = creEl("div", 'w-col-12 checkin-row');
		// Get session data and append in html
		var labData = this.get_session();
		col.appendChild(labData)

		// create dom element for lab list. it will display based on selection of session  
		var sessionFilter = creEl('div', 'sessionFilter', 'sessionFilter')
		col.appendChild(sessionFilter)

		// Get Self check-in button
		var checkInBtn = this.getCheckInBtn();
		col.appendChild(checkInBtn)

		row.appendChild(col)
		accordionDiv.appendChild(row);
	}
	// Create session select box html element 
	get_session() {
		var $this = this;
		// Get all labs data
		var labs = this.labsData;
		// Create select element for session list
		var select = creEl('div', 'select')
		var labsSelectBox = creEl('select', 'select-labs', 'select-labs')
		var defaultOption = creEl("option");
		defaultOption.value = "";
		defaultOption.text = "Select session to check in";
		labsSelectBox.appendChild(defaultOption);
		labs.forEach(item => {
			if (item.session.sessionId) {
				var option = creEl("option");
				option.value = item.session.sessionId;
				option.text = (item.session.sessionId == '111') ? item.session.sessionName + ' (Morning, Evening Check-in)' : item.session.sessionName;
				labsSelectBox.appendChild(option);
			}
		})
		// Add event when student select session and display labs
		labsSelectBox.addEventListener('change', function () {
			var selected_labs = labs.find(item => item.session.sessionId == this.value);
			$this.$selected_labs = (selected_labs != undefined) ? selected_labs.lab : [];
			$this.get_Labs(this.value);
			if (!this.value) {
				$this.hideShowUI();
			}
			$this.hideLabAndBtn()

		})

		select.appendChild(labsSelectBox)
		return select;
	}
	// Hide check-in button when lab is empty  
	hideLabAndBtn() {
		var labListSelect = document.getElementsByClassName('select-timezones')[0];
		var btn = document.getElementsByClassName('check-in-btn')[0];
		if (!labListSelect.value) {
			btn.style.display = 'none';
		}
	}
	// Hide lab list and check-in button when lab list or session is empty
	hideShowUI() {
		var labListSelect = document.getElementsByClassName('select-timezones')[0];
		var _labListSelect = document.getElementsByClassName('select_timezones')[0];
		var selectSessions = document.getElementById('select-labs');
		var btn = document.getElementsByClassName('check-in-btn')[0];
		console.log('Hide and Show', labListSelect.value, selectSessions.value)

		if (labListSelect.value == '' || selectSessions.value == '') {
			labListSelect.disabled = true;
			btn.disabled = true;
			btn.style.display = 'none';
			_labListSelect.style.display = 'none';
		}

	}
	// Create labs select box html element 
	get_Labs() {
		var $this = this;
		// Get all labs data
		var labs = this.$selected_labs;

		var sessionFilter = document.getElementById('sessionFilter');
		sessionFilter.innerHTML = '';
		var select = creEl('div', 'select select_timezones')
		var sessionSelectBox = creEl('select', 'select-timezones', 'select-labs')

		//default option
		var defaultOption = creEl("option");
		defaultOption.value = "";
		defaultOption.text = "Select activity to check in";
		sessionSelectBox.appendChild(defaultOption);

		labs.forEach(item => {
			var option = creEl("option");
			option.value = item.labId;
			option.text = item.labName;
			sessionSelectBox.appendChild(option);
		})

		sessionSelectBox.addEventListener('change', function () {
			$this.displayCheckInBtn(this.value);
		})
		select.appendChild(sessionSelectBox)
		sessionFilter.appendChild(select)
	}
	// Create default checked button html element
	getCheckInBtn() {
		var $this = this;
		var checkInBtn = creEl('button', 'main-button red w-button check-in-btn', 'check-in-btn');
		checkInBtn.innerHTML = 'Self Check In';
		checkInBtn.addEventListener('click', function () {
			$this.callCheckedInApi();
		})
		return checkInBtn;
	}
	// Display checked in button on lab change
	displayCheckInBtn(labId) {

		var currentLab = this.$selected_labs.find(item => item.labId == labId);
		this.$currentLab = currentLab;

		var labListSelect = document.getElementsByClassName('select-timezones')[0];



		var display = (labId && labListSelect.value) ? 'block' : 'none';
		var btn = document.getElementsByClassName('check-in-btn')[0];
		btn.style.display = display;
		btn.disabled = (display == 'none') ? true : false;

		if (!labId) {
			return;
		}

		if (labId && currentLab.checkedIn) {
			console.log('already checked in')
			let checkInIcon = this.getCheckInIcon();
			btn.classList.add('already-checkedin');
			btn.innerHTML = 'Already Checked In';
			btn.prepend(checkInIcon)
		} else {
			btn.classList.remove('already-checkedin');
			btn.innerHTML = 'Self Check In';
		}

	}
	// get checkin tick icon
	getCheckInIcon() {
		var img = creEl('img', 'checkedInIcon')
		img.src = 'https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/647062754a2e7d5b5208c785_square-check-red.svg';
		return img
	}
	// API call for daily checked in
	callCheckedInApi() {
		var currentLab = this.$currentLab;
		console.log('currentLab', currentLab)


		var checkInBtn = document.getElementById('check-in-btn');
		checkInBtn.innerHTML = 'Processing....';
		var labListSelect = document.getElementById('select-labs');
		var data = {
			"labId": currentLab.labId,
			"isSelfCheckin": true,
			"memberId": this.webflowMemberId,
			"timezoneId": (labListSelect.value != '111') ? labListSelect.value : null
		}

		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/addStudentAttendance", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function () {
			let responseText = JSON.parse(xhr.responseText);
			let checkInIcon = $this.getCheckInIcon();
			checkInBtn.classList.add('already-checkedin');
			checkInBtn.innerHTML = 'Checked In Successfully';
			checkInBtn.prepend(checkInIcon)
			$this.updateCurrentData();
			$this.updatedCompetitionLocalData();
		}

	}
	// After checked in update local data
	updateCurrentData() {
		var labsSelectBox = document.getElementById('select-labs');
		var labListSelect = document.getElementsByClassName('select-timezones')[0];
		console.log('labsSelectBox.value', labsSelectBox.value)
		var labsData = this.labsData;
		labsData.map(item => {
			if (item.session.sessionId == labsSelectBox.value) {
				item.lab.map(labData => {
					if (labData.labId == labListSelect.value) {
						labData.checkedIn = true
					}
				})
			}
			return item;
		})
		this.labsData = labsData;
	}
	// Get API data with the help of endpoint
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
	//Update competition local data
	async updatedCompetitionLocalData(){
		const bgData = await this.fetchData("https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCompetitionDetails/" + $this.webflowMemberId);
		localStorage.setItem("competitionData", JSON.stringify(bgData));
	}
}
/**
 * Class for Handling API for LabsData and create a check in forms
 * @param webflowMemberId - MemberId
 */
class LabsData {
	$isLoading = true;
	$messageData = '';
	constructor(webflowMemberId) {
		this.webflowMemberId = webflowMemberId;
		this.getSessionLabsData();
	}
	// Get all session and lab data and create a check in for student
	getSessionLabsData() {
		var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'block';
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getAttendanceDetailsByMemberId/" + $this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function () {
			let responseText = JSON.parse(xhr.responseText);
			new selfCheckInForm($this.webflowMemberId, responseText);
			spinner.style.display = 'none';
		}
		xhr.onerror = function () { // only triggers if the request couldn't be made at all
			spinner.style.display = 'none';
		};
	}
}
