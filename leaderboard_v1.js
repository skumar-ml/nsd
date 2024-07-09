class NDFLeaderBoard {
    $competition = [];
    $programDetail = {};
    constructor(webflowMemberId, accountEmail, apiBaseUrl, duringCampData) {
        this.webflowMemberId = webflowMemberId;
        this.accountEmail = accountEmail;
        this.baseUrl = apiBaseUrl;
        this.getLeaderboardData();
    }
    // Get API data with the help of endpoint
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            return data;
        } catch (error) {
            //console.error("Error fetching data:", error);
            //throw error;
        }
    }
    async getLeaderboardData() {
        var spinner = document.getElementById('half-circle-spinner');
        spinner.style.display = 'block';
        // var competitionLocalData = localStorage.getItem("competitionData");
        var $this = this;
        // console.log('competitionLocalData', competitionLocalData)
        // if (competitionLocalData != "undefined" && competitionLocalData != null) {
        //     var responseText = JSON.parse(competitionLocalData);
        //     $this.createPortalTabs(responseText)
        //     spinner.style.display = 'none';
        // } else {
            try {
                const data = await $this.fetchData("getCompetitionDetails/" + $this.webflowMemberId);
                $this.createPortalTabs(data)
                spinner.style.display = 'none';

            } catch (error) {
                console.error('Error fetching data:', error);
                throw error;
            }
        // }
        // const bgData = await $this.fetchData("getCompetitionDetails/" + $this.webflowMemberId);
        // localStorage.setItem("competitionData", JSON.stringify(bgData));
    }
    createProgressBarHTML(title, progressPercentage, currentDay, totalDays) {
        return `
            <div class="progress-info-container">
                <h1 class="dm-sans sub-text progress-bar_title">You have time to get more points!
</h1>
                <div class="progress-bar-wrapper">
                    <div class="progress-bar-div">
                        <div id="progress-bar" class="progress-bar" style="width: ${this.getPercentageComDay()}%;"></div>
                    </div>
                    <div class="day-text-wrapper">
                        <div><p id="current-day" class="day-text">Day 1</p></div>
                        <div><p id="total-days" class="day-text">Day ${this.getTotalComDays()}</p></div>
                    </div>
                </div>
            </div>
        `;
    }
    updateGlobalVariable(tab) {
        this.$competition = tab.competition.find(item => item.is_live == true);
        this.$programDetail = tab.programDetail;;
        this.$startDate = new Date(this.$programDetail.startDate);
        this.$endDate = new Date(this.$programDetail.endDate);
    }
    /**
     * Calculate total day's of competition
     */
    getTotalComDays() {
        var startDate = this.$startDate;
        var endDate = this.$endDate;

        // Calculate the difference in milliseconds
        var differenceInTime = endDate.getTime() - startDate.getTime();

        // Convert the difference from milliseconds to days
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);

        // Round up to the next whole number
        var roundedDifferenceInDays = Math.ceil(differenceInDays);

        return roundedDifferenceInDays;
    }
    /**
     * Calculate completed day of competition
     */
    getCompletedComDays() {
        // Parse the start date and set the time to midnight (00:00:00)
        var start = this.$startDate;
        start.setHours(0, 0, 0, 0);

        // Get the current date and time
        var now = new Date();

        // Calculate the difference in milliseconds
        var differenceInTime = now - start;

        // Convert the difference from milliseconds to days
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);

        // Round up to the next whole number
        var roundedDifferenceInDays = Math.ceil(differenceInDays);

        return (roundedDifferenceInDays > 0 )? roundedDifferenceInDays: 0;
    }
    getPercentageComDay(){
        var completedDay = this.getCompletedComDays();
        var totalDay =  this.getTotalComDays();
        return (completedDay) ? (100 * completedDay) / totalDay : 0;
    }
    tabPane(index, tabIndex, isTabActive, tab) {

        const tabPane = document.createElement('div');
        tabPane.className = `w-tab-pane ${isTabActive}`;
        tabPane.setAttribute('data-w-tab', `Tab ${tabIndex}`);
        tabPane.setAttribute('id', `w-tabs-0-data-w-pane-${index}`);
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `w-tabs-0-data-w-tab-${index}`);


        tabPane.innerHTML = `
        ${this.createProgressBarHTML()}
        ${this.createLeaderboard()}
       `;

        return tabPane
    }
    createPortalTabs(tabsData) {
        const nsd_portal_container = document.getElementById('leaderboard');
        // Create the main portal tab container
        const portalTabs = document.createElement('div');
        portalTabs.className = 'portal-tab w-tabs';
        portalTabs.setAttribute('data-current', 'Tab 1');
        portalTabs.setAttribute('data-easing', 'ease');
        portalTabs.setAttribute('data-duration-in', '300');
        portalTabs.setAttribute('data-duration-out', '100');

        // Create the tab menu container
        const tabMenus = document.createElement('div');
        tabMenus.className = 'portal-tab-menus w-tab-menu';
        tabMenus.setAttribute('role', 'tablist');

        // Create the tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'portal-tab-content w-tab-content';

        // Loop through the tab data to create each tab and its content
        tabsData.forEach((tab, index) => {
            const tabIndex = index + 1;
            const isActive = index === 0 ? 'w--current' : '';
            const isTabActive = index === 0 ? 'w--tab-active' : '';
            this.updateGlobalVariable(tab);
            // Create the tab header
            const tabHeader = document.createElement('a');
            tabHeader.className = `current-programs_sub-div w-inline-block w-tab-link ${isActive}`;
            tabHeader.setAttribute('data-w-tab', `Tab ${tabIndex}`);
            tabHeader.setAttribute('id', `w-tabs-0-data-w-tab-${index}`);
            tabHeader.setAttribute('href', `#w-tabs-0-data-w-pane-${index}`);
            tabHeader.setAttribute('role', 'tab');
            tabHeader.setAttribute('aria-controls', `w-tabs-0-data-w-pane-${index}`);
            tabHeader.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            tabHeader.setAttribute('tabindex', index === 0 ? '0' : '-1');
            //${ this.$startDate.toLocaleString('default', { month: 'long' })} ${ this.$startDate.getDate()} - ${ this.$endDate.toLocaleString('default', { month: 'long' })} ${this.$endDate.getDate()} 
            tabHeader.innerHTML = `
                <div>
                    <div class="current-program_content-div">
                        <div class="dm-sans current-program_subtitle">${tab.programDetail.programName}</div>
                        <div class="dm-sans opacity-70">${this.$competition.competitionName} </div>
                    </div>
                </div>
            `;

            var tabPane = this.tabPane(index, tabIndex, isTabActive, tab);
            // Append the tab header and content to their respective containers
            tabMenus.appendChild(tabHeader);
            tabContent.appendChild(tabPane);

        });

        // Append the tab menus and content to the main portal tab container
        if (tabMenus) {
            portalTabs.appendChild(tabMenus);
        }
        if (tabContent) {
            portalTabs.appendChild(tabContent);
        }
        // Append the portal tabs to the body or a specific container
        if (tabMenus && tabContent) {
            nsd_portal_container.appendChild(portalTabs);
        }
        Webflow.require('tabs').redraw();
    }
    createLeaderboardRow(rank, title, points, myTeam) {
        var trophyUrl = this.getTrophyUrl(rank, points);
        const trophyIcon = trophyUrl ? `<img src="${trophyUrl}" alt="Trophy Icon">` : rank;
        var myTeamClass = (myTeam) ? 'my_team_points' : '';
        return `
            <div class="row ${myTeamClass}">
                <div class="dm-sans row-data">${trophyIcon}</div>
                <div class="dm-sans row-data">${title}</div>
                <div class="dm-sans row-data align-center">${points}</div>
            </div>
        `;
    }
    createLeaderboard() {
        this.$competition.points.sort(function (r, a) {
            return Object.values(a)[0] - Object.values(r)[0]
        });
        const rows = this.$competition.points.map((data, i) => this.createLeaderboardRow(i + 1, Object.keys(data)[0], Object.values(data)[0], Object.values(data)[1])).join('');
        return `
            <div class="leaderboard-wrapper">
                <h1 class="dm-sans table-heading">Leaderboard</h1>
                <div class="leaderboard-table">
                    <div class="leaderboard-header">
                        <div class="header">
                            <div class="dm-sans opacity-50"></div>
                        </div>
                        <div class="header">
                            <div class="dm-sans opacity-50">Team</div>
                        </div>
                        <div id="w-node-_151abb10-6fb6-5079-b6a9-df38a91da8bc-373eaa6b" class="header align-center">
                            <div class="dm-sans opacity-50">Points</div>
                        </div>
                    </div>
                    <div class="leaderboard-row">
                        ${rows}
                    </div>
                </div>
                <div class="code-embed-4 w-embed w-script"></div>
            </div>
        `;
    }
    getTrophyUrl(rank, points) {
        if (rank == 1 && points) {
            return 'https://cdn.prod.website-files.com/6271a4bf060d543533060f47/6674399b030b15665fab28c8_np_trophy_1047539_000000%201%20(1).svg'
        } else if (rank == 2 && points) {
            return 'https://cdn.prod.website-files.com/6271a4bf060d543533060f47/667439f7a9ce9eac1aa9b98a_np_trophy_1047539_000000%201%20(4).svg'
        } else if (rank == 3 && points) {
            return 'https://cdn.prod.website-files.com/6271a4bf060d543533060f47/66743ae4de11954be86a3c7f_np_trophy_1047539_000000%201%20(5).svg'
        } else {
            return '';
        }
    }
}
