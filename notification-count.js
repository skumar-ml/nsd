/*
Purpose: Shows a notification count badge beside the bell icon based on unread notifications.

Brief Logic: Fetches notification data from API and calculates unread count. Updates badge display with unread notification count.

Are there any dependent JS files: No
*/
class NotificationCount {
	// Initializes the notification count instance and fetches notification data
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getNotificationData();
	}
	// Displays the unread notification count badge next to the bell icon
	displayUnreadMessage(messageData){
		var notificationBudge = document.getElementsByClassName("notification-budge")[0];
		var notificationCount = document.getElementsByClassName("notification-count")[0];
		if(notificationCount){
			notificationCount.remove();
		}
		if(notificationBudge){
			var unreadMessage = messageData.filter(data => !data.is_read)
			var notificationMessage = creEl('span', 'notification-count');
			notificationMessage.innerHTML = unreadMessage.length;
			//notificationBudge.setAttribute('data-count', unreadMessage.length);
			notificationBudge.appendChild(notificationMessage)
		}
	}
	// Fetches notification data from the API and displays unread count
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
