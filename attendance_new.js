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
	  $selected_labs = [];
	  constructor(webflowMemberId, labsData){
		  this.webflowMemberId = webflowMemberId;
		  this.labsData = labsData;
		  this.view();
	  }
	  /*Display Self checkin form*/
	  view(){
		  // Get Parent Div
		  var accordionDiv = document.getElementById("attendanceSelfCheckIn");
		  // Create parent row div
		  var row = creEl('div', 'w-row ');
		  
		  var col = creEl("div", 'w-col-12 checkin-row');
		  // Get session data
		  var labData = this.get_session();
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
	  get_session(){
		  var $this = this;
		  // Get all labs data
		  var labs = this.labsData;
		  var select =  creEl('div', 'select')
		  var labsSelectBox = creEl('select', 'select-labs', 'select-labs')
		  var defaultoption = creEl("option");
		  defaultoption.value = "";
		  defaultoption.text = "Select session to check in";
		  labsSelectBox.appendChild(defaultoption);
		  labs.forEach(item => {
			  if(item.session.sessionId){
			  var option = creEl("option");
				  option.value = item.session.sessionId;
				  option.text = (item.session.sessionId == '111') ? item.session.sessionName+' (Morning, Evening Check-in)' : item.session.sessionName; 
				  labsSelectBox.appendChild(option);
			  }
		  })
		  
		  labsSelectBox.addEventListener('change', function () {
			 var selected_labs = labs.find(item => item.session.sessionId == this.value);
			$this.$selected_labs = (selected_labs != undefined) ? selected_labs.lab : [];
			$this.get_Labs(this.value);
			if(!this.value){
				$this.hideShowUI();
			}
			$this.hideLabAndBtn()
			  
		  })
		  
		  select.appendChild(labsSelectBox)
		  return select;
	  }
	hideLabAndBtn(){
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		var btn = document.getElementsByClassName('check-in-btn')[0];
		if(!timeZoneSelect.value){
			btn.style.display = 'none';
		}
	}
	hideShowUI(){
		var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		var selectLabs = document.getElementById('select-labs');
		var btn = document.getElementsByClassName('check-in-btn')[0];
		console.log('Hide and Show', timeZoneSelect.value, selectLabs.value)
		  
		if(timeZoneSelect.value == '' || selectLabs.value == ''){
			timeZoneSelect.disabled = true;
			btn.disabled = true;
			btn.style.display = 'none';
			timeZoneSelect.style.display = 'none';
		}
		
	}
	  // Create labs select box html element 
	  get_Labs(){
		  var $this = this;
		  // Get all labs data
		  var labs = this.$selected_labs;
  
		  var sessionFilter = document.getElementById('sessionFilter');
		  sessionFilter.innerHTML = '';
  		  var select =  creEl('div', 'select')
		  var sessionSelectBox = creEl('select', 'select-timezones', 'select-labs')
		  
		  //default option
		  var defaultoption = creEl("option");
		  defaultoption.value = "";
		  defaultoption.text = "Select activity to check in";
		  sessionSelectBox.appendChild(defaultoption);
		  
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
		  
		  var currentLab = this.$selected_labs.find(item => item.labId == labId);
		  this.$currentLab = currentLab;
		  
		  var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
  
		  
		  
		  var display = (labId && timeZoneSelect.value ) ? 'block' : 'none';
		  var btn = document.getElementsByClassName('check-in-btn')[0];
		  btn.style.display = display;
		  btn.disabled = (display == 'none') ? true : false;
		  //btn.style.transition = 'all 2s';
		  if(!labId){
			return;
			}
		  console.log('currentLab', currentLab)
		  //console.log(labId+"&&"+currentLab.typeId +'&&'+currentLab.isChecked)
		  //console.log((labId && currentLab.typeId == undefined  && currentLab.isChecked))
		  if(labId && currentLab.checkedIn){
			  console.log('already checked in')
			  let checkInIcon = this.getCheckInIcon();
			  btn.classList.add('already-checkedin');
			  btn.innerHTML = 'Already Checked In';
			  btn.prepend(checkInIcon)
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
		  
		  
			var checkInBtn = document.getElementById('check-in-btn');
			checkInBtn.innerHTML = 'Processing....';
			var timeZoneSelect = document.getElementById('select-labs');
			var data = {
			"labId" : currentLab.labId,
			"isSelfCheckin": true,
			"memberId": this.webflowMemberId,
			"timezoneId": (timeZoneSelect.value != '111') ? timeZoneSelect.value : null
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
		  
	  }
	  // After checked in update local data
	  updateCurrentData(){
		  var labsSelectBox = document.getElementById('select-labs');
		  var timeZoneSelect = document.getElementsByClassName('select-timezones')[0];
		  console.log('labsSelectBox.value', labsSelectBox.value)
		  var labsData = this.labsData;
		  labsData.map(item => {
			 if(item.session.sessionId == labsSelectBox.value){
				  item.lab.map(labData => {
					if(labData.labId == timeZoneSelect.value){
						labData.checkedIn = true
					}
				  })
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
		  this.get_sessionData();
	  }
	  get_sessionData(){
		  var spinner = document.getElementById('half-circle-spinner');
		  spinner.style.display = 'block';
		  var xhr = new XMLHttpRequest()
		  var $this = this;
		  xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getAttendanceDetailsByMemberId/"+$this.webflowMemberId, true)
		  xhr.withCredentials = false
		  xhr.send()
		  xhr.onload = function() {
			  let responseText =  JSON.parse(xhr.responseText);
			  new selfCheckInForm($this.webflowMemberId, responseText);
			  spinner.style.display = 'none';
		  }
	  }
  }
