/*Attendance JS*/
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
	constructor(webflowMemberId, labsData){
		this.webflowMemberId = webflowMemberId;
		this.labsData = labsData.labs;
		this.view();
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
		
		var head = this.createAttendanceTitle();
		col.appendChild(head)
		
		
		var studentlist = creEl("div", 'student-list', 'student-list');
		col.appendChild(studentlist)
		
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
			$this.displayStudentList(this.value);
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
	displayStudentList(labId){
		
		var opacity = (labId) ? 1 : 0;
		var btn = document.getElementsByClassName('student-list-head')[0];
		btn.style.opacity = opacity;
		btn.style.transition = 'all 2s';
		
		var studentlist = document.getElementById('student-list');
		studentlist.innerHTML = "";
		var $this = this;
		var currentLab = this.labsData.find(item => item.id == labId);
		this.$currentLab = currentLab;
		currentLab.student.forEach((item, index) => {
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
		return studentlist;
	}
	updateAttendanceData(studentId){
		var labsData = this.labsData;
		var currentLab = this.$currentLab;
		labsData.map(item =>{
			if(item.id == currentLab.id){
				item.student =  item.student.map(sItem => {
					if(sItem.id == studentId){
						sItem.isICheckedIn = true;
					}
					return sItem;
				})
			}
			return item;
		})
		this.$currentLab = labsData
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
}
class LabsData {
	$isLoading = true;
	$messageData = '';
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
			let responseText =  JSON.parse('{"labs":[{"name":"Lab 1","id":"97427492749274927342","student":[{"name":"Yogesh Yadav","id":"1","isCheckedIn":false,"isICheckedIn":false},{"name":"Dev Narayan","id":"2","isCheckedIn":false,"isICheckedIn":false}]},{"name":"Lab 2","id":"97427492749274927333","student":[{"name":"Abha","id":"1","isCheckedIn":false,"isICheckedIn":false},{"name":"Shubham","id":"2","isCheckedIn":false,"isICheckedIn":false}]}]}');
			new selfCheckInForm($this.webflowMemberId, responseText); 			
		}
	}
}
