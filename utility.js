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
}


