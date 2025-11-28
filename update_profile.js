/*
Purpose: Update profile modal that loads member details, pre-fills the form, and submits changes.

Brief Logic: Fetches member data from API and populates form fields. Handles form submission to update member information via API endpoint.

Are there any dependent JS files: No
*/
class updateMember {
  $editMemberData = [];
  constructor(data) {
    this.memberId = data.memberId;
    this.baseUrl = data.baseUrl;
    setTimeout(() => {
      this.getMemberData();
    }, 2000);
    this.handleEditMember();
    this.handleUpdateProfileBtn();
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
      console.error("Error fetching data:", error);
      throw error;
    }
  }
  /**
   * Get family member data based on memberId
   */
  async getMemberData() {
    var $this = this;
    var update_profile = document.querySelectorAll(".update_profile");
    //var spinner = document.getElementById("half-circle-spinner");
    //spinner.style.display = "block";
    update_profile.forEach(el => el.style.display = 'none');
    $this.$editMemberData = await this.fetchData("getItemId/" + this.memberId);
    console.log("itemIdData", $this.$editMemberData);
    if($this.$editMemberData){
      update_profile.forEach(el => el.style.display = 'block');
    }
    //spinner.style.display = "none";
    return $this.$editMemberData;
  }

  handleUpdateProfileBtn() {
    var $this = this;
    var update_profiles = document.querySelectorAll(".update_profile");
    update_profiles.forEach(update_profile => {
      update_profile.addEventListener("click", function (event) {
        event.preventDefault();
        let editMemberModal = document.getElementById("update-profile-modal");
        $this.updateSuppData($this.$editMemberData);
        $this.openModal(editMemberModal);
      });
    });
    const closeLinks = document.querySelectorAll('.upsell-close-link');
    closeLinks.forEach(closeLink => {
      closeLink.addEventListener("click", function (event) {
        event.preventDefault();
        let editMemberModal = document.getElementById("update-profile-modal");
        $this.closeModal(editMemberModal);
      });
    });
  }

  // Update student data for addon supplementary program purchase
  updateSuppData(data) {
    var studentFirstName = document.getElementById("Student-First-Name");
    var studentLastName = document.getElementById("Student-Last-Name");
    var studentEmail = document.getElementById("Student-Email");
    var studentGrade = document.getElementById("Student-Grade");
    var parentPhone = document.getElementById("parent-phone");
    var studentSchool = document.getElementById("Student-School");
    var studentGender = document.getElementById("Student-Gender");
    if (data.accountType == "parent") {
      parentPhone.closest("div").classList.remove("hide");
      studentGrade.closest("div").classList.add("hide");
    } else {
      parentPhone.closest("div").classList.add("hide");
      studentGrade.closest("div").classList.remove("hide");
      if (!data.itemId) {
        studentGrade.closest("div").classList.add("hide");
      } else {
        studentGrade.closest("div").classList.remove("hide");
      }
    }

    if (data != null) {
      studentEmail.value = data.email;
      studentFirstName.value = data.firstName;
      studentLastName.value = data.lastName;

      if (data.studentGrade) {
        studentGrade.value = data.studentGrade;
      }
      if (data.parentPhoneNumber) {
        parentPhone.value = data.parentPhoneNumber;
      }
    }
  }

  handleEditMember() {
    var $this = this;
    const editMemberBtn = document.getElementById("editMemberBtn");
    editMemberBtn.addEventListener("click", function () {
      editMemberBtn.innerHTML = "Processing...";
      editMemberBtn.classList.add("disabled");
      editMemberBtn.style.pointerEvents = "none";
      $this.editMemberInfo($this.$editMemberData);
    });
  }
  closeModal(modal) {
    if (modal) {
      modal.classList.remove("show");
      modal.style.display = "none";
    }
  }
  openModal(modal) {
    if (modal) {
      modal.classList.add("show");
      modal.style.display = "flex";
    }
  }
  editMemberInfo(memberData) {
    var $this = this;
    var studentFirstName = document.getElementById("Student-First-Name");
    var studentLastName = document.getElementById("Student-Last-Name");
    var studentEmail = document.getElementById("Student-Email");
    var studentGrade = document.getElementById("Student-Grade");
    var parentPhone = document.getElementById("parent-phone");
    const editMemberBtn = document.getElementById("editMemberBtn");
    var data = {
      memberId: this.memberId,
      oldLastName: memberData.lastName,
      oldFirstName: memberData.firstName,
      oldEmailId: memberData.email,
      oldPhoneNo: memberData.parentPhoneNumber,
      oldGrade: memberData.studentGrade,
      newEmailId: studentEmail.value,
      newFirstName: studentFirstName.value,
      newLastName: studentLastName.value,
      newPhoneNo: parentPhone.value,
      newGrade: studentGrade.value,
      itemId: memberData.itemId ? memberData.itemId : "",
    };
    console.log("data", data);

    var xhr = new XMLHttpRequest();
    var $this = this;
    xhr.open("POST", $this.baseUrl + "updateMemberStack", true);
    xhr.withCredentials = false;
    xhr.send(JSON.stringify(data));
    xhr.onload = function () {
      let responseText = JSON.parse(xhr.responseText);
      console.log(xhr.responseText, responseText);
      const addFamilyMemberEditModals = document.querySelector(
        ".update-profile-modal"
      );
      $this.getMemberData().then((data) => {
        setTimeout(() => {
          console.log("updated");
          $this.closeModal(addFamilyMemberEditModals);
          $this.updateUserName(studentFirstName.value);
          editMemberBtn.innerHTML = "Save";
          editMemberBtn.classList.remove("disabled");
          editMemberBtn.style.pointerEvents = "auto";
        }, 1000);
      });
    };
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log(xhr.responseText);
        } else {
          console.log("Error", xhr.statusText);
          alert(
            "Unable to update your profile. Please contact to administration"
          );
          editMemberBtn.innerHTML = "Save";
          editMemberBtn.classList.remove("disabled");
          editMemberBtn.style.pointerEvents = "auto";
        }
      }
    };
  }
  updateUserName(studentFirstName) {
    const wlcTextEl = document.querySelectorAll("[data-portal='heading']");
    wlcTextEl.forEach(function (wlcText) {
      wlcText.innerHTML = "Welcome, " + studentFirstName + "!";
      console.log(wlcTextEl, studentFirstName);
    });
  }
}
