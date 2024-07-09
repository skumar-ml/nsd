async function coachResources(coachCampId, memberId) {

  const coachResourceGrid = document.getElementById('coach-resource-grid');
  const coachCampText = document.getElementById('coach-service');
  
  var scheduleLink = "#"
  // Texas PF
  if (coachCampId === "1") {
    coachCampText.textContent = "Texas PF";
    scheduleLink = "https://calendar.google.com/calendar/u/1/embed?src=texaspf@nsdebatecamp.com&ctz=America/Chicago&csspa=1";
  }
  // Texas LD
  else if (coachCampId === "2") {
    coachCampText.textContent = "Texas LD";
    scheduleLink = "https://calendar.google.com/calendar/embed?src=66f1fdbfd5235514cb5f1c1faf0a1d3c3066eb0b8efb64d6ae44c65ad0ed0b20%40group.calendar.google.com&ctz=America%2FChicago";
  }
  // Philadelphia PF Session 1
  else if (coachCampId === "15") {
    coachCampText.textContent = "Philadelphia PF Session 1";
    scheduleLink = "https://calendar.google.com/calendar/embed?src=287e33ec1e3bf1ccea3e84481a3d594eb3d5906f177b7967993013b497f8dd29%40group.calendar.google.com&ctz=America%2FIndiana%2FIndianapolis";
  }
  // Philadelphia LD
  else if (coachCampId === "4") {
    coachCampText.textContent = "Philadelphia LD";
    scheduleLink = "https://calendar.google.com/calendar/u/0/embed?src=5aec18b59661c93db59df9117e1072349a00a1edc519a62e2548ec42d070db92@group.calendar.google.com&ctz=America/New_York";
  }
  // Minnesota LD
  else if (coachCampId === "5") {
    coachCampText.textContent = "Minnesota LD";
    scheduleLink = "https://docs.google.com/spreadsheets/d/1xCvxFXme9stRzbYbpJ0HBciOOq4dNqkXMILz9POa00w/edit?usp=sharing";
  } 
  // Philadelphia PF Session 2
  else if (coachCampId === "3") {
    coachCampText.textContent = "Philadelphia PF Session 2";
    // scheduleLink = "https://docs.google.com/spreadsheets/d/1xCvxFXme9stRzbYbpJ0HBciOOq4dNqkXMILz9POa00w/edit?usp=sharing";
  }
	  
     // Online LD Camp
  else if (coachCampId === "7") {
    coachCampText.textContent = "Online LD Camp";
    // scheduleLink = "https://docs.google.com/spreadsheets/d/1v6A-0xbqEq562VC72QbEFEfRJfFrg8jajbK3FN0R5oQ/edit?usp=sharing";
  }  
   Online PF Camp
  else if (coachCampId === "8") {
    coachCampText.textContent = "Online PF Camp";
    scheduleLink = "https://calendar.google.com/calendar/embed?src=9aaf227f1b5184079588883e3b512c53504825638023a74ee30d8488b9dc22e8%40group.calendar.google.com&ctz=America%2FIndiana%2FIndianapolis";
  }  
  var scheduleHTML = '<a href=' + scheduleLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Camp Schedule</p></a>';
  coachResourceGrid.insertAdjacentHTML('beforeend', scheduleHTML)
  if(coachCampId){	
	  var uploadedContent = await getCoachData(memberId);
	  uploadedContent = uploadedContent[0].uploadedContent;
	  if(uploadedContent.length){
			uploadedContent.forEach((uploadData)=>{
				if(uploadData.label && uploadData.uploadedFiles[0]){
					const uploadedHTML = '<a href=' + uploadData.uploadedFiles[0] + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">'+uploadData.label+'</p></a>';
					coachResourceGrid.insertAdjacentHTML('beforeend', uploadedHTML);
				}
			})
		}
  }
}

async function getCoachData(memberId){
	
	try {
		const response = await fetch('https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getCoachPortalData/'+memberId);
		if (!response.ok) {
		throw new Error('Network response was not ok');
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching data:', error);
		throw error;
	}
}
