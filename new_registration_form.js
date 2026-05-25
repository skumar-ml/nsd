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
    } else if (responseText.length == 0) {
      document.getElementById("free-resources").style.display = "block"
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
  // Caches Webflow UI templates from the tab pane before DOM is cleared
  cacheWebflowTemplates(tabPaneTemplate) {
    const campInfo = tabPaneTemplate.querySelector(".camp-info-wrapper")
    if (!campInfo) {
      console.error("camp-info-wrapper template not found")
      return false
    }

    const formRow = campInfo.querySelector(".registration-info-grid")
    const formsCategory = campInfo
      .querySelector('[data-portal="view-all-forms"]')
      ?.closest("div")
    const invoiceCategory = campInfo.querySelector(".invoice-wrapper")
    const resourcesSection = campInfo.querySelector(
      ".dashboard-node-header.margin-bottom-20"
    )?.parentElement
    const resourceLink = campInfo.querySelector(
      ".resources_wrapper .resources-link-block"
    )
    const notificationContainer = document.querySelector(
      ".notification_container"
    )
    const notificationText = notificationContainer?.querySelector(".noti_text")

    if (
      !formRow ||
      !formsCategory ||
      !invoiceCategory ||
      !resourcesSection ||
      !resourceLink
    ) {
      console.error("Required Webflow UI templates not found in tab pane")
      return false
    }

    this.$formRowTemplate = this.cloneTemplate(formRow)
    this.$formsCategoryTemplate = this.cloneTemplate(formsCategory)
    this.$invoiceCategoryTemplate = this.cloneTemplate(invoiceCategory)
    this.$resourcesSectionTemplate = this.cloneTemplate(resourcesSection)
    this.$resourceLinkTemplate = this.cloneTemplate(resourceLink)

    if (notificationContainer && notificationText) {
      this.$notificationContainerTemplate = this.cloneTemplate(
        notificationContainer
      )
      this.$notificationTextTemplate = this.cloneTemplate(notificationText)
    }

    return true
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

    if (!this.cacheWebflowTemplates(tabPaneTemplate)) {
      return
    }

    var is_notification = false
    var notificationFragment = document.createDocumentFragment()

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
          const noText = this.createNotificationText(item)
          if (noText) notificationFragment.appendChild(noText)
        })
      }
    })

    if (validTabIndex === 0) {
      portalRoot.style.display = "none"
      return
    }

    portalRoot.style.display = ""

    const nsd_portal_container = document.getElementById("nsdPortal")
    if (
      is_notification &&
      nsd_portal_container &&
      notificationFragment.childNodes.length
    ) {
      const notificationDiv = this.cloneNotificationContainer()
      if (notificationDiv) {
        notificationDiv.appendChild(notificationFragment)
        nsd_portal_container.prepend(notificationDiv)
      }
    }

    this.initiateLightbox()
    this.crossEvent()
    this.updateMemberFirstName()
  }
  // Clones notification container from Webflow template
  cloneNotificationContainer() {
    if (!this.$notificationContainerTemplate) return null
    return this.cloneTemplate(this.$notificationContainerTemplate)
  }
  // Clones and populates a notification text line from Webflow template
  createNotificationText(item) {
    if (!this.$notificationTextTemplate) return null
    const noText = this.cloneTemplate(this.$notificationTextTemplate)
    noText.textContent =
      "A recent payment for " +
      item["Student Name"] +
      " register for the program " +
      item["Program Name"] +
      " has failed."
    return noText
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
    if (textEls[1])
      textEls[1].textContent = `(${tab.studentDetail.currentYear})`
  }
  // Removes placeholder sections from cloned tab pane (keeps Webflow header/progress shell)
  clearDynamicSections(campInfoWrapper) {
    const progressWrapper = campInfoWrapper.querySelector(
      ".camp-progress-wrapper"
    )
    const pastProgram = campInfoWrapper.querySelector(".past-program-div")
    if (!progressWrapper) return

    const toRemove = []
    let el = progressWrapper.nextElementSibling
    while (el && el !== pastProgram) {
      toRemove.push(el)
      el = el.nextElementSibling
    }
    toRemove.forEach((node) => node.remove())
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

    const deadlineText = `Needs to be completed by ${this.$startDate.toLocaleString("default", { month: "long" })} ${this.$startDate.getDate() + this.getOrdinalSuffix(this.$startDate.getDate())}`
    const campText = campInfoWrapper.querySelector(".camp-text")
    if (campText) campText.textContent = deadlineText

    this.clearDynamicSections(campInfoWrapper)

    const formsFragment = this.renderFormCategories()
    this.populateProgressBar(campInfoWrapper)

    const progressWrapper = campInfoWrapper.querySelector(
      ".camp-progress-wrapper"
    )
    const pastProgram = campInfoWrapper.querySelector(".past-program-div")

    if (progressWrapper && formsFragment.childNodes.length) {
      progressWrapper.after(formsFragment)
    }

    const resourcesSection = this.renderResourcesSection()
    if (resourcesSection) {
      if (pastProgram) {
        pastProgram.before(resourcesSection)
      } else {
        campInfoWrapper.appendChild(resourcesSection)
      }
    }

    if (pastProgram) {
      pastProgram.style.display = "none"
    }
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
  // Renders all form categories (Forms and Invoices) as cloned Webflow sections
  renderFormCategories() {
    const fragment = document.createDocumentFragment()
    this.$formsList.forEach((formCategory) => {
      const section = this.formCategoryList(formCategory)
      if (section) fragment.appendChild(section)
    })
    return fragment
  }
  // Clones and populates a Webflow forms or invoices category section
  formCategoryList(formCategory) {
    const categoryName = formCategory.name || "Forms"
    const isInvoiceCategory = categoryName === "Invoice"
    formCategory.forms = this.filterInvoiceForms(formCategory.forms)
    if (!formCategory.forms.length) {
      return null
    }

    const template = isInvoiceCategory
      ? this.$invoiceCategoryTemplate
      : this.$formsCategoryTemplate
    const section = this.cloneTemplate(template)

    const titleEl = section.querySelector(".registration-info-title")
    if (titleEl) {
      titleEl.textContent = isInvoiceCategory ? "Invoices" : categoryName
    }

    const gridWrapper = section.querySelector(".registration-info-wrapper")
    if (gridWrapper) {
      gridWrapper
        .querySelectorAll(".registration-info-grid")
        .forEach((row) => row.remove())
      gridWrapper.appendChild(this.formsList(formCategory))
    }

    return section
  }
  // Returns a document fragment of cloned form rows for a category
  formsList(formCategory) {
    const fragment = document.createDocumentFragment()
    if (formCategory.forms.length == 0) {
      return fragment
    }
    formCategory.forms
      .sort(function (r, a) {
        return r.sequence - a.sequence
      })
      .forEach((form) => {
        const row = this.singleForm(form)
        if (row) fragment.appendChild(row)
      })
    return fragment
  }
  // Clones and populates a Webflow registration-info-grid row for a single form
  singleForm(form) {
    if (!this.$formRowTemplate) return null

    const row = this.cloneTemplate(this.$formRowTemplate)
    let editable = this.checkForm(form.formId)
    let is_live = form.is_live
    let checkedInIcon = this.getCheckedIcon(editable)
    var added_by_admin = false
    var link
    if (is_live) {
      if (editable) {
        let dbData = this.getFormData(form.formId)
        if (dbData && dbData.submissionId) {
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

    const img = row.querySelector("img")
    if (img) {
      img.src = checkedInIcon
      img.setAttribute("loading", "lazy")
      img.alt = ""
    }

    const nameEl = row.querySelector(".bold-500")
    if (nameEl) {
      nameEl.textContent = form.name
      nameEl.classList.toggle("completed_form", editable)
    }

    const linkEl = row.querySelector(".dashboard_link-block")
    const linkTextEl = row.querySelector(".medium-red-with-opacity")
    if (linkEl) {
      linkEl.href = link || "#"
      linkEl.className =
        `dashboard_link-block w-inline-block ${iframeClassName}`.trim()
    }
    if (linkTextEl) {
      linkTextEl.textContent = link_text
    }

    return row
  }
  // Updates progress bar text and width on existing Webflow elements
  populateProgressBar(campInfoWrapper) {
    const percentageAmount = this.$completedForm.length
      ? (100 * this.$completedForm.length) / this.$totalForm
      : 0
    const grayText = campInfoWrapper.querySelector(".camp-gray-text")
    const progressFill = campInfoWrapper.querySelector(
      ".camp-progress-bar .sub-div"
    )
    if (grayText) {
      grayText.textContent = `${parseInt(percentageAmount)}% / ${this.$completedForm.length} of ${this.$totalForm} forms completed`
    }
    if (progressFill) {
      progressFill.style.width = `${percentageAmount}%`
    }
  }
  // Clones and populates the Webflow resources section
  renderResourcesSection() {
    const debateEvent = this.$programDetail.debateEvent
    const hasCampTopic =
      debateEvent === "Lincoln-Douglas" || debateEvent === "Public Forum"
    const hasUploads =
      this.$uploadedContent &&
      this.$uploadedContent.length > 0 &&
      this.$uploadedContent.some(
        (item) => item.label && item.uploadedFiles && item.uploadedFiles[0]
      )

    if (!hasCampTopic && !hasUploads) {
      return null
    }

    const section = this.cloneTemplate(this.$resourcesSectionTemplate)
    const wrapper = section.querySelector(".resources_wrapper")
    if (!wrapper) return null

    wrapper
      .querySelectorAll(".resources-link-block")
      .forEach((link) => link.remove())

    const campTopicLink = this.createCampTopicResource()
    if (campTopicLink) wrapper.appendChild(campTopicLink)

    this.getUploadedResources().forEach((link) => {
      if (link) wrapper.appendChild(link)
    })

    return section
  }
  // Clones and populates a camp topic resource link from Webflow template
  createCampTopicResource() {
    let textContent = ""
    const debateEvent = this.$programDetail.debateEvent
    if (debateEvent === "Lincoln-Douglas") {
      textContent =
        "Resolved: The United States ought to guarantee the right to housing."
    } else if (debateEvent === "Public Forum") {
      textContent =
        "Resolved: The United States federal government should substantially increase its military presence in the Arctic."
    }
    if (!textContent || !this.$resourceLinkTemplate) return null

    const link = this.cloneTemplate(this.$resourceLinkTemplate)
    link.href = "#"
    link.title = textContent
    const label = link.querySelector(".resources-text-blue")
    if (label) label.textContent = "Camp topic"
    return link
  }
  // Returns cloned Webflow resource link elements for uploaded files
  getUploadedResources() {
    if (!this.$uploadedContent || !this.$uploadedContent.length) return []
    return this.$uploadedContent
      .map((uploadData) => this.resourceLink(uploadData))
      .filter(Boolean)
  }
  // Clones and populates a single resource link from Webflow template
  resourceLink(uploadData) {
    if (!uploadData.label || !uploadData.uploadedFiles[0]) return null
    if (!this.$resourceLinkTemplate) return null

    const link = this.cloneTemplate(this.$resourceLinkTemplate)
    link.href = uploadData.uploadedFiles[0]
    link.target = "_blank"
    const label = link.querySelector(".resources-text-blue")
    if (label) label.textContent = uploadData.label
    return link
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
      return "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/639c495f35742c15354b2e0d_circle-check-regular.png"
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
    if (day > 3 && day < 21) return "th"
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
}
