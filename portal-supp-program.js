class DisplaySuppProgram {
  $selectedProgram = [];
  constructor(memberData) {
    this.memberData = memberData;
    this.displaySupplementaryProgram();
    this.updateOldStudentList();
    this.handlePaymentEvents();
  }
  /**
   *
   * @param name - HTML element name
   * @param className - HTML element class attribute
   * @param idName - HTML element id attribute
   */
  creEl(name, className, idName) {
    var el = document.createElement(name);
    if (className) {
      el.className = className;
    }
    if (idName) {
      el.setAttribute("id", idName);
    }
    return el;
  }
  async fetchData(endpoint) {
    try {
      const response = await fetch(`${this.memberData.baseUrl}${endpoint}`);
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
 /* async displaySupplementaryProgram() {
    var spinner = document.getElementById("half-circle-spinner");
    spinner.style.display = "block";
    //let apiData = await this.fetchData("getSupplementaryProgram/all");
     let apiData = await this.fetchData("getSupplementaryProgram/" + this.memberData.memberId);
    console.log("apiData", apiData);
    // Option A
    let swiperSlideWrapper = document.querySelector(
      ".discounted-programs-slick-slider"
    );

    if (!apiData.length) {
      swiperSlideWrapper.style.display = "none";
    }

    if (swiperSlideWrapper == undefined) return;

    swiperSlideWrapper.innerHTML = "";

    // Option B

    let swiperSlideWrapperB = document.querySelector(
      ".supp-programs-slick-slider"
    );

    if (!apiData.length) {
      swiperSlideWrapperB.style.display = "none";
    }

    if (swiperSlideWrapperB == undefined) return;

    swiperSlideWrapperB.innerHTML = "";

    // For Modal content
    let swiperSlideWrapperM = document.querySelector(
      ".supp-programs-description-wrapper"
    );

    if (!apiData.length) {
      swiperSlideWrapperM.style.display = "none";
    }

    if (swiperSlideWrapperM == undefined) return;

    swiperSlideWrapperM.innerHTML = "";

    apiData.forEach((item) => {
      item.forumType = "Public Forum";
      //slider div
      if (item.disc_amount && item.portal_amount) {
        // Option A
        const outerShadowDivA = this.displaySingleSuppProgram(item);
        swiperSlideWrapper.prepend(outerShadowDivA);
        if (item.benefits.length > 0) {
          // Option b
          const outerShadowDivB = this.displaySingleSuppProgramB(item);
          swiperSlideWrapperB.prepend(outerShadowDivB);
        }
        // Modal Content
        const outerShadowDivM = this.displaySingleSuppProgramB(item, "modal");
        swiperSlideWrapperM.prepend(outerShadowDivM);
      }
    });
    this.initSlickSlider();
    this.closeIconEvent();
    spinner.style.display = "none";
  }
*/
  async displaySupplementaryProgram() {
   // var spinner = document.getElementById("half-circle-spinner");
   // spinner.style.display = "block";
    let apiData = await this.fetchData("getSupplementaryProgram/" + this.memberData.memberId);
    console.log("apiData", apiData);
    // Option A
    let swiperSlideWrappers = document.querySelectorAll(
      ".discounted-programs-slick-slider"
    );
   // hidden initial swiperSlideWrappers
    swiperSlideWrappers.forEach(wrapper => wrapper.style.visibility = "hidden");
    if (!apiData.length) {
      swiperSlideWrappers.forEach(wrapper => wrapper.style.display = "none");
    }

    if (swiperSlideWrappers == undefined) return;

    swiperSlideWrappers.forEach(wrapper => wrapper.innerHTML = "");

    // Option B

    // let swiperSlideWrapperB = document.querySelector(
    //   ".supp-programs-slick-slider"
    // );

    // if (!apiData.length) {
    //   swiperSlideWrapperB.style.display = "none";
    // }

    //if (swiperSlideWrapperB == undefined) return;

    //swiperSlideWrapperB.innerHTML = "";

    // For Modal content
    let swiperSlideWrapperM = document.querySelector(
      ".supp-programs-description-wrapper"
    );

    if (!apiData.length) {
      swiperSlideWrapperM.style.display = "none";
    }

    if (swiperSlideWrapperM == undefined) return;

    swiperSlideWrapperM.innerHTML = "";

    apiData.forEach((item) => {
      item.forumType = "Public Forum";
      //slider div
      if (item.disc_amount && item.portal_amount) {
        // Option A
        swiperSlideWrappers.forEach((swiperSlideWrapper) => {
          var outerShadowDivA = this.displaySingleSuppProgram(item);
          swiperSlideWrapper.prepend(outerShadowDivA);
        });
        // if (item.benefits.length > 0) {
        //   if(swiperSlideWrapperB){
        //     var outerShadowDivB = this.displaySingleSuppProgramB(item);
        //     swiperSlideWrapperB.prepend(outerShadowDivB);
        //   }
        // }
        // Modal Content
        var outerShadowDivM = this.displaySingleSuppProgramB(item, "modal");
        swiperSlideWrapperM.prepend(outerShadowDivM);
      }
    });
    this.initSlickSlider();
    this.closeIconEvent();
    //spinner.style.display = "none";
    setTimeout(() => {
      swiperSlideWrappers.forEach(wrapper => wrapper.style.visibility = "visible");
    }, 1000);
  }
  displaySingleSuppProgram(item) {
    var $this = this;
    let discount_amount = item.disc_amount - item.portal_amount;
    let discount = Number.isInteger(discount_amount)
      ? discount_amount
      : parseFloat(discount_amount).toFixed(2);
    // Create main container
    //var slideItem = $this.creEl("div", "discounted-programs-slide-item");
    let bannerTypeClass = "banner-content-" + item.programDetailId;
    var slideItem = $this.creEl("div", "discounted-programs-slide-item " + bannerTypeClass);
    // Image wrapper
    var imgWrapper = $this.creEl("div", "discounted-programs-img-wrapper");

    // Image
    var img = $this.creEl("img", "supp-programs-img sidebar-slider-image");
    img.src =item.banner_img_sm;
    img.loading = "lazy";
    img.alt = "";

    // $190 OFF text
    var offText = $this.creEl("div", "dm-sans absolute-bold-shadow");
    offText.innerHTML =
      "$" + discount + '<br /><span class="off-text-red">OFF</span>';

    // Limited time offer text
    var limitedTime = $this.creEl("div", "dm-sans limited-time");
    limitedTime.innerHTML = "Limited Time Offer<br />";

    // Append image and texts to wrapper
    imgWrapper.appendChild(img);
    imgWrapper.appendChild(offText);
    imgWrapper.appendChild(limitedTime);

    // Discounted programs content
    var programsDiv = $this.creEl("div", "discounted-programs-div summer-program");

    // Title
    var title = $this.creEl(
      "div",
      "dm-sans bold-700 text-medium-with-margin-bottom"
    );
    title.textContent = item.label;

    // Price label
    var priceLabel = $this.creEl("div", "price-label");
    priceLabel.innerHTML = "Now only<br />";

    // Price grid
    var priceGrid = $this.creEl("div", "discount-price-grid");

    var originalPrice = $this.creEl("div", "original-price-gray");
    originalPrice.textContent = item.disc_amount ? "$" + item.disc_amount : "";

    var discountPrice = $this.creEl("div", "discount-price");
    discountPrice.innerHTML = item.portal_amount ? "$" + item.portal_amount : "" + "<br />";

    priceGrid.appendChild(originalPrice);
    priceGrid.appendChild(discountPrice);

    // Benefit items
    var benefits = item.benefits;
    if (benefits.length > 0) {
      // Key benefits label
      var keyBenefitsLabel = $this.creEl("div", "dm-sans key-benefits");
      keyBenefitsLabel.textContent = "Key Benefits";

      // Benefits list
      var benefitsContainer = $this.creEl("div");

      benefits.forEach(function (benefit, index) {
        var wrapperClass =
          index === 0
            ? "key-benefits-grid-wrapper center"
            : "key-benefits-grid-wrapper";
        var benefitWrapper = $this.creEl("div", wrapperClass);

        var benefitImg = $this.creEl("img", "full-width-inline-image");
        benefitImg.src =
          "https://cdn.prod.website-files.com/6271a4bf060d543533060f47/67cec6d2f47c8a1eee15da7e_library_books.svg";
        benefitImg.loading = "lazy";
        benefitImg.alt = "";

        var benefitText = $this.creEl("div", "dm-sans");
        benefitText.innerHTML = benefit.title + "<br />";

        benefitWrapper.appendChild(benefitImg);
        benefitWrapper.appendChild(benefitText);

        benefitsContainer.appendChild(benefitWrapper);
      });
    }
    // Buttons wrapper
    var buttonDiv = $this.creEl(
      "div",
      "button-div button-grid-wrapper-with-margin-top"
    );

    var buyNowBtn = $this.creEl(
      "a",
      "main-button red d-block-with-margin w-button"
    );
    buyNowBtn.href = "#";
    buyNowBtn.textContent = "Buy Now";
    buyNowBtn.addEventListener("click", function (event) {
      event.preventDefault();
      $this.$selectedProgram = item;
      $this.updatePayNowModelAmount();
      const buyNowModal = document.getElementById("buyNowModal");
      $this.showModal(buyNowModal);
    });
    if (benefits.length > 0) {
      var learnMoreBtn = this.creEl("a", "main-button learn-more w-button");
      learnMoreBtn.href = "#";
      learnMoreBtn.textContent = "Learn More";
      learnMoreBtn.addEventListener("click", function (event) {
        event.preventDefault();
        $this.$selectedProgram = item;
        $this.hideShowModalContent(item);
        const suppProgramsModal = document.getElementById("suppProgramsModal");
        $this.showModal(suppProgramsModal);
      });
    }
    buttonDiv.appendChild(buyNowBtn);
    if (benefits.length > 0) {
      buttonDiv.appendChild(learnMoreBtn);
    }
    // Assemble the programsDiv
    programsDiv.appendChild(title);
    programsDiv.appendChild(priceLabel);
    programsDiv.appendChild(priceGrid);
    if (benefits.length > 0) {
      programsDiv.appendChild(keyBenefitsLabel);
      programsDiv.appendChild(benefitsContainer);
    }
    programsDiv.appendChild(buttonDiv);

    // Append everything to main container
    slideItem.appendChild(imgWrapper);
    slideItem.appendChild(programsDiv);
    return slideItem;
    // Append to body or any container
    //swiperSlide.appendChild(slideItem);
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
  displaySingleSuppProgramB(item, type = "banner") {
    var $this = this;
    let discount_amount = item.disc_amount - item.portal_amount;
    let discount = Number.isInteger(discount_amount)
      ? discount_amount
      : parseFloat(discount_amount).toFixed(2);
    let typeClass = "modal-content " + type + "-" + item.programDetailId;
    let bannerTypeClass = "banner-content " + type + "-" + item.programDetailId;
    // Main wrapper
    if (type == "banner") {
      var slideItem = $this.creEl("div", "supp-programs-slide-item " + bannerTypeClass);
    } else {
      var slideItem = $this.creEl(
        "div",
        "supp-programs-description-div " + typeClass
      );
    }

    // --------- Discounted Programs Div ---------
    var programsDiv = $this.creEl("div", "discounted-programs-div border-none");

    // Title
    var title = $this.creEl("div", "dm-sans supp-program-header");
    title.innerHTML = item.label;

    // Price Grid
    var priceGrid = $this.creEl("div", "discount-price-grid supp-prog-price");

    var originalPrice = $this.creEl("div", "original-price-gray medium-text");
    originalPrice.textContent = "$" + item.disc_amount;

    var discountPrice = $this.creEl("div", "discount-price supp-program");
    discountPrice.innerHTML = "$" + item.portal_amount + "<br />";

    var savePriceText = $this.creEl("div", "save-price-text");
    var saveAmount = $this.creEl("div", "save-amount medium-text");
    saveAmount.textContent = "Save " + "$" + discount;
    savePriceText.appendChild(saveAmount);

    priceGrid.appendChild(originalPrice);
    priceGrid.appendChild(discountPrice);
    priceGrid.appendChild(savePriceText);

    // Key Benefits label
    var keyBenefitsLabel = $this.creEl("div", "dm-sans key-benefits");
    keyBenefitsLabel.innerHTML = "Key Benefits<br />";

    // Benefits container
    var benefitsContainer = $this.creEl("div", "width-100");

    // Benefits Data
    var benefits = item.benefits;

    // Loop benefits
    if (benefits.length > 0) {
      benefits.forEach(function (benefit) {
        var benefitWrapper = $this.creEl("div", "key-benefits-grid-wrapper");

        var benefitImg = $this.creEl(
          "img",
          "full-width-inline-image"
        );
        benefitImg.src =
          "https://cdn.prod.website-files.com/6271a4bf060d543533060f47/67cec6d2f47c8a1eee15da7e_library_books.svg";
        benefitImg.loading = "lazy";
        benefitImg.alt = "";

        var benefitContent = $this.creEl("div");

        var benefitTitle = $this.creEl(
          "div",
          "dm-sans benefits-text"
        );
        benefitTitle.innerHTML = benefit.title + "<br />";

        var benefitDesc = $this.creEl("div", "dm-sans");
        benefitDesc.innerHTML = benefit.desc;

        benefitContent.appendChild(benefitTitle);
        benefitContent.appendChild(benefitDesc);

        benefitWrapper.appendChild(benefitImg);
        benefitWrapper.appendChild(benefitContent);

        benefitsContainer.appendChild(benefitWrapper);
      });
    }

    // Buttons
    var buttonDiv = $this.creEl(
      "div",
      "button-div button-grid-wrapper-with-margin-top"
    );

    var buyNowBtn = $this.creEl("a", "main-button red buy-now w-button");
    buyNowBtn.href = "#";
    buyNowBtn.textContent = "Buy Now";
    buyNowBtn.addEventListener("click", function (event) {
      event.preventDefault();
      $this.$selectedProgram = item;
      $this.updatePayNowModelAmount();
      const buyNowModal = document.getElementById("buyNowModal");
      $this.showModal(buyNowModal);
    });

    var learnMoreBtn = $this.creEl("a", "main-button learn-more w-button");
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

    buttonDiv.appendChild(buyNowBtn);
    buttonDiv.appendChild(learnMoreBtn);

    // Assemble programsDiv
    programsDiv.appendChild(title);
    programsDiv.appendChild(priceGrid);
    programsDiv.appendChild(keyBenefitsLabel);
    programsDiv.appendChild(benefitsContainer);
    programsDiv.appendChild(buttonDiv);

    // --------- Gradient Div Section ---------
    var gradientDiv = $this.creEl(
      "div",
      "gradient-div-supp-programs-modal portal"
    );

    // Image
    var gradientImg = $this.creEl("img", "supp-programs-img");
    gradientImg.src = item.banner_img_lg;
    gradientImg.loading = "lazy";
    gradientImg.alt = "";

    // Text
    var gradientText = $this.creEl("div", "supp-programs-text");

    var percentOff = $this.creEl("div", "dm-sans percent-off");
    percentOff.innerHTML =
      "$" + discount + '<span class="off-text-shadow-right-white"> OFF</span>';

    var limitedTime = $this.creEl("div", "dm-sans limited-time-supp-program");
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
  initSlickSlider() {
    var $slider = $(
      ".discounted-programs-slick-slider"
    );
    // Check if the slider is already initialized
    if (!$slider.hasClass("slick-initialized")) {
      const slickSettings = {
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        centerMode: false,
        autoplay:true,
        variableWidth: false,
        arrows: true, // Arrows removed
        dots: true,
        adaptiveHeight: false,
      };
      // Initialize you might slider
      $slider.slick(slickSettings);
      $('.sidebar-left-arrow').click(function() {
          console.log("Left arrow clicked.");
          $slider.slick('slickPrev');
      });
 
      $('.sidebar-right-arrow').click(function() {
          console.log("Right arrow clicked.");
          $slider.slick('slickNext');
      });
    }

    var $slider2 = $(
      ".supp-programs-slick-slider"
    );
    // Check if the slider is already initialized
    if (!$slider2.hasClass("slick-initialized")) {
      const slickSettings = {
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        centerMode: false,
        autoplay:true,
        variableWidth: false,
        arrows: true, // Arrows removed
        dots: true,
        adaptiveHeight: false,
      };
      // Initialize you might slider
      $slider2.slick(slickSettings);
      $('.left-arrow').click(function() {
          console.log("Left arrow clicked.");
          $slider2.slick('slickPrev');
      });
 
      $('.right-arrow').click(function() {
          console.log("Right arrow clicked.");
          $slider2.slick('slickNext');
      });
    }
  }
  showModal(modal) {
    modal.classList.add("show");
    modal.style.display = "flex";
  }
  hideModal(modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
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
  //updateOldStudentList
  async updateOldStudentList() {
    const selectBox = document.getElementById("portal-students");
    var $this = this;
    try {
      const data = await this.fetchData(
        "getAllPreviousStudents/" + this.memberData.memberId+"/false"
      );
      //finding unique value and sorting by firstName
      const filterData = data
        .filter(
          (item, index, self) =>
            index ===
            self.findIndex((obj) => obj.studentEmail === item.studentEmail)
        )
        .sort(function (a, b) {
          return a.firstName.trim().localeCompare(b.firstName.trim());
        });
      // Clear existing options
      selectBox.innerHTML = "";
      // Add a "Please select" option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a student";
      selectBox.appendChild(defaultOption);
      // Add new options from the API data
      filterData.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = item.paymentId;
        // Add selected if filterData length is 1
        if (filterData.length === 1) {
          option.selected = true;
        }
        option.textContent = `${item.firstName} ${item.lastName}`;
        selectBox.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching API data:", error);

      // Handle errors (optional)
      selectBox.innerHTML =
        '<option value="">Student Details not available</option>';
    }
  }

  initSupplementaryPayment(paymentId, programId, programName, amount) {
    // Define the data to be sent in the POST request
    const data = {
      sessionId: "",
      paymentId: paymentId,
      programId: parseInt(programId),
      successUrl:
        this.memberData.site_url + "members/" + this.memberData.memberId,
      cancelUrl:
        this.memberData.site_url + "members/" + this.memberData.memberId,
      label: programName,
      amount: parseFloat(amount * 100),
      source: "portal_page",
    };
    // Create the POST request
    fetch(this.memberData.baseUrl + "createCheckoutUrlForSupplementary", {
      method: "POST", // Specify the method
      headers: {
        "Content-Type": "application/json", // Specify the content type
      },
      body: JSON.stringify(data), // Convert the data to a JSON string
    })
      .then((response) => {
        if (!response.ok) {
          // Handle the error response
          throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json(); // Parse the JSON from the response
      })
      .then((data) => {
        console.log("Success:", data); // Handle the JSON data
        if (data.success) {
          console.log(data.cardUrl);
          window.location.href = data.cardUrl;
        }
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error); // Handle errors
      });
  }
  handlePaymentEvents() {
    var $this = this;
    const payBtn = document.getElementById("pay-supp-program");
    payBtn.addEventListener("click", function (event) {
      event.preventDefault();

      const studentEl = document.getElementById("portal-students");
      if (studentEl.value) {
        payBtn.value = "Processing...";
        payBtn.style.pointerEvents = "none";
        let programName = $this.$selectedProgram.label;
        let programId = $this.$selectedProgram.programDetailId;
        let amount = $this.$selectedProgram.portal_amount;
        let paymentId = studentEl.value;
        if (programName && programId && amount && paymentId) {
          $this.initSupplementaryPayment(
            paymentId,
            programId,
            programName,
            amount
          );
        }
      } else {
        alert("Please select student");
      }
    });
  }
  updatePayNowModelAmount() {
    var $this = this;
    let upSellAmount = document.querySelectorAll(
      "[data-cart-total='cart-total-price']"
    );
    if (upSellAmount.length > 0) {
      upSellAmount.forEach((up_Sell_price) => {
        up_Sell_price.innerHTML = "$" + $this.$selectedProgram.portal_amount;
      });
    }

    // Update buy now modal title
    let upSellTitle = document.querySelectorAll(
      "[data-cart='title']"
    );
    if (upSellTitle.length > 0) {
      upSellTitle.forEach((up_Sell_title) => {
        up_Sell_title.innerHTML = $this.$selectedProgram.label;
      });
    }
  }
}
