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
 * CheckOutWebflow Class is used to intigrate with stripe payment.
 * In this API we pass baseUrl, memberData.
 * In this class we are manipulating student form and member data
 */

class CheckOutWebflow {
	$suppPro = [];
	$checkoutData = "";
	constructor(apiBaseUrl, memberData) {
		this.baseUrl = apiBaseUrl;
		this.memberData = memberData;
		this.renderPortalData();
	}
	// Passing all supplimentary program data and creating cart list
	displaySupplimentaryProgram(data){
		this.$suppPro = data;
		// Getting main dom elment object to add supplementary program list with checkbox
		var studentList = document.getElementById('checkout_supplimentary_data');
		// Supplementary program heading
		var supplementaryProgramHead = document.getElementById('supplementary-program-head');
		var $this = this
		studentList.innerHTML = "";
		// Remove duplicate data like Supplementary program
		data = data.filter(item=>item.programDetailId !=this.memberData.programId);
		console.log('data', data)
		if(data.length > 0){
			// showing supplementary program heading when data in not empty
			supplementaryProgramHead.style.display = "block"
			data.forEach((sData)=>{
				// Getting single supplementary program cart list
				var sList = this.createCartList(sData);
					studentList.appendChild(sList);
			})
		}else{
			// hiding supplementary program heading when data is empty
			supplementaryProgramHead.style.display = "none"
		}
	}
	// Manipulating single supplementary program list
	createCartList(suppData){
		var coreProductContainer = creEl('div', 'core-product-container');
		var $this = this;
		
		// Creating checkbox for cart
		var coreCheckbox = creEl('div', 'core-checkbox');
		var wCheckbox = creEl('label', 'w-checkbox')
		var checkboxS = creEl('input', 'w-checkbox-input core-checkbox suppCheckbox');
		checkboxS.type ="checkbox";
		checkboxS.name ="checkbox";
		checkboxS.value =suppData.amount;
		checkboxS.setAttribute('programDetailId', suppData.programDetailId)
		checkboxS.setAttribute('data-name', 'Checkbox')
		checkboxS.addEventListener('change', function() {
		 $this.updateAmount(this, suppData.amount)
		});
		wCheckbox.appendChild(checkboxS)
		var spantext = creEl('span', 'core-checkbox-label w-form-label')
		wCheckbox.appendChild(spantext)
		coreCheckbox.appendChild(wCheckbox)
		
		// Creating heading for supplementary program heading
		var coreProductTitle = creEl('div', 'core-product-title')
		var h1 = creEl('h1', 'core-product-title-text')
		h1.innerHTML = suppData.label;
		var div = creEl('div','core-product-title-subtext')
		div.innerHTML = suppData.desc;
		
		var mobileResponsiveHide = creEl('div', 'mobile-responsive-hide')
		// Mobile responsive price text. it will display on mobile
		var productPriceText = creEl('div', 'product-price-text')
		productPriceText.innerHTML = '$'+suppData.amount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		mobileResponsiveHide.appendChild(productPriceText)
		coreProductTitle.prepend(h1, div, mobileResponsiveHide)
		// Desktop responsive price text. it will display on mobile
		var productPriceText1 = creEl('div', 'product-price-text')
		productPriceText1.innerHTML = '$'+suppData.amount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		var productPriceContainer = creEl('div', 'product-price-container hide-mobile')
		productPriceContainer.appendChild(productPriceText1)
		// append title , price and checkbox
		coreProductContainer.prepend(coreProductTitle, productPriceContainer, coreCheckbox)

		return coreProductContainer;
	}
	// formating price in comma based value
	numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	// This method use to display selected supplementary program in sidebar
	displaySelectedSuppProgram(suppIds){
		// selected Supplementary program main dom element
		var selectedSuppPro = document.getElementById('selected_supplimentary_program');
		selectedSuppPro.innerHTML = "";
		// Filtering selected Supplementary program id from all Supplementary program data
		var selectedData = this.$suppPro.filter(item => suppIds.some(d => d == item.programDetailId))
		//Manipulating price text for with supplementary program and without
		var respricelabel = document.getElementById('res-price-label');
        var commpricelabel = document.getElementById('comm-price-label');
		if(selectedData.length == 0){
			respricelabel.innerHTML = "Total Price";
			respricelabel.innerHTML = "Total Price";
			selectedSuppPro.classList.remove('added_supp_data')
			return false;
		}else{
			respricelabel.innerHTML = "Price";
			respricelabel.innerHTML = "Price";
			selectedSuppPro.classList.add('added_supp_data')
		}
		// Selected supplementary program heading 
		var head = creEl('p', 'dm-sans font-14 order-summary-border bold marginbottom-3');
		head.innerHTML = "Supplementary Program"
		selectedSuppPro.appendChild(head);
		var label = '';
		// Added single supplementary program heading in sidebar
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
	// Method is use update supplementary program price after tab change
	updateOnlyTotalAmount(){
		// Webflow total price dom element
		var totalPriceText = document.getElementById('totalPrice');
		// core product price for resdential, commuter and online 
		var core_product_price = document.getElementById('core_product_price');
		// total amount price for supplementary program
		var totalAmountInput = document.getElementById('totalAmount');
		// manupulating total price based on selected supplementary program and core product price 
		var amount = parseFloat(core_product_price.value.replace(/,/g, ''))+parseFloat(totalAmountInput.value);
		// added total price in dom element
		totalPriceText.innerHTML = this.numberWithCommas(amount.toFixed(2));
	}
	// Update total price when checkbox clicked for supplementary program
	updateAmount(checkEvent, amount){
		// Sum of supplementary program price
		var totalAmountInput = document.getElementById('totalAmount');
		// core product price for resdential, commuter and online
		var core_product_price = document.getElementById('core_product_price');
		// Webflow total price dom element
		var totalPriceText = document.getElementById('totalPrice');
		// All added supplementary program id input fields
		var suppProIdE = document.getElementById('suppProIds');
		// selected supplementary program id
		var suppId = checkEvent.getAttribute('programDetailId')
		var selectedIds = [];
		 if (checkEvent.checked) {
			 // calulate total amount based on supplementary program price sum and core product price
			 var amountHtml = parseFloat(core_product_price.value.replace(/,/g, ''))+parseFloat(totalAmountInput.value)+parseFloat(amount)
			 totalPriceText.innerHTML = this.numberWithCommas(amountHtml.toFixed(2))
			 totalAmountInput.value = parseFloat(totalAmountInput.value)+parseFloat(amount)
			 var arrayIds = JSON.parse(suppProIdE.value);
			 arrayIds.push(suppId);
			 selectedIds = arrayIds;
			 suppProIdE.value = JSON.stringify(arrayIds)
		  } else {
			// calulate total amount based on supplementary program price sum and core product price 
			var amountHtml = parseFloat(core_product_price.value.replace(/,/g, ''))+ parseFloat(totalAmountInput.value)-parseFloat(amount)
			totalPriceText.innerHTML = this.numberWithCommas(amountHtml.toFixed(2))
			totalAmountInput.value	= parseFloat(totalAmountInput.value)-parseFloat(amount)
			var arrayIds = JSON.parse(suppProIdE.value);
			var allSupIds =  arrayIds.filter(i => i != suppId)
			selectedIds = allSupIds;
			suppProIdE.value = JSON.stringify(allSupIds)			
		  }
		  // Hide and show based on supplementary program length
		  var totalPriceDiv = document.getElementById('totalPriceDiv');
		 if(selectedIds.length > 0){
			  totalPriceDiv.style.visibility  = 'visible';
		  }else{
			  totalPriceDiv.style.visibility  = 'hidden';
		  }
		  this.displaySelectedSuppProgram(selectedIds);
		 
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
	// API call for checkout URL 
	initializeStripePayment(){
		var studentFirstName = document.getElementById('Student-First-Name');
		var studentLastName = document.getElementById('Student-Last-Name');
		var studentEmail = document.getElementById('Student-Email');
		var studentGrade = document.getElementById('Student-Grade');
		var studentSchool = document.getElementById('Student-School');
		var studentGender = document.getElementById('Student-Gender');
		var suppProIdE = document.getElementById('suppProIds');
		var core_product_price = document.getElementById('core_product_price');

		//Payment button
		var ach_payment = document.getElementById('ach_payment');
		var card_payment = document.getElementById('card_payment');
		var paylater_payment = document.getElementById('paylater_payment');
		ach_payment.innerHTML = "Processing..."
		ach_payment.disabled = true;
		card_payment.innerHTML = "Processing..."
		card_payment.disabled = true;
		paylater_payment.innerHTML = "Processing..."
		paylater_payment.disabled = true;
		//var cancelUrl = new URL("https://www.nsdebatecamp.com"+window.location.pathname);
		var cancelUrl = new URL(window.location.href);
		console.log(window.location.href)
		cancelUrl.searchParams.append('returnType', 'back')
		//console.log(cancelUrl)
		var data = {
			"email": this.memberData.email,
			"studentEmail" : studentEmail.value,
			"firstName" : studentFirstName.value,
			"lastName" : studentLastName.value,
			"grade" : studentGrade.value,
			"label": this.memberData.programName,
			"school": studentSchool.value,
			"gender": studentGender.value,
			"programId" : this.memberData.programId,
			//"paymentType" : type,
			"successUrl" : "https://www.nsdebatecamp.com/payment-confirmation?programName="+this.memberData.programName,
			"cancelUrl" : cancelUrl.href,
			//"amount" : parseFloat(core_product_price.value.replace(/,/g, '')),
			"memberId" : this.memberData.memberId, 
			"programCategoryId" : this.memberData.programCategoryId,
			"supplementaryProgramIds" : JSON.parse(suppProIdE.value),
			"productType": this.memberData.productType,
			"achAmount": parseFloat(this.memberData.achAmount.replace(/,/g, '')),
			"cardAmount": parseFloat(this.memberData.cardAmount.replace(/,/g, '')),
			"payLaterAmount": parseFloat(this.memberData.payLaterAmount.replace(/,/g, ''))
		}
		// Added paymentId for supplementary program 
		if(this.memberData.productType == 'supplementary'){
			var supStuData = localStorage.getItem("supStuEmail");
			if(supStuData != null){
				supStuData = JSON.parse(supStuData);
				if(supStuData.uniqueIdentification){
					data.paymentId = supStuData.uniqueIdentification
				}
			}
		}
		
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/createBothCheckoutUrls", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function() {
			let responseText = JSON.parse(xhr.responseText);
			console.log('responseText', responseText)
			if(responseText.success){
				// btn.innerHTML = 'Checkout';
				// window.location.href = responseText.stripe_url;

				$this.$checkoutData = responseText;

				//Storing data in local storage
				data.checkoutData = responseText
				localStorage.setItem("checkOutData", JSON.stringify(data));
				
				ach_payment.innerHTML = "Checkout"
				ach_payment.disabled = false;
				card_payment.innerHTML = "Checkout"
				card_payment.disabled = false;
				paylater_payment.innerHTML = "Checkout"
				paylater_payment.disabled = false;
			}

		}
	}
	// Hide and show tab for program selection, student infor and checkout payment
	activateDiv(divId){
		var divIds = ['checkout_program', 'checkout_student_details', 'checkout_payment'];
		 // Remove the active class from all div elements
		divIds.forEach(id => document.getElementById(id).classList.remove('active_checkout_tab'));
		// Add the active class to the div with the specified id
		document.getElementById(divId).classList.add('active_checkout_tab');
	}
	// Managing next and previous button 
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
				$this.storeBasicData();
				// validation for student email different form Parent email
				var isValidName = $this.checkUniqueStudentEmail();
				if(isValidName){
					checkoutFormError.style.display = 'none'
					$this.activateDiv('checkout_payment');
					$this.initializeStripePayment();
				}else{
					checkoutFormError.style.display = 'block'
				}
			}
		})
		prev_page_1.addEventListener('click', function(){
			$this.activateDiv('checkout_program');
		})
		prev_page_2.addEventListener('click', function(){
			// click on back button reinitialze payment tab
			document.getElementsByClassName("bank-transfer-tab")[0].click();
			//document.getElementById('w-tabs-1-data-w-tab-0').click()
			setTimeout(function(){ 
				$(".w-tab-link").removeClass("w--current");
				$(".w-tab-pane").removeClass("w--tab-active");
				Webflow.require('tabs').redraw();
			}, 2000);
			
			$this.activateDiv('checkout_student_details');
		})
	}
	// validating duplicate email 
	checkUniqueStudentEmail(){
		
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
	// handle payment button click
	handlePaymentEvent(){
		var ach_payment = document.getElementById('ach_payment');
		var card_payment = document.getElementById('card_payment');
		var paylater_payment = document.getElementById('paylater_payment');
		// Browser back button event hidden fields
		var ibackbutton = document.getElementById("backbuttonstate");
		var $this = this;
		ach_payment.addEventListener('click', function(){
			// ach_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('us_bank_account', ach_payment);
			ibackbutton.value = "1";
			window.location.href = $this.$checkoutData.achUrl;
		})
		card_payment.addEventListener('click', function(){
			// card_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('card', card_payment);
			ibackbutton.value = "1";
			window.location.href = $this.$checkoutData.cardUrl;
		})
		paylater_payment.addEventListener('click', function(){
			// paylater_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('paylater', paylater_payment);
			ibackbutton.value = "1";
			window.location.href = $this.$checkoutData.payLaterUrl;
		})
	}
	// Update student data for addon supplementary program purchase
	updateSuppData(){
		var studentFirstName = document.getElementById('Student-First-Name');
		var studentLastName = document.getElementById('Student-Last-Name');
		var studentEmail = document.getElementById('Student-Email');
		var studentGrade = document.getElementById('Student-Grade');
		var studentSchool = document.getElementById('Student-School');
		var studentGender = document.getElementById('Student-Gender');
		var supStuData = localStorage.getItem("supStuEmail");
		if(supStuData != null){
			supStuData = JSON.parse(supStuData);
			studentEmail.value = supStuData.studentEmail;
			studentEmail.readOnly = true
			studentFirstName.value = supStuData.studentName.first;
			studentFirstName.readOnly = true
			studentLastName.value = supStuData.studentName.last;
			studentLastName.readOnly = true

			if(supStuData.studentGrade){
				studentGrade.value = supStuData.studentGrade;
				studentGrade.disabled = true;
			}
			if(supStuData.school){
				studentSchool.value = supStuData.school;
				studentSchool.readOnly = true
			}
			if(supStuData.gender){
				studentGender.value = supStuData.gender;
				studentGender.disabled = true;
			}
		}
	}
	// update default checkbox checked always
	updateDefaultCheckbox(){
		var dCheckbox = document.getElementById('checkbox');
		dCheckbox.setAttribute('disabled', true)
		// Update default price
		var cPrice = document.getElementsByClassName('pCorePrice');
		for (var i = 0; i < cPrice.length; i++) {
		   let price = parseFloat(cPrice[i].innerHTML.replace(/,/g, '').replace(/\$/g, ''));
		   cPrice[i].innerHTML = '$'+this.numberWithCommas(price.toFixed(2))
		}
		
	}
	// Setup back stripe button and browser back button
	setUpBackButtonTab(){
		var query = window.location.search;
        var urlPar = new URLSearchParams(query);
        var returnType = urlPar.get('returnType');
		// Get local storage data for back button
		var checkoutJson= localStorage.getItem("checkOutData");
		// Browser back button event hidden fields
		var ibackbutton = document.getElementById("backbuttonstate");
		if((returnType == 'back' || ibackbutton.value == 1) && checkoutJson != undefined){
			var paymentData = JSON.parse(checkoutJson);
			//console.log('checkoutData', paymentData)
			
			var studentFirstName = document.getElementById('Student-First-Name');
			var studentLastName = document.getElementById('Student-Last-Name');
			var studentEmail = document.getElementById('Student-Email');
			var studentGrade = document.getElementById('Student-Grade');
			var studentSchool = document.getElementById('Student-School');
			var studentGender = document.getElementById('Student-Gender');
			// Update all local storage data
			studentEmail.value = paymentData.studentEmail;
			
			studentFirstName.value = paymentData.firstName;
			
			studentLastName.value = paymentData.lastName;
			
			if(paymentData.grade){
				studentGrade.value = paymentData.grade;
			}
			
			if(paymentData.school){
				studentSchool.value = paymentData.school;
			}
			
			if(paymentData.gender){
				studentGender.value = paymentData.gender;
			}
			
			if(paymentData.supplementaryProgramIds.length > 0){
				var SuppCheckbox = document.getElementsByClassName("suppCheckbox");
				
				for (let i = 0; i < SuppCheckbox.length; i++) {
					var checkBoxProgramdetailid = SuppCheckbox[i].getAttribute('programdetailid');
					console.log('checkBoxProgramdetailid', checkBoxProgramdetailid)
					if(paymentData.supplementaryProgramIds.includes(checkBoxProgramdetailid)){
						SuppCheckbox[i].click();
					}
				}
				//this.displaySelectedSuppProgram(paymentData.supplementaryProgramIds)
				//update total amount for back button
				//this.updateOnlyTotalAmount()
				//var totalPriceDiv = document.getElementById('totalPriceDiv');
				//totalPriceDiv.style.visibility  = 'visible';
				//Updated supp id for back button
				//var suppProIdE = document.getElementById('suppProIds');
				//suppProIdE.value = JSON.stringify(paymentData.supplementaryProgramIds)
			}
			if(paymentData.checkoutData){
				this.$checkoutData = paymentData.checkoutData;
				this.activateDiv('checkout_payment');
			}
		}else{
			// removed local storage when checkout page rendar direct without back button
			localStorage.removeItem("checkOutData");
		}
	}
	// Store student basic forms data
	storeBasicData(){
		var studentFirstName = document.getElementById('Student-First-Name');
		var studentLastName = document.getElementById('Student-Last-Name');
		var studentEmail = document.getElementById('Student-Email');
		var studentGrade = document.getElementById('Student-Grade');
		var studentSchool = document.getElementById('Student-School');
		var studentGender = document.getElementById('Student-Gender');
		var suppProIdE = document.getElementById('suppProIds');
		//save data in local storage
		var data = {
			"studentEmail" : studentEmail.value,
			"firstName" : studentFirstName.value,
			"lastName" : studentLastName.value,
			"grade" : studentGrade.value,
			"label": this.memberData.programName,
			"school": studentSchool.value,
			"gender": studentGender.value,
		}
		localStorage.setItem("checkOutBasicData", JSON.stringify(data));
	}
	// Update Basic data after reload
	updateBasicData(){
		var checkoutJson= localStorage.getItem("checkOutBasicData");
		if(checkoutJson != undefined){
			var paymentData = JSON.parse(checkoutJson);
			var studentFirstName = document.getElementById('Student-First-Name');
			var studentLastName = document.getElementById('Student-Last-Name');
			var studentEmail = document.getElementById('Student-Email');
			var studentGrade = document.getElementById('Student-Grade');
			var studentSchool = document.getElementById('Student-School');
			var studentGender = document.getElementById('Student-Gender');
			
			studentEmail.value = paymentData.studentEmail;
				
			studentFirstName.value = paymentData.firstName;
			
			studentLastName.value = paymentData.lastName;
			
			if(paymentData.grade){
				studentGrade.value = paymentData.grade;
			}
			
			if(paymentData.school){
				studentSchool.value = paymentData.school;
			}
			
			if(paymentData.gender){
				studentGender.value = paymentData.gender;
			}
		}
	}
	// After API response we call the createMakeUpSession method to manipulate student data 
	async renderPortalData(memberId) {
		try {
			// Update student data for purchase addon Supplementary program
			if(this.memberData.productType == 'supplementary'){
				this.updateSuppData();
			}
			// Update readOnly for core program
			this.updateDefaultCheckbox();
			// Handle checkout button
			this.handlePaymentEvent();
			// Handle previous and next button
			this.addEventForPrevNaxt();
			// activate program tab
			this.activateDiv('checkout_program')
			// loader icon code
			var spinner = document.getElementById('half-circle-spinner');
			spinner.style.display = 'block';
			// API call
			const data = await this.fetchData('getSupplementaryProgram/'+this.memberData.programId);
			// Display supplementary program
			this.displaySupplimentaryProgram(data)
			// Setup back button for browser and stripe checkout page
			this.setUpBackButtonTab();
			// Update basic data
			this.updateBasicData();
			// Hide spinner 
			spinner.style.display = 'none';
		} catch (error) {
			console.error('Error rendering random number:', error);
		}
	}
}
