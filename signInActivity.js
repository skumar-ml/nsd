class SigninActivity {
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		//this.getNotificationData();
		this.getSignInData();
	}
	getSignInData(){
		
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getSignInDetail/"+this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			let responseText = JSON.parse(xhr.responseText);
			if(!responseText.isTodaySignIn){
				$this.InsertSignInData()
			}
		}
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
