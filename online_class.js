/*
Purpose: Online class schedule page that renders available classes per grade into tab panes with semester/term breakdowns.

Brief Logic: On page load, maps grade tab labels to their corresponding panes and preloads all grade data in parallel from the API. Each pane is rendered with semester/term cards containing course cards, schedule slots, prerequisite info, and register button links. Shows a skeleton loader while fetching and a "not found" state when no data is returned. Spot-warning badge is shown when available spots are 3 or fewer. Default active tab is set via jQuery on load.

Are there any dependent JS files: No
*/

document.addEventListener(
    "click",
    function (e) {
        const btn = e.target.closest(".oc-register-button")
        if (btn) {
            e.stopPropagation()
            e.stopImmediatePropagation()
        }
    },
    true,
)

const classesCache = {}

function toggleSkeleton(pane, show) {
    const wrapper = pane?.querySelector(".skeleton-wrapper")
    if (!wrapper) return

    const skeleton = wrapper.querySelector(".skeleton")
    const content = wrapper.querySelector(".online-class_semester-wrapper")
    const notFound = wrapper.querySelector(".oc-class-not-found")

    if (show) {
        content?.classList.add("hide")
        skeleton?.classList.remove("hide")
        notFound?.classList.remove("show")
    } else {
        skeleton?.classList.add("hide")
        content?.classList.remove("hide")
    }
}

function showNoRecordsState(pane) {
    const wrapper = pane?.querySelector(".skeleton-wrapper")
    if (!wrapper) return

    const skeleton = wrapper.querySelector(".skeleton")
    const notFound = wrapper.querySelector(".oc-class-not-found")
    const content = wrapper.querySelector(".online-class_semester-wrapper")

    skeleton?.classList.add("hide")
    content?.classList.add("hide")
    notFound?.classList.add("show")
}

document.addEventListener("DOMContentLoaded", async function () {
    const tabs = Array.from(document.querySelectorAll(".w-tab-link"))
    const panes = Array.from(document.querySelectorAll(".w-tab-pane"))

    panes.forEach((pane) => toggleSkeleton(pane, true))

    const gradePaneMap = {}
    tabs.forEach((tab, index) => {
        const grade = tab.textContent.trim()
        gradePaneMap[grade] = panes[index]
    })

    const grades = Object.keys(gradePaneMap)

    await preloadAllGrades(grades)

    grades.forEach((grade) => {
        const pane = gradePaneMap[grade]
        const result = classesCache[grade]

        renderPane(pane, result)
        toggleSkeleton(pane, false)
    })
})

async function preloadAllGrades(grades) {
    const baseURL = `${window.NSD_API.ONLINE_CLASS_API_BASE}/classes?session_id=fall&grade_id=`

    const requests = grades.map(async (grade) => {
        try {
            const res = await fetch(baseURL + encodeURIComponent(grade))

            if (!res.ok) {
                classesCache[grade] = null
                return
            }

            const result = await res.json()
            classesCache[grade] = result
        } catch (err) {
            console.error("Failed loading grade:", grade)
            classesCache[grade] = null
        }
    })

    await Promise.all(requests)
}

function renderPane(pane, result) {
    if (!pane) return

    let template = pane.querySelector(".oc-semester-name")

    while (template && !template.querySelector(".semester-inner")) {
        template = template.parentElement
    }
    if (!template) return
    template.style.display = "none"

    if (!result || !result.success) {
        toggleSkeleton(pane, false)
        showNoRecordsState(pane)
        return
    }

    const sessions = result.data?.[0]?.sessions ?? []
    const terms = sessions[0]?.terms ?? []
    if (!terms.length) return

    const container = template.parentElement
    const originalTemplate = template
    const paneFragment = document.createDocumentFragment()

    function formatDate(dateStr) {
        if (!dateStr) return ""
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
    }

    terms.forEach((term) => {
        const termClone = originalTemplate.cloneNode(true)
        termClone.style.display = "block"

        const nameEl = termClone.querySelector(".oc-semester-name")
        const dateEl = termClone.querySelector(".online-class_date-range")
        const descEl = termClone.querySelector(".semester-term-desc")
        const countEl = termClone.querySelector(".tc-class-count")
        const redBadge = termClone.querySelector(".online-class_red-badge")

        if (nameEl) nameEl.textContent = term.term_name || ""
        if (dateEl)
            dateEl.textContent = `${formatDate(term.start_date)} – ${formatDate(term.end_date)}`
        if (descEl) descEl.textContent = term.term_description || ""

        if (redBadge) {
            if (term.term_name === "Semester") {
                redBadge.classList.add("show")
            } else {
                redBadge.classList.remove("show")
            }
        }

        const classes = term.classes || []

        if (countEl) {
            countEl.textContent =
                classes.length === 1 ? "1 Class" : `${classes.length} Classes`
        }

        const cardContainer = termClone.querySelector(
            ".oc-course-card-container",
        )
        const cardTemplate = cardContainer?.querySelector(
            ".online-class_course-card",
        )

        if (!cardContainer || !cardTemplate) return

        cardTemplate.style.display = "none"
        const cardFragment = document.createDocumentFragment()

        classes.forEach((course) => {
            const card = cardTemplate.cloneNode(true)
            card.style.display = "block"

            const registerBtn = card.querySelector(".oc-register-button")
            if (registerBtn) {
                const url = new URL(registerBtn.href)
                url.searchParams.set(
                    "grade_id",
                    result.data?.[0]?.grade_id || "",
                )
                url.searchParams.set(
                    "grade_name",
                    result.data?.[0]?.gradeLabel || "",
                )
                url.searchParams.set(
                    "session_name",
                    sessions[0]?.session_name || "",
                )
                url.searchParams.set(
                    "session_detail_id",
                    term.session_detail_id || "",
                )
                url.searchParams.set(
                    "class_detail_id",
                    course.class_detail_id || "",
                )
                registerBtn.href = url.toString()
            }

            const titleEl = card.querySelector(".online-class_course-tittle")
            const descEl = card.querySelector(
                ".online-class_course-description p:last-child",
            )
            const feeEl = card.querySelector(".online-class_fee")

            if (titleEl)
                titleEl.textContent = course.className || "Untitled Course"
            if (descEl) descEl.textContent = course.description || ""
            if (feeEl)
                feeEl.textContent =
                    course.price != null ? `$${course.price}` : "—"

            const prereqEl = card.querySelector(".oc-pre-requisite-value")
            if (prereqEl) {
                const value = course?.prerequisite
                if (!value || value.trim?.() === "") {
                    prereqEl.textContent = "None"
                    prereqEl.classList.add("none-value")
                } else {
                    prereqEl.textContent = value
                    prereqEl.classList.remove("none-value")
                }
            }

            const schedules = course.schedules || []
            const sessionsGrid = card.querySelector(
                ".online-class_sessions-grid",
            )
            const slotTemplate = sessionsGrid?.querySelector(
                ".online-class_slot-card",
            )

            if (sessionsGrid && slotTemplate) {
                slotTemplate.style.display = "none"

                const scheduleFragment = document.createDocumentFragment()

                schedules.forEach((schedule) => {
                    const slot = slotTemplate.cloneNode(true)
                    slot.style.display = "block"

                    const timeEl = slot.querySelector(
                        ".online-class_session-time",
                    )
                    const spotsEl = slot.querySelector(".online-class_red-text")
                    const spotWrapper = slot.querySelector(
                        ".online-class_spot-wapper",
                    )

                    const shortDay = schedule.day?.slice(0, 3) || ""
                    const availableSpots = schedule.available_spots ?? 0

                    if (timeEl)
                        timeEl.textContent = `${shortDay} ${utcDateToEasternTime(schedule.start_time) || ""}`
                    if (spotsEl) spotsEl.textContent = availableSpots

                    if (spotWrapper) {
                        spotWrapper.style.display =
                            availableSpots <= 3 ? "flex" : "none"
                    }

                    scheduleFragment.appendChild(slot)
                })

                sessionsGrid.appendChild(scheduleFragment)
            }

            cardFragment.appendChild(card)
        })

        cardContainer.appendChild(cardFragment)
        paneFragment.appendChild(termClone)
    })

    container.appendChild(paneFragment)
    originalTemplate.remove()

    if (window.Webflow) {
        window.Webflow.require("ix2").init()
    }
}

// Remove default Webflow active tab and set the correct default tab
$(".w-tab-link").removeClass("w--current")
$(".w-tab-pane").removeClass("w--tab-active")
$("#tab-default").addClass("w--current")
$("#pane-default").addClass("w--tab-active")
