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

class Notification {
	constructor(webflowMemberId, messageData){
		this.webflowMemberId = webflowMemberId;
		this.messageData = messageData;
		this.filterData = messageData;
		this.paginateData = this.paginatorList(messageData);
		this.makeMessageFilter();
		this.makeMessageList();
		
	}
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
	getMessageType(){
		return this.filterData.filter(
		  (obj, index) =>
			this.filterData.findIndex((item) => item.type == obj.type) === index
		);
	}
	filterMessageData(){
		//this.messageData = this.filterData;
		var messageData = this.filterData;
		var type = document.getElementById("message-type-filter");
		
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
			console.log('searchFilter.value', searchFilter.value)
			var search = searchFilter.value;
			var condition = new RegExp(search);
			messageData = messageData.filter(function (el) {
			  return condition.test(el.title) || condition.test(el.message) || condition.test(el.type);
			});
		}
		
		this.messageData = messageData;
		this.paginateData = this.paginatorList(messageData);
		this.refreshData();
	}
	
	createMessageTypeFilter(){
		var col = creEl("div", 'col');
		var $this = this;
		var getMessage = this.getMessageType();
		var messagetype = creEl('select', 'message-type-filter w-select', 'message-type-filter')
		var defaultoption = creEl("option");
		defaultoption.value = "";
		defaultoption.text = "Select Message Type";
		messagetype.appendChild(defaultoption);
		getMessage.forEach(item => {
			var option = creEl("option");
				option.value = item.type;
				option.text = item.type;
				messagetype.appendChild(option);
		})
		
		messagetype.addEventListener('change', function () {
			$this.filterMessageData('type', this.value);
		})
		
		col.appendChild(messagetype)
		return col;
	}
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
			$this.filterMessageData('type', this.value);
		})
		return col;
	}
	createSearchFilter(){
		var $this = this;
		var col = creEl("div", 'col');
		var searchFilter = creEl('input', 'search-filter form-text-label w-input', 'search-filter')
		searchFilter.name = 'messageSearch';
		searchFilter.placeholder = "Search Message";
		/*Event for search*/
		searchFilter.addEventListener('keypress', function (event) {
			if (event.key === "Enter") {
				$this.filterMessageData('type', this.value);
			}
		})
		
		col.appendChild(searchFilter)
		return col;
	}
	createCol(message, col_width){
		var col_width = (col_width) ? col_width : 3;
		var col = creEl("div", 'w-col w-col-'+col_width);
		if(message != ''){
			col.innerHTML= message;
		}
		return col;
	}
	creBoldText(text){
		var boldText = creEl('b', 'bold-text');
		boldText.innerHTML = text;
		return boldText;
	}
	craeteMessageList(){
		var $this = this;
		var messageList = creEl('div', 'message-list');
		this.paginateData.data.forEach((item, index) => {
			var is_read = (item.is_read) ? 'read' : 'not-read';
			var row = creEl('div', 'w-row '+is_read)
			var col_1 = this.createCol(item.title);
			row.appendChild(col_1);
			var col_2 = this.createCol(item.type, 2);
			row.appendChild(col_2);
			var col_3 = this.createCol(item.message.substring(0, 30) + '...', 4);
			row.appendChild(col_3);
			var col_4 = this.createCol(item.created_on);
			row.appendChild(col_4);
			row.addEventListener('click', function () {
				$this.displayDetailsPage(item);
			})
			messageList.appendChild(row)
		})
		return messageList;
	}
	createMessageTitle(){
		var title = ['Title', 'Type', 'Message', 'Date']
		var row = creEl('div', 'w-row')
		title.forEach(item=> {
			var col_width = (item == 'Type') ? 2 : ((item == 'Message') ? '4' : 3 )
			var col = this.createCol(item, col_width);
			row.appendChild(col);
		})
		return row;
	}
	refreshData(){
		var notification = document.getElementById("notification");
		notification.innerHTML = "";
		this.makeMessageList();
		
	}
	showListPage(){
		var notificationFilter = document.getElementById("notification-filter");
		var notification = document.getElementById("notification");
		var notificationDetails = document.getElementById("notification-details");
		notificationFilter.style.display = 'block';
		notification.style.display = 'block';
		notificationDetails.style.display = 'none';
	}
	detailPageBackButton(){
		var $this = this;
		var backButton = creEl('a', 'w-pagination-previous')
		backButton.innerHTML = '< Back';
		backButton.addEventListener('click', function () {
			$this.showListPage();
		})
		return backButton;
	}
	deatailPageRow(text, text_head){
		var row = creEl('div', 'w-row')
		var title_head = this.creBoldText(text_head)
		var title = text;
		var col_1 = this.createCol('', 2);
		col_1.appendChild(title_head);
		var col_2 = this.createCol(title, 10);
		row.appendChild(col_1);
		row.appendChild(col_2);
		return row;
	}
	detailPageContain(item){
		var contain = creEl('div', 'detail-contain', 'detail-contain');
		
		var title = this.deatailPageRow(item.title, 'Title')
		contain.appendChild(title);
		
		var title = this.deatailPageRow(item.type, 'Type')
		contain.appendChild(title);
		
		var title = this.deatailPageRow(item.message, 'Message')
		contain.appendChild(title);
		
		var title = this.deatailPageRow(item.created_on, 'Created On')
		contain.appendChild(title);

		
		return contain;
	}
	makeRead(item){
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
	displayDetailsPage(item){
		var $this = this;
		/*hide and show detail and list page*/
		var notification = document.getElementById("notification");
		var notificationFilter = document.getElementById("notification-filter");
		var notificationDetails = document.getElementById("notification-details");
		notificationDetails.innerHTML = "";
		notificationFilter.style.display = 'none';
		notification.style.display = 'none';
		notificationDetails.style.display = 'block';
		
		this.makeRead(item);
		
		/*Data to display*/
		var contain = this.detailPageContain(item);
		notificationDetails.appendChild(contain);
		/*Back button for detail page*/
		var backButton = this.detailPageBackButton();
		notificationDetails.appendChild(backButton);
	}
	createPagination(){
		var $this = this;
		var pagination = creEl('div', 'w-pagination-wrapper', 'notification-body');
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
	makeMessageFilter(){
		var notificationFilter = document.getElementById("notification-filter");
		/*Filter*/
		var notificationHeader = creEl('div', 'notification-header w-layout-grid grid-3', 'notification-header')
		var messageType = this.createMessageTypeFilter();
		var dateFilter = this.createDateFilter();
		var searchFilter = this.createSearchFilter();
		notificationHeader.appendChild(messageType);
		notificationHeader.appendChild(dateFilter);
		notificationHeader.appendChild(searchFilter);
		notificationFilter.appendChild(notificationHeader);
	}
	makeMessageList(){
		var notification = document.getElementById("notification");
		
		/*Message Title*/
		var messageTitle = this.createMessageTitle();
		var notificationTitle = creEl('div', 'notification-title', 'notification-title');
		notificationTitle.appendChild(messageTitle);
		notification.appendChild(notificationTitle);
		/*Message List*/
		var messageList = this.craeteMessageList();
		var notificationbody = creEl('div', 'notification-body', 'notification-body');
		notificationbody.appendChild(messageList);
		notification.appendChild(notificationbody);
		
		/*Message Pagination*/
		
		var pagination = this.createPagination();
		notification.appendChild(pagination);
	}
	
}
class NotificationApi {
	$isLoading = true;
	$messageData = '';
	constructor(webflowMemberId){
		this.webflowMemberId = webflowMemberId;
		this.getNotificationData();
	}
	getNotificationData(){
		var xhr = new XMLHttpRequest()
		var $this = this;
		xhr.open("GET", "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/getNotifications/"+$this.webflowMemberId, true)
		xhr.withCredentials = false
		xhr.send()
		xhr.onload = function() {
			let responseText =  JSON.parse(xhr.responseText);
			new Notification($this.webflowMemberId, responseText);  
		}
	}
}
