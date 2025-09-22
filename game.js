// =======================
// Arabic Challenge Game
// =======================

// قائمة المراحل
const stages = [
  { name: "Stage 1", words: ["ا", "ب", "ت", "ث"], instruction: "قل الحروف" },
  { name: "Stage 2", words: ["بيت", "قلم", "شمس"], instruction: "قل الكلمات" },
  { name: "Stage 3", words: ["بيت كبير", "قلم أحمر"], instruction: "جمل من كلمتين" },
  { name: "Stage 4", words: ["الولد يقرأ كتاب", "الشمس تشرق صباحا"], instruction: "جمل من 3-5 كلمات" },
  { name: "Stage 5", words: ["ذهبت إلى المدرسة مبكرا", "قرأت قصة جميلة جدا"], instruction: "تحدي كبير: 3-5 جمل" }
];

let currentStage = 0;
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

function drawScene(stageIndex) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.fillRect(50, 50, 100, 100);
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(stages[stageIndex].name, 60, 120);
}

// الترجمة البصرية
function showTranslation(word) {
  const translationBox = document.getElementById("translation");
  const translations = {
    "بيت": "House",
    "قلم": "Pen",
    "شمس": "Sun",
    "بيت كبير": "Big house",
    "قلم أحمر": "Red pen",
    "الولد يقرأ كتاب": "The boy reads a book",
    "الشمس تشرق صباحا": "The sun rises in the morning",
    "ذهبت إلى المدرسة مبكرا": "I went to school early",
    "قرأت قصة جميلة جدا": "I read a very beautiful story"
  };
  translationBox.innerText = translations[word] || "";
}

// الأوامر الصوتية
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "ar-SA";
recognition.continuous = true;

recognition.onresult = function(event) {
  const transcript = event.results[event.results.length - 1][0].transcript.trim();
  console.log("Heard:", transcript);
  let stageWords = stages[currentStage].words;
  if (stageWords.includes(transcript)) {
    showTranslation(transcript);
    nextStage();
  }
};

function nextStage() {
  currentStage++;
  if (currentStage >= stages.length) {
    alert("🎉 مبروك! أنهيت اللعبة!");
    currentStage = 0;
  }
  loadStage(currentStage);
}

function loadStage(index) {
  document.getElementById("instructions").innerText = stages[index].instruction;
  drawScene(index);
}

function startGame() {
  loadStage(currentStage);
  recognition.start();
}

startGame();