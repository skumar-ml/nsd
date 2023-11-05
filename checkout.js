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
 * Used CheckOutWebflow class name to easily intigrate with portal js.
 * In this API we pass apiBaseUrl, webflowMemberId, accountEmail.
 * In this class we are manipulating student data and creating make up session link for students
 */
class CheckOutWebflow {
	
	constructor(apiBaseUrl, webflowMemberId,accountEmail) {
		this.baseUrl = apiBaseUrl;
		this.webflowMemberId = webflowMemberId;
		this.accountEmail = accountEmail;
		this.renderPortalData();
	}
	// Passing all supplimentary program data and creating cart list
	displaySupplimentaryProgram(data){
		// Getting main dom elment object to add student list with link
		var studentList = document.getElementById('checkout_supplimentary_data');
		var cardCheckout = document.getElementById('cardCheckout');
		var $this = this;
		cardCheckout.addEventListener('click', function(){
			$this.initializeStripePayment();
		})
		studentList.innerHTML = "";
		console.log('data', data)
		
		data.forEach((sData)=>{
			// Getting single student list
			var sList = this.createStudentList(sData);
				studentList.appendChild(sList);
		})
	}
	// Manipulating single student list
	createStudentList(suppData){
		var coreProductContainer = creEl('div', 'core-product-container');
		var $this = this;
		var coreCheckbox = creEl('div', 'core-checkbox');
		var wCheckbox = creEl('label', 'w-checkbox')
		var checkboxS = creEl('input', 'w-checkbox-input core-checkbox');
		checkboxS.type ="checkbox";
		checkboxS.name ="checkbox";
		checkboxS.value =suppData.amount;
		checkboxS.setAttribute('data-name', 'Checkbox')
		checkboxS.addEventListener('change', function() {
		 $this.updateAmount(this, suppData.amount)
		});
		
		wCheckbox.appendChild(checkboxS)
		coreCheckbox.appendChild(wCheckbox)
		
		var coreProductTitle = creEl('div', 'core-product-title')
		var h1 = creEl('h1', 'core-product-title-text')
		h1.innerHTML = suppData.label;
		var div = creEl('div')
		div.innerHTML = suppData.desc;
		coreProductTitle.prepend(h1, div)
		
		coreProductContainer.prepend(coreCheckbox, coreProductTitle)

		return coreProductContainer;
	}
	
	updateAmount(checkEvent, amount){
		var totalAmountInput = document.getElementById('totalAmount');
		var totalPriceText = document.getElementById('totalPrice');
		 if (checkEvent.checked) {
			 totalPriceText.innerHTML = parseFloat(totalAmountInput.value)+parseFloat(amount) 
			console.log("Checkbox is checked..", checkEvent.value);
		  } else {
			console.log("Checkbox is not checked..", checkEvent.value);
			totalPriceText.innerHTML = parseFloat(totalAmountInput.value)-parseFloat(amount) 
		  }
	}
	// Get API data with the help of endpoint
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
	initializeStripePayment(){
		var data = {
			"email": "drishti.sharma@techment.com",
			"name" : "Drishti Sharma",
			"studentEmail" : "dev.narayan@techment.com",
			"studentName" : "Dev Narayan",
			"grade" : "11",
			"label": "Texas Pf", 
			"programId" : 1,
			"paymentType" : "card",
			"successUrl" : "https://www.techment.com",
			"cancelUrl" : "https://www.techment.com",
			"amount" : 500,
			"memberId" : "687687g8o7yhdw2", 
			"programCategoryId" : 1111,
			 "supplementaryProgramIds" : []  
		}
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/createCheckoutUrl", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function() {
			let responseText = JSON.parse(xhr.responseText);
			console.log('responseText', responseText)
			if(responseText.success){
				span.innerHTML = link_title;
				window.location.href = responseText.stripe_url;
			}

		}
	}
	activateDiv(divId){
		var divIds = ['checkout_program', 'checkout_student_details', 'checkout_payment'];
		 // Remove the active class from all div elements
		divIds.forEach(id => document.getElementById(id).classList.remove('active'));
		// Add the active class to the div with the specified id
		document.getElementById(divId).classList.add('active');
	}
	addEventForPrevNaxt(){
		var next_page_1 = document.getElementById('next_page_1');
		var next_page_2 = document.getElementById('next_page_2');
		var prev_page_1 = document.getElementById('prev_page_1');
		var prev_page_2 = document.getElementById('prev_page_2');
		var $this = this;
		next_page_1.addEventListener('click', function(){
			$this.activateDiv('checkout_student_details');
		})
		next_page_2.addEventListener('click', function(){
			$this.activateDiv('checkout_payment');
		})
		prev_page_1.addEventListener('click', function(){
			$this.activateDiv('checkout_program');
		})
		prev_page_2.addEventListener('click', function(){
			$this.activateDiv('checkout_student_details');
		})
	}
	// After API response we call the createMakeUpSession method to manipulate student data 
	async renderPortalData(memberId) {
		try {
			this.addEventForPrevNaxt();
		  this.activateDiv('checkout_program')	
		  const data = await this.fetchData('getSupplementaryProgram/5');
		  this.displaySupplimentaryProgram(data)
		} catch (error) {
			console.error('Error rendering random number:', error);
		}
	}
}
