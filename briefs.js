/*
Purpose: Renders the view-briefs card grid from getBriefDetails.

Brief Logic: On DOMContentLoaded, fetches briefs from the portal API, sorts by
created_at (earliest to latest), renders cards, and wires Preview buttons to the PDF modal.

getBriefDetails is public (SEC-23) — no Memberstack token required. Works on
marketing / browse pages for logged-out visitors.

Webflow usage:

```
<script src="…/briefs.js"></script>
```

Are there any dependent JS files: No (expects window.NSD_API.PORTAL_API_BASE)
*/
document.addEventListener("DOMContentLoaded", function () {
    /* Briefs cards data fetch logic */
    class Briefs {
        constructor(data) {
            this.data = data
            this.selectedBriefs = []
            this.modal = document.getElementById("briefs-preview-modal")
            this.iframe = document.getElementById("preview-frame")
            this.closeBtn = document.getElementById("close-preview")

            // Spinner reference
            this.spinner = document.getElementById("half-circle-spinner")

            this.getBriefs()
            this.addCloseModalHandler()
        }

        addCloseModalHandler() {
            if (this.closeBtn) {
                this.closeBtn.addEventListener("click", () => {
                    this.modal.style.display = "none"
                    this.iframe.src = ""
                })
            }
        }

        showLoading() {
            if (this.spinner) {
                this.spinner.style.display = "block"
                this.spinner.parentElement.style.display = "block" // show parent container too
            }
        }

        hideLoading() {
            if (this.spinner) {
                this.spinner.style.display = "none"
            }
        }

        // Public catalog endpoint — no Authorization header (SEC-23)
        async fetchData(endpoint, memberId = null) {
            try {
                const normalizedEndpoint = String(endpoint).replace(/^\/+/, "")
                let url = `${this.data.apiBaseURL}/${normalizedEndpoint}`
                if (memberId) {
                    url = `${this.data.apiBaseURL}/${normalizedEndpoint}/${memberId}`
                }

                const response = await fetch(url)
                if (!response.ok) throw new Error("Network response was not ok")

                const apiData = await response.json()
                return apiData
            } catch (error) {
                console.error("Briefs fetchData error:", error)
                return null
            }
        }

        async getBriefs() {
            this.showLoading() // show spinner before API
            try {
                const response = await this.fetchData("getBriefDetails")
                if (response && response.briefs) {
                    if (response.briefs.length === 0) {
                        this.showError("No briefs are currently available.")
                    } else {
                        this.renderBriefs(response.briefs)
                        this.attachPreviewHandlers(response.briefs)
                    }
                } else {
                    this.showError(
                        "Unable to load briefs. Please try again later.",
                    )
                }
            } catch (error) {
                this.showError(
                    "Network error. Please check your connection and try again.",
                )
            } finally {
                this.hideLoading() // hide spinner after API
            }
        }

        renderBriefs(briefs) {
            const container = document.querySelector(
                ".view-briefs-cards-container .view-briefs-inner-flex",
            )
            if (!container) {
                console.error("Div not found")
                return
            }

            container.innerHTML = ""

            const createdAtMs = (brief) => {
                const raw = brief.created_at
                if (!raw) return 0
                const parsed = Date.parse(String(raw).replace(" ", "T"))
                return Number.isNaN(parsed) ? 0 : parsed
            }

            const sortedBriefs = briefs.sort(
                (a, b) => createdAtMs(a) - createdAtMs(b),
            )

            sortedBriefs.forEach((brief) => {
                const briefCard = this.createBriefCard(brief, false)
                container.appendChild(briefCard)
            })
        }

        createBriefCard(brief, isSelected = false) {
            const card = document.createElement("div")
            card.className = `brief-card-info`
            card.dataset.briefId = brief.briefId

            card.innerHTML = `
        <div class="pdf-brief-flex-wrapper">
          <p class="pdf-briefs-title">${brief.title}<br /></p>
          <img src="https://cdn.prod.website-files.com/6271a4bf060d543533060f47/688c7c07e7e21bc1cfcce250_pdf-brief.svg" loading="lazy" alt="" class="pdf-brief-icon" />
        </div>
        <p class="pdf-brief-text-medium">${brief.description}<br /></p>
        <p class="pdf-brief-text-small">Topic: ${brief.topic}<br /></p>
        <div class="view-pdf-brief-price-flex-wrapper"> 
          <p class="pdf-brief-price">$${parseFloat(brief.price).toFixed(2)}<br /></p>
          <a href="#" data-brief-id="${brief.briefId}" class="main-button briefs-preview-btn w-button">Preview</a>
        </div>
      `

            if (isSelected) {
                this.selectedBriefs.push(brief.briefId)
            }

            return card
        }

        attachPreviewHandlers(briefs) {
            document
                .querySelectorAll(".briefs-preview-btn")
                .forEach((button) => {
                    button.addEventListener("click", async (e) => {
                        e.preventDefault()

                        const briefId = button.dataset.briefId
                        const brief = briefs.find((b) => b.briefId == briefId)

                        if (!brief) return

                        const originalText = button.textContent

                        // show spinner while PDF is loading
                        this.showLoading()

                        if (brief.preview_pdf_url) {
                            this.modal.style.display = "flex"
                            this.iframe.src = brief.preview_pdf_url

                            this.iframe.onload = () => {
                                button.textContent = originalText
                                button.disabled = false
                                this.hideLoading() // hide spinner after PDF loads
                            }
                        } else {
                            button.textContent = "Not Available"
                            setTimeout(() => {
                                button.textContent = originalText
                                button.disabled = false
                                this.hideLoading() // hide spinner if not available
                            }, 2000)
                        }
                    })
                })
        }

        showError(message) {
            alert(message) // Replace with your custom UI error message
        }
    }

    new Briefs({
        apiBaseURL: window.NSD_API.PORTAL_API_BASE,
    })
})
