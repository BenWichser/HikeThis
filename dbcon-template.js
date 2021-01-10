/* File intended to be personalized and inserted in a directory above this directory.  If placement is within the project file, then the first line will need to be altered (simplified). */
var mysql = require("./HikeThis/node_modules/mysql");

// these queries reset our database
const resetQueries = `
-- Truncate all tables
DELETE FROM Permits;
DELETE FROM IssuedPermits;
DELETE FROM TripReports;
DELETE FROM Hikers;
DELETE FROM Trails;
DELETE FROM Hikers_IssuedPermits;
DELETE FROM TripReports_Hikers;
DELETE FROM Trails_Permits;

-- Insert hikers.
INSERT INTO Hikers(name) VALUES ("Nishant P"), ("Erica R"), ("Zack F"), ("Grizzly Bear"), ("Jane Q Hiker");

-- Insert trails.
INSERT INTO Trails(name, length_miles, elevation_gain_feet, city, state, country) VALUES
    ("A Pretty Trail", 100, 3, "Portland", "Oregon", "US"),
    ("Mountain Marshmellow", 5, 2000, "Denver", "Colorado", "US"),
    ("Terrifying Scramble", 300, 7700, "Paris", null, "FR"),
    ("Morning Mist", 2, 1, "Seattle", "Washington", "US");

-- Trip reports written by said hikers about inserted trails.
INSERT INTO TripReports (trail_id, description, trail_condition, weather_condition, start_time, end_time, rating, difficulty) VALUES
(
    (SELECT id FROM Trails WHERE name = "A Pretty Trail"),
    "This trail is amazing, and you'll love it",
    "It was in great shape after the rain.",
    "Sunny with just a few clouds in the sky.",
    "2020-04-11 06:44:00",
    "2020-04-11 12:31:00",
    4,
    3.0
);
INSERT INTO TripReports_Hikers(trip_report_id, hiker_id) VALUES
   ((SELECT LAST_INSERT_ID()), (SELECT id FROM Hikers WHERE name = "Jane Q Hiker"));


INSERT INTO TripReports (trail_id, description, trail_condition, weather_condition, start_time, end_time, rating, difficulty) VALUES
(
    (SELECT id FROM Trails WHERE name = "Mountain Marshmellow"),
    "This trail is super mellow. Bring some marshmellows!",
    "Pillowy soft.",
    "The day felt like a smore and I was a Graham Cracker.",
    "2020-04-06 09:44:00",
    "2020-04-06 12:31:00",
    2,
    0.5
);
INSERT INTO TripReports_Hikers(trip_report_id, hiker_id) VALUES
   ((SELECT LAST_INSERT_ID()), (SELECT id FROM Hikers WHERE name = "Zack F"));


INSERT INTO TripReports (trail_id, description, trail_condition, weather_condition, start_time, end_time, rating, difficulty) VALUES
(
    (SELECT id FROM Trails WHERE name = "Terrifying Scramble"),
    "Don't go it alone. Bring a satellite communicator. This one's tough...",
    "There are several active rockslides and many hungry animals.",
    "It was pouring rain. There was lightning and hail.",
    "2020-04-03 09:44:00",
    "2020-04-03 12:31:00",
    2,
    4.5
);
INSERT INTO TripReports_Hikers(trip_report_id, hiker_id) VALUES
   ((SELECT LAST_INSERT_ID()), (SELECT id FROM Hikers WHERE name = "Erica R"));


INSERT INTO TripReports (trail_id, description, trail_condition, weather_condition, start_time, end_time, rating, difficulty) VALUES
(
    (SELECT id FROM Trails WHERE name = "Morning Mist"),
    "The mist was particularly misty this morning.",
    "I could not see the trail, through all of the mist...",
    "It was a perfect mist. Not enough to get wet, but enough to create atmospheric haze that swathed the land with garlands of light.",
    "2020-04-20 05:44:00",
    "2020-04-20 11:31:00",
    4,
    1.0
);
INSERT INTO TripReports_Hikers(trip_report_id, hiker_id) VALUES
   ((SELECT LAST_INSERT_ID()), (SELECT id FROM Hikers WHERE name = "Nishant P"));


-- Create three kinds of permits.
INSERT INTO Permits(name, duration_days) VALUES
  ("America The Beautiful Annual", 365),
  ("Northwest Forest Pass Daily", 1),
  ("Oregon State Parks Senior 2-Year Pass", 730);


-- Make all passes valid for all trails we added.
INSERT INTO Trails_Permits(trail_id, permit_id) VALUES
  ((SELECT id FROM Trails WHERE name = "Morning Mist"), (SELECT id FROM Permits WHERE name = "Northwest Forest Pass Daily")),
  ((SELECT id FROM Trails WHERE name = "Terrifying Scramble"), (SELECT id FROM Permits WHERE name = "Northwest Forest Pass Daily")),
  ((SELECT id FROM Trails WHERE name = "Mountain Marshmellow"), (SELECT id FROM Permits WHERE name = "Northwest Forest Pass Daily")),
  ((SELECT id FROM Trails WHERE name = "A Pretty Trail"), (SELECT id FROM Permits WHERE name = "Northwest Forest Pass Daily")),
  -- senior 2 year pass
  ((SELECT id FROM Trails WHERE name = "Morning Mist"), (SELECT id FROM Permits WHERE name = "Oregon State Parks Senior 2-Year Pass")),
  ((SELECT id FROM Trails WHERE name = "Terrifying Scramble"), (SELECT id FROM Permits WHERE name = "Oregon State Parks Senior 2-Year Pass")),
  ((SELECT id FROM Trails WHERE name = "Mountain Marshmellow"), (SELECT id FROM Permits WHERE name = "Oregon State Parks Senior 2-Year Pass")),
  ((SELECT id FROM Trails WHERE name = "A Pretty Trail"), (SELECT id FROM Permits WHERE name = "Oregon State Parks Senior 2-Year Pass")),
  -- America The Beautiful annual
  ((SELECT id FROM Trails WHERE name = "Morning Mist"), (SELECT id FROM Permits WHERE name = "America The Beautiful Annual")),
  ((SELECT id FROM Trails WHERE name = "Terrifying Scramble"), (SELECT id FROM Permits WHERE name = "America The Beautiful Annual")),
  ((SELECT id FROM Trails WHERE name = "Mountain Marshmellow"), (SELECT id FROM Permits WHERE name = "America The Beautiful Annual")),
  ((SELECT id FROM Trails WHERE name = "A Pretty Trail"), (SELECT id FROM Permits WHERE name = "America The Beautiful Annual"));

-- Issue America The Beautiful Annual permit to Erica R
INSERT INTO IssuedPermits(permit_id) VALUES
(
    (SELECT id FROM Permits where name = "America The Beautiful Annual")
);
INSERT INTO Hikers_IssuedPermits(hiker_id, issued_permit_id) VALUES
(
    (SELECT id FROM Hikers WHERE name = "Erica R"),
    (SELECT LAST_INSERT_ID())
);

-- Issue Oregon State Parks Senior 2-Year Pass permit to Grizzly Bear
INSERT INTO IssuedPermits(permit_id) VALUES
(
    (SELECT id FROM Permits where name = "Oregon State Parks Senior 2-Year Pass")
);

INSERT INTO Hikers_IssuedPermits(hiker_id, issued_permit_id) VALUES
(
    (SELECT id FROM Hikers WHERE name = "Grizzly Bear"),
    (SELECT LAST_INSERT_ID())
);

-- Issue Northwest Forest Pass Daily permit to Zack F.
INSERT INTO IssuedPermits(permit_id) VALUES
(
    (SELECT id FROM Permits where name = "Northwest Forest Pass Daily")
);

INSERT INTO Hikers_IssuedPermits(hiker_id, issued_permit_id) VALUES
(
    (SELECT id FROM Hikers WHERE name = "Zack F"),
    (SELECT LAST_INSERT_ID())
);

-- Issue Northwest Forest Pass Daily permit to Nishant P.
INSERT INTO IssuedPermits(permit_id) VALUES
(
    (SELECT id FROM Permits where name = "Northwest Forest Pass Daily")
);

INSERT INTO Hikers_IssuedPermits(hiker_id, issued_permit_id) VALUES
(
    (SELECT id FROM Hikers WHERE name = "Nishant P"),
    (SELECT LAST_INSERT_ID())
);
`;

var pool = mysql.createPool({
  connectionLimit: 10,
  host: "classmysql.engr.oregonstate.edu",
  user: "cs340_<ONID_NAME>",
  password: "<mysql_password>",
  database: "cs340_<ONID_NAME>",
  charset : "utf8mb4",
});

// reset resets our DB to its native state
const reset = () => {
  const conn = mysql.createConnection({
    multipleStatements: true,
    host: "classmysql.engr.oregonstate.edu",
    user: "cs340_<ONID_NAME>",
    password: "<mysql_password>",
    database: "cs340_<ONID_NAME>",
    charset : "utf8mb4",
  });
  conn.query(resetQueries, function (err, results) {
    console.log("reset query err:", err, "results:", results);
  });
};

module.exports = { pool, reset };
