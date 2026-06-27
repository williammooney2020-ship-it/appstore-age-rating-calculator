// App Store Age Rating Calculator — browser-only, no API.
// Based on Apple's App Store rating questionnaire categories and thresholds.

// Each category has levels: none (0), infrequent/mild (1), frequent/intense (2)
// Certain categories at level 2 force 17+
// Certain combos force specific ratings

const CATEGORIES = [
  {
    id: "cartoon_violence",
    label: "Cartoon or Fantasy Violence",
    desc: "Animated violence that is not realistic. Examples: animated characters being hit, cartoon weapons, fantasy battles.",
    examples: [
      "None — no cartoon violence at all",
      "Infrequent/Mild — occasional animated combat, cartoon weapons, minimal consequence",
      "Frequent/Intense — sustained cartoon violence, enemies exploding into cartoon pieces",
    ],
    thresholds: { 0: "4+", 1: "9+", 2: "12+" },
  },
  {
    id: "realistic_violence",
    label: "Realistic Violence",
    desc: "Violence that mimics real-world situations with realistic outcomes. Examples: guns with blood effects, realistic fighting, injury depictions.",
    examples: [
      "None — no realistic violence",
      "Infrequent/Mild — occasional realistic combat with minimal blood or injury effects",
      "Frequent/Intense — sustained realistic violence, gore, detailed injury depictions",
    ],
    thresholds: { 0: "4+", 1: "12+", 2: "17+" },
  },
  {
    id: "profanity",
    label: "Profanity or Crude Humor",
    desc: "Offensive language, crude jokes, toilet humor, or adult-oriented humor.",
    examples: [
      "None — no profanity or crude humor",
      "Infrequent/Mild — occasional mild crude jokes, very mild language",
      "Frequent/Intense — heavy profanity, sustained crude humor",
    ],
    thresholds: { 0: "4+", 1: "9+", 2: "17+" },
  },
  {
    id: "alcohol",
    label: "Alcohol, Tobacco, or Drug Use",
    desc: "References to or depictions of alcohol, tobacco, or recreational drugs. Examples: drinking games, smoking characters, drug use.",
    examples: [
      "None — no references to substances",
      "Infrequent/Mild — occasional references without glorification",
      "Frequent/Intense — frequent depictions, game mechanics around substance use",
    ],
    thresholds: { 0: "4+", 1: "12+", 2: "17+" },
  },
  {
    id: "nudity",
    label: "Nudity or Revealing Clothing",
    desc: "Nudity or suggestive clothing. Examples: semi-nude artwork, revealing outfits, suggestive poses.",
    examples: [
      "None — no nudity or revealing content",
      "Infrequent/Mild — brief or mild nudity, tasteful artwork, modestly revealing outfits",
      "Frequent/Intense — prolonged nudity, suggestive content throughout",
    ],
    thresholds: { 0: "4+", 1: "12+", 2: "17+" },
  },
  {
    id: "sexual",
    label: "Sexual Content or Themes",
    desc: "Explicit or implied sexual content. Examples: descriptions of sexual acts, sexual themes in story, sexual imagery.",
    examples: [
      "None — no sexual content or themes",
      "Infrequent/Mild — romantic themes, brief mild references",
      "Frequent/Intense — explicit sexual content or frequent mature themes",
    ],
    thresholds: { 0: "4+", 1: "17+", 2: "17+" },
  },
  {
    id: "horror",
    label: "Horror or Fear Themes",
    desc: "Content designed to frighten. Examples: jump scares, horror monsters, intense suspense, disturbing imagery.",
    examples: [
      "None — no horror or fear-inducing content",
      "Infrequent/Mild — occasional mild scares, spooky theme, non-graphic horror",
      "Frequent/Intense — sustained horror, graphic disturbing imagery",
    ],
    thresholds: { 0: "4+", 1: "9+", 2: "17+" },
  },
  {
    id: "gambling",
    label: "Gambling or Contests",
    desc: "Simulated gambling, lottery, or contest mechanics. Examples: poker simulation, slot machines, wagering virtual currency.",
    examples: [
      "None — no gambling mechanics",
      "Infrequent/Mild — incidental gambling reference, simulated with no risk",
      "Frequent/Intense — core gambling mechanics, simulated casino",
    ],
    thresholds: { 0: "4+", 1: "12+", 2: "17+" },
  },
  {
    id: "mature_suggestive",
    label: "Mature or Suggestive Themes",
    desc: "Adult topics beyond explicit content. Examples: mature storylines, dark themes, complex moral issues inappropriate for young audiences.",
    examples: [
      "None — no mature themes",
      "Infrequent/Mild — some adult themes not depicted graphically",
      "Frequent/Intense — heavy mature themes throughout",
    ],
    thresholds: { 0: "4+", 1: "17+", 2: "17+" },
  },
  {
    id: "medical",
    label: "Medical or Clinical Content",
    desc: "Detailed medical procedures, clinical anatomy, treatment information. Examples: surgical simulation, clinical anatomy reference.",
    examples: [
      "None — no clinical medical content",
      "Infrequent/Mild — basic health information, non-graphic medical references",
      "Frequent/Intense — detailed clinical procedures, graphic medical imagery",
    ],
    thresholds: { 0: "4+", 1: "9+", 2: "12+" },
  },
];

const SPECIAL_FLAGS = [
  {
    id: "unrestricted_web",
    label: "Unrestricted Web Access",
    desc: "App allows access to any website, including adult content (e.g. a general-purpose browser).",
    rating: "17+",
    note: "Any app with unrestricted web access is automatically rated 17+.",
  },
  {
    id: "location_sharing",
    label: "Location Sharing with Other Users",
    desc: "App enables users to share precise location with other users (e.g. friend-finder apps).",
    rating: "12+",
    note: "Apps sharing user location with others are rated 12+ minimum.",
  },
  {
    id: "user_generated",
    label: "User-Generated Content",
    desc: "App allows users to post text, images, or other content visible to others.",
    rating: "12+",
    note: "Apps with user-generated content visible to others are rated 12+ minimum.",
  },
];

const RATINGS = ["4+", "9+", "12+", "17+"];
const RATING_ORDER = { "4+": 0, "9+": 1, "12+": 2, "17+": 3 };
const RATING_COLOR = { "4+": "#34d399", "9+": "#fbbf24", "12+": "#fb923c", "17+": "#f87171" };

let answers = {}; // category id -> level (0/1/2)
let specialFlags = {};

function buildForm() {
  const cat = document.getElementById("categories");
  cat.innerHTML = "";

  CATEGORIES.forEach(c => {
    const div = document.createElement("div");
    div.className = "cat-card";
    div.innerHTML = `
      <div class="cat-title">${c.label}</div>
      <div class="cat-desc">${c.desc}</div>
      <div class="level-group" id="levels_${c.id}">
        ${c.examples.map((ex, i) => `
          <label class="level-option${answers[c.id] === i ? " selected" : ""}">
            <input type="radio" name="${c.id}" value="${i}" ${answers[c.id] === i ? "checked" : ""}
              onchange="setAnswer('${c.id}', ${i})" />
            <span class="level-num">${["0","1","2"][i]}</span>
            <span class="level-text">${ex}</span>
          </label>`).join("")}
      </div>
    `;
    cat.appendChild(div);
  });

  const sf = document.getElementById("specialFlags");
  sf.innerHTML = "";
  SPECIAL_FLAGS.forEach(f => {
    const label = document.createElement("label");
    label.className = "flag-item" + (specialFlags[f.id] ? " checked" : "");
    label.innerHTML = `
      <input type="checkbox" ${specialFlags[f.id] ? "checked" : ""} onchange="setFlag('${f.id}', this.checked)">
      <div>
        <div class="flag-title">${f.label}</div>
        <div class="flag-desc">${f.desc}</div>
        <div class="flag-note">${f.rating} minimum — ${f.note}</div>
      </div>
    `;
    sf.appendChild(label);
  });
}

function setAnswer(id, level) {
  answers[id] = level;
  const group = document.getElementById(`levels_${id}`);
  group.querySelectorAll(".level-option").forEach((el, i) => {
    el.classList.toggle("selected", i === level);
  });
}

function setFlag(id, checked) {
  specialFlags[id] = checked;
  document.querySelector(`input[onchange="setFlag('${id}', this.checked)"]`)?.closest(".flag-item")?.classList.toggle("checked", checked);
}

function calculate() {
  let maxRating = "4+";
  const reasons = [];

  CATEGORIES.forEach(c => {
    const level = answers[c.id];
    if (level === undefined || level === 0) return;
    const rating = c.thresholds[level];
    if (RATING_ORDER[rating] > RATING_ORDER[maxRating]) {
      maxRating = rating;
    }
    reasons.push({
      category: c.label,
      level: ["None", "Infrequent/Mild", "Frequent/Intense"][level],
      rating,
    });
  });

  SPECIAL_FLAGS.forEach(f => {
    if (!specialFlags[f.id]) return;
    if (RATING_ORDER[f.rating] > RATING_ORDER[maxRating]) {
      maxRating = f.rating;
    }
    reasons.push({ category: f.label, level: "Enabled", rating: f.rating });
  });

  showResult(maxRating, reasons);
}

function showResult(rating, reasons) {
  const color = RATING_COLOR[rating];
  const pct = (RATING_ORDER[rating] / 3) * 100;

  let reasonsHtml = "";
  if (reasons.length === 0) {
    reasonsHtml = `<div class="no-reasons">No content flags set — all categories at "None" and no special flags.</div>`;
  } else {
    reasonsHtml = reasons.map(r => `
      <div class="reason-row">
        <span class="reason-cat">${r.category}</span>
        <span class="reason-level">${r.level}</span>
        <span class="reason-rating" style="color:${RATING_COLOR[r.rating]}">${r.rating}</span>
      </div>`).join("");
  }

  const advice = {
    "4+": "Suitable for all ages. No restrictions — the largest possible audience.",
    "9+": "May contain mild or infrequent cartoon violence, horror, profanity, or medical content. Not suitable for children under 9 without parental guidance.",
    "12+": "May contain realistic violence (infrequent/mild), nudity, alcohol/drug references, gambling, or user-generated content. Not suitable for under 12.",
    "17+": "Contains mature, intense, or explicit content. Requires parental permission on Apple devices. The most restricted category — reconsider if 17+ was unintentional.",
  };

  document.getElementById("resultSection").style.display = "block";
  document.getElementById("resultRating").textContent = rating;
  document.getElementById("resultRating").style.color = color;
  document.getElementById("resultBar").style.width = pct + "%";
  document.getElementById("resultBar").style.background = color;
  document.getElementById("resultAdvice").textContent = advice[rating];
  document.getElementById("reasonsList").innerHTML = reasonsHtml;
  document.getElementById("resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function reset() {
  answers = {};
  specialFlags = {};
  document.getElementById("resultSection").style.display = "none";
  buildForm();
}

document.addEventListener("DOMContentLoaded", buildForm);
