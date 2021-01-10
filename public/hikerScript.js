/* Global variables */
var hikerAddName;
var hikerSearchName;

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

function hikerAddCardSwitch(domShowString, domHideString, clearName) {
  /* Changes the displayed card in the hikerAdd div, optionally clearing
   *  the name.
   * Accepts:
   *  domShowString (string): the id of the DOM element to be shown
   *  domHideString (string): the id of the DOM element to be hidden
   *  clearName (BOOL): whether or not we clear the value of hikerName
   * Returns:
   *  Null
   */
  if (clearName) {
    document.getElementById("hikerAddName").value = "";
  }
  document.getElementById(domShowString).style.display = "block";
  removeAllChildNodes(document.getElementById("hikerAddConfirmationList"));
  document.getElementById(domHideString).style.display = "none";
}

function hikerSearchCardSwitch(domShowString, domHideString, clearName) {
  /* Switches the div in this page location, clearing the table body.
   *  Optionally also clears the hiker name we are searching for.
   * Accepts:
   *  domShowString (string): the id of the DOM element to be shown
   *  domHideString (string): the id of the DOM element to be hidden
   *  clearName (BOOL): whether or not we clear the value of hikerName
   * Returns:
   *  Null
   */
  if (clearName) {
    document.getElementById("hikerSearchName").value = "";
  }
  document.getElementById(domShowString).style.display = "block";
  removeAllChildNodes(document.getElementById("hikerSearchResultsTableBody"));
  document.getElementById(domHideString).style.display = "none";
}

/* HIKER ADD DIVS */

/* Used when a hiker name is added and button is clicked. */
document
  .getElementById("hikerAddForm")
  .addEventListener("submit", function (event) {
    hikerAddName = document.getElementById("hikerAddName");
    // Check to make sure there's a hiker name. Should already be done in broswer
    if (hikerAddName.value == "") {
      alert("Please make sure your hiker has a name.");
      hikerAddName.style.border = "2px solid red";
    }
    // Hiker has name
    else {
      // Reset the border of the input
      hikerAddName.style.border = "1px solid black";
      // turn off current div and turn on confirmation div
      hikerAddCardSwitch("hikerAddConfirmation", "hikerAdd", false);
      // Put hiker name in the confirmation list.
      var hikerName = hikerAddName.value;
      var hikerAddConfirmationList = document.getElementById(
        "hikerAddConfirmationList"
      );
      var nameItem = document.createElement("li");
      nameItem.innerHTML = hikerName;
      hikerAddConfirmationList.appendChild(nameItem);

      event.preventDefault();
    }
  });

/* Used when a hiker hits "redo" on the hiker add confirmation card. */
document
  .getElementById("hikerAddConfirmationRedo")
  .addEventListener("click", function (event) {
    //Clear list and change card blocks
    hikerAddCardSwitch("hikerAdd", "hikerAddConfirmation", false);
  });

/* Used when a hiker hits confirm on the hiker add confirmation card. */
document
  .getElementById("hikerAddConfirmationConfirm")
  .addEventListener("click", async function (event) {
    try {
      await fetch("/hiker", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "cmd": "add",
          "name": document.getElementById("hikerAddName").value,
        }),
      });
      hikerAddCardSwitch("hikerAddConfirmed", "hikerAddConfirmation", true);
    } catch (err) {
      hikerAddCardSwitch("hikerAddError", "hikerAddConfirmation", false);
    }
  });

/* Used when a hiker hits "Add Another Hiker" on confirmed card button */
document
  .getElementById("hikerAddConfirmedButton")
  .addEventListener("click", function (event) {
    // Clear list and change card blocks
    hikerAddCardSwitch("hikerAdd", "hikerAddConfirmed", true);
  });

/* Used when a hiker hits 'Try Again' on error card button */
document
  .getElementById("hikerAddErrorButton")
  .addEventListener("click", function (event) {
    // Clear list and change card blocks
    hikerAddCartSwitch("hikerAdd", "hikerAddError", false);
  });

/* HIKER SEARCH DIVS */

/* Used when a hiker name is searched and button is clicked. */

document
  .getElementById("hikerSearchForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    hikerSearchName = document.getElementById("hikerSearchName");
    try {
      const resp = await fetch(
        `/hiker?cmd=hikerSearch&hikerName=${hikerSearchName.value}`
      );
      const result = await resp.json();
      if (!result.length) {
        hikerSearchCardSwitch("hikerSearchNoResults", "hikerSearch", false);
        return;
      }
      hikerSearchCardSwitch("hikerSearchResults", "hikerSearch", false);
      const tBody = document.getElementById("hikerSearchResultsTableBody");
      result.forEach((row) => {
        const tr = document.createElement("tr");
        ["name", "joined_at"].forEach((key) => {
          const td = document.createElement("td");
          td.appendChild(document.createTextNode(row[key]));
          tr.appendChild(td);
        });
        tBody.appendChild(tr);
      });
    } catch (err) {
      hikerSearchCardSwitch("hikerSearchError", "hikerSearch", false);
    }
  });

/* Used when a user hits 'Search Again' on hiker Search Results card button */
document
  .getElementById("hikerSearchResultsButton")
  .addEventListener("click", function (event) {
    // Clear table and return to hikerSearch
    hikerSearchCardSwitch("hikerSearch", "hikerSearchResults", true);
  });

/* Used when a user hits 'Try Search Again' on hiker Search No Results card
 *  button. */
document
  .getElementById("hikerSearchNoResultsButton")
  .addEventListener("click", function (event) {
    // Clear table and return to hikerSearch
    hikerSearchCardSwitch("hikerSearch", "hikerSearchNoResults", false);
  });

/* Used when a user hits 'Try Search Again' on hiker Search Error card button.
 * */
document
  .getElementById("hikerSearchErrorButton")
  .addEventListener("click", function (event) {
    // Clear table and return to hikerSearch
    hikerSearchCardSwitch("hikerSearch", "hikerSearchError", false);
  });
