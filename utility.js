/*
Purpose: Utility class for NSD functionality.

Brief Logic: Checks if webflowMemberId matches admin IDs or access parameter. If admin, applies CSS to show cart management interface and card grid layout.

Are there any dependent JS files: No
*/
class NSDUtilityClass {
    /**
     * checks if the webflowMemberId is NSD
     */
    static setupAdminViewListener(webflowMemberId, adminIds) {
        const urlParams = new URLSearchParams(window.location.search);
        const accessParam = urlParams.get("access");

        if (adminIds.includes(webflowMemberId) || accessParam === "admin") {
            const css = `
                    div#cart-main-div {
                        display: block !important;
                    }
                    div#cart-info-div {
                        display: none !important;
                    }
                    div#card-grid-main {
                        display: grid !important;
                    }
                    .opening-shortly-msg {
                        display: none !important;
                    }
                    @media screen and (max-width: 991px) {
                        div#card-grid-main {
                            display: block !important;
                        }
                    }
                `;

            const style = document.createElement("style");
            style.innerHTML = css;
            document.head.appendChild(style);
            return true
        }
        return false;
    }

    // Updates all portal links with test parameters if present
    static updateAllPortalLinks() {
        const urlParams = new URLSearchParams(window.location.search);
        const testMemberId = urlParams.get('testMemberId');
        const testAccountEmail = urlParams.get('testAccountEmail');
        const testAccountType = urlParams.get('testAccountType');
        if(!testMemberId && !testAccountEmail && !testAccountType){
        return;
        }
        const allPortalLinks = document.querySelectorAll('a[href*="/portal/"]');
                
        allPortalLinks.forEach((link) => {
        const currentHref = link.getAttribute('href');
        
        // Skip if no href
        if (!currentHref) {
            return;
        }
        
        // Check if it's a portal URL (starts with /portal/ or contains /portal/)
        if (currentHref.startsWith('/portal/') || currentHref.includes('/portal/')) {
            try {
            // Create URL object
            const url = new URL(currentHref, window.location.origin);
            
            // Add or update testMemberId parameter
            url.searchParams.set('testMemberId', testMemberId);
            
            // Add or update testAccountEmail parameter
            url.searchParams.set('testAccountEmail', testAccountEmail);
            
            // Add or update testAccountType parameter
            url.searchParams.set('testAccountType', testAccountType);
            
            // Update the link
            link.setAttribute('href', url.pathname + url.search);
            } catch (error) {
            console.error('Error updating link:', error);
            }
        }
        });
    }
}


