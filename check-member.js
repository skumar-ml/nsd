class checkMember {
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.checkMemberData();
	}
	// Get API data with the help of endpoint
	async fetchData(url) {
		try {
			const response = await fetch(`${url}`);
			if (!response.ok) {
			throw new Error('Network response was not ok');
			}
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error fetching data:', error);
			return false;
		}
	}
	async checkMemberData(){
		var checkMember = await this.fetchData('https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/checkMemberExist/'+this.webflowMemberId)
		if(checkMember){
			var exists_in_memberstack = document.getElementById('exists_in_memberstack')
			var exists_in_mongodb = document.getElementById('exists_in_mongodb')
			var exists_in_webflow = document.getElementById('exists_in_webflow')
			exists_in_memberstack.value = checkMember.exists_in_memberstack
			exists_in_mongodb.value = checkMember.exists_in_mongodb
			exists_in_webflow.value = checkMember.exists_in_webflow
		}
	}
}

