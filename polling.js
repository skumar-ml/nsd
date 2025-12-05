/*
Purpose: Displays polling assignments in a list format with filters and pagination.

Brief Logic: Fetches polling data from API and displays assignments in a list with filtering and pagination controls. Handles assignment status and submission tracking.

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
 * Class for handling polling List
 * @param webflowMemberId - memberId
 * @param messageData - polling data by API
 */
class Polling {
	$currentDetailsData = '';
	// Initializes the Polling instance with member ID and message data, then sets up UI
	constructor(webflowMemberId, messageData){
		this.webflowMemberId = webflowMemberId;
		messageData.sort(function(a,b){
		  return new Date(b.created_on) - new Date(a.created_on);
		});
		this.messageData = messageData;
		this.filterData = messageData;
		this.paginateData = this.paginatorList(messageData);
		
		this.makePollingFilter();
		this.makePollingList();
		this.displayUnreadPolling();
		
	}
	// Creates a paginated list from items array with page and per_page parameters
	paginatorList(items, page, per_page) {
		var page = page || 1,
		per_page = per_page || 5,
		offset = (page - 1) * per_page,

		paginatedItems = items.slice(offset).slice(0, per_page),
		total_pages = Math.ceil(items.length / per_page);
		return {
			page: page,
			per_page: per_page,
			pre_page: page - 1 ? page - 1 : null,
			next_page: (total_pages > page) ? page + 1 : null,
			total: items.length,
			total_pages: total_pages,
			data: paginatedItems
		};
	}
	// Displays the unread polling count badge next to the bell icon
	displayUnreadPolling(){
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
	// Returns an array of unique polling types from the filter data
	getPollingType(){
		return this.filterData.filter(
		  (obj, index) =>
			this.filterData.findIndex((item) => item.type == obj.type) === index
		);
	}
	/*Filter api response based on current seleted filter value*/
	filterPollingData(){
		//this.messageData = this.filterData;
		var messageData = this.filterData;
		var type = document.getElementById("polling-type-filter");
		
		var dateFilter = document.getElementById("date-filter");
		
		var searchFilter = document.getElementById("search-filter");
		
		if(type.value){
			messageData = messageData.filter(item => item.type == type.value)
		}
		if(dateFilter.value){
			if(dateFilter.value == 1){
				messageData.sort(function(a,b){
				  return new Date(b.created_on) - new Date(a.created_on);
				});
			}else{
				messageData.sort(function(a,b){
				  return new Date(a.created_on) - new Date(b.created_on);
				});
			}
		}
		
		if(searchFilter.value){
			var search = searchFilter.value;
			var condition = new RegExp(search, 'i');
			messageData = messageData.filter(function (el) {
			  return condition.test(el.title) || condition.test(el.activityType) || condition.test(el.type) || condition.test(el.sendAs);
			});
		}
		
		this.messageData = messageData;
		this.paginateData = this.paginatorList(messageData);
		this.refreshData();
	}
	// Creates and returns a DOM element for the polling type filter dropdown
	createPollingTypeFilter(){
		var col = creEl("div", 'col');
		var $this = this;
		var getMessage = this.getPollingType();
		var messagetype = creEl('select', 'polling-type-filter w-select', 'polling-type-filter')
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select Polling Type";
		messagetype.appendChild(defaultoption);
		getMessage.forEach(item => {
			var option = creEl("option");
				option.value = item.type;
				option.text = item.type;
				messagetype.appendChild(option);
		})
		
		messagetype.addEventListener('change', function () {
			$this.filterPollingData('type', this.value);
		})
		
		col.appendChild(messagetype)
		return col;
	}
	// Creates and returns a DOM element for the date filter dropdown (newest/oldest)
	createDateFilter(){
		var $this = this;
		var col = creEl("div", 'col');
		var dateFilter = creEl('select', 'date-filter w-select', 'date-filter');
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Sort by";
		dateFilter.appendChild(defaultoption);
		//Newest
		var newestoption = creEl("option");
		newestoption.value = "1";
		newestoption.text = "Newest First";
		dateFilter.appendChild(newestoption);
		//oldest
		var oldestoption = creEl("option");
		oldestoption.value = "2";
		oldestoption.text = "Oldest First";
		dateFilter.appendChild(oldestoption);
		col.appendChild(dateFilter)
		dateFilter.addEventListener('change', function () {
			$this.filterPollingData('type', this.value);
		})
		return col;
	}
	// Creates and returns a DOM element for the search filter input
	createSearchFilter(){
		var $this = this;
		var col = creEl("div", 'col');
		var searchFilter = creEl('input', 'search-filter form-text-label w-input', 'search-filter')
		searchFilter.name = 'messageSearch';
		searchFilter.placeholder = "Search Message";
		/*Event for search*/
		searchFilter.addEventListener('keypress', function (event) {
			if (event.key === "Enter") {
				$this.filterPollingData('type', this.value);
			}
		})
		
		col.appendChild(searchFilter)
		return col;
	}
	// Creates and returns a column DOM element with specified width
	createCol(message, col_width){
		var col_width = (col_width) ? col_width : 3;
		var col = creEl("div", 'w-col w-col-'+col_width);
		if(message != ''){
			col.innerHTML= message;
		}
		return col;
	}
	// Creates and returns a bold text element
	creBoldText(text){
		var boldText = creEl('b', 'bold-text');
		boldText.innerHTML = text;
		return boldText;
	}
	// Returns an image element for read or unread status icon
	getCheckedIcon(status){
		var img = creEl('img', 'is_read_icon')
		if(status){
			var src = "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642a83485b6551a71e5b7e12_dd-check.png";
		}else{
			var src = "https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642a834899a0eb5204d6dafd_dd-cross.png";
		}
		img.src = src;
		return img
	}
	// Downloads a file from the specified URL with the given filename
	download(fileLink, fileName){
		fetch(fileLink)
		  .then(resp => resp.blob())
		  .then(blob => {
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = url;
			// the filename you want
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			//alert('your file has downloaded!'); // or you know, something with better UX...
		  })
		  .catch(() => alert('oh no!'));
	}
	// Creates and returns a download link icon element for file attachments
	downLoadLinkIcon(fileLink, type=''){
		var $this = this;
		var fileName = fileLink
		var a = creEl('a', 'downloadLink')
		
		if(type == 'download'){
			var img = creEl('img', 'downloadIcon')
			img.class="download-file"
			img.title = 'Download'
			img.src="https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/6434ff69906fb9a8c9c8b4d3_download-file.svg";
		}else{
			var img = creEl('img')
			img.src="https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/642e8f4e85af6b0ef1e409b6_link-solid.png";
		}
		a.appendChild(img);
		a.addEventListener('click', function () {
				$this.download(fileLink, fileLink.substring(fileLink.lastIndexOf('/')+1));
		})
		return a;
	}
	// Creates and returns an iframe view link for viewing files in lightbox
	viewDownLoadedFile(fileLink, item){
		var $this = this;
		var fileName = fileLink
		var a = creEl('a', 'downloadLink iframe-lightbox-link poll-btn main-button red w-button')
		
		if(item.is_user_edit && item.submissionId){
			a.innerHTML = "EDIT";
			a.href = "https://www.jotform.com/edit/"+item.submissionId;
		}else if(item.submissionId){
			a.innerHTML = "VIEW";
			a.href = "https://www.jotform.com/submission/"+item.submissionId;
		}else{
			a.innerHTML = "START";
			a.href = fileLink+"?memberId="+this.webflowMemberId+"&pollId="+item.polling_id;
		}
		
		return a;
	}
	// Creates and returns a DOM element containing the polling list with pagination
	craetePollingList(){
		var $this = this;
		var messageList = creEl('div', 'message-list');
		this.paginateData.data.forEach((item, index) => {
			/*Read unread condition added based on submissionId*/
			var is_read = (item.submissionId) ? 'read' : 'not-read';
			var row = creEl('div', 'w-row '+is_read)
			
			
			
			/*Read unread icon condition added based on submissionId*/
			var read_icon = this.getCheckedIcon(item.submissionId); 
			var col_icon = this.createCol('', 1);
			
			col_icon.appendChild(read_icon);
			row.appendChild(col_icon);
			
			var col_1 = this.createCol(item.title, 4);
			row.appendChild(col_1);
			
			
			var col_2 = this.createCol(item.type, 2);
			row.appendChild(col_2);
				var col_4 = this.createCol((item.activityType) ? item.activityType : '-', 2);
				row.appendChild(col_4);
			var col_5 = this.createCol(this.formatedDate(item.created_on), 2);
			
			row.appendChild(col_5);
			row.addEventListener('click', function () {
				$this.$currentDetailsData = item;
				$this.displayDetailsPage();
			})
			messageList.appendChild(row)
		})
		
		return messageList;
	}
	// Creates and returns the polling list header row with column titles
	createPollingTitle(){
		var title = ['', 'Poll Title', 'Type', , 'Activity Type', 'Date']
		var row = creEl('div', 'w-row')
		title.forEach(item=> {
			var col_width = 4
			if(item == ''){
				col_width = 1
			}else if(item == 'Type' ){
				col_width = 2
			}else if(item == 'Date'){
				col_width = 2;
			}else if(item == 'Activity Type'){
				col_width = 2;
			}
			var col = this.createCol(item, col_width);
			row.appendChild(col);
		})
		return row;
	}
	// Refreshes the polling list display with current filtered and paginated data
	refreshData(){
		var polling = document.getElementById("polling");
		polling.innerHTML = "";
		this.makePollingList();
		
	}
	// Shows the polling list page and hides the details page
	showListPage(){
		var pollingFilter = document.getElementById("polling-filter");
		var polling = document.getElementById("polling");
		var pollingDetails = document.getElementById("polling-details");
		var pollingHeading = document.getElementsByClassName("polling-heading")[0];
		pollingFilter.style.display = 'block';
		polling.style.display = 'block';
		pollingDetails.style.display = 'none';
		pollingHeading.style.display = 'block';
	}
	// Creates and returns a back button element for the detail page
	detailPageBackButton(){
		var $this = this;
		var backButton = creEl('a', 'w-previous')
		var  img = creEl('img', 'back-icon')
		img.src="https://uploads-ssl.webflow.com/6271a4bf060d543533060f47/6434fd8a3e27f65f1168c15b_arrow-left.svg"
		img.title = 'Back'
		backButton.appendChild(img);
		backButton.addEventListener('click', function () {
			$this.showListPage();
		})
		return backButton;
	}
	
	// Formats a date string for display in list or detail page format
	formatedDate(dateString, type=''){
		const monthText = ["January","February","March","April","May","June","July","August","September","October","November","December"];
		var date = new Date(dateString);
		var day = date.getDate();
		var month = date.getMonth();
		var year = date.getFullYear();
		var newDate = month+1+'/'+day+'/'+year;
		if(type == 'detailPage'){
			newDate = monthText[date.getMonth()]+' '+day+', '+year
		}
		return newDate;
	}
	// Creates and returns the detail page content container with polling details
	detailPageContain(item){
		var contain = creEl('div', 'detail-contain  w-row', 'detail-contain');
		
		var detailHead = creEl('div', 'detail-head w-row');
		var title = item.title;
		var dateTextcol = creEl("div", 'w-col w-col-6');
		var titleB= this.creBoldText(title)
		dateTextcol.appendChild(titleB);
		detailHead.appendChild(dateTextcol);
		
		
		var sendBycol = creEl("div", 'w-col w-col-6 text-right header-right');
		/*Created on Date*/
		var dateText = this.formatedDate(item.created_on, 'detailPage');
		var dateSpan = creEl('span','detail-date-section')
		dateSpan.innerHTML = dateText;
		sendBycol.appendChild(dateSpan);
		
		var br = creEl('br')
		sendBycol.appendChild(br)
		
		
		detailHead.appendChild(sendBycol);
		contain.appendChild(detailHead);
		
		
		var message = (item.activityType)? item.activityType : '-';
		var dateMessagecol = creEl("div", 'w-col w-col-12 details-message');
		dateMessagecol.innerHTML = '<b>Activity Type</b>: '+ message;
		contain.appendChild(dateMessagecol);
		
		var type = item.type;
		var typecol = creEl("div", 'w-col w-col-12 details-message')
		typecol.innerHTML = '<b>Poll Type</b>: '+ type;
		contain.appendChild(typecol);
		
		if(item.jotformUrl){
			var viewIcon = this.viewDownLoadedFile(item.jotformUrl, item)
			var downloadCol = creEl("div", 'w-col w-col-12 download-icon');
			
			downloadCol.appendChild(viewIcon);
			contain.appendChild(downloadCol);
		}

		
		return contain;
	}
	/*Need to remove*/
	// Makes an API call to mark a polling notification as read
	readApiCall(messageId){
		var data = {
			 "objectId" : messageId
		}
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("POST", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/isReadPolledNotification", true)
		xhr.withCredentials = false
		xhr.send(JSON.stringify(data))
		xhr.onload = function() {
			let responseText = xhr.responseText;
			console.log('responseText', responseText)
		}
	}
	/*Need to remove*/
	// Marks a polling notification as read and updates the message data
	makeRead(item){                       
		/*API Call for read unread API*/
		if(!item.is_read){
			this.readApiCall(item.oid)
		}
		var messageData =  this.messageData;
		messageData.map(data =>{
			if(data.oid == item.oid){
				data.is_read = true;
			}
			return data;
		})
		this.messageData = messageData;
		this.refreshData();
	}
	// Displays the polling detail page and marks the polling notification as read
	displayDetailsPage(){
		var item = this.$currentDetailsData;
		var $this = this;
		/*hide and show detail and list page*/
		var polling = document.getElementById("polling");
		var pollingFilter = document.getElementById("polling-filter");
		var pollingDetails = document.getElementById("polling-details");
		var pollingHeading = document.getElementsByClassName("polling-heading")[0];
		pollingDetails.innerHTML = "";
		pollingFilter.style.display = 'none';
		polling.style.display = 'none';
		pollingDetails.style.display = 'block';
		pollingHeading.style.display = 'none';
		//this.makeRead(item);
		
		
		
		/*Data to display*/
		var contain = this.detailPageContain(item);
		pollingDetails.appendChild(contain);
		
		/*Back button for detail page*/
		var backButton = this.detailPageBackButton();
		pollingDetails.appendChild(backButton);
		this.initiateLightbox();

		
	}
	// Creates and returns pagination controls for navigating polling pages
	createPagination(){
		var $this = this;
		var pagination = creEl('div', 'w-pagination-wrapper', 'polling-body');
		/*Previous Button*/
		if(this.paginateData.pre_page != null){
			var preBtn = creEl('a', 'w-pagination-previous');
			preBtn.innerHTML = '< Previous';
			preBtn.addEventListener('click', function () {
				$this.paginateData = $this.paginatorList($this.messageData, $this.paginateData.pre_page);
				$this.refreshData();
			})
			pagination.appendChild(preBtn);
		}
		/*Next Button*/
		if(this.paginateData.next_page != null){
			var nextBtn = creEl('a', 'w-pagination-next');
			nextBtn.innerHTML = 'Next >';
			nextBtn.addEventListener('click', function () {
				$this.paginateData = $this.paginatorList($this.messageData, $this.paginateData.next_page);
				$this.refreshData();
			})
			pagination.appendChild(nextBtn);
		}
		
		return pagination;
	}
	// Creates and appends the polling filter header with all filter elements
	makePollingFilter(){
		var pollingFilter = document.getElementById("polling-filter");
		/*Filter*/
		var pollingHeader = creEl('div', 'polling-header w-layout-grid grid-3', 'polling-header')
		var messageType = this.createPollingTypeFilter();
		var dateFilter = this.createDateFilter();
		var searchFilter = this.createSearchFilter();
		pollingHeader.appendChild(messageType);
		pollingHeader.appendChild(dateFilter);
		pollingHeader.appendChild(searchFilter);
		pollingFilter.appendChild(pollingHeader);
	}
	// Creates and appends the polling list with title and items
	makePollingList(){
		var polling = document.getElementById("polling");
		
		/*Message Title*/
		var messageTitle = this.createPollingTitle();
		var pollingTitle = creEl('div', 'polling-title', 'polling-title');
		pollingTitle.appendChild(messageTitle);
		polling.appendChild(pollingTitle);
		/*Message List*/
		var messageList = this.craetePollingList();
		var pollingbody = creEl('div', 'polling-body', 'polling-body');
		pollingbody.appendChild(messageList);
		polling.appendChild(pollingbody);
		
		/*Message Pagination*/
		
		var pagination = this.createPagination();
		polling.appendChild(pagination);
		
	}
	// Fetches polling edit data from API for user-editable pollings
	getPollingEditData(){
		var $this = this;
		var currentDetailsData = $this.$currentDetailsData;
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getPollingDetails/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			//console.log('currentDetailsData1', currentDetailsData.oid)
			let responseText =  JSON.parse(xhr.responseText);
			if(responseText.length > 0){
				var currentFindData = responseText.find(item => item.oid == currentDetailsData.oid)
				if(currentFindData != undefined){
					console.log('currentDetailsData', currentDetailsData)
					console.log('currentFindData', currentFindData)
					$this.$currentDetailsData = currentFindData;
					
					$this.displayDetailsPage();
					//Updating current data;
					$this.messageData = responseText;
					responseText.sort(function(a,b){
					  return new Date(b.created_on) - new Date(a.created_on);
					});
					$this.displayUnreadPolling();
					$this.paginateData = $this.paginatorList(responseText, $this.paginateData.page);
					$this.refreshData();
				}
			} 
		}
	}
	// Initializes iframe lightbox for viewing file attachments
	initiateLightbox(){
		var $this = this;
		console.log('testing');
		[].forEach.call(document.getElementsByClassName("iframe-lightbox-link"), function (el) {
		  el.lightbox = new IframeLightbox(el, {
			onClosed: function() {
				$this.getPollingEditData()
			},
			scrolling: true,
		  });
		});
	}
	
}

/**
  * Class for Handling API for polling data
  * @param webflowMemberId - MemberId
  */
class PollingApi {
	$isLoading = true;
	$messageData = '';
	// Initializes PollingApi instance and fetches polling data
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getPollingData();
	}
	// Fetches polling data from API and creates Polling instance
	getPollingData(){
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getPollingDetails/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			let responseText =  JSON.parse(xhr.responseText);
			new Polling($this.webflowMemberId, responseText); 			
		}
	}
}
