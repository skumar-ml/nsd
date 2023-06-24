function coachResources(coachCampId) {

  const coachResourceGrid = document.getElementById('coach-resource-grid');
  const coachCampText = document.getElementById('service');
  
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
  // Philadelphia LD
  else if (coachCampId === "4") {
    coachCampText.textContent = "Philadelphia LD";
    scheduleLink = "https://docs.google.com/spreadsheets/d/13vdr2zF8x-KTI88XV7D3zSFr5CBlZ10lmlUOnIrYsag/edit?usp=sharing";
  }
  
  var scheduleHTML = '<a href=' + scheduleLink + ' target="_blank" class="portal-resource-card portal-div-shadow w-inline-block"><p class="portal-card-text">Camp Schedule</p></a>';
  coachResourceGrid.insertAdjacentHTML('beforeend', scheduleHTML)
}
