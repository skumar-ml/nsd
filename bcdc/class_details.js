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
class ApiClient {
	constructor(baseUrl) {
		this.baseUrl = baseUrl;
	}

	async fetchData(endpoint) {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`);
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
}
const api = new ApiClient(apiBaseUrl);
class classLocation{
	constructor(webflowMemberId,responseText,currentIndex, accountEmail, levelId, levelName){
		this.webflowMemberId = webflowMemberId;
		this.currentIndex = currentIndex;
		this.accountEmail = accountEmail;
		this.responseText = responseText;
		this.levelId = levelId;
		this.levelName = levelName;
		this.renderClassLocations() // gets mongoDB data from responseText object for specific registrations
		
	}
	renderClassLocations(){
		var $this = this;
		var cartLocationDiv = document.getElementById('cart-location-div-'+this.currentIndex);
		cartLocationDiv.innerHTML = "";
		var heading = creEl('h2', 'sub-heading center');
		heading.innerHTML = (this.responseText.locationName) ? this.responseText.locationName : '';
		
		
		var innerContainer = this.getInnerContainer();
		
		
		
		
		cartLocationDiv.prepend(heading, innerContainer.timingContainer, innerContainer.buttonDiv);
		this.initiateLightbox();
		var spinner = document.getElementById('half-circle-spinner');
		spinner.style.display = 'none';
	}
	getInnerContainer(){
		var $this = this;
		var registerBtn;
		var timingContainer = creEl('div', 'main-text center cart-break-spaces timing-data');
		var buttonDiv = creEl('div', 'button-div margin-top-auto');
		var timingText = "";
		if(this.responseText.timing.length == 1){
			this.responseText.timing.forEach((timeData,index)=>{
				
				
				var time = creEl('div', 'time-text')
				timingText = timeData.day+" "+timeData.startTime+"-"+timeData.endTime+" ";
				time.innerHTML = timingText;
				
				registerBtn = this.getRegisterBtn(timeData, index);
				buttonDiv.appendChild(registerBtn);
				
				timingContainer.appendChild(time);
			})
		}else{
			var label = creEl('label', 'form-field-label');
			label.innerHTML = "Select Class Time";
			var selectBox = creEl("select", "w-select")
			this.responseText.timing.forEach((timeData,index)=>{
				var option = creEl('option')
				option.value = timeData.oid;
				option.innerHTML = timeData.day+" "+timeData.startTime+"-"+timeData.endTime;
				selectBox.appendChild(option)
				registerBtn = this.getRegisterBtn(timeData, index);
				buttonDiv.appendChild(registerBtn);
			});
			timingContainer.appendChild(label)
			
			timingContainer.appendChild(selectBox)
			selectBox.addEventListener('change', function () {
				for (let i = 0; i < selectBox.options.length; i++) {
					console.log('option value', selectBox.options[i].value)
					document.getElementsByClassName(selectBox.options[i].value)[0].style.display = 'none';
				}
				document.getElementsByClassName(this.value)[0].style.display = 'block'
			})
			
		}
		//timingContainer.appendChild(buttonDiv)
		return {'timingContainer': timingContainer, 'buttonDiv':buttonDiv};
	
	}
	getRegisterBtn(timeData, index){
		var locationActionDiv = creEl('div','location_action_div '+timeData.oid+' '+(index ? 'hide': '') );
		
		var alertMessage = this.getAlertMessage(timeData);
		var alertclass= (alertMessage)? alertMessage.type : '';
		var alertMsg = creEl("div", 'alert_msg')
		if(alertMessage){
			var aMessageIcon = creEl('div', 'alert-message '+alertclass)
			var aMessage = creEl('span', 'alert-message');
				aMessage.innerHTML = alertMessage.message;
				aMessageIcon.appendChild(aMessage)
				alertMsg.appendChild(aMessageIcon);
		}
		locationActionDiv.prepend(alertMsg)
		
		var locationActionLink = document.createElement("a");
		locationActionLink.className="main-button red w-button";
		if (window.innerWidth > 1200) {
			locationActionLink.classList.add("iframe-lightbox-link");
			locationActionLink.setAttribute("data-scrolling", true);
		}
		var btnlbl = 'Register';
		var btnlink = 'https://form.jotform.com/231871555621457?classlevel='+this.levelName+'&classlocation='+this.responseText.locationName+'&classday='+timeData.day+'&classtime='+timeData.startTime+'&classspots='+timeData.leftSpots+'&memberId='+this.webflowMemberId+'&classUniqueId='+timeData.classUniqueId+'&parentEmail='+this.accountEmail;
		if(alertMessage && alertMessage.type == 'waitlist'){
			btnlbl = 'Join Waitlist';
			btnlink = 'https://form.jotform.com/231871645541458?classlevel='+this.levelName+'&classlocation='+this.responseText.locationName+'&classday='+timeData.day+'&classtime='+timeData.startTime+'&classspots='+timeData.leftSpots+'&memberId='+this.webflowMemberId+'&classUniqueId='+timeData.classUniqueId+'&parentEmail='+this.accountEmail;
		}
		locationActionLink.href = btnlink; 

		locationActionLink.innerHTML = btnlbl;
		locationActionDiv.appendChild(locationActionLink);
        
        
		return locationActionDiv;
	}
	getAlertMessage(timeData){
		var numberOfSpots = timeData.numberOfSpots;
		var leftSpots = timeData.leftSpots;
		var message = ""
		var leftSpotsPercentage = (100 * leftSpots )/numberOfSpots; 
		console.log('numberOfSpots, leftSpots, leftSpotsPercentage', numberOfSpots, leftSpots, leftSpotsPercentage)
		if(leftSpotsPercentage <= 0){
			message = {};
			message.type = "waitlist";
			message.message = "Seats are full you can fill the wait list forms below";
		}else if(leftSpotsPercentage <= 25){
			message = {};
			message.type = "filling_fast";
			message.message = "Hurry! Register now. Seats filling up fast! only <b>"+leftSpots+" spot left</b>";
		}
		return message;
	}
	/**
	 * initialize Lightbox and rerender accordion after close the lightbox
	 */
	initiateLightbox(){
		var $this = this;
		[].forEach.call(document.getElementsByClassName("iframe-lightbox-link"), function (el) {
		  el.lightbox = new IframeLightbox(el, {
			onClosed: function() {
				var spinner = document.getElementById('half-circle-spinner');
				spinner.style.display = 'block';				
				setTimeout(function() {
					new classDetails(api, $this.webflowMemberId, $this.accountEmail, $this.levelId)
				}, 500);
			},
			scrolling: true,
		  });
		});
	}
}
class classDetails {
	constructor(apiClient, webflowMemberId,accountEmail, levelId) {
		this.apiClient = apiClient;
		this.webflowMemberId = webflowMemberId;
		this.accountEmail = accountEmail;
		this.levelId = levelId;
		this.renderPortalData();
	}
	viewClassLocations(locationData){
		var classLocationContainer = document.getElementById('classLocation');
		Object.values(locationData).forEach((formData,index) => {
			var locationContainer = creEl('div', 'cart-location-div', 'cart-location-div-'+(index+1))
			classLocationContainer.appendChild(locationContainer);
		})
	}
	async renderPortalData(memberId) {
		try {
		  const data = await this.apiClient.fetchData('getClassDetailByMemberIdAndLevelId?levelId='+this.levelId+'&memberId='+this.webflowMemberId);
		  var $this = this;
		  console.log('data', data)
		  var locationData = data[0][0].location;
		  var levelId = data[0][0].levelId;
		  var levelName = data[0][0].levelName;
		  console.log('locationData', locationData)
		  this.viewClassLocations(locationData);
		  Object.values(locationData).forEach((formData,index) => {
			  console.log('formData', formData)
			  setTimeout(function(){
				let currentIndex = index+1;
				  new classLocation($this.webflowMemberId, formData,currentIndex, $this.accountEmail, levelId, levelName);
			  },30)
		  })
		} catch (error) {
			console.error('Error rendering random number:', error);
		}
	}
}
