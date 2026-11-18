// Popup modal: smooth open/close + 15s auto-open.
// Never leave showModal()'s backdrop up while the panel is hidden.
const MODAL_ANIM_MS = 320
let modalAutoOpenTimer = null

const getTrialModal = () => document.getElementById("dialog_trial_stepper")

const resetTrialModalStyles = (dialog) => {
    if (!dialog) return
    dialog.classList.remove("tc-modal-open", "tc-modal-animating")
    dialog.style.removeProperty("display")
    dialog.style.removeProperty("visibility")
}

const ensureTrialModalStyles = () => {
    if (document.getElementById("tc-modal-open-animation-style")) return
    const style = document.createElement("style")
    style.id = "tc-modal-open-animation-style"
    style.textContent = `
      #dialog_trial_stepper[open]{display:flex!important;flex-direction:column;margin:auto;border:none;opacity:1;visibility:visible}
      #dialog_trial_stepper[open].tc-modal-animating{opacity:0;transform:translateY(12px) scale(.98)}
      #dialog_trial_stepper[open].tc-modal-open{opacity:1;transform:none;transition:opacity ${MODAL_ANIM_MS}ms ease,transform ${MODAL_ANIM_MS}ms ease}
      #dialog_trial_stepper::backdrop{background:rgba(0,0,0,.45);opacity:1}
      #dialog_trial_stepper.tc-modal-animating::backdrop{opacity:0}
      #dialog_trial_stepper.tc-modal-open::backdrop{opacity:1;transition:opacity ${MODAL_ANIM_MS}ms ease}
    `
    document.head.appendChild(style)
}

const openTrialModalSmooth = () => {
    const dialog = getTrialModal()
    if (!dialog) return

    clearTimeout(modalAutoOpenTimer)
    modalAutoOpenTimer = null
    ensureTrialModalStyles()
    dialog.style.setProperty("display", "flex", "important")
    dialog.style.setProperty("visibility", "visible", "important")

    if (dialog.open) {
        dialog.classList.remove("tc-modal-animating")
        dialog.classList.add("tc-modal-open")
        return
    }

    dialog.classList.add("tc-modal-animating")
    dialog.classList.remove("tc-modal-open")
    dialog.showModal()
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            dialog.classList.remove("tc-modal-animating")
            dialog.classList.add("tc-modal-open")
        }),
    )
}

const closeTrialModalSmooth = () => {
    const dialog = getTrialModal()
    if (!dialog) return

    clearTimeout(modalAutoOpenTimer)
    modalAutoOpenTimer = null
    if (!dialog.open) return resetTrialModalStyles(dialog)

    ensureTrialModalStyles()
    dialog.classList.remove("tc-modal-open")
    dialog.classList.add("tc-modal-animating")

    const finish = () => {
        dialog.removeEventListener("transitionend", onEnd)
        if (dialog.open) dialog.close()
        resetTrialModalStyles(dialog)
    }
    const onEnd = (e) => {
        if (e.target === dialog && e.propertyName === "opacity") finish()
    }
    dialog.addEventListener("transitionend", onEnd)
    setTimeout(finish, MODAL_ANIM_MS + 50)
}

document.addEventListener("DOMContentLoaded", () => {
    const dialog = getTrialModal()
    if (!dialog) return

    ensureTrialModalStyles()
    if (dialog.open) dialog.close()
    dialog.removeAttribute("open")
    resetTrialModalStyles(dialog)

    document
        .getElementById("dialog_trial_stepper_open_btn")
        ?.addEventListener("click", (e) => {
            e.preventDefault()
            openTrialModalSmooth()
        })
    document
        .getElementById("dialog_trial_stepper_cls_btn")
        ?.addEventListener("click", (e) => {
            e.preventDefault()
            closeTrialModalSmooth()
        })
    dialog.addEventListener("close", () => resetTrialModalStyles(dialog))

    // Auto-open after 15s unless this is a manage-registration link.
    if (!new URLSearchParams(location.search).has("token")) {
        modalAutoOpenTimer = setTimeout(() => {
            modalAutoOpenTimer = null
            if (!dialog.open) openTrialModalSmooth()
        }, 15000)
    }
})


// Webflow class names for the "Know what you want?" radio cards and their panels.
const RADIO_CARD_SELECTOR = ".tc_radio-card-wapper"
const RADIO_BUTTON_SELECTOR = ".tc-radio-button"
const CONTENT_WRAPPER_SELECTOR = ".tc_contant-wrapper"
const CONTENT_CARD_SELECTOR = ".tc-selected-card"

// Each radio card opens the content card with the matching id.
const TAB_CONTENT_IDS = {
    "first-radio-tab": "first-tab-content",
    "second-radio-tab": "second-tab-content",
    "third-radio-tab": "third-tab-content",
}

// The class may sit on the input or on the Webflow radio wrapper around it.
const getCardRadio = (card) => {
    if (!card) return null

    const control = card.querySelector(RADIO_BUTTON_SELECTOR)
    if (!control) return card.querySelector("input[type='radio']")
    if (control.matches("input[type='radio'], input[type='checkbox']")) {
        return control
    }

    return (
        control.querySelector("input[type='radio'], input[type='checkbox']") ||
        control
    )
}

// Check or uncheck a card radio, whether it is a real input or a Webflow styled div.
const setRadioChecked = (radio, checked) => {
    if (!radio) return

    if (radio.matches("input[type='radio'], input[type='checkbox']")) {
        radio.checked = checked
        return
    }

    radio.classList.toggle("w--redirected-checked", checked)
    radio.setAttribute("aria-checked", checked ? "true" : "false")
}

// Show (display: block) or hide (display: none) an element, overriding Webflow styles.
const setShown = (el, shown) => {
    if (!el) return
    el.style.setProperty("display", shown ? "block" : "none", "important")
}

// Parent stays hidden until a tab is chosen. Only the matching card is shown.
const showSelectedTabContent = (card) => {
    const wrapper = document.querySelector(CONTENT_WRAPPER_SELECTOR)
    if (!wrapper) return

    const contentId = TAB_CONTENT_IDS[card.id]
    wrapper.querySelectorAll(CONTENT_CARD_SELECTOR).forEach((panel) => {
        setShown(panel, panel.id === contentId)
    })
    setShown(wrapper, true)
}

// Hide every tab panel and the wrapper around them.
const hideTabContent = () => {
    const wrapper = document.querySelector(CONTENT_WRAPPER_SELECTOR)
    if (!wrapper) return

    wrapper.querySelectorAll(CONTENT_CARD_SELECTOR).forEach((panel) => {
        setShown(panel, false)
    })
    setShown(wrapper, false)
}

// First tab: "Has your child done formal debate before?" picks which panel shows.
const DEBATE_OPTION_CONTENT = {
    "tc-option-no": "tc-consult-content",
    "tc-option-yes": "tc-placement-content",
}

// Webflow may set these names as an id or as a class.
const getByIdOrClass = (name) =>
    document.getElementById(name) || document.querySelector(`.${name}`)

// Find the radio input for a No/Yes option (the option itself or one inside it).
const getOptionInput = (option) =>
    option.matches("input[type='radio']")
        ? option
        : option.querySelector("input[type='radio']")

// Mark a No/Yes option as selected or not, including its radio dot.
const setOptionChecked = (option, checked) => {
    option.classList.toggle("active", checked)

    const input = getOptionInput(option)
    if (input) input.checked = checked

    // Webflow's custom radio dot only updates on user clicks, not on .checked.
    option
        .querySelectorAll(".w-radio-input, .w-form-formradioinput--inputType-custom")
        .forEach((dot) => dot.classList.toggle("w--redirected-checked", checked))
}

// Select one No/Yes option and show only its matching panel.
const selectDebateOption = (selectedId) => {
    Object.entries(DEBATE_OPTION_CONTENT).forEach(([optionId, contentName]) => {
        const option = document.getElementById(optionId)
        const isSelected = optionId === selectedId
        if (option) setOptionChecked(option, isSelected)
        setShown(getByIdOrClass(contentName), isSelected)
    })
}

// Clear No/Yes and hide both panels.
const resetDebateOptions = () => selectDebateOption(null)

// Start with nothing selected and listen for clicks on No/Yes.
const setupDebateOptions = () => {
    resetDebateOptions()

    Object.keys(DEBATE_OPTION_CONTENT).forEach((optionId) => {
        const option = document.getElementById(optionId)
        if (!option) return

        option.addEventListener("click", () => selectDebateOption(optionId))

        const input = getOptionInput(option)
        if (input) {
            input.addEventListener("change", () => {
                if (input.checked) selectDebateOption(optionId)
            })
        }
    })
}

// One card stays active. Every other card loses .active and its radio.
const selectRadioCard = (card) => {
    if (!card) return

    const openingContactForm =
        card.id === "third-radio-tab" && !card.classList.contains("active")
    const openingDebateQuestion =
        card.id === "first-radio-tab" && !card.classList.contains("active")

    document.querySelectorAll(RADIO_CARD_SELECTOR).forEach((other) => {
        const isSelected = other === card
        other.classList.toggle("active", isSelected)
        setRadioChecked(getCardRadio(other), isSelected)
    })

    showSelectedTabContent(card)

    // Reopening "Have someone reach out" starts from a fresh contact form.
    if (openingContactForm) resetContactUsForm()
    // Reopening the first tab starts with neither No nor Yes picked.
    if (openingDebateQuestion) resetDebateOptions()
}

// Deselect every radio card and hide all tab panels.
const closeSelectedTab = () => {
    document.querySelectorAll(RADIO_CARD_SELECTOR).forEach((card) => {
        card.classList.remove("active")
        setRadioChecked(getCardRadio(card), false)
    })
    hideTabContent()
}

// Start with no card selected and open a card's panel when it is clicked.
const setupRadioCards = () => {
    const cards = document.querySelectorAll(RADIO_CARD_SELECTOR)
    if (!cards.length) return

    // Refresh starts closed, even if a radio was checked in the markup.
    hideTabContent()
    cards.forEach((card) => {
        card.classList.remove("active")
        setRadioChecked(getCardRadio(card), false)
    })

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            selectRadioCard(card)
        })

        const radio = getCardRadio(card)
        if (radio?.matches?.("input")) {
            radio.addEventListener("change", () => {
                if (radio.checked) selectRadioCard(card)
            })
        }
    })
}

// Swap a submit control to "Please wait..." until the request finishes.
const setSubmitWaiting = (btn, waiting) => {
    if (!btn) return

    const isInput = btn.tagName === "INPUT"
    if (waiting) {
        if (btn.dataset.originalLabel == null) {
            btn.dataset.originalLabel = isInput ? btn.value : btn.textContent
        }
        if (isInput) btn.value = "Please wait..."
        else btn.textContent = "Please wait..."
        btn.disabled = true
        btn.setAttribute("aria-busy", "true")
        return
    }

    if (btn.dataset.originalLabel != null) {
        if (isInput) btn.value = btn.dataset.originalLabel
        else btn.textContent = btn.dataset.originalLabel
    }
    btn.disabled = false
    btn.removeAttribute("aria-busy")
}

// Resolve the actual form element inside a wrapper root.
const getTrialClassFormEl = (root) => {
    if (!root) return null
    if (root.matches("form")) return root
    return root.querySelector("form") || root
}

// Clear form fields while preserving the submit button label.
const clearTrialClassFormFields = (root) => {
    if (!root) return

    const submitButtons = Array.from(
        root.querySelectorAll('input[type="submit"], button[type="submit"]'),
    )
    const submitDefaults = submitButtons.map((btn) => ({
        el: btn,
        value: btn.defaultValue || btn.value,
    }))

    const formEl = getTrialClassFormEl(root)
    if (formEl?.reset) {
        formEl.reset()
    }

    root.querySelectorAll("input, select, textarea").forEach((field) => {
        const type = (field.type || "").toLowerCase()

        if (type === "submit" || type === "button" || type === "hidden") {
            return
        }

        if (type === "radio" || type === "checkbox") {
            field.checked = false
            return
        }

        if (field.tagName === "SELECT") {
            field.value = ""
            if (field.options.length) {
                field.selectedIndex = 0
            }
            return
        }

        field.value = ""
    })

    submitDefaults.forEach(({ el, value }) => {
        if (value) {
            el.value = value
        }
    })
}

// Find the contact form wrapper, the form inside it, and the area holding its messages.
const getContactFormParts = () => {
    const contactFormRoot = document.getElementById("contact-us-form")
    const contactForm = getTrialClassFormEl(contactFormRoot)
    const contactScope =
        contactFormRoot?.closest(".trial_class_form-container") ||
        contactFormRoot?.parentElement ||
        contactFormRoot
    return { contactFormRoot, contactForm, contactScope }
}

// Contact-us form: grade options, submit, and success/error. Field ids match
// the reused Webflow form (_cu). This does not bind the trial class form.
const setupContactUsForm = () => {
    const { contactFormRoot, contactForm, contactScope } = getContactFormParts()
    if (!contactFormRoot || !contactForm) return

    const successBoxNew = document.getElementById(
        "contact-us-form-success-submission",
    )
    const failBox = contactScope?.querySelector(".tc_form-fail")

    if (successBoxNew) {
        successBoxNew.style.setProperty("display", "none", "important")
    }
    if (failBox) {
        failBox.style.setProperty("display", "none", "important")
    }

    const gradeSelect =
        contactForm.querySelector("select.trial-form-select-field") ||
        contactForm.querySelector("select")

    if (gradeSelect) {
        gradeSelect.disabled = true
        gradeSelect.innerHTML = '<option value="">Loading grades…</option>'
        ;(async () => {
            try {
                const res = await fetch(
                    `${window.NSD_API.TRIAL_CLASS_API_BASE}/getGrades`,
                )
                const grades = await res.json()
                gradeSelect.innerHTML = '<option value="">Select Grade</option>'
                if (Array.isArray(grades)) {
                    grades.forEach((grade) => {
                        const option = document.createElement("option")
                        option.value = grade.grade_name
                        option.textContent = grade.grade_name
                        gradeSelect.appendChild(option)
                    })
                }
            } catch (err) {
                console.error("Error loading contact form grades", err)
                gradeSelect.innerHTML = '<option value="">Select Grade</option>'
            } finally {
                gradeSelect.disabled = false
            }
        })()
    }

    const studentDescription = contactForm.querySelector(
        "#Student-Description_cu",
    )

    contactForm.setAttribute("action", "#")
    contactForm.removeAttribute("data-wf-page-id")
    contactForm.removeAttribute("data-wf-element-id")

    contactForm.addEventListener("submit", async function (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        if (successBoxNew) {
            successBoxNew.style.setProperty("display", "none", "important")
        }
        if (failBox) {
            failBox.style.setProperty("display", "none", "important")
        }

        const payload = {
            student: {
                first_name: contactForm
                    .querySelector("#student_first_name_cu")
                    .value.trim(),
                last_name: contactForm
                    .querySelector("#student_last_name_cu")
                    .value.trim(),
                email:
                    contactForm
                        .querySelector("#student_email_cu")
                        ?.value.trim() || "",
                grade: gradeSelect ? gradeSelect.value : "",
            },
            parent: {
                first_name: contactForm
                    .querySelector("#parent_first_name_cu")
                    .value.trim(),
                last_name: contactForm
                    .querySelector("#parent_last_name_cu")
                    .value.trim(),
                email: contactForm
                    .querySelector("#parent_email_cu")
                    .value.trim(),
                phone: contactForm
                    .querySelector("#parent_phone_cu")
                    .value.trim(),
            },
            what_best_describes_you: studentDescription
                ? studentDescription.value
                : "",
            previous_exp: contactForm
                .querySelector("#previous_experience_cu")
                .value.trim(),
        }

        const submitBtn = contactForm.querySelector(
            'input[type="submit"], button[type="submit"]',
        )
        setSubmitWaiting(submitBtn, true)

        try {
            const response = await fetch(
                `${window.NSD_API.FORMS_API_BASE}/oc_contact_us`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            )

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                const errorMessage =
                    data?.error || "Something went wrong. Please try again."
                setSubmitWaiting(submitBtn, false)
                if (failBox) {
                    failBox.textContent = errorMessage
                    failBox.style.setProperty("display", "block", "important")
                }
                return
            }

            contactForm.style.setProperty("display", "none", "important")
            setTimeout(() => {
                if (failBox) {
                    failBox.style.setProperty("display", "none", "important")
                }
                if (successBoxNew) {
                    successBoxNew.style.removeProperty("display")
                    successBoxNew.style.setProperty(
                        "display",
                        "flex",
                        "important",
                    )
                }
            }, 50)
        } catch (err) {
            console.error("Error submitting contact form", err)
            setSubmitWaiting(submitBtn, false)
            if (failBox) {
                failBox.textContent = "Something went wrong. Please try again."
                failBox.style.setProperty("display", "block", "important")
            }
        }
    })
}

// Show the contact form again after a previous success or error state.
const resetContactUsForm = () => {
    const successBox = document.getElementById(
        "contact-us-form-success-submission",
    )
    if (successBox) {
        successBox.style.setProperty("display", "none", "important")
    }

    const { contactFormRoot, contactForm, contactScope } = getContactFormParts()
    const failBox = contactScope?.querySelector(".tc_form-fail")
    if (failBox) {
        failBox.style.setProperty("display", "none", "important")
    }

    if (contactForm) {
        contactForm.style.removeProperty("display")
        contactForm
            .querySelectorAll('input[type="submit"], button[type="submit"]')
            .forEach((btn) => setSubmitWaiting(btn, false))
        clearTrialClassFormFields(contactForm)
    }

    return contactFormRoot
}

// Find the section that wraps the contact form.
const getContactFormWrapper = () =>
    document.getElementById("contact-form-wrapper") ||
    document.querySelector(".oc_contact-wrapper")

// #contact_us and Back keep the reused contact form behavior.
// When the form sits inside the third tab, that tab is what shows and hides it.
const setupContactUsNavigation = () => {
    const contactFormWrapper = getContactFormWrapper()
    const contactInsideTab = contactFormWrapper?.closest(
        `${CONTENT_WRAPPER_SELECTOR}, #third-tab-content`,
    )
    const wrapperHoldsRadios = contactFormWrapper?.querySelector(
        RADIO_CARD_SELECTOR,
    )

    // Only the old standalone contact view starts hidden. A form reused
    // inside the third tab is shown by that tab.
    if (contactFormWrapper && !contactInsideTab && !wrapperHoldsRadios) {
        contactFormWrapper.style.setProperty("display", "none", "important")
    }

    const showStandaloneContactForm = () => {
        if (!contactFormWrapper || contactInsideTab || wrapperHoldsRadios) return
        const cardContainer = document.querySelector("#card-container")
        if (cardContainer) {
            cardContainer.style.setProperty("display", "none", "important")
        }
        contactFormWrapper.style.removeProperty("display")
        contactFormWrapper.style.setProperty("display", "block", "important")
    }

    const hideStandaloneContactForm = () => {
        if (!contactFormWrapper || contactInsideTab || wrapperHoldsRadios) return
        contactFormWrapper.style.setProperty("display", "none", "important")
        const cardContainer = document.querySelector("#card-container")
        if (cardContainer) {
            cardContainer.style.removeProperty("display")
            cardContainer.style.setProperty("display", "block", "important")
        }
    }

    const contactUsTrigger = document.getElementById("contact_us")
    if (contactUsTrigger) {
        contactUsTrigger.addEventListener("click", (e) => {
            e.preventDefault()
            const thirdCard = document.getElementById("third-radio-tab")
            if (thirdCard) selectRadioCard(thirdCard)
            resetContactUsForm()
            showStandaloneContactForm()
        })
    }

    document.querySelectorAll("#tab-back-button").forEach((tabBackButton) => {
        tabBackButton.addEventListener("click", (e) => {
            e.preventDefault()
            closeSelectedTab()
            hideStandaloneContactForm()
        })
    })
}

// Popup modal steps. Every option or back link hides the current step and
// opens its target step.
const MODAL_FIRST_STEP_ID = "tc-modal-step-1"
const MODAL_STEP_IDS = [
    "tc-modal-step-1",
    "tc-modal-step-2-option-1",
    "tc-modal-step-2-option-2",
    "tc-modal-step-3-option-1",
    "tc-modal-step-3-option-2",
]
const MODAL_OPTION_TARGETS = {
    "step-one-option-one": "tc-modal-step-2-option-1",
    "step-one-option-two": "tc-modal-step-2-option-2",
    "step-two-option-one": "tc-modal-step-3-option-1",
    "step-two-option-two": "tc-modal-step-3-option-2",
    "back-model-1-option-1": "tc-modal-step-1",
    "back-model-1-option-2": "tc-modal-step-1",
    "back-model-2-option-2": "tc-modal-step-2-option-1",
    "back-model-2-option-1": "tc-modal-step-2-option-1",
    "show-step-2-option-1": "tc-modal-step-2-option-1",
    "show-step-3-option-1": "tc-modal-step-3-option-1",
    "show-step-3-option-2": "tc-modal-step-3-option-2",
}

// Repeated on several steps, so it is matched by its text instead of an id.
const SEND_INFO_TEXT = "just send me information"

// True when the clicked element's text is exactly "Just send me information".
const isSendInfoLink = (el) =>
    el.textContent.trim().replace(/\s+/g, " ").toLowerCase() === SEND_INFO_TEXT

// Close the modal and open "Have someone reach out" with a fresh contact form.
const openContactFromModal = () => {
    closeTrialModalSmooth()

    const thirdCard = document.getElementById("third-radio-tab")
    if (!thirdCard) return

    selectRadioCard(thirdCard)
    resetContactUsForm()
    thirdCard.scrollIntoView({ behavior: "smooth", block: "center" })
}

// Show one modal step, hide the rest, and update the step indicator and text.
const showModalStep = (stepId) => {
    MODAL_STEP_IDS.forEach((id) => {
        setShown(document.getElementById(id), id === stepId)
    })

    const onFirstStep = stepId === MODAL_FIRST_STEP_ID
    document
        .getElementById("step-2-indicator")
        ?.classList.toggle("active", !onFirstStep)

    const stepText = document.getElementById("model-step-text")
    if (stepText) stepText.textContent = onFirstStep ? "Step 1 of 2" : "Step 2 of 2"
}

// Send the modal back to step 1.
const resetModalSteps = () => showModalStep(MODAL_FIRST_STEP_ID)

// Connect "Get started", step options, back links and "Just send me information".
const setupModalSteps = () => {
    if (!document.getElementById(MODAL_FIRST_STEP_ID)) return

    resetModalSteps()

    // "Get started" always opens the modal on step 1.
    document
        .getElementById("dialog_trial_stepper_open_btn")
        ?.addEventListener("click", resetModalSteps)

    // Each option or back link opens its target step.
    Object.entries(MODAL_OPTION_TARGETS).forEach(([optionId, targetId]) => {
        document.getElementById(optionId)?.addEventListener("click", (e) => {
            e.preventDefault()
            showModalStep(targetId)
        })
    })

    // Walk up from the clicked element to catch any "Just send me information" link.
    const dialog = document.getElementById("dialog_trial_stepper")
    dialog?.addEventListener("click", (e) => {
        let el = e.target
        while (el && el !== dialog) {
            if (isSendInfoLink(el)) {
                e.preventDefault()
                openContactFromModal()
                return
            }
            el = el.parentElement
        }
    })
}

// ---------------------------------------------------------------------------
// Trial class form: registration, manage token, reschedule and cancel.
// Ported from trial_class.js for the conversion page Webflow design.
// ---------------------------------------------------------------------------

// Trial slots are real UTC instants. Always show the Eastern calendar date.
// Fallback for older API responses: start_time is a UTC instant; show the Eastern calendar date.
function formatTrialDate(utcISOString, withWeekday) {
    const date = new Date(utcISOString)
    if (Number.isNaN(date.getTime())) return ""
    const options = {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
    }
    if (withWeekday) options.weekday = "short"
    return date.toLocaleDateString("en-US", options)
}

// Trial classes store the Eastern date + time the admin picked ("2026-11-02T19:00:00").
// The API sends it as start_time_et / end_time_et; split it into parts with no time zone math.
function parseEasternWallTime(text) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(text || "").trim())
    if (!match) return null
    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: match[5],
    }
}

// Date label for a trial class field ("start_time"), e.g. "Mon, Nov 2". Prefers the Eastern text.
function trialDateText(item, field, withWeekday) {
    const wall = parseEasternWallTime(item && item[`${field}_et`])
    if (!wall) return formatTrialDate(item && item[field], withWeekday)
    // Noon UTC on that calendar day keeps the date the same in every viewer time zone.
    const date = new Date(Date.UTC(wall.year, wall.month - 1, wall.day, 12))
    const options = { timeZone: "UTC", month: "short", day: "numeric" }
    if (withWeekday) options.weekday = "short"
    return date.toLocaleDateString("en-US", options)
}

// Clock label for a trial class field, e.g. "7:00 PM". Prefers the Eastern text.
function trialClockText(item, field) {
    const wall = parseEasternWallTime(item && item[`${field}_et`])
    if (!wall) {
        return typeof utcDateToEasternTime === "function"
            ? utcDateToEasternTime(item && item[field])
            : ""
    }
    const suffix = wall.hour >= 12 ? "PM" : "AM"
    return `${wall.hour % 12 || 12}:${wall.minute} ${suffix}`
}

// Global variable to store selected trial class date for success message
window.trial_class_date = ""

// Sync selected trial class date from radio button to global variable
const syncTrialClassDate = (radio) => {
    if (!radio) {
        window.trial_class_date = ""
        return
    }

    window.trial_class_date =
        radio.dataset.trialDate ||
        radio
            .closest(".tc_option-label")
            ?.querySelector(".trial-class_date")
            ?.textContent.trim() ||
        ""
}

// Render dynamic registered date text in success message element
const renderRegisteredDate = (registeredDateEl) => {
    const el =
        registeredDateEl ||
        document.getElementById("registered-date") ||
        document.getElementById("res-registered-date")
    if (!el || !window.trial_class_date) return

    el.textContent = `You're registered for the ${window.trial_class_date} trial class!`
}

// Get trial class form wrapper or form element from DOM
const getTrialClassFormRoot = () =>
    document.querySelector("#trial-class-form") ||
    document.querySelector("#wf-form-trial-class-form")

// Get reschedule form element from DOM
const getRescheduleFormRoot = () =>
    document.querySelector("#trial-class-reschdule-form")

// Keywords that trigger interview card visibility in student description
const INTERVIEW_CARD_KEYWORDS = [
    "PF",
    "LD",
    "CX",
    "Camp",
    "Year",
    "public",
    "forum",
    "lincoln",
    "douglas",
    "policy",
]

// Check if text contains any interview card keyword (case-insensitive)
const matchesInterviewCardKeywords = (text) => {
    const normalized = (text || "").toLowerCase()
    return INTERVIEW_CARD_KEYWORDS.some((keyword) =>
        normalized.includes(keyword.toLowerCase()),
    )
}

// Setup interview card show/hide logic for registration or reschedule form
const setupInterviewCardLogic = (scope) => {
    if (!scope) return null

    const studentDescription =
        scope.querySelector("#Student-Description") ||
        scope.querySelector(".trial-form-student-desc-field") ||
        scope.querySelector("#res_student_description")

    const interviewCard = scope.querySelector(".tc_interview-card")
    const state = { dismissed: false }

    const updateInterviewCardVisibility = () => {
        if (!studentDescription || !interviewCard) return

        const hasKeywordMatch = matchesInterviewCardKeywords(
            studentDescription.value,
        )

        if (!hasKeywordMatch) {
            state.dismissed = false
        }

        if (hasKeywordMatch && !state.dismissed) {
            interviewCard.style.setProperty("display", "block", "important")
        } else {
            interviewCard.style.setProperty("display", "none", "important")
        }
    }

    if (interviewCard) {
        interviewCard.style.setProperty("display", "none", "important")

        const stayWithTrialBtn =
            interviewCard.querySelector(".tc_button-outline")
        if (stayWithTrialBtn) {
            stayWithTrialBtn.addEventListener("click", (e) => {
                e.preventDefault()
                state.dismissed = true
                interviewCard.style.setProperty("display", "none", "important")
            })
        }
    }

    if (studentDescription) {
        studentDescription.addEventListener(
            "input",
            updateInterviewCardVisibility,
        )
        updateInterviewCardVisibility()
    }

    return { updateInterviewCardVisibility, state, interviewCard }
}

// Fetch registration details for a manage token; returns null when invalid/expired
const fetchManageRegistration = async (token) => {
    try {
        const res = await fetch(
            `${window.NSD_API.TRIAL_CLASS_API_BASE}/trial-class/registration/manage?token=${encodeURIComponent(token)}`,
        )
        if (!res.ok) {
            throw new Error("Failed to fetch registration details")
        }
        return await res.json()
    } catch (err) {
        console.error("Error loading trial class registration", err)
        return null
    }
}

// Hide form and show success box after successful form submission
const showFormSuccessState = ({
    formRoot,
    successBoxNew,
    successWrapper,
    failBox,
    registeredDateEl,
}) => {
    renderRegisteredDate(registeredDateEl)

    if (formRoot) {
        formRoot.style.setProperty("display", "none", "important")
    }

    setTimeout(() => {
        if (failBox) {
            failBox.style.setProperty("display", "none", "important")
        }
        if (successWrapper) {
            successWrapper.style.removeProperty("display")
            successWrapper.style.setProperty("display", "block", "important")
        }
        if (successBoxNew) {
            successBoxNew.style.removeProperty("display")
            successBoxNew.style.setProperty("display", "flex", "important")
        }
    }, 50)
}

// Registration form, manage-token card, reschedule and cancel.
const setupTrialClassForms = async () => {

    // Parse URL for manage registration token
    const urlParams = new URLSearchParams(window.location.search)
    const manageToken = urlParams.get("token")

    // By default hide all the form containers.
    // Skip the contact-us copy, which reuses .trial_class_form-container.
    const trialClassFormContainer = Array.from(
        document.querySelectorAll(".trial_class_form-container"),
    ).find(
        (el) =>
            !el.closest(
                "#contact-form-wrapper, #contact-us-form, .contact_form-wapper",
            ),
    )
    if (trialClassFormContainer) {
        trialClassFormContainer.style.setProperty(
            "display",
            "none",
            "important",
        )
    }

    // Hide reschedule form by default
    const rescheduleForm = document.querySelector("#trial-class-reschdule-form")
    if (rescheduleForm) {
        rescheduleForm.style.setProperty("display", "none", "important")
    }

    // Hide reschedule form container (wrapper shown when rescheduling) by default
    const rescheduleFormContainer = document.querySelector(
        ".tc-reschedule-form-container",
    )
    if (rescheduleFormContainer) {
        rescheduleFormContainer.style.setProperty(
            "display",
            "none",
            "important",
        )
    }

    // Hide registration manage card by default
    const registrationCard = document.querySelector(".tc_registration-card")
    if (registrationCard) {
        registrationCard.style.setProperty("display", "none", "important")
    }

    // Hide cancel-confirmation and cancelled state cards by default
    const cancelInfoCard = document.querySelector(
        ".tc_cancel-registration-info-card",
    )
    if (cancelInfoCard) {
        cancelInfoCard.style.setProperty("display", "none", "important")
    }

    const cancelledCard = document.querySelector(
        ".tc_registration-cancelled-card",
    )
    if (cancelledCard) {
        cancelledCard.style.setProperty("display", "none", "important")
    }

    // Hide tab section by default until user clicks a CTA
    const tabSection = document.getElementById("tc-tab-wapper")
    if (tabSection) {
        tabSection.style.setProperty("display", "none", "important")
    }

    // Hero card container shown by default; hidden while a tab is open
    const cardContainer = document.querySelector("#card-container")

    // Contact form open/close lives in setupContactUsNavigation on this page.
    const hideContactFormWrapper = () => {}
    const showContactFormWrapper = () => {}

    const hideCancelledCard = () => {
        if (!cancelledCard) return
        cancelledCard.style.setProperty("display", "none", "important")
    }

    // Show tab section, select tab, and scroll into view
    const showTabSection = (tabIndex = 0) => {
        if (!tabSection) return

        hideContactFormWrapper()
        hideCancelledCard()

        tabSection.style.removeProperty("display")
        tabSection.style.setProperty("display", "block", "important")

        if (cardContainer) {
            cardContainer.style.setProperty("display", "none", "important")
        }

        const tabButtons = tabSection.querySelectorAll(
            ".tc-tab-menu .tc-tab-button, .tc-tab-menu .w-tab-link",
        )
        const targetTab = tabButtons[tabIndex]
        if (targetTab) {
            targetTab.click()
        }

        tabSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    // Bind click handler on selector to open a specific tab
    const bindTabSectionTrigger = (selector, tabIndex) => {
        document.querySelectorAll(selector).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault()
                showTabSection(tabIndex)
            })
        })
    }

    // Bind click handler on selector to redirect to an external page
    const bindRedirectTrigger = (selector, url) => {
        document.querySelectorAll(selector).forEach((btn) => {
            if (btn.tagName === "A") {
                btn.setAttribute("href", url)
            }
            btn.addEventListener("click", (e) => {
                e.preventDefault()
                window.location.href = url
            })
        })
    }

    // Book consult button redirects to the consults page
    bindRedirectTrigger(
        ".tc_book-consult-btn",
        "https://www.nsdebatecamp.com/online-classes/consults",
    )
    // Free trial class button opens Tab 2 (index 1)
    bindTabSectionTrigger(".tc_book-btn", 1)

    // Free trial class button also resets the Trial class tab back to the
    // registration form view (the reschedule view may still be open from before)
    document.querySelectorAll(".tc_book-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (rescheduleFormContainer) {
                rescheduleFormContainer.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
            }
            if (rescheduleForm) {
                rescheduleForm.style.setProperty("display", "none", "important")
            }

            // With a manage token the correct view is the registration card,
            // not the registration form
            if (manageToken) {
                hideCancelledCard()
                if (cancelInfoCard) {
                    cancelInfoCard.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                }
                // Re-validate the token on every click: it may have expired
                // (or the registration may have been cancelled) since page load
                if (registrationCard) {
                    registrationCard.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                }

                const freshData = await loadManageRegistration()

                const invalidTokenEl = document.getElementById(
                    "invalid-or-expired-token-found",
                )

                if (!freshData || !freshData.registration) {
                    if (trialClassFormContainer) {
                        trialClassFormContainer.style.setProperty(
                            "display",
                            "none",
                            "important",
                        )
                    }
                    if (invalidTokenEl) {
                        invalidTokenEl.style.removeProperty("display")
                        invalidTokenEl.style.setProperty(
                            "display",
                            "block",
                            "important",
                        )
                    }
                    return
                }

                if (invalidTokenEl) {
                    invalidTokenEl.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                }
                if (registrationCard) {
                    registrationCard.style.removeProperty("display")
                    registrationCard.style.setProperty(
                        "display",
                        "block",
                        "important",
                    )
                }
                return
            }

            const registrationFormWrapper = document.querySelector(
                ".trial-class_form-wapper-new",
            )
            if (registrationFormWrapper) {
                registrationFormWrapper.style.removeProperty("display")
                registrationFormWrapper.style.setProperty(
                    "display",
                    "block",
                    "important",
                )
            }
        })
    })
    // Placement interview button redirects to the placement interview page
    bindRedirectTrigger(
        ".tc_book-placement",
        "https://www.nsdebatecamp.com/online-classes/placement-interview",
    )
    // Interview card CTA opens placement interview tab
    bindTabSectionTrigger(".tc_interview-card .tc_button-blue", 2)
    // Back to discovery link opens first tab
    bindTabSectionTrigger("#back-discovery-tab", 0)
    bindTabSectionTrigger(".tc_form-done-new .tc_button-blue-rounded", 2)

    // Trial class slot grid elements
    const wrapper = document.querySelector(".trial-class_option-wapper")
    const grid = wrapper
        ? wrapper.querySelector(".trial-class-grid-container")
        : null
    const template = document.querySelector(".tc_option-label")

    // Toggle selected styling on trial class slot cards
    const updateCardSelectionClass = (container) => {
        if (!container) return

        const optionLabels = container.querySelectorAll(".tc_option-label")
        optionLabels.forEach((optionLabel) => {
            const infoContainer = optionLabel.querySelector(
                ".trial-class-info-container",
            )
            const optionRadio = optionLabel.querySelector("input[type='radio']")

            if (!infoContainer) return

            if (optionRadio && optionRadio.checked) {
                infoContainer.classList.add("tc_card-selected")
            } else {
                infoContainer.classList.remove("tc_card-selected")
            }
        })
    }

    /** Visible while trial class slot options load (SEO-friendly status text). */
    const mountTrialOptionsLoader = (gridEl) => {
        gridEl.innerHTML = ""
        const el = document.createElement("div")
        el.className = "tc-trial-options-loader"
        el.setAttribute("role", "status")
        el.setAttribute("aria-live", "polite")
        el.setAttribute("aria-busy", "true")
        el.textContent = "Loading available trial classes…"
        gridEl.appendChild(el)
        return el
    }

    // Show empty state when no trial classes are available'
    const mountTrialOptionsEmpty = (gridEl) => {
        gridEl.innerHTML = ""
        const el = document.createElement("p")
        el.className = "tc-trial-options-empty"
        el.style.cssText = "padding:1.25rem 1rem;"
        el.textContent = "Classes not available"
        gridEl.appendChild(el)
    }

    /** Visible while manage registration (reschedule/cancel) data loads. */
    const mountManageRegistrationLoader = () => {
        // Never mount a second loader (e.g. a click while the first load is in flight)
        const existing = document.querySelector(".tc-manage-registration-loader")
        if (existing) return existing

        const el = document.createElement("div")
        el.className = "tc-manage-registration-loader"
        el.setAttribute("role", "status")
        el.setAttribute("aria-live", "polite")
        el.setAttribute("aria-busy", "true")
        const p = document.createElement("p")
        p.style.margin = "0"
        p.textContent = "Loading your registration…"
        el.appendChild(p)
        if (registrationCard && registrationCard.parentNode) {
            registrationCard.parentNode.insertBefore(el, registrationCard)
        } else {
            document.body.appendChild(el)
        }
        return el
    }

    let manageRequestInFlight = null
    const loadManageRegistration = () => {
        if (manageRequestInFlight) return manageRequestInFlight

        const loaderEl = mountManageRegistrationLoader()
        manageRequestInFlight = fetchManageRegistration(manageToken).then(
            (data) => {
                if (loaderEl.parentNode) loaderEl.remove()
                manageRequestInFlight = null
                return data
            },
        )

        return manageRequestInFlight
    }

    // Registration form: show structure immediately; load slots in background (skip when managing via token).
    if (!manageToken && wrapper && grid && template) {
        const templateClone = template.cloneNode(true)
        template.remove()
        mountTrialOptionsLoader(grid)
        ;(async () => {
            try {
                const res = await fetch(
                    `${window.NSD_API.TRIAL_CLASS_API_BASE}/trialClassDetail`,
                )
                const classes = await res.json()

                if (
                    !res.ok ||
                    !Array.isArray(classes) ||
                    classes.length === 0
                ) {
                    mountTrialOptionsEmpty(grid)
                    return
                }

                grid.innerHTML = ""
                const fragment = document.createDocumentFragment()

                classes.forEach((item) => {
                    const clone = templateClone.cloneNode(true)

                    const dateEl = clone.querySelector(".trial-class_date")
                    let shortDate = ""
                    if (dateEl) {
                        shortDate = trialDateText(item, "start_time", false)
                        dateEl.textContent = trialDateText(item, "start_time", true)
                    }

                    const timeEl = clone.querySelector(".trial-class_time-info")
                    if (timeEl) {
                        const start = trialClockText(item, "start_time")
                        const end = trialClockText(item, "end_time")
                        timeEl.textContent = `${start} - ${end} EST`
                    }

                    const gradeEl = clone.querySelector(
                        ".trial-class_grade-info",
                    )
                    if (gradeEl) {
                        gradeEl.textContent = `${item.grade_label}`
                    }

                    const radio = clone.querySelector("input[type='radio']")
                    if (radio) {
                        const uniqueId = "trial-class-" + item._id
                        radio.id = uniqueId
                        radio.value = item._id
                        radio.name = "trial-class"
                        if (shortDate) {
                            radio.dataset.trialDate = shortDate
                        }
                        clone
                            .querySelector("label")
                            ?.setAttribute("for", uniqueId)
                        radio.addEventListener("change", () => {
                            updateCardSelectionClass(grid)
                            syncTrialClassDate(radio)
                        })
                    }

                    clone.addEventListener("click", function () {
                        const r = clone.querySelector("input[type='radio']")
                        if (r) r.checked = true
                        updateCardSelectionClass(grid)
                        syncTrialClassDate(r)
                    })

                    fragment.appendChild(clone)
                })

                grid.appendChild(fragment)
                updateCardSelectionClass(grid)
            } catch (err) {
                console.error("Error loading trial class details", err)
                grid.innerHTML = ""
                const errEl = document.createElement("div")
                errEl.className = "tc-trial-options-error"
                errEl.setAttribute("role", "alert")
                errEl.style.cssText = "padding:1.25rem 1rem;text-align:center;"
                errEl.textContent =
                    "Could not load trial classes. Please refresh the page."
                grid.appendChild(errEl)
            }
        })()
    }

    // Show registration form container when not managing via token
    if (!manageToken && trialClassFormContainer) {
        trialClassFormContainer.style.removeProperty("display")
        trialClassFormContainer.style.setProperty(
            "display",
            "block",
            "important",
        )
    }

    // Get main trial class form root element
    const form = getTrialClassFormRoot()

    // Grade dropdown list (async; independent of slot cards) — only present when the main form exists
    const gradeSelect = form
        ? form.querySelector(".trial-form-select-field")
        : null
    if (form) {
    // Load grade options from API
    if (gradeSelect && !manageToken) {
        gradeSelect.disabled = true
        gradeSelect.innerHTML = '<option value="">Loading grades…</option>'
        ;(async () => {
            try {
                const res = await fetch(
                    `${window.NSD_API.TRIAL_CLASS_API_BASE}/getGrades`,
                )
                const grades = await res.json()
                gradeSelect.innerHTML = '<option value="">Select Grade</option>'

                grades.forEach((grade) => {
                    const option = document.createElement("option")
                    option.value = grade.grade_name
                    option.textContent = grade.grade_name
                    gradeSelect.appendChild(option)
                })
            } catch (err) {
                console.error("Error loading payment grades", err)
                gradeSelect.innerHTML = '<option value="">Select Grade</option>'
            } finally {
                gradeSelect.disabled = false
            }
        })()
    }

    // Setup interview card keyword logic for main registration form
    const mainFormScope =
        form.closest(".trial_class_form-container") || form
    const mainInterviewCardSetup = setupInterviewCardLogic(mainFormScope)
    const studentDescription =
        form.querySelector("#Student-Description") ||
        form.querySelector(".trial-form-student-desc-field")

    if (studentDescription) {
        studentDescription.value = studentDescription.value || ""
    }

    // Success and error message elements for registration form.
    // Skip the contact-us copies, which reuse these classes.
    const outsideContactForm = (el) =>
        !el.closest(
            "#contact-us-form, #contact-form-wrapper, .oc_contact-wrapper",
        )
    const successBox = [...document.querySelectorAll(".tc_form-done")].find(
        outsideContactForm,
    )
    const successBoxNew =
        document.querySelector("#trial-class-form-success-submission") ||
        [...document.querySelectorAll(".tc_form-done-new")].find(
            outsideContactForm,
        )
    const successWrapper = successBoxNew?.closest(".w-form-done")
    const failBox = [...document.querySelectorAll(".tc_form-fail")].find(
        outsideContactForm,
    )

    // Hide success and error states by default
    if (successBox) successBox.style.setProperty("display", "none", "important")
    if (successBoxNew)
        successBoxNew.style.setProperty("display", "none", "important")
    if (successWrapper)
        successWrapper.style.setProperty("display", "none", "important")
    if (failBox) failBox.style.setProperty("display", "none", "important")

    // Reset form after success when user clicks Stay with trial class
    const resetTrialClassForm = () => {
        if (successBox)
            successBox.style.setProperty("display", "none", "important")
        if (successBoxNew)
            successBoxNew.style.setProperty("display", "none", "important")
        if (successWrapper)
            successWrapper.style.setProperty("display", "none", "important")
        if (failBox)
            failBox.style.setProperty("display", "none", "important")

        const formRoot = getTrialClassFormRoot()
        if (formRoot) {
            formRoot.style.removeProperty("display")
            clearTrialClassFormFields(formRoot)
        }

        if (grid) updateCardSelectionClass(grid)

        if (mainInterviewCardSetup) {
            mainInterviewCardSetup.state.dismissed = false
            if (mainInterviewCardSetup.interviewCard) {
                mainInterviewCardSetup.interviewCard.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
            }
            mainInterviewCardSetup.updateInterviewCardVisibility()
        }

        window.trial_class_date = ""
        const secondCard = document.getElementById("second-radio-tab")
        if (secondCard) selectRadioCard(secondCard)
        else showTabSection(1)
    }

    // Stay with trial class button resets form and opens trial class tab
    document
        .querySelectorAll(
            ".tc_form-done-new .tc_button-no-border, #trial-class-form-success-submission .tc_button-no-border",
        )
        .forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault()
                resetTrialClassForm()
            })
        })

    form.setAttribute("action", "#")
    form.removeAttribute("data-wf-page-id")
    form.removeAttribute("data-wf-element-id")

    // Handle trial class registration form submission
    form.addEventListener("submit", async function (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        if (successBox)
            successBox.style.setProperty("display", "none", "important")
        if (successBoxNew)
            successBoxNew.style.setProperty("display", "none", "important")
        if (successWrapper)
            successWrapper.style.setProperty("display", "none", "important")
        if (failBox) failBox.style.setProperty("display", "none", "important")

        const selectedRadio = form.querySelector(
            "input[name='trial-class']:checked",
        )
        if (!selectedRadio) {
            alert("Please select a trial class.")
            return
        }

        syncTrialClassDate(selectedRadio)

        const payload = {
            student: {
                first_name: form
                    .querySelector("#student_first_name")
                    .value.trim(),
                last_name: form
                    .querySelector("#student_last_name")
                    .value.trim(),
                grade: gradeSelect ? gradeSelect.value : "",
            },
            parent: {
                first_name: form
                    .querySelector("#parent_first_name")
                    .value.trim(),
                last_name: form.querySelector("#parent_last_name").value.trim(),
                email: form.querySelector("#parent_email").value.trim(),
                phone: form.querySelector("#parent_phone").value.trim(),
            },
            trial_class_id: selectedRadio.value,
            previous_experience: form
                .querySelector("#previous_experience")
                .value.trim(),
            best_description: studentDescription
                ? studentDescription.value
                : "",
            landingURL:
                typeof getLandingURL === "function"
                    ? getLandingURL()
                    : window.location.href,
        }

        const submitBtn = form.querySelector(
            'input[type="submit"], button[type="submit"]',
        )
        setSubmitWaiting(submitBtn, true)

        try {
            const response = await fetch(
                `${window.NSD_API.TRIAL_CLASS_API_BASE}/trialClassRegistration`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            )

            const data = await response.json()

            if (!response.ok) {
                const errorMessage =
                    data?.error || "Something went wrong. Please try again."

                setSubmitWaiting(submitBtn, false)
                if (failBox) {
                    failBox.textContent = errorMessage
                    failBox.style.setProperty("display", "block", "important")
                }

                return
            }

            // Success: hide form fields, show success box
            showFormSuccessState({
                formRoot: form,
                successBoxNew,
                successWrapper,
                failBox,
            })
        } catch (err) {
            setSubmitWaiting(submitBtn, false)
            if (failBox) {
                failBox.textContent = "Something went wrong. Please try again."
                failBox.style.setProperty("display", "block", "important")
            }
        }
    })
    }

    // Manage registration view when token is present in the URL
    let registrationData = null

    if (manageToken) {
        const formContainer = trialClassFormContainer
        const rescheduleForm = document.querySelector(
            "#trial-class-reschdule-form",
        )
        registrationData = await loadManageRegistration()

        // If token is invalid or expired, show the dedicated message and stop
        if (!registrationData || !registrationData.registration) {
            const invalidTokenEl = document.getElementById(
                "invalid-or-expired-token-found",
            )

            if (trialClassFormContainer) {
                trialClassFormContainer.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
            }
            if (registrationCard) {
                registrationCard.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
            }
            if (rescheduleForm) {
                rescheduleForm.style.setProperty("display", "none", "important")
            }

            hideCancelledCard()
            if (invalidTokenEl) {
                invalidTokenEl.style.removeProperty("display")
                invalidTokenEl.style.setProperty(
                    "display",
                    "block",
                    "important",
                )
            }

            return
        }

        // Hide main form and reschedule form (registration card is shown after it is populated)
        if (formContainer) {
            formContainer.style.setProperty("display", "none", "important")
        }
        if (rescheduleForm) {
            rescheduleForm.style.setProperty("display", "none", "important")
        }

        // Populate registration card with all info rows from API
        if (
            registrationData &&
            registrationData.registration &&
            registrationCard
        ) {
            const registration = registrationData.registration
            const currentClass = registrationData.current_class || {}

            let classDescription = ""
            try {
                if (currentClass.start_time && currentClass.end_time) {
                    const datePart = trialDateText(currentClass, "start_time", true)
                    const startTime = trialClockText(currentClass, "start_time")
                    const endTime = trialClockText(currentClass, "end_time")
                    classDescription = `${datePart} – ${startTime}–${endTime} EST`
                }
            } catch (e) {
                classDescription = "—"
            }

            const rowsData = [
                {
                    label: "Student",
                    value:
                        [
                            registration.student?.first_name || "",
                            registration.student?.last_name || "",
                        ]
                            .filter(Boolean)
                            .join(" ") || "—",
                },
                { label: "Class", value: classDescription || "—" },
                {
                    label: "Parent Name",
                    value:
                        [
                            registration.parent?.first_name || "",
                            registration.parent?.last_name || "",
                        ]
                            .filter(Boolean)
                            .join(" ") || "—",
                },
                {
                    label: "Student Grade",
                    value: registration.student?.grade || "—",
                },
                {
                    label: "Parent Email Address",
                    value: registration.parent?.email || "—",
                },
                {
                    label: "Parent Phone Number",
                    value: registration.parent?.phone || "—",
                },
            ]

            let container = registrationCard.querySelector(".tc_student-card")
            if (!container) {
                container = document.createElement("div")
                container.className = "tc_student-card"
                const btnContainer = registrationCard.querySelector(
                    ".tc_registration-button-container",
                )
                if (btnContainer) {
                    registrationCard.insertBefore(container, btnContainer)
                } else {
                    registrationCard.appendChild(container)
                }
            }

            container.innerHTML = ""
            rowsData.forEach(({ label, value }) => {
                const row = document.createElement("div")
                row.className = "tc_student-info-row"
                const labelEl = document.createElement("p")
                labelEl.className = "tc_student-info-label"
                labelEl.textContent = label
                const valueEl = document.createElement("p")
                valueEl.className = "tc_student-info-value"
                valueEl.textContent = value
                row.appendChild(labelEl)
                row.appendChild(valueEl)
                container.appendChild(row)
            })
        }

        // Registration card is populated now (and the loader is gone): show it
        if (registrationCard) {
            registrationCard.style.removeProperty("display")
            registrationCard.style.setProperty("display", "block", "important")
        }

        // Reschedule button: show reschedule form container, hide registration card
        const rescheduleBtn = document.querySelector(".tc_reschedule-btn")
        const rescheduleView = rescheduleFormContainer || rescheduleForm
        if (rescheduleBtn && registrationCard && rescheduleView) {
            rescheduleBtn.addEventListener("click", function (e) {
                e.preventDefault()
                registrationCard.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
                if (cancelInfoCard) {
                    cancelInfoCard.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                }

                rescheduleView.style.removeProperty("display")
                rescheduleView.style.setProperty(
                    "display",
                    "block",
                    "important",
                )

                // The inner form is hidden by default; make sure it is visible too
                if (rescheduleForm && rescheduleForm !== rescheduleView) {
                    rescheduleForm.style.removeProperty("display")
                    rescheduleForm.style.setProperty(
                        "display",
                        "block",
                        "important",
                    )
                }

                const firstVisibleRescheduleRadio =
                    rescheduleForm?.querySelector(
                        "input[name='res-trial-class']",
                    )
                if (firstVisibleRescheduleRadio) {
                    firstVisibleRescheduleRadio.checked = true
                }
            })
        }

        // Cancel Registration button (on registration card): open confirmation info card
        // Scoped to the registration card because the "No, Go Back" button in the
        // confirmation card shares the .tc_cancel-btn class.
        const cancelBtn =
            registrationCard?.querySelector(".tc_cancel-btn") ||
            document.querySelector(
                ".tc_registration-card .tc_cancel-btn, .tc_cancel-btn:not(.black-text)",
            )

        if (cancelBtn && registrationCard && cancelInfoCard) {
            cancelBtn.addEventListener("click", function (e) {
                e.preventDefault()
                registrationCard.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
                cancelInfoCard.style.removeProperty("display")
                cancelInfoCard.style.setProperty(
                    "display",
                    "block",
                    "important",
                )
            })
        }

        // "Go Back" buttons (confirmation info card + reschedule form): return to registration card
        const goBackButtons = Array.from(
            document.querySelectorAll(".tc_cancel-btn.black-text"),
        ).filter((btn) => !registrationCard?.contains(btn))

        goBackButtons.forEach((backBtn) => {
            backBtn.addEventListener("click", function (e) {
                e.preventDefault()

                hideCancelledCard()
                if (cancelInfoCard) {
                    cancelInfoCard.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                }
                if (rescheduleFormContainer) {
                    rescheduleFormContainer.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                }
                if (rescheduleForm) {
                    rescheduleForm.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                }

                if (registrationCard) {
                    registrationCard.style.removeProperty("display")
                    registrationCard.style.setProperty(
                        "display",
                        "block",
                        "important",
                    )
                }
            })
        })

        // Confirm Cancel button (inside the confirmation info card): actually cancels
        const confirmCancelBtn = document.querySelector(
            ".tc_cancel-registration-btn",
        )

        if (confirmCancelBtn) {
            confirmCancelBtn.addEventListener("click", function (e) {
                e.preventDefault()
                const cancelUrl = `${window.NSD_API.TRIAL_CLASS_API_BASE}/trial-class/registration/cancel`

                if (confirmCancelBtn.getAttribute("aria-busy") === "true") {
                    return
                }
                setSubmitWaiting(confirmCancelBtn, true)

                fetch(cancelUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: manageToken }),
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error("Failed to cancel registration")
                        }
                        return res
                            .text()
                            .then((t) => (t && t.trim() ? JSON.parse(t) : {}))
                    })
                    .then(() => {
                        const invalidTokenEl = document.getElementById(
                            "invalid-or-expired-token-found",
                        )
                        if (cancelInfoCard) {
                            cancelInfoCard.style.setProperty(
                                "display",
                                "none",
                                "important",
                            )
                        }
                        if (registrationCard) {
                            registrationCard.style.setProperty(
                                "display",
                                "none",
                                "important",
                            )
                        }
                        if (invalidTokenEl) {
                            invalidTokenEl.style.setProperty(
                                "display",
                                "none",
                                "important",
                            )
                        }
                        if (cancelledCard) {
                            cancelledCard.style.removeProperty("display")
                            cancelledCard.style.setProperty(
                                "display",
                                "block",
                                "important",
                            )
                        }
                    })
                    .catch((err) => {
                        console.error(
                            "Error cancelling trial class registration",
                            err,
                        )
                        setSubmitWaiting(confirmCancelBtn, false)
                    })
            })
        }
    }

    // If we have registrationData, prefill the reschedule form
    if (registrationData && registrationData.registration) {
        const rescheduleForm = document.querySelector(
            "#trial-class-reschdule-form",
        )

        if (rescheduleForm) {
            const registration = registrationData.registration

            // No slots to reschedule into (e.g. cancelled registration): clear the
            // Webflow placeholder slot cards instead of leaving them on screen
            if (
                !registrationData.available_classes ||
                registrationData.available_classes.length === 0
            ) {
                const emptyGrid = rescheduleForm
                    .querySelector(".trial-class_option-wapper")
                    ?.querySelector(".trial-class-grid-container")
                if (emptyGrid) {
                    mountTrialOptionsEmpty(emptyGrid)
                }
            }

            // Load available reschedule slots and render slot cards
            if (
                registrationData.available_classes &&
                registrationData.available_classes.length > 0
            ) {
                const rescheduleWrapper = rescheduleForm.querySelector(
                    ".trial-class_option-wapper",
                )
                const rescheduleGrid = rescheduleWrapper
                    ? rescheduleWrapper.querySelector(
                          ".trial-class-grid-container",
                      )
                    : null
                const rescheduleTemplate =
                    rescheduleForm.querySelector(".tc_option-label")

                if (rescheduleWrapper && rescheduleGrid && rescheduleTemplate) {
                    const updateRescheduleCardSelectionClass = (container) => {
                        if (!container) return

                        const optionLabels =
                            container.querySelectorAll(".tc_option-label")
                        optionLabels.forEach((optionLabel) => {
                            const infoContainer = optionLabel.querySelector(
                                ".trial-class-info-container",
                            )
                            const optionRadio = optionLabel.querySelector(
                                "input[type='radio']",
                            )

                            if (!infoContainer) return

                            if (optionRadio && optionRadio.checked) {
                                infoContainer.classList.add("tc_card-selected")
                            } else {
                                infoContainer.classList.remove(
                                    "tc_card-selected",
                                )
                            }
                        })
                    }

                    const rescheduleTemplateClone =
                        rescheduleTemplate.cloneNode(true)
                    rescheduleTemplate.remove()
                    const fragment = document.createDocumentFragment()

                    let firstRescheduleRadio = null

                    if (rescheduleGrid && registrationData.current_class) {
                        const currentClass = registrationData.current_class
                        registrationData.available_classes.unshift(currentClass)
                    }

                    registrationData.available_classes.forEach((item) => {
                        const clone = rescheduleTemplateClone.cloneNode(true)

                        const dateEl = clone.querySelector(".trial-class_date")
                        let shortDate = ""
                        if (dateEl) {
                            shortDate = trialDateText(item, "start_time", false)
                            dateEl.textContent = trialDateText(item, "start_time", true)
                        }

                        const timeEl = clone.querySelector(
                            ".trial-class_time-info",
                        )
                        if (timeEl) {
                            const start = trialClockText(item, "start_time")
                            const end = trialClockText(item, "end_time")
                            timeEl.textContent = `${start} - ${end} EST`
                        }

                        const gradeEl = clone.querySelector(
                            ".trial-class_grade-info",
                        )
                        if (gradeEl) {
                            gradeEl.textContent = `${item.grade_label}`
                        }

                        const radio = clone.querySelector("input[type='radio']")
                        if (radio) {
                            const uniqueId = "res-trial-class-" + item._id
                            radio.id = uniqueId
                            radio.value = item._id
                            radio.name = "res-trial-class"
                            if (shortDate) {
                                radio.dataset.trialDate = shortDate
                            }
                            clone
                                .querySelector("label")
                                ?.setAttribute("for", uniqueId)
                            radio.addEventListener("change", () => {
                                updateRescheduleCardSelectionClass(
                                    rescheduleGrid,
                                )
                                syncTrialClassDate(radio)
                            })

                            if (!firstRescheduleRadio) {
                                firstRescheduleRadio = radio
                            }
                        }

                        clone.addEventListener("click", function () {
                            const r = clone.querySelector("input[type='radio']")
                            if (r) r.checked = true
                            updateRescheduleCardSelectionClass(rescheduleGrid)
                            syncTrialClassDate(r)
                        })

                        fragment.appendChild(clone)
                    })

                    rescheduleGrid.appendChild(fragment)

                    if (firstRescheduleRadio) {
                        firstRescheduleRadio.checked = true
                        syncTrialClassDate(firstRescheduleRadio)
                    }
                    updateRescheduleCardSelectionClass(rescheduleGrid)
                }
            }

            // Prefill student fields
            const studentFirstName = rescheduleForm.querySelector(
                "#res_student_first_name",
            )
            if (studentFirstName) {
                studentFirstName.value = registration.student?.first_name || ""
            }

            const studentLastName = rescheduleForm.querySelector(
                "#res_student_last_name",
            )
            if (studentLastName) {
                studentLastName.value = registration.student?.last_name || ""
            }

            // Grade select: copy options from main form's grade select or fetch fresh
            const studentGrade =
                rescheduleForm.querySelector("#res_student_grade") ||
                rescheduleForm.querySelector(".trial-form-select-field")

            if (studentGrade && studentGrade.tagName === "SELECT") {
                if (gradeSelect && gradeSelect.options.length > 1) {
                    studentGrade.innerHTML = ""
                    Array.from(gradeSelect.options).forEach((opt) => {
                        const newOpt = document.createElement("option")
                        newOpt.value = opt.value
                        newOpt.textContent = opt.textContent
                        studentGrade.appendChild(newOpt)
                    })
                } else {
                    try {
                        const gradeRes = await fetch(
                            `${window.NSD_API.TRIAL_CLASS_API_BASE}/getGrades`,
                        )
                        const grades = await gradeRes.json()
                        studentGrade.innerHTML =
                            '<option value="">Select Grade</option>'
                        grades.forEach((g) => {
                            const option = document.createElement("option")
                            option.value = g.grade_name
                            option.textContent = g.grade_name
                            studentGrade.appendChild(option)
                        })
                    } catch (err) {
                        console.error(
                            "Error loading payment grades for reschedule form",
                            err,
                        )
                    }
                }
                if (registration.student?.grade) {
                    studentGrade.value = registration.student.grade
                }
            } else if (studentGrade && registration.student?.grade) {
                studentGrade.value = registration.student.grade
            }

            // Prefill parent fields
            const parentFirstName = rescheduleForm.querySelector(
                "#res_parent_first_name",
            )
            if (parentFirstName) {
                parentFirstName.value = registration.parent?.first_name || ""
            }

            const parentLastName = rescheduleForm.querySelector(
                "#res_parent_last_name",
            )
            if (parentLastName) {
                parentLastName.value = registration.parent?.last_name || ""
            }

            const parentEmail =
                rescheduleForm.querySelector("#res_parent_email")
            if (parentEmail) {
                parentEmail.value = registration.parent?.email || ""
            }

            const parentPhone =
                rescheduleForm.querySelector("#res_parent_phone")
            if (parentPhone) {
                parentPhone.value = registration.parent?.phone || ""
            }

            const previousExperience = rescheduleForm.querySelector(
                "#res_previous_experience",
            )
            if (previousExperience) {
                previousExperience.value =
                    registration.previous_experience || ""
            }

            const resStudentDescription =
                rescheduleForm.querySelector("#res_student_description") ||
                rescheduleForm.querySelector(
                    ".trial-form-student-desc-field",
                ) ||
                Array.from(rescheduleForm.querySelectorAll("textarea")).find(
                    (el) =>
                        `${el.id} ${el.name} ${el.getAttribute("data-name") || ""}`
                            .toLowerCase()
                            .includes("desc"),
                )

            if (resStudentDescription) {
                resStudentDescription.value =
                    registration.best_description || ""
            }

            // Setup interview card keyword logic for reschedule form
            const rescheduleFormScope =
                rescheduleForm.closest(".trial_class_form-container") ||
                rescheduleForm.parentElement ||
                rescheduleForm
            const rescheduleInterviewCardSetup =
                setupInterviewCardLogic(rescheduleFormScope)

            // Make all form fields read-only except class selection radios
            const allRescheduleInputs = rescheduleForm.querySelectorAll(
                "input, select, textarea",
            )
            allRescheduleInputs.forEach((el) => {
                if (el.tagName === "SELECT") {
                    el.disabled = true
                    return
                }

                if (el.type === "radio" || el.type === "checkbox") {
                    return
                }

                el.readOnly = true
            })

            // Disable Webflow default form handling for reschedule form
            rescheduleForm.setAttribute("action", "#")
            rescheduleForm.removeAttribute("data-wf-page-id")
            rescheduleForm.removeAttribute("data-wf-element-id")

            // Reschedule form success and error elements
            const rescheduleSuccessBox =
                document.getElementById(
                    "trial-class-res-form-success-submission",
                ) || rescheduleFormScope.querySelector(".tc_form-done")
            const rescheduleSuccessBoxNew =
                document.getElementById(
                    "trial-class-res-form-success-submission",
                ) || rescheduleFormScope.querySelector(".tc_form-done-new")
            const rescheduleSuccessWrapper =
                rescheduleSuccessBoxNew?.closest(".w-form-done")
            const rescheduleRegisteredDateEl =
                document.getElementById("res-registered-date") ||
                rescheduleSuccessBoxNew?.querySelector("#registered-date")
            const rescheduleFailBox =
                document.getElementById(
                    "trial-class-res-form-error-submission",
                ) || rescheduleFormScope.querySelector(".tc_form-fail")

            // Hide reschedule success and error states by default
            if (rescheduleSuccessBox)
                rescheduleSuccessBox.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
            if (rescheduleSuccessBoxNew)
                rescheduleSuccessBoxNew.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
            if (rescheduleSuccessWrapper)
                rescheduleSuccessWrapper.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
            if (rescheduleFailBox)
                rescheduleFailBox.style.setProperty(
                    "display",
                    "none",
                    "important",
                )

            if (rescheduleInterviewCardSetup) {
                rescheduleInterviewCardSetup.updateInterviewCardVisibility()
            }

            // Handle reschedule form submission
            rescheduleForm.addEventListener("submit", async function (e) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()

                if (rescheduleSuccessBox)
                    rescheduleSuccessBox.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                if (rescheduleSuccessBoxNew)
                    rescheduleSuccessBoxNew.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                if (rescheduleSuccessWrapper)
                    rescheduleSuccessWrapper.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                if (rescheduleFailBox)
                    rescheduleFailBox.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )

                const selectedRadio = rescheduleForm.querySelector(
                    "input[name='res-trial-class']:checked",
                )
                if (!selectedRadio) {
                    alert("Please select a trial class.")
                    return
                }

                syncTrialClassDate(selectedRadio)

                const payload = {
                    token: manageToken,
                    new_trial_class_id: selectedRadio.value,
                }

                const submitBtn = rescheduleForm.querySelector(
                    'input[type="submit"], button[type="submit"]',
                )
                setSubmitWaiting(submitBtn, true)

                try {
                    const response = await fetch(
                        `${window.NSD_API.TRIAL_CLASS_API_BASE}/trial-class/registration/reschedule`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        },
                    )

                    const data = await response.json()

                    if (!response.ok) {
                        const errorMessage =
                            data?.error ||
                            "Something went wrong. Please try again."

                        setSubmitWaiting(submitBtn, false)
                        rescheduleForm.style.setProperty(
                            "display",
                            "none",
                            "important",
                        )
                        if (rescheduleFailBox) {
                            rescheduleFailBox.textContent = errorMessage
                            rescheduleFailBox.style.setProperty(
                                "display",
                                "block",
                                "important",
                            )
                        }

                        return
                    }

                    // Success: hide form fields, show success box
                    showFormSuccessState({
                        formRoot: rescheduleForm,
                        successBoxNew: rescheduleSuccessBoxNew,
                        successWrapper: rescheduleSuccessWrapper,
                        failBox: rescheduleFailBox,
                        registeredDateEl: rescheduleRegisteredDateEl,
                    })
                } catch (err) {
                    setSubmitWaiting(submitBtn, false)
                    rescheduleForm.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )
                    if (rescheduleFailBox) {
                        rescheduleFailBox.textContent =
                            "Something went wrong. Please try again."
                        rescheduleFailBox.style.setProperty(
                            "display",
                            "block",
                            "important",
                        )
                    }
                }
            })
        }
    }
}

// Set up every part of the trial class page.
const setupNewTrialClass = () => {
    setupRadioCards()
    setupModalSteps()
    setupDebateOptions()
    setupContactUsForm()
    setupContactUsNavigation()
    setupTrialClassForms()
}

// Run setup once the page HTML is ready.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupNewTrialClass)
} else {
    setupNewTrialClass()
}

// Log messages sent to this page from embeds such as iframes.
window.addEventListener("message", (event) => {
  console.log("postMessage received:", {
    origin: event.origin,
    data: event.data
  });
});
