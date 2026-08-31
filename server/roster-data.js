// =====================================================================
// COHORT ROSTER  —  who is allowed to take this assessment.
//
// The email a participant types on the identity screen must appear here,
// or they cannot start. Anyone else is told they are not registered.
//
// role:
//   "participant"  takes the assessment; no dashboard access
//   "admin"        opens the dashboard; CANNOT take the assessment
//
// The two roles are mutually exclusive. An admin address entered on the
// identity screen is turned away and pointed at the admin sign-in.
//
// Edit this file and run:  npm run roster:seed
// =====================================================================

module.exports = [
  { email: "nrajvans@bechtel.com", role: "admin"       },   // dashboard login
  { email: "schaudh2@bechtel.com", role: "admin"       },   // dashboard login
  { email: "ssrajpoo@bechtel.com", role: "participant" },
  { email: "abanke@bechtel.com",   role: "participant" },
  { email: "ndashora@bechtel.com", role: "participant" },
  { email: "garora3@bechtel.com",  role: "participant" },
  { email: "sgupta46@bechtel.com", role: "participant" },
  { email: "akuma172@bechtel.com", role: "participant" },
  { email: "rkshee@bechtel.com",   role: "participant" },
  { email: "asharm60@bechtel.com", role: "participant" },
  { email: "apande14@bechtel.com", role: "participant" },
  { email: "rverma6@bechtel.com",  role: "participant" },
  { email: "rgupta17@bechtel.com", role: "participant" },
  { email: "sbatra@bechtel.com",   role: "participant" },
  { email: "nbalani@bechtel.com",  role: "participant" },
  { email: "asharm26@bechtel.com", role: "participant" },
];
