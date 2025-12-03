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

    this.googleReviewData = localStorage.getItem("googleReviewData")
      ? JSON.parse(atob(localStorage.getItem("googleReviewData")))
      : {};

    this.clearGoogleReviewData(); // Clear if student changed

    this.init();
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

    const oneDayAfterEndDate = new Date(endDate);
    oneDayAfterEndDate.setDate(endDate.getDate() + 1);

    
    if (currentDate >= startDate && currentDate < oneDayAfterEndDate) {
      const totalCampDuration = endDate - startDate;
      const elapsedCampDuration = currentDate - startDate;
      const completionPercentage = (elapsedCampDuration / totalCampDuration) * 100;

      const today = new Date().toISOString().split("T")[0];
      const lastShownDate = this.googleReviewData.lastShownDate || "";

      if (lastShownDate === today) {
       // console.log("Modal already shown today.");
        return;
      }

      if (completionPercentage >= 75) {
        this.showModal();
        this.updateGoogleReviewData({ lastShownDate: today });
      }
    }
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


