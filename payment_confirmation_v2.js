/*
Purpose: Success-page logic that reads query params, shows supplementary upsells, and resets checkout UI states.

Brief Logic: Reads query parameters from URL to determine payment status. Displays supplementary program upsells and resets checkout UI states for next transaction.

Are there any dependent JS files: No
*/
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
class PaymentConfirmation {
    $suppPro = [];
    constructor(webFlowMemberId, apiBaseUrl, site_url) {
        this.apiBaseUrl = apiBaseUrl;
        this.site_url = site_url;
        this.webFlowMemberId = webFlowMemberId;
        this.programId = this.getURLParam('programId')
        this.sessionId = this.getURLParam('transactionID')
        this.cart_page_variant = localStorage.getItem('_ab_test_variant');
        this.memberUrl = site_url +"members/"+ webFlowMemberId;
        this.portal_home = site_url +"portal/home?from=success";
        if(!this.programId || !this.sessionId){
            return false;
        }
        this.setUpBackButtonTab();
        this.eventHandlerForUpSellModal();
        this.displaySupplementaryProgram();
        
        
    }
    

    setUpBackButtonTab() {
        var ibackbutton = document.getElementById("backbuttonstate");
        console.log("Value set", ibackbutton.value);
            if ( ibackbutton.value == 1){
                // initalize again slider
                console.log("Value Set");
                this.initSlickSlider();
                
            }
    }

        handleLearnMoreClick(programDetailId) {
            let prep_week_searchText = "topic prep week";
        
            // Filter data for the clicked programDetailId
            let tutoring_data = this.$suppPro.filter(i =>
                i.label.toLowerCase().includes("tutoring") && i.programDetailId === programDetailId
            );
        
            let prep_week_data = this.$suppPro.filter(i =>
                i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()) && i.programDetailId === programDetailId
            );
        
            let carePackageData = this.$suppPro.find(i => i.programDetailId === 21);
        
            // Select modal elements
            let topicPrepUpSellModal = document.querySelector('.upsell-modal-container.topic-prep-week');
            let tutoringUpSellModal = document.querySelector('.upsell-modal-container.tutoring');
        
            // If programDetailId == 21, show the care package modal
            if (programDetailId === 21 && carePackageData) {
                let modal = document.getElementById('care-package-modal');
        
                if (modal) {
                    modal.classList.add('show');
                    modal.style.display = 'flex';
                    this.initializeProductSlider();
        
                    var $this = this;
                    const closeLinks = document.querySelectorAll('.upsell-close-link.order-details');
                    if (closeLinks) {
                        closeLinks.forEach(closeLink => {
                            closeLink.addEventListener('click', function (event) {
                                event.preventDefault();
                                $this.hideUpSellModal(modal);
                            });
                        });
                    }
                } else {
                    console.warn("Care package modal not found.");
                }
                return;
            }
        
            // Ensure the correct modal opens based on clicked programDetailId
            if (prep_week_data.length > 0) {
                
                if (tutoringUpSellModal) tutoringUpSellModal.style.display = "none";
                if (topicPrepUpSellModal) {
                    topicPrepUpSellModal.style.display = "flex";
                    this.updatePrepWeekModal(prep_week_data);
                }
            } else if (tutoring_data.length > 0) {
                
                if (tutoringUpSellModal) {
                    tutoringUpSellModal.style.display = "flex";
                    this.updateTutoringModal(tutoring_data);
                }
                if (topicPrepUpSellModal) topicPrepUpSellModal.style.display = "none";
            } else {
                //console.warn(`No matching tutoring or prep week data found for programDetailId: ${programDetailId}.`);
                return;
            }
        
            // Show the modal
            this.displayUpSellModal();
        }
        
        
        
        initializeProductSlider() {
        // Initialize the main slider
        var $sliderFor = $('.slider-for');
        if (!$sliderFor.hasClass('slick-initialized')) {
            $sliderFor.slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false, 
                fade: true,
                asNavFor: '.slider-nav',
                responsive: [
                    {
                        breakpoint: 568,
                        settings: {
                            fade: false 
                        }
                    }
                ]
            });
        }
    
        const productDetails = [
            { content: "Limited Edition NSD Hoodie - Stay warm, look sharp, and rep NSD in this premium, unisex sweatshirt. Made from soft, high-quality fabric, it’s your new go-to for debate camp and beyond. Available only as part of the bundle, this hoodie is a must-have for every NSD student—grab yours before they’re gone!" },
            { content: "The Timer Every Debater Needs - From practice rounds at camp to final rounds at tournaments, the NSD Timer is your go-to tool for staying in control of the clock and perfecting your speeches." },
            { content: "Hydration Made Simple - Stay hydrated in style with the NSD water bottle. Its durable metal build and striking red color make it the perfect companion for busy camp days and high-stakes tournaments." },
            { content: "NSD Hat: Where Comfort Meets Cool - Stay sharp and stylish with the unisex NSD hat, crafted for comfort and durability. Designed in a sleek, classic colorway, it’s the perfect accessory to rep your NSD pride—whether at camp, a tournament, or out and about." },
            { content: "NSD Tote Bag - This NSD tote’s sturdy, high-quality materials hold all your essentials, yet remain sleek and easy to carry. With its clean design and iconic NSD logo, it adds a polished touch to your routine—whether you’re headed to a debate round or a coffee shop." }
        ];
    
        $sliderFor.on('afterChange', function(event, slick, currentSlide) {
            console.log('Current Slide Index:', currentSlide);
            const productInfoElement = document.querySelector('.product-info');
    
            if (productInfoElement) {
                const content = productDetails[currentSlide].content;
                console.log('Content to display:', content);
    
                const [name, description] = content.split(' - ');
                
                const productNameElement = productInfoElement.querySelector('.product-name_span-text');
                console.log("Name", productNameElement);
                const productDescriptionElement = productInfoElement.querySelector('.product-description-2');
                console.log("Description", productDescriptionElement);
    
                if (productNameElement && productDescriptionElement) {
                    productNameElement.innerHTML = name;
                    productDescriptionElement.innerHTML = description;
    
                    console.log('Updated Product Name:', productNameElement.innerHTML);
                    console.log('Updated Product Description:', productDescriptionElement.innerHTML);
                }
            }
        });
    
        var $sliderNav = $('.slider-nav');
        if (!$sliderNav.hasClass('slick-initialized')) {
            $sliderNav.slick({
                slidesToShow: 5,
                asNavFor: '.slider-for',
                dots: false, 
                centerMode: false,
                focusOnSelect: true,
            });
        }
    }
    
    eventHandlerForUpSellModal() {
        let upSellModalBtn = document.getElementById('upsellModalBtn1')
        var $this = this;
        upSellModalBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if ($this.portal_home) {
                window.location.href = $this.portal_home;
            } else {
                console.warn("portal_home is not defined.");
            }
            
        })

        // Showing up-sell modal content based on cart page modal variant
        if($this.cart_page_variant != undefined){
            let topicPrepUpSellModal = document.querySelector('.upsell-modal-container.topic-prep-week')
		    let tutoringUpSellModal = document.querySelector('.upsell-modal-container.tutoring')
            if($this.cart_page_variant == 2){
                tutoringUpSellModal.style.display = "none";
                topicPrepUpSellModal.style.display = "flex";
            }else{
                tutoringUpSellModal.style.display = "flex";
                topicPrepUpSellModal.style.display = "none";
            }
        }
    }
    
    displayUpSellModal() {
        const modal = document.getElementById('upsell-modal-1');
        var $this = this;
        const noThanks = document.getElementsByClassName('no-thanks');

        if (modal) {
            console.log('Showing modal on page load');
            $this.showUpSellModal(modal);
            //window.location.href = $this.portal_home;
        } else {
            console.log('Modal element not found.');
        }
        if (noThanks) {
            for (let index = 0; index < noThanks.length; index++) {
                const element = noThanks[index];
                element.addEventListener('click', function () {
                    //$this.hideUpSellModal(modal);
                    window.location.href = $this.portal_home;
                })

            }
        }
        const closeLinks = document.querySelectorAll('.upsell-close-link');
        if(closeLinks != undefined){
            closeLinks.forEach(function (closeLink) {
                console.log("SignIn Click Event Called");
                closeLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    $this.hideUpSellModal(modal);
                    //window.location.href = $this.portal_home;
                });
            });
        }
        //$this.buyNow()
    }

    showUpSellModal(modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.querySelector('.upsell-modal-bg').setAttribute('aria-hidden', 'false');
    }

    hideUpSellModal(modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.querySelector('.upsell-modal-bg').removeAttribute('aria-hidden');
    }

    // Get API data with the help of endpoint
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`);
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

    updatePrepWeekModal(prep_week_data) {
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
            var upSellTpwProgramId = document.getElementById('upsellTpwProgranId');
            if (upSellTpwProgramId != undefined) {
                upSellTpwProgramId.setAttribute('programdetailid', prep_week_data[0].programDetailId)
                upSellTpwProgramId.setAttribute('programName', prep_week_data[0].label)
                upSellTpwProgramId.value = prep_week_data[0].amount
            }
            // For mobile upsellTpwProgranId-1
			var upsellTpwProgranIdMob = document.getElementById('upsellTpwProgranId-1');
			if (upsellTpwProgranIdMob != undefined) {
				upsellTpwProgranIdMob.setAttribute('programdetailid', prep_week_data[0].programDetailId)
                upsellTpwProgranIdMob.setAttribute('programName', prep_week_data[0].label)
                upsellTpwProgranIdMob.value = prep_week_data[0].amount
			}

            let tpwTitle = document.querySelector("[upsell-modal='tpw-title']")
			if(tpwTitle != undefined){
				tpwTitle.innerHTML = prep_week_data[0].label
			}
            let tpwReadMore = document.querySelectorAll("[upsell-modal='tpw_read-more']")
			if (tpwReadMore.length > 0) {
				tpwReadMore.forEach(read_more_link => {
					read_more_link.href = this.site_url + "topic-prep-week";
				})
			}


        }
    }

    //updateTutoringModal(tutoring_data) {
        updateTutoringModal(tutoring_data) {
        if (tutoring_data.length > 0) {
            var tutoringAmount = document.getElementById('tuto-amount');
            if (tutoringAmount != undefined) {
                tutoringAmount.innerHTML = "$" + parseFloat(tutoring_data[0].amount).toFixed(2);
            }
            var tutoringSaveAmount = document.getElementById('tuto-save-amount');
            if (tutoringSaveAmount != undefined) {
                tutoringSaveAmount.innerHTML = "$" + parseFloat(tutoring_data[0].disc_amount - tutoring_data[0].amount).toFixed(2)
            }
            var tutoringDescAmount = document.getElementById('tuto-desc-amount');
            if (tutoringDescAmount != undefined) {
                tutoringDescAmount.innerHTML = "$" + parseFloat(tutoring_data[0].disc_amount).toFixed(2)
            }
            var upSellTutoringProgramId = document.getElementById('upsellTutoProgranId');
            if (upSellTutoringProgramId != undefined) {
                upSellTutoringProgramId.setAttribute('programdetailid', tutoring_data[0].programDetailId)
                upSellTutoringProgramId.setAttribute('programName', tutoring_data[0].label)
                upSellTutoringProgramId.value = tutoring_data[0].amount
            }
            // Mobile div id upsellTutoProgranId-1
			var upsellTutoProgranIdMob = document.getElementById('upsellTutoProgranId-1');
			if (upsellTutoProgranIdMob != undefined) {
				upsellTutoProgranIdMob.setAttribute('programdetailid', tutoring_data[0].programDetailId)
                upsellTutoProgranIdMob.setAttribute('programName', tutoring_data[0].label)
                upsellTutoProgranIdMob.value = tutoring_data[0].amount
			}

            //tutoring title
			let tutoringTitle = document.querySelector("[upsell-modal='tutoring-title']")
			if(tutoringTitle != undefined){
				tutoringTitle.innerHTML = tutoring_data[0].label
			}

            let tutoringReadMore = document.querySelectorAll("[upsell-modal='tutoring_read-more']")
			if (tutoringReadMore.length > 0) {
				tutoringReadMore.forEach(read_more_link => {
					read_more_link.href = this.site_url + "debate-tutoring";
				})
			} 
        }
    }

    updateCarePackageModal(care_package_data) {

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

    buyNow() {
        // Select all 'add-to-card' buttons
        const addToCartButtons = document.querySelectorAll(".add-to-card");
        var $this = this;

        addToCartButtons.forEach(button => {
            button.innerHTML = "Buy Now";
            button.addEventListener("click", function (event) {

                // Select back button element properly
                var ibackbutton = document.getElementById("backbuttonstate");
                if (ibackbutton) {
                    ibackbutton.value = "1"; // Set value correctly
                } else {
                    console.error("Error: #backbuttonstate element not found");
                }
                event.preventDefault(); // Prevent default link behavior

                // Find the parent container with the 'btn-reserve-spot' class
                const parent = button.closest(".button_add-to-card");

                if (parent) {
                    // Locate the child checkbox within the parent container
                    const checkbox = parent.querySelector(".suppCheckbox");

                    if (checkbox) {
                        // Toggle the checkbox state
                        checkbox.checked = !checkbox.checked;
                        if (checkbox.checked) {
                            let programId = checkbox.getAttribute('programdetailid'),
                                programName = checkbox.getAttribute('programName'),
                                amount = checkbox.value;
                            $this.getPaymentUrl(programId, programName, amount);
                        }
                        // Update the button text based on the checkbox state
                        button.textContent = checkbox.checked ? "Processing..." : "Buy Now";

                        // Optional: Add or remove a disabled class (if needed)
                        button.classList.toggle("disabled", checkbox.checked);
                    }
                }
            });
        });
    }

    getURLParam(name) {
        //transactionID
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(name);


    }
    getPaymentUrl(programId, programName, amount) {
        // Define the data to be sent in the POST request
        const data = {
            "sessionId": this.sessionId,
            "programId": parseInt(programId),
            "successUrl": this.site_url+"members/"+ this.webFlowMemberId+"?paymentType=Supplementary",
            "cancelUrl": this.site_url+"payment-confirmation?programId=" + encodeURIComponent(this.programId) + "&transactionID=" + encodeURIComponent(this.sessionId),
            "label": programName,
            "amount": parseFloat(amount*100),
            "source": "success_page"
        };
        // Create the POST request
        fetch(this.apiBaseUrl+"createCheckoutUrlForSupplementary", {
                method: 'POST', // Specify the method
                headers: {
                    'Content-Type': 'application/json' // Specify the content type
                },
                body: JSON.stringify(data) // Convert the data to a JSON string
            })
            .then(response => {
                if (!response.ok) {
                    // Handle the error response
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json(); // Parse the JSON from the response
            })
            .then(data => {
                console.log('Success:', data); // Handle the JSON data
                if (data.success) {
                    console.log(data.cardUrl);
                    window.location.href = data.cardUrl;

                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error); // Handle errors
            });
    }

    
    async displaySupplementaryProgram() {
		let container2 = document.getElementById("checkout-supplimentary-data-2");
		let swiperSlideWrapper = container2.querySelector('.you-might_slick-slider')
        // loader icon code
			var spinner = document.getElementById("half-circle-spinner");
			spinner.style.display = "block";
		
		// Get the container element
		let apiData = await this.fetchData("getSupplementaryProgram/" + this.programId);
		let allApiData = apiData;
		// Added in our Local Data
		this.$suppPro = apiData;
		let prep_week_searchText = "topic prep week";
		let tutoring_week_searchText = "5 hours";
        
        
		//let variant_type = _vwo_exp[_vwo_exp_ids[0]].combination_chosen;
		let variant_type = this.cart_page_variant;
		variant_type = variant_type != undefined || variant_type != null ? variant_type : "";
		let prep_week_data = apiData.filter(i => i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()))
        //console.log(prep_week_data);
		let tutoring_data = apiData.filter(i => i.label.toLowerCase().includes(tutoring_week_searchText.toLowerCase()))       
        let care_package_data = apiData.find(i => i.programDetailId == 21);

		this.updatePrepWeekModal(prep_week_data);
        this.updateTutoringModal(tutoring_data);
        this.updateCarePackageModal(care_package_data);
      		
		
        if (variant_type == 1) {
            apiData = apiData.filter(i => !i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()));
        } else {
            apiData = apiData.filter(i => !i.label.toLowerCase().includes(tutoring_week_searchText.toLowerCase()));
          
        }
		
		apiData = apiData.filter(i => i.programDetailId != 21);

		if(!apiData.length){
			swiperSlideWrapper.style.display="none";
		}
	    if(!allApiData.length){
			swiperSlideWrapper.style.display="none";
		}
		
		if (container2 == undefined) return;
		
		if (swiperSlideWrapper == undefined) return

		swiperSlideWrapper.innerHTML = "";
		allApiData.forEach(item => {
			item.forumType = "Public Forum";
			//slider div
			/*let swiperSlide = creEl('div', 'you-might_slide-item')
			const outerShadowDiv1 = this.displaySingleSuppProgram(item, 'desktop', swiperSlide);
			swiperSlide.appendChild(outerShadowDiv1)
			swiperSlideWrapper.prepend(swiperSlide)*/

            let swiperSlide = document.createElement("div");
            swiperSlide.classList.add("you-might_slide-item");
            const updatedSlide = this.displaySingleSuppProgram(item, 'desktop', swiperSlide);
            swiperSlideWrapper.prepend(updatedSlide);

		});
        this.initSlickSlider();
        this.buyNow();
        // loader icon code
			
			spinner.style.display = "none";
		if(apiData.length == 0){
			container2.style.display = "none";
			return;
		}
	}
	initSlickSlider() {
		var $slider = $('.you-might_slick-slider');
		// Check if the slider is already initialized
		if (!$slider.hasClass('slick-initialized')) {

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
			// Initialize you might slider
			var $sliderYouMight = $slider.slick(slickSettings);
            var $sliderFamilies = $(".why-families_slick-slider").slick(
                slickSettings
              );

			// Shared navigation logic for the "You Might" slider
			$('.left-arrow-slick').click(function () {
				console.log("You Might: Left arrow clicked.");
				$sliderYouMight.slick('slickPrev');
			});

			$('.right-arrow-slick').click(function () {
				console.log("You Might: Right arrow clicked.");
				$sliderYouMight.slick('slickNext');
			});
            // Shared navigation logic for the "Why Families" slider
            $(".families-left-arrow").click(function () {
                console.log("Why Families: Left arrow clicked.");
                $sliderFamilies.slick("slickPrev");
              });

              $(".families-right-arrow").click(function () {
                console.log("Why Families: Right arrow clicked.");
                $sliderFamilies.slick("slickNext");
              });
		}

	}
    shouldShowLearnMore(programId) {
        const allowedProgramIds = [10, 11, 12, 13, 21];
        return allowedProgramIds.includes(parseInt(programId));
    }
    // New UpSell Program / Supplementary
	displaySingleSuppProgram(item, size, slideDiv) {
        var $this = this;
    
        // Create the first wrapper
        const flexWrapper1 = document.createElement("div");
        flexWrapper1.classList.add("you-might-flex-wrapper");
    
        // Create the text block wrapper
        const textBlockWrapper = document.createElement("div");
        textBlockWrapper.classList.add("text-block-wrapper");
    
        item.tags.forEach(tag => {
            const tagDiv = document.createElement("div");
            tagDiv.classList.add("payment-conf-tag");
            tagDiv.style.backgroundColor = tag.color;
            tagDiv.textContent = tag.name;
            textBlockWrapper.appendChild(tagDiv);
        });
    
        flexWrapper1.appendChild(textBlockWrapper);
        slideDiv.appendChild(flexWrapper1); // Append to slideDiv
    
        // Create the second wrapper
        const flexWrapper2 = document.createElement("div");
        flexWrapper2.classList.add("you-might-flex-wrapper");
    
        const courseInfoDiv = document.createElement("div");
        const campNameDiv = document.createElement("div");
        campNameDiv.classList.add("camp-name");
        campNameDiv.textContent = item.label;
        courseInfoDiv.appendChild(campNameDiv);
    
        const priceWrapper = document.createElement("div");
        priceWrapper.classList.add("price-wrapper", "upsell");
    
        const saveItem = document.createElement("div");
        saveItem.classList.add("price-item");
    
        const saveLabel = document.createElement("div");
        saveLabel.classList.add("save-amount");
        saveLabel.textContent = "Save";
    
        const saveAmount = document.createElement("div");
        saveAmount.classList.add("save-amount");
        saveAmount.textContent = "$" + (parseFloat(item.disc_amount) - parseFloat(item.amount)).toFixed(2);
    
        saveItem.appendChild(saveLabel);
        saveItem.appendChild(saveAmount);
    
        const originalPriceDiv = document.createElement("div");
        originalPriceDiv.classList.add("price-item", "upsell");
        originalPriceDiv.innerHTML = `<div class='original-price'>$${item.disc_amount}</div>`;
    
        const discountedPriceDiv = document.createElement("div");
        discountedPriceDiv.classList.add("price-item", "upsell");
        discountedPriceDiv.innerHTML = `<div class='discounted-price text-blue'>$${item.amount}</div>`;
    
        priceWrapper.appendChild(saveItem);
        priceWrapper.appendChild(originalPriceDiv);
        priceWrapper.appendChild(discountedPriceDiv);
    
        courseInfoDiv.appendChild(priceWrapper);
        flexWrapper2.appendChild(courseInfoDiv);
    
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("mob-width-100");
        const buttonDiv = document.createElement("div");
        buttonDiv.classList.add("button_add-to-card", "marginbottom-10px");
    
        const buyNowButton = document.createElement("a");
        buyNowButton.href = "#";
        buyNowButton.classList.add("main-button-26", "red", "add-to-card", "upsell_add_to_card", "padding-with-full-width", "w-button");
        buyNowButton.style.width = "100%";
        buyNowButton.textContent = "Buy Now";
    
        const hiddenDiv = document.createElement("div");
        hiddenDiv.classList.add("hide", "w-embed");
    
        const checkbox = document.createElement("input");
        checkbox.classList.add("w-checkbox-input", "core-checkbox", "suppCheckbox", "hide");
        checkbox.id = "upsellTpwProgranId-1";
        checkbox.type = "checkbox";
        checkbox.name = "checkbox";
        checkbox.value = item.amount;
        checkbox.setAttribute("programdetailid", item.programDetailId);
        checkbox.setAttribute("data-name", "Checkbox");
        checkbox.setAttribute("programname", item.label);
        hiddenDiv.appendChild(checkbox);
    
        buttonDiv.appendChild(buyNowButton);
        buttonDiv.appendChild(hiddenDiv);

        buttonContainer.appendChild(buttonDiv);

        let learnMoreButton = null;
         var $this = this;
        // Learn More Button (Only for specific program IDs)
        if (this.shouldShowLearnMore(item.programDetailId)) {
            learnMoreButton = document.createElement("a");
            learnMoreButton.id = "learnMore";
            learnMoreButton.href = "#";
            learnMoreButton.classList.add("main-button", "red", "alternate", "upsell", "w-button");
            learnMoreButton.textContent = "Learn More";
             // Attach event listener
            learnMoreButton.addEventListener("click", (event) => {
                //Call handleLearnMore function
              $this.handleLearnMoreClick(item.programDetailId);
          });
            buttonContainer.appendChild(learnMoreButton);
        }
    
        flexWrapper2.appendChild(buttonContainer);
        slideDiv.appendChild(flexWrapper2); // Append to slideDiv
    
        return slideDiv; // Return the updated slideDiv
    }
    
}

