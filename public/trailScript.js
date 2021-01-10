/* Global Variables */
var trailSearchName;
var trailSearchMinimumLength;
var trailSearchMaximumLength;
var trailSearchCity;
var trailSearchCountry;
var trailSearchPermit;
var trailsList = document.getElementById("trailSearchResultsList");


/* Helper functions */

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

function clearChildren(ele) {
  /* Clears the array of DOM element.
   * Accepts:
   *  ele (DOM element): DOM element which needs to become childless
   * Returns:
   *  null
   */
  while (ele.firstChild) {
    ele.removeChild(ele.firstChild);
  }
}


function searchTrailCardSwitch(domShowString, domHideString, clearData) {
  /* Changes the displaued card content for the Trails View div, optionally
   *  clearing the form data.
   *  Accepts:
   *    domShowString (string): the id of the DOM element to be shown
   *    domHideString (string): the id of the DOM element to be hidden
   *    clearData (BOOL):  whether or not we clear the data from the
   *      trailsSearch form
   *  Returns:
   *    null
   */
  // clear the form if asked
  if (clearData) {
    var formElements = [
      trailSearchName,
      trailSearchMinimumLength,
      trailSearchMaximumLength,
      trailSearchCity,
      trailSearchCountry,
    ]
    for (ele in formElements) {
      formElements[ele].value = "";
    }
    trailSearchPermit.value = "-1";
  }
  document.getElementById(domShowString).style.display = "block";
  clearChildren(trailsList);
  document.getElementById(domHideString).style.display = "none";
}


function buildTrailList(arr) {
  /* Builds a list of trails.
   * Accepts:
   *  arr (array of objects): trails in array
   * Returns:
   *  null
   */
  for (ele in arr) {
    let trail = arr[ele];
    let li = document.createElement("li");
    li.innerHTML = `Trail Name: ${trail.name}`;
    trailsList.appendChild(li);
    let ul = document.createElement("ul");
    li.appendChild(ul);
    if (trail.length_miles) {
      let liLength = document.createElement("li");
      liLength.innerHTML = `Length (in miles): ${trail.length_miles}`;
      ul.appendChild(liLength);
    }
    if (trail.elevation_gain_feet) {
      let liElevation = document.createElement("li");
      liElevation.innerHTML = `Elevation gain (in feet): ${trail.elevation_gain_feet}`;
      ul.appendChild(liElevation);
    }
    if (trail.city) {
      let liCity = document.createElement("li");
      liCity.innerHTML = `City: ${trail.city}`;
      ul.appendChild(liCity);
    }
    if (trail.country) {
      let liCountry = document.createElement("li");
      liCountry.innerHTML = `Country: ${trail.country}`;
      ul.appendChild(liCountry);
    }
    if (trail.permits) {
      let liPermit = document.createElement("li");
      liPermit.innerHTML = `Valid Permits (must have one to hike or park):`;
      ul.appendChild(liPermit);
      let ulPermitList = document.createElement("ul");
      liPermit.appendChild(ulPermitList);
      for (ele in JSON.parse(trail.permits)) {
        var liThisPermit = document.createElement("li");
        liThisPermit.innerHTML = JSON.parse(trail.permits)[ele];
        ulPermitList.appendChild(liThisPermit);
      }
    } else {
      let liPermit = document.createElement("li");
      liPermit.innerHTML = 'No permits are required to hike this trail. &#x1F600;';
      ul.appendChild(liPermit);
    }
  }
}


/* EVENT LISTENERS */

/* Used when user click "submit" button in Trails Search div */
document.
  getElementById("trailSearchForm").
  addEventListener("submit", async function(event) {
    event.preventDefault();
    // Assign values from form.
    trailSearchName = 
      document.getElementById("trailSearchName");
    trailSearchMinimumLength = 
      document.getElementById("trailSearchMinimumLength");
    trailSearchMaximumLength =
      document.getElementById("trailSearchMaximumLength");
    trailSearchCity = 
      document.getElementById("trailSearchCity");
    trailSearchCountry = 
      document.getElementById("trailSearchCountry");
    trailSearchPermit = 
      document.getElementById("trailSearchPermit");
    // Check to see if user entered any search data at all
    if (trailSearchName.value == '' &&
      trailSearchMinimumLength.value == '' &&
      trailSearchMaximumLength.value == '' &&
      trailSearchCity.value == '' &&
      trailSearchCountry.value == '' &&
      trailSearchPermit.value =='-1') {
      alert("Please enter at least one search criteria.");
      return
    }
    //Pack up and send off search.
    try {
      const resp = await fetch(
        `/trail?cmd=trailSearch&trailSearchName=${trailSearchName.value}` + 
        `&trailSearchMinimumLength=${trailSearchMinimumLength.value}` +
        `&trailSearchMaximumLength=${trailSearchMaximumLength.value}` + 
        `&trailSearchCity=${trailSearchCity.value}` + 
        `&trailSearchCountry=${trailSearchCountry.value}` + 
        `&trailSearchPermit=${trailSearchPermit.value}`
      );
      const result = await resp.json();
      // Check to see if we got at least one result
      if (result.length != 0){
        searchTrailCardSwitch("trailSearchResults", "trailSearch", true);
        buildTrailList(result);
      } else if (result.length==0) {
        // No results
        searchTrailCardSwitch("trailSearchNoResults", "trailSearch", false);
      }
    } catch(err) {
      // Error in search
      searchTrailCardSwitch("trailSearchError", "trailSearch", false);
    }
  });

/* Used when user clicks "Search Again" button on view Trails Search Results
 *  button */
document.
  getElementById("trailSearchResultsButton").
  addEventListener("click", function (event) {
    searchTrailCardSwitch("trailSearch", "trailSearchResults", true);
  });

/* Used when user clicks "Try Search Again" button in trail Search No Results 
 *  card content */
document.
  getElementById("trailSearchNoResultsButton").
  addEventListener("click", function (event) {
    searchTrailCardSwitch("trailSearch", "trailSearchNoResults", false);
  });

/* Used when user clicks "Try Search Again" button in trail Search Error
 *  card content */
document.
  getElementById("trailSearchErrorButton").
  addEventListener("click", function (event) {
    serachTrailCardSwitch("trailSearch", "trailSearchError", false);
  });

// Trail Add

function trailAddCardSwitch(domShowString, domHideString) {
  /* Changes the displayed card in the hikerAdd div, optionally clearing
   *  the name.
   * Accepts:
   *  domShowString (string): the id of the DOM element to be shown
   *  domHideString (string): the id of the DOM element to be hidden
   * Returns:
   *  Null
   */
  document.getElementById(domShowString).style.display = "block";
  document.getElementById(domHideString).style.display = "none";
}

function populateTrailFormConfirmationList() {
  // populate the list for confirmation page
  const theList = document.createElement("ul");
  Array.from(document.querySelectorAll("#trailAddForm div.form-element label"))
    .map((e) => {
      const el = document.getElementById(e.htmlFor);
      const res = {
        "label": e.textContent,
        "value": el.value,
      };
      if (el.tagName === "SELECT") {
        // if select, get the selected value
        res.value = el.options[el.value] ? el.options[el.value].innerHTML : "";
      }
      return res;
    })
    .filter((e) => e.value !== "") // filter out empties
    .forEach((field) => {
      console.log(field);
      const thisLi = document.createElement("li");
      thisLi.appendChild(
        document.createTextNode(`${field.label}: ${field.value}`)
      );
      console.log(thisLi);
      theList.appendChild(thisLi);
      console.log(theList);
    });
  const listHolder = document.getElementById("trailAddConfirmationList");
  listHolder.innerHTML = null;
  listHolder.appendChild(theList);
}

/* Used when user click "submit" button in Trails Search div */
document
  .getElementById("trailAddForm")
  .addEventListener("submit", function (event) {
    console.log("submitted");
    event.preventDefault();
    populateTrailFormConfirmationList();
    window.scroll(0, 256);
    trailAddCardSwitch("trailAddConfirmation", "trailAddForm");
  });

document
  .getElementById("trailAddConfirmationRedo")
  .addEventListener("click", function (event) {
    event.preventDefault();
    trailAddCardSwitch("trailAddForm", "trailAddConfirmation");
  });

document
  .getElementById("trailAddConfirmationOK")
  .addEventListener("click", async function (event) {
    event.preventDefault();
    let trailName = "",
      trailLength = "",
      trailElevationGainFeet = "",
      trailAddCity = "",
      trailAddState = "",
      trailAddCountry = "",
      trailAddPermit1 = "",
      trailAddPermit2 = "",
      trailAddPermit3 = "";
    event.preventDefault();
    // Assign values from form.
    trailName = document.getElementById("trailAddTrailName").value;
    trailLength = document.getElementById("trailAddLengthMiles").value;
    trailElevationGainFeet = document.getElementById(
      "trailAddElevationGainFeet"
    ).value;
    trailAddCity = document.getElementById("trailAddCity").value;
    trailAddState = document.getElementById("trailAddState").value;
    trailAddCountry = document.getElementById("trailAddCountry").value;
    trailAddPermit1 = document.getElementById("trailAddPermit1").value;
    trailAddPermit2 = document.getElementById("trailAddPermit2").value;
    trailAddPermit3 = document.getElementById("trailAddPermit3").value;

    //Pack up and send off to create new trail.
    try {
      const resp = await fetch("/trail/new", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trailName,
          trailLength,
          trailElevationGainFeet,
          trailAddCity,
          trailAddState,
          trailAddCountry,
          trailAddPermit1,
          trailAddPermit2,
          trailAddPermit3,
        }),
      });
      const result = await resp.json();
      console.log("got result", result);
      // Check to see if we got at least one result
      trailAddCardSwitch("trailAddConfirmed", "trailAddConfirmation");
    } catch (err) {
      console.log("error", err);
      // Error in search
      trailAddCardSwitch("trailAddError", "trailAddConfirmation");
    }
  });

/* Used when user clicks "Try Search Again" button in trail Search Error
 *  card content */
document
  .getElementById("trailSearchErrorButton")
  .addEventListener("click", function (event) {
    trailAddCardSwitch("trailAddForm", "trailAddError");
  });

document
  .getElementById("trailAddConfirmedButton")
  .addEventListener("click", function (event) {
    // reset the form for the user
    document.getElementById("trailAddForm").reset();
    trailAddCardSwitch("trailAddForm", "trailAddConfirmed");
  });
