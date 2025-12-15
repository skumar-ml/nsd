/*
Purpose: Eligibility checker and modal that invites recent students to leave a Google review after completing a program.

Brief Logic: Checks if student is eligible for Google review based on program completion data. Displays modal if eligible and stores review invitation status in localStorage to prevent repeated prompts.

Are there any dependent JS files: No
*/
class GoogleReviewModal {
  // Initializes the Google review modal with member data and sets up event handlers
  constructor(memberData) {
    this.modal = document.getElementById("google-review-modal");
    this.closeButtons = document.querySelectorAll(".google-review-close-link, #may-be-later");
    this.studentEmail = memberData.accountEmail;
    this.memberId = memberData.memberId;
    this.isStudent = memberData.accountType === "student";
    this.baseApiUrl = memberData.baseApiUrl;

    // Allow QA to drive test dates/behaviour via query params
    this.testOverrides = this.getTestOverrides();

    this.googleReviewData = localStorage.getItem("googleReviewData")
      ? JSON.parse(atob(localStorage.getItem("googleReviewData")))
      : {};

    this.clearGoogleReviewData(); // Clear if student changed

    this.init();
  }

  // Reads optional test overrides from the URL, e.g.
  // ?googleReviewTest=1&startDate=2025-06-01&endDate=2025-06-20&forceShow=1
  getTestOverrides() {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("googleReviewTest")) return null;

    const parseDate = (val) => (val ? new Date(val) : null);

    return {
      enabled: true,
      startDate: parseDate(params.get("startDate")),
      endDate: parseDate(params.get("endDate")),
      lastShownDate: params.get("lastShownDate") || null,
      forceShow: params.get("forceShow") === "1" || params.get("forceShow") === "true",
    };
  }

  // Sets up close button event listeners and checks eligibility for review
  init() {
    this.closeButtons.forEach((button) => {
      button.addEventListener("click", () => this.closeModal());
    });

    this.isEligibleForReview();
  }

  // Clears Google review data from localStorage if student email has changed
  clearGoogleReviewData() {
    if (!this.googleReviewData || !this.googleReviewData.studentEmail) return;
    if (this.studentEmail !== this.googleReviewData.studentEmail) {
      this.googleReviewData = {};
      localStorage.removeItem("googleReviewData");
    }
  }

  // Checks if the student is eligible for Google review based on program completion data
  isEligibleForReview() {
    // Test harness: skip network and use query param dates
    if (this.testOverrides?.enabled) {
      const now = new Date();
      const startDate = this.testOverrides.startDate || now;
      const endDate = this.testOverrides.endDate || now;
      const data = {
        startDate,
        endDate,
        memberId: this.memberId,
        studentEmail: this.studentEmail,
      };
      if (this.testOverrides.lastShownDate) {
        data.lastShownDate = this.testOverrides.lastShownDate;
      }
      this.updateGoogleReviewData(data);

      if (this.testOverrides.forceShow) {
        this.showModal();
        const today = new Date().toISOString().split("T")[0];
        this.updateGoogleReviewData({ lastShownDate: today });
      } else {
        this.checkConditionsAndShowModal();
      }
      return;
    }

    if (this.googleReviewData && Object.keys(this.googleReviewData).length > 0) {
      this.checkConditionsAndShowModal();
    } else {
      // Fetch program data
      fetch(`${this.baseApiUrl}getCompletedForm/${this.memberId}/current`)
        .then((response) => response.json())
        .then((campData) => {
          campData = campData.studentData || [];
          const currentStudentData = campData.find(
            (data) => data.studentDetail.studentEmail === this.studentEmail
          );

          if (!currentStudentData) return;

          const { startDate, endDate } = currentStudentData.programDetail;

          const googleReviewData = {
            startDate,
            endDate,
            memberId: this.memberId,
            studentEmail: this.studentEmail,
          };

          this.updateGoogleReviewData(googleReviewData);
          this.checkConditionsAndShowModal();
        })
        .catch((err) => console.error("Error fetching camp data:", err));
    }
  }

  // Updates Google review data in localStorage with new information
  updateGoogleReviewData(data) {
    this.googleReviewData = { ...this.googleReviewData, ...data };
    localStorage.setItem("googleReviewData", btoa(JSON.stringify(this.googleReviewData)));
  }

  // Validates conditions and displays the review modal if eligible
  checkConditionsAndShowModal() {
    if (!this.googleReviewData || !this.isStudent) return;

    const startDate = new Date(this.googleReviewData.startDate);
    const endDate = new Date(this.googleReviewData.endDate);
    // const startDate = new Date("2025-06-13 00:00:00");
    // const endDate = new Date("2025-07-02 23:45:00");

    const currentDate = new Date();

    // Check if camp has started
    if (currentDate < startDate) {
      return;
    }

    // Calculate completion percentage for camps in progress
    const totalCampDuration = endDate - startDate;
    const elapsedCampDuration = currentDate - startDate;
    const completionPercentage = totalCampDuration > 0 
      ? (elapsedCampDuration / totalCampDuration) * 100 
      : 0;

    // Check if camp is finished OR halfway through
    const isCampFinished = currentDate >= endDate;
    const isHalfwayThrough = completionPercentage >= 50 && currentDate < endDate;

    if (!isCampFinished && !isHalfwayThrough) {
      return;
    }

    // Check if modal was shown within the last month
    const lastShownDate = this.googleReviewData.lastShownDate;
    if (lastShownDate) {
      const lastShown = new Date(lastShownDate);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      if (lastShown > oneMonthAgo) {
        // Modal was shown within the last month, don't show again
        return;
      }
    }

    // Show modal and update last shown date
    this.showModal();
    const today = new Date().toISOString().split("T")[0];
    this.updateGoogleReviewData({ lastShownDate: today });
  }

  // Displays the Google review modal by adding show class and setting display to flex
  showModal() {
    this.modal.classList.add("show");
    this.modal.style.display = "flex";
  }

  // Closes the Google review modal by removing show class and hiding it
  closeModal() {
    this.modal.classList.remove("show");
    this.modal.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const memberData = {
    baseApiUrl: "https://3yf0irxn2c.execute-api.us-west-1.amazonaws.com/dev/camp/",
    accountEmail: "vickey.jain@techment.com",
    accountType: "student",
    memberId: "639ae841e3d1790004f29b80",
  };

  new GoogleReviewModal(memberData);
});