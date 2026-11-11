document.querySelector("button").addEventListener("click", gradeQuiz);

let score = 0;
let attempts = localStorage.getItem("total_attempts");

if (attempts === null) {
  attempts = 0;
} else {
  attempts = Number(attempts);
}

// Show the attempt count as soon as the page loads
document.querySelector("#totalAttempts").textContent = `Total Attempts: ${attempts}`;

displayChoices(4, ["Maine", "Rhode Island", "Maryland", "Delaware"]);
displayChoices(7, ["Alaska", "Texas", "California", "Montana"]);

function isFormValid() {
  let isValid = true;
  let missing = [];

  // Text/number/select questions that must be answered
  let requiredFields = [1, 2, 5, 6, 8, 10];
  for (let index of requiredFields) {
    if (document.querySelector(`#q${index}`).value.trim() === "") {
      missing.push(index);
    }
  }

  // Radio questions that must be answered
  for (let index of [4, 7]) {
    if (document.querySelector(`input[name=q${index}]:checked`) === null) {
      missing.push(index);
    }
  }

  if (missing.length > 0) {
    isValid = false;
    missing.sort((a, b) => a - b);
    document.querySelector("#validationFdbk").textContent =
      `Please answer question(s): ${missing.join(", ")}`;
  }

  return isValid;
}

function setMarkImage(index, imageName, altText) {
  let markContainer = document.querySelector(`#markImg${index}`);
  markContainer.textContent = "";

  let img = document.createElement("img");
  img.src = `img/${imageName}`;
  img.alt = altText;
  markContainer.appendChild(img);
}

function rightAnswer(index) {
  let feedback = document.querySelector(`#q${index}Feedback`);
  feedback.textContent = "Correct!";
  feedback.className = "feedback bg-success text-white";
  setMarkImage(index, "checkmark.png", "Checkmark");
  score += 10; // 10 questions x 10 points = 100
}

function wrongAnswer(index) {
  let feedback = document.querySelector(`#q${index}Feedback`);
  feedback.textContent = "Incorrect!";
  feedback.className = "feedback bg-danger text-white";
  setMarkImage(index, "xmark.png", "X mark");
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

// Builds radio buttons (with labels) in random order for question `index`
function displayChoices(index, choicesArray) {
  shuffleArray(choicesArray);

  let choicesContainer = document.querySelector(`#q${index}Choices`);
  choicesContainer.textContent = "";

  for (let choice of choicesArray) {
    // ids can't contain spaces, so build a safe one
    let inputId = `q${index}_${choice.replace(/\s+/g, "")}`;

    let wrapper = document.createElement("div");
    wrapper.className = "form-check form-check-inline";

    let input = document.createElement("input");
    input.type = "radio";
    input.name = `q${index}`;
    input.id = inputId;
    input.value = choice;
    input.className = "form-check-input";

    let label = document.createElement("label");
    label.htmlFor = inputId;
    label.textContent = choice;
    label.className = "form-check-label";

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    choicesContainer.appendChild(wrapper);
  }
}

// True if every id in `correctIds` is checked and every id in `wrongIds` is not
function checkboxesMatch(correctIds, wrongIds) {
  for (let id of correctIds) {
    if (!document.querySelector(`#${id}`).checked) return false;
  }
  for (let id of wrongIds) {
    if (document.querySelector(`#${id}`).checked) return false;
  }
  return true;
}

function gradeRadio(index, correctValue) {
  let selected = document.querySelector(`input[name=q${index}]:checked`);
  if (selected !== null && selected.value === correctValue) {
    rightAnswer(index);
  } else {
    wrongAnswer(index);
  }
}

function gradeQuiz() {
  document.querySelector("#validationFdbk").textContent = "";

  if (!isFormValid()) {
    return;
  }

  score = 0;

  // Q1 - text
  let q1Response = document.querySelector("#q1").value.trim().toLowerCase();
  if (q1Response === "sacramento") {
    rightAnswer(1);
  } else {
    wrongAnswer(1);
  }

  // Q2 - dropdown
  if (document.querySelector("#q2").value === "mo") {
    rightAnswer(2);
  } else {
    wrongAnswer(2);
  }

  // Q3 - checkboxes
  if (checkboxesMatch(["Jefferson", "Roosevelt"], ["Jackson", "Franklin"])) {
    rightAnswer(3);
  } else {
    wrongAnswer(3);
  }

  // Q4 - radio
  gradeRadio(4, "Rhode Island");

  // Q5 - text
  let q5Response = document.querySelector("#q5").value.trim().toLowerCase();
  if (q5Response === "austin") {
    rightAnswer(5);
  } else {
    wrongAnswer(5);
  }

  // Q6 - number
  if (Number(document.querySelector("#q6").value) === 50) {
    rightAnswer(6);
  } else {
    wrongAnswer(6);
  }

  // Q7 - radio
  gradeRadio(7, "Alaska");

  // Q8 - dropdown
  if (document.querySelector("#q8").value === "michigan") {
    rightAnswer(8);
  } else {
    wrongAnswer(8);
  }

  // Q9 - checkboxes
  if (checkboxesMatch(
        ["q9California", "q9Arizona", "q9NewMexico", "q9Texas"],
        ["q9Nevada", "q9Oklahoma"])) {
    rightAnswer(9);
  } else {
    wrongAnswer(9);
  }

  // Q10 - text
  let q10Response = document.querySelector("#q10").value.trim().toLowerCase();
  if (q10Response === "chicago") {
    rightAnswer(10);
  } else {
    wrongAnswer(10);
  }

  // Total score
  let totalScore = document.querySelector("#totalScore");
  totalScore.textContent = `Total Score: ${score}`;
  totalScore.className = score > 80 ? "mt-4 text-success" : "mt-4 text-danger";

  // Congratulatory message
  let congrats = document.querySelector("#congratsMsg");
  if (score > 80) {
    congrats.textContent = "Congratulations! Great job on the quiz!";
  } else {
    congrats.textContent = "";
  }

  // Attempts (Web Storage)
  attempts++;
  document.querySelector("#totalAttempts").textContent = `Total Attempts: ${attempts}`;
  localStorage.setItem("total_attempts", attempts);
}