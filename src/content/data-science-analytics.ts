import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Data Science & Analytics — turning rows into decisions.
 *
 * The course refuses to start with algorithms. It starts with a question worth
 * answering, then the unglamorous work that decides whether the answer is
 * trustworthy: collecting and cleaning data, describing it honestly, choosing a
 * chart that does not lie, and putting the result in front of somebody who has
 * to act on it. Tools appear where they earn their place — spreadsheets, SQL,
 * Python and a dashboard.
 */

export const DATA_SCIENCE_ANALYTICS_MODULES: CourseModule[] = [
  module(
    "working-with-data",
    "01 · Working with data",
    "The analyst's workflow, and the cleaning work that decides everything after it.",
    [
      lesson({
        id: "the-analyst-workflow",
        title: "The data analyst's workflow",
        summary:
          "Analysis is not a tool, it is a loop: ask a question precise enough to answer, get the data, clean it, explore it, model it if you must, then communicate a decision. This lesson names each stage and the failure modes inside it, distinguishes the roles people confuse — analyst, scientist, engineer — and covers the kinds of data you will meet, including the messy realities of a Ghanaian organisation: paper records, WhatsApp exports, mobile-money statements and spreadsheets that pass through three people.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Most \"data projects\" that fail do not fail at the algorithm. They fail at the question (nobody agreed what was being decided), the data (the numbers did not mean what the column name suggested), or the handover (a correct answer nobody trusted or acted on). Learning the workflow is therefore not administration; it is the part of the job that determines whether the work matters.",
          },
          {
            heading: "Definition: data, analytics, data science",
            kind: "definition",
            body:
              "**Data** is recorded observations: a transaction, a temperature, an enrolment, a click. **A dataset** is a collection of such records organised by rows (observations) and columns (variables).\n\n**Analytics** is the work of answering questions from data: describing what happened, diagnosing why, predicting what will happen, and recommending what to do. **Data science** is a superset that adds statistics, machine learning and code, and spends more of its time on modelling and production systems.\n\nThe four levels of analytics, in increasing difficulty:\n\n1. **Descriptive** — what happened? Enrolments, revenue, attendance.\n2. **Diagnostic** — why did it happen? Which region, which product, which month.\n3. **Predictive** — what is likely to happen? Churn risk, demand next term.\n4. **Prescriptive** — what should we do? Price, staffing, intervention.\n\nRoles in practice: a **data analyst** answers business questions with SQL, spreadsheets and dashboards; a **data engineer** builds the pipelines and warehouses that make data available and trustworthy; a **data scientist** models and experiments; an **ML engineer** puts models into production. Small teams combine all four in one person, and that person's scarcest skill is not modelling — it is judgement about what the numbers mean.",
          },
          {
            heading: "The loop, stage by stage",
            kind: "paragraph",
            body:
              "**1. Frame the question.** Write it as a sentence that could be wrong. \"Are we growing?\" is not answerable; \"Did monthly recurring revenue grow between January and June 2026, excluding one-off training contracts?\" is. Name the decision the answer will change, the population, the time period and the unit of measurement — and write down what would count as evidence either way *before* you look, or you will rationalise whatever the chart shows.\n\n**2. Get the data.** Data comes from a database (a query), an export (a file), an API (a script), a sensor (a log), a survey (a form design) or a human with a notebook. Record where it came from, when it was extracted and what it excludes — this is the **data lineage** that makes a number defensible six months later.\n\n**3. Clean and prepare.** Reconcile types, handle duplicates and missing values, standardise names and dates, and check the totals against something already known (a bank statement, last year's report). Roughly 60–80% of real analysis time is spent here; treat it as the work rather than an obstacle to it.\n\n**4. Explore.** Look at distributions, spot outliers, compare groups, and graph before you compute. Exploration is how you catch the impossible value and the unit mismatch that would otherwise corrupt every number downstream.\n\n**5. Analyse or model.** Choose the simplest method that answers the question: a comparison of averages, a trend, a cross-tabulation, a correlation, a regression, an experiment. Complexity is a cost, paid in explanation and maintenance.\n\n**6. Communicate.** One headline, one chart, one recommendation, and the caveats honestly stated. If the audience cannot repeat your conclusion from memory the next day, the analysis failed regardless of its quality.\n\n**7. Decide and measure again.** Every recommendation has a predicted effect. Track it. This last step is what turns an analysis into a feedback loop and makes the next question sharper.",
          },
          {
            heading: "Worked example: from a vague request to a precise question",
            kind: "example",
            body:
              "The request arrives as: *\"Management says attendance is bad. Can you look at the data?\"*\n\nThe first job is to refuse to answer it, politely, and ask instead: which attendance, over what period, compared with what, and what decision is pending? Three clarifying messages later the question is: *\"Of the 1,240 students enrolled in the IT Essentials program between January and June 2026, what proportion attended at least 70% of scheduled sessions each month, and did that proportion change between the two terms?\"*\n\nNow the work is defined. The population is named (1,240 enrolled students), the metric is unambiguous (proportion attending ≥ 70% of sessions per month), the comparison is set (term 1 versus term 2), and a plausible answer — whether attendance improved or worsened — would change what the school does next, which is the test of whether the question was worth asking.\n\nThe extraction is a single query over two tables, grouped by month; the cleaning stage discovers that 43 students were counted twice because they re-registered after the subsidy scheme, and that Term 2 has a public-holiday week with no sessions in it. Both are corrected and both are written in the notes, because the honest version of the answer depends on them.",
            code:
              "-- The question, expressed as a query (PostgreSQL)\nSELECT\n  date_trunc('month', s.session_date)              AS month,\n  count(DISTINCT s.student_id)                     AS students_seen,\n  count(DISTINCT e.student_id)                      AS students_enrolled,\n  round(100.0 * count(DISTINCT s.student_id)\n        / nullif(count(DISTINCT e.student_id), 0), 1) AS attendance_pct\nFROM enrollment e\nLEFT JOIN attendance s\n       ON s.student_id = e.student_id\n      AND s.session_date >= e.start_date\nWHERE e.program = 'IT Essentials'\n  AND e.enrolled_at BETWEEN '2026-01-01' AND '2026-06-30'\n  AND s.session_date NOT IN (SELECT date FROM term_holidays)\nGROUP BY 1\nORDER BY 1;\n\n/* month   | students_seen | students_enrolled | attendance_pct\n   2026-01 |          742 |             1 240 |          59.8\n   2026-02 |          781 |             1 240 |          63.0\n   2026-03 |          803 |             1 240 |          64.8\n   2026-04 |          690 |             1 240 |          55.6   ← holiday + exam week\n   2026-05 |          828 |             1 240 |          66.8\n   2026-06 |          869 |             1 240 |          70.1 */",
            language: "text",
            codeLabel: "A vague complaint becomes a measurable question",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Starting with the data instead of the question.** Exporting everything and exploring produces interesting trivia, not decisions. The question comes first and it should be falsifiable.\n- **Confusing correlation with cause.** Ice-cream sales and enrolment both rise in January. Only an experiment or a very careful quasi-experiment supports a causal claim.\n- **Reporting a single number without its denominator.** \"830 attended\" sounds like progress until you notice 1,240 enrolled and the previous month had 803 of a smaller cohort.\n- **Cleaning invisibly.** If you remove outliers or exclude records without writing it down, the next person cannot reproduce your answer — and cannot defend it when somebody challenges it.\n- **Believing the spreadsheet formatting.** `2 500` might be a number or text; `01/02/2026` is January or February depending on the reader's locale; leading zeros vanish from phone numbers and ID codes. Convert and check types before analysis, not after.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Stage", "Question you are answering", "Output artifact", "Typical time share"],
              ["Framing", "What decision does this change?", "A written question, with definitions", "10%"],
              ["Collection", "Where does the data come from, and is it complete?", "Extract, query, script, lineage note", "15%"],
              ["Cleaning", "What is wrong with it, and what did I do about it?", "Tidy dataset plus a change log", "40%"],
              ["Exploration", "What does it look like, and which values are impossible?", "Distributions, summary statistics, first charts", "15%"],
              ["Analysis", "What is the answer, and how confident am I?", "Comparison, trend, model, test", "10%"],
              ["Communication", "What should be decided, and by whom?", "One page, one chart, a recommendation", "10%"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Data work is a loop that starts with a decision and ends with one, and its quality is decided at the two ends: a question precise enough to be wrong, and a communication clear enough to be acted on. Cleaning is not overhead — it is where trust is earned — and the analysis stage is often the shortest part of the job. Anyone who can run this loop reliably is more valuable than someone who knows every model and cannot tell you what the number means.",
          },
        ],
        keyPoints: [
          "Turn a vague business request into a falsifiable question with a named population, metric, period and decision.",
          "Distinguish descriptive, diagnostic, predictive and prescriptive analytics with an example of each.",
          "Describe the data analyst, data engineer, data scientist and ML engineer roles.",
          "Explain why cleaning and lineage notes determine whether an answer can be trusted later.",
          "State one limitation of the data you are working with, before someone else finds it.",
        ],
        exercises: [
          "Rewrite three vague requests (\"are we profitable?\", \"is the site working?\", \"are students happy?\") as precise, falsifiable questions with a population, a metric and a period.",
          "Take a dataset you have access to and write its lineage: source system, extract date, who owns it, known exclusions and the definition of every column you use.",
          "Find a published statistic about Ghana — unemployment, enrolment, mobile money usage — and identify its population, source and two questions it does not answer.",
          "For a decision you make regularly, list what data would inform it, what would count as evidence, and what you would do with the answer.",
          "Take a spreadsheet from your work and list every formatting or type problem in it, then rate how much damage each could do to a conclusion.",
        ],
        challenge:
          "Choose a real decision facing an organisation you know and build the complete framing document: the question, the population, the metric and its exact definition, the period, the data sources with their owners, the two most likely biases in that data, and the decision rule — what result would lead to which action. No analysis yet. Have it reviewed by somebody who will use the answer, and revise it until they agree it is the right question.",
      }),

      lesson({
        id: "cleaning-and-preparing-data",
        title: "Cleaning and preparing data",
        summary:
          "Real data is duplicated, missing, mis-typed, inconsistently named and full of values that are technically valid but impossible. This lesson is the craft of fixing that without introducing new errors: how to profile a dataset, the four kinds of missing data and what to do with each, how to handle duplicates and outliers, why tidy data is worth the reshaping, and how to make the whole process reproducible so that next month's numbers come out of the same steps rather than a fresh act of guesswork.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The moment a dataset arrives from the real world — a school register, a shop's sales export, a mobile-money statement — it stops being abstract and becomes a set of specific annoyances: `Kofi Mensah` and `KOFI MENSAH `, phone numbers that Excel has turned into `2.33E+09`, blank cells where a fee was waived, and one transaction for GH₵9,999,999 that turns out to be a test entry. Cleaning is where analysis is either saved or ruined.",
          },
          {
            heading: "Definition: tidy data, and the four kinds of missingness",
            kind: "definition",
            body:
              "**Tidy data** has one variable per column, one observation per row and one table per unit of analysis. It sounds obvious and rarely holds: a school export with columns `term1`, `term2`, `term3` is not tidy (term is a variable stored in column headings); a sales file with a merged month header row is not tidy (two facts in one cell). Reshaping into tidy form — long instead of wide — makes every later operation simpler, because filtering, grouping and charting all assume it.\n\n**Missing data** is not one thing. The distinction decides how you may treat it:\n\n- **Missing completely at random (MCAR)** — the value was lost for reasons unrelated to anything: a page torn out of a register. Dropping those rows is defensible.\n- **Missing at random (MAR)** — the probability of missing depends on another column you *do* have: men omit their age more often than women do. Imputation using that other column is defensible.\n- **Missing not at random (MNAR)** — the missingness depends on the value itself: the poorest households are least likely to report income. Dropping or imputing both create bias; you must report the limitation or find another source.\n- **Structurally missing** — the value cannot exist: a delivery date for an order that was cancelled. That is not missing data at all, and treating it as such invents information.\n\n**An outlier** is a value far from the rest. It is either an error (a mistyped decimal), a rare but real event (a bulk payment), or the most interesting observation in the dataset. Identify, investigate, decide — and record the decision.",
          },
          {
            heading: "The cleaning checklist",
            kind: "paragraph",
            body:
              "Work through these in order and write down what you do at each step. The written record is what makes the result auditable.\n\n1. **Profile first.** Row count, columns, types, ranges, distinct values, blanks. Look at the extremes of every numeric column and the frequencies of every categorical one. Two minutes of profiling prevents a week of wrong conclusions.\n2. **Fix types and units.** Numbers stored as text, dates parsed as strings, currency in two denominations, distances in kilometres and miles. Convert explicitly and check that the totals still reconcile.\n3. **Standardise categories.** `Male`, `M`, `male`, `1` all mean one thing. Build a mapping table rather than a chain of find-and-replace, so the decision is visible and repeatable.\n4. **Trim and normalise text.** Trailing spaces, inconsistent capitalisation, non-breaking spaces, and accented characters that break joins between systems.\n5. **De-duplicate with a key, not a hunch.** Define what makes two rows the same record (student ID plus term, transaction reference). Then investigate near-duplicates: two identical rows might be two genuine transactions or one recorded twice.\n6. **Handle missing values case by case.** Drop the row, drop the column, impute with the mean/median/mode, carry a value forward, or use a model — and label imputed values so the next analyst can see them.\n7. **Treat outliers deliberately.** Correct them, cap them, model them separately, or keep them and report their effect. Never delete an outlier silently because a chart looks tidier.\n8. **Check internal consistency.** End dates after start dates, ages inside a plausible range, totals that equal the sum of their parts, IDs that exist in the parent table.\n9. **Validate against an external number.** Compare your cleaned total with the bank statement, the invoice book or the previous report. If it differs, find out why before you proceed.\n10. **Write the change log.** Rows removed and why, values imputed and how, categories merged, columns renamed. This is the difference between a cleaned dataset and an undocumented mess.",
          },
          {
            heading: "Worked example: cleaning a messy enrolment export",
            kind: "example",
            body:
              "The file has 1,247 rows, 9 columns, and the problems every real export has. The profile output below is the first thing to generate, because it turns \"this file is a mess\" into a list of specific tasks.\n\nReading it: `student_id` is fine (1,240 distinct values, so seven duplicates to investigate). `fee_paid` is text for 312 rows because somebody typed `N/A` and a currency symbol, which means any sum of that column is either wrong or refusing to compute. `dob` has impossible dates (year 1016, and one 2199) — typos, not data. `enrolled_at` is missing for 18 rows and all 18 come from one intake day, which suggests a batch upload failure rather than random loss — so the missingness is MAR at best and should be reported. `gender` has seven spellings of two values.\n\nThe repair is a script rather than a series of manual edits, so it can be re-run when the next export arrives: this month's fixes become next month's automated step.",
            code:
              "# Profiling a freshly arrived export\nimport pandas as pd\n\ndf = pd.read_csv(\"enrolment_2026H1.csv\", dtype=str)   # read as text first\nprint(df.shape)                                        # (1247, 9)\nprint(df.nunique())\nprint(df.isna().sum().sort_values(ascending=False))\n\n#   student_id     1240 unique      fee_paid      312 non-numeric (\"N/A\", \"GH₵650\")\n#   dob             impossible: 1016-04-02, 2199-11-30, 3 rows blank\n#   enrolled_at     18 blank, all from 2026-02-14  → one batch upload\n#   gender          {Male, M, male, FEMALE, F, female, unknown}  → 2 real values\n\n# The cleaning script — re-runnable, so next month starts from here\nimport numpy as np\n\ndf[\"fee_paid\"]  = (df[\"fee_paid\"].str.replace(r\"[^0-9.]\", \"\", regex=True)\n                                      .replace(\"\", np.nan).astype(float))\ndf[\"dob\"]       = pd.to_datetime(df[\"dob\"], errors=\"coerce\")\ndf.loc[(df[\"dob\"].dt.year < 1950) | (df[\"dob\"].dt.year > 2015), \"dob\"] = pd.NaT\ndf[\"gender\"]    = df[\"gender\"].str.strip().str.lower().map(\n    {\"male\": \"M\", \"m\": \"M\", \"female\": \"F\", \"f\": \"F\"})\ndf[\"enrolled_at\"] = pd.to_datetime(df[\"enrolled_at\"], errors=\"coerce\")\n\ndupes = df[df.duplicated(\"student_id\", keep=False)]\nprint(f\"{len(dupes)} rows share an id — investigate before dropping\")\n\n# Validate against a number somebody already trusts\nexpected = 1_240  # enrolment desk's own count for the term\nprint(\"rows after de-duplication:\", df.drop_duplicates(\"student_id\").shape[0], \"| expected:\", expected)",
            language: "python",
            codeLabel: "Profile, repair, reconcile — in that order",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Cleaning by hand in the spreadsheet.** Every manual edit is unreproducible and unauditable. Script the steps once; re-run them next month.\n- **Filling every blank with zero.** Zero is a value, and it changes averages. A blank fee is not a GH₵0 fee; it is unknown.\n- **Dropping rows to make a result significant.** That is not cleaning, it is fabricating. Every exclusion belongs in the change log with a justification written before you see the effect.\n- **Trusting `dtype=str` forever.** Reading everything as text protects leading zeros and IDs, but you must convert deliberately afterwards; leaving numbers as strings silently breaks sorting and sums.\n- **Believing exact duplicates are errors.** In transaction data, two identical rows at the same second are a duplicate; two identical rows a week apart are two purchases. The key decides.\n- **Ignoring the join keys.** Cleaning each table perfectly and joining on unmatching values (`GHS-0042` against `ghs42`) loses records silently, which is the most expensive kind of bug because the output still looks plausible.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Problem", "Symptom in the data", "Defensible treatment", "What to record"],
              ["Missing value", "Blanks, `N/A`, `-`, `null`", "Drop, impute, or flag — by missingness kind", "How many, why, and the method used"],
              ["Duplicate", "Same key or near-identical rows", "De-duplicate on a defined key; investigate the rest", "The key and how many rows were merged"],
              ["Wrong type", "Numbers as text, dates as strings", "Convert explicitly, check totals after", "The conversion and any coerced failures"],
              ["Outlier", "Value far outside the plausible range", "Correct, cap, separate or keep", "The judgement and its effect on results"],
              ["Inconsistent category", "Seven spellings of two values", "Mapping table, not find-and-replace", "The mapping, and any value left unmapped"],
              ["Unit or currency mismatch", "Mixed GHS and USD, km and miles", "Convert to one unit at the point of entry", "The rate and date used for conversion"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Cleaning is the majority of the work and the whole foundation of trust: profile before touching anything, fix types and categories with explicit mappings, handle missing values according to *why* they are missing, treat outliers as decisions rather than nuisances, and reconcile your totals against a number somebody already believes. Do it in a script, write down every change, and the next analysis of the same data starts where this one finished.",
          },
        ],
        keyPoints: [
          "Profile a dataset before analysing it, and turn the profile into a list of specific cleaning tasks.",
          "Explain tidy data and reshape a wide dataset into long form.",
          "Distinguish MCAR, MAR, MNAR and structurally missing data, and choose a defensible treatment for each.",
          "De-duplicate on a defined key and reconcile totals against an external source.",
          "Write a change log that makes a cleaned dataset reproducible and auditable.",
        ],
        exercises: [
          "Take any real export — attendance, sales, a mobile-money statement — and profile it: shape, types, distinct values, blanks and impossible values. Write the list of problems.",
          "Convert a wide table (one column per month) into tidy long form and state which operations became possible.",
          "Deliberately break a join by leaving inconsistent keys in two tables, observe the silent row loss, then fix it and count what was recovered.",
          "Take one column with missing values and treat it three ways: drop, mean-impute, and flag. Compare the resulting averages and explain the differences.",
          "Find an outlier in any dataset you have and investigate it properly. Decide whether it is an error, a rare real event or the most interesting record in the file, and defend the choice in writing.",
        ],
        challenge:
          "Take the messiest dataset you can obtain — ideally one from a real organisation with duplicates, blanks and inconsistent categories — and produce a cleaning script plus a one-page data quality report: what was wrong, what you did, what you could not fix, what the total reconciles against, and the three remaining limitations somebody using this data must know. Then hand it to a colleague and ask them to re-run it from scratch on a fresh export.",
      }),
    ]
  ),

  module(
    "insight-and-decisions",
    "02 · Insight and decisions",
    "Describing data honestly, then putting it in front of somebody who acts on it.",
    [
      lesson({
        id: "describing-and-visualising-data",
        title: "Describing and visualising data",
        summary:
          "Averages lie, charts lie more convincingly, and both are easy to fix. This lesson covers the summary statistics that describe a distribution honestly — mean, median, standard deviation, percentiles — the shapes that matter (normal, skewed, bimodal), the vocabulary of correlation and why it is not causation, and the chart choices that communicate rather than decorate, including the specific tricks that mislead: truncated axes, cherry-picked periods, dual-axis charts and 3D pies.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Two analyses of the same school can reach opposite conclusions while both being arithmetically correct, simply by choosing an average or a chart that hides the shape of the data. The skill in this lesson is not decorative: it is being able to describe a distribution in four numbers and one picture, so that whoever reads it can make a decision without being misled — and so that if you are misleading them, you can tell.",
          },
          {
            heading: "Definition: the statistics that describe a distribution",
            kind: "definition",
            body:
              "**Mean** — the arithmetic average: the sum divided by the count. It uses every value, and a single extreme value drags it. Use it for symmetric data or when the total matters (total revenue per student is a mean by definition).\n\n**Median** — the middle value when sorted. Half the observations are below it. Resistant to extremes, which is why income, house prices, waiting times and salaries are reported as medians.\n\n**Mode** — the most frequent value. The only sensible average for categories (the most common complaint) and useful for spotting spikes in discrete data.\n\n**Standard deviation** — roughly, the typical distance of a value from the mean. **Variance** is its square. Both describe spread, so two groups with identical means can behave completely differently: two classes averaging 65% where one has an SD of 5 and the other of 18 are not the same class, and the second needs investigation, not a congratulation.\n\n**Percentiles and quartiles** — the p95 is the value below which 95% of observations fall. Percentiles describe the tail, which is where the problems live: a website averaging 200 ms with a p99 of 6 seconds is broken for one in a hundred users, and if those users are paying customers, the average is a lie about the business.\n\n**Range and interquartile range (IQR)** — the extremes and the middle half. The IQR is the robust spread measure to pair with the median.",
          },
          {
            heading: "Shapes, and what they tell you to do",
            kind: "paragraph",
            body:
              "**Symmetric (often bell-shaped)** — mean and median agree. Report either, plus the spread.\n\n**Right-skewed** — a long tail of large values: income, transaction amounts, session durations. Mean > median. Report the median, and if totals matter, report the mean as well *with* the skew acknowledged.\n\n**Left-skewed** — a long tail of small values: exam scores where most students do well, equipment lifetimes. Same logic in reverse.\n\n**Bimodal** — two peaks, which almost always means two populations mixed together: weekday and weekend traffic, two campuses, two intakes. The correct response is to split the data and analyse each group, because a mean of two peaks describes a value that occurs nowhere in the data.\n\n**Long-tailed / power law** — a few enormous values and many tiny ones: file downloads, city populations, app usage. Averages are meaningless; report medians and percentiles, and often a log scale on the chart.\n\nTwo habits follow from this. First, **plot before you compute**: a histogram of any column you are about to average will show you whether the mean is meaningful, in seconds. Second, **always pair a summary with a spread and a count** — \"average 68%, SD 14%, n = 412\" is an honest sentence; \"average 68%\" is a hypothesis about the shape of the data.",
          },
          {
            heading: "Worked example: the same data, three honest readings",
            kind: "example",
            body:
              "A Ghanaian training centre has 412 fee payments recorded in a term. The mean is GH₵742, the median GH₵480, and the distribution is strongly right-skewed because a handful of corporate contracts pay thousands.\n\nReading one — *the mean* — suggests the typical student pays GH₵742 per term. It is arithmetically correct and practically wrong: no student pays that amount; the number is pulled upward by 11 corporate contracts.\n\nReading two — *the median* — says the typical student pays GH₵480, which is the most useful single sentence for a pricing decision: half the students pay less than that, half more.\n\nReading three — *the percentiles* — says p10 = GH₵150, p25 = GH₵300, p75 = GH₵650, p95 = GH₵2,300. Now the centre *and* the spread are visible, and the conversation changes: the bottom quarter of students are paying less than two-thirds of the median, which is exactly the group a hardship policy would target.\n\nThe same table, three sentences: a mean that misleads, a median that informs, and percentiles that decide. Notice that no statistics beyond arithmetic were needed — only the discipline to look at the shape before quoting a number.",
            code:
              "+-------------+--------+----------------------------------------------+\n| Statistic   | Value  | What it would make somebody do               |\n+-------------+--------+----------------------------------------------+\n| Count       |    412 | —                                            |\n| Mean        | GH₵742 | Raise the standard fee to GH₵750 • wrong      |\n| Median      | GH₵480 | Keep the fee, target support below GH₵400 • ok|\n| Std dev     | GH₵610 | Warns that a single mean is meaningless here  |\n| p10         | GH₵150 | Hardship tier, lowest 10%                    |\n| p25         | GH₵300 | Hardship tier, lowest 25%                    |\n| p75         | GH₵650 | Fee band for most students                   |\n| p95         | GH₵2 300| Corporate contracts — analyse separately     |\n+-------------+--------+----------------------------------------------+\n\n# Chart choice for the same data:\n#   histogram of payments, log scale on x      → shows the skew honestly\n#   box plot by intake                         → compares groups, shows outliers\n#   NOT a pie chart of 412 values, and NOT a single bar of the mean",
            language: "text",
            codeLabel: "One dataset, and what each number licenses you to say",
          },
          {
            heading: "Correlation, causation and the chart tricks",
            kind: "paragraph",
            body:
              "**Correlation** measures how two variables move together, from −1 to +1. Zero means no linear relationship — and it does not rule out a strong non-linear one, which is why you look at a scatter plot rather than trusting the coefficient.\n\nCorrelation is not causation for three structural reasons: **reverse causality** (successful students attend more, and attending more causes success, in different directions), a **common cause** (both vary with income or distance from campus), and **selection** (only the most motivated people completed the survey). The only clean way to support a causal claim is an experiment with random assignment; the fallbacks — natural experiments, before-and-after with a comparison group, instrumental variables — are legitimate but need care and explicit assumptions.\n\nAnd the chart tricks, which you will meet in other people's presentations and must never use in your own:\n\n- **A truncated y-axis.** Starting a bar chart at 90 instead of 0 turns a 2% difference into a cliff. Bars must start at zero; line charts may not, but you must say so.\n- **Cherry-picked periods.** \"Revenue has doubled\" measured from the worst month to the best month of a seasonal year. Show enough context for the claim to be checkable.\n- **Dual axes** that manufacture a relationship between two unrelated series by stretching each scale until the lines cross.\n- **3D pies and exploded pies.** Angles are already hard to compare; perspective makes it impossible.\n- **Cumulative charts presented as rates.** A cumulative total always rises, so it always \"grows\".\n- **Percentage without a base.** \"80% of users\" of eleven users.\n\nThe rule that covers all of them: a chart should make the claim falsifiable by the person reading it.",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Averaging an average.** An average of weekly averages weights a week with three records the same as a week with three hundred. Go back to the raw records or weight properly.\n- **Reporting a percentage change on a tiny base.** From 2 to 5 is \"+150%\" and also three more students. Always give the base.\n- **Comparing groups of very different sizes without intervals.** A 4-point difference between groups of 12 and 1,200 is noise in one and signal in the other.\n- **Treating the mean as the target.** \"Average processing time 3 days\" hides that 15% of applications take three weeks, which is the number that generates complaints.\n- **Confusing statistical with practical significance.** With enough records, a 0.3% improvement is \"significant\" and still not worth the change.\n- **Choosing the chart you like.** Choose the chart the comparison needs: change over time → line; composition → stacked bar; distribution → histogram or box plot; relationship → scatter; ranking → horizontal bars.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Question", "Right chart", "Wrong chart", "Watch out for"],
              ["How has this changed over time?", "Line chart", "Pie chart", "Choose the period before looking at it"],
              ["How is this distributed?", "Histogram, box plot", "A bar of the mean", "Bimodal data splitting a mean"],
              ["How do groups compare?", "Grouped bar, box plot", "Dual-axis line", "Unequal group sizes"],
              ["Is there a relationship?", "Scatter plot", "Two separate trend lines", "Non-linearity, outliers, common cause"],
              ["What is the composition?", "Stacked bar, treemap", "3D pie", "Too many categories — group the small ones"],
              ["What is the ranking?", "Horizontal bars", "Vertical bars with rotated labels", "Starting the axis away from zero"],
              ["Where does the tail hurt?", "Percentile table, CDF", "Mean-only summary", "Reporting p99 and its n"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Describe a distribution with a count, a centre, a spread and a tail — mean or median according to shape, plus standard deviation or IQR, plus percentiles where the tail is the story. Plot before computing, because shape decides which average is honest. Treat correlation as a clue rather than a conclusion, and choose charts that a sceptical reader can check against your claim. None of this is complicated; all of it is routinely skipped, which is why bad numbers travel so easily.",
          },
        ],
        keyPoints: [
          "Choose between mean, median and mode according to the shape of a distribution.",
          "Report a spread and a count alongside any centre, and explain why.",
          "Identify symmetric, skewed, bimodal and long-tailed data and say what each implies for analysis.",
          "Explain three structural reasons correlation is not causation, with an example of each.",
          "Recognise the common chart manipulations and choose a chart that makes a claim checkable.",
        ],
        exercises: [
          "Take any numeric column you have and compute mean, median, standard deviation and the 10th/25th/75th/95th percentiles. Write one sentence a manager could act on.",
          "Find a column with a bimodal distribution by plotting a histogram, then split it into the two groups and show how each group's mean differs.",
          "Collect two variables that correlate in your own data (day of week and attendance, distance and fee arrears). List the possible common causes and design an experiment that could separate them.",
          "Find a chart in a newspaper article or annual report that is easy to misread. Identify precisely which decision it encourages and how the axis or period choice does it.",
          "Redraw one of your own charts twice: once to be honest, once deliberately misleading. Explain the difference in what each version makes a reader believe.",
        ],
        challenge:
          "Produce a one-page analytical note on a question from your own work or study: a headline sentence, a distribution described with count, centre, spread and tail, one chart that makes the claim checkable, one honest caveat about the data, and a recommendation. Give it to somebody who does not know the data and ask them to state your conclusion and one thing they would need to verify before acting on it.",
      }),

      lesson({
        id: "from-analysis-to-decision",
        title: "From analysis to decisions",
        summary:
          "Analysis only matters when it changes something. This lesson covers the last mile: aggregating with SQL, designing a dashboard people actually open, choosing the few KPIs that matter, and testing a change properly with an A/B test — sample sizes, significance, confidence intervals and the errors that make an experiment decorative. It closes the data science course by connecting the numbers to a decision somebody makes on Monday morning.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Most analysts can produce a number. Fewer can produce a decision. The gap is made of three things: getting the data at the level of detail the decision needs, presenting it so that it can be understood in ten seconds, and — where a choice must be made between two options — running a test that gives a defensible answer instead of a hopeful one.",
          },
          {
            heading: "Definition: aggregation, KPI, dashboard, experiment",
            kind: "definition",
            body:
              "**Aggregation** is combining many records into a summary: counts, sums, averages, minimums, maximums, grouped by a category and a period. In SQL that is `GROUP BY`; in a spreadsheet it is a pivot table. The two mistakes to avoid are aggregating something that should not be aggregated (a ratio of ratios) and losing the denominator (a count with no population).\n\n**A KPI** is a measure tied to a goal, with an owner and a decision attached. Four tests: does it measure progress against something we said matters; does one person own it; can it move because of something we do; and would we change our behaviour if it changed? \"Number of lessons opened\" may be a good KPI; \"page views\" almost never is.\n\n**A dashboard** is a small set of charts answering a repeated question at a glance. Its enemy is completeness: a screen with thirty charts is a data dump that nobody reads. A good dashboard has one headline number, the two or three charts that show direction and splits, and a timestamp plus a note on data freshness.\n\n**An A/B test** is a randomised experiment: two groups drawn from the same population, one receiving the change and one not, compared on a measure decided in advance. Randomisation is what makes the comparison causal; without it you are describing a difference and guessing at its cause.",
          },
          {
            heading: "Designing a test, properly",
            kind: "paragraph",
            body:
              "Five decisions, made before the test starts, and all of them in writing:\n\n1. **The metric.** One primary measure, plus a small number of secondary ones. If you choose it after the result arrives, the test is worthless.\n2. **The hypothesis and the minimum effect worth detecting.** \"Sending a WhatsApp reminder 24 hours before a session raises attendance by at least 5 percentage points\" is testable; \"reminders help\" is not.\n3. **The sample size.** It follows from the baseline rate, the effect you want to detect and your tolerance for error. As a rough guide, detecting a change in a proportion needs hundreds of observations per group to see anything smaller than a 20% relative change — and if your sample is too small, the honest answer is \"we cannot tell from this much data\", not \"no effect\".\n4. **The comparison.** A hold-out group that receives nothing different. Compare two variants against each other with no control and you cannot separate either from the passage of time.\n5. **The stopping rule.** Decide how long the test runs before you look, because stopping when it first looks significant guarantees a false positive.\n\nThen **significance**, stated in the terms that matter to a decision: a **p-value** is the probability of seeing an effect this large if there were truly no difference — not the probability that the change works. A **confidence interval** is far more useful: \"attendance rose by 4 to 9 percentage points\" tells you both direction and precision, and it is what a decision-maker needs. A result with a 95% interval that includes zero is not evidence of no effect; it is evidence that the test was too small to tell.\n\nBe honest about the two error types: a false positive ships a useless change and costs money; a false negative discards a good one. Which one is worse depends on the decision, and saying so out loud is part of the job.",
          },
          {
            heading: "Worked example: an attendance nudge, tested",
            kind: "example",
            body:
              "The question: does a WhatsApp reminder the evening before a session increase attendance? The centre has six weeks and 20 sessions a week of data to work with.\n\nDesign first: the primary metric is attendance rate per student per session (attendances ÷ invitations), the baseline is 61%, the minimum effect worth acting on is 5 percentage points, and the test runs for four weeks. Students are randomised within each session so that time of day and instructor cannot explain the difference, and nobody is told which group they were allocated to.\n\nThe result is a rate in each group, the absolute difference and its confidence interval. Note what the numbers license you to say and what they do not: \"reminders raised attendance by about 6 points, and the plausible range is 2 to 10 points\" supports a decision to send them every week. It does not support the claim that reminders *cause* long-term retention, which is a different question with a longer horizon.\n\nThe last step is the one most teams skip: the recommendation is written with its owner, the cost (one part-time staff member's hour a day), the expected effect, and the date on which somebody will check whether the effect persisted after the novelty wore off.",
            code:
              "Group A (control, n = 3 100 student-sessions)  attendances 1 891  →  61.0%\nGroup B (reminder, n = 3 080 student-sessions) attendances 2 064  →  67.0%\n\nDifference: +6.0 percentage points     95% CI [2.1, 9.9]     p < 0.01\n   → 95% CI excludes 0, and the lower bound is above the +2 pt threshold\n     we agreed to care about.  Ship it.\n\nCost:  ~1 staff hour per day   Effect: +6 pts of 3 000 student-sessions per week\n        ≈ 180 extra attendances a week, ≈ 1 080 over the six-week term\n\nWhat the test does NOT say:\n  • that reminders cause retention six months later (untested)\n  • that reminders would work for a different program or a different channel\n  • that a reminder per session is the best frequency (that is the next test)\n\nNext actions\n  Owner      Action                                  Check on\n  Front desk send reminders, 18:00 the day before    2026-08-15\n  Analyst    re-measure attendance vs the 61% base  2026-08-15\n  Analyst    test 1 reminder/week vs per session     2026-09-01",
            language: "text",
            codeLabel: "A test whose result can survive a challenge",
          },
          {
            heading: "From number to decision",
            kind: "paragraph",
            body:
              "The handover is a document, not a dashboard link. Five sentences:\n\n1. **The decision.** \"Should we send reminders for the whole program, at what frequency, and who runs it?\"\n2. **The finding.** One sentence, with the interval: \"Weekly reminders raised attendance by 6 points (95% CI 2–10).\"\n3. **The confidence and its limits.** Sample size, period, what was not tested, and the one assumption that could break it (for example, that the WhatsApp number is the student's own — it often is not).\n4. **The recommendation and the cost.** What to do, what it costs, what it is expected to change.\n5. **The check-back date.** When the effect will be re-measured and by whom.\n\nPut the detail behind those five sentences, not in front of them. The common failure is a twenty-slide deck whose audience cannot state the recommendation afterwards.\n\nAnd for the resident dashboard, a rule borrowed from operations: every chart must have a decision attached. If nobody knows what they would do differently when a line moves, the chart belongs in an appendix, not on a wall.",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Testing without a control group.** \"Sign-ups rose after the change\" is not a test; sign-ups rise in January regardless.\n- **Stopping when it looks good.** Checking daily and stopping at the first significant p-value inflates the false-positive rate dramatically. Pre-commit to a duration.\n- **Reporting a p-value as proof.** \"p = 0.03, so there is a 97% chance the change works\" is wrong. The probability of the data given no effect is not the probability of an effect given the data.\n- **Ignoring the denominator in a rate.** A rise in \"attendance events\" during a recruitment drive may hide a fall in attendance rate.\n- **A dashboard nobody owns.** Unless somebody is expected to act on a number, it will decay into decoration, with stale data and no one noticing.\n- **Measuring everything.** Fifty KPIs mean no priority. Three to seven, each with an owner, is what a team can actually hold in mind.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Deliverable", "Answer it must give", "Length", "Failure mode"],
              ["KPI set", "Are we on track, and who owns it?", "3–7 measures", "Too many measures, no owners, no thresholds"],
              ["Dashboard", "What is happening now?", "One screen", "Stale data, thirty charts, no decision attached"],
              ["Experiment report", "Should we do this?", "One page plus an appendix", "Choosing the metric afterwards; no control group"],
              ["Analytical note", "What is true, and how sure are we?", "One page", "Headline without an interval or a caveat"],
              ["Recommendation", "What should be done, by whom, when?", "Paragraph", "No owner and no check-back date"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Aggregate at the level the decision needs, keep the denominator, and choose a handful of measures with owners rather than a wall of charts. Where a choice must be made, test it: define the metric, the minimum effect, the sample size and the stopping rule first, and report the difference with a confidence interval rather than a bare p-value. Then write the five sentences that turn an analysis into a decision — the decision, the finding, the limits, the recommendation and its cost, and the date somebody checks whether it worked.",
          },
        ],
        keyPoints: [
          "Write SQL or a pivot that aggregates at the level a decision needs, without losing the denominator.",
          "Apply the four tests of a good KPI and choose a small set with owners.",
          "Design an A/B test: one primary metric, a minimum effect, a sample size and a stopping rule.",
          "Interpret a difference with a confidence interval, and distinguish statistical from practical significance.",
          "Write the five-sentence handover that turns a finding into an owned decision.",
        ],
        exercises: [
          "Write one SQL query that returns a monthly attendance rate with students seen, students enrolled and the ratio, grouped by month and campus.",
          "Choose five KPIs for an organisation you know and name the owner and the decision attached to each. Delete any that fail the four tests.",
          "Design an A/B test for something you control — an email subject line, a form length, a reminder time — including the metric, the minimum effect, the sample size and the stopping rule.",
          "Given a result of +3 points with a 95% confidence interval of [−1, +7], write the honest one-sentence conclusion and the decision you would make.",
          "Take a dashboard you have seen and rewrite its top line as the decision it should support, then remove every chart with no decision attached.",
        ],
        challenge:
          "Run one real experiment from question to decision, even a small one: define the metric and the minimum effect, randomise where you can, collect enough data for the analysis to mean something, compute the difference with a confidence interval, and write the five-sentence handover with an owner and a check-back date. Then do the check-back, and report whether the effect persisted — including if it did not.",
      }),
    ]
  ),
];
