/* Global variables */
var tripReportAddHikerName;
var tripReportAddTrailName;
var tripReportAddDescription;
var tripReportAddTrailConditions;
var tripReportAddWeatherConditions;
var tripReportAddStartTime;
var tripReportAddEndTime;
var tripReportAddRating;
var tripReportAddDifficulty;
var tripReportOtherHiker1;
var tripReportOtherHiker2;
var tripReportOtherHiker3;

var addFormElements = new Object();
var reportList = document.getElementById("viewTripReportsSearchResultsList");


/* Helper functions */

function addFormProcess() {
  /* Assigns variables to the add trail report form input elements.*/
  /* Accepts:
   *  Null
   * Returns:
   *  Object with key:value pairs of the form elements.
   */
  tripReportAddHikerName =
    document.getElementById("tripReportAddHikerName");
  addFormElements.tripReportAddHikerName = tripReportAddHikerName.value;
  tripReportAddTrailName =
    document.getElementById("tripReportAddTrailName");
  addFormElements.tripReportAddTrailName = tripReportAddTrailName.value;
  tripReportAddDescription =
    document.getElementById("tripReportAddDescription");
  addFormElements.tripReportAddDescription = tripReportAddDescription.value;
  tripReportAddTrailConditions = 
    document.getElementById("tripReportAddTrailConditions");
  addFormElements.tripReportAddTrailConditions = 
    tripReportAddTrailConditions.value;
  tripReportAddWeatherConditions = 
    document.getElementById("tripReportAddWeatherConditions");
  addFormElements.tripReportAddWeatherConditions = 
    tripReportAddWeatherConditions.value;
  tripReportAddStartTime = 
    document.getElementById("tripReportAddStartTime");
  addFormElements.tripReportAddStartTime = 
    tripReportAddStartTime.value;
  tripReportAddEndTime = 
    document.getElementById("tripReportAddEndTime");
  addFormElements.tripReportAddEndTime = 
    tripReportAddEndTime.value;
  tripReportAddRating = 
    document.getElementById("tripReportAddRating");
  addFormElements.tripReportAddRating = 
    tripReportAddRating.value;
  tripReportAddDifficulty = 
    document.getElementById("tripReportAddDifficulty");
  addFormElements.tripReportAddDifficulty = 
    tripReportAddDifficulty.value;
  tripReportOtherHiker1 =
    document.getElementById("tripReportOtherHiker1");
  addFormElements.tripReportOtherHiker1 = 
    tripReportOtherHiker1.value;
  tripReportOtherHiker2 =
    document.getElementById("tripReportOtherHiker2");
  addFormElements.tripReportOtherHiker2 = 
    tripReportOtherHiker2.value;
  tripReportOtherHiker3 =
    document.getElementById("tripReportOtherHiker3");
  addFormElements.tripReportOtherHiker3 = 
    tripReportOtherHiker3.value;
  return addFormElements;
}


function errorBorder(element) {
  /* Changes DOM input element border to thick, red.
   * Meant to draw user attention to border.
   * Accepts:
   *  element (DOM input element): element whose border is being changed
   * Returns:
   *  null
   */
  element.style.border = "2px solid red";
}


function goodBorders(arr) {
  /* Changes DOM input elemment border to normal, black.
   * Meant to remove user attention from border.
   * Accepts:
   *  arr (array of DOM input elements): elements whose borders are being
   *    changed
   * Returns:
   *  null
   */
  for (ele in arr) {
  arr[ele].style.border = "1px solid black";
  }
}


function clearChildren(element) {
  /* Removes all children from a DOM element. */
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}


function tripReportAddCardSwitch(domShowString, domHideString, clearData) {
  /* Changes the displayed card in the AddingATripReport div, optionally
   *  clearing the inputted data.
   * Accepts:
   *  domShowString (string): the id of the DOM element to be shown
   *  domHideString (string): the id of the DOM element to be hidden
   *  clearData (BOOL): whether or not we clear the data from the addTripReport
   *    form.
   *  Returns:
   *    null
   */
  if (clearData) {
    var formElements = [
      tripReportAddHikerName,
      tripReportAddTrailName,
      tripReportAddDescription,
      tripReportAddTrailConditions,
      tripReportAddWeatherConditions,
      tripReportAddStartTime,
      tripReportAddEndTime,
      tripReportAddRating,
      tripReportAddDifficulty,
    ]
    for (ele in formElements) {
      formElements[ele].value = ""
    }
  }
  document.getElementById(domShowString).style.display = "block";
  clearChildren(document.getElementById("tripReportAddConfirmationList"));
  document.getElementById(domHideString).style.display = "none";
}


function viewTripReportsCardSwitch(domShowString, domHideString, clearData) {
  /* Changes the displayed card in the viewTripReportsSearch div, optionally
   *  clearing the inputted data.
   *  Accepts:
   *    domShowString (string):  the id of the DOM element to be shown
   *    domHideString (string): the id of the DOM element to be hidden
   *    clearData (BOOL): whether or not we clear the data from the
   *      tripReportsSearch inputs
   *  Returns:
   *    null
   */
  // If we are hiding or showing one of the search divs, make sure to do it to 
  // both of the search divs.
  var searchInputDivs = ["viewTripReportsByTrail", "viewTripReportsByName"];
  if (searchInputDivs.includes(domHideString)) {
    for (ele in searchInputDivs) {
      document.getElementById(searchInputDivs[ele]).style.display = "none";
    }
  } else {
    document.getElementById(domHideString).style.display = "none";
  }
  if (searchInputDivs.includes(domShowString)) {
    for (ele in searchInputDivs) {
      document.getElementById(searchInputDivs[ele]).style.display = "block";
    }
  } else {
    document.getElementById(domShowString).style.display = "block";
  }
  // If clearData is selected, clear the search inputs
  if (clearData) {
    document.getElementById("viewTripReportsByTrailTrail").value = "";
    document.getElementById("viewTripReportsByNameName").value = "";
  }
  // Clear out the search results list
  clearChildren(document.getElementById("viewTripReportsSearchResultsList"));
}


function buildTripReportList(arr) {
/* Builds a lit of trip reports.
 * Accepts:
 *  arr (array of objects): trip reports in array
 * Returns:
 *  null
 */
  for (ele in arr) {
    let report = arr[ele];
    let li = document.createElement("li");
    li.innerHTML = `Report by hikers ${report.hikersOnTrip.join(", ")}:`;
    reportList.appendChild(li);
    let ul = document.createElement("ul");
    li.appendChild(ul);
    if (report.start_time) {
      let liStart = document.createElement("li");
      liStart.innerHTML = `Start Time: ${report.start_time}`;
      ul.appendChild(liStart);
    }
    if (report.end_time) {
      let liEnd = document.createElement("li");
      liEnd.innerHTML = `End Time: ${report.end_time}`;
      ul.appendChild(liEnd);
    }
    if (report.description) {
      let liDescription = document.createElement("li");
      liDescription.innerHTML = `Description: ${report.description}`;
      ul.appendChild(liDescription);
    }
    if (report.trail_condition) {
      let liTrailCond = document.createElement("li");
      liTrailCond.innerHTML = `Trail Conditions: ${report.trail_condition}`;
      ul.appendChild(liTrailCond);
    }
    if (report.weather_condition) {
      let liWeatherCond = document.createElement("li");
      liWeatherCond.innerHTML = `Weather Conditions: ${report.weather_condition}`;
      ul.appendChild(liWeatherCond);
    }
    if (report.rating) {
      let liRating = document.createElement("li");
      liRating.innerHTML = `Trail Rating: ${report.rating}`;
      ul.appendChild(liRating);
    }
    if (report.difficulty) {
      let liDifficulty = document.createElement("li");
      liDifficulty.innerHTML = `Trail Difficulty: ${report.difficulty}`;
      ul.appendChild(liDifficulty);
    }
    const maybeOtherHikers = [
      report.tripReportOtherHiker1,
      report.tripReportOtherHiker2,
      report.tripReportOtherHiker3
    ].filter(hiker => hiker !== null && typeof hiker === "string" && hiker.length > 0);
    maybeOtherHikers.forEach((hikerName, idx) => {
      let li = document.createElement("li");
      li.innerHTML = `Other Hiker ${idx}: ${hikerName}`;
      ul.appendChild(li);
    });
  } 
}

/* ADD TRIP REPORT DIVS */

/* Used when a Trip Report is entered and button is clicked */
document
  .getElementById("tripReportAddForm")
  .addEventListener("submit", function(event) {
    addFormProcess();
    // Check to make sure there's a hiker name and a trail name.
    // Should already be done in browser.
    if ( !addFormElements.tripReportAddHikerName ||
      !addFormElements.tripReportAddTrailName) {
        alert("Please make sure your trip report comes from a hiker we know about, and is about a trail we know about.");
        if (addFormElements.tripReportAddHikerName == "") {
          errorBorder(tripReportAddHikerName)
        } else if (addFormElements.tripReportAddTrailName == "") {
          errorBorder(tripReportAddTrailName)
        }
    }
    // Trip report has required hiker name and trail name
    else {
      // Reset the borders of the input
      goodBorders([tripReportAddHikerName, tripReportAddTrailName]);
      // turn off current div and turn on confirmation div
      tripReportAddCardSwitch("tripReportAddConfirmation", "tripReportAdd", false);
      // populate the list for confirmation page
      var tripReportAddConfirmationList = 
        document.getElementById("tripReportAddConfirmationList");
      var hikerItem = document.createElement("li");
      hikerItem.innerHTML =
        "Hiker Name: " + addFormElements.tripReportAddHikerName;
      tripReportAddConfirmationList.appendChild(hikerItem);
      var trailItem = document.createElement("li");
      trailItem.innerHTML =
        "Trail Name: " + addFormElements.tripReportAddTrailName;
      tripReportAddConfirmationList.appendChild(trailItem);
      var descriptionItem = document.createElement("li");
      descriptionItem.innerHTML = 
        "Trail Description: " + addFormElements.tripReportAddDescription;
      tripReportAddConfirmationList.appendChild(descriptionItem);
      var conditionsItem = document.createElement("li");
      conditionsItem.innerHTML = 
        "Trail Conditions: " + addFormElements.tripReportAddTrailConditions;
      tripReportAddConfirmationList.appendChild(conditionsItem);
      var weatherItem = document.createElement("li");
      weatherItem.innerHTML = 
        "Weather Conditions: " + addFormElements.tripReportAddWeatherConditions;
      tripReportAddConfirmationList.appendChild(weatherItem);
      var startItem = document.createElement("li");
      startItem.innerHTML = 
        "Start Time: " + addFormElements.tripReportAddStartTime;
      tripReportAddConfirmationList.appendChild(startItem);
      var endItem = document.createElement("li");
      endItem.innerHTML = 
        "End Time: " + addFormElements.tripReportAddEndTime;
      tripReportAddConfirmationList.appendChild(endItem);
      var ratingItem = document.createElement("li");
      ratingItem.innerHTML = 
        "Trail Rating (from 0 to 5): " + addFormElements.tripReportAddRating;
      tripReportAddConfirmationList.appendChild(ratingItem);
      var difficultyItem = document.createElement("li");
      difficultyItem.innerHTML = 
        "Trail Difficulty (from 0 to 5): " + addFormElements.tripReportAddDifficulty;
      tripReportAddConfirmationList.appendChild(difficultyItem);
      const maybeOtherHikers = [
        addFormElements.tripReportOtherHiker1,
        addFormElements.tripReportOtherHiker2,
        addFormElements.tripReportOtherHiker3
      ].filter(hiker => hiker !== null && typeof hiker === "string" && hiker.length > 0);
      maybeOtherHikers.forEach((hikerName, idx) => {
        console.log("adding other hiker", hikerName);
        let li = document.createElement("li");
        // add numbered hiker list (idx is 0=indexed)
        li.innerHTML = `Other Hiker ${idx+1}: ${hikerName}`;
        tripReportAddConfirmationList.appendChild(li);
      });
      // scroll up so form is in view
      window.scroll(0, 0);
      event.preventDefault();
    }
  });

/* Used when user clicks "No thank you" button on Trip Report Confirmation
 * card. */
document
  .getElementById("tripReportAddConfirmationRedo")
  .addEventListener("click", async function(event) {
    tripReportAddCardSwitch("tripReportAdd", "tripReportAddConfirmation", false);
  });

/* Used when user clicks "Yes, please" button on Trip Report Confirmation card.
 * */
document
  .getElementById("tripReportAddConfirmationOK")
  .addEventListener("click", async function(event) {
    try{
      var reqBody = {"cmd": "add"};
      if (reqBody.tripReportStartTime == '') {
        reqBody.tripReportStartTime = null;
      }
      for (ele in addFormElements) {
        if (addFormElements[ele] == '') {
          reqBody[ele] = null;
        } else {
        reqBody[ele] = addFormElements[ele]
        }
      }
      await fetch("/trip-report", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody)
      });
      tripReportAddCardSwitch("tripReportAddConfirmed", "tripReportAddConfirmation", true);
    } catch (err) {
      tripReportAddCardSwitch("tripReportAddError", "tripReportAddConfirmation", false);
    }
  });
    
/* Used when user clicks "Add Another Trip Report" on Add Trip Report Confirmed
 * card button. */
document.
  getElementById("tripReportAddConfirmedButton").
  addEventListener("click", function(event) {
    tripReportAddCardSwitch("tripReportAdd", "tripReportAddConfirmed", true);
  });

/* Used when a hiker hits "Try Again" on error card button */
document.
  getElementById("tripReportAddErrorButton").
  addEventListener("click", function(event) {
    tripReportAddCardSwitch("tripReportAdd", "tripReportAddError", false);
  });



/* EVENT LISTENERS FOR TRAIL REPORT SEARCH DIVS */

/* Used when user clicks "Submit" button on view Trip Reports By Trail button
 * */
document.
  getElementById("viewTripReportsByTrailForm").
  addEventListener("submit", async function(event) {
    event.preventDefault();
    const trailName =
      document.getElementById("viewTripReportsByTrailTrail").value;
    if (trailName =="") {
      alert("Please enter a trail name if you would like to search by trail name.");
      return;
    }
    try{
      // Pack up and send off search.
      const resp = await fetch(
        `/trip-report?cmd=tripReportSearch&trail=${trailName}`
      );
      const result = await resp.json();
      if (result.length != 0) {
      //  Successful reply with one or more element
        viewTripReportsCardSwitch(
          "viewTripReportsSearchResults", "viewTripReportsByTrail", true);
        buildTripReportList(result);
     } else if (result.length === 0) {
        // Assuming successful reply with no elements
        viewTripReportsCardSwitch(
          "viewTripReportsSearchNoResults", "viewTripReportsByTrail", false);
      }
    } catch (err) {
      viewTripReportsCardSwitch(
        "viewTripReportsSearchError", "viewTripReportsByTrail", false);
    }
  });
 
/* Used when user clicks "Submit" button on view Trip Reports By Name button
 * */
document.
  getElementById("viewTripReportsByNameForm").
  addEventListener("submit", async function(event) {
    event.preventDefault();
    const hikerName  =
      document.getElementById("viewTripReportsByNameName").value;
    if (hikerName =="") {
      alert("Please enter a hiker name if you would like to search by hiker name.");
      return;
    }
    try{
      // Pack up and send off search.
      const resp = await fetch(
        `/trip-report?cmd=tripReportSearch&hiker=${hikerName}`
      );
      const result = await resp.json();
      if (result.length != 0) {
      //  Successful reply with one or more element
        viewTripReportsCardSwitch(
          "viewTripReportsSearchResults", "viewTripReportsByName", true);
        buildTripReportList(result);
     } else if (result.length === 0) {
        // Assuming successful reply with no elements
        viewTripReportsCardSwitch(
          "viewTripReportsSearchNoResults", "viewTripReportsByName", false);
      }
    } catch (err) {
      viewTripReportsCardSwitch(
        "viewTripReportsSearchError", "viewTripReportsByName", false);
    }
  }); 
      
/* Used when user clicks "Search Again" button on view Trip Reports Search
 *  Results button. */
document.
  getElementById("viewTripReportsSearchResults").
  addEventListener("click", function(event) {
    viewTripReportsCardSwitch(
      "viewTripReportsByTrail", "viewTripReportsSearchResults", true);
  });

/* Used when user clicks "Try Search Again" at the bottom of view Trip Reports
 *  No Search Results button. */
document.
  getElementById("viewTripReportsSearchNoResultsButton").
  addEventListener("click", function(event) {
    viewTripReportsCardSwitch(
      "viewTripReportsByTrail", "viewTripReportsSearchNoResults", false);
  });

/* Used when user clicks "Try Search Again" at the bottom of view Trip Reports
 *  Search Error button. */
document.
  getElementById("viewTripReportsSearchErrorButton").
  addEventListener("click", function(event) {
    viewTripReportsCardSwitch(
      "viewTripReportsByTrail", "viewTripReportsSearchError", false);
  });
