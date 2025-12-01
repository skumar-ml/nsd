/*
Purpose: Displays a modal to prompt users to recover abandoned checkout carts. Validates cart age, program start dates, and respects user dismissal preferences before showing the modal. Also updates cart menu display with cart information.

Brief Logic: Checks localStorage or fetches cart data from API. Validates that cart is older than configured hours but less than 5 months, program hasn't started, and 7-day cooldown period has passed. If all conditions pass, displays modal and updates cart menu with program details.

Are there any dependent JS files: No
*/
class AbandonedCartModal {
  constructor(data) {
    this.data = data;
    this.baseUrl = data.baseUrl;
    this.memberId = data.memberId;
    this.modalId = data.modalId;
    this.modal = document.getElementById(this.modalId);
    this.closeButtons = this.modal?.querySelectorAll(".close-abandoned-modal");
    this.init();
  }

  init() {
    if (this.modal && this.closeButtons) {
      this.closeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          this.closeModal();
          this.setModelDisplay();
          
        });
      });
      this.checkAndDisplayModal();
    }
  }
  isWithinAWeek(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    return date >= oneWeekAgo && date <= now;
  }

  checkAndDisplayModal() {
    var $this = this;
    if (
      window.location.pathname.includes("/cart/") ||
      window.location.pathname.includes("log-in")
    ) {
      return;
    }
    
    const cartData = localStorage.getItem("checkOutData");
    if (cartData) {
      $this.displayCartMenuData()
      const parsedCartData = JSON.parse(cartData);
      if (parsedCartData.createdOn && parsedCartData.programStartDate) {
        $this.checkAndDisplayModals(parsedCartData).then((result) => { 
          $this.openModal();
          $this.addLinkTOViewCartBtn();
        }).catch((error) => {
          console.error("Error displaying modal:", error);
        });
      }
    }else {
      this.fetchCartDataFromAPI()
      .then((data) => {
        if (data.createdOn && data.programStartDate) {
          localStorage.setItem("checkOutData", JSON.stringify(data));
          $this.displayCartMenuData()
          return $this.checkAndDisplayModals(data);
        }else{
          return Promise.reject("No createdOn or programStartDate found in the response.");
        }
      }).then((result) => {
        $this.openModal();
        $this.addLinkTOViewCartBtn();
      }).catch((error) => {
        console.error("Error fetching cart data:", error);
      });
    }
  }
  checkAndDisplayModals(data) {
    return new Promise((resolve, reject) => {
      const createdOnDate = new Date(data.createdOn);
      const sixHoursAgo = new Date(Date.now() - this.data.hour * 60 * 60 * 1000);
      if (createdOnDate > sixHoursAgo) {
        reject(`Fetched cart data is less than ${this.data.hour} hours old, not displaying modal.`);
        return;
      }

      const fiveMonthsAgo = new Date();
      fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

      // Condition 2: If abandoned cart happened 5 months ago
      if (createdOnDate < fiveMonthsAgo) {
        reject("Fetched cart data is older than 5 months, not displaying modal.");
        return;
      }

      // Condition 3: If it is after the programStartDate for an abandoned cart
      if (data.programStartDate) {
        const programStartDate = new Date(data.programStartDate);
        const now = new Date();
        if (programStartDate <= now) {
          reject("Program start date is before or equal to the current date, not displaying modal.");
          return;
        }
      }

      // Condition 4: If user closes pop-up with “Continue Browsing” or cross button, show it again after 7 days
      const isAbandonedModalOpen = localStorage.getItem("isAbandonedModalOpen");
      if (isAbandonedModalOpen === "true") {
        const lastOpenedDate = new Date(localStorage.getItem("lastModalClosedDate"));
        const now = new Date();
        const sevenDaysLater = new Date(lastOpenedDate);
        sevenDaysLater.setDate(lastOpenedDate.getDate() + 7);

        if (now < sevenDaysLater) {
          reject("Modal was closed less than 7 days ago, not displaying modal.");
          return;
        }
      }
      // If all conditions pass, resolve to display the modal
      //console.log("All conditions passed, displaying modal.");
      resolve("All conditions passed, displaying modal.");
    });
  }
  // Set the modal display to true in localStorage
  setModelDisplay() {
    localStorage.setItem("isAbandonedModalOpen", true);
    localStorage.setItem(
      "lastModalClosedDate",
      new Date().toISOString()
    );  
  }

  async fetchCartDataFromAPI() {
    try {
      const response = await fetch(
        `${this.baseUrl}` + "getCheckoutURLByMemberId/" + this.memberId
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
  openModal() {
    if (this.modal) {
      this.modal.classList.add("show");
      this.modal.style.display = "flex";
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove("show");
      this.modal.style.display = "none";
    }
  }

  // Close modal when clicking outside of it (optional)
  handleOutsideClick(event) {
    if (event.target === this.modal) {
      this.closeModal();
    }
  }

  addLinkTOViewCartBtn() {
    const viewCartBtn = document.getElementById("view-cart-btn");
    const cartData = localStorage.getItem("checkOutData");
    // Check if cartData is not empty or null before parsing
    if (cartData) {
      const parsedCartData = JSON.parse(cartData);
      // Check if parsedCartData is not empty or null before using it
      if (parsedCartData && parsedCartData.slug) {
        const baseUrl = window.location.origin;
        var cart_url = "";
        const programCategoryId = parsedCartData.programCategoryId;
        if (programCategoryId == "1111") {
          cart_url = `${baseUrl}/cart/${parsedCartData.slug}?productType=residential&returnType=back`;
        } else if (programCategoryId == "2222") {
          cart_url = `${baseUrl}/cart/${parsedCartData.slug}?productType=commuter&returnType=back`;
        } else if (programCategoryId == "3333") {
          cart_url = `${baseUrl}/cart/${parsedCartData.slug}?returnType=back`;
        }
        viewCartBtn.href = cart_url;
      }
    }
    // Add event listener to viewCartBtn
  }
  displayCartMenuData() {
    // get checkOutData from local storage
    const noRecordsDivs = document.querySelectorAll("[data-cart-menu='no-records-div']");
    const cartDataDivs = document.querySelectorAll("[data-cart-menu='cart-data-div']");
    const cartRedIcons = document.querySelectorAll("[data-cart-menu='red-icon']");
    if(!noRecordsDivs.length && !cartDataDivs.length) {
        console.error("No elements found with data-cart-menu attributes.");
        return;
    }  
    if (!localStorage.getItem("checkOutData")) {
        noRecordsDivs.forEach(div => div.style.display = "block");
        cartDataDivs.forEach(div => div.style.display = "none");
        return;
    }
    const checkOutData = JSON.parse(localStorage.getItem("checkOutData"));
    if (!checkOutData) {
        noRecordsDivs.forEach(div => div.style.display = "block");
        cartDataDivs.forEach(div => div.style.display = "none");
        return;
    }
    if (!checkOutData.programStartDate || !checkOutData.programEndDate || !checkOutData.label || !checkOutData.firstName || !checkOutData.slug || !checkOutData.programCategoryId) {
        noRecordsDivs.forEach(div => div.style.display = "block");
        cartDataDivs.forEach(div => div.style.display = "none");
        return;
    }
    // Display block cart red icons
    cartRedIcons.forEach(icon => { icon.style.display = "block"; });
    
    const programNameElements = document.querySelectorAll("[data-cart-menu='programName']")
    if(programNameElements.length > 0){
        programNameElements.forEach((element) => {
            element.innerHTML = checkOutData.label;
        });
    }
    
    const programDateElements = document.querySelectorAll("[data-cart-menu='programDate']")
    if(programDateElements.length > 0){
        programDateElements.forEach((element) => {
            // add this format July 13-Aug 13, 2025
            const startDate = new Date(checkOutData.programStartDate);
            const endDate = new Date(checkOutData.programEndDate);
            const options = { month: 'long', day: 'numeric', year: 'numeric' };
            // remove the year from the start date
            const startDateString = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            const endDateString = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            element.innerHTML = startDateString + " - " + endDateString;
           
        });
    }

    const studentNameElements = document.querySelectorAll("[data-cart-menu='studentName']")
    if(studentNameElements.length > 0){
        studentNameElements.forEach((element) => {
            if(checkOutData.lastName){
                element.innerHTML = checkOutData.firstName + " " + checkOutData.lastName;
            }else {
                element.innerHTML = checkOutData.firstName;
            }
            
        });
    }

    const baseUrl = window.location.origin;
    var cart_url = "";
    const programCategoryId = checkOutData.programCategoryId;
    if (programCategoryId == "1111") {
        cart_url = `${baseUrl}/cart/${checkOutData.slug}?productType=residential&returnType=back`;
    } else if (programCategoryId == "2222") {
        cart_url = `${baseUrl}/cart/${checkOutData.slug}?productType=commuter&returnType=back`;
    } else if (programCategoryId == "3333") {
        cart_url = `${baseUrl}/cart/${checkOutData.slug}?returnType=back`;
    }

    const checkoutLinkElements = document.querySelectorAll("[data-cart-menu='checkoutLink']")
    if(checkoutLinkElements.length > 0){
        checkoutLinkElements.forEach((element) => {
                element.href = cart_url;
        });
    }
    this.setCartAnimation();
    cartDataDivs.forEach(div => div.style.display = "block");
    noRecordsDivs.forEach(div => div.style.display = "none");
    
  }
  setCartAnimation(){
    const cartDiv = document.querySelector('.cart-icon-rounded-div');
    var intervalId = setInterval(() => {
      cartDiv.classList.add('wiggle');
      setTimeout(() => cartDiv.classList.remove('wiggle'), 700);
      // Clear the interval after 3 seconds
      //clearInterval(intervalId);
    }, 3000);
  }
}
