class PollingNotificationCount {
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getPollingData();
	}
	
	/*Polling Data*/
	displayUnreadPolling(messageData){
		var pollingBudge = document.getElementsByClassName("polling-budge")[0];
		var pollingCount = document.getElementsByClassName("polling-count")[0];
		if(pollingCount){
			pollingCount.remove();
		}
		var unreadPolling = this.messageData.filter(data => !data.submissionId)
		var notificationPolling = creEl('span', 'polling-count');
		notificationPolling.innerHTML = unreadPolling.length;
		pollingBudge.appendChild(notificationPolling)
	}
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

(function() {
    new PollingNotificationCount(webflowMemberId)
})();