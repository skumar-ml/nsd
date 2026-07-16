/*
Purpose: Loader for the family member grid that fetches household profiles, sorts them, and wires edit actions.

Brief Logic: Fetches family member data from API endpoint and sorts it with current member first. Displays sorted members in a grid with edit/delete functionality based on account type and permissions.

Are there any dependent JS files: No
*/
var AUTH_API_BASE = window.NSD_API.AUTH_API_BASE
class FamilyMember {
    $editMemberData = []
    // Initializes the FamilyMember instance with provided data and sets up family member display
    constructor(data) {
        this.memberId = data.memberId
        this.authApiBase = AUTH_API_BASE
        this.accountType = data.accountType
        this.displayFamilyMember()
        this.handleEditMember()
    }
    // Fetches data from the API endpoint and returns the response
    async fetchData(baseUrl, endpoint) {
        try {
            const normalizedEndpoint = String(endpoint).replace(/^\/+/, "")
            const response = await fetch(`${baseUrl}/${normalizedEndpoint}`)
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
     * Creates a DOM element with optional class and id attributes
     * @param name - HTML element name
     * @param className - HTML element class attribute
     * @param idName - HTML element id attribute
     */
    creEl(name, className, idName) {
        var el = document.createElement(name)
        if (className) {
            el.className = className
        }
        if (idName) {
            el.setAttribute("id", idName)
        }
        return el
    }
    // Fetches and displays all family member data sorted with current member first
    async displayFamilyMember() {
        var spinner = document.getElementById("half-circle-spinner")
        spinner.style.display = "block"
        var familyData = await this.fetchData(
            this.authApiBase,
            "/getAllFamilyData/" + this.memberId,
        )
        console.log("family Data", familyData)
        const FamilyMemberWrapper = document.querySelector(
            ".family-member-grid-wrapper",
        )
        FamilyMemberWrapper.innerHTML = ""
        familyData = this.sortDataBasedOnMemberId(familyData, this.memberId)
        familyData.forEach((element) => {
            let singleFamily = this.getSingleFamilyData(element)
            FamilyMemberWrapper.appendChild(singleFamily)
        })
        spinner.style.display = "none"
    }

    // Sorts the data array to move the target member ID to the front
    sortDataBasedOnMemberId(data, targetId) {
        data.sort((a, b) => {
            if (a.memberId) {
                if (a.memberId === targetId) return -1 // Move target ID to the front
                if (b.memberId === targetId) return 1
                return 0 // Keep other order the same
            }
        })
        return data
    }
    // Converts a date string to MM/DD/YYYY format
    convertDate(dateString) {
        if (dateString) {
            const date = new Date(dateString)
            const month = (date.getMonth() + 1).toString().padStart(2, "0") // Months are 0-based
            const day = date.getDate().toString().padStart(2, "0")
            const year = date.getFullYear()
            return `${month}/${day}/${year}`
        }
    }
    // Determines the member type based on createdOn and itemId properties
    getMemberType(data) {
        let memberType = "sign-up"
        if (!data.createdOn) {
            memberType = "invited"
        } else if (!data.itemId) {
            memberType = "not-sign-up"
        }
        return memberType
    }
    // Creates and returns a DOM element representing a single family member card
    getSingleFamilyData(data) {
        const memberType = this.getMemberType(data)
        var $this = this
        const familyMemberContainer = this.creEl(
            "div",
            "family-member-vertical-flex-container",
        )

        const nameParagraph = this.creEl("p", "dm-sans bold-text")
        nameParagraph.innerHTML = data.firstName + " " + data.lastName + "<br>"
        familyMemberContainer.appendChild(nameParagraph)

        const emailLink = this.creEl("a")
        emailLink.href = "#"
        emailLink.classList.add("any-link")
        const emailParagraph = this.creEl("p", "dm-sans")
        emailParagraph.textContent = data.email
        emailLink.appendChild(emailParagraph)
        familyMemberContainer.appendChild(emailLink)

        const roleParagraph = this.creEl("p", "dm-sans italics")
        roleParagraph.innerHTML =
            memberType != "invited"
                ? data.accountType
                : "Invited member" + "<br>"
        familyMemberContainer.appendChild(roleParagraph)

        const accountNotCreatedClass = !data.memberId
            ? "account-not-created"
            : ""
        const createdOnParagraph = this.creEl(
            "p",
            "dm-sans " + accountNotCreatedClass,
        )
        createdOnParagraph.textContent =
            memberType == "sign-up"
                ? "Created On - " + this.convertDate(data.createdOn)
                : "Account not created yet"
        familyMemberContainer.appendChild(createdOnParagraph)

        if (this.accountType == "parent" || this.memberId == data.memberId) {
            const btn_color =
                memberType != "invited" ? "transparent-red" : "red"
            const editButton = this.creEl(
                "a",
                "main-button " + btn_color + " edit-btn w-button",
            )
            editButton.href = "#"
            editButton.textContent = memberType != "invited" ? "Edit" : "Delete"
            editButton.addEventListener("click", function (event) {
                $this.$editMemberData = data
                if (memberType != "invited") {
                    $this.updateSuppData(data)
                    const addFamilyMemberEditModals = document.querySelector(
                        ".add-family-member-edit-modal",
                    )
                    addFamilyMemberEditModals.classList.add("show")
                    addFamilyMemberEditModals.style.display = "flex"
                } else {
                    editButton.innerHTML = "Processing..."
                    $this.deleteInvitedMember(data)
                    event.preventDefault()
                }
            })
            familyMemberContainer.appendChild(editButton)
        } else {
            let emptyEl = this.creEl(
                "a",
                "main-button transparent-red edit-btn w-button visibility-hidden",
            )
            emptyEl.innerHTML = "&nbsp"
            familyMemberContainer.appendChild(emptyEl)
        }
        // return the constructed element to parent container
        return familyMemberContainer
    }

    // Updates form fields with student data for supplementary program purchase
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
    }

    // Sets up event handlers for editing member information and manages add family member button visibility
    handleEditMember() {
        var $this = this
        const editMemberBtn = document.getElementById("editMemberBtn")
        editMemberBtn.addEventListener("click", function () {
            editMemberBtn.innerHTML = "Processing..."
            editMemberBtn.classList.add("disabled")
            editMemberBtn.style.pointerEvents = "none"
            $this.editMemberInfo($this.$editMemberData)
        })
        //only parent can invite the member
        if ($this.accountType != "parent") {
            let addFamilyMember = document.getElementById(
                "add-family-member-btn",
            )
            addFamilyMember.style.display = "none"
        }
    }
    // Closes the specified modal by removing show class and hiding it
    closeModal(modal) {
        if (modal) {
            modal.classList.remove("show")
            modal.style.display = "none"
        }
    }
    // Resets the Save button after the update request finishes
    resetEditMemberBtn() {
        const editMemberBtn = document.getElementById("editMemberBtn")
        if (!editMemberBtn) return
        editMemberBtn.innerHTML = "Save"
        editMemberBtn.classList.remove("disabled")
        editMemberBtn.style.pointerEvents = "auto"
    }
    // Sends updated member information to the API and refreshes the family member display
    editMemberInfo(memberData) {
        var $this = this
        var studentFirstName = document.getElementById("Student-First-Name")
        var studentLastName = document.getElementById("Student-Last-Name")
        var studentEmail = document.getElementById("Student-Email")
        var studentGrade = document.getElementById("Student-Grade")
        var parentPhone = document.getElementById("parent-phone")
        var data = {
            leadId: memberData.id ? memberData.id : "",
            newEmailId: studentEmail.value,
            newFirstName: studentFirstName.value,
            newLastName: studentLastName.value,
            newPhoneNo: parentPhone.value,
            newGrade: studentGrade.value
        }
        console.log("data", data)
        var xhr = new XMLHttpRequest()
        xhr.open("POST", this.authApiBase + "/updateMemberStack", true)
        xhr.withCredentials = false
        xhr.send(JSON.stringify(data))
        xhr.onload = function () {
            if (xhr.status !== 200) {
                console.log("Error", xhr.statusText)
                $this.resetEditMemberBtn()
                return
            }
            try {
                let responseText = JSON.parse(xhr.responseText)
                console.log(xhr.responseText, responseText)
            } catch (error) {
                console.log("Error parsing response", error)
            }
            const addFamilyMemberEditModals = document.querySelector(
                ".add-family-member-edit-modal",
            )
            $this.closeModal(addFamilyMemberEditModals)
            $this.resetEditMemberBtn()
            $this.displayFamilyMember()
        }
        xhr.onerror = function () {
            console.log("Network error while updating family member")
            $this.resetEditMemberBtn()
        }
    }
    // Deletes an invited member from the system via API call
    deleteInvitedMember(memberData) {
        var $this = this
        var xhr = new XMLHttpRequest()
        var $this = this
        xhr.open(
            "DELETE",
            this.authApiBase + "/deleteInvitedMember/" + memberData.email,
            true,
        )
        xhr.withCredentials = false
        xhr.send()
        xhr.onload = function () {
            let responseText = JSON.parse(xhr.responseText)
            console.log(xhr.responseText, responseText)
            $this.displayFamilyMember()
        }
    }
}
