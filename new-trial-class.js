// Open and close the trial stepper popup modal.
document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.getElementById("dialog_trial_stepper");
  const openBtn = document.getElementById("dialog_trial_stepper_open_btn");
  const closeBtn = document.getElementById("dialog_trial_stepper_cls_btn");

  if (!dialog) return;

  // Open dialog
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      dialog.showModal();
    });
  }

  // Close dialog
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      dialog.close();
    });
  }
});


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

// Same keys the Acuity info-session embed reads: localStorage, then this page URL.
const CONTACT_US_TRACKING_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
]

const contactUsTracking = () => {
    const params = new URLSearchParams(window.location.search)
    const tracking = {}
    CONTACT_US_TRACKING_KEYS.forEach((key) => {
        tracking[key] = localStorage.getItem(key) || params.get(key) || ""
    })
    return tracking
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
            ...contactUsTracking(),
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
    document.getElementById("dialog_trial_stepper")?.close()

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

// Set up every part of the trial class page.
const setupNewTrialClass = () => {
    setupRadioCards()
    setupModalSteps()
    setupDebateOptions()
    setupContactUsForm()
    setupContactUsNavigation()
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
