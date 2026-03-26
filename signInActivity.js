/*
Purpose: Inserts a sign-in activity record into the database.

Brief Logic: Sends POST request to API with memberId to log sign-in activity. Tracks user login events for analytics and activity monitoring.

Are there any dependent JS files: No
*/
const API_BASE_URL = "https://aws.nsdebatecamp.com/";
const AUTH_API_BASE = API_BASE_URL + "auth/camp";

class SigninActivity {
	// Initializes the SigninActivity instance and inserts sign-in activity data
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		//this.getNotificationData();
		this.InsertSignInData();
	}
	// Inserts sign-in activity data into the database
	InsertSignInData(){
		var data = {
			 "memberId" : this.webflowMemberId
		}
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("POST", AUTH_API_BASE + "/signinActivity", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function() {
			let responseText = xhr.responseText;
		}
	}
}
