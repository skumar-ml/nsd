/**
 *
 * @param name - HTML element name
 * @param className - HTML element class attribute
 * @param idName - HTML element id attribute
 */
function creEl(name, className, idName) {
	var el = document.createElement(name);
	if (className) {
		el.className = className;
	}
	if (idName) {
		el.setAttribute("id", idName);
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
	$checkOutResponse = false;
	$initCheckout = null;
	$selectedProgram = []
	constructor(apiBaseUrl, memberData) {
		this.baseUrl = apiBaseUrl;
		this.memberData = memberData;
		this.renderPortalData();
	}
	// Create tags
	createTags(suppData) {
		var html = "";

		if (!suppData.tags) return html;

		html += '<div class="programe-tag__box">';
		suppData.tags.forEach(function (tag) {
			html += `<span class="pills" style="background: ${tag.color}">${tag.name}</span>`;
		});
		html += "</div>";

		return html;
	}

	// Manipulating single supplementary program list
	createCartList(suppData) {
		var coreProductContainer = creEl("div", "core-product-container");
		var $this = this;

		// Creating checkbox for cart
		var coreCheckbox = creEl("div", "core-checkbox");
		var wCheckbox = creEl("label", "w-checkbox");
		var checkboxS = creEl("input", "w-checkbox-input core-checkbox suppCheckbox");
		checkboxS.type = "checkbox";
		checkboxS.name = "checkbox";
		checkboxS.value = suppData.amount;
		checkboxS.setAttribute("programDetailId", suppData.programDetailId);
		checkboxS.setAttribute("data-name", "Checkbox");
		checkboxS.addEventListener("change", function () {
			$this.updateAmount(this, suppData.amount);
		});
		wCheckbox.appendChild(checkboxS);
		var spantext = creEl("span", "core-checkbox-label w-form-label");
		wCheckbox.appendChild(spantext);
		coreCheckbox.appendChild(wCheckbox);

		// Create supplementary program tags
		var tags = this.createTags(suppData);
		var tagsWapper = creEl("div", "programe-tag__wrapper");
		tagsWapper.innerHTML = tags;

		// Creating heading for supplementary program heading
		var coreProductTitle = creEl("div", "core-product-title");
		var h1 = creEl("h1", "core-product-title-text");
		h1.innerHTML = suppData.label;
		// var div = creEl("div", "core-product-title-subtext");
		// div.innerHTML = suppData.desc;
		var div = creEl("div", "save_price");
		div.innerHTML = "Save $" + (suppData.disc_amount - suppData.amount).toFixed(2).toString();

		var mobileResponsiveHide = creEl("div", "mobile-responsive-hide");

		// Price text discount
		var productPriceTextDiscount = creEl("div", "strike_price");
		productPriceTextDiscount.innerHTML =
			"$" +
			suppData.disc_amount
			.toFixed(2)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		mobileResponsiveHide.appendChild(productPriceTextDiscount);

		// Mobile responsive price text. it will display on mobile
		var productPriceText = creEl("div", "product-price-text");
		productPriceText.innerHTML =
			"$" +
			suppData.amount
			.toFixed(2)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		mobileResponsiveHide.appendChild(productPriceText);
		coreProductTitle.prepend(tagsWapper, h1, div, mobileResponsiveHide);

		// price container
		var productPriceContainer = creEl("div", "product-price-container hide-mobile");

		// Price text discount
		var productPriceTextDiscount1 = creEl("div", "strike_price");
		productPriceTextDiscount1.innerHTML =
			"$" +
			suppData.disc_amount
			.toFixed(2)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		productPriceContainer.appendChild(productPriceTextDiscount1);

		// Desktop responsive price text. it will display on mobile
		var productPriceText1 = creEl("div", "product-price-text");
		productPriceText1.innerHTML =
			"$" +
			suppData.amount
			.toFixed(2)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		productPriceContainer.appendChild(productPriceText1);
		// append title , price and checkbox
		coreProductContainer.prepend(coreProductTitle, productPriceContainer, coreCheckbox);

		return coreProductContainer;
	}
	// formating price in comma based value
	numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	displaySelectedSuppProgram(selectedIds) {
		var selectedSuppPro = document.getElementById("selected_supplimentary_program");
		var selectedSuppProMob = document.getElementById("selected_supplimentary_program_mob");
		selectedSuppPro.innerHTML = "";
		selectedSuppProMob.innerHTML = "";
		this.displaySelectedSuppPrograms(selectedIds, selectedSuppPro);
		this.displaySelectedSuppPrograms(selectedIds, selectedSuppProMob);
	}
	// This method use to display selected supplementary program in sidebar
	displaySelectedSuppPrograms(suppIds, selectedSuppPro) {
		var $this = this;
		// Filtering selected Supplementary program id from all Supplementary program data
		var selectedData = this.$suppPro.filter((item) =>
			suppIds.some((d) => d == item.programDetailId)
		);
		//Manipulating price text for with supplementary program and without
		var respricelabel = document.getElementById("res-price-label");
		var commpricelabel = document.getElementById("comm-price-label");
		if (selectedData.length == 0) {
			respricelabel.innerHTML = "Total Price";
			respricelabel.innerHTML = "Total Price";
			selectedSuppPro.classList.remove("added_supp_data");
			return false;
		} else {
			respricelabel.innerHTML = "Price";
			respricelabel.innerHTML = "Price";
			selectedSuppPro.classList.add("added_supp_data");
		}



		// Selected supplementary program list
		// Heading for supplementary program with icon
		let headContainer = creEl('div', 'horizontal-div supp-program')
		let head = creEl("p", "dm-sans bold-700");
		head.innerHTML = "Supplementary Program";
		headContainer.prepend(head);
		selectedSuppPro.appendChild(headContainer);

		// Supplementary program name and price list

		selectedData.forEach((sup) => {
			var suppProDiv = creEl('div', 'horizontal-div align-left');
			let suppleHeadingDiv = creEl('div', 'horizontal-div supplementary')

			let offeringType = creEl("div", "dm-sans offering-type");
			offeringType.innerHTML = sup.label;

			let offeringRemove = creEl("div", "dm-sans offering-remove");
			offeringRemove.innerHTML = "Remove";
			offeringRemove.addEventListener("click", function () {
				$this.removeSuppProgram(sup.programDetailId)
			})

			suppleHeadingDiv.prepend(offeringType, offeringRemove)

			let OfferingPrice = creEl("div", "dm-sans offering-price");
			OfferingPrice.innerHTML = "$" + parseFloat(sup.amount).toFixed(2);
			suppProDiv.prepend(suppleHeadingDiv, OfferingPrice);
			selectedSuppPro.appendChild(suppProDiv);
		});


	}
	removeSuppProgram(suppId) {
		var suppProIdE = document.getElementById("suppProIds");
		var arrayIds = JSON.parse(suppProIdE.value);
		if (arrayIds.length > 0) {
			arrayIds.push(suppId);
			arrayIds = arrayIds.filter(i => i != suppId)
			suppProIdE.value = JSON.stringify(arrayIds);
			this.displaySelectedSuppProgram(arrayIds);
			const checkboxEl = document.querySelectorAll(".suppCheckbox");
			checkboxEl.forEach(checkbox => {
				let programDetailId = checkbox.getAttribute('programdetailid')
				if (programDetailId == suppId) {

					// Find the closest parent div
					const parentDiv = checkbox.closest('div').parentElement;
					if (checkbox.checked) {
						checkbox.checked = !checkbox.checked
						this.updateAmount(checkbox, checkbox.value);
						if(checkbox.closest('.you-might_slide-item')){
							checkbox.closest('.you-might_slide-item').classList.toggle('border-red')
						}	
					}

					// Find the corresponding "add-to-card" button inside the same parent div
					const addToCardButton = parentDiv.querySelector('.add-to-card');
					if (addToCardButton != undefined) {
						//checkbox.checked = !checkbox.checked
						// Change the button's innerHTML based on the checkbox state
						//if (!checkbox.checked) {
						addToCardButton.innerHTML = 'Add to Cart';
						addToCardButton.classList.remove('disabled');
						addToCardButton.style.pointerEvents = 'auto';
						addToCardButton.style.color = '';
						addToCardButton.style.backgroundColor = '#a51c30'
						addToCardButton.style.textDecoration = "none";
						// } else {
						// 	addToCardButton.innerHTML = 'Added';
						// 	addToCardButton.classList.add('disabled');
						// 	addToCardButton.style.pointerEvents = 'none';
						// 	addToCardButton.style.color = 'gray';
						// }
					}

				}

			})
		}
	}
	// Method is use update supplementary program price after tab change
	updateOnlyTotalAmount() {
		// Webflow total price dom element
		var totalPriceText = document.getElementById("totalPrice");
		// core product price for resdential, commuter and online
		var core_product_price = document.getElementById("core_product_price");
		// total amount price for supplementary program
		var totalAmountInput = document.getElementById("totalAmount");
		// manupulating total price based on selected supplementary program and core product price
		var amount =
			parseFloat(core_product_price.value.replace(/,/g, "")) + parseFloat(totalAmountInput.value);
		// added total price in dom element
		totalPriceText.innerHTML = this.numberWithCommas(amount.toFixed(2));

		// Webflow total price dom element
		var totalPriceTextMob = document.getElementById("totalPriceMobile");
		if (totalPriceTextMob) {
			// added total price in dom element
			totalPriceTextMob.innerHTML = this.numberWithCommas(amount.toFixed(2));
		}
	}
	// Update total price when checkbox clicked for supplementary program
	updateAmount(checkEvent, amount) {
		// Sum of supplementary program price
		var totalAmountInput = document.getElementById("totalAmount");
		// core product price for resdential, commuter and online
		var core_product_price = document.getElementById("core_product_price");
		// Webflow total price dom element
		var totalPriceText = document.getElementById("totalPrice");
		// Webflow total price dom element
		var totalPriceTextMob = document.getElementById("totalPriceMobile");
		// All added supplementary program id input fields
		var suppProIdE = document.getElementById("suppProIds");
		// selected supplementary program id
		var suppId = checkEvent.getAttribute("programDetailId");
		var selectedIds = [];
		if (checkEvent.checked) {
			// calulate total amount based on supplementary program price sum and core product price
			var amountHtml =
				parseFloat(core_product_price.value.replace(/,/g, "")) +
				parseFloat(totalAmountInput.value) +
				parseFloat(amount);
			totalPriceText.innerHTML = this.numberWithCommas(amountHtml.toFixed(2));
			if (totalPriceTextMob) {
				totalPriceTextMob.innerHTML = this.numberWithCommas(amountHtml.toFixed(2));
			}

			totalAmountInput.value = parseFloat(totalAmountInput.value) + parseFloat(amount);
			var arrayIds = JSON.parse(suppProIdE.value);
			arrayIds.push(suppId);
			selectedIds = arrayIds;
			suppProIdE.value = JSON.stringify(arrayIds);
		} else {
			// calulate total amount based on supplementary program price sum and core product price
			var amountHtml =
				parseFloat(core_product_price.value.replace(/,/g, "")) +
				parseFloat(totalAmountInput.value) -
				parseFloat(amount);
			totalPriceText.innerHTML = this.numberWithCommas(amountHtml.toFixed(2));
			if (totalPriceTextMob) {
				totalPriceTextMob.innerHTML = this.numberWithCommas(amountHtml.toFixed(2));
			}
			totalAmountInput.value = parseFloat(totalAmountInput.value) - parseFloat(amount);
			var arrayIds = JSON.parse(suppProIdE.value);
			var allSupIds = arrayIds.filter((i) => i != suppId);
			selectedIds = allSupIds;
			suppProIdE.value = JSON.stringify(allSupIds);
		}
		// Hide and show based on supplementary program length
		var totalPriceDiv = document.getElementById("totalPriceDiv");
		if (selectedIds.length > 0) {
			totalPriceDiv.classList.add('show');
		} else {
			totalPriceDiv.classList.remove('show');
		}
		// Hide and show based on supplementary program length
		var totalPriceDiv = document.getElementById("totalPriceDivMob");
		if (totalPriceDiv != undefined) {
			if (selectedIds.length > 0) {
				totalPriceDiv.classList.add('show');
			} else {
				totalPriceDiv.classList.remove('show');
			}
		}
		this.displaySelectedSuppProgram(selectedIds);
	}
	// Get API data with the help of endpoint
	async fetchData(endpoint) {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`);
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error fetching data:", error);
			throw error;
		}
	}
	// API call for checkout URL 
	initializeStripePayment(paymentType = "", checkoutID = "", $baseUrl="createCheckoutUrlsByProgram") {
		return new Promise((resolve, reject) => {
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
			cancelUrl.searchParams.append('returnType', 'back')
			
			var data = {
				"email": this.memberData.email,
				"label": this.memberData.programName,
				"programId": this.memberData.programId,
				"successUrl": this.memberData.site_url + "payment-confirmation?programId=" + this.memberData.programId,
				"cancelUrl": cancelUrl.href,
				//"cancelUrl": "https://www.nsdebatecamp.com/",
				"memberId": this.memberData.memberId,
				"programCategoryId": this.memberData.programCategoryId,
				"supplementaryProgramIds": JSON.parse(suppProIdE.value),
				"productType": this.memberData.productType,
				"achAmount": parseFloat(this.memberData.achAmount.replace(/,/g, '')),
				"cardAmount": parseFloat(this.memberData.cardAmount.replace(/,/g, '')),
				"payLaterAmount": parseFloat(this.memberData.payLaterAmount.replace(/,/g, '')),
				"device": (/Mobi|Android/i.test(navigator.userAgent)) ? 'Mobile' : 'Desktop',
				"deviceUserAgent": navigator.userAgent
			}
			if($baseUrl == "createCheckoutUrlsByProgram"){
				data.source = "cart_page"
			}
			// Added paymentId for supplementary program 
			if (this.memberData.productType == 'supplementary') {
				var supStuData = localStorage.getItem("supStuEmail");
				if (supStuData != null) {
					supStuData = JSON.parse(supStuData);
					if (supStuData.uniqueIdentification) {
						data.paymentId = supStuData.uniqueIdentification
					}
				}
			}
			if (checkoutID) {
				data.checkoutId = checkoutID
				data.paymentType = paymentType
				//console.log('data', data)
				//return true;
			}
			
			var xhr = new XMLHttpRequest()
			var $this = this;
			xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/"+$baseUrl, true)
			xhr.withCredentials = false
			xhr.send(JSON.stringify(data))
			xhr.onload = function () {
				if(xhr.responseText == null){
					alert("Something went wrong. Please try again after some time.")
				}
				let responseText = JSON.parse(xhr.responseText);
				if (responseText.success) {
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
					$this.$checkOutResponse = true;
					resolve(responseText);
				} else {
					reject(new Error('API call failed'));
				}

			}
		});
	}
	/**
	 * For automation testing updating checkout url in hidden field
	 */
	addSessionId() {
		var localCheckOutData = localStorage.getItem('checkOutData')
		if (localCheckOutData != undefined) {
			var localCheckOutData = JSON.parse(localCheckOutData);
			var achUrlSession = creEl("input", "achUrlSession", "achUrlSession");
			achUrlSession.type = "hidden";
			achUrlSession.value = localCheckOutData.checkoutData.achUrl;
			var cardUrlSession = creEl("input", "cardUrlSession", "cardUrlSession");
			cardUrlSession.type = "hidden";
			cardUrlSession.value = localCheckOutData.checkoutData.cardUrl;
			var payLaterSession = creEl("input", "payLaterUrlSession", "payLaterUrlSession");
			payLaterSession.type = "hidden";
			payLaterSession.value = localCheckOutData.checkoutData.payLaterUrl;
			var checkout_student_details = document.getElementById('checkout_student_details');
			checkout_student_details.appendChild(achUrlSession)
			checkout_student_details.appendChild(cardUrlSession)
			checkout_student_details.appendChild(payLaterSession)
		}
	}
	// API call for checkout URL 
	updateStudentDetails(checkoutUrl) {
		return new Promise((resolve, reject) => {
			var studentFirstName = document.getElementById('Student-First-Name');
			var studentLastName = document.getElementById('Student-Last-Name');
			var studentEmail = document.getElementById('Student-Email');
			var studentGrade = document.getElementById('Student-Grade');
			var studentSchool = document.getElementById('Student-School');
			var studentGender = document.getElementById('Student-Gender');
			var suppProIdE = document.getElementById('suppProIds');
			var core_product_price = document.getElementById('core_product_price');
			//Utm Source
			let localUtmSource = localStorage.getItem("utm_source");
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
			cancelUrl.searchParams.append('returnType', 'back')
			let studentEmailValue = studentEmail.value;
			let lowercaseStudentEmailValue = studentEmailValue.toLowerCase()
			var data = {
				"studentEmail": lowercaseStudentEmailValue,
				"firstName": studentFirstName.value,
				"lastName": studentLastName.value,
				"grade": studentGrade.value,
				"label": this.memberData.programName,
				"school": studentSchool.value,
				"gender": studentGender.value,
				"memberId": this.memberData.memberId,
				"checkoutUrls": checkoutUrl,
				"utm_source": (localUtmSource != null) ? localUtmSource : "null"
			}
			var checkoutData = localStorage.getItem('checkOutData');
			var mergedData = {
				...data,
				...JSON.parse(checkoutData)
			}
			localStorage.setItem("checkOutData", JSON.stringify(mergedData));
			var xhr = new XMLHttpRequest()
			var $this = this;

			xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/updateStripeCheckoutDb", true)
			xhr.withCredentials = false
			xhr.send(JSON.stringify(data))
			xhr.onload = function () {
				ach_payment.innerHTML = "Checkout"
				ach_payment.disabled = false;
				card_payment.innerHTML = "Checkout"
				card_payment.disabled = false;
				paylater_payment.innerHTML = "Checkout"
				paylater_payment.disabled = false;
				$this.addSessionId()
				resolve(true);
			}
		});
	}
	// Hide and show tab for program selection, student infor and checkout payment
	activateDiv(divId) {
		var divIds = ["checkout_program", "checkout_student_details", "checkout_payment"];
		// Remove the active class from all div elements
		divIds.forEach((id) => document.getElementById(id).classList.remove("active_checkout_tab"));
		// Add the active class to the div with the specified id
		document.getElementById(divId).classList.add("active_checkout_tab");
	}
	// Managing next and previous button
	addEventForPrevNaxt() {
		var initialCheckout = null
		var next_page_1 = document.getElementById("next_page_1");
		var next_page_2 = document.getElementById("next_page_2");
		var prev_page_1 = document.getElementById("prev_page_1");
		var prev_page_2 = document.getElementById("prev_page_2");
		var checkoutFormError = document.getElementById("checkout-form-error");
		var $this = this;
		var form = $("#checkout-form");
		next_page_1.addEventListener("click", function () {
			$this.activateDiv("checkout_student_details");
			//initialCheckout = $this.initializeStripePayment();
		});
		next_page_2.addEventListener("click", function () {

			if (form.valid()) {
				initialCheckout = $this.initializeStripePayment();
				$this.storeBasicData();
				// validation for student email different form Parent email
				var isValidName = $this.checkUniqueStudentEmail();
				if (isValidName) {
					checkoutFormError.style.display = "none";
					$this.activateDiv("checkout_payment");
					if (initialCheckout) {
						initialCheckout.then(() => {
							var checkoutData = [$this.$checkoutData.achUrl, $this.$checkoutData.cardUrl, $this.$checkoutData.payLaterUrl];
							$this.updateStudentDetails(checkoutData).then(()=>{
								$this.$initCheckout = true;
							});
						})
					}
					$this.hideAndShowWhyFamilies('why-families-div', 'none')
					$this.hideAndShowByClass('rated-debate-banner', 'none')
					$this.hideShowDivById('checkout-supplimentary-data-2', 'block')
					$this.hideShowDivById('checkout-supplimentary-data-desktop', 'block')
					//$this.hideShowDivById('checkout-supplimentary-data-mobile', 'block')
					$this.initSlickSlider();
					$this.hideShowCartVideo('hide');
					$this.activeBreadCrumb('pay-deposite')
					$this.displayUpSellModal();
				} else {
					checkoutFormError.style.display = "block";
				}
			}
		});
		prev_page_1.addEventListener("click", function () {
			$this.activateDiv("checkout_program");
		});
		prev_page_2.addEventListener("click", function () {
			// click on back button reinitialze payment tab
			document.getElementsByClassName("bank-transfer-tab")[0].click();
			document.getElementById('pay-now-link').closest('div').style.display = "none";
			document.getElementById('pay-now-link-2').closest('div').style.display = "none";
			document.getElementById('pay-now-link-3').closest('div').style.display = "none";
			$this.hideShowDivById('checkout-supplimentary-data-2', 'none')
			$this.hideShowDivById('checkout-supplimentary-data-desktop', 'none')
			//$this.hideShowDivById('checkout-supplimentary-data-mobile', 'none')
			$this.hideAndShowWhyFamilies('why-families-div', 'block')
			$this.hideAndShowByClass('rated-debate-banner', 'flex')
			$this.hideShowCartVideo('show');
			$this.activeBreadCrumb('student-details')
			//document.getElementById('w-tabs-1-data-w-tab-0').click()
			setTimeout(function () {
				$(".w-tab-link").removeClass("w--current");
				$(".w-tab-pane").removeClass("w--tab-active");
				Webflow.require("tabs").redraw();
			}, 2000);

			$this.activateDiv("checkout_student_details");
		});
	}
	// validating duplicate email
	checkUniqueStudentEmail() {
		var sENameE = document.getElementById("Student-Email");
		var sEmail = sENameE.value;
		sEmail = sEmail.replace(/\s/g, "");
		sEmail = sEmail.toLowerCase();
		var pEmail = this.memberData.email;
		pEmail = pEmail.replace(/\s/g, "");
		pEmail = pEmail.toLowerCase();
		if (sEmail == pEmail) {
			return false;
		} else {
			return true;
		}
	}
	// handle payment button click
	handlePaymentEvent() {
		var ach_payment = document.getElementById("ach_payment");
		var card_payment = document.getElementById("card_payment");
		var paylater_payment = document.getElementById("paylater_payment");
		// Browser back button event hidden fields
		var ibackbutton = document.getElementById("backbuttonstate");
		var $this = this;
		// let payNowLink = document.getElementById('pay-now-link');
		// let payNowLinkMob = document.getElementById('pay-now-link-2');
		ach_payment.addEventListener("click", function () {
			let suppProIdE = document.getElementById('suppProIds');
			let suppProIds = JSON.parse(suppProIdE.value)
			// ach_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('us_bank_account', ach_payment);
			if (suppProIds.length > 0) {
				// payNowLink.innerHTML = "Processing.."
				// payNowLinkMob.innerHTML = "Processing.."
				var myInterval1 =  setInterval(() => {
					if($this.$initCheckout){
						clearInterval(myInterval1);
						let initialCheckout = $this.initializeStripePayment('us_bank_account', $this.$checkoutData.checkoutId, "updateStripeCheckoutDb");
						if (initialCheckout) {
							initialCheckout.then(() => {
								ibackbutton.value = "1";
								//payNowLink.innerHTML = "Pay Now"
								window.location.href = $this.$checkoutData.achUrl;
								
							})
						}
					}
				}, 1000);
			} else {
				var myInterval2 =  setInterval(() => {
					if($this.$initCheckout){
						clearInterval(myInterval2);
						ibackbutton.value = "1";
						window.location.href = $this.$checkoutData.achUrl;
					}
				}, 1000);
			}
		});
		card_payment.addEventListener("click", function () {
			let suppProIdE = document.getElementById('suppProIds');
			let suppProIds = JSON.parse(suppProIdE.value)
			// card_payment.innerHTML = "Processing..."
			if (suppProIds.length > 0) {
				// payNowLink.innerHTML = "Processing.."
				// payNowLinkMob.innerHTML = "Processing.."
				var myInterval3 =  setInterval(() => {
					if($this.$initCheckout){
						clearInterval(myInterval3);
						let initialCheckout = $this.initializeStripePayment('card', $this.$checkoutData.checkoutId, "updateStripeCheckoutDb");
						if (initialCheckout) {
							initialCheckout.then(() => {
								ibackbutton.value = "1";
								//payNowLink.innerHTML = "Pay Now"
								window.location.href = $this.$checkoutData.cardUrl;
							})
						}
					}
				}, 1000);
			} else {
				var myInterval4 =  setInterval(() => {
					if($this.$initCheckout){
						clearInterval(myInterval4);
						ibackbutton.value = "1";
						window.location.href = $this.$checkoutData.cardUrl;
					}
				}, 1000);
			}
		});
		paylater_payment.addEventListener("click", function () {
			let suppProIdE = document.getElementById('suppProIds');
			let suppProIds = JSON.parse(suppProIdE.value)
			// paylater_payment.innerHTML = "Processing..."
			if (suppProIds.length > 0) {
				// payNowLink.innerHTML = "Processing.."
				// payNowLinkMob.innerHTML = "Processing.."
				var myInterval5 =  setInterval(() => {
					if($this.$initCheckout){
						clearInterval(myInterval5);
						let initialCheckout = $this.initializeStripePayment('affirm', $this.$checkoutData.checkoutId, "updateStripeCheckoutDb");
						if (initialCheckout) {
							initialCheckout.then(() => {
								ibackbutton.value = "1";
								//payNowLink.innerHTML = "Pay Now"
								window.location.href = $this.$checkoutData.payLaterUrl;
							})
						}
					}
				}, 1000);
			} else {
				var myInterval6 =  setInterval(() => {
					if($this.$initCheckout){
						clearInterval(myInterval6);
						ibackbutton.value = "1";
						window.location.href = $this.$checkoutData.payLaterUrl;
					}
				}, 1000);
			}
		});
	}
	// Update student data for addon supplementary program purchase
	updateSuppData() {
		var studentFirstName = document.getElementById("Student-First-Name");
		var studentLastName = document.getElementById("Student-Last-Name");
		var studentEmail = document.getElementById("Student-Email");
		var studentGrade = document.getElementById("Student-Grade");
		var studentSchool = document.getElementById("Student-School");
		var studentGender = document.getElementById("Student-Gender");
		var supStuData = localStorage.getItem("supStuEmail");
		if (supStuData != null) {
			supStuData = JSON.parse(supStuData);
			studentEmail.value = supStuData.studentEmail;
			studentEmail.readOnly = true;
			studentFirstName.value = supStuData.studentName.first;
			studentFirstName.readOnly = true;
			studentLastName.value = supStuData.studentName.last;
			studentLastName.readOnly = true;

			if (supStuData.studentGrade) {
				studentGrade.value = supStuData.studentGrade;
				studentGrade.disabled = true;
			}
			if (supStuData.school) {
				studentSchool.value = supStuData.school;
				studentSchool.readOnly = true;
			}
			if (supStuData.gender) {
				studentGender.value = supStuData.gender;
				studentGender.disabled = true;
			}
		}
	}
	// update default checkbox checked always
	updateDefaultCheckbox() {
		var dCheckbox = document.getElementById("checkbox");
		dCheckbox.setAttribute("disabled", true);
		// Update default price
		var cPrice = document.getElementsByClassName("pCorePrice");
		for (var i = 0; i < cPrice.length; i++) {
			let price = parseFloat(cPrice[i].innerHTML.replace(/,/g, "").replace(/\$/g, ""));
			cPrice[i].innerHTML = "$" + this.numberWithCommas(price.toFixed(2));
		}
	}
	// Setup back stripe button and browser back button
	setUpBackButtonTab() {
		var query = window.location.search;
		var urlPar = new URLSearchParams(query);
		var returnType = urlPar.get("returnType");
		// Get local storage data for back button
		var checkoutJson = localStorage.getItem("checkOutData");
		// Browser back button event hidden fields
		var ibackbutton = document.getElementById("backbuttonstate");
		//if ((returnType == "back" || ibackbutton.value == 1) && checkoutJson != undefined) {
		if (checkoutJson != undefined) {
			var paymentData = JSON.parse(checkoutJson);
			this.addSessionId()
			this.uncheckAllCardCheckbox();
			var studentFirstName = document.getElementById("Student-First-Name");
			var studentLastName = document.getElementById("Student-Last-Name");
			var studentEmail = document.getElementById("Student-Email");
			var studentGrade = document.getElementById("Student-Grade");
			var studentSchool = document.getElementById("Student-School");
			var studentGender = document.getElementById("Student-Gender");
			// Update all local storage data
			studentEmail.value = paymentData.studentEmail;

			studentFirstName.value = paymentData.firstName;

			studentLastName.value = paymentData.lastName;

			if (paymentData.grade) {
				studentGrade.value = paymentData.grade;
			}

			if (paymentData.school) {
				studentSchool.value = paymentData.school;
			}

			if (paymentData.gender) {
				studentGender.value = paymentData.gender;
			}

			if (paymentData.supplementaryProgramIds.length > 0) {
				var SuppCheckbox = document.getElementsByClassName("suppCheckbox");

				for (let i = 0; i < SuppCheckbox.length; i++) {
					var checkBoxProgramdetailid = SuppCheckbox[i].getAttribute("programdetailid");
					if (paymentData.supplementaryProgramIds.includes(checkBoxProgramdetailid)) {
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
			if (paymentData.checkoutData) {
				this.$checkoutData = paymentData.checkoutData;
				//this.activateDiv("checkout_payment");
			}
		} else {
			// removed local storage when checkout page rendar direct without back button
			localStorage.removeItem("checkOutData");
		}
	}
	// Store student basic forms data
	storeBasicData() {
		var studentFirstName = document.getElementById("Student-First-Name");
		var studentLastName = document.getElementById("Student-Last-Name");
		var studentEmail = document.getElementById("Student-Email");
		var studentGrade = document.getElementById("Student-Grade");
		var studentSchool = document.getElementById("Student-School");
		var studentGender = document.getElementById("Student-Gender");
		var suppProIdE = document.getElementById("suppProIds");
		//save data in local storage
		var data = {
			studentEmail: studentEmail.value,
			firstName: studentFirstName.value,
			lastName: studentLastName.value,
			grade: studentGrade.value,
			label: this.memberData.programName,
			school: studentSchool.value,
			gender: studentGender.value,
		};
		localStorage.setItem("checkOutBasicData", JSON.stringify(data));
	}
	// Update Basic data after reload
	updateBasicData() {
		var checkoutJson = localStorage.getItem("checkOutBasicData");
		if (checkoutJson != undefined) {
			var paymentData = JSON.parse(checkoutJson);
			var studentFirstName = document.getElementById("Student-First-Name");
			var studentLastName = document.getElementById("Student-Last-Name");
			var studentEmail = document.getElementById("Student-Email");
			var studentGrade = document.getElementById("Student-Grade");
			var studentSchool = document.getElementById("Student-School");
			var studentGender = document.getElementById("Student-Gender");

			studentEmail.value = paymentData.studentEmail;

			studentFirstName.value = paymentData.firstName;

			studentLastName.value = paymentData.lastName;

			if (paymentData.grade) {
				studentGrade.value = paymentData.grade;
			}

			if (paymentData.school) {
				studentSchool.value = paymentData.school;
			}

			if (paymentData.gender) {
				studentGender.value = paymentData.gender;
			}
		}
	}
	// After API response we call the createMakeUpSession method to manipulate student data
	async renderPortalData(memberId) {
		try {
			
			// Update readOnly for core program
			//this.updateDefaultCheckbox();
			// Handle checkout button
			this.handlePaymentEvent();
			// Handle previous and next button
			this.addEventForPrevNaxt();
			// activate program tab
			this.activateDiv("checkout_student_details");
			// loader icon code
			var spinner = document.getElementById("half-circle-spinner");
			spinner.style.display = "block";

			// Setup back button for browser and stripe checkout page
			this.setUpBackButtonTab();
			// Update basic data
			this.updateBasicData();
			// Update student data for purchase addon Supplementary program
			if (this.memberData.productType == "supplementary") {
				this.updateSuppData();
			}
			// Hide spinner
			spinner.style.display = "none";
			this.displaySupplementaryProgram();
			this.updateOldStudentList();
			this.eventForPayNowBtn()
		} catch (error) {
			console.error("Error rendering random number:", error);
		}
	}


	eventForPayNowBtn() {
		let payNowLink = document.getElementById('pay-now-link');
		payNowLink.addEventListener("click", function (e) {
			e.preventDefault();
			payNowLink.style.pointerEvents = "none";
			payNowLink.innerHTML = "Processing..";
			console.log("click payNow Button")
			let activePaymentLink = document.querySelector('.checkout_payment .w--tab-active a');
			activePaymentLink.click();
		})
		// Mobile PayNow link
		let payNowLinkMo = document.getElementById('pay-now-link-2');
		payNowLinkMo.addEventListener("click", function (e) {
			e.preventDefault();
			payNowLinkMo.style.pointerEvents = "none";
			payNowLinkMo.innerHTML = "Processing..";
			console.log("click payNow Button")
			let activePaymentLink = document.querySelector('.checkout_payment .w--tab-active a');
			activePaymentLink.click();
		})

		// New desktop button link
		let payNowLink3 = document.getElementById('pay-now-link-3');
		payNowLink3.addEventListener("click", function (e) {
			e.preventDefault();
			payNowLink3.style.pointerEvents = "none";
			payNowLink3.innerHTML = "Processing..";
			console.log("click payNow Button")
			let activePaymentLink = document.querySelector('.checkout_payment .w--tab-active a');
			activePaymentLink.click();
		})

		var allTabs = document.getElementsByClassName("checkout-tab-link");
		for (var i = 0; i < allTabs.length; i++) {
			var tab = allTabs[i];
			tab.addEventListener('click', function () {
				payNowLink.closest('div').style.display = "block"
				payNowLinkMo.closest('div').style.display = "block"
				payNowLink3.closest('div').style.display = "block"
				if (this.classList.contains('bank-transfer-tab')) {
					payNowLink.innerHTML = "Pay Now With Bank Transfer"
					payNowLinkMo.innerHTML = "Pay Now With Bank Transfer"
					payNowLink3.innerHTML = "Pay Now With Bank Transfer"
				}else if (this.classList.contains('credit-card-tab')) {
					payNowLink.innerHTML = "Pay Now With Credit Card"
					payNowLinkMo.innerHTML = "Pay Now With Credit Card"
					payNowLink3.innerHTML = "Pay Now With Credit Card"
				}else if (this.classList.contains('pay-later')) {
					payNowLink.innerHTML = "Pay Now With BNPL"
					payNowLinkMo.innerHTML = "Pay Now With BNPL"
					payNowLink3.innerHTML = "Pay Now With BNPL"
				}
			})
		}
	}
	/**New Code for select old student */

	//updateOldStudentList
	async updateOldStudentList() {
		const selectBox = document.getElementById('old-student')
		var $this = this;
		try {
			const data = await this.fetchData("getAllPreviousStudents/" + this.memberData.memberId);
			//finding unique value and sorting by firstName
			const filterData = data.filter((item, index, self) =>
				index === self.findIndex(obj => obj.studentEmail === item.studentEmail)
			).sort(function (a, b) {
				return a.firstName.trim().localeCompare(b.firstName.trim())
			})
			// Clear existing options
			selectBox.innerHTML = '';
			// Add a "Please select" option
			const defaultOption = document.createElement('option');
			defaultOption.value = '';
			defaultOption.textContent = 'Please select';
			selectBox.appendChild(defaultOption);
			// Add new options from the API data
			filterData.forEach((item, index) => {
				const option = document.createElement('option');
				option.value = index;
				option.textContent = `${item.firstName} ${item.lastName}`;
				selectBox.appendChild(option);
			});
			selectBox.addEventListener('change', function (event) {
				var checkoutJson = localStorage.getItem("checkOutBasicData");
				var data = {
					studentEmail: filterData[event.target.value].studentEmail,
					firstName: filterData[event.target.value].firstName,
					lastName: filterData[event.target.value].lastName,
					grade: filterData[event.target.value].studentGrade,
					school: filterData[event.target.value].school,
					gender: filterData[event.target.value].gender,
				};
				localStorage.setItem("checkOutBasicData", JSON.stringify(data));
				$this.updateBasicData();
			})
		} catch (error) {
			console.error('Error fetching API data:', error);

			// Handle errors (optional)
			selectBox.innerHTML = '<option value="">Student Details not available</option>';
		}
	}
	displayUpSellModal() {
		this.addToCart()
		if (this.memberData.hide_upsell) {
			return;
		}
		const modal = document.getElementById('upsell-modal-1');
		var $this = this;
		const noThanks = document.getElementsByClassName('no-thanks');
		let variant = this.getVariant();
		localStorage.setItem('_ab_test_variant', variant)
		if (modal) {
			console.log('Showing modal on page load');
			this.showUpSellModal(modal);
		} else {
			console.log('Modal element not found.');
		}
		if (noThanks) {
			for (let index = 0; index < noThanks.length; index++) {
				const element = noThanks[index];
				element.addEventListener('click', function () {
					$this.hideUpSellModal(modal)

				})

			}
		}
	}
	showUpSellModal(modal) {
		const check_up_sell = this.checkUpSellModalOpen();
		console.log('check_up_sell', check_up_sell)
		if (check_up_sell) {
			return;
		}
		modal.classList.add('show');
		modal.style.display = 'flex';
		document.querySelector('.upsell-modal-bg').setAttribute('aria-hidden', 'false');
	}
	checkUpSellModalOpen() {
		let isOpen = false;
		const addToCartButtons = document.querySelectorAll(".add-to-card.upsell_add_to_card");
		addToCartButtons.forEach(button => {
			const parent = button.closest("div");
			if (parent) {
				const checkbox = parent.querySelector(".suppCheckbox");
				if (checkbox.checked) {
					isOpen = checkbox.checked
				}
			}
		})
		return isOpen;
	}
	uncheckAllCardCheckbox() {
		setTimeout(() => {
			const addToCartButtons = document.querySelectorAll(".add-to-card");
			addToCartButtons.forEach(button => {
				const parent = button.closest("div");
				if (parent) {
					const checkbox = parent.querySelector(".suppCheckbox");
					if (checkbox) {
					checkbox.checked = false;
					console.log("checkbox.checked", checkbox.checked)
					}
				}
			})
		}, 100);
	}
	hideUpSellModal(modal) {
		modal.classList.remove('show');
		modal.style.display = 'none';
		document.querySelector('.upsell-modal-bg').removeAttribute('aria-hidden');
	}
	addToCart() {
		// Select all 'add-to-card' buttons
		const addToCartButtons = document.querySelectorAll(".add-to-card");
		var $this = this;
		addToCartButtons.forEach(button => {
			button.addEventListener("click", function (event) {
				event.preventDefault(); // Prevent default link behavior

				// Find the parent container with the 'btn-reserve-spot' class
				const parent = button.closest("div");

				if (parent) {
					// Locate the child checkbox within the parent container
					const checkbox = parent.querySelector(".suppCheckbox");

					if (checkbox && !checkbox.checked) {
						// Toggle the checkbox state
						checkbox.checked = !checkbox.checked;
						//if(checkbox.checked){
						$this.updateAmount(checkbox, checkbox.value);
						//}

						// Update the button text based on the checkbox state
						button.textContent = checkbox.checked ? "Added" : "Add to Cart";
						if(checkbox.checked){
							button.style.pointerEvents = 'none'; // Disable pointer events
							button.style.color = '#ffffff';
							button.style.backgroundColor = "gray";
							//button.style.textDecoration = "underline";
						}
						// Optional: Add or remove a disabled class (if needed)
						button.classList.toggle("disabled", checkbox.checked);
						// Add red border in slider 
						if(button.closest('.you-might_slide-item')){
							button.closest('.you-might_slide-item').classList.toggle('border-red')
						}
						// update added text for same program in another section
						var programDetailId = checkbox.getAttribute('programdetailid');
						var elementSelector = ".supp_program_"+programDetailId;;
						var matchedAddCartBtn = document.querySelectorAll(elementSelector)
						matchedAddCartBtn.forEach(add_to_card_btn => {
							add_to_card_btn.closest("div")
							add_to_card_btn.textContent = "Added";
							add_to_card_btn.style.pointerEvents = 'none'; // Disable pointer events
							add_to_card_btn.style.color = '#ffffff';
							add_to_card_btn.style.backgroundColor = "gray";
							//add_to_card_btn.style.textDecoration = "underline";
						})
						while ($this.$suppPro.length == 0) {
							console.log("$this.$suppPro.length", $this.$suppPro.length)
						}
						setTimeout(() => {
							const modal = document.getElementById('upsell-modal-1');
							$this.hideUpSellModal(modal)
						}, 100);

					}

				}
				//_care_package_add_to_card
				if (this.classList.contains('care_package_add_to_card')) {
					const _care_package_add_to_card = document.querySelectorAll(".care_package_add_to_card");
					_care_package_add_to_card.forEach(add_to_card_btn => {
						add_to_card_btn.textContent = "Added";
						add_to_card_btn.style.pointerEvents = 'none'; // Disable pointer events
						add_to_card_btn.style.color = '#ffffff';
						add_to_card_btn.style.backgroundColor = "gray";
						//add_to_card_btn.style.textDecoration = "underline";
					})
				}
			});
		});
	}
	async displaySupplementaryProgram() {
		let container2 = document.getElementById("checkout-supplimentary-data-2");
		let swiperSlideWrapper = container2.querySelector('.you-might_slick-slider')

		
		// New Slider with add-to-cart and learn more button
		let container3 = document.getElementById("checkout-supplimentary-data-desktop");
		let newSlideWrapper = container3.querySelector('.you-might-slider-container')

		// For Mobile Slider
		let container4 = document.getElementById("checkout-supplimentary-data-mobile");
		let mobileSlideWrapper = container4.querySelector('.you-might-slider-container-mobile')

		if (this.$suppPro.length > 0) return;
		// Get the container element
		let apiData = await this.fetchData("getSupplementaryProgram/" + this.memberData.programId);
		// sorting data by programDetailId
		apiData.sort((a, b) => b.programDetailId - a.programDetailId);
		// Added in our Local Data
		this.$suppPro = apiData;
		let prep_week_searchText = "topic prep week";
		let tutoring_week_searchText = "5 hours";
		//let variant_type = _vwo_exp[_vwo_exp_ids[0]].combination_chosen;
		let variant_type = this.getVariant();
		variant_type = variant_type != undefined || variant_type != null ? variant_type : "";
		let prep_week_data = apiData.filter(i => i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()))
		let tutoring_data = apiData.filter(i => i.label.toLowerCase().includes(tutoring_week_searchText.toLowerCase()))
		let care_package_data = apiData.find(i => i.programDetailId == 21);
		this.updateUpSellModal(prep_week_data, tutoring_data, care_package_data)
		
		if(!this.memberData.hide_upsell ){
			if (variant_type == 1) {
				apiData = apiData.filter(i => !i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()));
			} else {
				apiData = apiData.filter(i => !i.label.toLowerCase().includes(tutoring_week_searchText.toLowerCase()));
			}
		}
		apiData = apiData.filter(i => i.programDetailId != 21);

		if(!apiData.length){
			swiperSlideWrapper.style.display="none";
			// New Slider hide if no API data
			newSlideWrapper.style.display = "none";

			mobileSlideWrapper.style.display = "none";
			
		}
		
		if (container2 == undefined) return;

		if(container3 == undefined) return;
		if(container4 == undefined) return;
		
		if (swiperSlideWrapper == undefined) return

		if (newSlideWrapper == undefined) return

		if (mobileSlideWrapper == undefined) return

		// Modal Content Update
		

		swiperSlideWrapper.innerHTML = "";
		newSlideWrapper.innerHTML = "";
		mobileSlideWrapper.innerHTML = "";

		// Modal Content Update
		let modalContent = document.querySelector(
			".supp-programs-description-wrapper"
		  );
	  
		if (!apiData.length) {
		modalContent.style.display = "none";
		}
	
		if (modalContent == undefined) return;
	
		modalContent.innerHTML = "";


		apiData.forEach(item => {
			item.forumType = "Public Forum";
			//slider div
			let swiperSlide = creEl('div', 'you-might_slide-item')
			const outerShadowDiv1 = this.displaySingleSuppProgram(item, 'desktop', swiperSlide);
			swiperSlide.appendChild(outerShadowDiv1)
			swiperSlideWrapper.prepend(swiperSlide)

			//newSlider div
			let newSliderSlide = creEl('div', 'you-might_slide-item')
			const newOuterShadowDiv1 = this.newDisplaySingleSuppProgram(item, 'desktop', newSliderSlide);
			newSliderSlide.appendChild(newOuterShadowDiv1)
			newSlideWrapper.prepend(newSliderSlide)

			//Mobile slider div
			let mobileSliderSlide = creEl('div', 'you-might_slide-item')
			const mobileOuterShadowDiv1 = this.newDisplaySingleSuppProgram(item, 'desktop', mobileSliderSlide);
			mobileSliderSlide.appendChild(mobileOuterShadowDiv1)
			mobileSlideWrapper.prepend(mobileSliderSlide)

			// Modal Content Update
			const modalSingleContent = this.displayModalSuppProgram(item, "modal");
			modalContent.prepend(modalSingleContent);

		});
		this.closeIconEvent();
		// Setup back button for browser and stripe checkout page
		//this.setUpBackButtonTab();
	}
	initSlickSlider() {
		var $slider = $('.you-might_slick-slider');
		
		if ($slider.hasClass('slick-initialized')) {
			$slider.slick('destroy');
			$slider.slick('unslick'); // Destroy slick instance
		}
		var slickSettings = {
			speed: 300,
			slidesToShow: 1,
			slidesToScroll: 1,
			infinite: false,
			centerMode: false,
			variableWidth: false,
			arrows: false,
			dots: true,
			adaptiveHeight: true
		};
		// Check if the slider is already initialized
		if (!$slider.hasClass('slick-initialized')) {
			// Initialize you might slider
			var $sliderYouMight = $slider.slick(slickSettings);

			// Shared navigation logic for the "You Might" slider
			$('.left-arrow-slick').click(function () {
				console.log("You Might: Left arrow clicked.");
				$sliderYouMight.slick('slickPrev');
			});

			$('.right-arrow-slick').click(function () {
				console.log("You Might: Right arrow clicked.");
				$sliderYouMight.slick('slickNext');
			});
		}
		// New Slider
		var $slider2 = $('.you-might-slider-container');
		
		if ($slider2.hasClass('slick-initialized')) {
			$slider2.slick('destroy');
			$slider2.slick('unslick'); // Destroy slick instance
		}
		// Check if the slider is already initialized
		if (!$slider2.hasClass('slick-initialized')) {
			// Initialize you might slider
			var $sliderYouMightNew = $slider2.slick(slickSettings);

			$('.you-might-left-arrow').click(function () {
				console.log("You Might: Left arrow clicked.");
				$sliderYouMightNew.slick('slickPrev');
			});
	 
			$('.you-might-right-arrow').click(function () {
				console.log("You Might: Right arrow clicked.");
				$sliderYouMightNew.slick('slickNext');
			});
		}

		// Mobile Slider
		var $slider3 = $('.you-might-slider-container-mobile');
		
		if ($slider3.hasClass('slick-initialized')) {
			$slider3.slick('destroy');
			$slider3.slick('unslick'); // Destroy slick instance
		}
		// Check if the slider is already initialized
		if (!$slider3.hasClass('slick-initialized')) {
			// Initialize you might slider
			var $sliderYouMightMobile = $slider3.slick(slickSettings);

			$('.you-might-left-arrow').click(function () {
				console.log("You Might: Left arrow clicked.");
				$sliderYouMightMobile.slick('slickPrev');
			});
	 
			$('.you-might-right-arrow').click(function () {
				console.log("You Might: Right arrow clicked.");
				$sliderYouMightMobile.slick('slickNext');
			});
		}

	}
	updateUpSellModal(prep_week_data, tutoring_data, care_package_data) {

		if (prep_week_data.length > 0) {
			var tpwAmount = document.getElementById('tpw-amount');
			if (tpwAmount != undefined) {
				tpwAmount.innerHTML = "$" + parseFloat(prep_week_data[0].amount).toFixed(2);
			}
			var tpwSaveAmount = document.getElementById('tpw-save-amount');
			if (tpwSaveAmount != undefined) {
				tpwSaveAmount.innerHTML = "$" + parseFloat(prep_week_data[0].disc_amount - prep_week_data[0].amount).toFixed(2)
			}
			var tpwDescAmount = document.getElementById('tpw-desc-amount');
			if (tpwDescAmount != undefined) {
				tpwDescAmount.innerHTML = "$" + parseFloat(prep_week_data[0].disc_amount).toFixed(2)
			}
			var upsellTpwProgranId = document.getElementById('upsellTpwProgranId');
			if (upsellTpwProgranId != undefined) {
				upsellTpwProgranId.setAttribute('programdetailid', prep_week_data[0].programDetailId)
				upsellTpwProgranId.value = prep_week_data[0].amount
			}
			// For mobile upsellTpwProgranId-1
			var upsellTpwProgranIdMob = document.getElementById('upsellTpwProgranId-1');
			if (upsellTpwProgranIdMob != undefined) {
				upsellTpwProgranIdMob.setAttribute('programdetailid', prep_week_data[0].programDetailId)
				upsellTpwProgranIdMob.value = prep_week_data[0].amount
			}


			let tpwTitle = document.querySelector("[upsell-modal='tpw-title']")
			if (tpwTitle != undefined) {
				tpwTitle.innerHTML = prep_week_data[0].label
			}
			let tpwReadMore = document.querySelectorAll("[upsell-modal='tpw_read-more']")
			if (tpwReadMore.length > 0) {
				tpwReadMore.forEach(read_more_link => {
					read_more_link.href = this.memberData.site_url + "topic-prep-week";
				})
			}

		}


		if (tutoring_data.length > 0) {
			var tutoAmount = document.getElementById('tuto-amount');
			if (tutoAmount != undefined) {
				tutoAmount.innerHTML = "$" + parseFloat(tutoring_data[0].amount).toFixed(2);
			}
			var tutoSaveAmount = document.getElementById('tuto-save-amount');
			if (tutoSaveAmount != undefined) {
				tutoSaveAmount.innerHTML = "$" + parseFloat(tutoring_data[0].disc_amount - tutoring_data[0].amount).toFixed(2)
			}
			var tutoDescAmount = document.getElementById('tuto-desc-amount');
			if (tutoDescAmount != undefined) {
				tutoDescAmount.innerHTML = "$" + parseFloat(tutoring_data[0].disc_amount).toFixed(2)
			}
			var upsellTutoProgranId = document.getElementById('upsellTutoProgranId');
			if (upsellTutoProgranId != undefined) {
				upsellTutoProgranId.setAttribute('programdetailid', tutoring_data[0].programDetailId)
				upsellTutoProgranId.value = tutoring_data[0].amount
			}
			// Mobile div id upsellTutoProgranId-1
			var upsellTutoProgranIdMob = document.getElementById('upsellTutoProgranId-1');
			if (upsellTutoProgranIdMob != undefined) {
				upsellTutoProgranIdMob.setAttribute('programdetailid', tutoring_data[0].programDetailId)
				upsellTutoProgranIdMob.value = tutoring_data[0].amount
			}

			//tutoring title
			let tutoringTitle = document.querySelector("[upsell-modal='tutoring-title']")
			if (tutoringTitle != undefined) {
				tutoringTitle.innerHTML = tutoring_data[0].label
			}

			let tutoringReadMore = document.querySelectorAll("[upsell-modal='tutoring_read-more']")
			if (tutoringReadMore.length > 0) {
				tutoringReadMore.forEach(read_more_link => {
					read_more_link.href = this.memberData.site_url + "debate-tutoring";
				})
			}
		}
		// Care Package Data Update
		if(care_package_data != undefined){
			let carePackagePrice = document.querySelectorAll("[data-care-package='price']")
			if (carePackagePrice.length > 0) {
				carePackagePrice.forEach(cp_price => {
					cp_price.innerHTML = "$"+care_package_data.amount;
				})
			}
			let carePackageCheckbox = document.querySelectorAll("[data-care-package='checkbox']")
			if (carePackageCheckbox.length > 0) {
				carePackageCheckbox.forEach(cp_checkbox => {
					cp_checkbox.setAttribute('programdetailid', care_package_data.programDetailId)
					cp_checkbox.value = care_package_data.amount
				})
			}
		}
	}
	// New UpSell Program / Supplementary
	displaySingleSuppProgram(item, size, slideDiv) {
		var $this = this;
		// Create the outer-shadow div
		//const outerDiv = document.createElement("div");
		//outerDiv.classList.add("div-block-93", "outer-shadow");
		// Create the grid container
		const gridDiv = document.createElement("div");
		gridDiv.classList.add("w-layout-grid", "payment-conf-program-grid", "upsell");

		// Create the course-info div (left column)
		const courseInfoDiv = document.createElement("div");

		const upsellDiv = document.createElement("div");
		upsellDiv.classList.add("upsell-div");

		// Create the checkbox
		const checkboxDiv = document.createElement("div");
		checkboxDiv.classList.add("core-checkbox");

		const label = document.createElement("label");
		label.classList.add("w-checkbox");

		const input = document.createElement("input");
		input.classList.add("w-checkbox-input", "core-checkbox", "suppCheckbox");
		input.type = "checkbox";
		input.id = size + item.label.replace(/\s+/g, '-').toLowerCase();
		input.name = "checkbox";
		input.value = item.amount;
		input.setAttribute("programdetailid", item.programDetailId);
		input.setAttribute("data-name", "Checkbox");
		var $this = this;
		input.addEventListener("change", function () {
			this.checked ? slideDiv.classList.add('border-red') : slideDiv.classList.remove('border-red')
			$this.updateAmount(this, item.amount);
		})

		const span = document.createElement("span");
		span.classList.add("core-checkbox-label", "w-form-label");

		label.appendChild(input);
		label.appendChild(span);
		checkboxDiv.appendChild(label);
		const labelWrapper = creEl('div')
		const campNameDiv = document.createElement("label");
		campNameDiv.classList.add("camp-name", "margin-bottom-0");
		campNameDiv.setAttribute("for", size + item.label.replace(/\s+/g, '-').toLowerCase())
		campNameDiv.textContent = item.label;
		labelWrapper.appendChild(campNameDiv)
		courseInfoDiv.appendChild(labelWrapper)
		//upsellDiv.appendChild(checkboxDiv);
		///upsellDiv.appendChild(campNameDiv);


		const textBlockWrapper = document.createElement("div");
		textBlockWrapper.classList.add("text-block-wrapper");

		item.tags.forEach(tag => {
			const tagDiv = document.createElement("div");
			tagDiv.classList.add("payment-conf-tag", "bg-color-light-blue");
			tagDiv.style.backgroundColor = tag.color
			tagDiv.textContent = tag.name;
			textBlockWrapper.appendChild(tagDiv);
		});

		const priceItem = document.createElement("div");
		priceItem.classList.add("price-item");

		const saveDiv1 = document.createElement("div");
		saveDiv1.classList.add("save-amount");
		saveDiv1.textContent = "Save";

		const saveDiv2 = document.createElement("div");
		saveDiv2.classList.add("save-amount");
		saveDiv2.textContent = "$" + (parseFloat(item.disc_amount) - parseFloat(item.amount)).toFixed(2);

		priceItem.appendChild(saveDiv1);
		priceItem.appendChild(saveDiv2);
		
		slideDiv.appendChild(upsellDiv);
		upsellDiv.appendChild(textBlockWrapper);

		

		// Create the price details div (right column)
		const priceDiv = document.createElement("div");
		priceDiv.classList.add("course-info", "p-16", "upsell");

		const discountPriceDiv = document.createElement("div");
		const discountLabel = document.createElement("div");
		discountLabel.classList.add("dm-sans", "bold-700");
		discountLabel.textContent = "Discount Price";
		discountPriceDiv.appendChild(discountLabel);

		const priceWrapper1 = document.createElement("div");
		priceWrapper1.classList.add("price-wrapper", "upsell");

		const originalPriceDiv1 = document.createElement("div");
		originalPriceDiv1.classList.add("price-item", "upsell");

		const originalPrice = document.createElement("div");
		originalPrice.classList.add("original-price");
		originalPrice.textContent = "$" + item.disc_amount;
		originalPriceDiv1.appendChild(originalPrice);

		const discountedPriceDiv = document.createElement("div");
		discountedPriceDiv.classList.add("price-item", "upsell");

		const discountedPrice = document.createElement("div");
		discountedPrice.classList.add("discounted-price", "text-blue");
		discountedPrice.textContent = "$" + item.amount;
		discountedPriceDiv.appendChild(discountedPrice);

		priceWrapper1.appendChild(priceItem);
		priceWrapper1.appendChild(originalPriceDiv1);
		priceWrapper1.appendChild(discountedPriceDiv);

		

		priceDiv.appendChild(discountPriceDiv);
		courseInfoDiv.appendChild(priceWrapper1);
		

		gridDiv.appendChild(courseInfoDiv);
		gridDiv.appendChild(checkboxDiv)
		//gridDiv.appendChild(priceDiv);

		//outerDiv.appendChild(gridDiv);

		return gridDiv;
	}
	getVariant() {
		let variant = 1;
		//let topicPripUpSellModal = document.querySelector('.topic-prep_modal-container')
		let tutoringUpSellModal = document.querySelector('.upsell-modal-container.tutoring')
		if (window.getComputedStyle(tutoringUpSellModal).display != 'none') {
			variant = 2;
		}
		return variant
	}
	hideShowCartVideo(visibility) {
		let videoEl = document.querySelector('.cart-sidebar .w-embed-youtubevideo');
		if (visibility == "show") {
			videoEl.style.display = "block"
		} else {
			videoEl.style.display = "none"
		}
	}
	hideShowDivById(Id, display) {
		if (Id) {
			document.getElementById(Id).style.display = display
		}
	}
	hideAndShowWhyFamilies(classs, display) {
		if (classs) {
			document.querySelector('.' + classs).style.display = display
		}
		if(classs == "block"){
			// Shared Slick slider settings
			var $slider =  $('.why-families_slick-slider');
			
			if ($slider.hasClass('slick-initialized')) {
				$slider.slick('destroy');
				$slider.slick('unslick'); // Destroy slick instance
			}
			var slickSettings = {
				speed: 300,
				slidesToShow: 1,
				slidesToScroll: 1,
				infinite: true,
				centerMode: false,
				variableWidth: false,
				arrows: false,
				dots: true,
			};
	 
			// Initialize both sliders
			var $sliderFamilies = $slider.slick(slickSettings);
		   
			// Shared navigation logic for the "Why Families" slider
			$('.families-left-arrow').click(function () {
				console.log("Why Families: Left arrow clicked.");
				$sliderFamilies.slick('slickPrev');
			});
	 
			$('.families-right-arrow').click(function () {
				console.log("Why Families: Right arrow clicked.");
				$sliderFamilies.slick('slickNext');
			});
		}
	}
	hideAndShowByClass(classs, display) {
		if (classs) {
			document.querySelector('.' + classs).style.display = display
		}
	}
	activeBreadCrumb(activeId) {
		let breadCrumbList = document.querySelectorAll('.stepper-container ul li');
		breadCrumbList.forEach(element => element.classList.remove('active'))
		document.getElementById(activeId).classList.add('active')

	}

	// New Supplimentary program update

	showModal(display){
		const suppProgramsModal = document.getElementById('suppProgramsModal');
		suppProgramsModal.classList.add('show');
		suppProgramsModal.style.display = 'flex';
	}
	hideModal(){
		const suppProgramsModal = document.getElementById('suppProgramsModal');
		suppProgramsModal.classList.add('show');
		suppProgramsModal.style.display = 'flex';
	}
	closeIconEvent() {
		const closeLinks = document.querySelectorAll(
		  ".upsell-close-link, .main-button.close"
		);
		closeLinks.forEach(function (closeLink) {
		  closeLink.addEventListener("click", function (event) {
			event.preventDefault();
			event.stopPropagation(); // Prevent event bubbling
	
			// First, try getting the modal from `data-target`
			const targetModalId = closeLink.getAttribute("data-target");
			let targetModal = targetModalId
			  ? document.getElementById(targetModalId)
			  : null;
	
			// If no `data-target`, find the closest parent that is a modal (checking if it has inline `display: flex;`)
			if (!targetModal) {
			  targetModal = closeLink.closest('[role="dialog"][aria-modal="true"]');
			}
	
			if (targetModal) {
			  console.log(`Closing ${targetModal.id}`);
			  targetModal.classList.remove("show");
			  targetModal.style.display = "none";
			}
		  });
		});
	  }
	// New UpSell Program / Supplementary
	newDisplaySingleSuppProgram(item, size, slideDiv) {
		// Create main grid container
		const gridDiv = document.createElement("div");
		gridDiv.classList.add("w-layout-grid", "payment-conf-program-grid", "you-might");
	  
		// Left column container
		const leftCol = document.createElement("div");
	  
		// Upsell tags section
		const upsellDiv = document.createElement("div");
		upsellDiv.classList.add("upsell-div");
	  
		const tagWrapper = document.createElement("div");
		tagWrapper.classList.add("text-block-wrapper-2");
	  
		item.tags.forEach(tag => {
		  const tagDiv = document.createElement("div");
		  tagDiv.classList.add("payment-conf-tag", "bg-color-light-blue");
		  tagDiv.textContent = tag.name;
		  tagDiv.style.backgroundColor = tag.color
		  tagWrapper.appendChild(tagDiv);
		});
	  
		upsellDiv.appendChild(tagWrapper);
		leftCol.appendChild(upsellDiv);
	  
		// Title
		const campTitleWrapper = document.createElement("div");
		const campTitle = document.createElement("div");
		campTitle.classList.add("camp-name-2", "margin-bottom-5");
		campTitle.textContent = item.label;
		campTitleWrapper.appendChild(campTitle);
		leftCol.appendChild(campTitleWrapper);
	  
		// Price Info
		const priceWrapper = document.createElement("div");
		priceWrapper.classList.add("price-wrapper", "upsell");
	  
		const saveItem = document.createElement("div");
		saveItem.classList.add("price-item");
		saveItem.id = "w-node-d9e089fb-dbb6-8c3c-781b-f2cfa37c0c51-f602461b";
	  
		const saveLabel = document.createElement("div");
		saveLabel.classList.add("save-amount-2");
		saveLabel.textContent = "Save";
	  
		const saveAmount = document.createElement("div");
		saveAmount.classList.add("save-amount-2");
		saveAmount.textContent = "$" + (parseFloat(item.disc_amount) - parseFloat(item.amount)).toFixed(2);
	  
		saveItem.appendChild(saveLabel);
		saveItem.appendChild(saveAmount);
	  
		const originalItem = document.createElement("div");
		originalItem.classList.add("price-item", "upsell");
	  
		const originalPrice = document.createElement("div");
		originalPrice.classList.add("original-price");
		originalPrice.textContent = "$" + parseFloat(item.disc_amount).toFixed(2);
		originalItem.appendChild(originalPrice);
	  
		const discountedItem = document.createElement("div");
		discountedItem.classList.add("price-item", "upsell");
	  
		const discountedPrice = document.createElement("div");
		discountedPrice.classList.add("discounted-price-2", "text-blue");
		discountedPrice.textContent = "$" + parseFloat(item.amount).toFixed(2);
		discountedItem.appendChild(discountedPrice);
	  
		priceWrapper.appendChild(saveItem);
		priceWrapper.appendChild(originalItem);
		priceWrapper.appendChild(discountedItem);
		leftCol.appendChild(priceWrapper);
	  
		// Right column buttons
		const buttonDiv = document.createElement("div");
		buttonDiv.classList.add("button-div", "you-might-buttons-wrapper");
	  
		const addToCartBtn = document.createElement("a");
		addToCartBtn.href = "#";
		let programClass = "supp_program_"+item.programDetailId;
		addToCartBtn.classList.add("main-button-34", "red", "add-to-card", "you-might-add-to-cart", "w-button", programClass);
		addToCartBtn.textContent = "Add to Cart";
		const learnMoreBtn = document.createElement("a");
		if(item.benefits.length > 0){
			learnMoreBtn.href = "#";
			learnMoreBtn.classList.add("main-button", "learn-more", "w-button");
			learnMoreBtn.textContent = "Learn More";
		
			learnMoreBtn.addEventListener("click", function (e) {
			e.preventDefault();
			this.$selectedProgram = item;
			this.hideShowModalContent(item);
			this.showModal();
			}.bind(this));
		}else{
			learnMoreBtn.classList.add("width-100");
		}


		const checkboxDiv = document.createElement("div");

		const input = document.createElement("input");
		
		input.classList.add("w-checkbox-input", "core-checkbox", "suppCheckbox", "hide");
		input.type = "checkbox";
		input.id = size + item.label.replace(/\s+/g, '-').toLowerCase();
		input.name = "checkbox";
		input.value = item.amount;
		input.setAttribute("programdetailid", item.programDetailId);
		input.setAttribute("data-name", "Checkbox");
		var $this = this;
		input.addEventListener("change", function () {
			this.checked ? slideDiv.classList.add('border-red') : slideDiv.classList.remove('border-red')
			$this.updateAmount(this, item.amount);
		})

		checkboxDiv.appendChild(input);
		
	  
		buttonDiv.appendChild(addToCartBtn);
		buttonDiv.appendChild(learnMoreBtn);
		buttonDiv.appendChild(checkboxDiv)
	  
		gridDiv.appendChild(leftCol);
		gridDiv.appendChild(buttonDiv);
	  
		// Benefits Section (separate div)
		const benefitsContainer = document.createElement("div");
		if(item.benefits.length > 0){
		
			const marginTopDiv = document.createElement("div");
			marginTopDiv.classList.add("margin-top");
		
			const keyLabel = document.createElement("div");
			keyLabel.classList.add("dm-sans", "key-benefits");
			keyLabel.innerHTML = "Key Benefits<br />";
		
			const benefitsWrapper = document.createElement("div");
		
			item.benefits.forEach((benefit, index) => {
				const benefitWrapper = document.createElement("div");
				benefitWrapper.classList.add("key-benefits-grid-wrapper");
				if (index === 0) benefitWrapper.classList.add("center");
			
				const img = document.createElement("img");
				img.src = "https://cdn.prod.website-files.com/6271a4bf060d543533060f47/67cec6d2f47c8a1eee15da7e_library_books.svg";
				img.loading = "lazy";
				img.alt = "";
				img.classList.add("full-width-inline-image");
			
				const benefitText = document.createElement("div");
				benefitText.classList.add("dm-sans");
				benefitText.innerHTML = benefit.title + "<br />";
			
				benefitWrapper.appendChild(img);
				benefitWrapper.appendChild(benefitText);
			
				benefitsWrapper.appendChild(benefitWrapper);
			});
		
			marginTopDiv.appendChild(keyLabel);
			marginTopDiv.appendChild(benefitsWrapper);
			benefitsContainer.appendChild(marginTopDiv);
		}
	  
		// Return full fragment
		const wrapper = document.createElement("div");
		wrapper.appendChild(gridDiv);
		if(item.benefits.length > 0){
			wrapper.appendChild(benefitsContainer);
		}
	  
		return wrapper;
	  }
	displayModalSuppProgram(item, type = "banner", size="desktop") {
		var $this = this;
		let discount_amount = item.disc_amount - item.amount;
		let discount = Number.isInteger(discount_amount)
		  ? discount_amount
		  : parseFloat(discount_amount).toFixed(2);
		let typeClass = "modal-content " + type + "-" + item.programDetailId;
		// Main wrapper
		if (type == "banner") {
		  var slideItem = creEl("div", "supp-programs-slide-item");
		} else {
		  var slideItem = creEl(
			"div",
			"supp-programs-description-div " + typeClass
		  );
		}
	
		// --------- Discounted Programs Div ---------
		var programsDiv = creEl("div", "discounted-programs-div border-none");
	
		// Title
		var title = creEl("div", "dm-sans bold-700 text-large-with-mb");
		title.innerHTML = item.label;
	
		// Price Grid
		var priceGrid = creEl("div", "discount-price-grid supp-prog-price");
	
		var originalPrice = creEl("div", "original-price-gray medium-text");
		originalPrice.textContent = "$" + item.disc_amount;
	
		var discountPrice = creEl("div", "discount-price supp-program");
		discountPrice.innerHTML = "$" + item.amount + "<br />";
	
		var savePriceText = creEl("div", "save-price-text");
		var saveAmount = creEl("div", "save-amount medium-text");
		saveAmount.textContent = "Save " + "$" + discount;
		savePriceText.appendChild(saveAmount);
	
		priceGrid.appendChild(originalPrice);
		priceGrid.appendChild(discountPrice);
		priceGrid.appendChild(savePriceText);
	
		// Benefits Data
		var benefits = item.benefits;
		if (benefits.length > 0) {
			// Key Benefits label
			var keyBenefitsLabel = creEl("div", "dm-sans key-benefits");
			keyBenefitsLabel.innerHTML = "Key Benefits<br />";
		
			// Benefits container
			var benefitsContainer = creEl("div", "width-100");
		
			
		
			// Loop benefits
			if (benefits.length > 0) {
			benefits.forEach(function (benefit) {
				var benefitWrapper = creEl("div", "key-benefits-grid-wrapper");
		
				var benefitImg = creEl(
				"img",
				"full-width-inline-image margintop-5px"
				);
				benefitImg.src =
				"https://cdn.prod.website-files.com/6271a4bf060d543533060f47/67cec6d2f47c8a1eee15da7e_library_books.svg";
				benefitImg.loading = "lazy";
				benefitImg.alt = "";
		
				var benefitContent = creEl("div");
		
				var benefitTitle = creEl(
				"div",
				"dm-sans margin-bottom-5 bold-700"
				);
				benefitTitle.innerHTML = benefit.title + "<br />";
		
				var benefitDesc = creEl("div", "dm-sans");
				benefitDesc.innerHTML = benefit.desc;
		
				benefitContent.appendChild(benefitTitle);
				benefitContent.appendChild(benefitDesc);
		
				benefitWrapper.appendChild(benefitImg);
				benefitWrapper.appendChild(benefitContent);
		
				benefitsContainer.appendChild(benefitWrapper);
			});
			}
		}
	
		// Buttons
		var buttonDiv = creEl(
		  "div",
		  "button-div button-grid-wrapper-with-margin-top"
		);
		
		let programClass = "supp_program_"+item.programDetailId;
		var buyNowBtn = creEl("a", "main-button-34 red add-to-card supp-program w-button "+programClass);
		buyNowBtn.href = "#";
		buyNowBtn.textContent = "Add to Cart";
		// buyNowBtn.addEventListener("click", function (event) {
		//   event.preventDefault();
		//   $this.$selectedProgram = item;
		//   //$this.updatePayNowModelAmount();
		//   const buyNowModal = document.getElementById("buyNowModal");
		//   $this.showModal(buyNowModal);
		// });
	
		var learnMoreBtn = creEl("a", "main-button close w-button");
		if (benefits.length > 0) {
			learnMoreBtn.href = "#";
			learnMoreBtn.textContent = type == "banner" ? "Learn More" : "Close";
			learnMoreBtn.addEventListener("click", function (event) {
			event.preventDefault();
			$this.$selectedProgram = item;
			const suppProgramsModal = document.getElementById("suppProgramsModal");
			if (type == "banner") {
				$this.hideShowModalContent(item);
				$this.showModal(suppProgramsModal);
			} else {
				$this.hideModal(suppProgramsModal);
			}
			});
		}

		// Checkbox added for add to cart feature
		// Create the checkbox
		const checkboxDiv = document.createElement("div");

		const input = document.createElement("input");
		input.classList.add("w-checkbox-input", "core-checkbox", "suppCheckbox", "hide");
		input.type = "checkbox";
		input.id = size + item.label.replace(/\s+/g, '-').toLowerCase();
		input.name = "checkbox";
		input.value = item.amount;
		input.setAttribute("programdetailid", item.programDetailId);
		input.setAttribute("data-name", "Checkbox");
		var $this = this;
		input.addEventListener("change", function () {
			this.checked ? slideDiv.classList.add('border-red') : slideDiv.classList.remove('border-red')
			$this.updateAmount(this, item.amount);
		})

		checkboxDiv.appendChild(input);
	
		buttonDiv.appendChild(buyNowBtn);
		if (benefits.length > 0) {
			buttonDiv.appendChild(learnMoreBtn);
		}
		buttonDiv.appendChild(checkboxDiv);
	
		// Assemble programsDiv
		programsDiv.appendChild(title);
		programsDiv.appendChild(priceGrid);
		if (benefits.length > 0) {
			programsDiv.appendChild(keyBenefitsLabel);
			programsDiv.appendChild(benefitsContainer);
		}
		programsDiv.appendChild(buttonDiv);
	
		// --------- Gradient Div Section ---------
		var gradientDiv = creEl(
		  "div",
		  "gradient-div-supp-programs-modal mob-hide"
		);
	
		// Image
		var gradientImg = creEl("img", "supp-programs-img");
		gradientImg.src =
		  "https://cdn.prod.website-files.com/6271a4bf060d543533060f47/67d291810bb6fac1cea50637_supp-prog-2.avif";
		gradientImg.loading = "lazy";
		gradientImg.alt = "";
	
		// Text
		var gradientText = creEl("div", "supp-programs-text");
	
		var percentOff = creEl("div", "dm-sans percent-off");
		percentOff.innerHTML =
		  "$" + discount + '<span class="off-text-shadow-right-white"> OFF</span>';
	
		var limitedTime = creEl("div", "dm-sans limited-time-supp-program");
		limitedTime.textContent = "Limited Time Offer";
	
		gradientText.appendChild(percentOff);
		gradientText.appendChild(limitedTime);
	
		// Assemble gradientDiv
		gradientDiv.appendChild(gradientImg);
		gradientDiv.appendChild(gradientText);
	
		// --------- Assemble Main Div ---------
		slideItem.appendChild(programsDiv);
		slideItem.appendChild(gradientDiv);
	
		return slideItem;
	  }

	hideShowModalContent(item) {
		const modelContent = document.querySelectorAll(".modal-content");
		for (let index = 0; index < modelContent.length; index++) {
			const element = modelContent[index];
			element.classList.add("hide");
		}
		document
			.querySelector(".modal-content.modal-" + item.programDetailId)
			.classList.remove("hide");
	}
}
