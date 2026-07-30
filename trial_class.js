/*
Purpose: Trial class registration form with schedule selection, form submission, and manage/reschedule/cancel flows via token.

Brief Logic: On DOMContentLoaded, hides reschedule/registration views by default. Reads URL token first: with a manage token, shows a loader until registration details load, then shows the manage card or invalid-token message. Without a token, shows the registration form immediately; trial class slot cards and grade options load asynchronously (loaders and “Loading grades…” for SEO). If a manage token is present, fetches registration details and shows the registration card with prefilled student/parent info. Supports rescheduling (shows reschedule form with available slots) and cancellation via API calls. Handles success/error state display for both registration and reschedule form submissions.

Are there any dependent JS files: No
*/

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

// Resolve actual form element inside a wrapper root
const getTrialClassFormEl = (root) => {
    if (!root) return null
    if (root.matches("form")) return root
    return root.querySelector("form") || root
}

// Clear trial class form fields while preserving submit button label
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

document.addEventListener("DOMContentLoaded", async function () {
    // Parse URL for manage registration token
    const urlParams = new URLSearchParams(window.location.search)
    const manageToken = urlParams.get("token")

    // By default hide all the form containers
    const trialClassFormContainer = document.querySelector(
        ".trial_class_form-container",
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

    // Show tab section, select tab, and scroll into view
    const showTabSection = (tabIndex = 0) => {
        if (!tabSection) return

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

    // Back button: hide tab section, restore hero card container
    const tabBackButton = document.getElementById("tab-back-button")
    if (tabBackButton) {
        tabBackButton.addEventListener("click", (e) => {
            e.preventDefault()
            if (tabSection) {
                tabSection.style.setProperty("display", "none", "important")
            }
            if (cardContainer) {
                cardContainer.style.removeProperty("display")
                cardContainer.style.setProperty("display", "block", "important")
            }
        })
    }

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
                        const date = new Date(item.start_time)
                        shortDate = date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })
                        dateEl.textContent = date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                        })
                    }

                    const timeEl = clone.querySelector(".trial-class_time-info")
                    if (timeEl) {
                        const start = utcDateToEasternTime(item.start_time)
                        const end = utcDateToEasternTime(item.end_time)
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

    // Success and error message elements for registration form
    const successBox = document.querySelector(".tc_form-done")
    const successBoxNew =
        document.querySelector("#trial-class-form-success-submission") ||
        document.querySelector(".tc_form-done-new")
    const successWrapper = successBoxNew?.closest(".w-form-done")
    const failBox = document.querySelector(".tc_form-fail")

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
        showTabSection(1)
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
            landingURL: getLandingURL(),
        }

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
        const formContainer = document.querySelector(
            ".trial_class_form-container",
        )
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
                    const start = new Date(currentClass.start_time)
                    const datePart = start.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    })
                    const startTime = utcDateToEasternTime(
                        currentClass.start_time,
                    )
                    const endTime = utcDateToEasternTime(currentClass.end_time)
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

                confirmCancelBtn.disabled = true

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
                        const doneCard = document.querySelector(
                            ".tc_registration-cancelled-card",
                        )
                        if (cancelInfoCard) {
                            cancelInfoCard.style.setProperty(
                                "display",
                                "none",
                                "important",
                            )
                        }
                        if (doneCard) {
                            doneCard.style.removeProperty("display")
                            doneCard.style.setProperty(
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
                    })
                    .finally(() => {
                        confirmCancelBtn.disabled = false
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
                            const date = new Date(item.start_time)
                            shortDate = date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })
                            dateEl.textContent = date.toLocaleDateString(
                                "en-US",
                                {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                },
                            )
                        }

                        const timeEl = clone.querySelector(
                            ".trial-class_time-info",
                        )
                        if (timeEl) {
                            const start = utcDateToEasternTime(item.start_time)
                            const end = utcDateToEasternTime(item.end_time)
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
})
