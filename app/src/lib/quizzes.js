// Motivation Style & Learning Style quizzes.
// Content sourced verbatim from the approved quiz feature spec.

export const CHART_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];

function q(id, text, opts) {
  // opts: array of [styleKey, label] in A–E order
  return { id, text, options: opts.map(([value, label]) => ({ value, label })) };
}

export const QUIZZES = {
  motivation: {
    quizType: "motivation",
    title: "Motivation Style",
    subtitle: "What drives your behavior change, so your coach can lean into what actually works for you.",
    styles: ["achievement", "social", "tangible", "tracking", "autonomy"],
    questions: [
      q("m1", "When you accomplish something difficult, what feels most satisfying?", [
        ["achievement", "Knowing I pushed through and did it"],
        ["social", "Sharing the win with someone who'll appreciate it"],
        ["tangible", "Treating myself to something special"],
        ["tracking", "Seeing the data reflect the effort I put in"],
        ["autonomy", "Doing it entirely on my own terms"],
      ]),
      q("m2", "When you're struggling to stay consistent, what tends to bring you back on track?", [
        ["achievement", "Reminding myself how far I've come"],
        ["social", "Checking in with someone who holds me accountable"],
        ["tangible", "Having a reward waiting at the finish line"],
        ["tracking", "Looking at my logs and charts to refocus"],
        ["autonomy", "Reconnecting with why I personally chose this"],
      ]),
      q("m3", "Imagine you've had a perfect week of healthy eating. How do you want to mark it?", [
        ["achievement", "Reflect on how strong that felt and set a new challenge"],
        ["social", "Tell a friend or get some encouragement from Caroline"],
        ["tangible", "Enjoy a non-food reward I had planned in advance"],
        ["tracking", "Log it, check it off, and update my streak"],
        ["autonomy", "Feel quietly proud — I don't need external recognition"],
      ]),
      q("m4", "Which of these would most likely keep you showing up week after week?", [
        ["achievement", "A sense of mastery — getting better at something meaningful"],
        ["social", "A coach or group who notices and cares"],
        ["tangible", "A gift, experience, or treat tied to my milestones"],
        ["tracking", "Visible progress — numbers, streaks, charts"],
        ["autonomy", "Full ownership of my plan with no pressure from others"],
      ]),
      q("m5", "If you skipped your healthy habits for a few days, what would most motivate you to restart?", [
        ["achievement", "The challenge of getting back to where I was"],
        ["social", "A check-in from someone I don't want to let down"],
        ["tangible", "A fresh incentive or small treat waiting for me"],
        ["tracking", "Seeing a gap in my tracking I want to fill"],
        ["autonomy", "My own quiet decision — no one needed to push me"],
      ]),
      q("m6", "What does a really good day of self-care feel like to you?", [
        ["achievement", "I overcame something hard and feel proud"],
        ["social", "I felt connected and supported by someone"],
        ["tangible", "I rewarded myself in a way that felt special"],
        ["tracking", "I hit all my targets and everything is logged"],
        ["autonomy", "I made choices that were completely mine"],
      ]),
      q("m7", "How do you prefer Caroline to check in between sessions?", [
        ["achievement", "With a challenge or something to push toward"],
        ["social", "Warmly — I want to feel like she's thinking of me"],
        ["tangible", "With a reminder of what I'm working toward"],
        ["tracking", "By reviewing my app data and noting what stands out"],
        ["autonomy", "I'll reach out when I need her — I prefer space"],
      ]),
      q("m8", "Which of these program perks sounds most exciting to you?", [
        ["achievement", "Leveling up to more advanced challenges as I improve"],
        ["social", "Knowing Caroline is personally invested in my journey"],
        ["tangible", "Books, gift certificates, and samples along the way"],
        ["tracking", "The wellness app with streaks, logging, and progress history"],
        ["autonomy", "The flexibility to do this at my own pace, my own way"],
      ]),
      q("m9", "When someone praises your progress, how do you typically feel?", [
        ["achievement", "Motivated to keep going — but I push myself harder"],
        ["social", "Really energized — praise genuinely fuels me"],
        ["tangible", "Good, especially when it comes with something tangible"],
        ["tracking", "Nice, but what I really want is to see it in the data"],
        ["autonomy", "Appreciated, but I don't need it to keep going"],
      ]),
      q("m10", "What would make you most likely to recommend this program to a friend?", [
        ["achievement", "That I achieved something I genuinely didn't think I could"],
        ["social", "That I felt truly seen, heard, and cared for"],
        ["tangible", "That the extras made it feel worth every penny"],
        ["tracking", "That the app and tools helped me stay accountable"],
        ["autonomy", "That I felt in control of my journey the whole time"],
      ]),
    ],
    profiles: {
      achievement: {
        label: "Achievement-driven",
        summary: "This client is driven by mastery and personal challenge. They want to feel like they earned it.",
        tips: [
          "Frame milestones as challenges to conquer, not boxes to check",
          "Acknowledge specific hard things they pushed through",
          "Introduce progressive difficulty — they get bored without a new peak to climb",
          "Use language like \"you're ahead of where most clients are at this stage\"",
          "Avoid over-praising small wins — they may feel patronized",
        ],
      },
      social: {
        label: "Socially motivated",
        summary: "This client is energized by connection, encouragement, and feeling genuinely known by their coach.",
        tips: [
          "Personalize every check-in — remember details and reference them back",
          "Warm, affirming messages between sessions matter a lot",
          "Celebrate their wins publicly (within the coaching relationship)",
          "Ask how they're feeling, not just what they're eating",
          "They may struggle in silence — watch for quiet periods and reach out",
        ],
      },
      tangible: {
        label: "Reward-oriented",
        summary: "This client responds to concrete incentives and feels the program's value through its tangible perks.",
        tips: [
          "Make sure they know about all the included extras upfront",
          "Tie milestones to rewards — even small ones (a tea, a bath product)",
          "Lean into the books, samples, and gift certificates as motivators",
          "Consider a personal \"milestone reward\" they pick at program start",
          "Frame the program investment as something they deserve — not just a cost",
        ],
      },
      tracking: {
        label: "Progress tracker",
        summary: "This client thrives on data, streaks, and visual evidence of progress. The app is their love language.",
        tips: [
          "Celebrate streak milestones enthusiastically — they matter to this client",
          "Review their app data together every session",
          "Help them find meaning in the numbers, not just collect them",
          "When they plateau, help them find a new metric to focus on",
          "A missed log day can feel like failure — normalize imperfection",
        ],
      },
      autonomy: {
        label: "Autonomy-seeker",
        summary: "This client is internally motivated and values being in the driver's seat. They hired a guide, not a boss.",
        tips: [
          "Ask permission before offering advice — \"Would it be helpful if...?\"",
          "Present options rather than prescriptions",
          "Trust their self-knowledge and say so explicitly",
          "Don't check in too frequently — space signals respect",
          "When they do reach out, take it seriously — it means something",
        ],
      },
    },
  },

  learning: {
    quizType: "learning",
    title: "Learning Style",
    subtitle: "How you best absorb new information, so your coach can tailor how she explains things.",
    styles: ["visual", "auditory", "reading", "kinesthetic", "social"],
    questions: [
      q("l1", "When you're learning something new about nutrition or wellness, what helps it click best?", [
        ["visual", "Seeing a chart, graphic, or visual comparison"],
        ["auditory", "Listening to someone explain it or talking it through"],
        ["reading", "Reading an article, handout, or written guide"],
        ["kinesthetic", "Trying it out in my own kitchen or routine"],
        ["social", "Discussing it with a coach, friend, or group"],
      ]),
      q("l2", "When you're trying to remember a new habit or piece of advice, what sticks best?", [
        ["visual", "A visual reminder — photo, infographic, or sticky note with color"],
        ["auditory", "Hearing it out loud — from a podcast, call, or my own voice"],
        ["reading", "Writing it down in my own words"],
        ["kinesthetic", "Physically doing it until it becomes second nature"],
        ["social", "Talking about it with someone so I can process it"],
      ]),
      q("l3", "If Caroline sends you resources between sessions, which would you be most likely to actually use?", [
        ["visual", "An infographic, visual guide, or short video"],
        ["auditory", "A voice memo, podcast recommendation, or audio clip"],
        ["reading", "A written handout, article, or PDF guide"],
        ["kinesthetic", "A hands-on challenge or recipe to actually try"],
        ["social", "A prompt to share back what I noticed or tried"],
      ]),
      q("l4", "How did you learn most of what you already know about healthy eating?", [
        ["visual", "Watching videos, reels, or visual content"],
        ["auditory", "Podcasts, conversations, or listening to experts"],
        ["reading", "Books, blogs, or articles I researched myself"],
        ["kinesthetic", "Experimenting in my own life and noticing what worked"],
        ["social", "Learning alongside others — classes, groups, or friends"],
      ]),
      q("l5", "During a coaching session, what would feel most valuable to you?", [
        ["visual", "Caroline drawing it out, sharing her screen, or using visuals"],
        ["auditory", "A thoughtful conversation where I can ask questions and listen"],
        ["reading", "Working through written notes or a structured plan together"],
        ["kinesthetic", "Problem-solving something I've been actually trying in real life"],
        ["social", "Feeling heard, understood, and like we built something together"],
      ]),
      q("l6", "When you need to make a change to your eating or lifestyle, what approach works best for you?", [
        ["visual", "Seeing a before/after, a meal photo, or a visual plan"],
        ["auditory", "Talking through the \"why\" with someone I trust"],
        ["reading", "Reading about the research or writing out a plan myself"],
        ["kinesthetic", "Just starting — I learn by doing and adjusting as I go"],
        ["social", "Knowing someone else is on the journey with me"],
      ]),
      q("l7", "What kind of homework between sessions would feel most natural for you?", [
        ["visual", "Keeping a photo food journal or using visual tracking tools"],
        ["auditory", "Recording a voice note about how my week felt"],
        ["reading", "Writing in a journal or filling out a reflection worksheet"],
        ["kinesthetic", "Trying one new recipe or habit and reporting back"],
        ["social", "Checking in with Caroline via message — the back-and-forth helps"],
      ]),
      q("l8", "When something isn't working in your wellness routine, what's your instinct?", [
        ["visual", "Look at what it looks like visually — find a new image or layout that inspires me"],
        ["auditory", "Call a friend or talk it through out loud"],
        ["reading", "Research, read, and build a new written plan"],
        ["kinesthetic", "Swap something out and see what happens in my body"],
        ["social", "Reach out to my coach or a community for support"],
      ]),
      q("l9", "Which of these best describes how you took notes in school or at work?", [
        ["visual", "Diagrams, arrows, color coding, and doodles"],
        ["auditory", "I rarely wrote — I just listened carefully"],
        ["reading", "Detailed, organized written notes I could refer back to"],
        ["kinesthetic", "I learned by doing, not by sitting and absorbing"],
        ["social", "Group discussions and study partners were where I actually learned"],
      ]),
      q("l10", "What would make you feel most confident in a new wellness habit?", [
        ["visual", "Seeing visible proof — a photo, a chart, a visible transformation"],
        ["auditory", "Being able to talk about it and articulate why it matters to me"],
        ["reading", "Having a written plan and understanding the evidence behind it"],
        ["kinesthetic", "Feeling it in my body — energy, sleep, strength, mood"],
        ["social", "Having someone check in and affirm that I'm on the right track"],
      ]),
    ],
    profiles: {
      visual: {
        label: "Visual learner",
        summary: "This client learns through what they can see. They need images, color, and visual structure to make information land.",
        tips: [
          "Share infographics, meal photo examples, and visual meal plans",
          "Use screen share during sessions to show charts or simple diagrams",
          "Encourage photo food journaling — it fits how they process information",
          "Color-coded handouts are far more useful than plain text for this client",
          "When explaining a concept, draw it out or find an image that illustrates it",
        ],
      },
      auditory: {
        label: "Auditory learner",
        summary: "This client learns through listening and speaking. The conversation itself is the learning tool.",
        tips: [
          "Explain concepts out loud — don't just send written handouts",
          "Podcast recommendations will be acted on; written articles may not",
          "Encourage them to \"think out loud\" during sessions — this is how they process",
          "Voice memos as check-ins between sessions could work well",
          "Summarize key points verbally at the end of each session, not just in writing",
        ],
      },
      reading: {
        label: "Reading/writing learner",
        summary: "This client trusts written information and learns by reading and writing things out for themselves.",
        tips: [
          "Written handouts, guides, and articles are genuinely valuable to this client",
          "Send resources in writing — they will read them",
          "Encourage journaling as a processing and self-discovery tool",
          "Detailed written session recaps will help them retain and implement",
          "They may ask for research or evidence behind recommendations — have it ready",
        ],
      },
      kinesthetic: {
        label: "Kinesthetic learner",
        summary: "This client learns by doing. Abstract information won't move them — real-life experiments will.",
        tips: [
          "Always connect advice to a specific, concrete action they can try this week",
          "Assign one hands-on \"experiment\" each session — a recipe, a swap, a walk",
          "Avoid lengthy explanations; get to the practical application quickly",
          "Body-based language resonates: energy, sleep quality, how food feels",
          "They may \"know\" something intellectually but need to feel it first to believe it",
        ],
      },
      social: {
        label: "Social learner",
        summary: "This client learns through dialogue and connection. Being heard and processing with others is how it sticks.",
        tips: [
          "Allow plenty of space for open conversation — don't rush to solutions",
          "Check-ins and follow-up messages feel meaningful and help with retention",
          "They might benefit from a group program or community element",
          "Invite them to share back what they tried and how it felt — processing aloud matters",
          "A strong coaching relationship is itself the learning environment for this client",
        ],
      },
    },
  },
};
