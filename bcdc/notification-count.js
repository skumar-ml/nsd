class NotificationCount {
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getNotificationData();
	}
	displayUnreadMessage(messageData){
		var notificationBudge = document.getElementsByClassName("notification-budge")[0];
		var notificationCount = document.getElementsByClassName("notification-count")[0];
		if(notificationBudge){
			if(notificationCount){
				notificationCount.remove();
			}
			var unreadMessage = messageData.filter(data => !data.is_read)
			var notificationMessage = creEl('span', 'notification-count');
			notificationMessage.innerHTML = unreadMessage.length;
			//notificationBudge.setAttribute('data-count', unreadMessage.length);
			notificationBudge.appendChild(notificationMessage)
		}
	}
	getNotificationData(){
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://73u5k1iw5h.execute-api.us-east-1.amazonaws.com/prod/camp/getNotifications/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			let responseText =  JSON.parse(xhr.responseText);
			$this.displayUnreadMessage(responseText)
		}
	}
}
