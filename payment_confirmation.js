class PaymentConfirmation {
    constructor(webFlowMemberId, apiBaseUrl, site_url) {
        this.apiBaseUrl = apiBaseUrl;
        this.site_url = site_url;
        this.webFlowMemberId = webFlowMemberId;
        this.programId = this.getURLParam('programId')
        this.sessionId = this.getURLParam('transactionID')
        this.cart_page_variant = localStorage.getItem('_ab_test_variant');
        this.memberUrl = site_url +"members/"+ webFlowMemberId;
        if(!this.programId || !this.sessionId){
            return false;
        }
        this.eventHandlerForUpSellModal();
        this.displaySupplementaryProgram();
    }
    eventHandlerForUpSellModal() {
        let upSellModalBtn = document.getElementById('upsellModalBtn1')
        var $this = this;
        upSellModalBtn.addEventListener("click", function (event) {
            event.preventDefault()
            if($this.cart_page_variant != undefined){
                $this.displayUpSellModal();
            }else{
                window.location.href = $this.memberUrl;
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
        } else {
            console.log('Modal element not found.');
        }
        if (noThanks) {
            for (let index = 0; index < noThanks.length; index++) {
                const element = noThanks[index];
                element.addEventListener('click', function () {
                    window.location.href = $this.memberUrl;
                })

            }
        }
        const closeLinks = document.querySelectorAll('.upsell-close-link');
        if(closeLinks != undefined){
            closeLinks.forEach(function (closeLink) {
                console.log("SignIn Click Event Called");
                closeLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    window.location.href = $this.memberUrl;
                });
            });
        }
        $this.buyNow()
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

    async displaySupplementaryProgram() {
        let apiData = await this.fetchData("getSupplementaryProgram/" + this.programId);
        // Added in our Local Data
        this.$suppPro = apiData;
        let prep_week_searchText = "topic prep week";
        let tutoring_week_searchText = "5 hours";
        //let variant_type = _vwo_exp[_vwo_exp_ids[0]].combination_chosen;
        // let variant_type = this.memberData.variant_type
        // variant_type = variant_type != undefined || variant_type != null ? variant_type : "";
        let prep_week_data = apiData.filter(i => i.label.toLowerCase().includes(prep_week_searchText.toLowerCase()))
        let tutoring_data = apiData.filter(i => i.label.toLowerCase().includes(tutoring_week_searchText.toLowerCase()))
        this.updateUpSellModal(prep_week_data, tutoring_data)

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

    buyNow() {
        // Select all 'add-to-card' buttons
        const addToCartButtons = document.querySelectorAll(".add-to-card");
        var $this = this;
        addToCartButtons.forEach(button => {
            button.innerHTML = "Buy Now";
            button.addEventListener("click", function (event) {

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
            "successUrl": this.site_url+"members/"+ this.webFlowMemberId,
            "cancelUrl": this.site_url+"payment-confirmation?programId=" + encodeURIComponent(programId) + "&sessionId=" + encodeURIComponent(this.sessionId),
            "label": programName,
            "amount": parseFloat(amount*100)
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
}
