/*
Purpose: Inserts a sign-in activity record into the database.

Brief Logic: Sends POST request to API with memberId to log sign-in activity. Tracks user login events for analytics and activity monitoring.

Are there any dependent JS files: No
*/
class SigninActivity {
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		//this.getNotificationData();
		this.InsertSignInData();
	}
	InsertSignInData(){
		var data = {
			 "memberId" : this.webflowMemberId
		}
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/signinActivity", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function() {
			let responseText = xhr.responseText;
		}
	}
}
