/*
Purpose: Fetches polling assignments and updates the unread polling counter badge.

Brief Logic: Fetches polling data from API and calculates unread count. Updates badge display with unread polling assignment count.

Are there any dependent JS files: No
*/
class PollingNotificationCount {
	// Initializes the polling notification count instance and fetches polling data
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getPollingData();
	}
	
	// Displays the unread polling assignment count badge
	displayUnreadPolling(messageData){
		var pollingBudge = document.getElementsByClassName("polling-budge")[0];
		var pollingCount = document.getElementsByClassName("polling-count")[0];
		if(pollingCount){
			pollingCount.remove();
		}
		var unreadPolling = messageData.filter(data => !data.submissionId)
		var notificationPolling = creEl('span', 'polling-count');
		notificationPolling.innerHTML = unreadPolling.length;
		pollingBudge.appendChild(notificationPolling)
	}
	// Fetches polling data from the API and displays unread polling count
	getPollingData(){
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getPollingDetails/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			let responseText =  JSON.parse(xhr.responseText);
			$this.displayUnreadPolling(responseText)
		}
	}
}

