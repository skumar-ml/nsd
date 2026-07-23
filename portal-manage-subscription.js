/*
Purpose: Wires the portal "Manage subscription" button (#brief-subs-btn) to the
payment-service createBillingPortalSession API. On click it mints a Stripe
Billing Portal session for the logged-in member and redirects the browser to it,
where the parent can manage / cancel their NSD Briefs subscription.

Are there any dependent JS files: No (expects window.NSD_API.PAYMENT_API_BASE,
same as the other portal scripts). Member context (memberId + accountEmail) is
passed in by the Webflow page embed, exactly like NSDPortal / BriefManager.

Usage (in the portal dashboard Webflow page embed, where member data is in scope):

    initManageSubscriptionButton({
        memberId: MEMBER_ID,          // same value passed to NSDPortal
        accountEmail: ACCOUNT_EMAIL,  // same value passed to NSDPortal
        // buttonId: "brief-subs-btn",   // optional (default)
        // returnUrl: window.location.href // optional (where Stripe returns)
    })
*/

var PAYMENT_API_BASE = window.NSD_API.PAYMENT_API_BASE

/**
 * Bind the click handler to the manage-subscription button.
 * @param {{memberId?:string, accountEmail?:string, buttonId?:string, returnUrl?:string}} options
 */
function initManageSubscriptionButton(options) {
    options = options || {}
    var buttonId = options.buttonId || "brief-subs-btn"
    var button = document.getElementById(buttonId)

    if (!button) {
        console.warn(
            "[ManageSubscription] Button #" + buttonId + " not found on the page.",
        )
        return
    }

    button.addEventListener("click", function (event) {
        event.preventDefault()
        openBillingPortal(options, button)
    })
}

/**
 * Resolve the logged-in member's id + email.
 * Prefers values passed in by the page; falls back to checkout data in
 * localStorage so the button still works if the embed didn't pass them.
 */
function resolveMemberContext(options) {
    var memberId = options.memberId
    var email = options.accountEmail || options.email

    if (!memberId || !email) {
        try {
            var basic = JSON.parse(
                localStorage.getItem("checkOutBasicData") || "{}",
            )
            memberId = memberId || basic.memberId || basic.webflowMemberId
            email = email || basic.accountEmail || basic.email
        } catch (e) {
            /* ignore malformed localStorage */
        }
    }

    return { memberId: memberId, email: email }
}

/**
 * Call createBillingPortalSession and redirect to the returned Stripe URL.
 */
async function openBillingPortal(options, button) {
    var ctx = resolveMemberContext(options)

    if (!ctx.memberId) {
        console.error("[ManageSubscription] Missing memberId; cannot open portal.")
        alert("We couldn't load your account. Please refresh and try again.")
        return
    }

    // Loading state
    var originalText = button.innerHTML
    button.setAttribute("data-original-text", originalText)
    button.innerHTML = "Loading…"
    button.style.pointerEvents = "none"

    try {
        var response = await fetch(
            PAYMENT_API_BASE + "/createBillingPortalSession",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberId: ctx.memberId,
                    email: ctx.email || "",
                    returnUrl: options.returnUrl || window.location.href,
                }),
            },
        )

        var data = await response.json()

        if (response.ok && data.success && data.url) {
            // Redirect to the Stripe Billing Portal
            window.location.href = data.url
            return
        }

        if (response.status === 404) {
            alert("No active subscription was found for your account.")
        } else {
            alert("Something went wrong opening the billing portal. Please try again.")
        }
        console.error("[ManageSubscription] API error:", response.status, data)
    } catch (error) {
        console.error("[ManageSubscription] Request failed:", error)
        alert("An error occurred. Please try again.")
    } finally {
        // Restore the button (only reached if we didn't redirect)
        button.innerHTML = button.getAttribute("data-original-text") || originalText
        button.style.pointerEvents = "auto"
    }
}
