/*
Purpose: Inserts a sign-in activity record into the database.

Brief Logic: Sends POST request to API with memberId to log sign-in activity. Tracks user login events for analytics and activity monitoring.

Are there any dependent JS files: nsd-auth.js (Bearer token for protected API)
*/
var AUTH_API_BASE = window.NSD_API.AUTH_API_BASE.replace(/\/$/, "")

class SigninActivity {
    // Initializes the SigninActivity instance and inserts sign-in activity data
    constructor(webflowMemberId) {
        this.webflowMemberId = webflowMemberId
        //this.getNotificationData();
        this.InsertSignInData()
    }
    // Inserts sign-in activity data into the database (protected: requires Memberstack JWT)
    InsertSignInData() {
        var data = {
            memberId: this.webflowMemberId,
        }
        var xhr = new XMLHttpRequest()
        var $this = this
        xhr.open("POST", AUTH_API_BASE + "/signinActivity", true)
        xhr.withCredentials = false
        // Attach Authorization: Bearer <token> before sending
        NSDAuth.authorizeXhr(xhr)
            .then(function () {
                xhr.send(JSON.stringify(data))
            })
            .catch(function (err) {
                console.error("signinActivity auth failed:", err)
            })
        xhr.onload = function () {
            let responseText = xhr.responseText
        }
    }
}
