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
 * Class for handling self CheckIn
 * @param webflowMemberId - memberId
 * @param labsData - labs data by API
 */
class selfCheckInForm {
	$currentLab = {};
	$timezones = [];
	constructor(webflowMemberId, labsData){
		this.webflowMemberId = webflowMemberId;
		this.labsData = labsData.Lab;
		this.view();
	}
	/*Display Self checkin form*/
	view(){
		// Get Parent Div
		var accordionDiv = document.getElementById("attendanceSelfCheckIn");
		// Create parent row div
		var row = creEl('div', 'w-row ');
		
		var col = creEl("div", 'w-col-12 checkin-row');
		// Get labs data
		var labData = this.getLabs();
		col.appendChild(labData)
		
		//session 
		var sessionFilter = creEl('div', 'sessionFilter', 'sessionFilter')
		col.appendChild(sessionFilter)
		
		// Get Self checkin button
		var checkInBtn = this.getCheckInBtn();
		col.appendChild(checkInBtn)
		
		row.appendChild(col)
		accordionDiv.appendChild(row);
	}
	// Create labs select box html element 
	getLabs(){
		var $this = this;
		// Get all labs data
		var labs = this.labsData;
		var labsSelectBox = creEl('select', 'select-labs w-select', 'select-labs')
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select activity to check in";
		labsSelectBox.appendChild(defaultoption);
		labs.forEach(item => {
			if(item.id){
			var option = creEl("option");
				option.value = item.id;
				option.text = item.name;
				labsSelectBox.appendChild(option);
			}
		})
		
		labsSelectBox.addEventListener('change', function () {
			var session = labs.find(item => item.id == this.value);
			$this.$timezones = session.sessions;
			$this.getSessions();
			$this.displayCheckInBtn(this.value);
			if(!this.value){
				$this.hideShowUI();
			}
		})
		
		return labsSelectBox;
	}
	hideShowUI(){
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		var btn = document.getElementsByClassName('check-in-btn')[0];
		timeZoneSelect.disabled = true;
		btn.disabled = true;
		btn.style.opacity = 0;
		timeZoneSelect.style.opacity = 0;
	}
	// Create labs select box html element 
	getSessions(){
		var $this = this;
		// Get all labs data
		var labs = this.$timezones;

		var sessionFilter = document.getElementById('sessionFilter');
		sessionFilter.innerHTML = '';

		var sessionSelectBox = creEl('select', 'select-timezones w-select', 'select-labs')
		
		//default option
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select timezone to check in";
		sessionSelectBox.appendChild(defaultoption);
		
		labs.forEach(item => {
			var option = creEl("option");
			option.value = item._id;
			option.text = item.labTypeName+' '+item.count;
				sessionSelectBox.appendChild(option);
		})
		
		sessionSelectBox.addEventListener('change', function () {
			var sessionSelectBox = document.getElementById('select-labs');
			$this.displayCheckInBtn(sessionSelectBox.value);
		})
		sessionFilter.appendChild(sessionSelectBox)
		//return labsSelectBox;
	}
	// Create default checked button html element
	getCheckInBtn(){
		var $this = this;
		var checkInBtn = creEl('button', 'main-button red w-button check-in-btn', 'check-in-btn');
		checkInBtn.innerHTML = 'Self Check In';
		checkInBtn.addEventListener('click', function(){
			$this.callCheckedInApi();
		})
		return checkInBtn;
	}
	// Display checked in button on lab change
	displayCheckInBtn(labId){
		if(!labId){
			return;
		}
		
		var currentLab = this.labsData.find(item => item.id == labId);
		this.$currentLab = currentLab;
		
		var timeZoneOpacity = (currentLab.typeId == 4 || currentLab.typeId == 5) ? 0 : 1;
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		timeZoneSelect.style.opacity = timeZoneOpacity;
		timeZoneSelect.disabled = (!timeZoneOpacity) ? true : false;

		
		
		var opacity = (labId && (timeZoneSelect.value || currentLab.typeId == 4  || currentLab.typeId == 5) ) ? 1 : 0;
		var btn = document.getElementsByClassName('check-in-btn')[0];
		btn.style.opacity = opacity;
		btn.disabled = (!opacity) ? true : false;
		//btn.style.transition = 'all 2s';
		
		//console.log('currentLab', currentLab)
		//console.log(labId+"&&"+currentLab.typeId +'&&'+currentLab.isChecked)
		//console.log((labId && currentLab.typeId == undefined  && currentLab.isChecked))
		if(labId && currentLab.typeId == 4 && currentLab.typeName != 'One Time' && currentLab.checkedIn){
			console.log('already checked in')
			let checkInIcon = this.getCheckInIcon();
			btn.classList.add('already-checkedin');
			btn.innerHTML = 'Already Checked In';
			btn.prepend(checkInIcon)
		}else if(labId && currentLab.typeId == 4 && currentLab.typeName == 'One Time' && currentLab.selfCheckin.length > 0){
			console.log('already checked in')
			let checkInIcon = this.getCheckInIcon();
			btn.classList.add('already-checkedin');
			btn.innerHTML = 'Already Checked In';
			btn.prepend(checkInIcon)
		}else if(labId && currentLab.typeId == 5 && currentLab.selfCheckin.length > 0){
			console.log('already checked in')
			let checkInIcon = this.getCheckInIcon();
			btn.classList.add('already-checkedin');
			btn.innerHTML = 'Already Checked In';
			btn.prepend(checkInIcon)
		}else if(labId && currentLab.typeId != 4){
			//console.log('currentLab4', currentLab.checkedIn, timeZoneSelect.value)
			var selectTimezone = currentLab.selfCheckin.find(item => item.timezoneId == timeZoneSelect.value)
			if(selectTimezone && selectTimezone.checkedIn){
				let checkInIcon = this.getCheckInIcon();
				btn.innerHTML = 'Already Checked In';
				btn.classList.add('already-checkedin');
				btn.prepend(checkInIcon)
			}else{
				btn.classList.remove('already-checkedin');
				btn.innerHTML = 'Self Check In';
			}
			//console.log('selectTimezone', selectTimezone)
		}else{
			btn.classList.remove('already-checkedin');
			btn.innerHTML = 'Self Check In';
		}
		
	}
	// get checkin tick icon
	getCheckInIcon(){
		var img = creEl('img', 'checkedInIcon')
		img.src = 'https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/647062754a2e7d5b5208c785_square-check-red.svg';
		return img
	}
	// API call for daily checked in
	callCheckedInApi(){
		var currentLab = this.$currentLab;
		console.log('currentLab', currentLab)
		var ischecked = false;
		if(currentLab.typeId == 4){
			ischecked = currentLab.checkedIn
		}else{
			var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
			var selectTimezone = currentLab.selfCheckin.find(item => item.timezoneId == timeZoneSelect.value)
			console.log('selectTimezone', selectTimezone)
			if(selectTimezone){
				ischecked = selectTimezone.checkedIn;
			}else{
				ischecked  = false
			}
		}
		if(!ischecked){
			var checkInBtn = document.getElementById('check-in-btn');
			checkInBtn.innerHTML = 'Processing....';
			var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
			var data = {
			 "labId" : currentLab.id,
			 "isSelfCheckin": true,
			 "memberId": this.webflowMemberId,
			 "timezoneId": (timeZoneSelect.value && currentLab.typeId != 4) ? timeZoneSelect.value : null
			}
			var xhr = new XMLHttpRequest()
			var $this = this;
			xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/addStudentAttendance", true)
			xhr.withCredentials = false
			xhr.send(JSON.stringify(data))
			xhr.onload = function() {
				let responseText =  JSON.parse(xhr.responseText);
				let checkInIcon = $this.getCheckInIcon();
				checkInBtn.classList.add('already-checkedin');
				checkInBtn.innerHTML = 'Checked In Successfully';
				checkInBtn.prepend(checkInIcon)
				$this.updateCurrentData();
			}
		}else{
			alert("You have already checkin for this lab");
		}
	}
	// After checked in update local data
	updateCurrentData(){
		var labsSelectBox = document.getElementById('select-labs');
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		console.log('labsSelectBox.value', labsSelectBox.value)
		var labsData = this.labsData;
		labsData.map(item => {
			if(item.id == labsSelectBox.value && item.typeId == 4){
				item.checkedIn = true;
			}else if(item.id == labsSelectBox.value && item.typeId != 4){
				console.log('item', item)
				var selectTimezone = item.selfCheckin.find(data => data.timezoneId == timeZoneSelect.value)
				if(selectTimezone){
					item.selfCheckin.map(data => {
						if(data.timezoneId == timeZoneSelect.value){
							data.checkedIn = true;
						}
						return data;
					})
				}else{
					var checkdata = {};
					checkdata.checkedIn = true;
					checkdata.timezoneId = timeZoneSelect.value;
					item.selfCheckin.push(checkdata);
				}
				
			}
			return item;
		})
		this.labsData = labsData;
	}
}
/**
  * Class for Handling API for LabsData
  * @param webflowMemberId - MemberId
  */
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
			new selfCheckInForm($this.webflowMemberId, responseText); 			
		}
	}
}
