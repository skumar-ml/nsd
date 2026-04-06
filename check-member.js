/*
Purpose: Lightweight membership verifier that hits the checkMemberExist API and fills status fields.

Brief Logic: Calls checkMemberExist API to verify member existence across MongoDB, Memberstack, and Webflow. Updates status fields in UI based on verification results.

Are there any dependent JS files: No
*/
var AUTH_API_BASE = window.NSD_API.AUTH_API_BASE.replace(/\/$/, "")

class checkMember {
    // Initializes the checkMember instance and triggers member data verification
    constructor(webflowMemberId) {
        this.webflowMemberId = webflowMemberId
        this.checkMemberData()
    }
    // Fetches data from the specified URL endpoint
    async fetchData(url) {
        try {
            const response = await fetch(`${url}`)
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const data = await response.json()
            return data
        } catch (error) {
            console.error("Error fetching data:", error)
            return false
        }
    }
    // Checks member existence across different systems and updates status fields
    async checkMemberData() {
        var checkMember = await this.fetchData(
            AUTH_API_BASE + "/checkMemberExist/" + this.webflowMemberId,
        )
        if (checkMember) {
            var exists_in_memberstack = document.getElementById(
                "exists_in_memberstack",
            )
            var exists_in_mongodb = document.getElementById("exists_in_mongodb")
            var exists_in_webflow = document.getElementById("exists_in_webflow")
            // Some pages do not render these debug inputs; only set values when present.
            if (exists_in_memberstack) {
                exists_in_memberstack.value = checkMember.exists_in_memberstack
            }
            if (exists_in_mongodb) {
                exists_in_mongodb.value = checkMember.exists_in_mongodb
            }
            if (exists_in_webflow) {
                exists_in_webflow.value = checkMember.exists_in_webflow
            }
        }
    }
}
