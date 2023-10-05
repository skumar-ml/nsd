async function coachResources(coachCampId, memberId) {

  const coachResourceGrid = document.getElementById('coach-resource-grid');
  const coachCampText = document.getElementById('coach-service');
  
  var scheduleLink = "#"
  // Texas PF
  if (coachCampId === "1") {
    coachCampText.textContent = "Texas PF";
    scheduleLink = "https://docs.google.com/spreadsheets/d/1Hsyctp2rHDcFM0HTdsBpfEgn2uuFQuuN_sonIBJTVUg/edit?usp=sharing";
  }
  // Texas LD
  else if (coachCampId === "2") {
    coachCampText.textContent = "Texas LD";
    scheduleLink = "https://docs.google.com/spreadsheets/d/1sRCxAjMODRSbjtewP0ra8iGRTVVs1DyTnKYQw6SxhFc/edit?usp=sharing";
  }
  // Philadelphia PF
  else if (coachCampId === "3") {
    coachCampText.textContent = "Philadelphia PF";
    scheduleLink = "https://docs.google.com/spreadsheets/d/1ATEdPhP6cyOWhtiM88KWkgR2OBMrlLiYzZUlgnoHZS0/edit?usp=sharing";
  }
  // Philadelphia LD
  else if (coachCampId === "4") {
    coachCampText.textContent = "Philadelphia LD";
    scheduleLink = "https://docs.google.com/spreadsheets/d/13vdr2zF8x-KTI88XV7D3zSFr5CBlZ10lmlUOnIrYsag/edit?usp=sharing";
  }
  // Minnesota LD
  else if (coachCampId === "5") {
    coachCampText.textContent = "Minnesota LD";
    scheduleLink = "https://docs.google.com/spreadsheets/d/1xd4zkg5wYn6_TbO3JfG2PLrHoVNrkTGsaGvACvAsJAQ/edit?usp=sharing";
  }  
     // Online LD Camp
  else if (coachCampId === "7") {
    coachCampText.textContent = "Online LD Camp";
    scheduleLink = "https://docs.google.com/spreadsheets/d/1v6A-0xbqEq562VC72QbEFEfRJfFrg8jajbK3FN0R5oQ/edit?usp=sharing";
  }  
   // Online PF Camp
  // else if (coachCampId === "8") {
  //   coachCampText.textContent = "Online PF Camp";
  //   scheduleLink = "https://docs.google.com/spreadsheets/d/1dTC-_Z7aiHJOoJAlMkLdcFnG-q9dTuZPkmuvlaPzy48/edit#gid=0";
  // }  
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
