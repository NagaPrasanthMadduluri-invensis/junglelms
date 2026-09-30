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
//   selfmap         0–4 band radio grid + a per-row select
//   discriminators  MCQ, one item per screen, one-way, options shuffled
//   evidence        collapsible exhibits + exact-answer questions
//   forensics       an artefact (code or narrative + evidence) + sub-part answers
//   handson         identifier fields + a "what stopped you" note
//   written         long-form answers with an advisory word counter
//   context         short answers and selects, not scored
//   review          completeness check and submit
//
// ITEM KINDS
//   preflight | band | single | multi | exact | forensics | identifier
//   written | text | select
//
// MULTI-PART ITEMS  Two kinds answer through parts rather than a single
// value, and each part becomes its own response row:
//   forensics  config.subs  [key, label, "code"?]   → F1_a, F1_b, …
//   exact      config.parts {key,label,kind,…}      → E1_ver, E1_run, E1_w
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
// server-side and are only ever served to /api/reviewer/* routes. The
// evidence desk's expected answers live there too (kind "exact"), for the
// same reason: they must never reach the browser taking the assessment.
//
// A NOTE ON THE POST ANSWER KEY. The pre assessment was ported from an
// interactive build that carried its key inline, so its isKey flags are the
// author's. The post assessment was supplied as a participant build with
// the reviewer payload stripped ("reviewer payload removed from this
// build"), so its keys, neutrals, rubrics and evidence-desk answers below
// were derived from the items themselves. They are worth a read-through
// against the author's reviewer build if one arrives.
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
        "Nothing here is reported to your management by name. Bechtel receives a cohort-level summary, not a leaderboard. If that were not true, the rational response would be to game this, and a gamed calibration produces three days pitched at the wrong level — which costs you, not us.",
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
      "identNote": "Your name sits on your answers so the trainer can pair you sensibly and send you the right pre-work. It does not appear against a capability band in anything Bechtel receives."
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
          "reviewer": "Self-rating is never used alone. Mean self-rating minus mean measured band gives the calibration index, used for two things only: where the trainer slows down without being asked, and pairing. +1.0 or more in a dimension means expect resistance at the first lab that contradicts the self-image — have the failing-gate demonstration ready and let the artefact make the argument. −0.7 or less is usually the strongest engineer in the room: pair them as a driver early so the room recalibrates who is credible. Never shown to Bechtel, never described as overconfidence in writing."
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
              "rows": 3,
              "optional": true
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
            "Then a one-page memo goes to Bechtel with four decisions and one recommendation. Nobody is named against a capability band in it."
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
    "lead": "This measures what changed between your pre-assessment and now. It takes about an hour. Set aside ninety minutes and do it in one sitting.",
    "copy": {
      "eyebrow": "after the programme",
      "h1": "After the three days: what stayed with you",
      "readThis": [
        "Your answers are compared with your own pre-assessment, not with anyone else’s. There is no pass mark, no ranking, and no single score is calculated.",
        "Nothing here needs a workspace, a repository or a pipeline. Where the pre-assessment asked you to do something in the platform, this one shows you what the platform would show you and asks what it means. Everything you need is on the screen.",
        "You may use documentation. Please do not use an AI assistant on the evidence desk, the forensics or the written stages. Those are where we find out what you can now produce yourself, and assistance hides exactly that. If you use one anyway, say so at the end. Your answers are still read."
      ],
      "warnTitle": "Several items will look familiar",
      "warnBody": "They are not the same as the ones you saw before. Read each one to the end before you answer.",
      "stageBlurbs": [
        "The same sixteen statements as before. Place yourself now, and say how you got there.",
        "Sixteen scenarios, one per screen. No going back inside this stage.",
        "A snapshot of a real-shaped workspace and release history. Six questions whose answers are in the evidence.",
        "Three artefacts. Find what is wrong, including what is missing, then write the fix.",
        "Three short written answers.",
        "What you have done since. Not scored.",
        "See what is unanswered, then submit."
      ],
      "identLead": "Needed so your answers can be set against your own pre-assessment, and nothing else."
    },
    "stages": [
      {
        "key": "p1",
        "kind": "selfmap",
        "scored": true,
        "name": "Self-map",
        "meta": "6 min",
        "copy": {
          "h1": "Calibrated self-map",
          "lead": "The same sixteen statements and the same anchors as before. Place yourself as you are today, then say how you came by it during the programme.",
          "body": "If you now rate yourself lower on something than you did before, that is useful and entirely allowed. It usually means you now know what the statement actually demands.",
          "confHead": "In the programme",
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
          "reviewer": "Read against the same person's pre-assessment row, never against the cohort. Movement of +1 on a row whose 'In the programme' answer is 'Watched it done' is a claim the measured stages have to support; movement downwards on a row they rated highly before is usually the most honest signal in the instrument and should be read as calibration improving, not capability falling. A row still marked 'Not covered for me' is a gap in the delivery, not in the person."
        },
        "items": [
          {
            "ref": "sm0",
            "kind": "band",
            "stem": "Write a data ingestion job that is safe to re-run without duplicating or corrupting data",
            "dim": "D1",
            "config": {
              "confidence": [
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
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
                "I did it myself",
                "In my pair, partner at the keyboard",
                "Watched it done",
                "Not covered for me"
              ]
            }
          },
          {
            "ref": "sm_free",
            "kind": "text",
            "stem": "Optional: one statement on this list you still would not want to do in front of colleagues, and what would change that.",
            "hint": "Optional.",
            "config": {
              "rows": 3,
              "optional": true
            }
          }
        ]
      },
      {
        "key": "p2",
        "kind": "discriminators",
        "scored": true,
        "oneWay": true,
        "onePerScreen": true,
        "name": "Discriminators",
        "meta": "18 min · 16 items",
        "copy": {
          "multiHint": "Select all that apply. Scoring is (correct − incorrect) ÷ number correct, floored at zero, so selecting everything is not a strategy, and neither is selecting one safe option."
        },
        "items": [
          {
            "ref": "P1",
            "kind": "multi",
            "dim": "D2",
            "stem": "Your registry is Unity Catalog-backed and the workspace runs MLflow 3. Which of these statements are true?",
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
                "text": "A single model version can carry more than one alias at the same time.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "An alias points to exactly one version of a registered model at any moment.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Reassigning an alias creates a new model version that records the change.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Stage transitions such as Staging to Production become available if the client is pointed at the Unity Catalog registry URI.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A job that loaded models:/proj.ml.cost_forecast@champion keeps the version it resolved at load time, even if the alias is moved while the job is running.",
                "isKey": true,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Unity Catalog aliases: one version may hold several aliases, an alias resolves to exactly one version, and models:/…@alias is resolved once at load time — moving the alias mid-run does not swap the loaded model. Reassigning an alias creates no new version, and stage transitions are not restored by pointing the client at the UC registry URI; they are simply absent from UC-backed registries."
              }
            ]
          },
          {
            "ref": "P2",
            "kind": "single",
            "dim": "D1",
            "stem": "Nightly ingestion reads a landing volume with Auto Loader, keeps the latest record per activity_id in each batch, and MERGEs into proj.silver.activity on activity_id. In a bundle refactor, the checkpoint location changed to a path that includes the job run ID. Nothing else changed. What happens from now on?",
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
                "text": "Every run treats all files already in the landing volume as new. The MERGE keeps the table correct, but each run now costs in proportion to the whole history of the source rather than the day’s new files.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Every run appends duplicate rows, because the new checkpoint has no record of what the MERGE already wrote.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Auto Loader finds the earlier checkpoint under the parent path and resumes from it, so nothing changes.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The second run fails, because a checkpoint location must already exist before the stream starts.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "A checkpoint that contains the run ID is a new checkpoint every run, so Auto Loader re-lists the whole landing volume as unseen. The MERGE on activity_id keeps the table correct — that is why nobody notices — while the cost of every run becomes proportional to the entire source history. The trap is answering 'duplicate rows': idempotence comes from the MERGE, not the checkpoint."
              }
            ]
          },
          {
            "ref": "P3",
            "kind": "multi",
            "dim": "D2",
            "stem": "A training run logged the commit SHA, a pinned lockfile, the seed, and source_table_version = 41 for proj.silver.activity. Seven months later, reading that table VERSION AS OF 41 fails. Which of these, done at training time, would have kept the run reproducible?",
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
                "text": "Set delta.deletedFileRetentionDuration and delta.logRetentionDuration on the source table to cover the reproducibility window.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Materialise the exact rows the run read as their own governed table, for example a deep clone at version 41, and log that table’s name and version with the run.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Log the table name only. Unity Catalog lineage records which version of the table each run read.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Save the training frame as a Parquet artefact attached to the run.",
                "isKey": false,
                "isNeutral": true
              },
              {
                "text": "Run OPTIMIZE on the source table after training, so version 41 is compacted into durable files.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Record the timestamp of the read instead of the version number, because TIMESTAMP AS OF is not affected by VACUUM.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "VERSION AS OF 41 fails because VACUUM removed the files it referenced. Only two things done at training time survive that: extending the retention properties to cover the window, or materialising the rows read as their own governed object and logging it. Lineage records which version was read, not the bytes. OPTIMIZE makes it worse, and TIMESTAMP AS OF reads the same removed files. A Parquet artefact on the run does preserve the data, so it is neither credited nor penalised — it is ungoverned and does not scale, but it is not wrong."
              }
            ]
          },
          {
            "ref": "P4",
            "kind": "single",
            "dim": "D3",
            "stem": "A gate compares the candidate with the incumbent on a held-out set that neither was tuned on. Candidate MAE 0.118, incumbent 0.124, absolute floor 0.150: the gate passes. The same report shows the lump-sum contracts segment (3,200 rows) at 0.207 for the candidate against 0.161 for the incumbent. The gate definition checks only the overall comparison and the floor. What is the right call?",
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
                "text": "Promote. The overall comparison is the pre-agreed rule, and changing the rule after seeing a result is itself a governance failure.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Block this candidate and treat the pass as evidence that the gate is incomplete. Add segment non-regression to the gate definition, recorded with the run, before the next candidate is evaluated.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Promote, and add a monitor on the lump-sum segment in production.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Retrain with the segment up-weighted, and promote the result if it clears the same gate.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "The gate passed and the candidate is worse where it matters. Promoting on the technicality is the failure the programme is about; so is quietly rewriting the rule to force the answer you now want. The defensible move is to block this candidate and fix the gate definition, recorded with the run, before the next candidate is judged. 'Promote and monitor' is the commonest wrong answer: it moves a known regression into production and calls the monitor a control."
              }
            ]
          },
          {
            "ref": "P5",
            "kind": "single",
            "dim": "D4",
            "stem": "The monitor on the feature table is green, and the null rate for crew_size there is steady at 1%. The monitor on the inference table, which records the vectors the model actually received, shows crew_size = 0 for 38% of scored rows since Tuesday. The model version and the scoring code have not changed. What is the most probable cause?",
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
                "text": "Concept drift: the relationship between crew size and cost has changed since Tuesday.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The scoring path’s join to the feature table is failing for a share of keys, and a default fill is turning the missing values into zeros.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The feature-table monitor is computing on a stale baseline, so its null rate is wrong.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Crews genuinely got smaller. The inference monitor is working as designed and no action is needed.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "The feature table is healthy and the vector the model received is not, so the fault is between them: the scoring path's join is missing for a share of keys and a default fill is turning absent values into zeros. This is the same lesson as the pre-assessment incident — monitor the surface that is consumed, not the surface that is convenient. Concept drift cannot produce a step change in an input on a Tuesday with no code change."
              }
            ]
          },
          {
            "ref": "P6",
            "kind": "multi",
            "dim": "D3/D4",
            "stem": "Version 12 of proj.ml.cost_forecast reached production 40 minutes ago and is producing bad forecasts. Version 11 served cleanly before it. The production scoring job is deployed from a bundle and loads models:/proj.ml.cost_forecast/${var.model_version}, pinned to 12 at the last release. Which steps belong in a rollback that is both complete and auditable?",
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
                "text": "Reassign @champion to version 11.",
                "isKey": false,
                "isNeutral": true
              },
              {
                "text": "Redeploy the bundle at the release revision that pins version 11.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Delete version 12 so nothing can load it.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Record the decision, both versions and the reason in the incident and change record, linked to the actions taken.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Tag version 12 so it cannot be promoted again without review.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Revert the commit on main and let the next scheduled pipeline run redeploy.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Reassign @champion to 11 and restart the scoring job so it picks up the alias.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "The job loads a pinned ${var.model_version}, so the rollback is the bundle redeploy at the release revision that pins 11 — not an alias move. Option G is the trap: reassigning @champion and restarting changes nothing, because this job never reads the alias. Deleting version 12 destroys the evidence an audit needs. Reverting main and waiting for the schedule is not a rollback under incident time. Moving @champion to 11 is correct registry hygiene but does not roll anything back here, so it neither earns nor costs."
              }
            ]
          },
          {
            "ref": "P7",
            "kind": "multi",
            "dim": "D3",
            "stem": "Which of these belong in the pipeline that runs on every pull request, rather than at a later stage?",
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
                "text": "databricks bundle validate against the targets the change affects.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A contract test of the input table’s columns and types against what the code expects.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Full retraining on the complete dataset.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Validation of the candidate against the gate, on a small fixed evaluation set.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Deploying to the shared staging target and running the scoring job end to end.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A drift check against last week’s production traffic.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A smoke test that the packaged model loads and scores one record.",
                "isKey": true,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Everything on a pull request must be fast and must not need shared infrastructure: unit tests, bundle validate, a contract test of the input schema, the gate on a small fixed evaluation set, and a smoke test that the packaged artefact loads and scores. Full retraining, deploying to shared staging and a drift check against production traffic all belong later — selecting them is the signal that CI is being thought of as 'run everything'."
              }
            ]
          },
          {
            "ref": "P8",
            "kind": "single",
            "dim": "D3",
            "stem": "An Azure DevOps environment named production has an approval check, configured so approvers cannot approve their own runs. A colleague says the stage below is therefore protected. What is actually true?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ],
              "code": "- stage: Prod\n  dependsOn: Validate\n  condition: always()\n  jobs:\n  - deployment: to_prod\n    environment: production-ml\n    strategy:\n      runOnce:\n        deploy:\n          steps:\n          - script: databricks bundle deploy -t prod",
              "codeCap": "azure-pipelines.yml · production stage",
              "lang": "yaml",
              "justify": "What would you look at in Azure DevOps to confirm your answer?"
            },
            "options": [
              {
                "text": "It is protected. Any deployment job requires the production approval before it runs.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Two separate things defeat the control. condition: always() runs the stage even when Validate failed, and the job targets production-ml rather than production, so the configured check never applies to it.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Only the condition is a problem. Environment names are matched by prefix, so production-ml inherits the checks on production.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Only the environment name is a problem. always() still waits for Validate to succeed before the stage runs.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Two independent defects, and naming only one is a partial answer. condition: always() runs the stage even when Validate failed, and the job deploys to production-ml, which is a different environment object from production, so the approval check configured on production never applies. Environment names are not matched by prefix. This is the pre-assessment's 'gate that protects nothing', rebuilt to look correct."
              }
            ]
          },
          {
            "ref": "P9",
            "kind": "single",
            "dim": "D5",
            "stem": "The release pipeline now authenticates through an Azure Resource Manager service connection that uses workload identity federation for a service principal. No personal token is left anywhere in the chain. Which remaining arrangement would still fail a security review?",
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
                "text": "One service connection and one service principal, holding workspace admin rights, used by both the staging and the production stages.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A residual secret held in Key Vault and read at run time through a variable group linked to the vault.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Pipeline permissions on the production service connection restricted to the release pipeline only.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The federated credential scoped to this service connection’s issuer and subject.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Workload identity federation removes the token; it does not remove the blast radius. One service principal with workspace admin shared by staging and production means the staging pipeline can act on production, which is the finding a reviewer writes up. A secret in Key Vault read through a linked variable group is the accepted pattern, and both the scoped federated credential and the restricted pipeline permissions are controls, not defects."
              }
            ]
          },
          {
            "ref": "P10",
            "kind": "single",
            "dim": "D1",
            "stem": "In review, a colleague writes: “bad rows are now quarantined.” Which statement about this definition is accurate?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ],
              "code": "CREATE OR REFRESH STREAMING TABLE silver_activity (\n  CONSTRAINT valid_cost EXPECT (actual_cost >= 0) ON VIOLATION DROP ROW\n)\nAS SELECT * FROM STREAM(bronze_activity);",
              "codeCap": "pipelines/silver_activity.sql",
              "lang": "yaml"
            },
            "options": [
              {
                "text": "Violating rows are dropped and counted in the pipeline’s event log, but they are not kept anywhere. Keeping them needs a separate flow that selects the inverse of the condition into its own table.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Violating rows are moved into an automatically created silver_activity_quarantine table.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Violating rows are written with a flag column, so downstream queries can filter them out.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The update fails on the first violating row, so no bad data lands in the table.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "ON VIOLATION DROP ROW drops the row and records it in the event log. Nothing is retained, so 'quarantined' is wrong as written: keeping the rows needs a second flow selecting the inverse of the expectation into its own table. No quarantine table is created automatically, no flag column is added, and only EXPECT … ON VIOLATION FAIL UPDATE stops the update."
              }
            ]
          },
          {
            "ref": "P11",
            "kind": "multi",
            "dim": "D5",
            "stem": "A scheduled scoring job’s cost has tripled. The evidence: the same job compute policy and instance type as last month; zero retries; no code or model change; total input bytes per run unchanged; input files per run up from about 40 to about 9,000 since an upstream team changed its export; run time up from 22 to 61 minutes. Which actions does this evidence support?",
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
                "text": "Move the job to an all-purpose cluster so the compute stays warm between runs.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Raise the autoscaling maximum so the extra tasks finish sooner.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Compact the input, either at the producer’s export or with an ingestion step that coalesces files, and confirm the file count falls.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Take the upstream export change to the producing team as the cause, with the file-count evidence.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Increase the retry count, in case the slowness is transient.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Check whether the model has grown larger since the last retrain.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Identical bytes, 40 files becoming 9,000, and run time tripling is the small-file problem and nothing else. The evidence supports exactly two actions: compact the input and confirm the file count falls, and take the change back to the producing team with that evidence. Warm clusters, more autoscaling and more retries all buy capacity to keep paying the same overhead; model size is not in evidence and did not change."
              }
            ]
          },
          {
            "ref": "P12",
            "kind": "multi",
            "dim": "D2",
            "stem": "An auditor asks two questions about the model now serving production: which exact data and code produced it, and who allowed it into production. What is the minimum evidence set that answers both?",
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
                "text": "The commit SHA of the training code, recorded on that run.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The version of the input table as that run read it.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The release pipeline run that deployed it, showing the approver and that the approver was not the requester.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "The ID of the cluster the training run executed on.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The last saved output of the training notebook.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A screenshot of the model’s page in the registry.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Two questions, so two halves. What produced it: the registered version and its run, the commit SHA on that run, and the version of the input table as that run read it. Who allowed it: the release pipeline run that shows the approver and that the approver was not the requester. The cluster ID identifies where it ran, not what ran; notebook output and a screenshot are artefacts of a session, not evidence."
              }
            ]
          },
          {
            "ref": "P13",
            "kind": "single",
            "dim": "D3 / LLM",
            "stem": "An LLM feature’s gate averages a judge score over a 120-question golden set and passes at 0.80. A retriever change moves the average from 0.86 to 0.82, and the gate passes. Nine contract-clause questions went from correct to wrong. Which change makes the gate defensible?",
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
                "text": "Raise the threshold to 0.85.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Keep the average, and add per-category non-regression plus a hard fail whenever a golden case in a critical category flips from pass to fail, with the golden set and the judge versioned alongside the code.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Replace the judge with a larger model, so its scores are more reliable.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Keep the gate as it is and add a 5% canary release with manual review.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "A mean over a golden set hides a category collapsing, which is exactly what happened. The defensible gate keeps the mean and adds per-category non-regression plus a hard fail when any critical golden case flips from pass to fail, with the golden set and the judge versioned alongside the code so a later run can say what was evaluated. Raising the threshold moves the same blind spot; a bigger judge measures the same average; a canary is a control after the gate, not the gate."
              }
            ]
          },
          {
            "ref": "P14",
            "kind": "single",
            "dim": "D4",
            "stem": "Thirty days in production. The endpoint has been fully available. Input drift on every monitored feature has stayed below threshold. Labels arrive with a 20-day lag, and the first matured slice, covering predictions made on days 1 to 10, shows MAE on target. Which claim is justified?",
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
                "text": "Predictions made on days 1 to 10 were accurate. For days 11 to 30, only “the inputs looked similar” is established, and that does not rule out a change in the relationship between inputs and outcomes.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Retraining is not needed this quarter.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "The drift monitor has shown that the model is still correct.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Availability is not correctness, and input drift being within threshold only says the inputs looked similar. The only accuracy claim the evidence supports covers days 1 to 10, where labels have matured. For days 11 to 30 nothing rules out the relationship between inputs and outcomes having changed. Answering 'the model is healthy' is the failure this item exists to catch."
              }
            ]
          },
          {
            "ref": "P15",
            "kind": "single",
            "dim": "LLM",
            "stem": "Four candidate uses from a project-controls team. For which one is a classical model the better first choice than an LLM?",
            "config": {
              "shuffle": true,
              "confidence": [
                "Low",
                "Medium",
                "High"
              ],
              "justify": "In one line: what would you need to see before you changed your answer?"
            },
            "options": [
              {
                "text": "Forecasting the remaining duration of each activity from structured progress, crew and weather data.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "Answering engineers’ questions over 30,000 pages of specifications, with citations.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Extracting payment terms from subcontracts whose wording varies from vendor to vendor.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Drafting a first summary of a weekly site meeting from its transcript.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Forecasting remaining duration from structured progress, crew and weather data is a supervised regression problem with labels and a metric: a classical model is cheaper, testable and auditable through the loop built in the programme. The other three are language problems over unstructured text. Choosing one of those is usually a signal that the LLM is the tool looking for a use."
              }
            ]
          },
          {
            "ref": "P16",
            "kind": "single",
            "dim": "D1/D3",
            "stem": "Training builds its features with build_features() in features/core.py, which is unit-tested and green. The scoring job, owned by another team, re-implements the same logic in SQL. Which control would catch the two drifting apart earliest?",
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
                "text": "More unit tests on build_features().",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "A CI check that runs both implementations on the same fixture rows and fails on any difference, or better, removing the second implementation so scoring imports the same module.",
                "isKey": true,
                "isNeutral": false
              },
              {
                "text": "A monitor on the prediction distribution in production.",
                "isKey": false,
                "isNeutral": false
              },
              {
                "text": "Mandatory review by the training team of every change to the scoring SQL.",
                "isKey": false,
                "isNeutral": false
              }
            ],
            "rubrics": [
              {
                "kind": "why",
                "detail": "Two implementations of one definition drift the moment either is edited, and no amount of testing one of them detects it. The earliest control compares both on the same fixture rows in CI and fails on any difference; better still, delete the second implementation so scoring imports the module training uses. A production distribution monitor fires long after the fact; mandatory review depends on a person noticing."
              }
            ]
          }
        ]
      },
      {
        "key": "p3",
        "kind": "evidence",
        "scored": true,
        "name": "Evidence desk",
        "meta": "12 min · 6 questions",
        "copy": {
          "eyebrow": "replaces the hands-on task",
          "h1": "Evidence desk",
          "lead": "This is what the workspace and the release history would show you for one model, captured on 30 September 2026. Every answer is in the six exhibits. Paste identifiers exactly as they appear.",
          "body": "Exhibits open and close. Keep the ones you need open while you answer.",
          "exhibits": [
            {
              "id": "X1",
              "title": "Registry: proj.ml.cost_forecast",
              "cap": "Unity Catalog · model versions",
              "head": [
                "Version",
                "Created",
                "Source run",
                "Aliases",
                "Tags"
              ],
              "rows": [
                [
                  "5",
                  "2026-08-21",
                  "2b7f0c9e41d34a6f8e15c0a9d3b76e21",
                  "–",
                  "–"
                ],
                [
                  "6",
                  "2026-09-02",
                  "7a90d4c2e8b14f37a6c95e0d1b2f8c43",
                  "–",
                  "validation=passed"
                ],
                [
                  "7",
                  "2026-09-09",
                  "b3d21e7f09a64c58b2e7d1f4a0c93e65",
                  "–",
                  "validation=passed, incident=INC-4471"
                ],
                [
                  "8",
                  "2026-09-16",
                  "e81f5a3c6d2b47e9a0f38c1d5e7b9a02",
                  "champion",
                  "validation=passed"
                ],
                [
                  "9",
                  "2026-09-27",
                  "0d47c9b18e3f4a25d6c07b9e2f1a8d36",
                  "challenger",
                  "–"
                ]
              ],
              "code": ""
            },
            {
              "id": "X2",
              "title": "Runs: /Shared/cost-forecast",
              "cap": "MLflow · every run read proj.silver.activity",
              "head": [
                "Run ID",
                "git_branch",
                "git_commit",
                "source_table_version",
                "lockfile",
                "seed",
                "mae"
              ],
              "rows": [
                [
                  "2b7f0c9e41d34a6f8e15c0a9d3b76e21",
                  "main",
                  "3e6b0a9",
                  "33",
                  "sha256:5d1c…9e",
                  "42",
                  "0.138"
                ],
                [
                  "7a90d4c2e8b14f37a6c95e0d1b2f8c43",
                  "main",
                  "9c41e07",
                  "36",
                  "sha256:5d1c…9e",
                  "42",
                  "0.131"
                ],
                [
                  "b3d21e7f09a64c58b2e7d1f4a0c93e65",
                  "main",
                  "a17d3b2",
                  "39",
                  "sha256:a0e7…41",
                  "42",
                  "0.119"
                ],
                [
                  "e81f5a3c6d2b47e9a0f38c1d5e7b9a02",
                  "main",
                  "c52f9e1",
                  "42",
                  "sha256:a0e7…41",
                  "42",
                  "0.122"
                ],
                [
                  "0d47c9b18e3f4a25d6c07b9e2f1a8d36",
                  "feature/crew-size-v2",
                  "5be08d4",
                  "latest",
                  "–",
                  "–",
                  "0.109"
                ]
              ],
              "code": ""
            },
            {
              "id": "X3",
              "title": "DESCRIBE HISTORY proj.silver.activity",
              "cap": "Delta · excerpt, newest first",
              "head": [
                "Version",
                "Timestamp (UTC)",
                "Operation",
                "Operation metrics"
              ],
              "rows": [
                [
                  "45",
                  "2026-09-26 02:14",
                  "VACUUM END",
                  "status=COMPLETED, numDeletedFiles=2240"
                ],
                [
                  "44",
                  "2026-09-26 02:10",
                  "VACUUM START",
                  "retentionCheckEnabled=true, specifiedRetentionMillis=604800000"
                ],
                [
                  "43",
                  "2026-09-17 01:05",
                  "OPTIMIZE",
                  "numRemovedFiles=2240, numAddedFiles=31"
                ],
                [
                  "42",
                  "2026-09-16 00:41",
                  "MERGE",
                  "numTargetRowsUpdated=1182, numTargetRowsInserted=406"
                ],
                [
                  "41",
                  "2026-09-14 00:39",
                  "MERGE",
                  "numTargetRowsUpdated=977, numTargetRowsInserted=351"
                ],
                [
                  "40",
                  "2026-09-12 00:40",
                  "MERGE",
                  "numTargetRowsUpdated=1034, numTargetRowsInserted=288"
                ],
                [
                  "39",
                  "2026-09-09 00:38",
                  "MERGE",
                  "numTargetRowsUpdated=1210, numTargetRowsInserted=402"
                ]
              ],
              "code": ""
            },
            {
              "id": "X4",
              "title": "Table properties: proj.silver.activity",
              "cap": "SHOW TBLPROPERTIES · excerpt",
              "head": [],
              "rows": [],
              "code": "delta.deletedFileRetentionDuration = interval 7 days\ndelta.logRetentionDuration         = interval 30 days"
            },
            {
              "id": "X5",
              "title": "Release history: cost-forecast-release",
              "cap": "Azure Pipelines · Prod stage only",
              "head": [
                "Run",
                "Date",
                "Commit",
                "Release tag",
                "model_version",
                "Requested by",
                "Prod approved by",
                "Result",
                "Note"
              ],
              "rows": [
                [
                  "#1187",
                  "2026-09-02",
                  "9c41e07",
                  "release/2026.09.02.1",
                  "6",
                  "r.menon",
                  "s.iyer",
                  "Succeeded",
                  "–"
                ],
                [
                  "#1203",
                  "2026-09-10",
                  "a17d3b2",
                  "release/2026.09.10.1",
                  "7",
                  "p.nair",
                  "s.iyer",
                  "Succeeded",
                  "–"
                ],
                [
                  "#1206",
                  "2026-09-11",
                  "9c41e07",
                  "release/2026.09.02.1",
                  "6",
                  "s.iyer",
                  "r.menon",
                  "Succeeded",
                  "Redeploy. Rollback of v7: lump-sum segment regression, INC-4471"
                ],
                [
                  "#1219",
                  "2026-09-18",
                  "c52f9e1",
                  "release/2026.09.18.1",
                  "8",
                  "p.nair",
                  "p.nair",
                  "Succeeded",
                  "–"
                ]
              ],
              "code": ""
            },
            {
              "id": "X6",
              "title": "resources/scoring_job.yml",
              "cap": "bundle · at release/2026.09.18.1",
              "head": [],
              "rows": [],
              "code": "variables:\n  model_version:\n    description: Registered model version the production job scores with\n    default: \"8\"\n\nresources:\n  jobs:\n    cost_forecast_scoring:\n      name: cost-forecast-scoring\n      tasks:\n        - task_key: score\n          notebook_task:\n            notebook_path: ../scoring/score.py\n            base_parameters:\n              model_uri: models:/proj.ml.cost_forecast/${var.model_version}"
            }
          ],
          "reviewer": "This stage replaces the pre-assessment's hands-on task, and it is the only stage in the instrument with answers that are simply right or wrong. Mark the exact fields first, then read the reasoning: a wrong identifier with sound reasoning is a reading error, while a right identifier with no reasoning is not evidence of anything. E3 and E5 are the two that separate the cohort — E3 because the approval control was satisfied by one person acting as both requester and approver, and E5 because it requires retention arithmetic rather than a lookup."
        },
        "items": [
          {
            "ref": "E1",
            "kind": "exact",
            "dim": "D2",
            "stem": "Which model version is serving production right now, and which run produced it?",
            "config": {
              "parts": [
                {
                  "key": "ver",
                  "label": "Version",
                  "kind": "short"
                },
                {
                  "key": "run",
                  "label": "Run ID",
                  "kind": "short"
                },
                {
                  "key": "w",
                  "label": "Say which exhibit you took the version from.",
                  "kind": "why",
                  "rows": 2
                }
              ]
            },
            "rubrics": [
              {
                "kind": "exact",
                "ref": "ver",
                "label": "Version",
                "detail": "8"
              },
              {
                "kind": "exact",
                "ref": "run",
                "label": "Run ID",
                "detail": "e81f5a3c6d2b47e9a0f38c1d5e7b9a02"
              },
              {
                "kind": "why",
                "detail": "X1 gives version 8 the champion alias, and X5 run #1219 deployed release/2026.09.18.1 with model_version 8 — the bundle pins the version, so the alias alone does not settle it. X2 gives the run that produced version 8."
              }
            ]
          },
          {
            "ref": "E2",
            "kind": "exact",
            "dim": "D2",
            "stem": "Which commit and which version of the input table did that run record?",
            "config": {
              "parts": [
                {
                  "key": "sha",
                  "label": "Commit",
                  "kind": "short"
                },
                {
                  "key": "tv",
                  "label": "source_table_version",
                  "kind": "short"
                }
              ]
            },
            "rubrics": [
              {
                "kind": "exact",
                "ref": "sha",
                "label": "Commit",
                "detail": "c52f9e1"
              },
              {
                "kind": "exact",
                "ref": "tv",
                "label": "source_table_version",
                "detail": "42"
              },
              {
                "kind": "why",
                "detail": "X2, the row for the version 8 run."
              }
            ]
          },
          {
            "ref": "E3",
            "kind": "exact",
            "dim": "D3",
            "stem": "Who approved that version into production, and was the approval independent of the person who requested the release?",
            "config": {
              "parts": [
                {
                  "key": "who",
                  "label": "Approved by",
                  "kind": "short"
                },
                {
                  "key": "ind",
                  "label": "Independent?",
                  "kind": "select",
                  "choices": [
                    "Yes",
                    "No",
                    "Cannot tell from this evidence"
                  ]
                },
                {
                  "key": "w",
                  "label": "Your reasoning, and anything about it you would put in front of an auditor.",
                  "kind": "why",
                  "rows": 2
                }
              ]
            },
            "rubrics": [
              {
                "kind": "exact",
                "ref": "who",
                "label": "Approved by",
                "detail": "p.nair"
              },
              {
                "kind": "exact",
                "ref": "ind",
                "label": "Independent?",
                "detail": "No"
              },
              {
                "kind": "why",
                "detail": "X5 run #1219: requested by p.nair and approved by p.nair. The check exists and was satisfied by the same person, which is the point of the question. Compare runs #1187, #1203 and #1206, where requester and approver differ."
              }
            ]
          },
          {
            "ref": "E4",
            "kind": "exact",
            "dim": "D3/D4",
            "stem": "Version 8 has to be rolled back now. Which version do you restore, and which release revision do you redeploy?",
            "config": {
              "parts": [
                {
                  "key": "ver",
                  "label": "Version to restore",
                  "kind": "short"
                },
                {
                  "key": "tag",
                  "label": "Release revision to redeploy",
                  "kind": "short"
                },
                {
                  "key": "w",
                  "label": "One line on how you chose it, citing the exhibit.",
                  "kind": "why",
                  "rows": 2
                }
              ]
            },
            "rubrics": [
              {
                "kind": "exact",
                "ref": "ver",
                "label": "Version to restore",
                "detail": "6"
              },
              {
                "kind": "exact",
                "ref": "tag",
                "label": "Release revision to redeploy",
                "detail": "release/2026.09.02.1"
              },
              {
                "kind": "why",
                "detail": "Not version 7: X1 tags it incident=INC-4471 and X5 run #1206 already rolled it back for a lump-sum segment regression. The last revision known good in production is release/2026.09.02.1 pinning version 6."
              }
            ]
          },
          {
            "ref": "E5",
            "kind": "exact",
            "dim": "D1/D2",
            "stem": "The auditor wants the rows, not the identifier. Can you still read proj.silver.activity exactly as the serving model’s training run read it?",
            "config": {
              "parts": [
                {
                  "key": "yn",
                  "label": "Your answer",
                  "kind": "select",
                  "choices": [
                    "Yes",
                    "No",
                    "Cannot tell from this evidence"
                  ]
                },
                {
                  "key": "w",
                  "label": "Point to the exhibits and dates that decide it.",
                  "kind": "why",
                  "rows": 2
                }
              ]
            },
            "rubrics": [
              {
                "kind": "exact",
                "ref": "yn",
                "label": "Your answer",
                "detail": "No"
              },
              {
                "kind": "why",
                "detail": "The version 8 run read table version 42, written 2026-09-16 (X2, X3). X4 sets deletedFileRetentionDuration to 7 days, and X3 shows OPTIMIZE on 2026-09-17 followed by VACUUM completing on 2026-09-26 having deleted 2,240 files. The identifier survives; the rows do not. 'Yes' means the retention arithmetic was not done."
              }
            ]
          },
          {
            "ref": "E6",
            "kind": "exact",
            "dim": "D2/D3",
            "stem": "Name everything in this evidence that should stop @challenger being promoted as it stands.",
            "config": {
              "parts": [
                {
                  "key": "w",
                  "label": "Your answer",
                  "kind": "why",
                  "rows": 4
                }
              ]
            },
            "rubrics": [
              {
                "kind": "expected",
                "ref": "1",
                "detail": "Run on branch feature/crew-size-v2, not main (X2)."
              },
              {
                "kind": "expected",
                "ref": "2",
                "detail": "source_table_version recorded as 'latest' — the input is not pinned, so the run cannot be reproduced (X2)."
              },
              {
                "kind": "expected",
                "ref": "3",
                "detail": "No lockfile and no seed recorded (X2)."
              },
              {
                "kind": "expected",
                "ref": "4",
                "detail": "No validation=passed tag, unlike versions 6, 7 and 8 (X1)."
              },
              {
                "kind": "expected",
                "ref": "5",
                "detail": "The better MAE of 0.109 is not comparable: a different branch, an unpinned input and an unknown environment."
              },
              {
                "kind": "expected",
                "ref": "6",
                "detail": "No release run exists for it at all (X5)."
              },
              {
                "kind": "why",
                "detail": "Six observations are available and they are not equally weighted. Naming the unpinned input and the missing validation is the core; noticing that the attractive metric is the reason to be careful, rather than the reason to promote, is the top band."
              }
            ]
          }
        ]
      },
      {
        "key": "p4",
        "kind": "forensics",
        "scored": true,
        "onePerScreen": true,
        "name": "Artefact forensics",
        "meta": "20 min · 3 items",
        "copy": {},
        "items": [
          {
            "ref": "F1",
            "kind": "forensics",
            "stem": "A release pipeline that looks like the one you built",
            "config": {
              "lead": "This pipeline has environments, a validation stage, a staging hop and an approval check. It has passed review twice. Some of what is wrong with it is a line you can point at; some of it is a control that is not there at all. Look for both.",
              "cap": "azure-pipelines.yml · merged last sprint, green on every run",
              "code": "trigger:\n  branches: { include: [ main ] }\npr:\n  branches: { include: [ main ] }\n\nvariables:\n- group: databricks-prod        # DATABRICKS_HOST, DATABRICKS_TOKEN (secret)\n\nstages:\n- stage: CI\n  jobs:\n  - job: test\n    steps:\n    - script: pip install -r requirements.lock\n    - script: pytest tests/unit tests/contract\n    - script: databricks bundle validate -t staging\n\n- stage: Validate\n  dependsOn: CI\n  jobs:\n  - job: gate\n    steps:\n    - script: |\n        python cicd/validate.py \\\n          --candidate \"models:/proj.ml.cost_forecast@challenger\" \\\n          --incumbent \"models:/proj.ml.cost_forecast@champion\" \\\n          --metric mae --max-regression 0.0\n\n- stage: Staging\n  dependsOn: Validate\n  jobs:\n  - deployment: to_staging\n    environment: ml-staging\n    strategy:\n      runOnce:\n        deploy:\n          steps:\n          - checkout: self\n          - script: databricks bundle deploy -t staging\n\n- stage: Prod\n  dependsOn: Staging\n  condition: or(succeeded(), eq(variables['Build.Reason'], 'Manual'))\n  jobs:\n  - deployment: to_prod\n    environment: ml-prod          # approval check, approvers cannot approve own runs\n    strategy:\n      runOnce:\n        deploy:\n          steps:\n          - checkout: self\n          - script: |\n              python cicd/promote.py --alias champion --version latest\n              databricks bundle deploy -t prod    # job reads ${var.model_version}",
              "lang": "yaml",
              "alt": "An Azure Pipelines YAML file triggered on main and on pull requests to main. A variable group named databricks-prod supplies a host and a secret token to every stage. Stages: CI with unit and contract tests and bundle validate against staging; Validate comparing the challenger alias to the champion alias with max regression zero; Staging deployment job to environment ml-staging; Prod deployment job to environment ml-prod, with a condition that passes if the previous stage succeeded or if the run was started manually, and a step that promotes the latest model version to champion and then deploys the bundle to prod, whose job reads the model version from a bundle variable.",
              "narrative": "",
              "evidence": [],
              "subs": [
                [
                  "a",
                  "List the defects you can see, including controls that are missing."
                ],
                [
                  "b",
                  "Take the two most dangerous. For each, state what it causes in production, in terms a sceptical release manager would accept."
                ],
                [
                  "c",
                  "Two separate routes let a change reach production without having passed both validation and review. Name each route and the lines that open it."
                ],
                [
                  "d",
                  "Rewrite the Prod stage’s condition and its deploy step so both routes close and production runs exactly the version that was validated. Syntax is not graded; mechanism is.",
                  "code"
                ]
              ]
            },
            "rubrics": [
              {
                "kind": "defect",
                "ref": "F1.1",
                "label": "Prod runs on a manual queue",
                "weight": "3",
                "detail": "condition: or(succeeded(), eq(variables['Build.Reason'], 'Manual')) lets anyone who can queue the pipeline by hand reach the Prod stage with CI, Validate and Staging all failed or skipped. This is route one in part (c)."
              },
              {
                "kind": "defect",
                "ref": "F1.2",
                "label": "promote.py --version latest, then deploy",
                "weight": "3",
                "detail": "The Prod stage promotes whatever is newest at that moment, not the artefact the Validate stage compared. A version registered after validation is promoted without ever having been through the gate. This is route two, and it is the subtle one."
              },
              {
                "kind": "defect",
                "ref": "F1.3",
                "label": "The databricks-prod variable group is bound to every stage",
                "weight": "3",
                "detail": "A production host and secret token are available to the CI job, which runs on every pull request, including from a branch a reviewer has not read. Scoping is the control; the group being marked secret is not."
              },
              {
                "kind": "defect",
                "ref": "F1.4",
                "label": "pr: trigger with production credentials in scope",
                "weight": "2",
                "detail": "Compounds F1.3: the pull-request trigger means the exposure is reachable by anyone who can open a PR."
              },
              {
                "kind": "defect",
                "ref": "F1.5",
                "label": "No gate between the validated version and ${var.model_version}",
                "weight": "2",
                "detail": "The bundle deploys a version held in a variable while promote.py moves the alias — two mechanisms, neither checked against the other. The deployed version is not provably the validated version."
              },
              {
                "kind": "defect",
                "ref": "F1.6",
                "label": "--max-regression 0.0 with no absolute floor and no segments",
                "weight": "2",
                "detail": "Non-regression against the incumbent only. A pair that are both bad passes, and a segment collapse passes. Pairs with P4."
              },
              {
                "kind": "defect",
                "ref": "F1.7",
                "label": "No rollback path and no pinned revision",
                "weight": "1",
                "detail": "Nothing in the file names the revision to return to. Credit when raised unprompted."
              },
              {
                "kind": "defect",
                "ref": "F1.8",
                "label": "Staging is a deployment gate in name only",
                "weight": "1",
                "detail": "The staging hop deploys and then nothing runs against it, so it proves the bundle deploys and not that it works."
              },
              {
                "kind": "band",
                "ref": "1",
                "detail": "Lists surface defects and treats the approval check as sufficient. Does not find either route to production."
              },
              {
                "kind": "band",
                "ref": "2",
                "detail": "Finds one route, usually the manual condition, and states the consequence loosely."
              },
              {
                "kind": "band",
                "ref": "3",
                "detail": "Finds both routes and names the lines that open each; ranks by consequence rather than by how alarming the line looks; part (d) closes the condition."
              },
              {
                "kind": "band",
                "ref": "4",
                "detail": "Band 3, plus part (d) makes the deployed version the validated version explicitly — the validated version is carried forward and deployed by identifier, rather than re-resolved as 'latest' — and the answer names the missing controls, not only the wrong lines."
              }
            ]
          },
          {
            "ref": "F2",
            "kind": "forensics",
            "stem": "An LLM gate that cannot fail",
            "config": {
              "lead": "This is the evaluation stage for the specifications assistant. The release it is gating changes prompts/answer.txt and points production at proj.rag.specs_index_v3.",
              "cap": "cicd/eval_gate.py · current",
              "code": "# cicd/eval_gate.py  ·  runs as the LLM gate stage in the release pipeline\nimport json, sys, mlflow\nfrom rag.chain import build_chain, load_retriever\nfrom rag.judge import judge\n\ngolden = json.load(open(\"eval/golden.json\"))   # SMEs append cases here as they find them\n\nretriever = load_retriever(index=\"proj.rag.specs_index_dev\")\nprompt    = open(\"prompts/answer.txt\").read()\nchain     = build_chain(retriever, prompt, endpoint=\"specs-assistant\")\n\nscores = []\nfor case in golden:\n    answer = chain.invoke(case[\"question\"])\n    scores.append(judge(endpoint=\"specs-assistant\",\n                        question=case[\"question\"],\n                        answer=answer,\n                        reference=case[\"reference\"]))\n\nmean = sum(scores) / len(scores)\nwith mlflow.start_run(run_name=\"llm-gate\"):\n    mlflow.log_metric(\"judge_mean\", mean)\n\nprint(f\"judge mean {mean:.3f} over {len(scores)} cases\")\nif mean < 0.80:\n    print(\"WARNING: below threshold, review before release\")\nsys.exit(0)",
              "lang": "python",
              "alt": "A Python script that loads a golden set from a JSON file SMEs append to, builds a retrieval chain over the index proj.rag.specs_index_dev using the prompt file and the specs-assistant endpoint, scores each answer with a judge that also uses the specs-assistant endpoint, logs only the mean judge score to MLflow, prints a warning if the mean is below 0.80, and always exits with status zero.",
              "narrative": "",
              "evidence": [],
              "subs": [
                [
                  "a",
                  "Name the defects, including what is missing."
                ],
                [
                  "b",
                  "Last month this gate printed 0.86 and the release went out. Within a week, users reported wrong answers on contract clauses. Which two defects best explain a passing gate and a failing feature, and by what mechanism?"
                ],
                [
                  "c",
                  "What must be versioned and logged with each gate run so that someone can later say exactly what was evaluated?"
                ],
                [
                  "d",
                  "Write the replacement for the last five lines so the gate blocks, and so a regression on any critical case blocks even when the mean passes. Pseudocode is fine.",
                  "code"
                ]
              ]
            },
            "rubrics": [
              {
                "kind": "defect",
                "ref": "F2.1",
                "label": "sys.exit(0) unconditionally",
                "weight": "3",
                "detail": "The gate prints and returns success. It cannot fail a build, which makes every other property of it decorative. Same defect class as the pre-assessment's continueOnError."
              },
              {
                "kind": "defect",
                "ref": "F2.2",
                "label": "Evaluates against specs_index_dev while the release ships specs_index_v3",
                "weight": "3",
                "detail": "The gate measures a system that is not the system being released. This is the mechanism behind a passing gate and a failing feature in part (b), together with F2.3."
              },
              {
                "kind": "defect",
                "ref": "F2.3",
                "label": "A single mean over a golden set that SMEs keep appending to",
                "weight": "3",
                "detail": "The denominator moves between runs, so the number is not comparable with the previous run, and an average conceals a whole category collapsing. Pairs with P13."
              },
              {
                "kind": "defect",
                "ref": "F2.4",
                "label": "The judge runs on the endpoint it is judging",
                "weight": "2",
                "detail": "The system marks its own work. A change that flatters the endpoint moves the score and the judgement together."
              },
              {
                "kind": "defect",
                "ref": "F2.5",
                "label": "Nothing versioned or logged but the mean",
                "weight": "2",
                "detail": "No golden-set hash or size, no prompt version, no index name or version, no judge identity, no per-case results. Part (c) is exactly this list."
              },
              {
                "kind": "defect",
                "ref": "F2.6",
                "label": "No per-category or per-case regression check",
                "weight": "2",
                "detail": "Nine contract-clause cases can flip from pass to fail with the mean barely moving."
              },
              {
                "kind": "defect",
                "ref": "F2.7",
                "label": "The prompt under test is read from the working tree, unpinned",
                "weight": "1",
                "detail": "prompts/answer.txt is whatever the checkout happens to hold."
              },
              {
                "kind": "band",
                "ref": "1",
                "detail": "Notices the exit code and stops there."
              },
              {
                "kind": "band",
                "ref": "2",
                "detail": "Exit code plus one other, with part (b) answered as 'the average is misleading' and no mechanism."
              },
              {
                "kind": "band",
                "ref": "3",
                "detail": "Names the dev/v3 index mismatch and the averaging defect as the two that explain part (b), and part (c) lists what must be versioned. Part (d) blocks on a non-zero exit."
              },
              {
                "kind": "band",
                "ref": "4",
                "detail": "Band 3, plus part (d) fails on any critical-category case that flips from pass to fail even when the mean passes, and the answer notices the judge is scoring its own endpoint."
              }
            ]
          },
          {
            "ref": "F3",
            "kind": "forensics",
            "stem": "An alarm that is right, and a fix that would be wrong",
            "config": {
              "lead": "Diagnose before you act. The quality of this answer is mostly in part (c) and part (e).",
              "cap": "",
              "code": "",
              "lang": "",
              "alt": "",
              "narrative": "Wednesday morning. The drift alert on the cost-forecast model fired on Monday and has stayed red. The scoring job has run green every day. Nobody has touched the model, the training code or the bundle in twelve days. A planning lead has asked whether she should stop using this week’s forecasts. You have exactly the five pieces of evidence below.",
              "evidence": [
                [
                  "Drift monitor, inference table",
                  "PSI on contract_value 0.41 since Monday against a threshold of 0.20. Every other monitored feature below 0.08."
                ],
                [
                  "Segment breakdown",
                  "Since Monday, 14% of scored rows come from region APAC-IN, which had no rows in the training window. Volumes for every other region are unchanged."
                ],
                [
                  "contract_value by region",
                  "APAC-IN median 412,000,000. Every other region median 3,200,000. The bronze source table carries a currency column; the silver table does not."
                ],
                [
                  "Prediction summary",
                  "91% of APAC-IN rows are predicted at the model’s clip ceiling of +60% overrun. The prediction distribution for every other region is unchanged."
                ],
                [
                  "Change history",
                  "No model, code or bundle change in twelve days. On Friday, a ticket titled “Onboard APAC-IN projects” widened the region filter in the silver pipeline."
                ]
              ],
              "subs": [
                [
                  "a",
                  "Your single most probable root cause, with the mechanism."
                ],
                [
                  "b",
                  "The one check you would run first, and the result that would kill your hypothesis."
                ],
                [
                  "c",
                  "What you do today. Say whether you roll back the model, and why."
                ],
                [
                  "d",
                  "The guardrail that stops this class of failure recurring, and the layer it belongs at."
                ],
                [
                  "e",
                  "The drift monitor did its job, and it would still lead a less careful team to the wrong fix. What fix, and why is it wrong?"
                ]
              ]
            },
            "rubrics": [
              {
                "kind": "chain",
                "detail": "Intended chain: Friday's ticket widened the region filter, so APAC-IN rows entered the silver table for the first time. The bronze source carries a currency column and the silver table does not, so local-currency contract values arrive as if they were the same unit as every other region — a median of 412,000,000 against 3,200,000 elsewhere. The model, never trained on that region or that magnitude, pushes 91% of those rows to the clip ceiling. PSI on contract_value rises because the input genuinely changed. This is a data contract failure at ingestion, not drift and not a model fault: the model is doing the only thing it can with the input it is given."
              },
              {
                "kind": "band",
                "ref": "(a) Root cause",
                "detail": "1: calls it drift and proposes retraining. 2: connects the alert to the APAC-IN onboarding by date. 3: identifies the dropped currency column as the mechanism, not just the new region. 4: states it as an ingestion contract failure — a unit change, not a distribution change — before proposing any action."
              },
              {
                "kind": "band",
                "ref": "(b) First check",
                "detail": "3: names a specific check, such as comparing bronze currency against silver contract_value for APAC-IN rows, or converting the APAC-IN median and seeing whether it lands near the other regions. 4: states the result that would kill the hypothesis — for example APAC-IN rows already in the local currency of the others, which would send them back to segment novelty instead. An answer that cannot be falsified scores 1."
              },
              {
                "kind": "band",
                "ref": "(c) Today",
                "detail": "1: roll back the model. 2: roll back and retrain. 3: does not roll back — the model has not changed and rolling it back fixes nothing — and instead excludes or quarantines APAC-IN rows from scoring while the currency is restored, telling the planning lead that this week's non-APAC-IN forecasts are usable and the APAC-IN ones are not. 4: adds that the contaminated window must not be used for retraining."
              },
              {
                "kind": "band",
                "ref": "(d) Guardrail",
                "detail": "2: 'add monitoring'. 3: a contract or expectation at the silver boundary that fails when a required field such as currency is absent or when a value leaves its plausible range, enforced in the pipeline rather than watched. 4: places it at the producing layer and adds a release check on the scope-widening change itself, since the ticket was the trigger."
              },
              {
                "kind": "band",
                "ref": "(e) The wrong fix",
                "detail": "3: names retraining on the new data — or widening the clip ceiling, or recalibrating the drift threshold — and explains that it teaches the model that 412,000,000 is a legitimate contract value, embedding the defect instead of removing it. 4: generalises: a monitor tells you the input changed and never tells you whether the change is legitimate, so acting on a drift alarm without a cause is how bad data becomes a trained-in feature."
              }
            ]
          }
        ]
      },
      {
        "key": "p5",
        "kind": "written",
        "scored": true,
        "name": "Judgement",
        "meta": "10 min · 3 items",
        "copy": {
          "h1": "Judgement in writing",
          "lead": "About 150 words each. The counter is advisory. What is read most closely is what each answer is specific about."
        },
        "items": [
          {
            "ref": "W1",
            "kind": "written",
            "stem": "A project-controls director who is not an engineer asks why the team “lost a day” building the gate that blocked last month’s model, instead of shipping it. Answer her in about 150 words, in terms she would accept. Name the specific failure the gate prevented and what it would have cost her.",
            "config": {
              "rows": 6,
              "wordTarget": 150
            },
            "rubrics": [
              {
                "kind": "band",
                "ref": "W1",
                "detail": "1: restates the question, or explains the gate in engineering terms she did not ask for. 2: a correct general argument about quality with no named failure and no cost. 3: names the specific thing the gate caught — a candidate that was better overall and worse on lump-sum contracts — and translates it into her terms: which forecasts would have been wrong, on which contracts, and who would have acted on them. 4: also prices the alternative honestly, including that the day is a recurring cost and the failure is a probability, and does not claim the gate guarantees anything."
              }
            ]
          },
          {
            "ref": "W2",
            "kind": "written",
            "stem": "15:00 on Friday. A fix must reach production today. The only named approver on the production environment is on leave until Monday, and your manager says “just add yourself as an approver for this one run.” You have thirty minutes. Name the three things you do, the two things you refuse to do, and the one condition under which you would not deploy at all.",
            "config": {
              "rows": 6,
              "wordTarget": 150
            },
            "rubrics": [
              {
                "kind": "band",
                "ref": "W2",
                "detail": "1: three heroic actions and no refusals. 2: sensible actions, but the refusals are things they would never have done anyway. 3: actions ordered by risk reduction per minute; the refusals include something genuinely tempting — self-approving, disabling the check 'for one run', widening the change while they are in there — and the named condition for not deploying is concrete. 4: also finds the legitimate path inside the half hour, which is a second named approver rather than a bypass, and states plainly that if no approver can be found the deployment waits and the business is told why."
              }
            ]
          },
          {
            "ref": "W3",
            "kind": "written",
            "stem": "Explain the delivery loop you built in the programme to a colleague who uses none of these tools, without naming a single product, platform or library. Then name the one part you would build first in your own work, and the one you would deliberately park, with a reason for each.",
            "config": {
              "rows": 6,
              "wordTarget": 150
            },
            "rubrics": [
              {
                "kind": "band",
                "ref": "W3",
                "detail": "1: names tools despite the instruction, or describes the labs in order. 2: an accurate but abstract account of automation and testing. 3: describes the loop as a mechanism — how a change is proposed, what must be true before it moves, who decides, how it is undone — with no product names, and the two choices are justified by their own constraints rather than by importance in general. 4: the part parked is parked for a reason specific to their situation, and they say what would have to change for it to come off the shelf."
              }
            ]
          }
        ]
      },
      {
        "key": "p6",
        "kind": "context",
        "scored": false,
        "name": "Reflection",
        "meta": "4 min · not scored",
        "copy": {
          "eyebrow": "not scored",
          "h1": "Since the programme",
          "lead": "No score attached to any of this. It tells us whether the three days are being used, and what to change for the next cohort."
        },
        "items": [
          {
            "ref": "R1",
            "kind": "select",
            "stem": "Since the programme, what is the furthest you have taken it?",
            "config": {
              "choices": [
                "Not touched it since",
                "Re-read the repository or my notes",
                "Rebuilt one of the labs on my own",
                "Applied part of it to my own work",
                "Shipped something to production using it"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "The single most important number in the post-assessment for the client conversation: how far the programme travelled past the last day."
              }
            ]
          },
          {
            "ref": "R2",
            "kind": "text",
            "stem": "If you applied any of it, what, in one sentence. If you did not, what stopped you?",
            "config": {
              "rows": 2
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "Read verbatim. What stopped people is more actionable than what they applied."
              }
            ]
          },
          {
            "ref": "R3",
            "kind": "text",
            "stem": "What is still done by hand in your delivery loop that you most want automated?",
            "config": {
              "rows": 2
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "Compared with the same person's pre-assessment answer to the same question. A changed answer usually means the first one was solved."
              }
            ]
          },
          {
            "ref": "R4",
            "kind": "select",
            "stem": "The revisit path",
            "config": {
              "choices": [
                "Did not receive it",
                "Received it, not opened",
                "Opened it, not worked through",
                "Worked through part of it",
                "Worked through all of it"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "Tells you whether the revisit path was delivered and whether it was used. Low uptake with high R1 means the path is not the reason."
              }
            ]
          },
          {
            "ref": "R5",
            "kind": "select",
            "stem": "In the paired labs, how often were you at the keyboard?",
            "config": {
              "choices": [
                "Most of the time",
                "About half",
                "Rarely",
                "I was not paired"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "Keyboard time is the strongest predictor of retention in the labs. Cross-read with the 'In the programme' column on the self-map."
              }
            ]
          },
          {
            "ref": "R6",
            "kind": "select",
            "stem": "Which block changed how you work the most?",
            "config": {
              "choices": [
                "Lab B1 · pipeline skeleton",
                "Lab B2 · quality and versioning",
                "Lab B3 · train, track, pin",
                "Lab B4 · identify and register",
                "Day 1 gate · answer the auditor",
                "Stage map · what runs when",
                "Lab D1 · repo and policy",
                "Lab D2 · CI that gates",
                "Lab D3 · gated deploy",
                "Lab D4 · rollback",
                "Lab O1 · monitoring and drift",
                "Lab O2 · cost investigation",
                "Lab O3 · audit drill",
                "LLM placement",
                "Lab L1 · LLM through the gates",
                "Incident drill"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "Which block earns its place in the next run."
              }
            ]
          },
          {
            "ref": "R7",
            "kind": "text",
            "stem": "Which block would you change, and how?",
            "config": {
              "rows": 2
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "Read verbatim by the trainer before the next cohort."
              }
            ]
          },
          {
            "ref": "R8",
            "kind": "select",
            "stem": "Did you use an AI assistant on any part of this? No penalty. It changes how we read your answers.",
            "config": {
              "choices": [
                "No",
                "Yes, on the multiple-choice items only",
                "Yes, on the written stages too",
                "Yes, throughout"
              ]
            },
            "rubrics": [
              {
                "kind": "note",
                "label": "tells us",
                "detail": "Read-calibration only, never enforcement. The welcome screen asked participants not to use an assistant on the evidence desk, forensics and written stages; an answer of 'Yes, throughout' changes how those stages are read, and is not a penalty."
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
        "meta": "–",
        "copy": {
          "h1": "Check and submit",
          "leadIncomplete": "Some things are unanswered. That is allowed, and a blank is read as a blank rather than as a wrong answer. Fill anything you want to fill, then submit.",
          "leadComplete": "Everything is answered. No score is calculated here and none will be shown to you.",
          "whatNext": [
            "Your answers are read against your own pre-assessment, stage by stage, by the same trainer who read it."
          ]
        },
        "items": []
      }
    ]
  }
];
