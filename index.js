var express = require("express");
const { reset, pool } = require("../dbcon");
var bodyParser = require("body-parser");

const Entities = require("html-entities").AllHtmlEntities;

const entities = new Entities();

const htmlEscape = (value) => entities.encode(value);
const htmlEscapeArr = (arr) => arr.map((entity) => htmlEscape(entity));

// set logLevel to desired logging level of verbosity
const logLevel = "DEBUG";
const logLevels = ["DEBUG", "INFO", "WARN", "ERROR"];

// call one of LOG.debug, LOG.info, LOG.warn, LOG.error with a log message
// only log messages >= to the selected @logLevel above will be printed
const LOG = {
  debug: (msg, ...args) => {
    if (logLevels.indexOf(logLevel) <= logLevels.indexOf("DEBUG")) {
      console.log(`debug: ${msg} ${args}`);
    }
  },
  info: (msg, ...args) => {
    if (logLevels.indexOf(logLevel) <= logLevels.indexOf("INFO")) {
      console.log(`info: ${msg} ${args}`);
    }
  },
  warn: (msg, ...args) => {
    if (logLevels.indexOf(logLevel) <= logLevels.indexOf("WARN")) {
      console.log(`warn: ${msg} ${args}`);
    }
  },
  error: (msg, ...args) => {
    if (logLevels.indexOf(logLevel) <= logLevels.indexOf("ERROR")) {
      console.error(`error: ${msg} ${args}`);
    }
  },
};

function wrapPromise(fn) {
  return new Promise(function (resolve, reject) {
    fn(resolve, reject);
  });
}

function runQuery({ queryText, options = [], resultMapper = (row) => row }) {
  return function (resolve, reject) {
    pool.query(queryText, options, function (err, results, _) {
      LOG.debug(`runQuery ${queryText} options ${options}`);
      if (err != null) {
        LOG.error(`runQuery ${err}`);
        reject(err);
      }
      LOG.debug(`runQuery results ${JSON.stringify(results)}`);
      resolve(resultMapper(results));
    });
  };
}

// buildTrailSearchFromQuery builds a query from searchFields in the query string on the /trails page
function buildTrailSearchFromQuery(searchFields) {
  const whereArr = [],
    options = [];
  const {
    trailSearchName,
    trailSearchMinimumLength,
    trailSearchMaximumLength,
    trailSearchCity,
    trailSearchCountry,
    trailSearchPermit,
  } = searchFields;

  const queryArr = [
    "SELECT T.name, T.length_miles, T.elevation_gain_feet,",
    "T.city, T.state, T.country, JSON_ARRAYAGG(P.name) as permits",
    "FROM Trails T INNER JOIN Trails_Permits TP on T.id = TP.trail_id",
    "INNER JOIN Permits P on P.id = TP.permit_id WHERE ",
  ];

  // Add filters
  if (trailSearchPermit !== "-1") {
    whereArr.push(
      "T.id IN (SELECT trail_id FROM Trails_Permits WHERE permit_id = ?)"
    );
    options.push(Number.parseInt(trailSearchPermit));
  }

  if (trailSearchName !== "") {
    whereArr.push("T.name LIKE ?");
    options.push(`%${trailSearchName}%`);
  }
  if (trailSearchMinimumLength !== "") {
    whereArr.push("T.length_miles >= ?");
    options.push(Number.parseFloat(trailSearchMinimumLength));
  }
  if (trailSearchMaximumLength !== "") {
    whereArr.push("T.length_miles < ?");
    options.push(Number.parseFloat(trailSearchMaximumLength));
  }
  if (trailSearchCity !== "") {
    whereArr.push("T.city LIKE ?");
    options.push(`%${trailSearchCity}%`);
  }
  if (trailSearchCountry !== "") {
    whereArr.push("T.country LIKE ?");
    options.push(`%${trailSearchCountry}%`);
  }
  var groupText =
    "GROUP BY T.name, T.length_miles, T.elevation_gain_feet, " +
    "T.city, T.state, T.country";
  // return queryText;
  return {
    queryText: `${queryArr.join(" ")}${whereArr.join(" AND ")} ${groupText};`,
    options: options,
  };
}

const queries = {
  "addHiker": (hikerName) => ({
    "queryText": `INSERT INTO Hikers (name) VALUES (?);`,
    "options": [htmlEscape(hikerName)],
  }),
  "addPermit": ({ permitId, permitDate }) => ({
    "queryText": `INSERT INTO IssuedPermits (permit_id, issue_date) VALUES (?, ?);`,
    "options": [permitId, permitDate],
  }),
  "addHikersIssuedPermits": ({ hiker, issuedPermitId }) => ({
    "queryText": `INSERT INTO Hikers_IssuedPermits (hiker_id, issued_permit_id) VALUES
      ((SELECT id FROM Hikers WHERE name = ?), ?);
    `,
    "options": [hiker, issuedPermitId],
  }),
  "addTrail": ({
    trailName,
    trailLength,
    trailElevationGainFeet,
    trailAddCity,
    trailAddState,
    trailAddCountry,
  }) => {
    trailLength = trailLength !== "" ? Number.parseInt(trailLength) : null;
    trailElevationGainFeet =
      trailElevationGainFeet !== ""
        ? Number.parseInt(trailElevationGainFeet)
        : null;
    const result = {
      "queryText": `INSERT INTO Trails (name, length_miles, elevation_gain_feet, city, state, country) VALUES 
       (?, ?, ?, ?, ?, ?)`,
      "options": [
        htmlEscape(trailName),
        trailLength,
        trailElevationGainFeet,
        ...htmlEscapeArr([trailAddCity, trailAddState, trailAddCountry]),
      ],
    };
    return result;
  },
  "addTrailsPermits": ({ trailId, permitId }) => ({
    "queryText": `INSERT INTO Trails_Permits (trail_id, permit_id) VALUES (?, ?)`,
    "options": [trailId, permitId],
  }),
  "addTripReport": ({
    trailName,
    description,
    trailConditions,
    weatherConditions,
    startTime,
    endTime,
    rating,
    difficulty,
  }) => ({
    "queryText": `
    INSERT INTO TripReports (trail_id, description, trail_condition, weather_condition, start_time, end_time, rating, difficulty) VALUES
    (
      (SELECT id FROM Trails WHERE name = ?),
      ?, ?, ?, ?, ?, ?, ?
    );`,
    "options": [
      ...htmlEscapeArr([
        trailName,
        description,
        trailConditions,
        weatherConditions,
      ]),
      startTime,
      endTime,
      rating,
      difficulty,
    ],
  }),
  "addTripReportsHikers": ({ hikerName, tripReportId }) => ({
    "queryText": `INSERT INTO TripReports_Hikers (trip_report_id, hiker_id) VALUES
      (?, (SELECT id FROM Hikers WHERE name = ?));`,
    "options": [tripReportId, htmlEscape(hikerName)],
  }),
  "getTripReports": {
    "queryText": `
    SELECT TR.*, GROUP_CONCAT(H.name ORDER BY H.name) as hikersOnTrip, T.name as trailName FROM TripReports TR
      INNER JOIN TripReports_Hikers TRH ON TR.id = TRH.trip_report_id
      INNER JOIN Hikers H ON TRH.hiker_id = H.id
      INNER JOIN Trails T ON TR.trail_id = T.id
      GROUP BY TR.id
      ORDER BY TR.id desc;`,
  },
  "getHikersDescending": {
    "queryText": `SELECT * FROM Hikers ORDER BY joined_at desc;`,
  },
  "getHikerByName": (hikerName) => ({
    "queryText": `SELECT * FROM Hikers WHERE name = ?;`,
    "options": [htmlEscape(hikerName)],
  }),
  "getPermits": {
    "queryText": `SELECT * FROM Permits;`,
  },
  "getAllTrails": () => ({
    "queryText": `SELECT * FROM Trails`,
  }),
  "getAllPermits": () => ({
    "queryText": `SELECT * FROM Permits`,
  }),
  "getTrailByName": (trailName) => ({
    "queryText": `SELECT * FROM Trails WHERE name = ?;`,
    "options": [htmlEscape(trailName)],
  }),
  "deleteTrailById": (trailId) => ({
    "queryText": `DELETE FROM Trails WHERE id = ?;`,
    "options": [trailId],
  }),
  "getPermitByName": (permitName) => ({
    "queryText": `SELECT * FROM Permits WHERE name = ?;`,
    "options": [htmlEscape(permitName)],
  }),
  "deletePermitById": (permitId) => ({
    "queryText": `DELETE FROM Permits WHERE id = ?;`,
    "options": [permitId],
  }),
  "tripReportsByTrailName": (trailName) => ({
    "queryText": `
      SELECT TR.*, GROUP_CONCAT(H.name ORDER BY H.name) as hikersOnTrip, T.name as trailName FROM TripReports TR
      INNER JOIN TripReports_Hikers TRH ON TR.id = TRH.trip_report_id
      INNER JOIN Hikers H ON TRH.hiker_id = H.id
      INNER JOIN Trails T ON TR.trail_id = T.id
      WHERE T.name = ?
      GROUP BY TR.id
      ORDER BY TR.id desc;`,
    "options": [htmlEscape(trailName)],
  }),
  "tripReportsByHikerName": (hikerName) => ({
    "queryText": `
      SELECT TR.*, GROUP_CONCAT(H.name ORDER BY H.name) as hikersOnTrip, T.name as trailName FROM TripReports TR
      INNER JOIN TripReports_Hikers TRH ON TR.id = TRH.trip_report_id
      INNER JOIN Hikers H ON TRH.hiker_id = H.id
      INNER JOIN Trails T ON TR.trail_id = T.id
      WHERE TR.id in
      (SELECT
        trip_report_id FROM TripReports_Hikers
        WHERE hiker_id = (
          SELECT id FROM Hikers WHERE name = ?
          )
        GROUP BY trip_report_id, hiker_id
      )
      GROUP BY TR.id
      ORDER BY TR.id desc;`,
    "options": [htmlEscape(hikerName)],
  }),
  "permitsById": (permitId) => ({
    "queryText": `
      SELECT IP.*, P.name as permitName, IP.issue_date as issueDate, H.name as hikerName
        FROM IssuedPermits IP
        INNER JOIN Permits P ON IP.permit_id = P.id
        INNER JOIN Hikers_IssuedPermits HIP ON IP.id = HIP.issued_permit_id
        INNER JOIN Hikers H ON HIP.hiker_id = H.id
        WHERE IP.permit_id = ?
        ORDER BY issueDate desc;`,
    "options": [permitId],
  }),
  "permitsByHikerName": (hikerName) => ({
    "queryText": `
      SELECT IP.*, P.name as permitName, IP.issue_date as issueDate, H.name as hikerName
        FROM IssuedPermits IP
        INNER JOIN Permits P ON IP.permit_id = P.id
        INNER JOIN Hikers_IssuedPermits HIP ON IP.id = HIP.issued_permit_id
        INNER JOIN Hikers H ON HIP.hiker_id = H.id
        WHERE H.name = ?
        ORDER BY issueDate desc;`,
    "options": [htmlEscape(hikerName)],
  }),
  "permitsByHikerNameWithPermitId": (hikerName, permitId) => ({
    "queryText": `
      SELECT IP.*, P.name as permitName, IP.issue_date as issueDate, H.name as hikerName
        FROM IssuedPermits IP
        INNER JOIN Permits P ON IP.permit_id = P.id
        INNER JOIN Hikers_IssuedPermits HIP ON IP.id = HIP.issued_permit_id
        INNER JOIN Hikers H ON HIP.hiker_id = H.id
        WHERE H.name = ? AND P.id = ?
        ORDER BY issueDate desc;`,
    "options": [htmlEscape(hikerName), permitId],
  }),
  "updatePermitById": (permitId, updateData) => {
    const { name, duration_days } = updateData;
    const result = {
      "queryText": `UPDATE Permits SET name = ?, duration_days = ? WHERE id = ?`,
      "options": [htmlEscape(name), htmlEscape(duration_days), permitId],
    };
    return result;
  },
  "updateTrailById": (trailId, updateData) => {
    const {
      name,
      length_miles,
      elevation_gain_feet,
      city,
      state,
      country,
    } = updateData;
    const result = {
      "queryText": `UPDATE Trails SET name = ?, length_miles = ?, elevation_gain_feet = ?, city = ?, state = ?, country = ? WHERE id = ?`,
      "options": [
        ...htmlEscapeArr([
          name,
          length_miles,
          elevation_gain_feet,
          city,
          state,
          country,
        ]),
        trailId,
      ],
    };
    return result;
  },
};

var app = express();
app.use(bodyParser.json());
var handlebars = require("express-handlebars").create({
  defaultLayout: "main",
});

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

// Listen by default on 3141 but accept command-line argument for port.
let listenPort = 3141;
if (process.argv && process.argv.length > 2) {
  listenPort = process.argv[2];
}
app.set("port", listenPort);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async function (req, res, next) {
  console.log("We have a visitor!");
  /* Page One would include Hiker information, as well as a place for hikers
   * to include the permits they have.
   */
  /* Page Two would include Trip Reports.
   */
  /* Page Three would be our Trails page.  For search and display only.  No alterations on this page.
   */
  /* Page Four is an admin page.  A place for site admins to alter Trail information, as well as a place for site admins to alter Permit information.
   */
  filling = {};
  filling.tripReports = await wrapPromise(runQuery(queries.getTripReports));
  filling.tripReports.forEach(report => {
    report.hikersOnTrip = report.hikersOnTrip.split(",");
  });
  filling.newHikers = await wrapPromise(runQuery(queries.getHikersDescending));
  res.render("home", filling);
});

async function handlePermitSearch(reqQuery, res) {
  let queryToRun;
  if (
    reqQuery.permitSearchHiker &&
    !Number.isInteger(reqQuery.permitSearchId)
  ) {
    queryToRun = queries.permitsByHikerName(reqQuery.permitSearchHiker);
  } else if (
    Number.isInteger(Number(reqQuery.permitSearchId)) &&
    !reqQuery.permitSearchHiker
  ) {
    queryToRun = queries.permitsById(Number.parseInt(reqQuery.permitSearchId));
  } else {
    queryToRun = queries.permitsByHikerNameWithPermitId(
      reqQuery.permitSearchHiker,
      Number.parseInt(reqQuery.permitSearchId)
    );
  }
  try {
    const results = await wrapPromise(runQuery(queryToRun));
    LOG.info(`permitSearch results ${JSON.stringify(results)}`);
    // return results;
    res.send(JSON.stringify(results));
  } catch (err) {
    LOG.error(`permitSearch err ${err}`);
    res.send(JSON.stringify({ err: err }));
  }
}

async function handleHikerSearch(reqQuery, res) {
  try {
    const results = await wrapPromise(
      runQuery(queries.getHikerByName(reqQuery.hikerName))
    );
    LOG.info(`handleHikerSearch results ${JSON.stringify(results)}`);
    // return results;
    res.send(JSON.stringify(results));
  } catch (err) {
    LOG.error(`handleHikerSearch err ${err}`);
    res.send(JSON.stringify({ err: err }));
  }
}

// handle adding a trip report
app.post("/trip-report", async function (req, res, next) {
  try {
    LOG.info(`Incoming trip report: ${JSON.stringify(req.body)}`);
    const addResult = await wrapPromise(
      runQuery(
        queries.addTripReport({
          trailName: req.body.tripReportAddTrailName,
          description: req.body.tripReportAddDescription,
          trailConditions: req.body.tripReportAddTrailConditions,
          weatherConditions: req.body.tripReportAddWeatherConditions,
          startTime: req.body.tripReportAddStartTime,
          endTime: req.body.tripReportAddEndTime,
          rating: req.body.tripReportAddRating,
          difficulty: req.body.tripReportAddDifficulty,
        })
      )
    );

    const tripReportPrimaryKey = addResult.insertId;
    // Get unique list of defined hikers.
    const tripReportsHikersQueries = Array.from(new Set([
      req.body.tripReportAddHikerName, // report "author"
      req.body.tripReportOtherHiker1,
      req.body.tripReportOtherHiker2,
      req.body.tripReportOtherHiker3,
    ].filter(hiker => hiker !== null && typeof hiker === "string" && hiker.length > 0)))

    const tripReportsHikerQueries = tripReportsHikersQueries.map(hikerName => wrapPromise(
      runQuery(
        queries.addTripReportsHikers({
          hikerName: hikerName,
          tripReportId: tripReportPrimaryKey,
        })
      )));
    Promise.all(tripReportsHikerQueries).then(function onSuccess(result) {
      LOG.info("successful tripreports addTripReportsHikers insert", result);
      res.status(200).send(JSON.stringify({ "OK": true }));
    }).catch(err => {
      LOG.error("tripreports hiker insert err", err);
      res.status(500).send(JSON.stringify({ "OK": false }));
    });
  } catch (err) {
    res.status(500).send(JSON.stringify({ "OK": false }));
  }
});

// handle adding a permit
app.post("/permit", async function (req, res, next) {
  if (req.body.cmd === "add") {
    const { hiker, permitId, permitDate } = req.body;
    try {
      const addResult = await wrapPromise(
        runQuery(queries.addPermit({ permitId, permitDate }))
      );
      await wrapPromise(
        runQuery(
          queries.addHikersIssuedPermits({
            hiker,
            issuedPermitId: addResult.insertId,
          })
        )
      );
      res.sendStatus(200);
    } catch (err) {
      res.status(500).send(JSON.stringify(err));
    }
  }
});

// handle adding a hiker.
app.post("/hiker", async function (req, res, next) {
  if (req.body.cmd === "add") {
    try {
      await wrapPromise(runQuery(queries.addHiker(req.body.name)));
      res.sendStatus(200);
    } catch (err) {
      res.status(500).send(JSON.stringify(err));
    }
  }
});

// handle searching for a hiker on /hiker page
app.get("/hiker", async function (req, res, next) {
  console.log("Hiker Spotted!");
  const filling = {};
  switch (req.query.cmd) {
    case "hikerSearch":
      return await handleHikerSearch(req.query, res);
    default:
      break;
  }
  filling.permits = await wrapPromise(runQuery(queries.getPermits));
  res.render("hiker", filling);
});

// handle searching for a permit on /permit page
app.get("/permit", async function (req, res, next) {
  console.log("Permits route Spotted!");
  const filling = {};
  switch (req.query.cmd) {
    case "permitSearch":
      return await handlePermitSearch(req.query, res);
    default:
      break;
  }
  filling.permits = await wrapPromise(runQuery(queries.getPermits));
  res.render("permit", filling);
});

// handle searching for a trip report on /tripreport
app.get("/trip-report", async function (req, res, next) {
  console.log("Trip Reporter!", req.query);
  let result;
  if (req.query.trail) {
    try {
      console.log(queries.tripReportsByTrailName);
      result = await wrapPromise(
        runQuery(queries.tripReportsByTrailName(req.query.trail))
      );
      result.forEach(report => {
        report.hikersOnTrip = report.hikersOnTrip.split(",");
      });
      LOG.info(`tripReportsByTrailName result: ${JSON.stringify(result)}`);
      return res.send(result);
    } catch (err) {
      LOG.error("tripReportsByTrailName", err);
    }
  } else if (req.query.hiker) {
    try {
      result = await wrapPromise(
        runQuery(queries.tripReportsByHikerName(req.query.hiker))
      );
      result.forEach(report => {
        report.hikersOnTrip = report.hikersOnTrip.split(",");
      });
      console.log(result);
      LOG.info("tripReportsByHikerName result:", result);
      return res.send(result);
    } catch (err) {
      LOG.error("tripReportsByHikerName", err);
    }
  }
  const filling = {};
  pool.query(`SELECT name FROM Hikers;`, [], function (err, result) {
    if (err) {
      next(err);
      return;
    }
    LOG.info("Getting hikers for Trip Reports page:" + JSON.stringify(result));
    filling.hikers = result;
    pool.query(`SELECT name FROM Trails;`, [], function (err, result) {
      if (err) {
        next(err);
        return;
      }
      LOG.info(
        `Getting trails for Trip Reports page: ${JSON.stringify(result)}`
      );
      filling.trails = result;
      res.render("trip-report", filling);
    });
  });
});

app.post("/trail/new", async function (req, res, next) {
  try {
    LOG.info(`ADD TRAIL: ${JSON.stringify(req.body)}`);
    const { trailAddPermit1, trailAddPermit2, trailAddPermit3 } = req.body;
    // filter out permits to add from the body: some may be blank, so we
    // exclude blank ones. We just want 1 of each if duplicates, so put
    // the blank filtered elements into a set.
    const permitIdsToAdd = Array.from(
      new Set( // uniques
        [trailAddPermit1, trailAddPermit2, trailAddPermit3]
          .filter((e) => e !== null && typeof e !== "undefined" && e.length > 0) // that are not undefined or ""
          .map((e) => Number(e)) // convert to number
          .filter((e) => Number.isInteger(e)) // that are integers
      )
    );
    LOG.info("Adding permit IDs:", permitIdsToAdd);
    const results = await wrapPromise(runQuery(queries.addTrail(req.body)));
    const trailPrimaryKey = results.insertId;

    // Make an array of promises to add a Trails_Permits entity
    const trailsPermitsAddQueries = permitIdsToAdd.map((permitId) =>
      wrapPromise(
        runQuery(
          queries.addTrailsPermits({
            trailId: trailPrimaryKey,
            permitId: permitId,
          })
        )
      )
    );

    // Wait for all the promises to resolve in parallel and return when all complete (or on first failure)
    Promise.all(trailsPermitsAddQueries)
      .then(function onSuccess(results) {
        LOG.info("got insert results", JSON.stringify(results));
        return res.status(200).json({});
      })
      .catch(function onFailure(err) {
        LOG.error("trails permits insert error", err);
        return res.status(500).json({});
      });
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.patch("/trail/:trailId", async function (req, res, next) {
  if (!req.params.trailId) {
    return res.status(400).json({});
  }
  try {
    await wrapPromise(
      runQuery(queries.updateTrailById(req.params.trailId, req.body))
    );
    // on success, return the patched object
    return res.status(200).json(req.body);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.patch("/permit/:permitId", async function (req, res, next) {
  if (!req.params.permitId) {
    return res.status(400).json({});
  }
  try {
    await wrapPromise(
      runQuery(queries.updatePermitById(req.params.permitId, req.body))
    );
    // on success, return the patched object
    return res.status(200).json(req.body);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.delete("/trail/:idToDelete", async function (req, res, next) {
  if (!req.params.idToDelete) {
    return res.status(400).json({});
  }
  try {
    const results = await wrapPromise(
      runQuery(queries.deleteTrailById(req.params.idToDelete))
    );
    return res.send(results);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.get("/trail/name/:trailName", async function (req, res, next) {
  if (!req.params.trailName) {
    return res.status(400).json({});
  }
  try {
    const results = await wrapPromise(
      runQuery(queries.getTrailByName(req.params.trailName))
    );
    return res.send(results);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.get("/permit/all", async function (req, res, next) {
  try {
    const results = await wrapPromise(runQuery(queries.getAllPermits()));
    return res.send(results);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.get("/trail/all", async function (req, res, next) {
  try {
    const results = await wrapPromise(runQuery(queries.getAllTrails()));
    return res.send(results);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.get("/permit/name/:permitName", async function (req, res, next) {
  if (!req.params.permitName) {
    return res.status(400).json({});
  }
  try {
    const results = await wrapPromise(
      runQuery(queries.getPermitByName(req.params.permitName))
    );
    return res.send(results);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

app.delete("/permit/:idToDelete", async function (req, res, next) {
  if (!req.params.idToDelete) {
    return res.status(400).json({});
  }
  try {
    const results = await wrapPromise(
      runQuery(queries.deletePermitById(req.params.idToDelete))
    );
    return res.send(results);
  } catch (err) {
    LOG.error("query err", err);
    return res.status(500).json({});
  }
});

// handle searching for a trail on /trail
app.get("/trail", async function (req, res, next) {
  console.log("Trail!", req.query);
  if (Object.keys(req.query).length > 0) {
    try {
      // query to get trails that are in Permit table
      LOG.info(`Incoming trail search: ${JSON.stringify(req.query)}`);
      const firstSearchResults = await wrapPromise(
        runQuery(buildTrailSearchFromQuery(req.query))
      );
      // If a particular permit type was selected, we send the query back
      //  immediately.
      if (! ["-1", "0"].includes(req.query.trailSearchPermit)) {
        return res.send(firstSearchResults);
      }
      if (req.query.trailSearchPermit === "-1") {
        // If the user made no permit selection, we make another query without
        //  permit table information, and then combine the two queries.
        LOG.debug("Inside the second query");
        var secondSearchResults;
        let queryArr = [
          "SELECT name,",
          "length_miles,",
          "elevation_gain_feet,",
          "city,",
          "state,",
          "country",
          "FROM Trails"];
        LOG.debug(`DEBUGGING:  here's the query:  ${JSON.stringify(req.query)}$`);
        // Checking to make sure the user selected something.  This should be
        //  caught by front end.  But double-checking here.
        if (
          req.query.trailSearchName !== '' ||
          req.query.trailSearchMinimumLength !== '' ||
          req.query.trailSearchMaximumLength !== '' ||
          req.query.trailSearchCity !== ''||
          req.query.trailSearchCountry !== ''
        ) {
          let whereArr = [];
          let optionsArr = [];
          if (req.query.trailSearchName !== '') {
            whereArr.push("name LIKE ?");
            optionsArr.push(`${req.query.trailSearchName}`);
          }
          if (req.query.trailSearchMinimumLength !=='') {
            whereArr.push("length_miles >= ?");
            optionsArr.push(Number.parseFloat(
              req.query.trailSearchMinimumLength));
          }
          if (req.query.trailSearchMaximumLength !=='') {
            whereArr.push("length_miles <= ?");
            optionsArr.push(Number.parseFloat(
              req.query.trailSearchMaximumLength));
          }
          if (req.query.trailSearchCity !== '') {
            whereArr.push("city LIKE ?");
            optionsArr.push(`%${req.query.trailSearchCity}%`);
          }
          if (req.query.trailSearchCountry !=='') {
            whereArr.push("country Like ?");
            optionsArr.push(`%${req.query.trailSearchCountry}%`);
          }
          const queryString = `${queryArr.join(" ")}` + " WHERE " +
            `${whereArr.join(" AND ")} ORDER BY name;`;
          LOG.info(`Sending this queryString: ${queryString}` +
          `with these options: ${optionsArr}`);
          secondSearchResults = await wrapPromise(
            runQuery({
              queryText: queryString,
              options:
              optionsArr
            }));
        } else {
          secondSearchResults = await wrapPromise(
            runQuery({
              queryText: `${queryArr.join(" ")} ORDER BY name;`,
              options: []
            }));
        }
        LOG.info(`Extra search without permits: ${JSON.stringify(secondSearchResults)}$`);
        // We now take the first query results (which has permit information, and
        //  add items as necessary from the second query results.
        const returnResults = [];
        while (firstSearchResults.length > 0 
          && secondSearchResults.length > 0) {
          // firstSearchResults contains permit info, so we take that in a tie
          if (firstSearchResults[0].name <= secondSearchResults[0].name) {
            var currentTrail = firstSearchResults.shift();
          } else {
            var currentTrail = secondSearchResults.shift();
          }
          if (returnResults.length == 0 || 
            currentTrail.name !== returnResults[returnResults.length-1].name) {
            returnResults.push(currentTrail);
          }
        }
        while (firstSearchResults.length > 0) {
          const currentTrail = firstSearchResults.shift();
          if (returnResults.length == 0 ||
            currentTrail.name !== returnResults[returnResults.length-1].name) {
            returnResults.push(currentTrail);
          }
        }
        while (secondSearchResults.length > 0) {
          const currentTrail = secondSearchResults.shift();
          if (returnResults.length == 0 ||
            currentTrail.name !== returnResults[returnResults.length-1].name) {
            returnResults.push(currentTrail);
          }
        }
        return res.send(returnResults);
      }
      if (req.query.trailSearchPermit==="0") {
        // If the user Selected "NO PERMIT", we make another query excluding
        // any trail with a permit.
        LOG.debug("Inside the 'no permit' query");
        var secondSearchResults;
        let queryArr = [
          "SELECT name,",
          "length_miles,",
          "elevation_gain_feet,",
          "city,",
          "state,",
          "country",
          "FROM Trails",
          ];
        LOG.debug(`DEBUGGING:  here's the query:  ${JSON.stringify(req.query)}$`);
        let whereArr = ["WHERE id NOT IN" +
          " (SELECT trail_id from Trails_Permits GROUP BY trail_id)"];
        let optionsArr = [];
        if (req.query.trailSearchName !== '') {
          whereArr.push("name LIKE ?");
          optionsArr.push(`${req.query.trailSearchName}`);
        }
        if (req.query.trailSearchMinimumLength !=='') {
          whereArr.push("length_miles >= ?");
          optionsArr.push(Number.parseFloat(
            req.query.trailSearchMinimumLength));
        }
        if (req.query.trailSearchMaximumLength !=='') {
          whereArr.push("length_miles <= ?");
          optionsArr.push(Number.parseFloat(
            req.query.trailSearchMaximumLength));
        }
        if (req.query.trailSearchCity !== '') {
          whereArr.push("city LIKE ?");
          optionsArr.push(`%${req.query.trailSearchCity}%`);
        }
        if (req.query.trailSearchCountry !=='') {
          whereArr.push("country Like ?");
          optionsArr.push(`%${req.query.trailSearchCountry}%`);
        }
        const queryString = `${queryArr.join(" ")}` + " " +
          `${whereArr.join(" AND ")} ORDER BY name;`;
        LOG.info(`Sending this queryString: ${queryString}` +
        `with these options: ${optionsArr}`);
        secondSearchResults = await wrapPromise(
          runQuery({
            queryText: queryString,
            options:
            optionsArr
          }));
        LOG.info(`Extra search with NO PERMITS: ${JSON.stringify(secondSearchResults)}$`);
        return res.send(secondSearchResults)
      }
    }
    catch (err) {
    console.log("query err", err);
    }
  } 
  filling = {};
  filling.permits = await wrapPromise(runQuery(queries.getPermits));
  res.render("trail", filling);
});

// handle searching for a permit or a trail on /admin
app.get("/admin", function (req, res, next) {
  console.log("Attention!  Administrator Present!");
  filling = {};
  res.render("admin", filling);
});

app.get("/reset/424242", function (req, res, next) {
  LOG.info("resetting the database to initial data population state");
  reset();
  res.status(200).json({ "reset": true });
});

app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});

app.listen(app.get("port"), function () {
  console.log(
    `HikedThis started.  Lace up your boots! http://localhost:${app.get(
      "port"
    )}`
  );
});
