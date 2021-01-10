// HELPER FUNCTIONS

function removeAllChildNodes(element) {
  /* Removes all child nodes of a DOM element, primarily intended to remove 
    items in a list.
  Accepts:
    element (DOM element):  Element whose children need to be removed.
  Returns:
    Null
  */
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function addPermitCardSwitch(domShowString, domHideString, clearData) {
  /* Changes the displayed card content for the add permit div, optionally
      clearing the form data.
    Accepts:
      domShowString (string): the id of the DOM element to be shown
      domHidestring (string): the id of the DOM element to be hidden
      clearData (BOOL): whether or not we clear the data from the add permit
        form
    Returns:
      null
  */
  // clear the form if asked
  if (clearData) {
    document.getElementById('adminPermitAddFormName').value = '';
    document.getElementById('adminPermitAddFormDuration').value = '';
  }
  document.getElementById(domShowString).style.display = 'block';
  removeAllChildNodes(document.getElementById("adminPermitAddConfirmList"));
  document.getElementById(domHideString).style.display = 'none';
}


function cardSwitch(domShowString, domHideString) {
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
  document.getElementById(domShowString).style.display = "block";
  document.getElementById(domHideString).style.display = "none";
}

function buildInputEditor(inputEditorData, col) {
  const inputElement = document.createElement("input");
  inputElement.dataset.fieldName = col.key;
  ["type", "min", "maxLength", "step"].forEach((maybeKey) => {
    if (inputEditorData[maybeKey]) {
      inputElement[maybeKey] = inputEditorData[maybeKey];
    }
  });
  return inputElement;
}

function buildTable(
  data,
  headerRows,
  editorTypesByKey,
  domParent,
  onDelete,
  onUpdate
) {
  const table = document.createElement("table");
  domParent.appendChild(table);
  const thead = document.createElement("thead");
  table.appendChild(thead);
  headerRows.forEach((row) => {
    const th = document.createElement("th");
    th.appendChild(document.createTextNode(row.name));
    thead.appendChild(th);
  });
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  data.forEach((element) => {
    const tr = document.createElement("tr");
    const thisTrID = `tr_${element.id}_${Date.now()}`;
    tr.id = thisTrID;
    headerRows.forEach((col) => {
      const td = document.createElement("td");
      td.dataset.fieldName = col.key;
      if (element[col.key]) {
        let inputEditor;
        if (editorTypesByKey[col.key]) {
          inputEditor = buildInputEditor(editorTypesByKey[col.key], col);
        } else {
          inputEditor = document.createElement("input");
          inputEditor.dataset.fieldName = col.key;
        }
        const currentText = document.createElement("span");
        currentText.dataset.fieldName = col.key;
        currentText.appendChild(document.createTextNode(element[col.key]));
        td.appendChild(currentText);
        inputEditor.value = element[col.key];
        td.appendChild(inputEditor);
      } else if (col.key === "ACTION_Delete") {
        // a delete or update action
        const btn = document.createElement("button");
        btn.id = `delete_trail_${element.id}`;
        btn.dataset.parentTR = thisTrID;
        btn.addEventListener("click", async function (event) {
          event.preventDefault();
          onDelete(element, event);
        });
        btn.appendChild(document.createTextNode(col.name));
        td.appendChild(btn);
      } else if (col.key === "ACTION_Update") {
        const btn = document.createElement("button");
        btn.id = `update_trail_${element.id}`;
        btn.dataset.parentTR = thisTrID;
        btn.addEventListener("click", async function (event) {
          event.preventDefault();
          onUpdate(element, event);
        });
        btn.appendChild(document.createTextNode(col.name));
        td.appendChild(btn);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function displayTrailResults(trailObjectList) {
  cardSwitch("adminTrailResults", "adminTrailSearch");
  const headerRows = [
    { "name": "Trail Name", "key": "name" },
    { "name": "Elevation Gain Feet", "key": "elevation_gain_feet" },
    { "name": "Length Miles", "key": "length_miles" },
    { "name": "City", "key": "city" },
    { "name": "Country", "key": "country" },
    { "name": "State", "key": "state" },
    { "name": "Delete", "key": "ACTION_Delete" },
    { "name": "Edit", "key": "ACTION_Update" },
  ];
  const editorTypesByKey = {
    "name": {
      "type": "text",
      "maxLength": 100,
    },
    "elevation_gain_feet": {
      "type": "number",
      "min": "0.00",
      "max": "99999.99",
      "step": "0.01",
    },
    "length_miles": {
      "type": "number",
      "min": "0.00",
      "max": "99999.99",
      "step": "0.01",
    },
    "city": {
      "type": "text",
      "maxLength": "100",
    },
    "state": {
      "type": "text",
      "maxLength": "64",
    },
    "country": {
      "type": "text",
      "maxLength": "2",
    },
  };
  buildTable(
    trailObjectList,
    headerRows,
    editorTypesByKey,
    document.getElementById("adminTrailResultsTable"),
    async function onDelete(element, event) {
      const forReal = confirm(
        `Delete trail ${element.name}, id #${element.id}?`
      );
      if (forReal) {
        try {
          await fetch(`/trail/${element.id}`, {
            "method": "DELETE",
          });
          // Success, refresh the page
          window.location.href = window.location.href;
        } catch (err) {
          // TODO: show some better error.
          window.alert(`Deletion of trail id ${element.id} failed: ${err}`);
        }
      }
    },
    async function onUpdate(element, event) {
      const currentText = event.target.textContent;
      const parentTR = document.getElementById(event.target.dataset.parentTR);
      if (currentText === "Update") {
        // save the fields and update the row
        event.target.textContent = "Edit";
        const patchObj = {};
        // get all the current input values and package em up for submission.
        document
          .querySelectorAll(`#${event.target.dataset.parentTR} input`)
          .forEach((input) => {
            patchObj[input.dataset.fieldName] = input.value;
          });
        const resp = await fetch(`/trail/${element.id}`, {
          "method": "PATCH",
          "headers": {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patchObj),
        });
        const parsed = await resp.json();
        // update the input values to current state
        Object.keys(parsed).forEach((key) => {
          document.querySelector(
            `#${event.target.dataset.parentTR} input[data-field-name=${key}]`
          ).value = parsed[key];
          document.querySelector(
            `#${event.target.dataset.parentTR} span[data-field-name=${key}]`
          ).textContent = parsed[key];
        });
        parentTR.classList.remove("editing");
      } else if (currentText === "Edit") {
        // switch to "editing mode" => turn fields into inputs.
        parentTR.classList.add("editing");
        event.target.textContent = "Update";
      }
    }
  );
}

function displayPermitResults(trailObjectList) {
  cardSwitch("adminPermitResults", "adminPermitSearch");
  const headerRows = [
    { "name": "Name", "key": "name" },
    { "name": "Duration Days", "key": "duration_days" },
    { "name": "Delete", "key": "ACTION_Delete" },
    { "name": "Edit", "key": "ACTION_Update" },
  ];
  const editorTypesByKey = {
    "name": {
      "type": "text",
      "maxLength": 255,
    },
    "duration_days": {
      "type": "number",
    },
  };
  buildTable(
    trailObjectList,
    headerRows,
    editorTypesByKey,
    document.getElementById("adminPermitResultsTable"),
    async function onDelete(element, event) {
      const forReal = confirm(
        `Delete permit ${element.name}, id #${element.id}?`
      );
      if (forReal) {
        try {
          await fetch(`/permit/${element.id}`, {
            "method": "DELETE",
          });
          // success, refresh the page
          window.location.href = window.location.href;
        } catch (err) {
          // TODO: show some better error.
          window.alert(`Deletion of permit id ${element.id} failed: ${err}`);
        }
      }
    },
    async function onUpdate(element, event) {
      const currentText = event.target.textContent;
      const parentTR = document.getElementById(event.target.dataset.parentTR);
      if (currentText === "Update") {
        // save the fields and update the row
        event.target.textContent = "Edit";
        parentTR.classList.remove("editing");
        const patchObj = {};
        document
          .querySelectorAll(`#${event.target.dataset.parentTR} input`)
          .forEach((input) => {
            patchObj[input.dataset.fieldName] = input.value;
          });
        const resp = await fetch(`/permit/${element.id}`, {
          "method": "PATCH",
          "headers": {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patchObj),
        });
        const parsed = await resp.json();
        // update the input values to current state
        Object.keys(parsed).forEach((key) => {
          document.querySelector(
            `#${event.target.dataset.parentTR} input[data-field-name=${key}]`
          ).value = parsed[key];
          document.querySelector(
            `#${event.target.dataset.parentTR} span[data-field-name=${key}]`
          ).textContent = parsed[key];
        });
        parentTR.classList.remove("editing");
      }
      if (currentText === "Update") {
        // save the fields and update the row
        event.target.textContent = "Edit";
        parentTR.classList.remove("editing");
      } else if (currentText === "Edit") {
        // switch to "editing mode" => turn fields into inputs.
        parentTR.classList.add("editing");
        event.target.textContent = "Update";
      }
    }
  );
}

// EVENT LISTENERS FOR SEARCHES

function init() {
  // Trail Search
  document
    .getElementById("adminTrailSearchForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      const trailSearchName = document.getElementById("adminTrailSearchName")
        .value;
      let endpoint =
        trailSearchName === "*"
          ? `/trail/all/`
          : `/trail/name/${trailSearchName}`;
      try {
        const result = await fetch(endpoint);
        const parsed = await result.json();
        if (!parsed.length) {
          cardSwitch("adminTrailNoResults", "adminTrailSearch");
        } else {
          displayTrailResults(parsed);
        }
      } catch (err) {
        console.log("error", err);
      }
    });

  document
    .getElementById("adminTrailSearchNoResultsButton")
    .addEventListener("click", function () {
      cardSwitch("adminTrailSearch", "adminTrailNoResults");
      const inputField = document.getElementById("adminTrailSearchName");
      inputField.value = "";
      inputField.focus();
    });

  document
    .getElementById("adminTrailResultsButton")
    .addEventListener("click", function () {
      cardSwitch("adminTrailSearch", "adminTrailResults");
      const inputField = document.getElementById("adminTrailSearchName");
      inputField.value = "";
      inputField.focus();
      document.getElementById("adminTrailResultsTable").innerHTML = null;
    });

  // permit search
  document
    .getElementById("adminPermitSearchForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      const permitSearchName = document.getElementById("adminPermitSearchName")
        .value;
      let endpoint =
        permitSearchName === "*"
          ? `/permit/all/`
          : `/permit/name/${permitSearchName}`;
      try {
        const result = await fetch(endpoint);
        const parsed = await result.json();
        if (!parsed.length) {
          cardSwitch("adminPermitNoResults", "adminPermitSearch");
        } else {
          displayPermitResults(parsed);
        }
      } catch (err) {
        console.log("error", err);
      }
    });

  document
    .getElementById("adminPermitResultsButton")
    .addEventListener("click", function () {
      cardSwitch("adminPermitResults", "adminPermitNoResults");
    });

  document
    .getElementById("adminPermitNoResultsButton")
    .addEventListener("click", function () {
      cardSwitch("adminPermitSearch", "adminPermitNoResults");
      const inputField = document.getElementById("adminPermitSearchName");
      inputField.value = "";
      inputField.focus();
      document.getElementById("adminPermitResultsTable").innerHTML = null;
    });

  document
    .getElementById("adminPermitErrorButton")
    .addEventListener("click", function () {
      cardSwitch("adminPermitSearch", "adminPermitError");
      const inputField = document.getElementById("adminPermitSearchName");
      inputField.value = "";
      inputField.focus();
      document.getElementById("adminPermitResultsTable").innerHTML = null;
    });

  document
    .getElementById("adminPermitResultsButton")
    .addEventListener("click", function () {
      cardSwitch("adminPermitSearch", "adminPermitResults");
      const inputField = document.getElementById("adminPermitSearchName");
      inputField.value = "";
      inputField.focus();
      document.getElementById("adminPermitResultsTable").innerHTML = null;
    });
}

document.addEventListener("DOMContentLoaded", init());

// EVENT LISTENERS FOR ADDING PERMIT TYPE

// Even listener for user entering data into permit add form.
document.
  getElementById('adminPermitAddFormButton').
  addEventListener('click', function(event) {
    event.preventDefault();
    // build confirmation list
    if (document.getElementById('adminPermitAddFormDuration').
      value === '') {
      alert("Please make sure you have selected a duration for the permit.");
      document.getElementById('adminPermitAddFormDuration').
        style.border = "2px solid red";
      return;
    } 
    document.getElementById('adminPermitAddFormDuration').
      style.border = "1px solid black";
    addPermitCardSwitch('adminPermitAddConfirm', 'adminPermitAddForm', false);
     const permitName = document.getElementById('adminPermitAddFormName').value;
    const permitDuration = document.
      getElementById('adminPermitAddFormDuration').value;
    const confirmList = document.getElementById('adminPermitAddConfirmList');
    const liName = document.createElement('li');
    liName.innerHTML = `Permit Type Name: ${permitName}`;
    confirmList.appendChild(liName);
    const liDuration = document.createElement('li');
    liDuration.innerHTML = `Permit Type Duration: ${permitDuration}`;
    confirmList.appendChild(liDuration);
  });


// Event listener for user clicking "Yes" on permit add confirmation div
document.
  getElementById('adminPermitAddConfirmButtonConfirmation').
  addEventListener("click", async function(event) {
    event.preventDefault();
    const permitName = 
      document.getElementById('adminPermitAddFormName').value;
    const permitDuration = 
      document.getElementById('adminPermitAddFormDuration').value;
   try {
      await fetch("/admin", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          "cmd": "addPermit",
          permitName,
          permitDuration,
        }),
      });
      addPermitCardSwitch('adminPermitAddConfirmation',
        'adminPermitAddConfirm', true);
    } catch (err) {
      addPermitCardSwitch('adminPermitAddError',
        'adminPermitAddConfirm', false);
    }
  });


// Event listener for user clicking "No" on permit add confirmation div
document.
  getElementById('adminPermitAddConfirmButtonRedo').
  addEventListener("click", function(event) {
    event.preventDefault();
    addPermitCardSwitch('adminPermitAddForm', 'adminPermitAddConfirm', false);
  });


// Event listener for user clicking "Add Another Permit" in the add
//  confirmation div
document.
  getElementById('adminPermitAddConfirmationButton').
  addEventListener('click', function (event) {
    event.preventDefault();
    addPermitCardSwitch('adminPermitAddForm',
      'adminPermitAddConfirmation', true);
  });


// Event listener for user clicking "Try Again"  in the add error div
document.
  getElementById('adminPermitAddErrorButton').
  addEventListener('click', function (event) {
    event.preventDefault();
    addPermitCardSwitch('adminPermitAddForm',
      'adminPermitAddErro', false);
  });