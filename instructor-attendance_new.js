/*
Purpose: Instructor-facing check-in dashboard with filters, pagination, and session management controls.

Brief Logic: Fetches labs data from API and displays lab selection dropdown. Renders student list with filters, attendance tracking, and pagination. Handles real-time data refresh and attendance updates.

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
 * Class for handling instructor checkInForm form
 * @param webflowMemberId - memberId
 * @param messageData - instructor checkInForm data by API
 */
class checkInForm {
	$currentLab = {};
	$currentLabStudent = {};
	$incheckIn = false;
	$selected_labs = [];
	$selected_session = [];
	// Initializes the instructor check-in form with member ID and labs data
	constructor(webflowMemberId, labsData) {
		this.webflowMemberId = webflowMemberId;
		this.labsData = labsData;
		this.view();
	}
	// Creates a paginated list from items array with page and per_page parameters
	paginatorList(items, page, per_page) {

		//Alphabetical order sorting
		items.sort(function (a, b) {
			if (a.studentname < b.studentname) {
				return -1;
			}
			if (a.studentname > b.studentname) {
				return 1;
			}
			return 0;
		});

		var page = page || 1,
			per_page = per_page || 100,
			offset = (page - 1) * per_page,

			paginatedItems = items.slice(offset).slice(0, per_page),
			total_pages = Math.ceil(items.length / per_page);
		return {
			page: page,
			per_page: per_page,
			pre_page: page - 1 ? page - 1 : null,
			next_page: (total_pages > page) ? page + 1 : null,
			total: items.length,
			total_pages: total_pages,
			data: paginatedItems
		};
	}
	// Resets all filter select boxes to empty values
	resetFilter() {
		var studentData = this.$currentLab.studentData;

		var insCheckinFilter = document.getElementById("ins-checkin-filter");

		var studentCheckinFilter = document.getElementById("student-checkin-filter");
		if (studentData) {
			studentData.value = "";
		}
		insCheckinFilter.value = "";
		studentCheckinFilter.value = "";



	}
	// Creates and returns a DOM element for the instructor check-in filter dropdown
	createInstructorCheckInFilter() {
		var $this = this;
		var col = creEl("div", 'col');
		var label = creEl("label", 'form-field-label')
		label.innerHTML = "Instructor";
		col.appendChild(label)

		var dateFilter = creEl('select', 'ins-checkin-filter w-select', 'ins-checkin-filter');
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select";
		dateFilter.appendChild(defaultoption);
		//Newest
		var newestoption = creEl("option");
		newestoption.value = "true";
		newestoption.text = "CheckedIn";
		dateFilter.appendChild(newestoption);
		//oldest
		var oldestoption = creEl("option");
		oldestoption.value = "false";
		oldestoption.text = "Not Checked In";
		dateFilter.appendChild(oldestoption);
		col.appendChild(dateFilter)
		dateFilter.addEventListener('change', function () {
			$this.filterstudentData('type', this.value);
		})
		return col;
	}
	// Creates and returns a DOM element for the student check-in filter dropdown
	createStudentCheckInFilter() {
		var $this = this;
		var col = creEl("div", 'col');
		var label = creEl("label", 'form-field-label')
		label.innerHTML = "Student";
		col.appendChild(label)

		var dateFilter = creEl('select', 'student-checkin-filter w-select', 'student-checkin-filter');
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select";
		dateFilter.appendChild(defaultoption);
		//Newest
		var newestoption = creEl("option");
		newestoption.value = "true";
		newestoption.text = "CheckedIn";
		dateFilter.appendChild(newestoption);
		//oldest
		var oldestoption = creEl("option");
		oldestoption.value = "false";
		oldestoption.text = "Not Checked In";
		dateFilter.appendChild(oldestoption);
		col.appendChild(dateFilter)
		dateFilter.addEventListener('change', function () {
			$this.filterstudentData('type', this.value);
		})
		return col;
	}
	// Creates and returns a DOM element for the search filter input
	createSearchFilter() {
		var $this = this;
		var col = creEl("div", 'col');

		var label = creEl("label", 'form-field-label')
		label.innerHTML = "Search";
		col.appendChild(label)


		var searchFilter = creEl('input', 'search-filter form-text-label w-input', 'search-filter')
		searchFilter.name = 'messageSearch';
		searchFilter.placeholder = "Student";
		/*Event for search*/
		searchFilter.addEventListener('keypress', function (event) {
			if (event.key === "Enter") {
				$this.filterstudentData('type', this.value);
			}
		})

		col.appendChild(searchFilter)
		return col;
	}
	// Creates and returns the attendance filter header with all filter elements
	makeAttendanceFilter() {
		//var attendanceFilter = document.getElementById("attendance-filter");
		/*Filter*/
		var attendanceHeader = creEl('div', 'attendance-header w-layout-grid grid-3', 'attendance-header')
		var instructorFilter = this.createInstructorCheckInFilter();
		var studentFilter = this.createStudentCheckInFilter();
		var searchFilter = this.createSearchFilter();
		attendanceHeader.appendChild(instructorFilter);
		attendanceHeader.appendChild(studentFilter);
		attendanceHeader.appendChild(searchFilter);
		//attendanceFilter.appendChild(attendanceHeader);
		return attendanceHeader;
	}
	// Filters student data based on currently selected filter values
	filterstudentData() {
		//this.studentData = this.filterData;
		console.log('this.$currentLab', this.$currentLab)
		var studentData = this.$currentLab.studentData;
		var currentLab = this.$currentLab;
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		var insCheckinFilter = document.getElementById("ins-checkin-filter");

		var studentCheckinFilter = document.getElementById("student-checkin-filter");

		var searchFilter = document.getElementById("search-filter");
		if (insCheckinFilter.value) {
			studentData = studentData.filter(item => {
				let status = item.instructorCheckin;
				return (status.toString() == insCheckinFilter.value)

			})
		}
		if (studentCheckinFilter.value) {
			studentData = studentData.filter(item => {

				let status = item.selfCheckin
				return (status.toString() == studentCheckinFilter.value)

			})
		}
		if (searchFilter.value) {
			var search = searchFilter.value;
			var condition = new RegExp(search, 'i');
			studentData = studentData.filter(function (el) {
				return condition.test(el.studentname);
			});
		}
		this.$currentLab = studentData;
		this.$currentLabStudent = this.paginatorList(studentData)
		this.refreshData();
	}
	// Creates and returns a column DOM element with specified width
	createCol(message, col_width) {
		var col_width = (col_width) ? col_width : 3;
		var col = creEl("div", 'w-col w-col-' + col_width);
		if (message != '') {
			col.innerHTML = message;
		}
		return col;
	}
	// Returns an image element for checked or unchecked status icon
	getCheckedIcon(status) {
		var img = creEl('img', 'is_read_icon')
		if (status) {
			var src = "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642a83485b6551a71e5b7e12_dd-check.png";
		} else {
			var src = "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642a834899a0eb5204d6dafd_dd-cross.png";
		}
		img.src = src;
		return img
	}
	// Displays the instructor attendance check-in form with session and lab selection
	view() {
		var accordionDiv = document.getElementById("instructor-attendance");
		var row = creEl('div', 'w-row ');

		var col = creEl("div", 'w-col-12 checkin-row');
		// Get session data and append in html
		var labData = this.get_session();
		col.appendChild(labData)

		// create dom element for lab list. it will display based on selection of session
		var sessionFilter = creEl('div', 'sessionFilter', 'sessionFilter')
		col.appendChild(sessionFilter)

		var studentListFilter = creEl("div", 'student-list-filter', 'student-list-filter');
		var filter = this.makeAttendanceFilter();
		studentListFilter.appendChild(filter);
		col.appendChild(studentListFilter)

		var head = this.createAttendanceTitle();
		col.appendChild(head)



		var studentlist = creEl("div", 'student-list', 'student-list');
		col.appendChild(studentlist)

		var noRecord = creEl('p', 'no-record', 'no-record');
		noRecord.innerHTML = 'No record found';
		col.appendChild(noRecord)

		var pagination = creEl("div", "pagination-student-list", 'pagination-student-list')
		col.appendChild(pagination)

		row.appendChild(col)
		accordionDiv.appendChild(row);
	}
	// Creates and returns a session selection dropdown element
	get_session() {

		var $this = this;
		var labs = this.labsData;
		var select = creEl('div', 'select')
		var sessionSelectBox = creEl('select', 'select-labs', 'select-labs')
		/*Added by default first lab and removed select labs option*/
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select Session";
		sessionSelectBox.appendChild(defaultoption);
		labs.forEach(item => {
			if (item.session.sessionId) {
				var option = creEl("option");
				option.value = item.session.sessionId;
				option.text = item.session.sessionName;
				sessionSelectBox.appendChild(option);
			}
		})
		sessionSelectBox.addEventListener('change', function () {
			var selected_labs = labs.find(item => item.session.sessionId == this.value);
			$this.$selected_labs = (selected_labs != undefined) ? selected_labs.lab : [];
			$this.$selected_session = selected_labs;

			$this.get_Labs();
			//$this.displayStudentList(this.value, 'init');
			$this.resetFilter();
			if (!this.value) {
				$this.hideShowUI();
			}
			$this.hideStudentListList();
		})

		select.appendChild(sessionSelectBox)
		return select;
	}
	// Hides student list and pagination when no lab is selected
	hideStudentListList() {
		var studentList = document.getElementById('student-list');
		var studentListFilter = document.getElementsByClassName('student-list-filter')[0];
		var paginationStudentList = document.getElementsByClassName('pagination-student-list')[0];
		var btn = document.getElementsByClassName('student-list-head')[0];
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		console.log('timeZoneSelect', timeZoneSelect.value)
		if (!timeZoneSelect.value) {
			studentList.style.display = 'none';
			studentListFilter.style.display = 'none';
			paginationStudentList.style.display = 'none';
			btn.style.display = 'none';
		}
	}
	// Hides student list and pagination when session or lab selection is empty
	hideShowUI() {
		var studentlist = document.getElementById('student-list');
		var btn = document.getElementsByClassName('student-list-head')[0];
		var studentListFilter = document.getElementsByClassName('student-list-filter')[0];
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		var _timeZoneSelect = document.getElementsByClassName('select_timezones')[0];
		var selectLabs = document.getElementsByClassName('select-labs')[0];
		var paginationStudentList = document.getElementsByClassName('pagination-student-list')[0];
		if (timeZoneSelect.value == '' || selectLabs.value == '') {
			_timeZoneSelect.style.display = 'none';
			btn.style.display = 'none';
			studentlist.style.display = 'none';
			studentListFilter.style.display = 'none';
			paginationStudentList.style.display = 'none';
		}
	}
	// Creates and returns a lab selection dropdown element based on selected session
	get_Labs() {
		var $this = this;
		// Get all labs data
		var timezones = this.$selected_labs;
		var sessionFilter = document.getElementById('sessionFilter');
		sessionFilter.innerHTML = '';
		var select = creEl('div', 'select select_timezones')
		var sessionSelectBox = creEl('select', 'select-timezones', 'select-timezone')
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select Lab";
		sessionSelectBox.appendChild(defaultoption);
		timezones.forEach(item => {
			var option = creEl("option");
			option.value = item.labId;
			option.text = item.labName;
			sessionSelectBox.appendChild(option);
		})

		sessionSelectBox.addEventListener('change', function () {
			//var sessionSelectBox = document.getElementById('select-labs');
			$this.displayStudentList(this.value, 'init');
			$this.resetFilter();
		})
		select.appendChild(sessionSelectBox)
		sessionFilter.appendChild(select)
	}
	// Creates and returns the attendance list header row with column titles
	createAttendanceTitle() {
		var title = ['Student Name', 'Student Self Check-In', 'Instructor Check-In']
		//var title = ['Student Name', 'Check-in']
		var row = creEl('div', 'w-row student-list-head', 'student-list-head')
		title.forEach(item => {
			var col_width = 3
			if (item == 'Student Name') {
				col_width = 6
			} else {
				col_width = 3;
			}
			var col = this.createCol(item, col_width);
			row.appendChild(col);
		})
		return row;
	}
	// Displays the student list with attendance status for the selected lab
	displayStudentList(labId, type = '') {



		var studentlist = document.getElementById('student-list');
		studentlist.innerHTML = "";
		var $this = this;

		var selectLabs = document.getElementsByClassName('select-labs')[0];

		var timeZoneDisplay = 'block';
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		console.log('labId, timeZoneSelect', labId, timeZoneSelect.value)
		var display = (labId && timeZoneSelect.value) ? 'block' : 'none';

		var btn = document.getElementsByClassName('student-list-head')[0];
		btn.style.display = display;
		//btn.style.transition = 'all 2s';

		var studentListFilter = document.getElementsByClassName('student-list-filter')[0];
		studentListFilter.style.display = display;
		//studentListFilter.style.transition = 'all 2s';

		studentlist.style.display = display;
		//studentlist.style.transition = 'all 2s';

		var paginationStudentList = document.getElementsByClassName('pagination-student-list')[0];
		paginationStudentList.style.display = display;
		if (!labId) {
			return;
		}
		console.log('this.$selected_labs', this.$selected_labs, labId)
		var currentLab = this.$selected_labs.find(item => item.labId == labId);
		console.log('currentLab', currentLab)
		if (type == 'init') {
			var currentLabStudent = this.paginatorList(currentLab.studentData)
		} else {
			var currentLabStudent = this.$currentLabStudent
		}
		this.$currentLab = currentLab;
		this.$currentLabStudent = currentLabStudent;

		currentLabStudent.data.forEach((item, index) => {
			var row = creEl('div', 'w-row')

			var col_1 = this.createCol(item.studentname, 6);
			row.appendChild(col_1);

			var col_2 = this.createCol('', 3);
			var icon = $this.getCheckedIcon(item.selfCheckin);
			col_2.appendChild(icon);

			row.appendChild(col_2);
			studentlist.appendChild(row)

			var col_3 = this.createCol('', 3);
			var icon = $this.getCheckedIcon(item.instructorCheckin);
			//console.log('item.attendanceId', item.attendanceId)
			icon.addEventListener('click', function () {
				//var message = (selectInsTimezone && selectInsTimezone.checkedIn) ? "Are you sure want to uncheck-in" : "Are you sure want to check-in";
				icon.src = "https://cdn.jsdelivr.net/gh/sk1840939/nsd@044393b/loading.gif";
				var insCheckedIn = item.instructorCheckin;
				var attendanceId = (item.attendanceId) ? item.attendanceId : '';
				var sCheckedIn = item.selfCheckin;
				if (item.instructorCheckin) {

					if (confirm("Are you sure want to uncheck-in") == true) {
						$this.updateAttendanceData(item.studentemail, insCheckedIn, attendanceId, sCheckedIn, selectLabs.value, item.submissionId);
					}
				} else {
					$this.updateAttendanceData(item.studentemail, insCheckedIn, attendanceId, sCheckedIn, selectLabs.value, item.submissionId);
				}


			})
			col_3.appendChild(icon);



			row.appendChild(col_3);
			studentlist.appendChild(row)
		})

		var noRecord = document.getElementById('no-record');
		if (currentLabStudent.data.length > 0) {
			noRecord.style.display = 'none';
		} else {
			noRecord.style.display = 'block';
		}
		//Pagination
		var paginationStuList = document.getElementById('pagination-student-list');
		paginationStuList.innerHTML = "";
		var pagination = this.createPagination();
		paginationStuList.appendChild(pagination);

		//return studentlist;
	}
	// Updates attendance data by calling the check-in API
	updateAttendanceData(studentId, isInstructorCheckin, attendanceId, isSelfCheckin, timezoneId, submissionId) {
		this.callCheckedInApi(studentId, isInstructorCheckin, attendanceId, isSelfCheckin, timezoneId, submissionId);

	}
	// Returns an image element for the check-in icon
	getCheckInIcon() {
		var img = creEl('img', 'checkedInIcon')
		img.src = 'https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/6437ec2c6bc4131717b36b93_checkin.svg';
		return img
	}
	// Makes an API call to update student attendance check-in status
	callCheckedInApi(studentId, isInstructorCheckin, attendanceId, isSelfCheckin, timezoneId, submissionId) {
		var currentLab = this.$currentLab;
		console.log('currentLab', currentLab)
		var data = {
			"labId": currentLab.labId,
			//"isSelfCheckin": isSelfCheckin,
			"emailId": studentId,
			"submissionId": submissionId,
			"isInstructorCheckin": !isInstructorCheckin,
			"instructorMemberId": this.webflowMemberId,
			"timezoneId": timezoneId
		}
		if (attendanceId) {
			data.attendanceId = attendanceId;
		}
		//   console.log('data', data)
		//   return;
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/addStudentAttendance/", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function () {
			let responseText = JSON.parse(xhr.responseText);
			//console.log('responseText', responseText)
			//$this.updateCurrentData();
			$this.getUpdatedLabsData(currentLab.labId)
		}

	}

	// Creates and returns pagination controls for navigating student list pages
	createPagination() {
		var $this = this;
		var pagination = creEl('div', 'w-pagination-wrapper', 'notification-body');
		/*Previous Button*/
		//console.log('this.$currentLabStudent', this.$currentLabStudent)
		if (this.$currentLabStudent.pre_page != null) {
			var preBtn = creEl('a', 'w-pagination-previous');
			preBtn.innerHTML = '< Previous';
			preBtn.addEventListener('click', function () {
				$this.$currentLabStudent = $this.paginatorList($this.$currentLab.studentData, $this.$currentLabStudent.pre_page);
				$this.refreshData();
			})
			pagination.appendChild(preBtn);
		}
		/*Next Button*/
		if (this.$currentLabStudent.next_page != null) {
			var nextBtn = creEl('a', 'w-pagination-next');
			nextBtn.innerHTML = 'Next >';
			nextBtn.addEventListener('click', function () {
				$this.$currentLabStudent = $this.paginatorList($this.$currentLab.studentData, $this.$currentLabStudent.next_page);
				$this.refreshData();
			})
			pagination.appendChild(nextBtn);
		}

		return pagination;
	}
	// Refreshes the student list display with current filtered and paginated data
	refreshData() {
		var studentlist = document.getElementById('student-list');
		var paginationStuList = document.getElementById('pagination-student-list');
		studentlist.innerHTML = "";
		paginationStuList.innerHTML = "";
		var sessionSelectBox = document.getElementById('select-timezone');
		this.displayStudentList(sessionSelectBox.value);
	}
	// Fetches updated labs data from API and refreshes the student list
	getUpdatedLabsData(labId) {
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getAttendanceDetailsByMemberId/" + $this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function () {
			let responseText = JSON.parse(xhr.responseText);

			$this.labsData = responseText;
			var selectedLabs = $this.$selected_session;
			var selected_labs = responseText.find(item => item.session.sessionId == selectedLabs.session.sessionId);
			selected_labs = (selected_labs != undefined) ? selected_labs.lab : [];
			console.log('selected_labs', selected_labs)
			var currentLab = selected_labs.find(item => item.labId == labId);
			$this.$selected_labs = selected_labs;
			$this.$currentLab = currentLab
			$this.$currentLabStudent = $this.paginatorList(currentLab.studentData, $this.$currentLabStudent.page);
			$this.refreshData();
		}
	}
}
/**
 * Class for Handling API for Labs Data and display instructor check-in forms
 * @param webflowMemberId - MemberId
 */
class LabsData {
	$isLoading = true;
	$studentData = '';
	// Initializes LabsData instance and fetches labs data from API
	constructor(webflowMemberId) {
		this.webflowMemberId = webflowMemberId;
		this.getLabsData();
	}
	// Fetches labs and session data from API and creates the instructor check-in form
	getLabsData() {
		var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'block';
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getAttendanceDetailsByMemberId/" + $this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function () {
			let responseText = JSON.parse(xhr.responseText);
			new checkInForm($this.webflowMemberId, responseText);
			spinner.style.display = 'none';
		}
		xhr.onerror = function () { // only triggers if the request couldn't be made at all
			spinner.style.display = 'none';
		};
	}
}
