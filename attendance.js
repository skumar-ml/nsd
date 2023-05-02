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
		this.labsData = labsData.Lab;
		this.view();
	}
	
	view(){
		var accordionDiv = document.getElementById("attendanceSelfCheckIn");
		var row = creEl('div', 'w-row ');
		
		var col = creEl("div", 'w-col-12 checkin-row');
		var labData = this.getLabs();
		col.appendChild(labData)
		
		var checkInBtn = this.getCheckInBtn();
		col.appendChild(checkInBtn)
		
		row.appendChild(col)
		accordionDiv.appendChild(row);
	}
	getLabs(){
		
		var $this = this;
		var labs = this.labsData;
		var labsSelectBox = creEl('select', 'select-labs w-select', 'select-labs')
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select activity to check-in";
		labsSelectBox.appendChild(defaultoption);
		labs.forEach(item => {
			var option = creEl("option");
				option.value = item.id;
				option.text = item.name;
				labsSelectBox.appendChild(option);
		})
		
		labsSelectBox.addEventListener('change', function () {
			$this.displayCheckInBtn(this.value);
		})
		
		return labsSelectBox;
	}
	getCheckInBtn(){
		var $this = this;
		var checkInBtn = creEl('button', 'main-button red w-button check-in-btn', 'check-in-btn');
		checkInBtn.innerHTML = 'Self Check-In';
		checkInBtn.addEventListener('click', function(){
			$this.callCheckedInApi();
		})
		return checkInBtn;
	}
	displayCheckInBtn(labId){
		var opacity = (labId) ? 1 : 0;
		var btn = document.getElementsByClassName('check-in-btn')[0];
		btn.style.opacity = opacity;
		btn.style.transition = 'all 2s';
		var currentLab = this.labsData.find(item => item.id == labId);
		this.$currentLab = currentLab;
		console.log(labId+"&&"+currentLab.isChecked)
		console.log((labId && currentLab.isChecked))
		if(labId && currentLab.isChecked){
			console.log('already checked in')
			let checkInIcon = this.getCheckInIcon();
			btn.innerHTML = 'Checked-In';
			btn.prepend(checkInIcon)
		}else{
			btn.innerHTML = 'Self Check-In';
		}
		
	}
	getCheckInIcon(){
		var img = creEl('img', 'checkedInIcon')
		img.src = 'https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/6437ec2c6bc4131717b36b93_checkin.svg';
		return img
	}
	callCheckedInApi(){
		var currentLab = this.$currentLab;
		console.log('currentLab', currentLab)
		if(!currentLab.isChecked){
			var checkInBtn = document.getElementById('check-in-btn');
			checkInBtn.innerHTML = 'Processing....';
			var data = {
			 "labId" : currentLab.id,
			 "isSelfCheckin": true,
			 "memberId": this.webflowMemberId
			}
			var xhr = new XMLHttpRequest()
			var $this = this;
			xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/addStudentAttendance", true)
			xhr.withCredentials = false
			xhr.send(JSON.stringify(data))
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
				item.isChecked = true;
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
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getStudentAttendance/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			let responseText =  JSON.parse(xhr.responseText);
			//let responseText =  JSON.parse('{"labs":[{"name":"Morning check-in","id":"1","isCheckedIn":false},{"name":"Evening check-in","id":"2","isCheckedIn":false},{"name":"Lab 1","id":"3","isCheckedIn":false},{"name":"Lab 2","id":"4","isCheckedIn":false}]}');
			new selfCheckInForm($this.webflowMemberId, responseText); 			
		}
	}
}
