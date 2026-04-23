/*
Purpose: Update profile modal that loads member details, pre-fills the form, and submits changes.

Brief Logic: Fetches member data from API and populates form fields. Handles form submission to update member information via API endpoint.

Are there any dependent JS files: No
*/
var AUTH_API_BASE = window.NSD_API.AUTH_API_BASE
class updateMember {
    $editMemberData = []
    constructor(data) {
        this.memberId = data.memberId
        setTimeout(() => {
            this.getMemberData()
        }, 2000)
        this.handleEditMember()
        this.handleUpdateProfileBtn()
        this.attachEditProfileValidation()
    }
    // Get API data with the help of endpoint
    async fetchData(endpoint) {
        try {
            const response = await fetch(endpoint)
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const data = await response.json()
            return data
        } catch (error) {
            console.error("Error fetching data:", error)
            throw error
        }
    }
    /**
     * Get family member data based on memberId
     */
    async getMemberData() {
        var $this = this
        var update_profile = document.querySelectorAll(".update_profile")
        //var spinner = document.getElementById("half-circle-spinner");
        //spinner.style.display = "block";
        update_profile.forEach((el) => (el.style.display = "none"))
        // Preferred route from current API list.
        $this.$editMemberData = await this.fetchData(
            AUTH_API_BASE + "/getItemId/" + this.memberId,
        )
        console.log("itemIdData", $this.$editMemberData)
        if ($this.$editMemberData) {
            update_profile.forEach((el) => (el.style.display = "block"))
        }
        //spinner.style.display = "none";
        return $this.$editMemberData
    }
    // Handles the update profile button click event
    handleUpdateProfileBtn() {
        var $this = this
        var update_profiles = document.querySelectorAll(".update_profile")
        update_profiles.forEach((update_profile) => {
            update_profile.addEventListener("click", function (event) {
                event.preventDefault()
                let editMemberModal = document.getElementById(
                    "update-profile-modal",
                )
                $this.updateSuppData($this.$editMemberData)
                $this.openModal(editMemberModal)
            })
        })
        const closeLinks = document.querySelectorAll(".upsell-close-link")
        closeLinks.forEach((closeLink) => {
            closeLink.addEventListener("click", function (event) {
                event.preventDefault()
                let editMemberModal = document.getElementById(
                    "update-profile-modal",
                )
                $this.closeModal(editMemberModal)
            })
        })
    }

    // Update student data for addon supplementary program purchase
    updateSuppData(data) {
        var studentFirstName = document.getElementById("Student-First-Name")
        var studentLastName = document.getElementById("Student-Last-Name")
        var studentEmail = document.getElementById("Student-Email")
        var studentGrade = document.getElementById("Student-Grade")
        var parentPhone = document.getElementById("parent-phone")
        var studentSchool = document.getElementById("Student-School")
        var studentGender = document.getElementById("Student-Gender")
        if (data.accountType == "parent") {
            parentPhone.closest("div").classList.remove("hide")
            studentGrade.closest("div").classList.add("hide")
        } else {
            parentPhone.closest("div").classList.add("hide")
            studentGrade.closest("div").classList.remove("hide")
            if (!data.itemId) {
                studentGrade.closest("div").classList.add("hide")
            } else {
                studentGrade.closest("div").classList.remove("hide")
            }
        }

        if (data != null) {
            studentEmail.value = data.email
            studentFirstName.value = data.firstName
            studentLastName.value = data.lastName

            if (data.studentGrade) {
                studentGrade.value = data.studentGrade
            }
            if (data.parentPhoneNumber) {
                parentPhone.value = data.parentPhoneNumber
            }
        }
        this.updateEditMemberBtnState()
    }

    // Determines whether a field should be validated in current UI state
    isVisibleField(element) {
        if (!element) return false
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    }

    // Validates required edit profile fields
    isEditProfileFormValid() {
        var studentFirstName = document.getElementById("Student-First-Name")
        var studentLastName = document.getElementById("Student-Last-Name")
        var studentEmail = document.getElementById("Student-Email")
        var studentGrade = document.getElementById("Student-Grade")
        var parentPhone = document.getElementById("parent-phone")

        var requiredFields = [studentFirstName, studentLastName, studentEmail]
        if (this.isVisibleField(studentGrade)) requiredFields.push(studentGrade)
        if (this.isVisibleField(parentPhone)) requiredFields.push(parentPhone)

        return requiredFields.every((field) => field && field.value.trim() !== "")
    }

    // Toggles Save button based on edit profile validation
    updateEditMemberBtnState() {
        const editMemberBtn = document.getElementById("editMemberBtn")
        if (!editMemberBtn) return

        const isValid = this.isEditProfileFormValid()
        editMemberBtn.classList.toggle("disabled", !isValid)
        editMemberBtn.style.pointerEvents = isValid ? "auto" : "none"
        editMemberBtn.style.opacity = isValid ? "1" : "0.6"
        editMemberBtn.style.filter = isValid ? "none" : "grayscale(100%)"
        editMemberBtn.style.cursor = isValid ? "pointer" : "not-allowed"
    }

    // Adds real-time validation handlers for edit profile fields
    attachEditProfileValidation() {
        const fieldIds = [
            "Student-First-Name",
            "Student-Last-Name",
            "Student-Email",
            "Student-Grade",
            "parent-phone",
        ]
        fieldIds.forEach((fieldId) => {
            const field = document.getElementById(fieldId)
            if (!field) return
            field.addEventListener("input", () => this.updateEditMemberBtnState())
            field.addEventListener("change", () => this.updateEditMemberBtnState())
        })

        this.updateEditMemberBtnState()
    }

    // Handles the edit member button click event
    handleEditMember() {
        var $this = this
        const editMemberBtn = document.getElementById("editMemberBtn")
        editMemberBtn.addEventListener("click", function () {
            if (!$this.isEditProfileFormValid()) {
                $this.updateEditMemberBtnState()
                return
            }
            editMemberBtn.innerHTML = "Processing..."
            editMemberBtn.classList.add("disabled")
            editMemberBtn.style.pointerEvents = "none"
            $this.editMemberInfo($this.$editMemberData)
        })
    }
    closeModal(modal) {
        if (modal) {
            modal.classList.remove("show")
            modal.style.display = "none"
        }
    }
    openModal(modal) {
        if (modal) {
            modal.classList.add("show")
            modal.style.display = "flex"
        }
    }
    // Updates the member information
    editMemberInfo(memberData) {
        var $this = this
        var studentFirstName = document.getElementById("Student-First-Name")
        var studentLastName = document.getElementById("Student-Last-Name")
        var studentEmail = document.getElementById("Student-Email")
        var studentGrade = document.getElementById("Student-Grade")
        var parentPhone = document.getElementById("parent-phone")
        const editMemberBtn = document.getElementById("editMemberBtn")
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
        }
        console.log("data", data)

        var xhr = new XMLHttpRequest()
        var $this = this
        const resetEditButton = () => {
            editMemberBtn.innerHTML = "Save"
            $this.updateEditMemberBtnState()
        }
        xhr.open("POST", AUTH_API_BASE + "/updateMemberStack", true)
        xhr.withCredentials = false
        xhr.send(JSON.stringify(data))
        xhr.onload = function () {
            if (xhr.status !== 200) {
                console.log("Error", xhr.statusText)
                alert(
                    "Unable to update your profile. Please contact to administration",
                )
                resetEditButton()
                return
            }
            try {
                let responseText = JSON.parse(xhr.responseText)
                console.log(xhr.responseText, responseText)
            } catch (error) {
                console.log("Error parsing response", error)
            }
            const addFamilyMemberEditModals = document.querySelector(
                ".update-profile-modal",
            )
            $this.getMemberData()
                .then(() => {
                    setTimeout(() => {
                        console.log("updated")
                        $this.closeModal(addFamilyMemberEditModals)
                        $this.updateUserName(studentFirstName.value)
                        resetEditButton()
                    }, 1000)
                })
                .catch((error) => {
                    console.log("Error refreshing member data", error)
                    resetEditButton()
                })
        }
        xhr.onerror = function () {
            console.log("Network error while updating member profile")
            alert("Unable to update your profile. Please contact to administration")
            resetEditButton()
        }
    }
    updateUserName(studentFirstName) {
        const wlcTextEl = document.querySelectorAll("[data-portal='heading']")
        wlcTextEl.forEach(function (wlcText) {
            wlcText.innerHTML = "Welcome, " + studentFirstName + "!"
            console.log(wlcTextEl, studentFirstName)
        })
    }
}
