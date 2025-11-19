/**
 * Utility class for NSD functionality
 */
class NSDUtilityClass {
    /**
     * checks if the webflowMemberId is NSD
     */
    static setupAdminViewListener(webflowMemberId) {
        if (webflowMemberId === "639ae841e3d1790004f29b80") {
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
                `;

            const style = document.createElement("style");
            style.innerHTML = css;
            document.head.appendChild(style);
            return true
        }
        return false;
    }
}