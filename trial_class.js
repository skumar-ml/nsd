/*
Purpose: Trial class registration form with schedule selection, form submission, and manage/reschedule/cancel flows via token.

Brief Logic: On DOMContentLoaded, hides reschedule/registration views by default. Reads URL token first: with a manage token, shows a loader until registration details load, then shows the manage card or invalid-token message. Without a token, shows the registration form immediately; trial class slot cards and grade options load asynchronously (loaders and “Loading grades…” for SEO). If a manage token is present, fetches registration details and shows the registration card with prefilled student/parent info. Supports rescheduling (shows reschedule form with available slots) and cancellation via API calls. Handles success/error state display for both registration and reschedule form submissions.

Are there any dependent JS files: No
*/

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
                grid.innerHTML = ""
                const fragment = document.createDocumentFragment()

                classes.forEach((item) => {
                    const clone = templateClone.cloneNode(true)

                    const dateEl = clone.querySelector(".trial-class_date")
                    if (dateEl) {
                        const date = new Date(item.start_time)
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
                        clone
                            .querySelector("label")
                            ?.setAttribute("for", uniqueId)
                        radio.addEventListener("change", () =>
                            updateCardSelectionClass(grid),
                        )
                    }

                    clone.addEventListener("click", function () {
                        const r = clone.querySelector("input[type='radio']")
                        if (r) r.checked = true
                        updateCardSelectionClass(grid)
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

    const form = document.querySelector("#trial-class-form")
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

    const studentDescription = form.querySelector(
        ".trial-form-student-desc-field",
    )
    if (studentDescription) {
        studentDescription.value = studentDescription.value || ""
    }

    const successBox = document.querySelector(".tc_form-done")
    const failBox = document.querySelector(".tc_form-fail")

    if (successBox) successBox.style.setProperty("display", "none", "important")
    if (failBox) failBox.style.setProperty("display", "none", "important")

    form.setAttribute("action", "#")
    form.removeAttribute("data-wf-page-id")
    form.removeAttribute("data-wf-element-id")

    form.addEventListener("submit", async function (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        if (successBox)
            successBox.style.setProperty("display", "none", "important")
        if (failBox) failBox.style.setProperty("display", "none", "important")

        const selectedRadio = form.querySelector(
            "input[name='trial-class']:checked",
        )
        if (!selectedRadio) {
            alert("Please select a trial class.")
            return
        }

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

            // Success: hide form, show success box
            form.style.display = "none"

            setTimeout(() => {
                if (failBox)
                    failBox.style.setProperty("display", "none", "important")
                if (successBox)
                    successBox.style.setProperty(
                        "display",
                        "block",
                        "important",
                    )
            }, 50)

            form.reset()
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
                        if (dateEl) {
                            const date = new Date(item.start_time)
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
                            clone
                                .querySelector("label")
                                ?.setAttribute("for", uniqueId)
                            radio.addEventListener("change", () =>
                                updateRescheduleCardSelectionClass(
                                    rescheduleGrid,
                                ),
                            )

                            if (!firstRescheduleRadio) {
                                firstRescheduleRadio = radio
                            }
                        }

                        clone.addEventListener("click", function () {
                            const r = clone.querySelector("input[type='radio']")
                            if (r) r.checked = true
                            updateRescheduleCardSelectionClass(rescheduleGrid)
                        })

                        fragment.appendChild(clone)
                    })

                    rescheduleGrid.appendChild(fragment)

                    if (firstRescheduleRadio) {
                        firstRescheduleRadio.checked = true
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
                ) || rescheduleForm.querySelector(".tc_form-done")
            const rescheduleFailBox =
                document.getElementById(
                    "trial-class-res-form-error-submission",
                ) || rescheduleForm.querySelector(".tc_form-fail")

            if (rescheduleSuccessBox)
                rescheduleSuccessBox.style.setProperty(
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

                    // Success: hide form, show success box
                    rescheduleForm.style.setProperty(
                        "display",
                        "none",
                        "important",
                    )

                    setTimeout(() => {
                        if (rescheduleFailBox)
                            rescheduleFailBox.style.setProperty(
                                "display",
                                "none",
                                "important",
                            )
                        if (rescheduleSuccessBox)
                            rescheduleSuccessBox.style.setProperty(
                                "display",
                                "block",
                                "important",
                            )
                    }, 50)

                    rescheduleForm.reset()
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
