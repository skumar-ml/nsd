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

    const viewCartBtn = document.getElementById("view-cart-btn");
    if (viewCartBtn) {
      viewCartBtn.addEventListener("click", () => {
        //this.setModelDisplay();
      });
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
      console.log(
        "User is on the cart page or login page, not displaying modal."
      );
      return;
    }
    
    const cartData = localStorage.getItem("checkOutData");
    if (cartData) {
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
          data.createdOn = new Date(data.createdOn).toLocaleString();
          console.log('checkOutData from database', JSON.stringify(data))
          localStorage.setItem("checkOutData", JSON.stringify(data));
          return $this.checkAndDisplayModals(data);
        }else{
          console.log("No createdOn or programStartDate found in the response.");
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
      //const sixHoursAgo = new Date();
      //sixHoursAgo.setHours(sixHoursAgo.getMinutes() - 5);
      const sixHoursAgo = new Date(Date.now() - this.data.hour * 60 * 60 * 1000);
      //const sixHoursAgo = new Date(Date.now() - 5 * 60 * 1000);
      // Condition 1: If abandoned cart happened less than 6 hours ago
      if (createdOnDate > sixHoursAgo) {
        console.log(
          `Fetched cart data is less than ${this.data.hour} hours old, not displaying modal.`,
          createdOnDate,
          sixHoursAgo
        );
        reject(`Fetched cart data is less than ${this.data.hour} hours old, not displaying modal.`);
        return;
      }else{
        console.log(
          "Condition 1", 
          createdOnDate, 
          sixHoursAgo)
      }

      const fiveMonthsAgo = new Date();
      fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

      // Condition 2: If abandoned cart happened 5 months ago
      if (createdOnDate < fiveMonthsAgo) {
        console.log(
          "Fetched cart data is older than 5 months, not displaying modal.",
          createdOnDate
        );
        reject("Fetched cart data is older than 5 months, not displaying modal.");
        return;
      } else {
        console.log(
          "Condition 2",
          createdOnDate,
          fiveMonthsAgo
        )
      }

      // Condition 3: If it is after the programStartDate for an abandoned cart
      if (data.programStartDate) {
        const programStartDate = new Date(data.programStartDate);
        const now = new Date();
        if (programStartDate <= now) {
          console.log(
            "Program start date is before or equal to the current date, not displaying modal.",
            data.programStartDate
          );
          reject("Program start date is before or equal to the current date, not displaying modal.");
          return;
        } else {
          console.log(
            "Condition 3",
            data.programStartDate
          )
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
          console.log(
            "Modal was closed less than 7 days ago, not displaying modal."
          );
          reject("Modal was closed less than 7 days ago, not displaying modal.");
          return;
        } else {
          console.log(
            "Condition 4",
            now,
            sevenDaysLater
          )
        }
      }

      // Condition: If user has an abandoned cart before a purchase
      // No need to check has purchase
      //const hasPurchased = localStorage.getItem("hasPurchased");
      // if (hasPurchased === "true") {
      //   console.log(
      //     "User has made a purchase after the abandoned cart, not displaying modal."
      //   );
      //   reject("User has made a purchase after the abandoned cart, not displaying modal.");
      //   return;
      // }

      // If all conditions pass, resolve to display the modal
      console.log("All conditions passed, displaying modal.");
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
      console.error("Failed to fetch cart data:", error);
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
          cart_url = `${baseUrl}/cart/${parsedCartData.slug}?productType=residential`;
        } else if (programCategoryId == "2222") {
          cart_url = `${baseUrl}/cart/${parsedCartData.slug}?productType=commuter`;
        } else if (programCategoryId == "3333") {
          cart_url = `${baseUrl}/cart/${parsedCartData.slug}`;
        }
        viewCartBtn.href = cart_url;
      }
    }
    // Add event listener to viewCartBtn
  }
}
