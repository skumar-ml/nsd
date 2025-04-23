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
        this.setModelDisplay();
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
    const isAbandonedModalOpen = localStorage.getItem("isAbandonedModalOpen");

    if (isAbandonedModalOpen == "true") {
      console.log("Modal is already open, not displaying again.");
      return;
    }else {
      console.log("Modal is not open, checking local storage cart data.");
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
          localStorage.setItem("checkOutData", JSON.stringify(data));
          return $this.checkAndDisplayModals(data);
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
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - this.data.hour);

      if (createdOnDate > sixHoursAgo) {
        console.log(
          `Fetched cart data is less than ${this.data.hour} hours old, not displaying modal.`,
          createdOnDate,
          sixHoursAgo
        );
        reject(`Fetched cart data is less than ${this.data.hour} hours old, not displaying modal.`); 
      }else {
        console.log(
          `Fetched cart data is older than ${this.data.hour} hours, checking for fiveMonthsAgo program start date.`, createdOnDate
        );
      }
      const fiveMonthsAgo = new Date();
      fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
      if (createdOnDate < fiveMonthsAgo) {
        console.log(
          "Fetched cart data is older than 5 months, not displaying modal.", createdOnDate
        );
        reject("Fetched cart data is older than 5 months, not displaying modal.");
      }else{
        console.log(
          "Fetched cart data is within the 5 months range, checking for program start date."
        );
      }

      if (data && this.isWithinAWeek(data.createdOn)) {
        if (data.programStartDate) {
          const programStartDate = new Date(data.programStartDate);
          const now = new Date();
          if (programStartDate > now) {
            console.log(
              "Program start date is after the current date, displaying modal.", data.programStartDate
            );
            resolve("Program start date is after the current date, displaying modal.");
          }else{
            console.log("Program start date is before the current date, not displaying modal.", data.programStartDate);
          }
        }
      }
    });
  }
  // Set the modal display to true in localStorage
  setModelDisplay() {
    localStorage.setItem("isAbandonedModalOpen", true);
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
