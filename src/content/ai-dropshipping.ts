import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * AI Dropshipping: Build and Run an AI-Powered Store.
 *
 * Six lessons across four modules: finding products with AI, choosing and
 * validating a niche, building the store, writing product pages and ads with
 * AI, and running orders, fulfillment and customer support. The learner ends
 * with a live store and a playbook for running it.
 */

export const AI_DROPSHIPPING_MODULES: CourseModule[] = [
  module(
    "finding-products",
    "01 · Finding products with AI",
    "How to spot products worth selling, read demand signals, and tell a real opportunity from a fad — using AI as a research assistant, not a crystal ball.",
    [
      lesson({
        id: "product-research-ai",
        title: "Product research with AI",
        summary:
          "Most dropshipping stores die because they sell something nobody wants. This lesson shows how to use AI to generate product ideas, check demand signals, study competitors, and build a shortlist worth testing before you spend on ads.",
        sections: [
          {
            heading: "The product is the business",
            body:
              "Dropshipping is simple to describe: you list a product, a customer buys it, and your supplier ships it. You never touch stock. That simplicity is also the trap — because you do not manufacture, warehouse or ship, the only lever you control is *what you sell and how you sell it*. Pick a weak product and no amount of advertising fixes it. Pick a strong one and the rest of the business gets much easier.\n\nAI is a research assistant here, not an oracle. It can suggest products, summarise reviews, draft listings and scan competitors, but it cannot tell you with certainty what will sell. You still test with real traffic and real money.",
          },
          {
            heading: "What AI is good at (and what it is not)",
            body:
              "Use AI for the parts of research that are slow and repetitive:\n\n- Generating product ideas from a niche, a problem or a trend.\n- Reading customer reviews of competing products and pulling out complaints you can fix.\n- Drafting titles, descriptions and ad variants to test.\n- Summarising competitor pricing, shipping times and return policies.\n\nDo not use AI to decide whether a product *will* work. A language model is trained on old text and has no access to this week's auction prices, last month's ad costs, or your supplier's actual stock. Treat every AI suggestion as a hypothesis to test, not a decision already made.",
          },
          {
            heading: "Worked example: turning a complaint into a product",
            body:
              "A learner searches \"sneaker reviews\" on a marketplace and asks AI to summarise the one-star reviews. The pattern that comes back: \"comfortable but the laces come undone, and there is nowhere to keep an extra pair.\" That complaint points at a product — no-tie elastic laces sold with a small carrying pouch — a cheap, light item with a clear problem it solves. The learner lists it, runs a small ad test, and only orders inventory after three sales come in.",
          },
          {
            heading: "Reading demand signals",
            kind: "definition",
            body:
              "Demand signals tell you whether people are actually looking for a product, not just talking about it:\n\n- **Search volume** for the product name and close variants (rising, flat or falling).\n- **Competitor ads still running** after two to four weeks — ads that persist are usually profitable.\n- **Review volume** on competing listings — steady new reviews mean real sales.\n- **Price band** — a product that sells between $15 and $40 leaves room for ad spend and profit; under $10 rarely covers shipping and ads.\n\nNo single signal decides it. You want several pointing the same way before you list.",
          },
          {
            heading: "Trend versus fad",
            kind: "table",
            rows: [
              ["Signal", "Trend worth building on", "Fad to avoid"],
              ["Search volume", "Grows over months, with seasonal dips", "Spikes for weeks, then collapses"],
              ["Competitors", "Several stores selling it, steadily", "One viral store, then copies everywhere"],
              ["Product use", "Solves a recurring problem", "Novelty with no repeat use"],
              ["Ad lifespan", "Competitor ads run for months", "Ads appear and vanish in days"],
            ],
          },
          {
            heading: "Common mistakes",
            kind: "warning",
            body:
              "- **Selling what you personally like** instead of what the data shows people buy.\n- **Picking a saturated product** because a guru advertised it — by the time you hear about it, ad costs are too high.\n- **Trusting AI's confidence.** The model will sound certain about a product that has never been tested.\n- **Skipping the ad test.** You do not know a product works until people pay for it.",
          },
          {
            heading: "Summary",
            body:
              "Find products with AI, validate them with demand signals, and never list anything you have not tested with a small ad spend. The winning product solves a specific problem, sells in a healthy price band, and has competitors who are still advertising after a month.",
          },
        ],
        keyPoints: [
          "AI generates hypotheses; demand signals validate them.",
          "Look for rising search volume, persistent competitor ads and steady new reviews.",
          "Prefer products in the $15–$40 band that solve a clear problem.",
          "Never trust an AI product suggestion without an ad test.",
        ],
        exercises: [
          "List five product ideas for a niche you choose, with one AI-generated complaint each idea could solve.",
          "For each idea, note search volume trend, competitor ad lifespan and price band.",
          "Pick one idea and write the hypothesis you will test with ads.",
        ],
        challenge:
          "Produce a shortlist of five candidate products. For each: the problem it solves, its price band, one competitor, one demand signal, and the single ad test that would prove or kill it. You do not build a store yet — you only shortlist what is worth testing.",
      }),
    ]
  ),

  module(
    "choosing-niche",
    "02 · Choosing and validating a niche",
    "How to pick a niche, size the opportunity, validate demand with a small test, and decide whether to go broad or niche down.",
    [
      lesson({
        id: "choosing-a-niche",
        title: "Choosing and validating a niche",
        summary:
          "A niche is where a store earns trust. This lesson covers how to pick one, how broad is too broad, how to validate demand before building, and the go/no-go criteria that keep you out of dead products.",
        sections: [
          {
            heading: "Why niches win",
            body:
              "General stores sell everything to nobody. Niche stores sell specific things to specific people, which means better ads, better product pages and customers who come back. A good niche is narrow enough that you can speak its language, but wide enough to hold several products.\n\nExamples: \"home office for remote workers\" is a niche. \"gadgets\" is not. \"cat accessories for indoor cats\" is a niche; \"pet supplies\" is not.",
          },
          {
            heading: "Broad, niche, micro-niche",
            kind: "table",
            rows: [
              ["Scope", "Example", "Risk"],
              ["Broad", "Electronics", "Too much competition, no identity"],
              ["Niche", "Home office gear", "Audience you can reach, several products"],
              ["Micro-niche", "Ergonomic gear for laptop users in small spaces", "Small audience; hard to grow beyond a few products"],
            ],
          },
          {
            heading: "Validating before you build",
            body:
              "Do not build a store to find out if anyone wants your product. Validate first:\n\n1. Search for the product and its close variants; note whether competitor ads are still running after two weeks.\n2. Check competitor listings for review velocity — new reviews each week means real sales.\n3. Run a tiny ad test (as little as a few dollars a day) to a simple landing page, not a full store.\n4. Measure cost per click and any sign-ups or pre-orders.\n\nIf nobody clicks, the product or the offer is wrong — change it before you spend more.",
          },
          {
            heading: "Worked example: go / no-go",
            body:
              "A learner considers phone cases. AI confirms huge search volume — and huge competition, with established brands advertising constantly. Cost per click would be too high. She pivots to \"cable organisers for remote workers\": lower search volume, fewer advertisers, a clear problem (tangled cables under a desk), and a cheap, light product. A small ad test brings sign-ups at an acceptable cost. Go.",
          },
          {
            heading: "Common mistakes",
            kind: "warning",
            body:
              "- **Choosing a niche because it is trendy**, not because you can reach the audience.\n- **Going micro-niche** so narrow that three products exhaust the catalogue.\n- **Validating with friends and family** instead of strangers who might actually pay.\n- **Building the store before the ad test works.**",
          },
          {
            heading: "Summary",
            body:
              "Pick a niche you can reach and speak to, validate demand with real clicks before you build, and set go/no-go criteria so you abandon weak products fast rather than sinking time into them.",
          },
        ],
        keyPoints: [
          "A niche is narrow enough to own, wide enough to stock several products.",
          "Validate with ads and review velocity, not opinions.",
          "Set go/no-go criteria before you spend.",
          "Kill weak products early.",
        ],
        exercises: [
          "Define your niche: audience, problem, and why you can reach them.",
          "List three products that fit the niche and one that does not (and why).",
          "Write your go/no-go criteria: the click-through rate, cost per click and pre-order count that decide proceed or abandon.",
        ],
        challenge:
          "Pick one niche, name three products that fit it, and state the go/no-go numbers you will use to decide whether to build the store. If the numbers say no, you pick a different niche — no exceptions.",
      }),
    ]
  ),

  module(
    "building-the-store",
    "03 · Building the store",
    "Choose a platform, connect a supplier, set up the essential pages, and handle the basics — domains, payments, taxes and policies — without over-engineering.",
    [
      lesson({
        id: "setting-up-a-dropshipping-store",
        title: "Setting up your dropshipping store",
        summary:
          "How to choose an ecommerce platform, connect a supplier, configure domains and payments, and publish the pages every store needs — legal, contact, shipping and returns — so you can start taking orders.",
        sections: [
          {
            heading: "Platform choice",
            body:
              "For a first store, use a hosted ecommerce platform (Shopify or similar): it handles the checkout, payments and security, and you can connect a dropshipping supplier with an app. You trade a monthly fee for not managing servers. Self-hosted platforms save that fee but cost time you do not have when you are testing products.\n\nPick the platform whose supplier app works with the products on your shortlist.",
          },
          {
            heading: "Connecting a supplier",
            body:
              "Your supplier holds stock and ships orders. Choose one with:\n\n- Real inventory sync (you do not sell what they do not have).\n- Tracking numbers you can pass to customers.\n- Reasonable shipping times to your customers.\n- A returns process you can actually explain.\n\nOrder one unit yourself before you list anything — check packaging, speed and quality. If you would not receive it happily, your customers will not either.",
          },
          {
            heading: "The pages every store needs",
            body:
              "Publish these before your first ad:\n\n- **Home page:** what you sell and for whom, in one scroll.\n- **Product pages:** one per product (see the next lesson).\n- **About / contact:** a real way to reach you builds trust.\n- **Shipping and delivery:** honest times, costs and where you ship.\n- **Returns and refunds:** what can be returned, in what condition, and how long it takes.\n- **Terms and privacy:** the legal minimum; use a generator and adapt it, do not copy a competitor's.\n\nBe clear that shipping may take days or weeks. Surprise is the biggest source of refunds and chargebacks.",
          },
          {
            heading: "Payments, taxes and basics",
            body:
              "Connect a payment provider your customers actually use — cards and mobile money where relevant. Set taxes correctly for the countries you sell into (you are responsible, even if the platform calculates it). Use your own domain from the start; a free subdomain looks temporary and costs trust.\n\nKeep it simple: one store, one currency to start, one supplier. Complexity is the enemy of testing.",
          },
          {
            heading: "Common mistakes",
            kind: "warning",
            body:
              "- **Picking a supplier without ordering a sample first.**\n- **Hiding shipping times.** Customers forgive slow shipping they were told about; they do not forgive surprise.\n- **Copying another store's legal pages.**\n- **Over-customising the theme before you have a sale.** A plain theme that converts beats a beautiful one that does not.",
          },
          {
            heading: "Summary",
            body:
              "Start on a hosted platform with a supplier you have sampled. Publish the essential pages, be honest about shipping, connect payments and taxes, and use your own domain. Then leave the store alone and move to the pages that actually sell: your product pages.",
          },
        ],
        keyPoints: [
          "Use a hosted platform for your first store.",
          "Order a sample from every supplier before listing.",
          "Publish shipping, returns, contact and legal pages before ads.",
          "Be upfront about delivery times.",
        ],
        exercises: [
          "Choose your platform and supplier, and note the supplier's shipping time and tracking policy.",
          "Order one sample product and record packaging, quality and delivery time.",
          "Draft your shipping, returns and contact pages.",
          "Connect a payment method and your own domain.",
        ],
        challenge:
          "Publish a store with at least one product page (a placeholder is fine), working payments, and shipping, returns and contact pages. The store must be capable of taking an order — even if you have not run ads to it yet.",
      }),
    ]
  ),

  module(
    "product-pages",
    "04 · Product pages that convert",
    "Write titles and descriptions with AI, choose images, set prices, and handle variants — so a visitor who lands on a product page buys instead of leaving.",
    [
      lesson({
        id: "product-pages-that-convert",
        title: "Product pages that convert",
        summary:
          "The product page is your salesperson. Learn to write AI-assisted titles and descriptions, pick and edit images, price for profit, and handle variants and reviews so visitors convert.",
        sections: [
          {
            heading: "What a product page must do",
            body:
              "In a few seconds the visitor must answer: what is this, who is it for, why should I trust it, and what does it cost. Everything on the page answers one of those four questions. Everything else is decoration.\n\nTrust matters most in dropshipping, because the customer is buying from a store they have never heard of. Clear photos, real-sounding reviews, honest shipping times and a visible refund policy do more for conversion than slick design.",
          },
          {
            heading: "Writing copy with AI",
            body:
              "AI is strong at drafting copy, weak at knowing your customer. Use it like this:\n\n- Give it the product, the problem it solves and the audience, then ask for several title options.\n- Ask it to turn a feature list into benefits (\"stainless steel\" → \"will not rust, even by the sink\").\n- Ask it to rewrite competitor descriptions so yours is clearer, not longer.\n\nAlways edit the output. AI copy tends to be enthusiastic and generic; your page should sound specific and believable. Include one concrete detail AI could not invent — a measurement, a material, a use case.\n\nExample structure: title → one-line promise → who it is for → three benefits → how to use it → what is in the box → shipping and returns.",
          },
          {
            heading: "Images and variants",
            body:
              "Use the supplier's images as a starting point, then improve them: remove watermarks, add consistent backgrounds, and show the product in use. If you can, photograph your sample yourself — real photos convert better than stock.\n\nVariants (colour, size) make the page feel complete but add complexity. Start with two or three at most, and make the default choice obvious.",
          },
          {
            heading: "Pricing for profit",
            body:
              "Price = product cost + shipping + ad spend + platform and payment fees + profit. A common starting rule: sell at roughly 2.5–3× your landed cost so ads can work. Under $10 rarely leaves enough margin for advertising; over $100 needs more trust than a new store has.\n\nTest one price at a time. Do not change price and images and copy all at once, or you will not know what moved the number.",
          },
          {
            heading: "Common mistakes",
            kind: "warning",
            body:
              "- **Copying the supplier's description word for word** — it is written to sell to you, not to your customer.\n- **Using only supplier photos** that everyone else uses.\n- **Pricing to compete on cost** instead of on clarity, trust and speed.\n- **Hiding shipping costs until checkout** — that is where carts get abandoned.",
          },
          {
            heading: "Summary",
            body:
              "A product page answers four questions fast, sounds specific rather than enthusiastic, uses real-looking images, prices for profit after all costs, and makes buying the easiest thing on it.",
          },
        ],
        keyPoints: [
          "Answer what, who, why trust and how much in seconds.",
          "Use AI to draft, then edit until it sounds specific and believable.",
          "Show real photos; start with two or three variants.",
          "Price at roughly 2.5–3× landed cost so ads can work.",
        ],
        exercises: [
          "Write one product title and one description using AI, then edit both until they sound specific.",
          "List the four questions your page answers and mark where each is answered.",
          "Choose or shoot images for one product and note the variant structure.",
          "Calculate your price: product cost, shipping, fees, ad budget, profit.",
        ],
        challenge:
          "Publish one complete product page: title, benefit-led description, images, price, variants and visible shipping/returns. Then show it to someone who has never seen it and ask them the four questions — if they cannot answer all four, rewrite until they can.",
      }),
    ]
  ),

  module(
    "marketing-with-ai",
    "05 · Marketing with AI",
    "Run ads and create content with AI: copy, creative ideas, video scripts and email — while keeping the cost per customer below the profit per order.",
    [
      lesson({
        id: "ads-and-content-with-ai",
        title: "Ads and content with AI",
        summary:
          "How to write ad copy and content with AI, structure a simple campaign, test creative, and track whether an ad actually pays for itself — without burning budget on what does not work.",
        sections: [
          {
            heading: "Ads buy attention, not sales",
            body:
              "An ad gets a click. Your page gets the sale. If the page does not convert, more ad spend only loses money faster. Before you advertise, know the page converts — even a few organic sales or sign-ups prove the offer works.\n\nThe metric that matters is cost per acquisition versus profit per order. If an order makes $12 profit and it costs $18 in ads to get one, the product loses money at scale. Scale what pays for itself; kill what does not.",
          },
          {
            heading: "Writing ads with AI",
            body:
              "AI drafts many variants quickly — headlines, body copy, hooks and calls to action. Give it the audience, the problem, the product and one benefit, then ask for five versions in different tones (direct, curious, problem-first). Pick the two that sound like a real person talking, not an advertisement.\n\nTest one variable at a time: same image, different headline; or same headline, different image. Run both with equal small budgets and keep the winner.",
          },
          {
            heading: "Creative and video scripts",
            body:
              "Static images work, and short video often works better. AI can write a 15–30 second script: problem in three seconds, product as the answer, one benefit shown, call to action. You film it yourself with a phone, or use the supplier's footage with a voiceover.\n\nGood creative shows the product being used, not just pictured. A before-and-after (tangled cables → organised desk) beats a studio shot.",
          },
          {
            heading: "Tracking what works",
            body:
              "For every ad set, record: spend, clicks, cost per click, orders, cost per order, profit per order. Review every few days, not every hour — ads need enough data to decide.\n\nRules of thumb:\n- If cost per order is below profit per order, scale the budget slowly.\n- If it is above after a week of testing, turn it off.\n- Never \"let it run to see\" — that is how budgets disappear.",
          },
          {
            heading: "Common mistakes",
            kind: "warning",
            body:
              "- **Scaling before the page converts.**\n- **Testing five things at once** so you learn nothing.\n- **Watching impressions instead of profit.** Impressions are vanity; cost per order is the metric.\n- **Letting a losing ad run** because you already spent on it. Sunk cost is sunk.",
          },
          {
            heading: "Summary",
            body:
              "Use AI to draft ad variants and scripts, test one variable at a time with small budgets, and decide by cost per order versus profit per order. Scale winners fast and kill losers faster.",
          },
        ],
        keyPoints: [
          "The ad gets the click; the page gets the sale.",
          "Test one variable at a time with equal small budgets.",
          "Scale when cost per order is below profit per order.",
          "Kill losing ads quickly — sunk cost is sunk.",
        ],
        exercises: [
          "Write five ad headlines for one product with AI; pick two to test.",
          "Outline a 15-second video script: problem, product, benefit, call to action.",
          "Set your cost-per-order ceiling (profit per order minus a margin).",
          "Plan your review cadence: how often you check spend and orders.",
        ],
        challenge:
          "Run one small ad test for your product with two variants, record cost per order, and decide: scale, tweak, or kill. Document the decision and the numbers behind it.",
      }),
    ]
  ),

  module(
    "running-the-business",
    "06 · Running the business",
    "Orders, fulfillment, tracking and AI-powered customer support — plus refunds, chargebacks and the metrics that tell you whether the store is actually healthy.",
    [
      lesson({
        id: "orders-fulfillment-ai-support",
        title: "Orders, fulfillment and AI support",
        summary:
          "How orders flow from customer to supplier, how to keep customers informed with tracking, how to handle refunds and chargebacks, and how to use AI for customer support without losing the human touch.",
        sections: [
          {
            heading: "The order flow",
            body:
              "Customer buys → you receive payment → you place the order with your supplier → supplier ships → you send the customer tracking. Automate what you can (order forwarding, tracking emails), but check every order manually at first so you catch supplier errors before the customer does.\n\nNever tell the customer a delivery date you have not confirmed with the supplier. Under-promise, over-deliver.",
          },
          {
            heading: "Keeping customers informed",
            body:
              "Most complaints come from silence, not from delay. Send an order confirmation, a shipping confirmation with tracking, and a delivery confirmation. If shipping will be late, tell the customer before they ask.\n\nA shipping page on your store — \"where is my order?\" — answers the question without a support message.",
          },
          {
            heading: "Refunds and chargebacks",
            body:
              "Have a clear refund policy and honour it fast. A refund you give cheerfully costs one order; a chargeback you fight costs fees, time and possibly your payment account. Common causes: item not as described, shipping took too long, the customer does not recognise the charge.\n\nReduce chargebacks with a clear store name on the bank statement, honest shipping times, and easy contact.",
          },
          {
            heading: "Customer support with AI",
            body:
              "AI can draft replies to common questions (where is my order, how do I return, is this in stock) and suggest answers to unusual ones. You review and send.\n\nStart by writing the answers yourself for the five most common questions, then let AI draft variations. Never let AI promise a refund, a delivery date or a discount without your approval — those are business decisions, not copy.\n\nKeep a human reply path. Some customers want a person, and some situations need judgment AI does not have.",
          },
          {
            heading: "The metrics that matter",
            body:
              "Track weekly: orders, revenue, profit after ads and refunds, cost per order, refund rate and support volume. Profit after ads is the only number that tells you whether the store works. Everything else is a symptom.\n\nIf refunds rise, check the product or the shipping time. If support volume rises, check the page clarity. Fix the cause, not the tickets.",
          },
          {
            heading: "Common mistakes",
            kind: "warning",
            body:
              "- **Never communicating**, then wondering why customers charge back.\n- **Promising delivery dates** the supplier cannot meet.\n- **Letting AI approve refunds or discounts** on its own.\n- **Looking at revenue instead of profit.** Revenue with no profit is a hobby that costs money.",
          },
          {
            heading: "Summary",
            body:
              "Automate the order flow but check it early, communicate before customers ask, make refunds easy and fast, use AI to draft support replies while you decide, and manage by profit after ads — not revenue.",
          },
        ],
        keyPoints: [
          "Confirm delivery dates with the supplier before telling the customer.",
          "Communicate shipping proactively; silence causes complaints.",
          "Honour refunds fast; avoid chargebacks.",
          "Use AI to draft support; you decide refunds and discounts.",
          "Manage by profit after ads and refunds.",
        ],
        exercises: [
          "Write your order confirmation, shipping confirmation and delivery confirmation emails.",
          "Draft answers to your five most common support questions.",
          "Set your weekly metrics and where you will record them.",
          "Define when you will refund without asking and when you will investigate first.",
        ],
        challenge:
          "Run the store through one full order cycle: receive an order, place it with the supplier, send tracking, and record profit after ads and any refunds. Write the support replies for your top five questions and state your refund rule. The business is only real once an order has shipped and been paid for.",
      }),
    ]
  ),
];
