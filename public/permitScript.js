/* Global variables */
var permitHiker;
var permitName;
var permitDate;
var permitSearchName;
var permitSearchHiker;

/* Helper functions */
function removeAllChildNodes(element) {
  /* Removes all child nodes of a DOM element, primarily intended to remove
   *  items in a list.
   *  Accepts:
   *    element(DOM element): Element whose children need to be modified.
   *  Returns:
   *    Null
   */
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function permitAddCardSwitch(domShowString, domHideString, clearName) {
  /* Switches the div in this page location, clearing the list.
   *  Optionally also clears the hiker name we are searching for.
   * Accepts:
   *  domShowString (string): the id of the DOM element to be shown
   *  domHideString (string): the id of the DOM element to be hidden
   *  clearName (BOOL): whether or not we clear the values of permit add form
   * Returns:
   *  Null
   */
  if (clearName) {
    document.getElementById("permitAddHikerName").value = "";
    document.getElementById("permitAddPermitName").value = "";
    document.getElementById("permitAddIssueDate").value = "";
  }
  document.getElementById(domShowString).style.display = "block";
  removeAllChildNodes(document.getElementById("permitAddConfirmationList"));
  document.getElementById(domHideString).style.display = "none";
}

function permitSearchCardSwitch(domShowString, domHideString, clearForm) {
  /* Switches the div in this page location, clearing the table body.
   *  Optionally also clears the hiker name we are searching for.
   * Accepts:
   *  domShowString (string): the id of the DOM element to be shown
   *  domHideString (string): the id of the DOM element to be hidden
   *  clearForm (BOOL): whether or not we clear the values in form
   * Returns:
   *  Null
   */
  if (clearForm) {
    document.getElementById("permitSearchHiker").value = "";
    document.getElementById("permitSearchPermitType").value = "";
  }
  document.getElementById(domShowString).style.display = "block";
  removeAllChildNodes(document.getElementById("permitSearchResultsTableBody"));
  document.getElementById(domHideString).style.display = "none";
}

/* ADDING A PERMIT DIVS */

/* Used when a user hits "Submit" on Permit Add card button */
document
  .getElementById("permitAddForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    permitHiker = document.getElementById("permitAddHikerName").value;
    permitName = document.getElementById("permitAddPermitName")
      .selectedOptions[0].textContent;
    permitDate = document.getElementById("permitAddIssueDate").value;
    if (permitHiker == "" || permitName == "" || permitDate == "") {
      alert(
        "Please make sure to add a permit name, choose a permit type, and add a permit issue date."
      );
      return;
    }

    permitAddCardSwitch("permitAddConfirmation", "permitAdd", false);
    let permitListName = document.createElement("li");
    permitListName.innerHTML = `Hiker Name: ${permitHiker}`;
    document
      .getElementById("permitAddConfirmationList")
      .appendChild(permitListName);
    let permitListPermit = document.createElement("li");
    permitListPermit.innerHTML = `Permit name: ${permitName}`;
    document
      .getElementById("permitAddConfirmationList")
      .appendChild(permitListPermit);
    let permitListDate = document.createElement("li");
    permitListDate.innerHTML = `Date Issued: ${permitDate}`;
    document
      .getElementById("permitAddConfirmationList")
      .appendChild(permitListDate);
  });

/* Used when a user hits "Please Add This Permit" on Permit Add Confirmation
 * button */
document
  .getElementById("permitAddConfirmationOK")
  .addEventListener("click", async function (event) {
    event.preventDefault();

    hiker = document.getElementById("permitAddHikerName").value;
    permitId = document.getElementById("permitAddPermitName").value;
    permitDate = document.getElementById("permitAddIssueDate").value;
    try {
      await fetch("/permit", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "cmd": "add",
          hiker,
          permitId,
          permitDate,
        }),
      });
      permitAddCardSwitch("permitAddConfirmed", "permitAddConfirmation", true);
    } catch (err) {
      permitAddCardSwith("permitAddError", "permitAddConfirmation", false);
    }
  });

/* Used when a user hits "No thanks" on Permit Add Confirmation button */
document
  .getElementById("permitAddConfirmationRedo")
  .addEventListener("click", function (event) {
    permitAddCardSwitch("permitAdd", "permitAddConfirmation", false);
  });

/* Used when a user hits "Add Another Permit" on Permit Add Confirmed button */
document
  .getElementById("permitAddConfirmedButton")
  .addEventListener("click", function (event) {
    permitAddCardSwitch("permitAdd", "permitAddConfirmed", true);
  });

/* Used when a user hits "Try Again" on Permit Add Error button */
document
  .getElementById("permitAddErrorButton")
  .addEventListener("click", function (event) {
    permitAddCardSwitch("permitAdd", "permitAddError", false);
  });

/*  EVENT LISTENERS FOR PERMIT SEARCH DIVS*/

/* Used when a user hits "Submit" on Permit Search card button */
document
  .getElementById("permitSearchForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    permitSearchHiker = document.getElementById("permitSearchHiker").value;
    permitSearchId = document.getElementById("permitSearchPermitType").value;

    if (permitSearchHiker == "" && permitSearchName == "") {
      alert("To search, please enter a hiker name or select a permit type.");
      return;
    } else {
      try {
        const resp = await fetch(
          `/permit?cmd=permitSearch&permitSearchHiker=${permitSearchHiker}&permitSearchId=${permitSearchId}`
        );
        const result = await resp.json();
        if (!result.length) {
          permitSearchCardSwitch(
            "permitSearchNoResults",
            "permitSearch",
            false
          );
          return;
        }
        permitSearchCardSwitch("permitSearchResults", "permitSearch", true);
        const tBody = document.getElementById("permitSearchResultsTableBody");
        result.forEach((row) => {
          const tr = document.createElement("tr");
          ["hikerName", "permitName", "issueDate"].forEach((key) => {
            const td = document.createElement("td");
            td.appendChild(document.createTextNode(row[key]));
            tr.appendChild(td);
          });
          tBody.appendChild(tr);
        });
      } catch (err) {
        permitSearchCardSwitch("permitSearchError", "permitSearch", false);
      }
    }
  });

/* Used when a user hits "Search Again" on Permit Search card button */
document
  .getElementById("permitSearchResultsButton")
  .addEventListener("click", function (event) {
    permitSearchCardSwitch("permitSearch", "permitSearchResults", true);
  });

/* Used when a user hits "Try Search Again" on Permit Search No Results card
 *  button */
document
  .getElementById("permitSearchNoResultsButton")
  .addEventListener("click", function (event) {
    permitSearchCardSwitch("permitSearch", "permitSearchNoResults", false);
  });

/* Used when a user clicks "Try Search Again" on Permit Search Error card
 *  button */
document
  .getElementById("permitSearchErrorButton")
  .addEventListener("click", function (event) {
    permitSearchCardSwitch("permitSearch", "permitSearchError", false);
  });
