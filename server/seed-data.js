// =====================================================================
// ASSESSMENT CONTENT  —  edit this file, then run:  npm run db:seed
// =====================================================================
//
// One entry per phase: "pre" and "post". Each holds ordered stages, each
// stage holds ordered items. Seeding is idempotent — a re-run replaces that
// phase's stages, items, options and rubrics wholesale. Attempts and their
// responses are never touched (use `npm run db:reset` for those).
//
// STAGE KINDS  (each drives a different screen in the client)
//   preflight       text row + a "blocked" checkbox, not scored
//   selfmap         0–4 band radio grid + per-row confidence
//   discriminators  MCQ, one item per screen, one-way, options shuffled
//   forensics       an artefact (code or narrative + evidence) + sub-part answers
//   handson         identifier fields + a "what stopped you" note
//   written         long-form answers with an advisory word counter
//   context         short answers and selects, not scored
//   review          completeness check and submit
//
// ITEM KINDS
//   preflight | band | single | multi | forensics | identifier | written
//   text | select
//
// SCORING  (see server/scoring.js — this is the whole of it)
//   single   1 if the chosen option is flagged isKey, else 0
//   multi    (correct − incorrect) / number-of-keys, floored at 0;
//            options flagged isNeutral neither earn nor cost anything
//   Dimensions come from the item's `dim`. "D3/D4" counts the item once
//   towards each. Only discriminators are auto-scored; forensics, hands-on
//   and written items are recorded for hand-grading against their rubrics.
//   NOTHING computes a composite score. That is deliberate.
//
// RUBRICS are reviewer-only. They are stripped from the participant payload
// server-side and are only ever served to /api/reviewer/* routes.
//
// IDS  Question and option ids are generated from phase + ref + position.
// =====================================================================

module.exports = [
  {
    "phase": "pre",
    "title": "Before three days on Databricks, Azure DevOps and MLOps",
    "subtitle": "Applied MLOps on Databricks and Azure DevOps",
    "lead": "This sets the pace of the programme, who you work with, what short pre-work you receive, and what the third day covers. It takes about 45 minutes, plus a 12–15 minute conversation booked separately.",
    "copy": {
      "eyebrow": "calibration, not examination",
      "readThis": [
        "There is no pass mark and no ranking. Your results are used for exactly four things: how fast we move each day, who you are paired with, which pre-work packet you get, and whether Day 3 covers operating models or extends the same loop to LLM workloads.",
        "Nothing here is reported to your management by name. The client receives a cohort-level summary, not a leaderboard. If that were not true, the rational response would be to game this, and a gamed calibration produces three days pitched at the wrong level — which costs you, not us.",
        "It is open-book. Use documentation, your own repositories, and an AI assistant if you want to — that is how you work, so it is how we should assess. Two consequences: tick the box at the end if you used one (no penalty, it helps us read your answers), and be warned that a generic correct-sounding answer scores in the middle. What scores well is specificity about systems you have actually operated."
      ],
      "stageBlurbs": [
        "Prove your workspace access and privileges actually work. Not scored, and the most useful five minutes here.",
        "Place yourself against behavioural anchors. Compared with what you do, never used alone.",
        "Fourteen scenarios, one per screen. No going back inside this stage.",
        "Three real artefacts. Tell us what breaks, and rank it.",
        "Fifteen minutes in the training workspace. Make an untracked run reproducible.",
        "Two short written answers about operating systems under time pressure.",
        "Roadmap and constraints. Not scored, and it decides what Day 3 covers.",
        "See what is unanswered, then submit."
      ],
      "identLead": "Needed for three things only: to send you the right pre-work packet, to book your interview slot, and so the trainer knows which answers belong together.",
      "identNote": "Your name sits on your answers so the trainer can pair you sensibly and send you the right pre-work. It does not appear against a capability band in anything the client receives."
    },
    "stages": [
      {
        "key": "m0",
        "kind": "preflight",
        "scored": false,
        "name": "Pre-flight",
        "meta": "5 min · not scored",
        "copy": {
          "eyebrow": "not scored",
          "h1": "Pre-flight: access and entitlements",
          "lead": "Every line below is a click-and-confirm. A capability gap can be patched with pre-work; a missing privilege on the morning of Day 1 cannot, because it belongs to someone who is not in the room.",
          "body": "If something fails, tick blocked and move on. That is a ticket for us to raise today, not a mark against you.",
          "reviewer": "“The workspace is provisioned” and “each of the ten can create a schema, write a table and register a model” are different statements, and only the second makes Day 1 possible. Ask a platform team whether access works and the answer is yes. Ask ten engineers to actually register a model and you find out. Any blocked item becomes a named ticket with an owner and a date, carried into the calibration memo as the one item Edstellar cannot solve."
        },
        "items": [
          {
            "ref": "pf0",
            "kind": "preflight",
            "stem": "Open the training Databricks workspace and attach a notebook to the provided compute",
            "hint": "Paste the compute or cluster name"
          },
          {
            "ref": "pf1",
            "kind": "preflight",
            "stem": "Create a schema in the training catalog",
            "hint": "Paste the statement you ran"
          },
          {
            "ref": "pf2",
            "kind": "preflight",
            "stem": "Create and write a small managed Delta table in that schema",
            "hint": "Paste the three-level table name"
          },
          {
            "ref": "pf3",
            "kind": "preflight",
            "stem": "Register a dummy model to Unity Catalog and set an alias on it",
            "hint": "Paste the model version and the alias"
          },
          {
            "ref": "pf4",
            "kind": "preflight",
            "stem": "Open the Azure DevOps project, clone the repo, push a branch",
            "hint": "Paste the branch name"
          },
          {
            "ref": "pf5",
            "kind": "preflight",
            "stem": "Open Environments in Azure DevOps and check whether you appear as an approver",
            "hint": "Yes, no, or not visible to me"
          },
          {
            "ref": "pf6",
            "kind": "preflight",
            "stem": "Reach both platforms on the browser and network you will actually use",
            "hint": "One line, plain English"
          }
        ]
      },
      {
        "key": "m1",
        "kind": "selfmap",
        "scored": true,
        "name": "Self-map",
        "meta": "5 min",
        "copy": {
          "h1": "Calibrated self-map",
          "lead": "Sixteen statements. Place yourself, then say how sure you are of the placement. Answer as the engineer you are on a bad Tuesday, not the engineer you are in an interview.",
          "anchors": [
            [
              "0 — New",
              "I have not done this."
            ],
            [
              "1 — Aware",
              "I understand it. I have not done it myself."
            ],
            [
              "2 — Practising",
              "I have done it with docs open, and I would want a review."
            ],
            [
              "3 — Fluent",
              "I do this unsupervised in work other people depend on."
            ],
            [
              "4 — Can teach it",
              "I have designed the approach for others and debugged it in production."
            ]
          ],
          "reviewer": "Self-rating is never used alone. Mean self-rating minus mean measured band gives the calibration index, used for two things only: where the trainer slows down without being asked, and pairing. +1.0 or more in a dimension means expect resistance at the first lab that contradicts the self-image — have the failing-gate demonstration ready and let the artefact make the argument. −0.7 or less is usually the strongest engineer in the room: pair them as a driver early so the room recalibrates who is credible. Never shown to the client, never described as overconfidence in writing."
        },
        "items": [
          {
            "ref": "sm0",
            "kind": "band",
            "stem": "Write a data ingestion job that is safe to re-run without duplicating or corrupting data",
            "dim": "D1",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm1",
            "kind": "band",
            "stem": "Enforce data quality so bad rows are quarantined rather than silently entering a table",
            "dim": "D1",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm2",
            "kind": "band",
            "stem": "Pin the exact version of a dataset used by a training run, and retrieve it months later",
            "dim": "D1/D2",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm3",
            "kind": "band",
            "stem": "Structure transformation code so it can be unit-tested and reused at scoring time",
            "dim": "D1/D3",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm4",
            "kind": "band",
            "stem": "Track experiments so any past run can be reproduced from the repository alone",
            "dim": "D2",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm5",
            "kind": "band",
            "stem": "Choose between candidate models with evidence a sceptical reviewer would accept",
            "dim": "D2",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm6",
            "kind": "band",
            "stem": "Register and promote a model so promotion is auditable and reversible",
            "dim": "D2",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm7",
            "kind": "band",
            "stem": "Answer “which data and which code produced the model serving production right now” in under five minutes",
            "dim": "D2/D4",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm8",
            "kind": "band",
            "stem": "Write a CI pipeline that fails a build for a reason other than a failing unit test",
            "dim": "D3",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm9",
            "kind": "band",
            "stem": "Design a quality gate that actually blocks a bad artefact rather than warning about it",
            "dim": "D3",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm10",
            "kind": "band",
            "stem": "Set up a release so a human approves and automation deploys, never the reverse",
            "dim": "D3",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm11",
            "kind": "band",
            "stem": "Roll back a deployed model and its pipeline together, under time pressure, with an audit trail",
            "dim": "D3/D4",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm12",
            "kind": "band",
            "stem": "Detect that a model in production has quietly become wrong while the service stays healthy",
            "dim": "D4",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm13",
            "kind": "band",
            "stem": "Diagnose a production regression by working backwards through lineage and monitoring",
            "dim": "D4",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm14",
            "kind": "band",
            "stem": "Authenticate a pipeline to a data platform without a personal token anywhere in the chain",
            "dim": "D5",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm15",
            "kind": "band",
            "stem": "Explain why a scheduled job’s cost tripled, and change it",
            "dim": "D5",
            "config": {
              "confidence": [
                "Low",
                "Med",
                "High"
              ]
            }
          },
          {
            "ref": "sm_free",
            "kind": "text",
            "stem": "Optional: name one thing on this list you would rather not be asked to do in front of colleagues, and why.",
            "hint": "Optional. Consistently the most useful single input to pairing.",
            "config": {
              "rows": 3
            }
          }
        ]
      },
      {
        "key": "m2",
        "kind": "discriminators",
        "scored": true,
        "oneWay": true,
        "onePerScreen": true,
        "name": "Discriminators",
        "meta": "12 min · 14 items",
        "copy": {
          "multiHint": "Select all that apply. Scoring is (correct − incorrect) ÷ number correct, floored at zero — so selecting everything is not a strategy, and neither is selecting one safe option."
        },
        "items": [
          {
            "ref": "Q1",
            "kind": "single",
            "dim": "D2",
            "stem": "Your workspace is Unity Catalog-enabled and running MLflow 3. A colleague’s promotion script calls client.transition_model_version_stage(name, version, “Production”). It fails. What is the correct next action?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ],
              "justify": "If you would do something other than the option you picked, say so here (this field is read, not ignored)."
            },
            "options": [
              {
                "text": "Grant the service principal additional privileges on the registered model and re-run.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Call mlflow.set_registry_uri(“databricks”) so the script targets the workspace registry, then re-run.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Replace the stage transition with an alias assignment and reference the model as models:/cat.schema.name@champion downstream.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Register the model again as a new version; the first registration did not complete.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Stage-transition APIs are unavailable on Unity Catalog-backed registries under MLflow 3; promotion is an alias reassignment. Option B is the trap — it works, by retargeting the legacy workspace registry, and abandons UC governance and lineage to do it. Award 0.5 for B only where the justification names it as a temporary workaround with a governance cost. A or D indicates a mental model roughly three years old: a pre-work signal, not a weakness."
              }
            ]
          },
          {
            "ref": "Q2",
            "kind": "single",
            "dim": "D1",
            "stem": "A nightly ingestion job occasionally double-counts rows after a retry. Which single change removes the failure mode rather than hiding it?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "Add a .distinct() before the write.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Ingest with a checkpointed incremental reader and land into the target with a MERGE keyed on a stable business key, so a re-run converges to the same state.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Lengthen the trigger interval so retries do not overlap.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Wrap the write in try/except and alert on failure.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Idempotence comes from a checkpointed reader plus a keyed MERGE, not from de-duplicating after the fact. A is the commonest answer from strong application engineers and is the one to notice: it removes the symptom and leaves the failure mode."
              }
            ]
          },
          {
            "ref": "Q3",
            "kind": "multi",
            "dim": "D2",
            "stem": "A training run must be reproducible six months from now, by someone else, from the repository alone. Which of these are necessary?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "The git commit SHA of the code that ran.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The version or snapshot identifier of the input table, not just its name.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Saved notebook cell outputs.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The resolved dependency set (pinned versions), not the unpinned requirements file.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The random seed, where the algorithm or the split is stochastic.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Autoscaling enabled on the cluster.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "C is an artefact of a session, not a reproduction path. F is irrelevant and catches pattern-matching on plausible platform features. Missing B alone is the most diagnostic single omission in the instrument: data is not yet thought of as a versioned dependency, which is exactly the Lab B2 principle."
              }
            ]
          },
          {
            "ref": "Q4",
            "kind": "single",
            "dim": "D3",
            "stem": "A CI stage must decide whether a candidate model may progress. Which threshold design is most defensible to an auditor?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "A fixed absolute metric value agreed once with the business.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The candidate must beat the incumbent on a held-out set the incumbent was not tuned on, clear an absolute floor, and not regress on any named segment — all three recorded with the run.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The candidate must beat the incumbent on the training data.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The data scientist who trained it signs off in the pull request.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "A fixed absolute threshold decays; comparison on data the incumbent was tuned on is meaningless; sign-off is not a gate. Segment non-regression is the part that separates band 3 from band 2."
              }
            ]
          },
          {
            "ref": "Q5",
            "kind": "single",
            "dim": "D4",
            "stem": "Prediction distribution in production has shifted noticeably over two days. Input feature distributions, measured on the feature table, are unchanged. The registered model version has not changed. Labels arrive in 60 days. Most probable cause?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "Concept drift: the relationship between features and target has changed.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The features computed at scoring time no longer match the features computed at training time — the scoring path has diverged from the training path.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Natural variance; two days is not a signal.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The monitoring job is computing drift on the wrong baseline window.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Unchanged marginals plus an unchanged model version rule out the simple explanations, which points at the scoring path having diverged from the training path. A is the seductive answer: concept drift changes the feature-to-target relationship, which is invisible in prediction distribution until labels arrive, so it does not explain the observation. IMPORTANT — do not mark this item as a logical certainty. The feature summary reports MARGINAL distributions; a change in the joint distribution or correlation structure can move predictions with identical marginals, and a stale monitoring baseline (D) is a real alternative. Award full credit to any answer that names joint-versus-marginal, or that picks D and justifies it by questioning what the summary actually measures. Choosing A without qualification indicates reasoning about ML theory rather than about the system, which is the most useful thing to know before Day 3."
              }
            ]
          },
          {
            "ref": "Q6",
            "kind": "single",
            "dim": "D3/D4",
            "stem": "A bad model reached production forty minutes ago. What is the fastest rollback that also leaves an audit trail?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "Delete the bad model version so nothing can load it.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Reassign the production alias to the previously serving version and redeploy the pinned bundle revision that matches it, then record the decision.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Revert the git commit and let CI redeploy on the next scheduled run.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Patch the scoring job to filter out anomalous predictions until a fix lands.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Alias reassignment alone is insufficient where the deployed job pins a version, hence the paired bundle redeploy. A destroys evidence. C is correct and far too slow. D is a coping mechanism dressed as a fix."
              }
            ]
          },
          {
            "ref": "Q7",
            "kind": "multi",
            "dim": "D3",
            "stem": "Which of these belong in the pipeline that runs on every pull request, as opposed to a later stage?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "Unit tests on transformation functions, against fixtures.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A schema and contract test against the input table definition.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Full retraining on the complete dataset.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Model validation of the candidate against the threshold, on a small fixed evaluation set.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A drift check against last week’s production traffic.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A smoke test that the packaged artefact loads and scores one record.",
                "isKey": true,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "C cannot run per pull request at any realistic scale; E requires production traffic and belongs downstream. Selecting C is a clean marker of enthusiasm outrunning release engineering."
              }
            ]
          },
          {
            "ref": "Q8",
            "kind": "single",
            "dim": "D3",
            "stem": "You must guarantee nothing reaches the production target without a named approver, and that the approver is never the author of the change. Which combination achieves this?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "A branch policy on main requiring one reviewer.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "An environment with an approval check configured so the requester cannot self-approve, plus a branch policy on main requiring a non-author reviewer and a green build.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A pipeline variable the release manager sets to true before deployment.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A YAML template that all pipelines must extend.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Environment approvals with self-approval disabled, plus a branch policy requiring a non-author reviewer and a green build. A alone protects the branch and not the deployment. C is a convention, not a control."
              }
            ]
          },
          {
            "ref": "Q9",
            "kind": "single",
            "dim": "D5",
            "stem": "Your deployment pipeline authenticates to the data platform. Which posture would you defend in a security review?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "A personal access token belonging to the team lead, stored as a secret pipeline variable.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A workload identity / federated service connection for a service principal, scoped per environment, with any residual secrets held in a vault and referenced at run time — no personal credential anywhere in the chain.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A shared service account token in the YAML, since the repository is private.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A long-lived token in a vault, rotated annually.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Federated workload identity per environment, no personal credential in the chain. A is the near-universal real-world answer and is worth zero: a personal token is a person-shaped single point of failure and an audit finding. D is better than A and still wrong."
              }
            ]
          },
          {
            "ref": "Q10",
            "kind": "single",
            "dim": "D1",
            "stem": "A feature column silently became 40% null after an upstream change. Training continued; the model degraded a fortnight later. Which control would have caught it earliest?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "A unit test on the transformation function, using fixtures.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A declared expectation on the table (null rate below a threshold) with a fail-or-quarantine action, evaluated on every pipeline run.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A model accuracy check in CI.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A schema conformance check on the table.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "A declared expectation catches it on the next run. A schema check passes because the column is still there and still nullable; a unit test passes because the function is still correct; an accuracy check catches it a fortnight later, which is the scenario. Getting this right is the strongest single predictor of a smooth Lab B2."
              }
            ]
          },
          {
            "ref": "Q11",
            "kind": "multi",
            "dim": "D5",
            "stem": "A scheduled scoring job’s cost tripled with no change in data volume or code. Where do you look first?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "Whether the job now runs on all-purpose compute rather than job compute.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Whether autoscaling maximums or instance types changed.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Whether retries are firing repeatedly and each attempt is billed.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Whether the model got architecturally larger.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Whether the input has fragmented into many small files, inflating shuffle and task overhead.",
                "isKey": true,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "D is a distractor: the model did not change. Selecting D alongside the rest is not fatal; selecting only D signals that cost is treated as somebody else’s dimension."
              }
            ]
          },
          {
            "ref": "Q12",
            "kind": "multi",
            "dim": "D2",
            "stem": "An auditor asks which exact data and code produced the model currently serving production. What is the minimum set you must be able to show?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "The registered model version and the run that produced it.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The git commit SHA of the training code.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The version or timestamp of the input table as read by that run.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The ID of the cluster the run executed on.",
                "isKey": false,
                "isNeutral": true
              },
              {
                "text": "The last saved output of the training notebook.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "The minimum lineage chain is model version, code commit, data version. D (compute identity) is scored NEUTRAL rather than wrong: it is not part of the minimum, but in a regulated engineering context an auditor may well demand it, and the original design deducted marks from the most audit-literate person in the room. E is not evidence of anything and does deduct."
              }
            ]
          },
          {
            "ref": "Q13",
            "kind": "single",
            "dim": "D3 / LLM",
            "stem": "You must make sure a prompt or retriever change cannot silently degrade an LLM feature in production. Which single mechanism gives the strongest guarantee?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "Peer review of every prompt change.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "An offline evaluation suite over a versioned golden set, wired as a pipeline stage with a pass threshold, so a below-threshold change cannot merge.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Setting temperature to zero.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A canary release to 5% of traffic with manual observation.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "An offline eval over a versioned golden set, wired as a blocking stage — the direct analogue of the Day 2 model gate, which is the whole point of Variant B. Award 0.5 for D: a canary is a real control, applied after exposure. Scores the LLM-exposure variable as well as D3."
              }
            ]
          },
          {
            "ref": "Q14",
            "kind": "single",
            "dim": "D4",
            "stem": "A scoring endpoint has been 100% available for thirty days, with nominal latency and no errors. Which claim is justified?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ]
            },
            "options": [
              {
                "text": "The model is healthy.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Serving health is established. Nothing whatsoever has been established about whether the predictions are still correct.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Retraining is not currently necessary.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The quality gate is working as designed.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "The one-sentence summary of Day 3. A participant who chooses A, C or D needs Variant A, whatever their roadmap says."
              }
            ]
          }
        ]
      },
      {
        "key": "m3",
        "kind": "forensics",
        "scored": true,
        "onePerScreen": true,
        "name": "Artefact forensics",
        "meta": "15 min · 3 items",
        "copy": {
          "lead": "Do not rewrite it. Tell us what is wrong, rank the two defects you consider most dangerous, and say what each causes in production. Bullet points are fine. Precision beats completeness."
        },
        "items": [
          {
            "ref": "F1",
            "kind": "forensics",
            "stem": "A release pipeline that passes and protects nothing",
            "config": {
              "cap": "azure-pipelines.yml · shipped, green for six weeks",
              "code": "trigger:\n  branches: { include: [ main ] }\n\nvariables:\n  DATABRICKS_HOST: https://adb-xxxx.azuredatabricks.net\n  DATABRICKS_TOKEN: dapi9f3a...   # team token\n\nstages:\n- stage: Test\n  jobs:\n  - job: unit\n    steps:\n    - script: pip install -r requirements.txt\n    - script: pytest tests/ || true\n\n- stage: ValidateModel\n  jobs:\n  - job: validate\n    steps:\n    - script: |\n        python cicd/validate.py --model-uri \"models:/proj.ml.cost_forecast/latest\" \\\n                                --metric mae --threshold 0.15\n      continueOnError: true\n\n- stage: DeployProd\n  jobs:\n  - job: deploy\n    steps:\n    - script: databricks bundle deploy -t prod\n    - script: databricks bundle run -t prod scoring_job",
              "lang": "yaml",
              "alt": "An Azure Pipelines YAML file with three stages: Test, ValidateModel and DeployProd. It contains an inline token in a plain variable, a pytest step suffixed with || true, a validation step with continueOnError set to true resolving the model URI to /latest, and a production deploy stage with no dependsOn and no environment.",
              "narrative": "",
              "evidence": [],
              "subs": [
                [
                  "a",
                  "List the defects you can see."
                ],
                [
                  "b",
                  "Rank the two most dangerous and say what each causes in production."
                ],
                [
                  "c",
                  "One defect makes the whole ValidateModel stage decorative. Which, and why?"
                ]
              ]
            },
            "rubrics": [
              {
                "kind": "defect",
                "ref": "F1.1",
                "label": "continueOnError: true on the validation step",
                "weight": "3",
                "detail": "The gate cannot fail the build. This is part (c) and the highest-weighted observation in the item."
              },
              {
                "kind": "defect",
                "ref": "F1.2",
                "label": "pytest … || true",
                "weight": "3",
                "detail": "Same defect class, one stage earlier. Naming both as one pattern is band-4 behaviour."
              },
              {
                "kind": "defect",
                "ref": "F1.3",
                "label": "A live token in a plain (non-secret) variable",
                "weight": "3",
                "detail": "Credential exposure in logs and repo; a person-shaped dependency. Cross-scores to D5."
              },
              {
                "kind": "defect",
                "ref": "F1.4",
                "label": "Validation resolves …/latest, not the candidate version",
                "weight": "2",
                "detail": "A race: the artefact validated is not provably the artefact deployed. Most subtle defect present."
              },
              {
                "kind": "defect",
                "ref": "F1.5",
                "label": "DeployProd declares no dependsOn",
                "weight": "2",
                "detail": "Deployment can proceed independently of validation."
              },
              {
                "kind": "defect",
                "ref": "F1.6",
                "label": "No environment on the production stage",
                "weight": "2",
                "detail": "No approval, no self-approval restriction. Reverses the Day 2 principle."
              },
              {
                "kind": "defect",
                "ref": "F1.7",
                "label": "Unpinned pip install",
                "weight": "1",
                "detail": "Environment drift between validation and serving."
              },
              {
                "kind": "defect",
                "ref": "F1.8",
                "label": "No rollback or pinned revision anywhere",
                "weight": "1",
                "detail": "No reverse gear. Credit when raised unprompted."
              },
              {
                "kind": "band",
                "ref": "1",
                "detail": "Two or three defects, mostly cosmetic. Does not identify that the gate cannot fail."
              },
              {
                "kind": "band",
                "ref": "2",
                "detail": "Four or more including F1.1, but ranked by visibility (the token, because it is shocking) rather than consequence — or not ranked."
              },
              {
                "kind": "band",
                "ref": "3",
                "detail": "F1.1, F1.3 and two others; ranks with a stated reason; names the production consequence of the top two."
              },
              {
                "kind": "band",
                "ref": "4",
                "detail": "Band 3 plus either F1.4 or the observation that F1.1 and F1.2 are one pattern, plus a tool-agnostic statement of the principle."
              }
            ]
          },
          {
            "ref": "F2",
            "kind": "forensics",
            "stem": "A training script that cannot be reproduced",
            "config": {
              "cap": "training/train_cost_forecast.py · current",
              "code": "import mlflow, pandas as pd\nfrom sklearn.ensemble import GradientBoostingRegressor\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import mean_absolute_error\n\ndf = spark.sql(\"SELECT * FROM proj.gold.activity_features\").toPandas()\n\ndf[\"duration_norm\"] = (df.duration - df.duration.mean()) / df.duration.std()\ndf[\"is_critical\"]   = (df.float_days < 5).astype(int)\n\nX = df.drop(columns=[\"actual_cost\"]); y = df.actual_cost\nXtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2)\n\nmlflow.set_experiment(\"/Users/me@bechtel.com/cost-experiments\")\nwith mlflow.start_run():\n    m = GradientBoostingRegressor(n_estimators=400, learning_rate=0.05).fit(Xtr, ytr)\n    mae = mean_absolute_error(yte, m.predict(Xte))\n    mlflow.log_metric(\"mae\", mae)\n    mlflow.sklearn.log_model(m, \"model\")\n\nif mae < 0.15:\n    uri = \"runs:/\" + run.info.run_id + \"/model\"\n    v = mlflow.register_model(uri, \"proj.ml.cost_forecast\")\n    client.set_registered_model_alias(\n        \"proj.ml.cost_forecast\", \"champion\", v.version)",
              "lang": "python",
              "alt": "A Python training script that reads a table with SELECT star and no version pin, computes normalisation statistics on the whole dataframe inline, splits without a random state, logs only a single metric, logs a model without a signature, and then registers the model and assigns the champion alias from inside the training script.",
              "narrative": "",
              "evidence": [],
              "subs": [
                [
                  "a",
                  "Name the defects."
                ],
                [
                  "b",
                  "Which two most threaten reproducibility six months from now?"
                ],
                [
                  "c",
                  "One defect will eventually produce a model that scores well in training and badly in production, for reasons unrelated to the algorithm. Identify it and explain the mechanism."
                ],
                [
                  "d",
                  "There is a governance defect in the last four lines. What is it, and what would you replace it with?"
                ]
              ]
            },
            "rubrics": [
              {
                "kind": "defect",
                "ref": "F2.1",
                "label": "Feature engineering inline, not in an importable testable module",
                "weight": "3",
                "detail": "Part (c): the same transformations must be recomputed at scoring time, and the moment they are reimplemented anywhere else, training and serving diverge silently. Statistics computed on the whole dataframe compound it — they leak across the split and cannot be reproduced at inference."
              },
              {
                "kind": "defect",
                "ref": "F2.2",
                "label": "SELECT * with no version pin",
                "weight": "3",
                "detail": "Unreproducible by next month. Cross-scores to D2."
              },
              {
                "kind": "defect",
                "ref": "F2.3",
                "label": "train_test_split with no random_state",
                "weight": "2",
                "detail": "The metric is not reproducible even on identical data."
              },
              {
                "kind": "defect",
                "ref": "F2.4",
                "label": "Model logged without a signature or input example",
                "weight": "2",
                "detail": "Serving-time contract undefined."
              },
              {
                "kind": "defect",
                "ref": "F2.5",
                "label": "Registration and alias assignment inside the training script",
                "weight": "3",
                "detail": "Part (d): training promotes itself. Promotion belongs to a gated stage with an approval. Replacement: log and register a candidate, let CI validate, let the release assign the production alias."
              },
              {
                "kind": "defect",
                "ref": "F2.6",
                "label": "No parameters logged",
                "weight": "2",
                "detail": "Comparison across runs impossible; the Day 1 gate is undefendable."
              },
              {
                "kind": "defect",
                "ref": "F2.7",
                "label": "Experiment on a personal user path",
                "weight": "1",
                "detail": "Team invisibility; disappears with the account."
              },
              {
                "kind": "defect",
                "ref": "F2.8",
                "label": "run_id and client referenced but never defined",
                "weight": "1",
                "detail": "The script would not execute. Noticing it signals how carefully artefacts are read."
              },
              {
                "kind": "band",
                "ref": "3",
                "detail": "Requires F2.1 or F2.2 plus a correct mechanism for part (c)."
              },
              {
                "kind": "band",
                "ref": "4",
                "detail": "Part (d) names gated promotion, not merely “someone should review it”."
              }
            ]
          },
          {
            "ref": "F3",
            "kind": "forensics",
            "stem": "An incident, with the evidence you would actually have",
            "config": {
              "cap": "incident · monday morning · four artefacts, nothing more",
              "code": "",
              "lang": "",
              "alt": "",
              "narrative": "A scoring job has run green every morning for eleven weeks. Nobody has touched the model or the training code in six weeks. On Monday, a planning lead says the forecasts have felt wrong since roughly the middle of last week. The service has recorded no errors. You have exactly the four pieces of evidence below.",
              "evidence": [
                [
                  "Monitoring table, prediction summary",
                  "Daily mean prediction flat at ~412 for ten weeks, then 388, 361, 344, 349, 341 over the last five working days. Standard deviation halves across the same window."
                ],
                [
                  "Monitoring table, feature summary",
                  "All monitored numeric features within their usual ranges. Null rates unchanged. One row reports a new column, crew_size_v2, first seen eight days ago."
                ],
                [
                  "Pipeline run history",
                  "All runs succeeded. The gold-layer refresh eight days ago logged a schema-evolution event; that day’s run took 40% longer than usual."
                ],
                [
                  "Scoring job log excerpt",
                  "No warnings. The job loads models:/proj.ml.cost_forecast@champion and writes predictions. The feature assembly step selects a fixed list of columns."
                ]
              ],
              "subs": [
                [
                  "a",
                  "Your single most probable root-cause hypothesis."
                ],
                [
                  "b",
                  "The one query or check you would run first — and what result would kill the hypothesis."
                ],
                [
                  "c",
                  "The fix for today."
                ],
                [
                  "d",
                  "The guardrail that stops this class of failure recurring, and the layer it belongs at."
                ],
                [
                  "e",
                  "Why did every monitor stay green?"
                ]
              ]
            },
            "rubrics": [
              {
                "kind": "chain",
                "detail": "Intended chain: the gold-layer refresh evolved the schema eight days ago, adding crew_size_v2 — almost certainly a rename or re-type of an existing column. The scoring job assembles features from a fixed column list, so it never sees the new column and the old one is now absent, empty or stale. The model receives a degraded input, keeps predicting, and the distribution collapses towards the mean. Feature monitoring stayed green because it monitors the feature table, not the vector the model received; the service stayed green because serving a wrong number is not an error."
              },
              {
                "kind": "band",
                "ref": "(a) Hypothesis",
                "detail": "1: blames drift or the model. 2: notices the schema event and the eight-day coincidence. 3: connects it to the fixed column list in the scoring path. 4: states it as training-serving skew from an upstream contract change, before proposing any action."
              },
              {
                "kind": "band",
                "ref": "(b) The one check",
                "detail": "3: names a specific check — compare the actual feature vector for a scored key against the same features recomputed from the training path, or inspect schema history around the event. 4: states what result would kill it. Any answer that cannot be wrong scores 1."
              },
              {
                "kind": "band",
                "ref": "(c) Fix today",
                "detail": "2: retrain. 3: restore the input contract, backfill or re-score the affected window, then decide about retraining. 4: adds — do not retrain on the contaminated window."
              },
              {
                "kind": "band",
                "ref": "(d) Guardrail",
                "detail": "2: “add monitoring”. 3: a schema or contract test at the boundary between gold and the scoring path, enforced in the pipeline. 4: places it at the producing layer as a contract, and monitors the served feature vector, not only the feature table."
              },
              {
                "kind": "band",
                "ref": "(e) Why green",
                "detail": "3: distinguishes serving health from prediction correctness, and observes the monitored surface was not the consumed surface. 4: generalises — what is monitored and what is consumed must be the same object, or the monitor is decorative."
              }
            ]
          }
        ]
      },
      {
        "key": "m4",
        "kind": "handson",
        "scored": true,
        "name": "Hands-on task",
        "meta": "15 min · in workspace",
        "copy": {
          "eyebrow": "in the training workspace",
          "h1": "Hands-on micro-task",
          "lead": "A notebook named 00_calibration_task is waiting in your scratch schema. It trains, prints a metric, and leaves no trace. Fifteen minutes.",
          "steps": [
            "Make the run reproducible: log parameters, the metric, and the model with a signature, to your own experiment.",
            "Pin the input: record the exact version of the source Delta table the run read, in a way another person could act on.",
            "Register the model to Unity Catalog under your scratch schema and set an alias on the version.",
            "Paste the four identifiers below."
          ],
          "body": "Permitted: documentation, an AI assistant, copying from your own past work. Not required: elegance, a better model, or finishing early.",
          "reviewerNote": "If the task is incomplete for environment reasons, score the dimension from remaining evidence and record the environment failure separately. Never let a platform defect land on a person’s band."
        },
        "items": [
          {
            "ref": "m4_run",
            "kind": "identifier",
            "stem": "Run ID",
            "hint": "paste here"
          },
          {
            "ref": "m4_model",
            "kind": "identifier",
            "stem": "Registered model · three-level name and version",
            "hint": "paste here"
          },
          {
            "ref": "m4_alias",
            "kind": "identifier",
            "stem": "Alias you set",
            "hint": "paste here"
          },
          {
            "ref": "m4_pin",
            "kind": "identifier",
            "stem": "How you pinned the input data version",
            "hint": "paste here"
          },
          {
            "ref": "m4_blocked",
            "kind": "text",
            "stem": "If you could not finish, what stopped you? Be specific about which step and which error.",
            "hint": "A permissions error here is information about the environment, not about you.",
            "config": {
              "rows": 3
            },
            "rubrics": [
              {
                "kind": "check",
                "label": "A run exists with parameters and the metric logged",
                "weight": "2",
                "detail": "Auto-checkable. Parameters logged but empty scores 1."
              },
              {
                "kind": "check",
                "label": "A model is logged with a signature",
                "weight": "2",
                "detail": "The commonest omission; mirrors F2.4."
              },
              {
                "kind": "check",
                "label": "A registered version exists in the participant’s scratch schema with an alias set",
                "weight": "2",
                "detail": "Doubles as proof of CREATE MODEL and alias privilege."
              },
              {
                "kind": "check",
                "label": "The input data version is recorded so another person could act on it",
                "weight": "3",
                "detail": "Highest weight, widest spread. A logged Delta version, a run tag, or reading a specific table version all earn full credit. “I noted it in a markdown cell” earns 1."
              },
              {
                "kind": "check",
                "label": "The submitted identifiers actually resolve",
                "weight": "1",
                "detail": "A surprising number will not. Pasting an identifier you did not verify is itself a signal."
              }
            ]
          }
        ]
      },
      {
        "key": "m5",
        "kind": "written",
        "scored": true,
        "name": "Judgement",
        "meta": "8 min",
        "copy": {
          "h1": "Judgement in writing",
          "lead": "Roughly 150 words each. The counter is advisory. What is read most closely is what each answer chooses to leave out."
        },
        "items": [
          {
            "ref": "W1",
            "kind": "written",
            "stem": "“A model can be perfectly fine while the system around it fails.” Describe one concrete instance — from something you have operated, or from something you would expect in a project-controls context — and name the one signal that would have surfaced it first. If you have never seen this happen, say so and design it instead; that answer is not penalised.",
            "config": {
              "rows": 6,
              "wordTarget": 150
            },
            "rubrics": [
              {
                "kind": "band",
                "ref": "W1",
                "detail": "1: restates the prompt. 2: a plausible generic example with no operational detail. 3: a specific instance with a named signal and a reason it would fire first. 4: the signal is defended against an alternative that would have fired later or not at all. A fluent, correct, entirely unspecific answer is the signature of a generic or model-assisted answer and belongs in band 2 — intended behaviour of the scoring, not a failure of it."
              }
            ]
          },
          {
            "ref": "W2",
            "kind": "written",
            "stem": "It is 15:00 on a Friday. A pipeline your team owns must be deployed today; you did not write it and you have thirty minutes. Name the three things you do, and the two things you deliberately do not do. The second list is the one we read most carefully.",
            "config": {
              "rows": 6,
              "wordTarget": 150
            },
            "rubrics": [
              {
                "kind": "band",
                "ref": "W2",
                "detail": "1: three heroic actions, no restraint list. 2: sensible actions; the “do not” list contains things they would not have done anyway. 3: actions ordered by risk reduction per minute, and the restraint list contains something genuinely tempting — refactoring, a version bump, widening scope, deploy-and-watch over the weekend. 4: names the condition under which they would refuse to deploy at all."
              }
            ]
          }
        ]
      },
      {
        "key": "m6",
        "kind": "context",
        "scored": false,
        "name": "Context",
        "meta": "4 min · not scored",
        "copy": {
          "eyebrow": "not scored",
          "h1": "Context and roadmap",
          "lead": "No score attached to any of this. It decides what Day 3 covers and caps how much pre-work you are sent."
        },
        "items": [
          {
            "ref": "C1",
            "kind": "text",
            "stem": "In one sentence: what do you own today that runs on a schedule and that someone would notice if it stopped?",
            "config": {
              "rows": 2
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "decides",
                "detail": "Instruction anchors; how real “production” is for this cohort."
              }
            ]
          },
          {
            "ref": "C2",
            "kind": "select",
            "stem": "Closest to your last six months",
            "config": {
              "choices": [
                "Mostly building models",
                "Mostly data engineering",
                "Mostly application or platform engineering",
                "Mostly LLM and retrieval work",
                "Mixed"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "decides",
                "detail": "Pairing on complementary axes — data-leaning, delivery-leaning, model-leaning."
              }
            ]
          },
          {
            "ref": "C3",
            "kind": "select",
            "stem": "Over the next two quarters, is there LLM or retrieval work on your plate?",
            "config": {
              "choices": [
                "None foreseen",
                "Exploratory, unfunded",
                "Scoped and funded",
                "Already in build",
                "Already in production"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "decides",
                "detail": "The Variant A / B demand test: six or more at “scoped and funded” or beyond, confirmed as named, dated and funded in interview probe P5 for at least four."
              }
            ]
          },
          {
            "ref": "C4",
            "kind": "text",
            "stem": "What is currently done by hand in your delivery loop that you most want automated?",
            "config": {
              "rows": 2
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "decides",
                "detail": "Lab framing; the first-90-days sketch on the final afternoon."
              }
            ]
          },
          {
            "ref": "C5",
            "kind": "select",
            "stem": "Realistically, how many hours of pre-work can you protect in the week before delivery?",
            "config": {
              "choices": [
                "0–1",
                "2",
                "3–4",
                "More"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "decides",
                "detail": "Hard cap on pre-work. No participant receives more than they said they could protect, or more than four hours. If triggers demand more than four hours for three or more people, the cohort is mis-scoped and the memo says so."
              }
            ]
          },
          {
            "ref": "C6",
            "kind": "text",
            "stem": "What would make these three days a waste of your time?",
            "config": {
              "rows": 4
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "decides",
                "detail": "Read verbatim by the trainer before Day 1, and quoted in the memo."
              }
            ]
          },
          {
            "ref": "C7",
            "kind": "select",
            "stem": "Did you use an AI assistant on any part of this? There is no penalty — it helps us read your answers correctly.",
            "config": {
              "choices": [
                "No",
                "Yes, for some of it",
                "Yes, throughout"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "decides",
                "detail": "Read-calibration only. Never enforcement."
              }
            ]
          }
        ]
      },
      {
        "key": "review",
        "kind": "review",
        "scored": false,
        "name": "Check and submit",
        "meta": "—",
        "copy": {
          "h1": "Check and submit",
          "leadIncomplete": "Some things are unanswered. That is allowed — a blank is data too. Fill anything you want to fill, then submit.",
          "leadComplete": "Everything is answered. No score is calculated here and none will be shown to you.",
          "whatNext": [
            "The trainer books a 12–15 minute conversation with you. It covers the last change you shipped, a time data broke something downstream, how you would know today if something you own were quietly wrong, what you can and cannot do yourself in the workspace, and whether LLM work is genuinely landing on you.",
            "Then a one-page memo goes to the sponsor with four decisions and one recommendation. Nobody is named against a capability band in it."
          ]
        },
        "items": []
      }
    ]
  },
  {
    "phase": "post",
    "title": "After three days on Databricks, Azure DevOps and MLOps",
    "subtitle": "Applied MLOps on Databricks and Azure DevOps",
    "lead": "The same instrument, run again after delivery, so movement is measured against the pre-assessment rather than asserted.",
    "copy": {
      "eyebrow": "calibration, not examination",
      "stageBlurbs": [
        "Prove your workspace access and privileges actually work. Not scored, and the most useful five minutes here.",
        "Place yourself against behavioural anchors. Compared with what you do, never used alone.",
        "Fourteen scenarios, one per screen. No going back inside this stage.",
        "Three real artefacts. Tell us what breaks, and rank it.",
        "Fifteen minutes in the training workspace. Make an untracked run reproducible.",
        "Two short written answers about operating systems under time pressure.",
        "Roadmap and constraints. Not scored, and it decides what Day 3 covers.",
        "See what is unanswered, then submit."
      ]
    },
    "stages": []
  }
];
