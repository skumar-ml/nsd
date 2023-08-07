
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
		xhr.open("POST", "https://73u5k1iw5h.execute-api.us-east-1.amazonaws.com/prod/camp/signInActivity", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function() {
			let responseText = xhr.responseText;
			console.log('responseText', responseText)
		}
	}
}

