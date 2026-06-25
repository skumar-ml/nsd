/*
Purpose: Trial class registration form with schedule selection, form submission, and manage/reschedule/cancel flows via token.

Brief Logic: On DOMContentLoaded, hides reschedule/registration views by default. Reads URL token first: with a manage token, shows a loader until registration details load, then shows the manage card or invalid-token message. Without a token, shows the registration form immediately; trial class slot cards and grade options load asynchronously (loaders and “Loading grades…” for SEO). If a manage token is present, fetches registration details and shows the registration card with prefilled student/parent info. Supports rescheduling (shows reschedule form with available slots) and cancellation via API calls. Handles success/error state display for both registration and reschedule form submissions.

Are there any dependent JS files: No
*/

window.trial_class_date = ""

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

const renderRegisteredDate = (registeredDateEl) => {
    const el =
        registeredDateEl ||
        document.getElementById("registered-date") ||
        document.getElementById("res-registered-date")
    if (!el || !window.trial_class_date) return

    el.textContent = `You're registered for the ${window.trial_class_date} trial class!`
}

const getTrialClassFormRoot = () =>
    document.querySelector("#trial-class-form") ||
    document.querySelector("#wf-form-trial-class-form")

const getRescheduleFormRoot = () =>
    document.querySelector("#trial-class-reschdule-form")

const getTrialClassFormEl = (root) => {
    if (!root) return null
    if (root.matches("form")) return root
    return root.querySelector("form") || root
}

const clearTrialClassFormFields = (root) => {
    if (!root) return

    const formEl = getTrialClassFormEl(root)
    if (formEl?.reset) {
        formEl.reset()
    }

    root.querySelectorAll("input, select, textarea").forEach((field) => {
        const type = field.type

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
}

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

        if (studentDescription.value.length <= 100) {
            state.dismissed = false
        }

        if (studentDescription.value.length > 100 && !state.dismissed) {
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

    const rescheduleForm = document.querySelector("#trial-class-reschdule-form")
    if (rescheduleForm) {
        rescheduleForm.style.setProperty("display", "none", "important")
    }

    const registrationCard = document.querySelector(".tc_registration-card")
    if (registrationCard) {
        registrationCard.style.setProperty("display", "none", "important")
    }

    const tabSection = document.querySelector(".tc_tab-section")
    if (tabSection) {
        tabSection.style.setProperty("display", "none", "important")
    }

    const MOBILE_BREAKPOINT = 991
    const mobileCardIds = ["trial_class_card", "book_card", "book_placement"]
    const mobileCardVisibility = {
        0: { show: "trial_class_card", hide: ["book_card", "book_placement"] },
        1: { show: "book_card", hide: ["book_placement", "trial_class_card"] },
        2: { show: "book_placement", hide: ["trial_class_card", "book_card"] },
    }

    const isMobileView = () => window.innerWidth <= MOBILE_BREAKPOINT

    const setCardDisplay = (id, display) => {
        const el = document.getElementById(id)
        if (!el) return

        if (display === "none") {
            el.style.setProperty("display", "none", "important")
        } else {
            el.style.removeProperty("display")
            el.style.setProperty("display", "block", "important")
        }
    }

    const resetMobileCards = () => {
        mobileCardIds.forEach((id) => {
            const el = document.getElementById(id)
            if (el) el.style.removeProperty("display")
        })
    }

    const getActiveTabIndex = () => {
        if (!tabSection) return -1

        const tabButtons = tabSection.querySelectorAll(
            ".tc-tab-menu .tc-tab-button, .tc-tab-menu .w-tab-link",
        )
        return Array.from(tabButtons).findIndex((btn) =>
            btn.classList.contains("w--current"),
        )
    }

    const updateMobileCards = (tabIndex) => {
        if (!isMobileView()) {
            resetMobileCards()
            return
        }

        const config = mobileCardVisibility[tabIndex]
        if (!config) return

        config.hide.forEach((id) => setCardDisplay(id, "none"))
        setCardDisplay(config.show, "block")
    }

    const heroCardBorderMap = {
        0: {
            active: "trial_class_card",
            inactive: ["book_card", "book_placement"],
        },
        1: {
            active: "book_card",
            inactive: ["trial_class_card", "book_placement"],
        },
        2: {
            active: "book_placement",
            inactive: ["trial_class_card", "book_card"],
        },
    }

    const updateHeroCardBorders = (tabIndex) => {
        const config = heroCardBorderMap[tabIndex]
        if (!config) return

        document.getElementById(config.active)?.classList.remove("gray-border")
        config.inactive.forEach((id) => {
            document.getElementById(id)?.classList.add("gray-border")
        })
    }

    const showTabSection = (tabIndex = 0) => {
        if (!tabSection) return

        tabSection.style.removeProperty("display")
        tabSection.style.setProperty("display", "block", "important")

        const tabButtons = tabSection.querySelectorAll(
            ".tc-tab-menu .tc-tab-button, .tc-tab-menu .w-tab-link",
        )
        const targetTab = tabButtons[tabIndex]
        if (targetTab) {
            targetTab.click()
        }

        updateHeroCardBorders(tabIndex)
        updateMobileCards(tabIndex)
        tabSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const bindTabSectionTrigger = (selector, tabIndex) => {
        document.querySelectorAll(selector).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault()
                showTabSection(tabIndex)
            })
        })
    }

    if (tabSection) {
        const tabButtons = tabSection.querySelectorAll(
            ".tc-tab-menu .tc-tab-button, .tc-tab-menu .w-tab-link",
        )
        tabButtons.forEach((btn, index) => {
            btn.addEventListener("click", () => {
                updateHeroCardBorders(index)
                updateMobileCards(index)
            })
        })
    }

    window.addEventListener("resize", () => {
        if (!isMobileView()) {
            resetMobileCards()
            return
        }

        const activeTabIndex = getActiveTabIndex()
        if (activeTabIndex >= 0) {
            updateMobileCards(activeTabIndex)
        }
    })

    document.querySelectorAll(".tc_register-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault()
            showTabSection(0)
        })
    })
    bindTabSectionTrigger(".tc_book-btn", 1)
    bindTabSectionTrigger(".tc_book-placement-btn", 2)
    bindTabSectionTrigger(".tc_interview-card .tc_button-blue", 2)
    bindTabSectionTrigger("#back-discovery-tab", 1)
    bindTabSectionTrigger(".tc_form-done-new .tc_button-blue-rounded", 2)

    const wrapper = document.querySelector(".trial-class_option-wapper")
    const grid = wrapper
        ? wrapper.querySelector(".trial-class-grid-container")
        : null
    const template = document.querySelector(".tc_option-label")

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

    if (!manageToken && trialClassFormContainer) {
        trialClassFormContainer.style.removeProperty("display")
        trialClassFormContainer.style.setProperty(
            "display",
            "block",
            "important",
        )
    }

    const form = getTrialClassFormRoot()
    if (!form) return

    // Grade dropdown list (async; independent of slot cards)
    const gradeSelect = form.querySelector(".trial-form-select-field")

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

    const mainFormScope =
        form.closest(".trial_class_form-container") || form
    const mainInterviewCardSetup = setupInterviewCardLogic(mainFormScope)
    const studentDescription =
        form.querySelector("#Student-Description") ||
        form.querySelector(".trial-form-student-desc-field")

    if (studentDescription) {
        studentDescription.value = studentDescription.value || ""
    }

    const successBox = document.querySelector(".tc_form-done")
    const successBoxNew =
        document.querySelector("#trial-class-form-success-submission") ||
        document.querySelector(".tc_form-done-new")
    const successWrapper = successBoxNew?.closest(".w-form-done")
    const failBox = document.querySelector(".tc_form-fail")

    if (successBox) successBox.style.setProperty("display", "none", "important")
    if (successBoxNew)
        successBoxNew.style.setProperty("display", "none", "important")
    if (successWrapper)
        successWrapper.style.setProperty("display", "none", "important")
    if (failBox) failBox.style.setProperty("display", "none", "important")

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
        showTabSection(0)
    }

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

    // Manage registration view when token is present in the URL
    let registrationData = null

    if (manageToken) {
        const manageLoaderEl = mountManageRegistrationLoader()

        const formContainer = document.querySelector(
            ".trial_class_form-container",
        )
        const rescheduleForm = document.querySelector(
            "#trial-class-reschdule-form",
        )

        const apiUrl = `${window.NSD_API.TRIAL_CLASS_API_BASE}/trial-class/registration/manage?token=${encodeURIComponent(manageToken)}`

        try {
            const res = await fetch(apiUrl)
            if (!res.ok) {
                throw new Error("Failed to fetch registration details")
            }
            const data = await res.json()
            registrationData = data
        } catch (err) {
            console.error("Error loading trial class registration", err)
            registrationData = null
        } finally {
            if (manageLoaderEl.parentNode) {
                manageLoaderEl.remove()
            }
        }

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

        // Show registration card; hide main form and reschedule form
        if (registrationCard) {
            registrationCard.style.setProperty("display", "block", "important")
        }
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

        // Reschedule button: show reschedule form, hide registration card
        const rescheduleBtn = document.querySelector(".tc_reschedule-btn")
        if (rescheduleBtn && registrationCard && rescheduleForm) {
            rescheduleBtn.addEventListener("click", function () {
                registrationCard.style.setProperty(
                    "display",
                    "none",
                    "important",
                )
                rescheduleForm.style.removeProperty("display")
                rescheduleForm.style.setProperty(
                    "display",
                    "block",
                    "important",
                )

                const firstVisibleRescheduleRadio =
                    rescheduleForm.querySelector(
                        "input[name='res-trial-class']",
                    )
                if (firstVisibleRescheduleRadio) {
                    firstVisibleRescheduleRadio.checked = true
                }
            })
        }

        // Cancel Registration button
        const cancelBtn =
            document.querySelector(".tc_cancel-registration-btn") ||
            document.querySelector(".tc_cancel-btn")

        if (cancelBtn) {
            cancelBtn.addEventListener("click", function () {
                const cancelUrl = `${window.NSD_API.TRIAL_CLASS_API_BASE}/trial-class/registration/cancel`

                cancelBtn.disabled = true

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
                        const infoCard = document.querySelector(
                            ".tc_cancel-registration-info-card",
                        )
                        const doneCard = document.querySelector(
                            ".tc_registration-cancelled-card",
                        )
                        if (infoCard) {
                            infoCard.style.setProperty(
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
                        cancelBtn.disabled = false
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

            const resStudentDescription = rescheduleForm.querySelector(
                "#res_student_description",
            )
            if (resStudentDescription) {
                resStudentDescription.value =
                    registration.best_description || ""
            }

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

            rescheduleForm.setAttribute("action", "#")
            rescheduleForm.removeAttribute("data-wf-page-id")
            rescheduleForm.removeAttribute("data-wf-element-id")

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
