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

class selfCheckInForm {
	$currentLab = {};
	$currentLabStudent = {};
	constructor(webflowMemberId, labsData){
		this.webflowMemberId = webflowMemberId;
		this.labsData = labsData.labs;
		this.view();
	}
	/*Creating pagination array object*/
	paginatorList(items, page, per_page) {
		var page = page || 1,
		per_page = per_page || 5,
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
	/* Creating the DOM element for date filter like new and old */
	createInstructorCheckInFilter(){
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
	/* Creating the DOM element for date filter like new and old */
	createStudentCheckInFilter(){
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
	/* Creating dom element for search filter*/
	createSearchFilter(){
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
	/* Creating dom element for filter header */
	makeAttendanceFilter(){
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
	/*Filter api response based on current seleted filter value*/
	filterstudentData(){
		//this.studentData = this.filterData;
		var studentData = this.$currentLab.student;
		
		var insCheckinFilter = document.getElementById("ins-checkin-filter");
		
		var studentCheckinFilter = document.getElementById("student-checkin-filter");
		
		var searchFilter = document.getElementById("search-filter");
		console.log('studentData', studentData)
		console.log('insCheckinFilter.value', insCheckinFilter.value)
		if(insCheckinFilter.value){
			console.log('insCheckinFilter sss')
			studentData = studentData.filter(item => item.isICheckedIn.toString() == insCheckinFilter.value)
		}
		if(studentCheckinFilter.value){
			studentData = studentData.filter(item => item.isCheckedIn.toString() == studentCheckinFilter.value)
		}
		
		if(searchFilter.value){
			var search = searchFilter.value;
			var condition = new RegExp(search, 'i');
			studentData = studentData.filter(function (el) {
			  return condition.test(el.name);
			});
		}
		console.log('studentData', studentData)
		this.$currentLab = studentData;
		this.$currentLabStudent = this.paginatorList(studentData)
		this.refreshData();
	}
	/* Creating dom element for column based on column width*/
	createCol(message, col_width){
		var col_width = (col_width) ? col_width : 3;
		var col = creEl("div", 'w-col w-col-'+col_width);
		if(message != ''){
			col.innerHTML= message;
		}
		return col;
	}
	/*Creating Read and unread icon for list page*/
	getCheckedIcon(status){
		var img = creEl('img', 'is_read_icon')
		if(status){
			var src = "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642a83485b6551a71e5b7e12_dd-check.png";
		}else{
			var src = "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642a834899a0eb5204d6dafd_dd-cross.png";
		}
		img.src = src;
		return img
	}
	view(){
		var accordionDiv = document.getElementById("instructor-attendance");
		var row = creEl('div', 'w-row ');
		
		var col = creEl("div", 'w-col-12 checkin-row');
		var labData = this.getLabs();
		col.appendChild(labData)
		
		var studentlistfilter = creEl("div", 'student-list-filter', 'student-list-filter');
		var filter = this.makeAttendanceFilter();
		studentlistfilter.appendChild(filter);
		col.appendChild(studentlistfilter)
		
		var head = this.createAttendanceTitle();
		col.appendChild(head)
		
		
		
		var studentlist = creEl("div", 'student-list', 'student-list');
		col.appendChild(studentlist)
		
		var pagination = creEl("div", "pagination-student-list", 'pagination-student-list')
		col.appendChild(pagination)
		
		row.appendChild(col)
		accordionDiv.appendChild(row);
	}
	getLabs(){
		
		var $this = this;
		var labs = this.labsData;
		var labsSelectBox = creEl('select', 'select-labs w-select', 'select-labs')
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select Labs";
		labsSelectBox.appendChild(defaultoption);
		labs.forEach(item => {
			var option = creEl("option");
				option.value = item.id;
				option.text = item.name;
				labsSelectBox.appendChild(option);
		})
		
		labsSelectBox.addEventListener('change', function () {
			$this.displayStudentList(this.value, 'init');
		})
		
		return labsSelectBox;
	}
	/*Creating dom element message list header*/
	createAttendanceTitle(){
		var title = ['Student Name', 'Student', 'Instructor']
		var row = creEl('div', 'w-row student-list-head', 'student-list-head')
		title.forEach(item=> {
			var col_width = 3
			if(item == 'Student Name'){
				col_width = 6
			}else{
				col_width = 3;
			}
			var col = this.createCol(item, col_width);
			row.appendChild(col);
		})
		return row;
	}
	displayStudentList(labId, type=''){
		
		var opacity = (labId) ? 1 : 0;
		
		var btn = document.getElementsByClassName('student-list-head')[0];
		btn.style.opacity = opacity;
		btn.style.transition = 'all 2s';
		
		var studentlistfilter = document.getElementsByClassName('student-list-filter')[0];
		studentlistfilter.style.opacity = opacity;
		studentlistfilter.style.transition = 'all 2s';
		
		var studentlist = document.getElementById('student-list');
		studentlist.innerHTML = "";
		var $this = this;
		var currentLab = this.labsData.find(item => item.id == labId);
		if(type == 'init'){
			var currentLabStudent = this.paginatorList(currentLab.student)
		}else{
			var currentLabStudent = this.$currentLabStudent
		}
		this.$currentLab = currentLab;
		this.$currentLabStudent = currentLabStudent;
		currentLabStudent.data.forEach((item, index) => {
			var row = creEl('div', 'w-row')
			
			var col_1 = this.createCol(item.name,6);
			row.appendChild(col_1);
			
			
			var col_2 = this.createCol('', 3);
			var icon = $this.getCheckedIcon(item.isCheckedIn);
			col_2.appendChild(icon);
			
			row.appendChild(col_2);
			studentlist.appendChild(row)
			
			var col_3 = this.createCol('', 3);
			var icon = $this.getCheckedIcon(item.isICheckedIn);
			icon.addEventListener('click', function(){
				if (confirm("Are you sure want to check-in") == true) {
					$this.updateAttendanceData(item.id);
					icon.src="https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642a83485b6551a71e5b7e12_dd-check.png";
				}
				
			})
			col_3.appendChild(icon);
			
			
			
			row.appendChild(col_3);
			studentlist.appendChild(row)
		})
		
		//Pagination
		var paginationStuList = document.getElementById('pagination-student-list');
		paginationStuList.innerHTML = "";
		var pagination = this.createPagination();
		paginationStuList.appendChild(pagination);
		
		//return studentlist;
	}
	updateAttendanceData(studentId){
		var labsData = this.labsData;
		var currentLab = this.$currentLab;
		//currentLab.map(item =>{
				currentLab.student.map(sItem => {
					if(sItem.id == studentId){
						sItem.isICheckedIn = true;
					}
					return sItem;
				})
		//})
		console.log('currentLab', currentLab)
		this.$currentLab = currentLab
		this.$currentLabStudent = this.paginatorList(currentLab.student);
	}
	getCheckInIcon(){
		var img = creEl('img', 'checkedInIcon')
		img.src = 'https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/6437ec2c6bc4131717b36b93_checkin.svg';
		return img
	}
	callCheckedInApi(){
		var currentLab = this.$currentLab;
		console.log('currentLab', currentLab)
		if(!currentLab.isCheckedIn){
			var checkInBtn = document.getElementById('check-in-btn');
			checkInBtn.innerHTML = 'Processing....';
			
			var xhr = new XMLHttpRequest()
			var $this = this;
			xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getNotifications/"+$this.webflowMemberId, true)
			xhr.withCredentials = false
			xhr.send()
			xhr.onload = function() {
				let responseText =  JSON.parse(xhr.responseText);
				let checkInIcon = $this.getCheckInIcon();
				checkInBtn.innerHTML = 'CheckedIn';
				checkInBtn.prepend(checkInIcon)
				$this.updateCurrentData();
			}
		}else{
			alert("You have already checkin for this lab");
		}
	}
	updateCurrentData(){
		var labsSelectBox = document.getElementById('select-labs');
		console.log('labsSelectBox.value', labsSelectBox.value)
		var labsData = this.labsData;
		labsData.map(item => {
			if(item.id == labsSelectBox.value){
				item.isCheckedIn = true;
			}
			return item;
		})
		this.labsData = labsData;
	}
	/* Creating dom element pagination */
	createPagination(){
		var $this = this;
		var pagination = creEl('div', 'w-pagination-wrapper', 'notification-body');
		/*Previous Button*/
		console.log('this.$currentLabStudent', this.$currentLabStudent)
		if(this.$currentLabStudent.pre_page != null){
			var preBtn = creEl('a', 'w-pagination-previous');
			preBtn.innerHTML = '< Previous';
			preBtn.addEventListener('click', function () {
				$this.$currentLabStudent = $this.paginatorList($this.$currentLab.student, $this.$currentLabStudent.pre_page);
				$this.refreshData();
			})
			pagination.appendChild(preBtn);
		}
		/*Next Button*/
		if(this.$currentLabStudent.next_page != null){
			var nextBtn = creEl('a', 'w-pagination-next');
			nextBtn.innerHTML = 'Next >';
			nextBtn.addEventListener('click', function () {
				$this.$currentLabStudent = $this.paginatorList($this.$currentLab.student, $this.$currentLabStudent.next_page);
				$this.refreshData();
			})
			pagination.appendChild(nextBtn);
		}
		
		return pagination;
	}
	refreshData(){
		var studentlist = document.getElementById('student-list');
		var paginationStuList = document.getElementById('pagination-student-list');
		studentlist.innerHTML = "";
		paginationStuList.innerHTML = "";
		var labsSelectBox = document.getElementById('select-labs');
		this.displayStudentList(labsSelectBox.value);
	}
}
class LabsData {
	$isLoading = true;
	$studentData = '';
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getLabsData();
	}
	getLabsData(){
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getNotifications/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			//let responseText =  JSON.parse(xhr.responseText);
			let responseText =  JSON.parse('{"labs":[{"name":"Lab 1","id":"97427492749274927342","student":[{"name":"Yogesh Yadav","id":"1","isCheckedIn":true,"isICheckedIn":false},{"name":"Dev Narayan","id":"2","isCheckedIn":false,"isICheckedIn":false},{"name":"Rahul","id":"2","isCheckedIn":false,"isICheckedIn":false},{"name":"Aryan","id":"3","isCheckedIn":true,"isICheckedIn":false},{"name":"Drishti","id":"4","isCheckedIn":false,"isICheckedIn":false},{"name":"Abha","id":"5","isCheckedIn":false,"isICheckedIn":false},{"name":"shiv","id":"6","isCheckedIn":true,"isICheckedIn":false},{"name":"ajay","id":"7","isCheckedIn":false,"isICheckedIn":false},{"name":"ram","id":"8","isCheckedIn":false,"isICheckedIn":false}]},{"name":"Lab 2","id":"97427492749274927333","student":[{"name":"aryan","id":"9","isCheckedIn":false,"isICheckedIn":false},{"name":"devendra","id":"10","isCheckedIn":true,"isICheckedIn":false},{"name":"Shubham","id":"11","isCheckedIn":false,"isICheckedIn":false},{"name":"rahul","id":"12","isCheckedIn":false,"isICheckedIn":false},{"name":"mukesh","id":"13","isCheckedIn":true,"isICheckedIn":false},{"name":"manju","id":"14","isCheckedIn":false,"isICheckedIn":false},{"name":"sourabh","id":"15","isCheckedIn":false,"isICheckedIn":false},{"name":"sheetal","id":"16","isCheckedIn":false,"isICheckedIn":false},{"name":"samir","id":"17","isCheckedIn":false,"isICheckedIn":false},{"name":"akhil","id":"18","isCheckedIn":true,"isICheckedIn":false},{"name":"rahi","id":"19","isCheckedIn":false,"isICheckedIn":false},{"name":"ram","id":"20","isCheckedIn":true,"isICheckedIn":false}]}]}');
			new selfCheckInForm($this.webflowMemberId, responseText); 			
		}
	}
}
