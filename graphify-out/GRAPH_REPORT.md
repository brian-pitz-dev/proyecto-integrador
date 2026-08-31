# Graph Report - Deploy  (2026-08-28)

## Corpus Check
- Corpus is ~10,068 words - fits in a single context window. You may not need a graph.

## Summary
- 86 nodes · 131 edges · 14 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.72)
- Token cost: 122,985 input · 0 output

## Community Hubs (Navigation)
- Weekly Calendar Rendering
- Training Phase Generator
- Stats & Streak Tracking
- Meal Rotation Engine
- Activity Logging
- Calorie/BMR Calibration
- Protein Reinforcement Logic
- Supabase Completion Sync

## God Nodes (most connected - your core abstractions)
1. `refreshStats()` - 14 edges
2. `renderWeeks()` - 9 edges
3. `saveLog()` - 8 edges
4. `renderNutriDay()` - 8 edges
5. `gymSession()` - 7 edges
6. `restDay()` - 7 edges
7. `phaseDefs (data)` - 7 edges
8. `cardioSession()` - 6 edges
9. `getSessionsForDate()` - 6 edges
10. `closeModal()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `saveLog()` --calls--> `refreshStats()`  [EXTRACTED]
  plan_vida_2026 copy.html → plan_vida_2026 copy.html  _Bridges community 4 → community 2_
- `saveLog()` --shares_data_with--> `supa (Supabase client)`  [EXTRACTED]
  plan_vida_2026 copy.html → plan_vida_2026 copy.html  _Bridges community 4 → community 7_
- `fetchLogs()` --shares_data_with--> `supa (Supabase client)`  [EXTRACTED]
  plan_vida_2026 copy.html → plan_vida_2026 copy.html  _Bridges community 5 → community 7_
- `refreshStats()` --calls--> `fetchLogs()`  [EXTRACTED]
  plan_vida_2026 copy.html → plan_vida_2026 copy.html  _Bridges community 5 → community 2_
- `refreshStats()` --calls--> `getCompletedDates()`  [EXTRACTED]
  plan_vida_2026 copy.html → plan_vida_2026 copy.html  _Bridges community 7 → community 2_

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Day-session builder functions (core/cardio/gym/long/rest)** — plan_vida_2026_copy_core, plan_vida_2026_copy_cardiosession, plan_vida_2026_copy_gymsession, plan_vida_2026_copy_longsession, plan_vida_2026_copy_restday [EXTRACTED 1.00]
- **Training-phase week generator functions (phase1Week..phase6Week)** — plan_vida_2026_copy_phase1week, plan_vida_2026_copy_phase2week, plan_vida_2026_copy_phase3week, plan_vida_2026_copy_phase4week, plan_vida_2026_copy_phase5week, plan_vida_2026_copy_phase6week, plan_vida_2026_copy_phasedefs [EXTRACTED 1.00]
- **Recency-weighted meal rotation system** — plan_vida_2026_copy_mulberry32, plan_vida_2026_copy_buildrecencysequence, plan_vida_2026_copy_pickalmuerzo, plan_vida_2026_copy_pickcena, plan_vida_2026_copy_mealbank [EXTRACTED 1.00]

## Communities (14 total, 0 thin omitted)

### Community 0 - "Weekly Calendar Rendering"
Cohesion: 0.15
Nodes (14): coreBlock(), coreRoutines (data), currentWeekNumForNutri(), DOMContentLoaded init handler, eventOverrideFor(), getSessionsForDate(), gymBlock(), gymRoutines (data) (+6 more)

### Community 1 - "Training Phase Generator"
Cohesion: 0.45
Nodes (11): cardioSession(), gymSession(), longSession(), phase1Week(), phase2Week(), phase3Week(), phase4Week(), phase5Week() (+3 more)

### Community 2 - "Stats & Streak Tracking"
Cohesion: 0.25
Nodes (9): buildMonthHistory(), checkGymStreak(), checkRunAlert(), countTrainableVsCompleted(), getLastFriday(), getLastNSaturdays(), isTrainableDate(), paceStrToSeconds() (+1 more)

### Community 3 - "Meal Rotation Engine"
Cohesion: 0.27
Nodes (11): buildRecencySequence(), calcMealProtein(), getCarbLoadWeek(), ingredientes (data), mealBank (data), mulberry32(), pickAlmuerzo(), pickCena() (+3 more)

### Community 4 - "Activity Logging"
Cohesion: 0.29
Nodes (8): closeModal(), formatPace(), logCal(), logRun(), logSleep(), logWalk(), logWeight(), saveLog()

### Community 5 - "Calorie/BMR Calibration"
Cohesion: 0.33
Nodes (7): BMR calibration via real InBody measurement, deficitPorFase (data), fetchLogs(), getCalorieTarget(), INBODY_REFERENCE (data), mifflin(), PERSONAL_DATA (data)

### Community 6 - "Protein Reinforcement Logic"
Cohesion: 0.47
Nodes (6): applyProteinReinforcement(), cloneMeal(), hasIngredient(), Low-lunch-protein reinforcement strategy, reinforceBreakfast(), reinforceWithBatido()

### Community 7 - "Supabase Completion Sync"
Cohesion: 0.40
Nodes (5): deleteLog(), getCompletedDates(), markCompletedDays(), supa (Supabase client), toggleDayDone()

## Knowledge Gaps
- **5 isolated node(s):** `gymRoutines (data)`, `coreRoutines (data)`, `ingredientes (data)`, `PERSONAL_DATA (data)`, `deficitPorFase (data)`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `refreshStats()` connect `Stats & Streak Tracking` to `Activity Logging`, `Calorie/BMR Calibration`, `Supabase Completion Sync`?**
  _High betweenness centrality (0.341) - this node is a cross-community bridge._
- **Why does `renderNutriDay()` connect `Meal Rotation Engine` to `Weekly Calendar Rendering`, `Calorie/BMR Calibration`, `Protein Reinforcement Logic`?**
  _High betweenness centrality (0.280) - this node is a cross-community bridge._
- **Why does `getSessionsForDate()` connect `Weekly Calendar Rendering` to `Training Phase Generator`, `Stats & Streak Tracking`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `gymRoutines (data)`, `coreRoutines (data)`, `ingredientes (data)` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._