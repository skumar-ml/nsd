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
	$suppPro = [];
	constructor(apiBaseUrl, memberData) {
		this.baseUrl = apiBaseUrl;
		this.memberData = memberData;
		this.renderPortalData();
	}
	// Passing all supplimentary program data and creating cart list
	displaySupplimentaryProgram(data){
		this.$suppPro = data;
		// Getting main dom elment object to add student list with link
		var studentList = document.getElementById('checkout_supplimentary_data');
		var $this = this
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
		checkboxS.setAttribute('programDetailId', suppData.programDetailId)
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
		
		var productPriceContainer = creEl('div', 'product-price-container')
		var productPriceText = creEl('div', 'product-price-text')
		productPriceText.innerHTML = '$'+suppData.amount
		productPriceContainer.appendChild(productPriceText)
		
		coreProductContainer.prepend(coreCheckbox, coreProductTitle, productPriceContainer)

		return coreProductContainer;
	}
	displaySelectedSuppProgram(suppIds){
		var selectedSuppPro = document.getElementById('selected_supplimentary_program');
		selectedSuppPro.innerHTML = "";
		var selectedData = this.$suppPro.filter(item => suppIds.some(d => d == item.programDetailId))
		var head = creEl('p', 'dm-sans font-14 order-summary-border');
		head.innerHTML = "Supplementary Program"
		selectedSuppPro.appendChild(head);
		var label = '';
		selectedData.forEach(sup=>{
			label = creEl('p', 'dm-sans font-14 bold')
			label.innerHTML = sup.label
			selectedSuppPro.appendChild(label);
			label = creEl('p', 'dm-sans font-14')
			label.innerHTML = sup.desc
			selectedSuppPro.appendChild(label);
		});
		
		console.log('selectedData',selectedData)
	}
	updateOnlyTotalAmount(){
		var totalPriceText = document.getElementById('totalPrice');
		var core_product_price = document.getElementById('core_product_price');
		var totalAmountInput = document.getElementById('totalAmount');
		totalPriceText.innerHTML = '$'+parseFloat(core_product_price.value)+parseFloat(totalAmountInput.value);
	}
	updateAmount(checkEvent, amount){
		var totalAmountInput = document.getElementById('totalAmount');
		var core_product_price = document.getElementById('core_product_price');
		//core_product_price
		var totalPriceText = document.getElementById('totalPrice');
		var suppProIdE = document.getElementById('suppProIds');
		var suppId = checkEvent.getAttribute('programDetailId')
		var selectedIds = [];
		 if (checkEvent.checked) {
			 totalPriceText.innerHTML = '$'+parseFloat(core_product_price.value)+parseFloat(totalAmountInput.value)+parseFloat(amount)
			 totalAmountInput.value = parseFloat(totalAmountInput.value)+parseFloat(amount)
			 var arrayIds = JSON.parse(suppProIdE.value);
			 arrayIds.push(suppId);
			 selectedIds = arrayIds;
			 suppProIdE.value = JSON.stringify(arrayIds)
		  } else {
			console.log("Checkbox is not checked..", checkEvent.value);
			totalPriceText.innerHTML = '$'+parseFloat(core_product_price.value)+ parseFloat(totalAmountInput.value)-parseFloat(amount)
			totalAmountInput.value	= parseFloat(totalAmountInput.value)-parseFloat(amount)
			var arrayIds = JSON.parse(suppProIdE.value);
			var allSupIds =  arrayIds.filter(i => i != suppId)
			selectedIds = allSupIds;
			suppProIdE.value = JSON.stringify(allSupIds)			
		  }
		  if(selectedIds.length > 0){
			  this.displaySelectedSuppProgram(selectedIds);
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
	initializeStripePayment(type, btn){
		var studentFirstName = document.getElementById('Student-First-Name');
		var studentLastName = document.getElementById('Student-Last-Name');
		var studentEmail = document.getElementById('Student-Email');
		var studentGrade = document.getElementById('Student-Grade');
		var studentSchool = document.getElementById('Student-School');
		var studentGender = document.getElementById('Student-Gender');
		var suppProIdE = document.getElementById('suppProIds');
		var core_product_price = document.getElementById('core_product_price');
		
		var data = {
			"email": this.memberData.email,
			"studentEmail" : studentEmail.value,
			"firstName" : studentFirstName.value,
			"lastName" : studentLastName.value,
			"grade" : studentGrade.value,
			"label": "Texas Pf",
			"school": studentSchool.value,
			"gender": studentGender.value,
			"programId" : this.memberData.programId,
			"paymentType" : type,
			"successUrl" : "https://www.nsdebatecamp.com/members/"+this.memberData.memberId,
			"cancelUrl" : "https://www.nsdebatecamp.com"+window.location.pathname,
			"amount" : parseFloat(core_product_price.value),
			"memberId" : this.memberData.memberId, 
			"programCategoryId" : this.memberData.programCategoryId,
			"supplementaryProgramIds" : JSON.parse(suppProIdE.value) 
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
				btn.innerHTML = 'Checkout';
				window.location.href = responseText.stripe_url;
			}

		}
	}
	activateDiv(divId){
		var divIds = ['checkout_program', 'checkout_student_details', 'checkout_payment'];
		 // Remove the active class from all div elements
		divIds.forEach(id => document.getElementById(id).classList.remove('active_checkout_tab'));
		// Add the active class to the div with the specified id
		document.getElementById(divId).classList.add('active_checkout_tab');
	}
	addEventForPrevNaxt(){
		var next_page_1 = document.getElementById('next_page_1');
		var next_page_2 = document.getElementById('next_page_2');
		var prev_page_1 = document.getElementById('prev_page_1');
		var prev_page_2 = document.getElementById('prev_page_2');
		var checkoutFormError = document.getElementById('checkout-form-error')
		var $this = this;
		var form = $( "#checkout-form" );
		next_page_1.addEventListener('click', function(){
			$this.activateDiv('checkout_student_details');
		})
		next_page_2.addEventListener('click', function(){
			if(form.valid()){
				var isValidName = $this.checkUniqueStudentName();
				if(isValidName){
					checkoutFormError.style.display = 'none'
					$this.activateDiv('checkout_payment');
				}else{
					checkoutFormError.style.display = 'block'
				}
			}
		})
		prev_page_1.addEventListener('click', function(){
			$this.activateDiv('checkout_program');
		})
		prev_page_2.addEventListener('click', function(){
			$this.activateDiv('checkout_student_details');
		})
	}
	
	checkUniqueStudentName(){
		/*var sFNameE = document.getElementById('Student-First-Name');
		var sLNameE = document.getElementById('Student-Last-Name');
		var sName = sFNameE.value+sLNameE.value;
		sName = sName.replace(/\s/g,'');
		sName = sName.toLowerCase()
		var pName = this.memberData.name;
		pName = pName.replace(/\s/g,'');
		pName = pName.toLowerCase()
		if(sName == pName){
			return false;
		}else{
			return true
		}*/
		var sENameE = document.getElementById('Student-Email');
		var sEmail = sENameE.value;
		sEmail = sEmail.replace(/\s/g,'');
		sEmail = sEmail.toLowerCase()
		var pEmail = this.memberData.email;
		pEmail = pEmail.replace(/\s/g,'');
		pEmail = pEmail.toLowerCase()
		if(sEmail == pEmail){
			return false;
		}else{
			return true
		}
	}
	handlePaymentEvent(){
		var ach_payment = document.getElementById('ach_payment');
		var card_payment = document.getElementById('card_payment');
		var paylater_payment = document.getElementById('paylater_payment');
		var $this = this;
		ach_payment.addEventListener('click', function(){
			ach_payment.innerHTML = "Processing..."
			$this.initializeStripePayment('us_bank_account', ach_payment);
		})
		card_payment.addEventListener('click', function(){
			card_payment.innerHTML = "Processing..."
			$this.initializeStripePayment('card', card_payment);
		})
		paylater_payment.addEventListener('click', function(){
			paylater_payment.innerHTML = "Processing..."
			$this.initializeStripePayment('paylater', paylater_payment);
		})
	}
	// After API response we call the createMakeUpSession method to manipulate student data 
	async renderPortalData(memberId) {
		try {
			this.handlePaymentEvent();
			this.addEventForPrevNaxt();
			this.activateDiv('checkout_program')
			var spinner = document.getElementById('half-circle-spinner');
			spinner.style.display = 'block';	
			const data = await this.fetchData('getSupplementaryProgram/5');
			this.displaySupplimentaryProgram(data)
			spinner.style.display = 'none';
		} catch (error) {
			console.error('Error rendering random number:', error);
		}
	}
}
