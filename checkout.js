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
	$checkoutData = "";
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
		var supplementaryProgramHead = document.getElementById('supplementary-program-head');
		var $this = this
		studentList.innerHTML = "";
		// Remove duplicate data like Supplementary program
		data = data.filter(item=>item.programDetailId !=this.memberData.programId);
		console.log('data', data)
		if(data.length > 0){
			supplementaryProgramHead.style.display = "block"
			data.forEach((sData)=>{
				// Getting single student list
				var sList = this.createStudentList(sData);
					studentList.appendChild(sList);
			})
		}else{
			supplementaryProgramHead.style.display = "none"
		}
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
		var spantext = creEl('span', 'core-checkbox-label w-form-label')
		wCheckbox.appendChild(spantext)
		coreCheckbox.appendChild(wCheckbox)
		
		var coreProductTitle = creEl('div', 'core-product-title')
		var h1 = creEl('h1', 'core-product-title-text')
		h1.innerHTML = suppData.label;
		var div = creEl('div','core-product-title-subtext')
		div.innerHTML = suppData.desc;
		
		var mobileResponsiveHide = creEl('div', 'mobile-responsive-hide')
		var productPriceContainer = creEl('div', 'product-price-container hide-mobile')
		var productPriceText = creEl('div', 'product-price-text')
		productPriceText.innerHTML = '$'+this.numberWithCommas(suppData.amount.toFixed(2));
		
		coreProductTitle.prepend(h1, div, productPriceText)
		
		
		productPriceContainer.appendChild(productPriceText)
		
		coreProductContainer.prepend(coreProductTitle, productPriceContainer, coreCheckbox)

		return coreProductContainer;
	}
	numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	displaySelectedSuppProgram(suppIds){
		var selectedSuppPro = document.getElementById('selected_supplimentary_program');
		selectedSuppPro.innerHTML = "";
		var selectedData = this.$suppPro.filter(item => suppIds.some(d => d == item.programDetailId))
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
		var head = creEl('p', 'dm-sans font-14 order-summary-border bold marginbottom-3');
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
		var amount = parseFloat(core_product_price.value.replace(/,/g, ''))+parseFloat(totalAmountInput.value);
		totalPriceText.innerHTML = this.numberWithCommas(amount.toFixed(2));
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
			 var amountHtml = parseFloat(core_product_price.value.replace(/,/g, ''))+parseFloat(totalAmountInput.value)+parseFloat(amount)
			 totalPriceText.innerHTML = this.numberWithCommas(amountHtml.toFixed(2))
			 totalAmountInput.value = parseFloat(totalAmountInput.value)+parseFloat(amount)
			 var arrayIds = JSON.parse(suppProIdE.value);
			 arrayIds.push(suppId);
			 selectedIds = arrayIds;
			 suppProIdE.value = JSON.stringify(arrayIds)
		  } else {
			console.log("Checkbox is not checked..", checkEvent.value);
			var amountHtml = parseFloat(core_product_price.value.replace(/,/g, ''))+ parseFloat(totalAmountInput.value)-parseFloat(amount)
			totalPriceText.innerHTML = this.numberWithCommas(amountHtml.toFixed(2))
			totalAmountInput.value	= parseFloat(totalAmountInput.value)-parseFloat(amount)
			var arrayIds = JSON.parse(suppProIdE.value);
			var allSupIds =  arrayIds.filter(i => i != suppId)
			selectedIds = allSupIds;
			suppProIdE.value = JSON.stringify(allSupIds)			
		  }
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
		var cancelUrl = new URL("https://www.nsdebatecamp.com"+window.location.pathname);
		cancelUrl.searchParams.append('returnType', 'back')
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
			"successUrl" : "https://www.nsdebatecamp.com/payment-confirmation",
			"cancelUrl" : cancelUrl,
			//"amount" : parseFloat(core_product_price.value.replace(/,/g, '')),
			"memberId" : this.memberData.memberId, 
			"programCategoryId" : this.memberData.programCategoryId,
			"supplementaryProgramIds" : JSON.parse(suppProIdE.value),
			"productType": this.memberData.productType,
			"achAmount": parseFloat(this.memberData.achAmount.replace(/,/g, '')),
			"cardAmount": parseFloat(this.memberData.cardAmount.replace(/,/g, ''))
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
			document.getElementsByClassName("bank-transfer-tab")[0].click();
			document.getElementById('w-tabs-1-data-w-tab-0').click()
			setTimeout(function(){ 
				$(".w-tab-link").removeClass("w--current");
				$(".w-tab-pane").removeClass("w--tab-active");
				Webflow.require('tabs').redraw();
			}, 2000);
			
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
			// ach_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('us_bank_account', ach_payment);
			window.location.href = $this.$checkoutData.achUrl;
		})
		card_payment.addEventListener('click', function(){
			// card_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('card', card_payment);
			window.location.href = $this.$checkoutData.cardUrl;
		})
		paylater_payment.addEventListener('click', function(){
			// paylater_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('paylater', paylater_payment);
		})
	}
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
	setUpBackButtonTab(){
		var query = window.location.search;
        var urlPar = new URLSearchParams(query);
        var returnType = urlPar.get('returnType');
		var checkoutJson= localStorage.getItem("checkOutData");
		if(returnType == 'back' && checkoutJson != undefined){
			var paymentData = JSON.parse(checkoutJson);
			console.log('checkoutData', paymentData)
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
			
			if(paymentData.supplementaryProgramIds.length > 0){
				var SuppCheckbox = document.getElementsByClassName("suppCheckbox");
				
				for (let i = 0; i < SuppCheckbox.length; i++) {
					var checkBoxProgramdetailid = SuppCheckbox[i].getAttribute('programdetailid');
					console.log('checkBoxProgramdetailid', checkBoxProgramdetailid)
					if(paymentData.supplementaryProgramIds.includes(checkBoxProgramdetailid)){
						SuppCheckbox[i].checked = true;
					}
				}
			}
			if(paymentData.checkoutData){
				this.$checkoutData = paymentData.checkoutData;
				this.activateDiv('checkout_payment');
			}
		}
	}
	// After API response we call the createMakeUpSession method to manipulate student data 
	async renderPortalData(memberId) {
		try {
			if(this.memberData.productType == 'supplementary'){
				this.updateSuppData();
			}
			this.updateDefaultCheckbox();
			this.handlePaymentEvent();
			this.addEventForPrevNaxt();
			this.activateDiv('checkout_program')
			var spinner = document.getElementById('half-circle-spinner');
			spinner.style.display = 'block';	
			const data = await this.fetchData('getSupplementaryProgram/'+this.memberData.programId);
			this.displaySupplimentaryProgram(data)
			this.setUpBackButtonTab();
			spinner.style.display = 'none';
		} catch (error) {
			console.error('Error rendering random number:', error);
		}
	}
}
