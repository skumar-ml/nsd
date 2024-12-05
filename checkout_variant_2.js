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
	constructor(apiBaseUrl, memberData) {
		this.baseUrl = apiBaseUrl;
		this.memberData = memberData;
		this.renderPortalData();
	}
	// Passing all supplimentary program data and creating cart list
	displaySupplimentaryProgram(data) {
		this.$suppPro = data;
		// Getting main dom elment object to add supplementary program list with checkbox
		var studentList = document.getElementById("checkout_supplimentary_data");
		// Supplementary program heading
		var supplementaryProgramHead = document.getElementById("supplementary-program-head");
		var eduCopy = document.querySelector("#checkout_program .edu-prg001");
		var $this = this;
		studentList.innerHTML = "";
		// Remove duplicate data like Supplementary program
		data = data.filter((item) => item.programDetailId != this.memberData.programId);
		if (data.length > 0) {
			// showing supplementary program heading when data in not empty
			supplementaryProgramHead.style.display = "block";
			data.forEach((sData) => {
				// Getting single supplementary program cart list
				var sList = this.createCartList(sData);
				studentList.appendChild(sList);
			});
		} else {
			// hiding supplementary program heading when data is empty
			supplementaryProgramHead.style.display = "none";

			// Hide Limited Time Offer copy
			eduCopy && (eduCopy.style.display = "none");
		}
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
	// This method use to display selected supplementary program in sidebar
	displaySelectedSuppProgram(suppIds) {
		// selected Supplementary program main dom element
		var selectedSuppPro = document.getElementById("selected_supplimentary_program");
		selectedSuppPro.innerHTML = "";
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
		// let headIcon = creEl("img");
		// headIcon.src = 'https://cdn.prod.website-files.com/67173abfccca086eb4890d89/674ea6ed605359d5b79786df_check_box.svg'
		// headIcon.setAttribute('loading', "lazy")
		// headContainer.prepend(head, headIcon);
		headContainer.prepend(head);
		selectedSuppPro.appendChild(headContainer);

		// Supplementary program name and price list

		selectedData.forEach((sup) => {
			var suppProDiv = creEl('div', 'horizontal-div align-left');
			let offeringType = creEl("div", "dm-sans offering-type");
			offeringType.innerHTML = sup.label;
			let OfferingPrice = creEl("div", "dm-sans offering-price");
			OfferingPrice.innerHTML = "$" + parseFloat(sup.amount).toFixed(2);
			suppProDiv.prepend(offeringType, OfferingPrice);
			selectedSuppPro.appendChild(suppProDiv);
		});


	}
	// This method use to display selected supplementary program in sidebar
	displaySelectedSuppProgramMobile(suppIds) {
		// selected Supplementary program main dom element
		var selectedSuppPro = document.getElementById("selected_supplimentary_program_mob");
		if (selectedSuppPro) {
			selectedSuppPro.innerHTML = "";
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
			// Selected supplementary program heading
			var head = creEl("p", "dm-sans font-14 order-summary-border bold marginbottom-3");
			head.innerHTML = "Supplementary Program";
			selectedSuppPro.appendChild(head);
			var label = "";
			// Added single supplementary program heading in sidebar
			selectedData.forEach((sup) => {
				label = creEl("p", "dm-sans font-14 bold program-bottom-margin");
				label.innerHTML = sup.label + " " + sup.amount;
				selectedSuppPro.appendChild(label);
				// label = creEl("p", "dm-sans font-14");
				// label.innerHTML = sup.desc;
				// selectedSuppPro.appendChild(label);
			});

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
		var totalPriceTextMob = document.getElementById("totalPricemobile");
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
		if (selectedIds.length > 0) {
			totalPriceDiv.style.visibility = "visible";
		} else {
			totalPriceDiv.style.visibility = "hidden";
		}
		this.displaySelectedSuppProgram(selectedIds);
		this.displaySelectedSuppProgramMobile(selectedIds);
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
	initializeStripePayment(paymentType = "", checkoutID = "") {
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
				"successUrl": "https://www.nsdebatecamp.com/payment-confirmation?programId=" + this.memberData.programId + "&programName=" + this.memberData.programName,
				//"cancelUrl": cancelUrl.href,
				"cancelUrl": "https://www.nsdebatecamp.com/",
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
				data.paymentType = [paymentType]
			}

			var xhr = new XMLHttpRequest()
			var $this = this;
			xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/createCheckoutUrlsByProgram", true)
			xhr.withCredentials = false
			xhr.send(JSON.stringify(data))
			xhr.onload = function () {
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
							$this.updateStudentDetails(checkoutData);
						})
					}
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
		let payNowLink = document.getElementById('pay-now-link');
		ach_payment.addEventListener("click", function () {
			let suppProIdE = document.getElementById('suppProIds');
			let suppProIds = JSON.parse(suppProIdE.value)
			// ach_payment.innerHTML = "Processing..."
			// $this.initializeStripePayment('us_bank_account', ach_payment);
			if (suppProIds.length > 0) {
				payNowLink.innerHTML = "Processing.."
				let initialCheckout = $this.initializeStripePayment('us_bank_account', $this.$checkoutData.checkoutId);
				if (initialCheckout) {
					initialCheckout.then(() => {
						ibackbutton.value = "1";
						payNowLink.innerHTML = "Pay Now"
						window.location.href = $this.$checkoutData.achUrl;
						
					})
				}
			} else {
				ibackbutton.value = "1";
				window.location.href = $this.$checkoutData.achUrl;
			}
		});
		card_payment.addEventListener("click", function () {
			let suppProIdE = document.getElementById('suppProIds');
			let suppProIds = JSON.parse(suppProIdE.value)
			// card_payment.innerHTML = "Processing..."
			if (suppProIds.length > 0) {
				payNowLink.innerHTML = "Processing.."
				let initialCheckout = $this.initializeStripePayment('card', $this.$checkoutData.checkoutId);
				if (initialCheckout) {
					initialCheckout.then(() => {
						ibackbutton.value = "1";
						payNowLink.innerHTML = "Pay Now"
						window.location.href = $this.$checkoutData.cardUrl;
					})
				}
			} else {
				ibackbutton.value = "1";
				window.location.href = $this.$checkoutData.cardUrl;
			}
		});
		paylater_payment.addEventListener("click", function () {
			let suppProIdE = document.getElementById('suppProIds');
			let suppProIds = JSON.parse(suppProIdE.value)
			// paylater_payment.innerHTML = "Processing..."
			if (suppProIds.length > 0) {
				payNowLink.innerHTML = "Processing.."
				let initialCheckout = $this.initializeStripePayment('paylater', $this.$checkoutData.checkoutId);
				if (initialCheckout) {
					initialCheckout.then(() => {
						ibackbutton.value = "1";
						payNowLink.innerHTML = "Pay Now"
						window.location.href = $this.$checkoutData.payLaterUrl;
					})
				}
			} else {
				ibackbutton.value = "1";
				window.location.href = $this.$checkoutData.payLaterUrl;
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
		if ((returnType == "back" || ibackbutton.value == 1) && checkoutJson != undefined) {
			var paymentData = JSON.parse(checkoutJson);
			this.addSessionId()
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
				this.activateDiv("checkout_payment");
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
			// Update student data for purchase addon Supplementary program
			if (this.memberData.productType == "supplementary") {
				this.updateSuppData();
			}
			// Update readOnly for core program
			this.updateDefaultCheckbox();
			// Handle checkout button
			this.handlePaymentEvent();
			// Handle previous and next button
			this.addEventForPrevNaxt();
			// activate program tab
			this.activateDiv("checkout_student_details");
			// loader icon code
			var spinner = document.getElementById("half-circle-spinner");
			spinner.style.display = "block";
			// API call
			//const data = await this.fetchData("getSupplementaryProgram/" + this.memberData.programId);
			// Display supplementary program
			//this.displaySupplimentaryProgram(data);

			// Setup back button for browser and stripe checkout page
			this.setUpBackButtonTab();
			// Update basic data
			this.updateBasicData();
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
			console.log("click payNow Button")
			let activePaymentLink = document.querySelector('.checkout_payment .w--tab-active a');
			activePaymentLink.click();
		})

		var allTabs = document.getElementsByClassName("checkout-tab-link");
		for (var i = 0; i < allTabs.length; i++) {
			var tab = allTabs[i];
			tab.addEventListener('click', function () {
				payNowLink.closest('div').style.display = "block"
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
			selectBox.innerHTML = '<option value="">Failed to load options</option>';
		}
	}
	displayUpSellModal() {
		if (this.memberData.hide_upsell) {
			return;
		}
		const modal = document.getElementById('upsell-modal-1');
		var $this = this;
		const noThanks = document.getElementsByClassName('no-thanks');

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
		this.addToCart()

	}
	showUpSellModal(modal) {
		const check_up_sell = this.checkUpSellModalOpen();
		console.log('check_up_sell', check_up_sell)
		if (check_up_sell) {
			return;
		}
		modal.classList.add('show');
		modal.style.display = 'flex';
		document.querySelector('.student-info_modal-bg').setAttribute('aria-hidden', 'false');
	}
	checkUpSellModalOpen() {
		let isOpen = false;
		const addToCartButtons = document.querySelectorAll(".add-to-card._upsell_add_to_card");
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
	hideUpSellModal(modal) {
		modal.classList.remove('show');
		modal.style.display = 'none';
		document.querySelector('.student-info_modal-bg').removeAttribute('aria-hidden');
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

					if (checkbox) {
						// Toggle the checkbox state
						checkbox.checked = !checkbox.checked;
						//if(checkbox.checked){
						$this.updateAmount(checkbox, checkbox.value);
						//}

						// Update the button text based on the checkbox state
						button.textContent = checkbox.checked ? "Added" : "Add to Cart";

						// Optional: Add or remove a disabled class (if needed)
						button.classList.toggle("disabled", checkbox.checked);

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
				if(this.classList.contains('care_package_add_to_card')){
					const _care_package_add_to_card = document.querySelectorAll(".care_package_add_to_card");
					_care_package_add_to_card.forEach(add_to_card_btn => {
						add_to_card_btn.textContent = "Added";
						add_to_card_btn.style.pointerEvents = 'none'; // Disable pointer events
						add_to_card_btn.style.color = 'gray';
					})
				}
			});
		});
	}
	async displaySupplementaryProgram() {

		if (this.$suppPro.length > 0) return;
		// Get the container element
		let container = document.getElementById("checkout-supplimentary-data");
		container.innerHTML = "loading..."
		let apiData = await this.fetchData("getSupplementaryProgram/" + this.memberData.programId);
		// Added in our Local Data
		this.$suppPro = apiData;
		let prep_week_searchText = "topic prep week";
		let tutoring_week_searchText = "5 hours";
		//let variant_type = _vwo_exp[_vwo_exp_ids[0]].combination_chosen;
		let variant_type = this.getVariant();
		variant_type = variant_type != undefined || variant_type != null ? variant_type : "";
		let prep_week_data = apiData.filter(i => i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()))
		let tutoring_data = apiData.filter(i => i.label.toLowerCase().includes(tutoring_week_searchText.toLowerCase()))
		this.updateUpSellModal(prep_week_data, tutoring_data)
		if (variant_type == 1) {
			apiData = apiData.filter(i => !i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()));
		} else {
			apiData = apiData.filter(i => !i.label.toLowerCase().includes(tutoring_week_searchText.toLowerCase()));
		}
		apiData = apiData.filter(i => i.programDetailId != 21);
		container.innerHTML = ""
		apiData.forEach(item => {
			item.forumType = "Public Forum";
			const outerShadowDiv = this.displaySingleSuppProgram(item);
			container.appendChild(outerShadowDiv);
		});
	}
	updateUpSellModal(prep_week_data, tutoring_data) {

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

		}
	}
	// New UpSell Program / Supplementary
	displaySingleSuppProgram(item) {
		var $this = this;
		// Create the outer-shadow div
		const outerDiv = document.createElement("div");
		outerDiv.classList.add("div-block-93", "outer-shadow");
		// Create the grid container
		const gridDiv = document.createElement("div");
		gridDiv.classList.add("w-layout-grid", "payment-conf-program-grid", "upsell");

		// Create the course-info div (left column)
		const courseInfoDiv = document.createElement("div");
		courseInfoDiv.classList.add("course-info");

		const upsellDiv = document.createElement("div");
		upsellDiv.classList.add("upsell-div", "align-left");

		// Create the checkbox
		const checkboxDiv = document.createElement("div");
		checkboxDiv.classList.add("core-checkbox");

		const label = document.createElement("label");
		label.classList.add("w-checkbox");

		const input = document.createElement("input");
		input.classList.add("w-checkbox-input", "core-checkbox", "suppCheckbox");
		input.type = "checkbox";
		input.name = "checkbox";
		input.value = item.amount;
		input.setAttribute("programdetailid", item.programDetailId);
		input.setAttribute("data-name", "Checkbox");
		var $this = this;
		input.addEventListener("change", function () {
			this.checked ? outerDiv.classList.add('border-red') : outerDiv.classList.remove('border-red')
			$this.updateAmount(this, item.amount);
		})

		const span = document.createElement("span");
		span.classList.add("core-checkbox-label", "w-form-label");

		label.appendChild(input);
		label.appendChild(span);
		checkboxDiv.appendChild(label);

		const campNameDiv = document.createElement("div");
		campNameDiv.classList.add("camp-name", "margin-bottom-0");
		campNameDiv.textContent = item.label;

		upsellDiv.appendChild(checkboxDiv);
		upsellDiv.appendChild(campNameDiv);

		const forumTypeDiv = document.createElement("div");
		forumTypeDiv.classList.add("dm-sans");
		forumTypeDiv.textContent = item.forumType;

		const upsellDiv2 = document.createElement("div");
		upsellDiv2.classList.add("upsell-div", "margin-top-16");

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
		saveDiv2.textContent = parseFloat(item.disc_amount) - parseFloat(item.amount);

		priceItem.appendChild(saveDiv1);
		priceItem.appendChild(saveDiv2);

		upsellDiv2.appendChild(textBlockWrapper);
		upsellDiv2.appendChild(priceItem);

		courseInfoDiv.appendChild(upsellDiv);
		courseInfoDiv.appendChild(forumTypeDiv);
		courseInfoDiv.appendChild(upsellDiv2);

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

		priceWrapper1.appendChild(originalPriceDiv1);
		priceWrapper1.appendChild(discountedPriceDiv);

		priceDiv.appendChild(discountPriceDiv);
		priceDiv.appendChild(priceWrapper1);

		gridDiv.appendChild(courseInfoDiv);
		gridDiv.appendChild(priceDiv);

		outerDiv.appendChild(gridDiv);

		return outerDiv;
	}
	getVariant() {
		let variant = 1;
		//let topicPripUpSellModal = document.querySelector('.topic-prep_modal-container')
		let tutoringUpSellModal = document.querySelector('.tutoring-modal-container')
		if (window.getComputedStyle(tutoringUpSellModal).display === 'block') {
			variant = 2;
		}
		return variant
	}

}
