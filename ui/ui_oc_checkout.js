/*
Purpose: Online class checkout page init — session recording, class offering cards, checkout form, login modal, accordion, and iframe mode.

Brief Logic: Fires MemberStack Crazy Egg session recording when a member is logged in. On DOMContentLoaded, parses URL params to validate required fields (grade_name, class_detail_id, session_detail_id) and shows/hides the signup form accordingly. Fetches available class offering slots from the API and renders selectable time-slot cards with full/almost-full seat states. Initialises login modal open/close behaviour, stepper sync via MutationObserver, student info accordion, and iframe-mode body class. Builds the memberData object and instantiates CheckOutWebflow. Handles tab-based price switching and jQuery form validation.

Are there any dependent JS files: No
*/

// ─────────────────────────────────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────────────────────────────────

function toMongoObjectId(value) {
  if (value == null) return ""
  var str
  if (typeof value === "object" && value && value.$oid) {
    str = String(value.$oid)
  } else {
    str = String(value).trim()
  }
  str = str.replace(/[^0-9a-fA-F]/g, "")
  if (str.length === 24) return str
  if (str.length > 24) return str.slice(-24)
  return str
}

function setupLoginModalEvents() {
  const loginButton = document.getElementById("loginButton")
  const loginModal = document.getElementById("login-modal")
  const closeModalBtn = document.getElementById("modal-close")
  const modalBg = document.getElementById("login-modal-bg")
  const signupBtnLink = document.getElementById("signup-btn-link")

  function showLoginModal() {
    loginModal?.classList.add("show")
  }

  function closeLoginModal() {
    loginModal?.classList.remove("show")
  }

  loginButton?.addEventListener("click", function (e) {
    e.preventDefault()
    showLoginModal()
  })

  closeModalBtn?.addEventListener("click", function (e) {
    e.preventDefault()
    closeLoginModal()
  })

  modalBg?.addEventListener("click", closeLoginModal)

  signupBtnLink?.addEventListener("click", function (e) {
    e.preventDefault()
    closeLoginModal()
  })
}

function initializeStudentInfoAccordion() {
  const accordions = document.querySelectorAll(
    ".student-info-rounded-accordian"
  )

  accordions.forEach((item) => {
    const header = item.querySelector(".student-info-header-wrapper")
    const body = item.querySelector(".student-info-body-content-div")

    header.addEventListener("click", function () {
      if (item.classList.contains("open")) {
        item.classList.remove("open")
        body.style.maxHeight = "0"
      } else {
        accordions.forEach((otherItem) => {
          otherItem.classList.remove("open")
          const otherBody = otherItem.querySelector(
            ".student-info-body-content-div"
          )
          if (otherBody) otherBody.style.maxHeight = "0"
        })
        item.classList.add("open")
        body.style.maxHeight = body.scrollHeight + "px"
      }
    })
  })
}

// ─────────────────────────────────────────────────────────────────────
//  Crazy Egg session recording (fires when MemberStack is ready)
// ─────────────────────────────────────────────────────────────────────

MemberStack.onReady.then(function (member) {
  if (member.loggedIn) {
    ;(window.CE_API || (window.CE_API = [])).push(function () {
      CE2.startRecording()
    })
  }
})

// ─────────────────────────────────────────────────────────────────────
//  Main checkout init
// ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  localStorage.setItem("redirect_url", window.location.href)

  var query = window.location.search
  var urlPar = new URLSearchParams(query)
  var product =
    urlPar.get("productType") || urlPar.get("producttype") || "online-class"
  var grade_name = urlPar.get("grade_name") || ""
  var class_detail_id_raw = urlPar.get("class_detail_id") || ""
  var session_detail_id_raw = urlPar.get("session_detail_id") || ""
  var core_product_price = document.getElementById("core_product_price")
  var programCategoryId = '{{wf {"path":"program-id","type":"Number"} }}'
  var rendorCheckoutForm = true

  // iFrame mode detection — reuses already-parsed urlPar
  if (urlPar.get("iframe") === "true") {
    document.body.classList.add("iframe-mode")
  }

  // Accordion init
  initializeStudentInfoAccordion()

  var class_detail_id = class_detail_id_raw
    ? toMongoObjectId(class_detail_id_raw)
    : ""
  var session_detail_id = session_detail_id_raw
    ? toMongoObjectId(session_detail_id_raw)
    : ""

  var signupContainer = document.querySelector(".sign-up-form-wrapper-mb-20")
  var checkouterror = document.querySelector(".checkout-error-container")

  var missing = []

  if (!grade_name || String(grade_name).trim() === "")
    missing.push("grade_name")
  if (!class_detail_id || String(class_detail_id).trim() === "")
    missing.push("class_detail_id")
  if (!session_detail_id || String(session_detail_id).trim() === "")
    missing.push("session_detail_id")

  // Validate using raw values as secondary check
  if (!grade_name.trim()) missing.push("grade_name")
  if (!class_detail_id_raw.trim()) missing.push("class_detail_id")
  if (!session_detail_id_raw.trim()) missing.push("session_detail_id")

  if (missing.length > 0) {
    rendorCheckoutForm = false
    if (signupContainer) signupContainer.style.display = "none"
    if (checkouterror) checkouterror.style.display = "block"
  } else {
    rendorCheckoutForm = true
    if (signupContainer) signupContainer.style.display = "block"
    if (checkouterror) checkouterror.style.display = "none"
  }

  setupLoginModalEvents()

  // Stepper sync: keep create-account-new active while sign-up wrapper is visible
  ;(function () {
    var signUpWrapper =
      document.querySelector(".sign-up-form-wrapper-mb-20.w-form") ||
      document.querySelector(".sign-up-form-wrapper-mb-20")
    var createAccountNew = document.getElementById("create-account-new")
    var studentDetails = document.getElementById("student-details")
    var payDeposite = document.getElementById("pay-deposite")

    if (!signUpWrapper || !createAccountNew) return

    function syncActive() {
      var isBlock = window.getComputedStyle(signUpWrapper).display === "block"
      if (!isBlock) return
      if (
        !createAccountNew.classList.contains("active") ||
        (studentDetails && studentDetails.classList.contains("active")) ||
        (payDeposite && payDeposite.classList.contains("active"))
      ) {
        createAccountNew.classList.add("active")
        if (studentDetails) studentDetails.classList.remove("active")
        if (payDeposite) payDeposite.classList.remove("active")
      }
    }

    syncActive()

    var wrapperObserver = new MutationObserver(syncActive)
    wrapperObserver.observe(signUpWrapper, {
      attributes: true,
      attributeFilter: ["style", "class"],
    })

    if (studentDetails) {
      var stepObserver1 = new MutationObserver(syncActive)
      stepObserver1.observe(studentDetails, {
        attributes: true,
        attributeFilter: ["class"],
      })
    }
    if (payDeposite) {
      var stepObserver2 = new MutationObserver(syncActive)
      stepObserver2.observe(payDeposite, {
        attributes: true,
        attributeFilter: ["class"],
      })
    }
  })()

  // ── Class Offerings ──────────────────────────────────────────────

  async function preloadAllClassOfferings(cls_detail_id, sess_detail_id) {
    const baseURL = `${window.NSD_API.ONLINE_CLASS_API_BASE}/classes/offerings/list?class_detail_id=${encodeURIComponent(cls_detail_id)}&session_detail_id=${encodeURIComponent(sess_detail_id)}`
    const res = await fetch(baseURL)
    const data = await res.json()
    return { ok: res.ok, data }
  }

  async function getClassOfferings() {
    if (!class_detail_id || !session_detail_id) return

    const { ok, data } = await preloadAllClassOfferings(
      class_detail_id,
      session_detail_id
    )

    if (!ok) return
    if (!data.success || !data.classes || !data.classes.length) return

    const cls = data.classes[0]
    const className = cls.className || ""
    const term_name = cls.term_name || ""
    const price = cls.price || 0
    const schedules = cls.schedules || []

    const programText = `${className} (${term_name})`
    const priceText = `$${price}`

    document
      .querySelectorAll(".online-program p.dm-sans.font-14.bold")
      .forEach((el) => (el.textContent = programText))

    document
      .querySelectorAll(".oc-price")
      .forEach((el) => (el.textContent = priceText))

    const gridContainer = document.querySelector(
      ".checkout_offering-grid-container"
    )
    if (!gridContainer) return

    gridContainer.innerHTML = ""

    schedules.forEach(function (schedule) {
      const class_offering_id = schedule.class_offering_id || ""
      const day = schedule.day || ""
      const start_time = schedule.start_time || ""
      const end_time = schedule.end_time || ""
      const totalSpots = schedule.total_spots || 0
      const enrolledCount = schedule.enrolled_count || 0
      const availableSpots =
        schedule.available_spots != null
          ? schedule.available_spots
          : totalSpots - enrolledCount

      let stateClass = "available"
      let message = ""

      if (totalSpots > 0 && availableSpots <= 0) {
        stateClass = "full"
        message = "Seats for this class are full"
      } else if (totalSpots > 0 && enrolledCount / totalSpots > 0.75) {
        stateClass = "almost-full"
        message = "Seats are almost full for this time slot."
      }

      const wrapper = document.createElement("div")
      wrapper.className = "checkout_offering-card-wrapper " + stateClass
      wrapper.setAttribute("data-class-offering-id", class_offering_id)

      const card = document.createElement("div")
      card.className = "checkout_offering-card"
      if (stateClass === "almost-full") card.classList.add("almost-full-seat")
      if (stateClass === "full") card.classList.add("slot-full")

      const timeTextEl = document.createElement("p")
      timeTextEl.className = "checkout_offering-text"
      timeTextEl.textContent = `${day} ${utcToEST(start_time)} - ${utcToEST(end_time)}`

      card.appendChild(timeTextEl)
      wrapper.appendChild(card)

      if (stateClass === "full" || stateClass === "almost-full") {
        const infoTextEl = document.createElement("p")
        infoTextEl.className = "checkout_offering-info-text"
        infoTextEl.textContent = message
        wrapper.appendChild(infoTextEl)
      }

      gridContainer.appendChild(wrapper)

      if (stateClass !== "full") {
        card.addEventListener("click", function () {
          document
            .querySelectorAll(".checkout_offering-card")
            .forEach((el) => el.classList.remove("slot-selected"))
          document
            .querySelectorAll(".checkout_offering-card-wrapper")
            .forEach((el) => el.classList.remove("selected"))
          card.classList.add("slot-selected")
          wrapper.classList.add("selected")
          window.selectedClassOfferingId = class_offering_id
          programCategoryId = class_offering_id
          if (
            typeof renderer !== "undefined" &&
            renderer &&
            renderer.memberData
          ) {
            renderer.memberData.programCategoryId = class_offering_id
          }
          const paymentContainer = document.querySelector(
            ".checkout-page_payment-option-container"
          )
          if (paymentContainer) paymentContainer.style.display = "block"
        })
      }
    })
  }

  getClassOfferings()

  // ── Program dates & pricing ──────────────────────────────────────

  var programStartDate = ""
  var programEndDate = ""
  var residentialProgramDate =
    '{{wf {"path":"date-residential-ld","type":"PlainText"} }}'
  if (residentialProgramDate.includes(" - ")) {
    var residentialdateParts = residentialProgramDate.split("-")
    if (residentialdateParts.length === 2) {
      programStartDate = residentialdateParts[0].trim()
      programEndDate = residentialdateParts[1].trim()
    }
  } else {
    programStartDate = residentialProgramDate.trim()
    programEndDate = ""
  }

  var programDetailId = '{{wf {"path":"program-detail-id","type":"Number"} }}'
  var achAmount = "0"
  var cardAmount = "0"
  var payLaterAmount = "0"

  if (core_product_price) {
    if (product == "commuter" || product == "pf") {
      $(".commuter-order-summary").css("display", "block")
      $(".residential-order-summary").css("display", "none")
      $(".commuter-form").css("display", "block")
      $(".residential-form").css("display", "none")
      $(".checkoutFormComPrice").css("display", "block")
      $(".checkoutFormResPrice").css("display", "none")
      core_product_price.value =
        '{{wf {"path":"commuter-pf-bank-transfer-price","type":"PlainText"} }}'
      achAmount =
        '{{wf {"path":"commuter-pf-bank-transfer-price","type":"PlainText"} }}'
      cardAmount =
        '{{wf {"path":"commuter-pf-credit-card-price","type":"PlainText"} }}'
      payLaterAmount =
        '{{wf {"path":"commuter-pf-bnpl-price","type":"PlainText"} }}'
    } else {
      $(".commuter-order-summary").css("display", "none")
      $(".residential-order-summary").css("display", "block")
      $(".commuter-form").css("display", "none")
      $(".residential-form").css("display", "block")
      $(".checkoutFormComPrice").css("display", "none")
      $(".checkoutFormResPrice").css("display", "block")
      core_product_price.value =
        '{{wf {"path":"residential-ld-bank-transfer-price","type":"PlainText"} }}'
      achAmount =
        '{{wf {"path":"residential-ld-bank-transfer-price","type":"PlainText"} }}'
      cardAmount =
        '{{wf {"path":"residential-ld-credit-card-price","type":"PlainText"} }}'
      payLaterAmount =
        '{{wf {"path":"residential-ld-bnpl-price","type":"PlainText"} }}'
    }
  }

  // ── Member data & renderer ───────────────────────────────────────

  const apiBaseUrl = `${window.NSD_API.ONLINE_CLASS_API_BASE}/`

  var memberstack = localStorage.getItem("memberstack")
  var memberstackData = memberstack ? JSON.parse(memberstack) : {}
  var webflowMemberId =
    (memberstackData.information && memberstackData.information.id) || ""
  var firstName =
    (memberstackData.information &&
      memberstackData.information["first-name"]) ||
    ""
  var lastName =
    (memberstackData.information && memberstackData.information["last-name"]) ||
    ""
  var accountEmail = memberstackData.email || ""

  var memberData = {
    name: firstName + " " + lastName,
    email: accountEmail.toLocaleLowerCase(),
    programId: parseInt(programDetailId, 10),
    programCategoryId: parseInt(programCategoryId, 10),
    memberId: webflowMemberId,
    productType:
      product === "online_class"
        ? "online_class"
        : product == "supplementary"
          ? "supplementary"
          : "core",
    programName: '{{wf {"path":"name","type":"PlainText"} }}',
    achAmount: achAmount,
    cardAmount: cardAmount,
    payLaterAmount: payLaterAmount,
    variant_type: 1,
    site_url: "https://www.nsdebatecamp.com/",
    slug: '{{wf {"path":"slug","type":"PlainText"} }}',
    hide_upsell: false /* In Webflow replace with: {{wf {"path":"hide-upsell","type":"Bool"} }} */,
    programStartDate: programStartDate,
    programEndDate: programEndDate,
    isAdmin: true,
  }

  if (product === "online_class" && rendorCheckoutForm) {
    memberData.grade_name = grade_name || ""
    memberData.class_detail_id = class_detail_id || ""
    memberData.session_detail_id = session_detail_id || ""
  }

  var renderer = ""
  if (rendorCheckoutForm && typeof CheckOutWebflow !== "undefined") {
    renderer = new CheckOutWebflow(apiBaseUrl, memberData)
  }

  // ── Tab click handlers ───────────────────────────────────────────

  var allTabs = document.getElementsByClassName("checkout-tab-link")
  for (var i = 0; i < allTabs.length; i++) {
    allTabs[i].addEventListener(
      "click",
      function () {
        var orderDetRes = $(".price-order-details")
        var orderDetCom = $(".price-order-details")

        if (core_product_price) {
          if (this.classList.contains("bank-transfer-tab")) {
            if (product == "commuter" || product == "pf") {
              orderDetCom.html(
                '${{wf {"path":"commuter-pf-bank-transfer-price","type":"PlainText"} }}'
              )
              core_product_price.value =
                '{{wf {"path":"commuter-pf-bank-transfer-price","type":"PlainText"} }}'
            } else {
              orderDetRes.html(
                '${{wf {"path":"residential-ld-bank-transfer-price","type":"PlainText"} }}'
              )
              core_product_price.value =
                '{{wf {"path":"residential-ld-bank-transfer-price","type":"PlainText"} }}'
            }
          } else if (this.classList.contains("credit-card-tab")) {
            if (product == "commuter" || product == "pf") {
              orderDetCom.html(
                '${{wf {"path":"commuter-pf-credit-card-price","type":"PlainText"} }}'
              )
              core_product_price.value =
                '{{wf {"path":"commuter-pf-credit-card-price","type":"PlainText"} }}'
            } else {
              orderDetRes.html(
                '${{wf {"path":"residential-ld-credit-card-price","type":"PlainText"} }}'
              )
              core_product_price.value =
                '{{wf {"path":"residential-ld-credit-card-price","type":"PlainText"} }}'
            }
          } else if (this.classList.contains("pay-later")) {
            if (product == "commuter" || product == "pf") {
              orderDetCom.html(
                '${{wf {"path":"commuter-pf-bnpl-price","type":"PlainText"} }}'
              )
              core_product_price.value =
                '{{wf {"path":"commuter-pf-bnpl-price","type":"PlainText"} }}'
            } else {
              orderDetRes.html(
                '${{wf {"path":"residential-ld-bnpl-price","type":"PlainText"} }}'
              )
              core_product_price.value =
                '{{wf {"path":"residential-ld-bnpl-price","type":"PlainText"} }}'
            }
          }
        }

        var suppProIdE = document.getElementById("suppProIds")
        if (suppProIdE && suppProIdE.value) {
          try {
            var selectedIds = JSON.parse(suppProIdE.value)
            if (
              selectedIds.length > 0 &&
              renderer &&
              typeof renderer.updateOnlyTotalAmount === "function"
            ) {
              renderer.updateOnlyTotalAmount()
            }
          } catch (e) {}
        }
      },
      false
    )
  }

  $(".checkout-tab-link").removeClass("w--current")
  $(".w-tab-pane").removeClass("w--tab-active")

  // ── Form validation ──────────────────────────────────────────────

  if (
    core_product_price &&
    accountEmail &&
    jQuery &&
    jQuery.fn &&
    jQuery.fn.validate
  ) {
    jQuery("#checkout-form").validate({
      rules: {
        student_email: { notEqual: accountEmail, checkCurrectEmail: true },
        student_first_name: { notEqualName: firstName },
      },
    })
    jQuery.validator.addMethod(
      "notEqual",
      function (value, element, param) {
        return (
          this.optional(element) ||
          (value.replace(/\s/g, "").toLowerCase() !==
            param.replace(/\s/g, "").toLowerCase() &&
            value.replace(/\./g, "").toLowerCase() !==
              param.replace(/\./g, "").toLowerCase())
        )
      },
      "Parent email should be different than the student email "
    )
    jQuery.validator.addMethod(
      "notEqualName",
      function (value, element, param) {
        return (
          this.optional(element) ||
          value.replace(/\s/g, "").toLowerCase() !==
            param.replace(/\s/g, "").toLowerCase()
        )
      },
      "Parent name should be different than the student name "
    )
    jQuery.validator.addMethod(
      "checkCurrectEmail",
      function (value, element) {
        var regex = /^[a-zA-Z0-9._%+-]+@(yahoo|gmail|hotmail)\.[a-zA-Z]{2,}$/
        var other_regex =
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/
        var match = regex.test(value)
        var other_match = other_regex.test(value)
        if (match) {
          var _regex = /^[a-zA-Z0-9._%+-]+@(yahoo|gmail|hotmail)\.com$/
          return _regex.test(value)
        } else if (other_match) {
          return true
        } else {
          return false
        }
      },
      "Please enter a valid email address."
    )
  }
})
