/*
Purpose: New registration form that fetches form data from the API and displays it in a grid.

Brief Logic: Fetches registration form data from API and displays forms in a grid. Handles form completion tracking, program category filtering, and form submission.

Are there any dependent JS files: No
*/
var FORMS_API_BASE = window.NSD_API.FORMS_API_BASE
class NSDPortal {
  $completedForm = []
  $formsList = []
  $programCategory = {}
  $programDetail = {}
  $studentDetail = {}
  $totalForm = 0
  $isLiveProgram = true
  $uploadedContent = {}
  $startDate = ""
  $endDate = ""
  // Initializes the NSD portal instance and fetches registration form data
  constructor(webflowMemberId, accountEmail, apiBaseUrl) {
    this.webflowMemberId = webflowMemberId
    this.accountEmail = accountEmail
    this.getPortalData()
  }
  // Fetches data from the API endpoint
  async fetchData(endpoint) {
    try {
      const normalizedEndpoint = String(endpoint).replace(/^\/+/, "")
      const response = await fetch(`${FORMS_API_BASE}/${normalizedEndpoint}`)
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const data = await response.json()
      return data
    } catch (error) {
      //console.error("Error fetching data:", error);
      //throw error;
    }
  }
  // Fetches registration form data from API and creates portal tabs
  async getPortalData() {
    // API call
    const curr_dashboard_title = document.getElementById("curr_dashboard_title")
    var spinner = document.getElementById("half-circle-spinner")
    spinner.style.display = "block"
    var data = await this.fetchData(
      "/getCompletedForm/" + this.webflowMemberId + "/all"
    )
    data = data.studentData || []
    // Hide free and paid resources
    this.hidePortalData(data)
    // hide spinner
    spinner.style.display = "none"
    // display supplementary program dom element
    curr_dashboard_title.style.display = "block"
    // create portal student program tabs
    this.createPortalTabs(data)
    this.removeByDefaultSelectedTab()
    // Re initialize webflow tabs after API call
    //Webflow.require('tabs').redraw();
  }
  // Hides or shows free/paid resources based on API response data
  hidePortalData(responseText) {
    if (responseText == "No data Found") {
      document.getElementById("free-resources").style.display = "block"
      // commented for update profile modal
      // setTimeout(() => {
      //     console.log("ready!");
      //     this.updateMemberFirstName();
      // }, "3000");
    } else if (responseText.length == 0) {
      document.getElementById("free-resources").style.display = "block"
      // commented for update profile modal
      // setTimeout(() => {
      //     console.log("ready!");
      //     this.updateMemberFirstName();
      // }, "3000");
    } else {
      if (!(localStorage.getItem("locat") === null)) {
        localStorage.removeItem("locat")
      }
      document.getElementById("paid-resources").style.display = "block"
    }
  }
  // Returns the Webflow registration form tabs root (pre-built in Webflow)
  getRegistrationFormRoot() {
    return (
      document.getElementById("registration-form-tab") ||
      document.querySelector("#nsdPortal #registration-form-tab") ||
      document.querySelector("#nsdPortal .registration-form-tab")
    )
  }
  // Deep-clones a Webflow template node and strips active-state classes
  cloneTemplate(node) {
    const clone = node.cloneNode(true)
    clone.classList.remove("w--current", "w--tab-active")
    clone.removeAttribute("tabindex")
    return clone
  }
  // Creates portal tabs for multiple student programs using Webflow HTML templates
  createPortalTabs(tabsData) {
    const portalRoot = this.getRegistrationFormRoot()
    if (!portalRoot) {
      console.error("registration-form-tab not found in Webflow DOM")
      return
    }

    const tabMenus = portalRoot.querySelector(".w-tab-menu")
    const tabContent = portalRoot.querySelector(".w-tab-content")
    if (!tabMenus || !tabContent) {
      console.error("Tab menu or content container not found")
      return
    }

    const tabLinkTemplate = tabMenus.querySelector(".w-tab-link")
    const tabPaneTemplate = tabContent.querySelector(".w-tab-pane")
    if (!tabLinkTemplate || !tabPaneTemplate) {
      console.error("Tab link or pane template not found")
      return
    }

    var is_notification = false
    var notificationDiv = this.creEl("div", "notification_container")

    tabMenus.innerHTML = ""
    tabContent.innerHTML = ""

    var validTabIndex = 0
    tabsData.forEach((tab) => {
      if (tab.failedPayment == undefined) {
        const tabIndex = validTabIndex + 1
        const isActive = validTabIndex === 0
        this.updateGlobalVariable(tab)

        const tabHeader = this.cloneTemplate(tabLinkTemplate)
        this.populateTabLink(tabHeader, tab, validTabIndex, tabIndex, isActive)
        tabMenus.appendChild(tabHeader)

        const tabPane = this.cloneTemplate(tabPaneTemplate)
        this.populateTabPane(tabPane, tab, validTabIndex, tabIndex, isActive)
        tabContent.appendChild(tabPane)

        validTabIndex++
      } else {
        is_notification = true
        tab.failedPayment.forEach((item) => {
          let noText = this.creEl("span", "noti_text")
          noText.innerHTML =
            "A recent payment for " +
            item["Student Name"] +
            " register for the program " +
            item["Program Name"] +
            " has failed."
          notificationDiv.appendChild(noText)
        })
      }
    })

    if (validTabIndex === 0) {
      portalRoot.style.display = "none"
      return
    }

    portalRoot.style.display = ""

    const nsd_portal_container = document.getElementById("nsdPortal")
    if (is_notification && nsd_portal_container) {
      nsd_portal_container.prepend(notificationDiv)
    }

    //Initiate lightbox after dom element added
    this.initiateLightbox()
    // Cross Icon code
    this.crossEvent()
    // Update memberStack firstname after update modal closed
    this.updateMemberFirstName()
  }
  // Populates a cloned tab link with program/student data
  populateTabLink(tabHeader, tab, index, tabIndex, isActive) {
    tabHeader.className = `current-programs_sub-div w-inline-block w-tab-link${isActive ? " w--current" : ""}`
    tabHeader.setAttribute("data-w-tab", `Tab ${tabIndex}`)
    tabHeader.setAttribute("id", `w-tabs-0-data-w-tab-${index}`)
    tabHeader.setAttribute("href", `#w-tabs-0-data-w-pane-${index}`)
    tabHeader.setAttribute("role", "tab")
    tabHeader.setAttribute("aria-controls", `w-tabs-0-data-w-pane-${index}`)
    tabHeader.setAttribute("aria-selected", isActive ? "true" : "false")
    tabHeader.setAttribute("tabindex", isActive ? "0" : "-1")

    const titleEl = tabHeader.querySelector(".rf-tab-link-title")
    const textEls = tabHeader.querySelectorAll(".rf-tab-link-txt")
    const programName = tab.programDetail.programName
    const studentName = `${tab.studentDetail.studentName.first} ${tab.studentDetail.studentName.last}`
    const dateRange = `${this.$startDate.toLocaleString("default", { month: "long" })} ${this.$startDate.getDate()} - ${this.$endDate.toLocaleString("default", { month: "long" })} ${this.$endDate.getDate()}`

    if (titleEl) titleEl.textContent = programName
    if (textEls[0]) textEls[0].textContent = `${studentName} | ${dateRange}`
    if (textEls[1]) textEls[1].textContent = `(${tab.studentDetail.currentYear})`
  }
  // Populates a cloned tab pane with forms, invoices, and resources
  populateTabPane(tabPane, tab, index, tabIndex, isActive) {
    tabPane.className = `w-tab-pane${isActive ? " w--tab-active" : ""}`
    tabPane.setAttribute("data-w-tab", `Tab ${tabIndex}`)
    tabPane.setAttribute("id", `w-tabs-0-data-w-pane-${index}`)
    tabPane.setAttribute("role", "tabpanel")
    tabPane.setAttribute("aria-labelledby", `w-tabs-0-data-w-tab-${index}`)

    const campInfoWrapper = tabPane.querySelector(".camp-info-wrapper")
    if (!campInfoWrapper) return

    this.$formsList.sort(function (r, a) {
      return r.sequence - a.sequence
    })

    const headerEl = campInfoWrapper.querySelector(".camp-header-flex")
    const headerHtml = headerEl ? headerEl.outerHTML : ""

    const deadlineText = `Needs to be completed by ${this.$startDate.toLocaleString("default", { month: "long" })} ${this.$startDate.getDate() + this.getOrdinalSuffix(this.$startDate.getDate())}`
    const formsHtml = this.renderFormCategories()
    const resourcesHtml = this.renderResourcesSection()

    campInfoWrapper.innerHTML = `
      ${headerHtml}
      <div class="camp-progress-wrapper">
        <div class="dm-sans-54 camp-text">${deadlineText}</div>
        <div class="camp-progress-container">${this.progressBar()}</div>
      </div>
      ${formsHtml}
      ${resourcesHtml}
    `
  }
  // Sets up event handlers for cross icon clicks to reset tab selection
  crossEvent() {
    var crossIcon = document.querySelectorAll(".cross-icon")
    var $this = this
    crossIcon.forEach((e) => {
      e.addEventListener("click", function (event) {
        event.preventDefault()
        $this.removeByDefaultSelectedTab()
      })
    })
  }
  // Removes default selected tab state and redraws Webflow tabs
  removeByDefaultSelectedTab() {
    Webflow.require("tabs").redraw()
    // const panLink = document.querySelectorAll('.w-tab-link');
    // panLink.forEach(element => {
    //     element.classList.remove('w--current');
    // });
    // const tabPan = document.querySelectorAll('.w-tab-pane');
    // tabPan.forEach(element => {
    //     element.classList.remove('w--tab-active');
    // });
  }

  // Updates global variables with form and program data from tab
  updateGlobalVariable(tab) {
    this.$completedForm = tab.formCompletedList
    this.$formsList = tab.formList
    this.$programCategory = tab.programCategory
    this.$studentDetail = tab.studentDetail
    this.$programDetail = tab.programDetail
    this.$uploadedContent = tab.uploadedContent
    this.$totalForm = 0
    this.checkProgramDeadline()
    this.$startDate = new Date(this.$programDetail.startDate)
    this.$endDate = new Date(this.$programDetail.endDate)
  }
  // Renders all form categories (Forms and Invoices) using Webflow markup
  renderFormCategories() {
    return this.$formsList
      .map((formCategory) => this.formCategoryList(formCategory))
      .filter(Boolean)
      .join("")
  }
  // Creates and returns HTML for a form category section
  formCategoryList(formCategory) {
    const categoryName = formCategory.name || "Forms"
    const isInvoiceCategory = categoryName === "Invoice"
    formCategory.forms = this.filterInvoiceForms(formCategory.forms)
    if (!formCategory.forms.length) {
      return
    }
    const wrapperClass = isInvoiceCategory ? "invoice-wrapper" : ""
    return `<div class="${wrapperClass}">
                <a href="#" data-portal="view-all-${isInvoiceCategory ? "invoices" : "forms"}" class="main-button-67 inline-block hide w-button">View All ${isInvoiceCategory ? "Invoices" : "forms"}</a>
                <div>
                    <div class="registration-info-title">${categoryName === "Invoice" ? "Invoices" : categoryName}</div>
                    <div class="registration-info-wrapper">
                        ${this.formsList(formCategory)}
                    </div>
                </div>
            </div>`
  }
  // Returns HTML string for list of forms in a category
  formsList(formCategory) {
    if (formCategory.forms.length == 0) {
      return ""
    }
    var forms = formCategory.forms
      .sort(function (r, a) {
        return r.sequence - a.sequence
      })
      .map((form) => this.singleForm(form))
      .join("")
    return forms
  }
  // Returns HTML string for a single form row with status icon and link
  singleForm(form) {
    //check it's editable
    let editable = this.checkForm(form.formId)
    let is_live = form.is_live
    let completed_form = editable ? " completed_form" : ""
    let checkedInIcon = this.getCheckedIcon(editable)
    var added_by_admin = false
    var link
    if (is_live) {
      if (editable) {
        let dbData = this.getFormData(form.formId)
        if (dbData.submissionId) {
          if (this.$isLiveProgram && form.is_editable) {
            link = form.formId
              ? "https://www.jotform.com/edit/" +
                dbData.submissionId +
                "?memberId=" +
                this.webflowMemberId +
                "&studentEmail=" +
                this.$studentDetail.studentEmail +
                "&accountEmail=" +
                this.accountEmail +
                "&paymentId=" +
                this.$studentDetail.uniqueIdentification +
                "&programDetailId=" +
                this.$programDetail.programDetailId
              : ""
          } else {
            link = "https://www.jotform.com/submission/" + dbData.submissionId
          }
        } else {
          added_by_admin = true
        }
      } else {
        link = form.formId
          ? "https://form.jotform.com/" +
            form.formId +
            "?memberId=" +
            this.webflowMemberId +
            "&studentEmail=" +
            this.$studentDetail.studentEmail +
            "&accountEmail=" +
            this.accountEmail +
            "&paymentId=" +
            this.$studentDetail.uniqueIdentification +
            "&programDetailId=" +
            this.$programDetail.programDetailId
          : ""
      }
    }

    //Add iframe when it's live and above certain screenwidth
    var iframeClassName =
      is_live && window.innerWidth > 1200 && !added_by_admin
        ? "iframe-lightbox-link"
        : ""
    var link_text
    var form_link_text =
      form.form_sub_type == "dropoff_invoice" ||
      form.form_sub_type == "pickup_invoice"
        ? "Invoice"
        : "Form"
    if (added_by_admin) {
      link_text = "Completed"
    } else if (is_live) {
      link_text = editable
        ? this.$isLiveProgram && form.is_editable
          ? "Edit " + form_link_text
          : "View " + form_link_text
        : "Go to " + form_link_text.toLowerCase()
    } else {
      link_text = "Coming Soon"
    }
    if (is_live) {
      this.$totalForm++
    }
    return `
            <div class="registration-info-grid">
                <img loading="lazy" src="${checkedInIcon}" alt="">
                <div class="dm-sans-54 bold-500${completed_form}">${form.name}</div>
                <a href="${link || "#"}" class="dashboard_link-block w-inline-block ${iframeClassName}">
                    <div class="dm-sans-54 medium-red-with-opacity">${link_text}</div>
                </a>
            </div>
        `
  }
  // Returns HTML for progress bar showing form completion percentage
  progressBar() {
    let percentageAmount = this.$completedForm.length
      ? (100 * this.$completedForm.length) / this.$totalForm
      : 0
    return `<div class="camp-gray-text">${parseInt(percentageAmount)}% / ${this.$completedForm.length} of ${this.$totalForm} forms completed</div>
                <div class="camp-progress-bar">
                    <div class="sub-div red-bg" style="width: ${percentageAmount}%;"></div>
                </div>`
  }
  // Returns HTML for resources section (camp topic + uploaded files)
  renderResourcesSection() {
    const debateEvent = this.$programDetail.debateEvent
    const campTopicHtml = this.getCampTopicResource()
    const uploadedHtml = this.getUploadedResources()
    if (
      !campTopicHtml &&
      !uploadedHtml &&
      !this.$uploadedContent.length &&
      debateEvent != "Lincoln-Douglas" &&
      debateEvent != "Public Forum"
    ) {
      return ""
    }
    return `<div>
                <div class="dashboard-node-header margin-bottom-20">Resources</div>
                <div class="resources_wrapper">
                    ${campTopicHtml}
                    ${uploadedHtml}
                </div>
            </div>`
  }
  // Returns HTML for camp topic as a resource link when debate event applies
  getCampTopicResource() {
    let textContent = ""
    const debateEvent = this.$programDetail.debateEvent
    if (debateEvent === "Lincoln-Douglas") {
      textContent =
        "Resolved: The United States ought to guarantee the right to housing."
    } else if (debateEvent === "Public Forum") {
      textContent =
        "Resolved: The United States federal government should substantially increase its military presence in the Arctic."
    }
    if (!textContent) return ""
    return `<a href="#" class="resources-link-block w-inline-block" title="${textContent}">
                <div class="resources-div">
                    <div class="resources-text-blue">Camp topic</div>
                </div>
            </a>`
  }
  // Returns HTML for uploaded resource links
  getUploadedResources() {
    if (!this.$uploadedContent.length) return ""
    return this.$uploadedContent
      .map((uploadData) => this.resourceLink(uploadData))
      .join("")
  }
  // Returns HTML for a single resource link element
  resourceLink(uploadData) {
    if (uploadData.label && uploadData.uploadedFiles[0]) {
      return `<a href="${uploadData.uploadedFiles[0]}" target="_blank" class="resources-link-block w-inline-block">
                    <div class="resources-div">
                        <div class="resources-text-blue">${uploadData.label}</div>
                    </div>
                </a>`
    } else {
      return ""
    }
  }
  // Filters invoice-related forms based on completion status of dropoff/pickup forms
  filterInvoiceForms(forms) {
    var newForms = forms.filter((item) => {
      if (item.form_sub_type == "dropoff_invoice") {
        var dFD = this.$completedForm.find(
          (item) => item.form_sub_type == "dropoff" && item.isInvoice == "Yes"
        )
        if (dFD != undefined) {
          return true
        } else {
          return false
        }
      } else if (item.form_sub_type == "pickup_invoice") {
        var aFD = this.$completedForm.find(
          (item) => item.form_sub_type == "pickup" && item.isInvoice == "Yes"
        )
        if (aFD != undefined) {
          return true
        } else {
          return false
        }
      } else {
        return true
      }
    })
    return newForms
  }
  /**
   * Check form's id in completedForm list (from MongoDB) and use to determine if form is editable
   * @param formId - Jotform Id
   */
  checkForm($formId) {
    if ($formId) {
      const found = this.$completedForm.some((el) => el.formId == $formId)
      return found
    }
    return false
  }
  // Returns the URL for checked or unchecked icon based on completion status
  getCheckedIcon(status) {
    if (status) {
      return "https://cdn.prod.website-files.com/6271a4bf060d543533060f47/667bd773b1a8202a880f7bd8_check%20(2).svg"
    } else {
      return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495fdc487955887ade5b_circle-regular.png"
    }
  }
  /**
   * Returns the completed form data object for the specified form ID
   * @param formId - Jotform Id
   */
  getFormData($formId) {
    let data = this.$completedForm.find((o) => o.formId == $formId)
    return data
  }
  // Returns the ordinal suffix (st, nd, rd, th) for a given day number
  getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th" // Covers 11th to 20th
    switch (day % 10) {
      case 1:
        return "st"
      case 2:
        return "nd"
      case 3:
        return "rd"
      default:
        return "th"
    }
  }
  // Checks if the program deadline has passed and updates isLiveProgram flag
  checkProgramDeadline() {
    var deadlineDate = this.$programDetail.deadlineDate.replace(/\\/g, "")
    deadlineDate = deadlineDate.replace(/"/g, "")
    var formatedDeadlineDate = new Date(deadlineDate)
    var currentDate = new Date()
    this.$isLiveProgram = currentDate < formatedDeadlineDate ? true : false
  }
  // Initializes iframe lightbox for form previews
  initiateLightbox() {
    var $this = this
    ;[].forEach.call(
      document.getElementsByClassName("iframe-lightbox-link"),
      function (el) {
        el.lightbox = new IframeLightbox(el, {
          onClosed: function () {
            console.log("Iframe closed")
          },
          scrolling: true,
        })
      }
    )
  }
  // Updates member first name in portal after profile update modal is closed
  updateMemberFirstName() {
    var elements = document.getElementsByClassName("ms-portal-exit")
    var myFunctionNew = function () {
      var memberstack = localStorage.getItem("memberstack")
      var memberstackData = JSON.parse(memberstack)
      var webflowMemberId = memberstackData.information.id
      var firstName = memberstackData.information["first-name"]
      var userFirstName2 = document.getElementById("userFirstName2")
      var userFirstName1 = document.getElementById("userFirstName1")
      userFirstName1.innerHTML = firstName
      userFirstName2.innerHTML = firstName
      console.log("firstName", firstName)
    }
    for (var i = 0; i < elements.length; i++) {
      elements[i].addEventListener("click", myFunctionNew, false)
    }
  }
  // Creates a DOM element with optional class and id attributes
  creEl(name, className, idName) {
    var el = document.createElement(name)
    if (className) {
      el.className = className
    }
    if (idName) {
      el.setAttribute("id", idName)
    }
    return el
  }
}
