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
    
  }
