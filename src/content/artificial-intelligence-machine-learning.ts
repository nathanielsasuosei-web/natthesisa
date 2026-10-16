import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Artificial Intelligence & Machine Learning — what these systems actually do,
 * what they are good for, and where they fail.
 *
 * The course is deliberately honest about the mathematics: enough to reason
 * correctly about a model's behaviour, its errors and its limits, and no more
 * than that. It covers the history and the vocabulary, the machine-learning
 * workflow from problem framing to evaluation, neural networks and generative
 * models, and finally the ethics and practicalities — bias, privacy, cost,
 * verification — of deploying AI where real people are affected.
 */

export const AI_ML_MODULES: CourseModule[] = [
  module(
    "ai-foundations",
    "01 · Foundations",
    "What AI has been, what it is now, and the workflow that turns data into a working model.",
    [
      lesson({
        id: "what-ai-and-ml-are",
        title: "What AI and machine learning really are",
        summary:
          "Artificial intelligence is the field; machine learning is the technique that dominates it today; and neither is magic, consciousness or a search engine with ambition. This lesson separates the vocabulary that marketing has muddled — AI, ML, deep learning, generative AI, agents — traces how the field arrived at large language models, and sets honest expectations about what statistical learning can and cannot do.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Two failures are equally common. One is dismissing AI as a fad, which means missing tools that genuinely change what a small team can build. The other is believing the marketing, which leads to systems deployed on work they cannot do — medical judgement, legal advice, hiring decisions — with consequences for real people. The way out of both is precise vocabulary and an accurate mental model of what a model is.",
          },
          {
            heading: "Definition: the words, defined as an engineer would",
            kind: "definition",
            body:
              "**Artificial intelligence** is the broad goal of building systems that perform tasks associated with human intelligence: perceiving, reasoning, planning, using language. As a label it is now mostly aspirational.\n\n**Machine learning** is a family of methods in which a program's behaviour is *learned from data* rather than written by hand. Instead of coding rules for spotting fraudulent transactions, you show the program many labelled transactions and it finds the pattern. Learning, in this sense, is statistical optimisation: adjusting parameters to minimise error on examples you supplied.\n\n**Deep learning** is machine learning with neural networks that have many layers. Its advantage is representation learning — the network discovers useful features itself, which is why deep learning removed the need for hand-crafted features in vision and speech. Its cost is data and compute.\n\n**Generative AI** describes models that produce content: text, images, audio, code. Large language models are the current centre of gravity, trained to predict the next token in a sequence, which turns out to be enough to summarise, translate, answer questions, and write plausible code.\n\n**Agents** are systems that use a language model to decide *actions* — call a tool, query a database, run code — in a loop towards a goal. The model provides judgement; the surrounding software provides the limits.\n\nFour distinctions worth keeping straight:\n\n- **Training vs inference.** Training adjusts the parameters once, expensively, on a large dataset. Inference is using the finished model, cheaply, per request. Most business decisions are about inference cost.\n- **Supervised, unsupervised, reinforcement.** Supervised: labelled examples (`this email, spam or not`). Unsupervised: structure in unlabelled data (clustering customers). Reinforcement: learning from reward signals by acting (game-playing, and the alignment stage of modern chat models).\n- **Parametric vs retrieval.** A model's parameters encode its training. Retrieval fetches documents at run time so the answer can cite a source it never memorised. Most production assistants use both.\n- **Prediction vs understanding.** A model finds statistical regularities; it does not possess a model of the world in the way you do. It cites no source, verifies nothing, and will be confidently wrong.",
          },
          {
            heading: "How the field got here, briefly",
            kind: "paragraph",
            body:
              "**1950s–60s: symbolic AI.** Programs manipulated explicit rules and logic. Impressive in narrow domains, brittle everywhere else: a system that knows twenty facts breaks on the twenty-first.\n\n**1970s–80s: expert systems and the first AI winters.** Rules written by specialists, used in medicine and diagnostics, expensive to maintain; funding collapsed twice when the gap between demonstration and deployment became obvious.\n\n**1990s–2000s: statistical machine learning.** Cheaper data and compute, plus methods like support vector machines and random forests, moved the field from rules to statistics. Practical wins: spam filtering, credit scoring, recommendations.\n\n**2012 onward: deep learning.** A convolutional network's win on an image-recognition benchmark marked the change of era; GPUs and internet-scale data carried it into speech, translation and vision.\n\n**2017 onward: transformers and large language models.** The attention architecture made training on massive text practical, and scale produced qualitatively new behaviour: models that follow instructions, reason across a long context, and write code. Chat interfaces in 2022 put that capability in front of the public, and the current wave of products, agents and tooling followed.\n\nThe lesson from the history is not \"this time it is different\" but its opposite: every wave has been shaped by the same three forces — data, compute and method — and the practical question is always the same. What task, with what evidence, at what cost, with what consequence when it is wrong?",
          },
          {
            heading: "Worked example: the same task, three approaches",
            kind: "example",
            body:
              "Task: classify incoming customer support messages into five categories so they reach the right queue.\n\n**Rules.** Keyword lists per category. A day to build, transparent, no data needed. It handles 60% of messages and fails on anything phrased unexpectedly — which is exactly the messages that matter, because unusual phrasing often signals unusual problems. It is also a maintenance burden: every new phrasing is a new rule.\n\n**Supervised classification.** Label 2,000 historical messages, train a model (a linear classifier or a small transformer), measure accuracy on a held-out set. If it reaches 88% overall but 61% on the rarest and most important category (\"payment problems\"), the average is not the number to deploy on. You would collect more examples of that category, or route it to a human and say so.\n\n**A language model with a prompt and a taxonomy.** No training data, minutes to prototype, and it can explain its choice. It is more expensive per message, less deterministic, and needs guarding: it will confidently mislabel, and it must never be the component that decides whether a refund is approved. Used as a first-pass router with confidence thresholds and human review for the uncertain cases, it is often the best value for a small team — because the alternative is weeks of labelling nobody has time for.\n\nThe honest conclusion is neither \"use AI\" nor \"use rules\": each approach has a measurable cost, a measurable error rate and a different failure mode, and the choice belongs to whoever owns the consequences of a mistake.",
            code:
              "Classifying 5 000 support messages/month into 5 queues — the trade-offs\n\napproach            build cost   per 1 000 msgs   accuracy   failure mode\n--------------------------------------------------------------------------------\nrules (keywords)    1 day        ~GH₵0             ~60%       misses unusual phrasing;\n                                                              grows into 40+ rules\nsupervised model    3–4 weeks    ~GH₵1             ~88%       needs labelled data; drifts\n(labelled data)     (labelling)                     overall    when language changes;\n                                                   61% on     rare classes stay weak\n                                                   rare class\nLLM + prompt        1 day        ~GH₵8–20          ~85–92%    non-deterministic; needs\n+ human review                                   varies     thresholds, logging and\n                                                              a human path\n\nWhat to deploy first: LLM routing with confidence thresholds and a human\nqueue for the uncertain 15% — measured, logged, and replaced by a trained\nmodel only if the volume justifies the labelling cost.",
            language: "text",
            codeLabel: "No universal answer, only measured trade-offs",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"AI means it thinks.\"** Current systems optimise statistical objectives over data. That produces fluent, often correct output and no understanding of what the words refer to.\n- **\"More data always helps.\"** Quality, labelling accuracy and representativeness matter more than volume; a large badly labelled set teaches the wrong pattern thoroughly.\n- **\"The model is objective.\"** Models reproduce their training data, including its historical biases, and encode the choices of whoever collected and labelled it.\n- **Using a chatbot as a database.** Language models confabulate. Anything that must be accurate — a fee, a deadline, a policy — belongs in a retrieval step against a real source.\n- **Judging one prompt.** Output varies; judging quality means testing across many inputs, including the awkward ones. A demo of three successes is not evidence.\n- **Adopting AI because competitors did.** The relevant question is whether the task has data, a measurable objective and a tolerable error cost. If not, the project will fail regardless of the technology.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Term", "Means", "Does not mean", "Where you meet it"],
              ["Artificial intelligence", "The field and its goal", "Consciousness or general reasoning", "Marketing copy, research, policy"],
              ["Machine learning", "Behaviour learned from data by optimisation", "Hand-written rules", "Fraud detection, recommendations, forecasting"],
              ["Deep learning", "Multi-layer neural networks", "Always better than simpler models", "Vision, speech, language"],
              ["Generative AI", "Models that produce content", "Always accurate or sourced", "Drafting, summarising, translation, code"],
              ["LLM", "A model predicting the next token at scale", "A database or a reasoning engine", "Chat assistants, agents, copilots"],
              ["Agent", "A model choosing actions in a loop", "Full autonomy without limits", "Tool-using assistants, automations"],
              ["Training / inference", "Fit parameters once / use them per request", "The same cost profile", "Budgets, latency, capacity planning"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Machine learning learns patterns from data by optimisation; deep learning learns its own features; generative models produce content by predicting tokens. None of that amounts to understanding, and the honest engineering question is always about task, data, measurable objective, error cost and inference budget. Knowing the history also inoculates you against the hype cycle: data, compute and method have each driven a wave, and each wave has rewarded people who asked what the system was actually for.",
          },
        ],
        keyPoints: [
          "Define AI, machine learning, deep learning, generative AI, LLMs and agents without conflating them.",
          "Distinguish training from inference and explain which one dominates a production budget.",
          "Name the three learning paradigms and give an example of each.",
          "Explain what a language model computes and why it can be confidently wrong.",
          "Compare rules, supervised learning and prompted LLMs for the same task by cost, accuracy and failure mode.",
        ],
        exercises: [
          "For five products marketed as AI, write down which of this lesson's terms each actually is, and what it computes.",
          "Explain to somebody non-technical, in three sentences, why a chatbot can state a wrong fee with complete confidence.",
          "Take a task you do regularly and describe how you would approach it with rules, with supervised learning, and with a prompted model. Estimate the build cost and error cost of each.",
          "Find a documented example of a model that reproduced a bias from its training data. Write down where the bias entered: collection, labelling, objective or deployment.",
          "List three tasks in your own work where a wrong answer is cheap and three where it is expensive. Explain how that difference changes what you would deploy.",
        ],
        challenge:
          "Write a two-page assessment of one real task in an organisation you know — sorting applications, predicting demand, answering common questions — stating the decision it affects, the data that exists today, the measurable objective, the cost of a false positive versus a false negative, the three approaches (rules, trained model, prompted model) with estimated cost and accuracy, and a recommendation with the fallback for when the system is wrong.",
      }),

      lesson({
        id: "the-machine-learning-workflow",
        title: "The machine learning workflow",
        summary:
          "Most failed AI projects fail before any model is trained. This lesson covers the workflow that prevents it: framing the problem as a measurable prediction with a decision attached, preparing and splitting data honestly, choosing a baseline model before a complex one, evaluating with the metrics that match the cost of errors, watching for overfitting and data leakage, and monitoring a deployed model as the world moves away from its training data.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "\"We have data, let us apply machine learning\" is the sentence that begins most abandoned projects. The alternative order is unglamorous and works: decide what prediction would change what decision, find out whether the data can support it, build the simplest baseline, measure it against the cost of being wrong, then improve only what the measurement justifies.",
          },
          {
            heading: "Definition: features, labels, training, validation, generalisation",
            kind: "definition",
            body:
              "**Features** are the inputs a model may use. **Labels** are the answers it learns to predict. **A training set** is what it learns from; **a validation set** is used to tune choices; **a test set** is touched once, at the end, to estimate how the model will behave on data it has never seen. Splitting is not bureaucracy: it is the only honest measure of generalisation.\n\n**Generalisation** is the entire goal — performing well on new cases, not on the cases it memorised.\n\n**Overfitting** is memorising the training data, including its noise. It looks wonderful on training metrics and fails on new data. Symptoms: a large gap between training and validation performance, unstable results across folds, and accuracy that collapses on slightly different inputs. Cures: more and better data, a simpler model, regularisation, cross-validation, early stopping, augmentation.\n\n**Underfitting** is the opposite: a model too simple to capture the pattern, poor on both sets. Cures: more capacity, better features, longer training.\n\n**Data leakage** is the subtlest and most damaging failure: information present in the training data that would not be available at prediction time. A churn model that used a field populated *after* the customer left will score brilliantly offline and be useless in production. Leakage also appears through preprocessing done before the split (scaling with statistics from the whole dataset, imputing with the global mean) and through duplicate rows landing in both sets.\n\n**Drift** is the world moving: customer behaviour changes, prices change, a pandemic changes everything, the meaning of a category quietly shifts. A model is a snapshot of the past, and it degrades without announcing it.",
          },
          {
            heading: "The workflow, in order",
            kind: "paragraph",
            body:
              "1. **Frame the decision.** What action will change based on this prediction? Who takes it, how often, and what does an error cost in money or harm? If no decision changes, stop.\n2. **Translate into a measurable task.** Classification (which class), regression (how much), ranking (what order), clustering (what groups), generation (what content). Define the target variable and its exact definition — \"churn\" must mean one specific thing, observed over one specific window.\n3. **Interrogate the data.** How many rows, over what period, with what coverage? Is the target balanced? Who is missing from the data, and does that matter? Is the label trustworthy or was it entered by an overloaded clerk?\n4. **Split properly, and early.** Train, validation, test. For time-dependent problems use a *time-based* split — train on the past, test on the future — because a random split leaks the future into training and inflates every score.\n5. **Establish a baseline.** Predict the majority class, or last month's value, or the existing rule. If a model cannot beat the baseline, nothing else matters. This step is skipped most often and saves the most time.\n6. **Choose the simplest model that might work.** Logistic regression or a decision tree is interpretable, fast, and often within a few points of the fanciest option. Add complexity only when measurement demands it.\n7. **Tune and validate.** Cross-validation, honest parameter search, and a hard look at the errors rather than only the score.\n8. **Evaluate with the right metric, on the test set, once.** Accuracy is misleading on imbalanced problems; precision, recall, F1, and for anything risk-related, the confusion matrix with costs attached.\n9. **Explain and stress-test.** Which features drive the prediction? What happens on the subgroup with the least data? What is the worst plausible input?\n10. **Deploy, monitor and retrain.** Log inputs and outputs, track the metric in production, watch for drift, and decide a retraining cadence and a kill switch before launch.",
          },
          {
            heading: "Worked example: a churn model that looked perfect and was worthless",
            kind: "example",
            body:
              "A subscription business wants to predict which customers will cancel so that somebody can call them. The first attempt reports 99.4% accuracy. It is worthless, and the reasons are instructive.\n\nFirst, the classes are imbalanced: 1.8% of customers cancel in a given month. A model that always predicts \"stays\" scores 98.2% and is useless. Accuracy was the wrong metric from the start; precision, recall and the confusion matrix are the right ones, because the cost of a missed churner (lost revenue) differs sharply from the cost of a false alarm (a wasted call).\n\nSecond, leakage: the feature `support_ticket_about_cancellation` was populated *after* the customer decided to leave. It predicts churn with near-perfect fidelity and is unavailable at prediction time. Removing it drops the score to something honest.\n\nThird, the split was random over time, so the model trained on July and was tested on March — reading the future. A time-based split gives the real number.\n\nFourth, the target was undefined: \"cancel\" meant account closure in one table and non-renewal in another, and the two disagreed for 400 customers. Fixing the definition changed the label for 8% of the dataset.\n\nAfter all four repairs the model reports 71% recall at 45% precision. That is a modest, honest, useful result: it finds seven of ten people who will leave, at the cost of calling roughly one customer in two who was never going to. The business can decide whether that trade is worth a retention call — which is the only question that ever mattered.",
            code:
              "First attempt (91 000 customers, 1 672 churned = 1.8%)\n  reported accuracy 99.4%          ← the majority-class baseline is 98.2%\n  metric used: accuracy            ← wrong for an imbalanced problem\n  leakage: 'support_ticket_about_cancellation' (post-event, unavailable at\n           prediction time)\n  split: random                    ← trained on July, tested on March\n  label: 'cancel' meant two different things in two tables\n\nAfter repair\n  target:      churned = no renewal within 30 days of contract end, per billing\n  split:       train Jan–Jun → validate Jul–Sep → test Oct–Dec (time-based)\n  baseline:    always predict 'stays' → 98.2% accuracy, 0% recall\n  model:       logistic regression, 14 features, no post-event fields\n\nConfusion matrix on the test split (n = 22 400, 402 churned)\n                 predicted stay   predicted churn\n  actually stay      21 810             188\n  actually churn         117             285\n\n  recall    0.71   (285 / 402)   ← seven in ten leavers are found\n  precision 0.60   (285 / 473)   ← six in ten calls reach a likely leaver\n  cost model: one call ≈ GH₵4; one retained customer ≈ GH₵180/year\n             → 285 found − 188 false alarms ≈ profitable with margin\n  retrain quarterly; monitor feature drift monthly; kill switch documented",
            language: "text",
            codeLabel: "A perfect metric, four real problems, one honest result",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Measuring accuracy on imbalanced data.** With 2% positives, always predicting \"no\" scores 98%. Report recall and precision, and tie them to the cost of each error.\n- **A random split on time-ordered data.** It leaks the future and inflates results. Split by time for anything with a temporal pattern.\n- **Preprocessing before splitting.** Fitting a scaler or an imputer on the full dataset leaks test statistics into training. Fit on train, transform on test.\n- **Feature leakage from the future.** Any column created after the event you are predicting must be removed. Ask of every feature: would this value exist at prediction time?\n- **Chasing a metric without asking about the subgroup.** A model with 92% overall accuracy can be 60% accurate for a minority group — invisible unless you measure it.\n- **Deploying without monitoring.** A model without drift monitoring is a silent failure waiting for a quarterly review to notice.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Problem type", "Output", "Default metric", "When it misleads"],
              ["Classification (balanced)", "A class", "Accuracy, F1", "When errors differ in cost"],
              ["Classification (imbalanced)", "A class", "Precision, recall, PR-AUC", "Accuracy hides the minority class"],
              ["Regression", "A number", "MAE, RMSE, R²", "Outliers dominate RMSE; R² hides bias"],
              ["Ranking / recommendation", "An order", "Precision@k, nDCG, recall@k", "Offline metrics do not capture novelty or fairness"],
              ["Forecasting", "A future value", "MAE per horizon, MAPE", "Short horizons flatter the model"],
              ["Clustering", "Groups", "Silhouette, stability, usefulness", "Numbers do not tell you if the groups mean anything"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "The workflow is the discipline: frame a decision, define the target precisely, interrogate the data, split honestly by time, beat a baseline with the simplest model, choose metrics that match the cost of being wrong, and check the errors rather than only the score. Overfitting, leakage and drift are the three failures that turn a brilliant offline result into a useless or harmful production system, and each one is prevented by a step that takes an afternoon.",
          },
        ],
        keyPoints: [
          "Frame an AI project around a decision, an error cost and a measurable objective.",
          "Split data honestly, using a time-based split for anything with temporal structure.",
          "Explain overfitting, underfitting, data leakage and drift, and prevent each.",
          "Choose metrics that reflect the cost of false positives and false negatives.",
          "Plan monitoring, retraining and a kill switch before deployment.",
        ],
        exercises: [
          "Take a prediction you would like to make and write the framing: the decision, the actor, the target variable's exact definition and the cost of each error type.",
          "Compute the majority-class baseline for an imbalanced dataset and compare it with the accuracy of a model trained on the same data.",
          "Build the same model twice: once with a random split and once with a time-based split. Record the difference in the metric and explain it.",
          "Find a dataset with a feature that would not exist at prediction time, remove it, and measure the honest performance drop.",
          "Write a monitoring plan for a model: which inputs and outputs to log, what drift looks like, how often to retrain, and what triggers the kill switch.",
        ],
        challenge:
          "Take one real prediction problem end to end: frame it, define the target, explore the data's coverage and gaps, split it by time, beat a baseline with a simple model, evaluate with cost-weighted metrics, inspect and explain the errors rather than the score, and write a one-page deployment plan with monitoring, retraining cadence and a kill switch. Report honestly where the model is weak, and what you would collect to fix it.",
      }),
    ]
  ),

  module(
    "modern-ai",
    "02 · Modern AI in practice",
    "Neural networks, generative models, and deploying AI responsibly.",
    [
      lesson({
        id: "neural-networks-and-generative-ai",
        title: "Neural networks and generative AI",
        summary:
          "This lesson opens the box far enough to reason about behaviour: what a neuron computes, why layers build representations, what training actually adjusts, what a transformer's attention and context window mean, and how diffusion models make images. Then the practical half — prompting, retrieval-augmented generation with citations, fine-tuning versus prompting, and the cost, latency and evaluation realities of building products on top of models you did not train.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "You do not need to be able to implement backpropagation to build with models competently — but you do need enough of a mental model to predict where they will be strong, where they will fail, and what governs their cost. This lesson provides exactly that: mechanics in plain language, then the engineering patterns that turn a model into a dependable feature.",
          },
          {
            heading: "Definition: neurons, layers, attention, tokens, embeddings",
            kind: "definition",
            body:
              "**A neuron** computes a weighted sum of its inputs, adds a bias, and passes the result through a non-linear activation. That is all: multiply, add, bend. A stack of such units can approximate extraordinarily complex functions, which is why depth helps.\n\n**Layers** build representations. In an image network, early layers detect edges, middle layers detect shapes, deeper layers detect objects. In a language model, early layers track syntax and adjacency, deeper layers track meaning and relationships. Nobody programmed those features; training discovered them.\n\n**Training** adjusts the weights to reduce a loss function, using gradient descent: measure the error, compute which direction each weight should move, take a small step, repeat over millions of examples. Backpropagation is the efficient bookkeeping that assigns blame to each weight. **Learning rate** is the step size: too large and training diverges, too small and it never finishes.\n\n**Tokens** are the units a language model reads and writes: roughly four characters of English, so 1,000 tokens ≈ 750 words. Cost, latency and context limits are all measured in tokens.\n\n**Embeddings** are vectors that place items in a space where similar meanings are close together. They are how semantic search works: an embedding of your question is compared to embeddings of your documents, and the nearest ones are retrieved.\n\n**Attention** lets each token weigh every other token in the context when computing its representation. This is the transformer's core idea, and it is why long context is powerful and expensive: attention cost grows with the square of the sequence length.\n\n**The context window** is how much text the model can consider at once. It is not memory: anything outside the window is invisible, and nothing persists between requests unless your application supplies it again.",
          },
          {
            heading: "How generative models make things",
            kind: "paragraph",
            body:
              "**Language models** are trained to predict the next token, and then typically refined by instruction tuning and preference optimisation so that they answer helpfully rather than merely continuing text. Generation is sampling from a probability distribution, which explains their properties precisely: **temperature** controls how adventurous the sampling is (low is repetitive and consistent, high is creative and error-prone); **the same prompt can produce different output**; and **fluency is unrelated to truth**, because the objective rewards plausible continuations, not verified ones.\n\n**Diffusion models** make images by learning to reverse a noising process: they are trained to remove noise from noisy images, and at generation time you start from pure noise and denoise step by step, guided by a text prompt. This is why image generation takes seconds rather than milliseconds — it is an iterative process — and why prompt detail, and a seed for reproducibility, matter.\n\n**Multimodal** models handle text with images, audio or video in the same architecture, which is what makes captioning, document understanding and voice interaction practical.\n\nWhat all of them have in common: they are functions, trained once and called many times, that model *distributions of data*. A distribution can be sampled; it cannot be cross-examined.",
          },
          {
            heading: "Working with models you did not train",
            kind: "paragraph",
            body:
              "**Prompting.** Be specific about the task, the format and the constraints; give an example of a good answer; ask for reasoning where it helps; and specify what to do when the input is out of scope. Treat prompts as code: version them, test them against a fixed set of cases, and change one thing at a time.\n\n**Retrieval-augmented generation (RAG).** Instead of hoping the model remembers your fee structure, store your documents, embed them, retrieve the passages relevant to the question, and instruct the model to answer from those and cite them. RAG is how you give a model knowledge that is current, private and verifiable — and it is the single highest-value pattern for real products. Quality depends on the retrieval (chunking, relevance, coverage) at least as much as on the model.\n\n**Fine-tuning** changes a model's behaviour rather than its knowledge: teaching a house style, a narrow format, or a classification task. It requires a curated dataset, costs money to train and to host, and is often outperformed by a well-built prompt plus retrieval. Reach for it when you have hundreds of good examples, a measurable improvement target and the budget to maintain a second model version.\n\n**Tools and agents.** Give the model functions it may call — look up a customer, check a price, create a ticket — with validation on your side, and limit what each tool can do. The model proposes; your code disposes. Always cap the number of steps, the money spent and the actions allowed, and log every call.\n\n**Evaluation.** Build a test set of 50–200 real cases with expected outcomes, and score every prompt change against it. Add adversarial cases: ambiguous inputs, attempts to extract the system prompt, instructions hidden in retrieved documents (prompt injection), and requests outside the allowed scope. Track accuracy, cost per request and latency percentiles, not just how good an answer feels.\n\n**Cost and latency engineering.** Cache frequent identical requests, use a smaller model for easy cases and escalate the hard ones, stream responses so perceived latency drops, and set hard budgets per user and per day. Model selection is a trade-off between quality, price and speed that should be measured on *your* cases, not chosen from a leaderboard.",
          },
          {
            heading: "Worked example: a support assistant that cites its sources",
            kind: "example",
            body:
              "A training provider wants an assistant that answers questions about fees, schedules and policies. The naive version — a system prompt with the whole policy pasted in — works in a demo and fails in production: outdated text is baked into the prompt, answers cite nothing, and the model invents a fee when the question is slightly unusual.\n\nThe production design has five parts. **Ingestion**: documents are chunked, embedded and stored with source metadata. **Retrieval**: the question is embedded, the top passages are fetched, and a cheap re-ranking step removes irrelevant ones. **Grounding**: the model is instructed to answer only from the retrieved passages, to say \"I could not find this in the policy documents\" when it cannot, and to cite the document and section. **Guardrails**: no fee changes, no medical or legal advice, and a handoff to a human for anything the retriever scores poorly. **Measurement**: a 120-case test set scored on factual accuracy, citation presence and refusal correctness, plus cost and latency tracking.\n\nThe results illustrate the pattern: accuracy on in-scope questions rises from 68% to 94%, invented answers fall to near zero, and the assistant refuses or escalates 11% of questions — a feature, not a failure. The cost is a few cents per conversation, dominated by retrieval and the escalation path rather than the model call.",
            code:
              "ingest    documents → chunk (≈500 tokens, 15% overlap) → embed → vector store\n          + source metadata: {doc, section, updated_at, url}\nretrieve  question → embed → top-k=8 → re-rank → top-3 passages\n\nground    system: \"Answer only from the passages below. If the answer is not\n          present, say you could not find it in the policy documents and offer\n          to connect the learner to the office. Cite [doc §section]. Never\n          invent an amount, a date or a policy.\"\n\nguard     no fee changes · no medical/legal advice · escalate when the best\n          retrieval score is below threshold · cap 5 tool calls and GH₵0.4/turn\n\nmeasure   test set: 120 real questions (60 in-scope, 30 edge, 30 out-of-scope)\n             factual accuracy       68% → 94%   (in-scope)\n             answers with citations  0%  → 100%\n             invented fees           9   → 0\n             correct refusals        41% → 93%   (out-of-scope)\n          cost per conversation ≈ GH₵0.35   p95 latency 2.8 s (streamed)\n\nescalate  11% of questions reach a human — by design, and cheaper than being\n          confidently wrong about money.",
            language: "text",
            codeLabel: "Retrieval, grounding, guardrails, measurement",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Prompting instead of retrieving.** Pasting a document into a prompt works until the document changes; retrieval keeps answers current and citable.\n- **Judging by demo.** Fifty successful questions prove nothing. Build a scored test set, including cases the system should refuse.\n- **Trusting retrieved text.** Documents can contain instructions (prompt injection); treat retrieved content as data, never as instructions, and validate tool calls on your side.\n- **Fine-tuning to add facts.** Fine-tuning teaches style and format; facts change and belong in retrieval. Fine-tuning for knowledge also makes updates require retraining.\n- **No cost ceiling.** Streaming, retries and long contexts can multiply a bill quietly. Set per-user and per-day caps, and alert at a fraction of them.\n- **Letting the model take irreversible actions.** Refunds, deletions and messages sent on behalf of the business need human confirmation or a very tightly scoped tool, no matter how good the model is.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Technique", "Changes", "Cost", "Use when"],
              ["Prompting", "Instructions and format for a request", "Free", "Almost always — the first thing to do"],
              ["Few-shot examples", "Behaviour on a narrow task", "Tokens per request", "The format is easy to show and hard to describe"],
              ["RAG", "Knowledge: current, private, citable", "Embedding, storage, retrieval, extra tokens", "Answers must be accurate, sourced and current"],
              ["Fine-tuning", "Style, format, narrow classification", "Dataset curation, training, hosted model upkeep", "Hundreds of examples and a measurable gain over prompting"],
              ["Tools / agents", "Actions the model can take", "Orchestration, validation, monitoring", "The task requires data or effects beyond text"],
              ["Distillation to a small model", "Cost and latency at similar quality", "Engineering effort and evaluation", "Volume is high and the task is narrow and stable"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Neural networks are weighted sums with non-linearities, stacked into layers that learn their own representations; transformers add attention, which is why context is powerful and quadratic; generative models sample from distributions, which explains both their fluency and their unreliability. Building on them is an engineering discipline: retrieve rather than hope, ground and cite, guard and validate, measure on a real test set, and cap cost and actions. Understanding this much is what separates using a model from depending on one.",
          },
        ],
        keyPoints: [
          "Explain what a neuron, a layer, an embedding, attention and a token are, and what training adjusts.",
          "Describe how language and diffusion models generate output, and why the same prompt varies.",
          "Choose between prompting, retrieval, fine-tuning and tools for a given requirement.",
          "Design a grounded assistant that cites sources, refuses correctly and escalates.",
          "Measure accuracy, cost and latency on a fixed test set, and cap spend and actions.",
        ],
        exercises: [
          "Explain in one paragraph each how a language model and a diffusion model produce their output, and why one is instant and the other iterative.",
          "Take a question your organisation answers often. Write a prompt that answers it, then a retrieval design that answers it from source documents with citations.",
          "Build a 20-case test set (including out-of-scope questions) for any chatbot you can access, and score it. Report the accuracy and the refusals.",
          "Attempt to make a model invent a fee or a policy by asking an unusual question, then rewrite the prompt so it refuses instead.",
          "Estimate the cost of serving 10,000 support conversations a month with retrieval, at two model sizes and two context lengths.",
        ],
        challenge:
          "Build a small grounded assistant over documents you own: ingestion with chunking and metadata, retrieval with re-ranking, a grounded prompt with citation and refusal instructions, guardrails on cost and actions, and a scored test set of at least 40 cases including adversarial ones. Report accuracy, citation rate, correct-refusal rate, cost per conversation and p95 latency — and write down the two cases where it is still unreliable.",
      }),

      lesson({
        id: "ethics-and-deploying-ai-responsibly",
        title: "Ethics, risk and deploying AI responsibly",
        summary:
          "An AI system that works is not yet an AI system that is acceptable. This lesson covers the harms that are specific to machine learning — bias against groups, privacy loss, opaque decisions, confident errors and environmental cost — the practices that reduce them (data governance, documentation, human review, explainability, evaluation per subgroup), and how the regulatory picture in Ghana and internationally is shaping what teams must be able to show about a model that affects people.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "AI systems are now used for credit decisions, hiring screens, medical triage, exam marking and benefit eligibility — decisions that change lives. The difference between a toy and a system that affects people is accountability: somebody must be able to explain what it does, show what it does badly, and be answerable when it is wrong. That is a professional obligation as much as a legal one.",
          },
          {
            heading: "Definition: the specific harms, and the practices that address them",
            kind: "definition",
            body:
              "**Bias and discrimination.** A model learns from historical data and history contains discrimination: who was offered credit, who was hired, who was stopped by police, whose complaint was escalated. Learned patterns therefore reproduce and can amplify those outcomes — sometimes through a proxy variable such as postcode or device type. Harm is not evenly distributed: it concentrates on the groups least represented in the data, whose errors nobody notices because nobody measures them.\n\n**Privacy.** Training data can be memorised and regurgitated; models can be attacked to reveal whether a specific person was in the training set; aggregated data can be re-identified by joining it with another dataset. Personal data used for training carries obligations under the Data Protection Act 2012 (Act 843) in Ghana — purpose limitation, lawful basis, security, and rights of access and correction.\n\n**Opacity and accountability.** A decision nobody can explain is a decision nobody can contest. Explanations can be approximate and still valuable: which features mattered most, what would have to change for a different outcome, and what a human reviewer should look at.\n\n**Autonomy and manipulation.** Generated text, images and voices can mislead at scale — deepfakes, fabricated quotes, synthetic reviews, impersonation. Systems designed to maximise engagement can also cause harm without anyone intending it.\n\n**Error at scale.** A 3% error rate on a million decisions is 30,000 people affected. Automation makes small per-case failures systematic, so the questions that matter are who detects the failure, how it is corrected, and how quickly.\n\n**Environmental and economic cost.** Training and inference consume energy and water; the largest models are out of reach for most institutions, which concentrates capability. Efficiency is a legitimate design goal: smaller models, caching, and retrieval instead of longer contexts.\n\nThe practices that address these harms are unglamorous and well established: **documentation** (what the model is for, what data it saw, what it must not be used for — model cards and datasheets serve this), **per-subgroup evaluation** (accuracy for each relevant group, not just the average), **human review** for consequential decisions, **appeal paths** so an affected person can contest an outcome, **data governance** with retention limits and legal basis, **accessibility** so the interface works for everybody, and **incident processes** for when the system misbehaves in production.",
          },
          {
            heading: "The regulatory picture, in outline",
            kind: "paragraph",
            body:
              "Three layers apply to teams working from Ghana.\n\n**Data protection.** Ghana's Data Protection Act (Act 843) governs the processing of personal data: purpose limitation, security safeguards, rights of data subjects, and restrictions on transfers abroad. A model trained on personal data is processing personal data, and automated decisions about individuals raise questions of transparency and the right to object.\n\n**Cybersecurity.** The Cybersecurity Act 2020 (Act 1038) establishes the Cyber Security Authority and a framework for protecting critical information infrastructure, with obligations that reach organisations operating essential services.\n\n**Sector and international rules.** Financial services, health and telecommunications have their own regulators and their own expectations about automated decisions. Where a product serves users in the European Union, the GDPR's rules on automated decision-making and its right to an explanation apply regardless of where the developer sits — which is why teams often build to the stricter standard deliberately.\n\nThe practical translation: keep a record of what data you used, why you were entitled to use it, how long you keep it, who can see it, what the model decides, how a person can challenge a decision, and who is accountable. None of that requires a legal team; it requires writing things down before the question is asked.",
          },
          {
            heading: "Worked example: a credit-scoring model, reviewed properly",
            kind: "example",
            body:
              "A lender wants to use a model to pre-screen loan applications. The model performs well on average (AUC 0.78) and the team is ready to ship. A responsible review changes the plan in four ways.\n\n**Per-subgroup evaluation.** Accuracy is measured separately for gender, age band, region and loan size. It reveals that recall for applicants under 25 is 0.61 against 0.79 for everyone else: young applicants with good creditworthiness are being rejected more often. That is a harm, and it is invisible in the average.\n\n**Proxy features.** `residential_postcode` and `device_type` are strong predictors and correlate closely with income and with region. Their inclusion hard-codes historical exclusion: a neighbourhood that was under-served by banks looks risky because it was under-served. Both are removed, at a cost of a few points of AUC that the team accepts.\n\n**Explainability and contestability.** Every declined applicant receives the three factors that mattered most and a route to a human review. The model is therefore chosen partly for how explainable it is, which is a legitimate engineering constraint — a slightly less accurate logistic model that can explain itself is better than an unexplainable one for a consequential decision.\n\n**Governance.** The model is documented with its intended use, its training data window, its measured subgroup performance and its known limitations. It is reviewed quarterly, monitored for drift, and it never makes the final decision: it produces a recommendation with a value, and a human or a policy rule makes the call. The audit trail records the model version, the inputs and the outcome for each decision, because a decision that cannot be reconstructed cannot be defended.",
            code:
              "Model card (extract)\n\nIntended use     Pre-screen consumer loan applications for a human reviewer.\n                 Not to be used as the final decision, for collections, or for\n                 any product other than the personal loan in scope.\nTraining data    18 months of applications (n = 43 100), Jul 2024 – Dec 2025.\n                 Known gap: applicants under 25 are 6% of the data.\nMetrics (test, time-split)\n                 overall           AUC 0.76  ·  recall 0.79  ·  precision 0.71\n                 under 25          recall 0.61  ← measured, monitored, flagged\n                 by region         no material difference after feature removal\nFeatures removed  postcode, device type   (proxy discrimination risk)\nExplainability   top three contributing factors surfaced to the applicant\n                 and to the reviewer; reason text in plain language\nHuman review     every decline and every borderline score (0.45–0.55)\nAppeal           applicant may request review; median resolution 3 working days\nMonitoring       monthly drift on inputs; quarterly subgroup performance;\n                 alert if recall for any subgroup falls 5 points below baseline\nGovernance       model version, inputs and outcome logged per decision;\n                 owner: Head of Credit   ·   review cadence: quarterly",
            language: "text",
            codeLabel: "What \"we can show what it does and who is accountable\" looks like",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"The model has no group data, so it cannot discriminate.\"** Proxies do the work: postcode, device, school and shopping behaviour all correlate with protected characteristics.\n- **\"Removing the sensitive column fixes fairness.\"** Removing a column does not remove the pattern, and can make measurement of harm impossible. Keep the data for honest auditing, exclude it from the model.\n- **\"We will add explainability later.\"** Explainability constrains model choice; deciding it late means rebuilding the system rather than reporting on it.\n- **\"Accuracy is high, so it is fine.\"** An average hides the group where it fails. Per-subgroup measurement is the only defence.\n- **\"The AI decides.\"** Accountability cannot be delegated to software. A named human or rule remains responsible for consequential outcomes, and a path to contest them must exist.\n- **\"Consent covers everything.\"** For many uses — employment, credit, public services — consent is not an appropriate basis; lawful basis, necessity and purpose limitation are the analysis that matters.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Harm", "How it happens", "Control that reduces it", "Evidence to keep"],
              ["Bias against a group", "Historical data plus proxy features", "Per-subgroup evaluation, proxy review, human review", "Subgroup metrics per model version"],
              ["Privacy loss", "Personal data in training or logs", "Minimisation, retention limits, lawful basis, access controls", "Data inventory, retention schedule, requests handled"],
              ["Unaccountable decisions", "Opacity, no appeal path", "Explainable model choice, reason reporting, human review", "Model card, decision log, appeal records"],
              ["Error at scale", "Automation multiplies a small error rate", "Sampling audits, monitoring, fast rollback", "Drift and error dashboards, incident reviews"],
              ["Synthetic deception", "Generated text, images, voice", "Disclosure, provenance signals, verification workflows", "Disclosure policy, content provenance metadata"],
              ["Cost and exclusion", "Only the largest organisations can train", "Smaller models, retrieval, efficiency as a goal", "Cost per decision, energy or spend tracking"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Responsible AI is ordinary engineering discipline applied where the stakes are people: measure performance per subgroup, remove proxy features, choose models you can explain, keep a human accountable for consequential decisions, give affected people a way to contest an outcome, govern the data you used, and document what the system is and is not for. Regulations in Ghana and abroad are converging on exactly those expectations, so the practical advice is the same whether the motivation is ethics, law or long-term product quality.",
          },
        ],
        keyPoints: [
          "Name the harms specific to machine learning and explain how each arises from data or deployment.",
          "Measure performance per subgroup and explain why averages hide harm.",
          "Identify proxy variables that reproduce historical discrimination.",
          "Design human review, explanation and appeal paths for consequential decisions.",
          "Document a model's intended use, data, limitations and monitoring, and state the obligations from Ghana's Data Protection Act.",
        ],
        exercises: [
          "Take any model described in a public article and write down what could go wrong for the least-represented group in its data.",
          "Build a 10-row dataset with a proxy variable, remove it, and show whether the model's decisions about a protected group change.",
          "Write a model card for a model you have trained, including intended use, known gaps and who is accountable.",
          "Design an appeal path for an automated decision you use or rely on: who reviews it, how quickly, and what evidence they see.",
          "Map one of your own data flows against the principles of the Data Protection Act: purpose, lawful basis, retention, security and subject rights.",
        ],
        challenge:
          "Conduct a responsible-deployment review for one system you have built, or a real one you can study: the decisions it affects, who bears the harms, per-subgroup results, proxy features and what you removed, the explanation a person receives, the appeal path, the data governance, the monitoring, and the named owner. Present it as a two-page review with recommendations — and state honestly which recommendation you would refuse to ship without.",
      }),
    ]
  ),
];
