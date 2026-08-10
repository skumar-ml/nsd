/*
Purpose: Forced parent phone-number capture modal for portal pages.

Brief Logic: Loads the logged-in member via getItemId. If (and only if) the
member is a parent with no phone number, shows the blocking modal. Overlay /
Escape cannot dismiss it. On Continue, POSTs updateMemberStack with only
leadId + newPhoneNo so the phone is updated without changing other fields.

Webflow HTML expected on the page:
  .phone-number-modal-container > .pn-m-overlay + .pnm-modal
  form#pnm-form with phone input (.pnm-inp) and Continue submit button

Webflow usage (after Memberstack, NSD_API, and getAuthToken are available):

```
<script src="…/parent-phone-modal.js"></script>
<script>
  new ParentPhoneModal({ memberId: MEMBER_ID })
</script>
```

Are there any dependent JS files: No (uses window.NSD_API.AUTH_API_BASE and
the site-header getAuthToken() / MemberStack.getToken() for Bearer auth)
*/
var AUTH_API_BASE = (window.NSD_API && window.NSD_API.AUTH_API_BASE
    ? window.NSD_API.AUTH_API_BASE
    : ""
).replace(/\/$/, "")

class ParentPhoneModal {
    /**
     * @param {{ memberId: string, containerSelector?: string }} data
     */
    constructor(data) {
        this.memberId = data && data.memberId
        this.containerSelector =
            (data && data.containerSelector) || ".phone-number-modal-container"
        this.container = document.querySelector(this.containerSelector)
        this.memberData = null
        this.isOpen = false
        this.isSubmitting = false

        // Always start hidden; only open when a parent is missing a phone.
        this.hideModal()

        if (!this.memberId) {
            console.error("[ParentPhoneModal] memberId is required")
            return
        }
        if (!this.container) {
            console.error(
                "[ParentPhoneModal] Modal container not found:",
                this.containerSelector,
            )
            return
        }
        if (!AUTH_API_BASE) {
            console.error("[ParentPhoneModal] window.NSD_API.AUTH_API_BASE missing")
            return
        }

        this.form = this.container.querySelector("#pnm-form")
        this.phoneInput =
            (this.form && this.form.querySelector(".pnm-inp")) ||
            (this.form && this.form.querySelector('input[type="text"]'))
        this.submitBtn =
            this.form &&
            this.form.querySelector('input[type="submit"], button[type="submit"]')
        this.overlay = this.container.querySelector(".pn-m-overlay")

        this.bindBlockingHandlers()
        this.init()
    }

    /**
     * Resolve Memberstack JWT for protected/dual-auth auth endpoints.
     * Prefers site-header getAuthToken(); falls back to MemberStack 1.0.
     * @returns {Promise<string>}
     */
    async getAuthToken() {
        if (typeof window.getAuthToken === "function") {
            const token = await window.getAuthToken()
            if (token) return token
        }
        if (window.MemberStack) {
            await window.MemberStack.onReady
            const token = await window.MemberStack.getToken()
            if (token) return token
        }
        throw new Error(
            "ParentPhoneModal: Memberstack token unavailable (is the member logged in?)",
        )
    }

    /**
     * Build Authorization (+ optional extra) headers for API calls.
     * @param {Record<string, string>} [extra]
     * @returns {Promise<Record<string, string>>}
     */
    async authHeaders(extra) {
        const token = await this.getAuthToken()
        return Object.assign({ Authorization: "Bearer " + token }, extra || {})
    }

    /**
     * Wire form submit + prevent dismissing the modal without a phone.
     */
    bindBlockingHandlers() {
        var $this = this

        // Overlay must not close the modal.
        if (this.overlay) {
            this.overlay.addEventListener("click", function (event) {
                event.preventDefault()
                event.stopPropagation()
            })
        }

        // Block Escape while the forced modal is open.
        document.addEventListener("keydown", function (event) {
            if (!$this.isOpen) return
            if (event.key === "Escape" || event.keyCode === 27) {
                event.preventDefault()
                event.stopPropagation()
            }
        })

        if (this.form) {
            this.form.addEventListener("submit", function (event) {
                // Stop Webflow's native form handling / navigation.
                event.preventDefault()
                event.stopPropagation()
                $this.handleSubmit()
            })
        }
    }

    /**
     * Fetch member profile and open the modal only for parents without a phone.
     */
    async init() {
        try {
            this.memberData = await this.fetchMemberProfile()
            if (this.shouldShowModal(this.memberData)) {
                this.showModal()
            }
        } catch (error) {
            console.error("[ParentPhoneModal] Failed to init:", error)
        }
    }

    /**
     * GET /auth/camp/getItemId/{memberId} — protected by Memberstack authorizer.
     * @returns {Promise<object>}
     */
    async fetchMemberProfile() {
        const headers = await this.authHeaders()
        const response = await fetch(
            AUTH_API_BASE + "/getItemId/" + encodeURIComponent(this.memberId),
            { method: "GET", headers: headers },
        )
        if (!response.ok) {
            throw new Error(
                "getItemId failed: " + response.status + " " + response.statusText,
            )
        }
        return response.json()
    }

    /**
     * Show only for parent accounts with a missing/blank phone number.
     * @param {object} member
     * @returns {boolean}
     */
    shouldShowModal(member) {
        if (!member || !member.id) return false
        var accountType = String(member.accountType || "").toLowerCase()
        if (accountType !== "parent") return false
        return !this.hasPhoneNumber(member.phoneNumber)
    }

    /**
     * @param {*} phone
     * @returns {boolean}
     */
    hasPhoneNumber(phone) {
        return String(phone == null ? "" : phone).trim().length > 0
    }

    /**
     * Basic phone check: at least 10 digits after stripping non-digits.
     * @param {string} value
     * @returns {boolean}
     */
    isValidPhone(value) {
        var digits = String(value || "").replace(/\D/g, "")
        return digits.length >= 10
    }

    showModal() {
        if (!this.container) return
        this.isOpen = true
        this.container.classList.add("show")
        this.container.style.display = "flex"
        this.container.setAttribute("aria-hidden", "false")
        document.body.style.overflow = "hidden"

        if (this.phoneInput) {
            // Focus after paint so the keyboard/caret lands in the field.
            setTimeout(
                function () {
                    this.phoneInput.focus()
                }.bind(this),
                50,
            )
        }
    }

    hideModal() {
        if (!this.container) return
        this.isOpen = false
        this.container.classList.remove("show")
        this.container.style.display = "none"
        this.container.setAttribute("aria-hidden", "true")
        document.body.style.overflow = ""
    }

    /**
     * Validate + POST phone-only update to updateMemberStack, then dismiss.
     */
    async handleSubmit() {
        if (this.isSubmitting) return

        var phone = this.phoneInput ? this.phoneInput.value.trim() : ""
        if (!this.isValidPhone(phone)) {
            alert("Please enter a valid phone number (at least 10 digits).")
            if (this.phoneInput) this.phoneInput.focus()
            return
        }

        if (!this.memberData || !this.memberData.id) {
            alert("Unable to update your profile. Please refresh and try again.")
            return
        }

        this.setSubmitting(true)

        try {
            // Phone-only payload: omitted fields keep their existing DB values.
            var payload = {
                leadId: this.memberData.id,
                newPhoneNo: phone,
            }
            var headers = await this.authHeaders({
                "Content-Type": "application/json",
            })
            var response = await fetch(AUTH_API_BASE + "/updateMemberStack", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(
                    "updateMemberStack failed: " +
                        response.status +
                        " " +
                        response.statusText,
                )
            }

            // Keep local copy in sync so a remount won't re-open immediately.
            this.memberData.phoneNumber = phone
            this.hideModal()
        } catch (error) {
            console.error("[ParentPhoneModal] Update failed:", error)
            alert(
                "Unable to save your phone number. Please try again or contact support.",
            )
            this.setSubmitting(false)
        }
    }

    /**
     * Toggle Continue button loading / disabled state.
     * @param {boolean} isSubmitting
     */
    setSubmitting(isSubmitting) {
        this.isSubmitting = isSubmitting
        if (!this.submitBtn) return

        if (isSubmitting) {
            if (!this.submitBtn.getAttribute("data-original-value")) {
                this.submitBtn.setAttribute(
                    "data-original-value",
                    this.submitBtn.value || this.submitBtn.innerHTML,
                )
            }
            var waitText =
                this.submitBtn.getAttribute("data-wait") || "Please wait..."
            if (this.submitBtn.tagName === "INPUT") {
                this.submitBtn.value = waitText
            } else {
                this.submitBtn.innerHTML = waitText
            }
            this.submitBtn.disabled = true
            this.submitBtn.style.pointerEvents = "none"
            this.submitBtn.style.opacity = "0.7"
        } else {
            var original = this.submitBtn.getAttribute("data-original-value")
            if (original) {
                if (this.submitBtn.tagName === "INPUT") {
                    this.submitBtn.value = original
                } else {
                    this.submitBtn.innerHTML = original
                }
            }
            this.submitBtn.disabled = false
            this.submitBtn.style.pointerEvents = "auto"
            this.submitBtn.style.opacity = "1"
        }
    }
}

// Expose for Webflow page embeds.
window.ParentPhoneModal = ParentPhoneModal
