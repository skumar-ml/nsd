class GoogleReviewModal {
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

  init() {
    this.closeButtons.forEach((button) => {
      button.addEventListener("click", () => this.closeModal());
    });

    this.isEligibleForReview();
  }

  clearGoogleReviewData() {
    if (!this.googleReviewData || !this.googleReviewData.studentEmail) return;
    if (this.studentEmail !== this.googleReviewData.studentEmail) {
      this.googleReviewData = {};
      localStorage.removeItem("googleReviewData");
    }
  }

  isEligibleForReview() {
    if (this.googleReviewData && Object.keys(this.googleReviewData).length > 0) {
      this.checkConditionsAndShowModal();
    } else {
      // Fetch program data
      fetch(`${this.baseApiUrl}${this.memberId}/current`)
        .then((response) => response.json())
        .then((campData) => {
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

  updateGoogleReviewData(data) {
    this.googleReviewData = { ...this.googleReviewData, ...data };
    localStorage.setItem("googleReviewData", btoa(JSON.stringify(this.googleReviewData)));
  }

  checkConditionsAndShowModal() {
    if (!this.googleReviewData || !this.isStudent) return;

    // const startDate = new Date(this.googleReviewData.startDate);
    // const endDate = new Date(this.googleReviewData.endDate);
    const startDate = new Date("2025-06-13 00:00:00");
    const endDate = new Date("2025-06-25 23:45:00");

    const currentDate = new Date();

    const oneDayAfterEndDate = new Date(endDate);
    oneDayAfterEndDate.setDate(endDate.getDate() + 1);

    console.log("Current Date:", currentDate);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("One Day After End Date:", oneDayAfterEndDate);
    if (currentDate >= startDate && currentDate < oneDayAfterEndDate) {
      const totalCampDuration = endDate - startDate;
      const elapsedCampDuration = currentDate - startDate;
      const completionPercentage = (elapsedCampDuration / totalCampDuration) * 100;

      const today = new Date().toISOString().split("T")[0];
      const lastShownDate = this.googleReviewData.lastShownDate || "";

      if (lastShownDate === today) {
        console.log("Modal already shown today.");
        return;
      }

      if (completionPercentage >= 75) {
        this.showModal();
        this.updateGoogleReviewData({ lastShownDate: today });
      }
    }
  }

  showModal() {
    this.modal.classList.add("show");
    this.modal.style.display = "flex";
  }

  closeModal() {
    this.modal.classList.remove("show");
    this.modal.style.display = "none";
  }
}

