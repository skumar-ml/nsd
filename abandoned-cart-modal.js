class AbandonedCartModal {
  constructor(data) {
    this.baseUrl = data.baseUrl;
    this.memberId = data.memberId;
    this.modalId = data.modalId;
    this.modal = document.getElementById(this.modalId);
    this.closeButtons = this.modal?.querySelectorAll(".close-abandoned-modal");
    this.init();
    console.log("AbandonedCartModal initialized with data:", data);
  }

  init() {
    if (this.modal && this.closeButtons) {
      this.closeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          this.closeModal();
          this.setModelDisplay();
        });
      });
      console.log("Close buttons initialized:", this.closeButtons);
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
    if (
      window.location.pathname.includes("/cart/") ||
      window.location.pathname.includes("log-in")
    ) {
        console.log("User is on the cart page or login page, not displaying modal.");
      return;
    }
    const isAbandonedModalOpen = localStorage.getItem("isAbandonedModalOpen");

    if (isAbandonedModalOpen == false) {
        console.log("Modal is already open, not displaying again.");    
      return;
    }
    const cartData = localStorage.getItem("checkOutData");
    console.log("Cart data from localStorage:", cartData);
    if (cartData) {
      const parsedCartData = JSON.parse(cartData);
      if (parsedCartData.createdOn) {
        if (parsedCartData && this.isWithinAWeek(parsedCartData.createdOn)) {
            console.log("Cart data is within a week, displaying modal.");
          this.openModal();
          return;
        }
      }
    }

    this.fetchCartDataFromAPI()
      .then((data) => {
        console.log("Fetched cart data:", data);
        if (data.createdOn) {
          if (data && this.isWithinAWeek(data.createdOn)) {
            localStorage.setItem("checkOutData", JSON.stringify(data));
            this.openModal();
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching cart data:", error);
      });

    this.addLinkTOViewCartBtn();
  }

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
      console.log("Parsed cart data:", parsedCartData);
      // Check if parsedCartData is not empty or null before using it
      if (parsedCartData && parsedCartData.slug) {
        const baseUrl = window.location.origin;
        var cart_url = "";
        const programCategoryId = parsedCartData.programCategoryId;
        if (programCategoryId == "1111") {
          cart_url = `${baseUrl}/${parsedCartData.slug}?productType=residential`;
        } else if (programCategoryId == "2222") {
          cart_url = `${baseUrl}/${parsedCartData.slug}?productType=commuter`;
        } else if (programCategoryId == "3333") {
          cart_url = `${baseUrl}/${parsedCartData.slug}`;
        }
        viewCartBtn.href = cart_url;
      }
    }
    // Add event listener to viewCartBtn
  }
}


