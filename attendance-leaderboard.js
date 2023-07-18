/**
 * 	
 * @param name - HTML element name
 * @param className - HTML element class attribute
 * @param idName - HTML element id attribute
 */
function creEl(name,className,idName){
  var el = document.createElement(name);
	if(className){
	  el.className = className;
	}
	if(idName){
	  el.setAttribute("id", idName)
	}
	return el;
}
/**
 * Class for handling single form
 * @param webflowMemberId - memberId
 * @param responseText - single form object provided by API
 * @param currentIndex - current index for form object
 * @param accountEmail - email id of member
 */
class showLeaderboard {
	constructor(webflowMemberId,responseText){
		this.webflowMemberId = webflowMemberId;
		this.renderLeadboard(responseText);
	}
  
renderLeaderboard(responseText) {
	output = responseText.output;
	console.log(output);

	// Create Overall Div
	const gridDiv = document.createElement('div');
	gridDiv.classList.add('w-layout-grid', 'leaderboard-grid');

	// Header Row
	const paragraphElement = document.createElement('p');
	paragraphElement.classList.add('center', 'bold-text', 'dm-sans');
	paragraphElement.textContent = 'Lab';
	gridDiv.appendChild(paragraphElement);

	paragraphElement.textContent = 'Score';
	gridDiv.appendChild(paragraphElement);

	// Lab Score Rows
	for (const item of output) {
		// Access the properties of each item within the array
		const labName = item.labName;
		const count = item.count; 

		// Create lab and score divs
		const labDiv = document.createElement('div');
		scoreDiv.classList.add('div-block-21');

		const labText = document.createElement('p');
		paragraphText.classList.add('center margin-top-10px');
		paragraphText.textContent(labName);

		labDiv.appendChild(labText);

		const scoreDiv = document.createElement('div');
		scoreDiv.classList.add('div-block-21');

		const scoreText = document.createElement('p');
		paragraphText.classList.add('center margin-top-10px');
		paragraphText.textContent(count);

		scoreDiv.appendChild(scoreText);

		// Add to grid
		gridDiv.appendChild(labDiv);
		gridDiv.appendChild(scoreDiv);
	}

	// Add to Webflow DOM
	leaderDiv = document.getElementById('attendanceLeaderboard');
	leaderDiv.appendChild(gridDiv); 
  }
}
