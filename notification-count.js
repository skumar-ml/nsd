class NotificationCount {
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getNotificationData();
	}
	displayUnreadMessage(messageData){
		var notificationBudge = document.getElementsByClassName("notification-budge")[0];
		var unreadMessage = messageData.filter(data => !data.is_read)
		//notificationBudge.innerHTML = unreadMessage.length;
		notificationBudge.setAttribute('data-count', unreadMessage.length)
		console.log('notificationBudge', notificationBudge)
	}
	getNotificationData(){
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getNotifications/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			let responseText =  JSON.parse(xhr.responseText);
			$this.displayUnreadMessage(responseText)
		}
	}
}
