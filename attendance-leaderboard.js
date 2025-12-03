/*
Purpose: Renders the attendance leaderboard grid showing lab names and their current scores.

Brief Logic: Takes leaderboard data from API response and renders a grid with Lab and Score columns. Iterates through output array to display each lab name with its corresponding attendance percentage score.

Are there any dependent JS files: No
*/

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
	// Initializes the leaderboard with member ID and response data, then renders the leaderboard
	constructor(webflowMemberId,responseText){
		this.responseText = responseText;
		this.webflowMemberId = webflowMemberId;
		this.renderLeaderboard(this.responseText);
	}
  
  // Renders the attendance leaderboard grid with lab names and their scores
renderLeaderboard(responseText) {
	console.log(responseText);
	const output = responseText.output;
	console.log(output);

	if (output.length !== 0) {
		// Create Overall Div
		const gridDiv = document.createElement('div');
		gridDiv.classList.add('w-layout-grid', 'leaderboard-grid');
		
	
		// Header Row
		const LabHeader = document.createElement('p');
		LabHeader.classList.add('center', 'bold-text', 'dm-sans');
		LabHeader.textContent = 'Lab';
		gridDiv.appendChild(LabHeader);
	
		const ScoreHeader = document.createElement('p');
		ScoreHeader.classList.add('center', 'bold-text', 'dm-sans');
		ScoreHeader.textContent = 'Score';
		gridDiv.appendChild(ScoreHeader);
	
		// Lab Score Rows
		for (const item of output) {
			// Access the properties of each item within the array
			const labName = item.labName;
			const count = item.percentage; 
	
			// Create lab and score divs
			const labDiv = document.createElement('div');
			labDiv.classList.add('div-block-21');
	
			const labText = document.createElement('p');
			labText.classList.add('center',  'margin-top-10px');
			labText.textContent= labName;
	
			labDiv.appendChild(labText);
	
			const scoreDiv = document.createElement('div');
			scoreDiv.classList.add('div-block-21');
	
			const scoreText = document.createElement('p');
			scoreText.classList.add('center', 'margin-top-10px');
			scoreText.textContent = count;
	
			scoreDiv.appendChild(scoreText);
	
			// Add to grid
			gridDiv.appendChild(labDiv);
			gridDiv.appendChild(scoreDiv);
		}

		// Add to Webflow DOM
		const leaderDiv = document.getElementById('attendanceLeaderboard');
		leaderDiv.appendChild(gridDiv); 
	}
  }
}
