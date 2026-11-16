// Event listeners
document.querySelector("#zip").addEventListener("change", displayCity);
document.querySelector("#state").addEventListener("change", displayCounties);
document.querySelector("#username").addEventListener("change", checkUsername);
document.querySelector("#password").addEventListener("click", displaySuggestedPassword);
document.querySelector("#signupForm").addEventListener("submit", validateForm);

// Rubric #6: call the function directly (no event listener)
loadStates();

// Rubric #1 and #2: city, latitude, longitude, plus "Zip code not found"
async function displayCity() {
  let zipCode = document.querySelector("#zip").value;
  let zipError = document.querySelector("#zipError");
  let city = document.querySelector("#city");
  let latitude = document.querySelector("#latitude");
  let longitude = document.querySelector("#longitude");

  zipError.textContent = "";

  try {
    let url = `https://csumb.space/api/geo/cityInfoAPI.php?zip=${encodeURIComponent(zipCode)}`;
    let response = await fetch(url);
    let data = await response.json();

    // The API returns false when the zip code is not found
    if (data === false) {
      zipError.textContent = "Zip code not found";
      zipError.style.color = "red";
      city.textContent = "";
      latitude.textContent = "";
      longitude.textContent = "";
      return;
    }

    city.textContent = data.city;
    latitude.textContent = data.latitude;
    longitude.textContent = data.longitude;
  } catch (error) {
    zipError.textContent = "Unable to retrieve city";
    zipError.style.color = "red";
    console.error(error);
  }
}

// Rubric #6: list of all US states
async function loadStates() {
  let stateMenu = document.querySelector("#state");
  stateMenu.textContent = "";

  let defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select One";
  stateMenu.appendChild(defaultOption);

  try {
    let url = "https://csumb.space/api/geo/statesAPI.php";
    let response = await fetch(url);
    let data = await response.json();

    for (let item of data) {
      let option = document.createElement("option");
      option.value = item.usps;
      option.textContent = item.state;
      stateMenu.appendChild(option);
    }
  } catch (error) {
    console.error(error);
    stateMenu.textContent = "";
    let errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.textContent = "Unable to load states";
    stateMenu.appendChild(errorOption);
  }
}

// Rubric #3: counties update when a state is selected
async function displayCounties() {
  let state = document.querySelector("#state").value;
  let countyMenu = document.querySelector("#county");
  countyMenu.textContent = "";

  if (state === "") {
    return;
  }

  try {
    let url = `https://csumb.space/api/geo/countyListAPI.php?state=${state}`;
    let response = await fetch(url);
    let data = await response.json();

    let defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select One";
    countyMenu.appendChild(defaultOption);

    for (let item of data) {
      let option = document.createElement("option");
      option.value = item.county;
      option.textContent = item.county;
      countyMenu.appendChild(option);
    }
  } catch (error) {
    console.error(error);
    let errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.textContent = "Unable to load counties";
    countyMenu.appendChild(errorOption);
  }
}

// Rubric #4: color-coded username availability
async function checkUsername() {
  let username = document.querySelector("#username").value;
  let usernameError = document.querySelector("#usernameError");

  if (username.length === 0) {
    usernameError.textContent = "Username required";
    usernameError.style.color = "red";
    return false;
  }

  try {
    let url = `https://csumb.space/api/usernamesAPI.php?username=${encodeURIComponent(username)}`;
    let response = await fetch(url);
    let data = await response.json();

    if (data.available) {
      usernameError.textContent = "Username available!";
      usernameError.style.color = "green";
      return true;
    } else {
      usernameError.textContent = "Username taken";
      usernameError.style.color = "red";
      return false;
    }
  } catch (error) {
    console.error(error);
    usernameError.textContent = "Unable to check username";
    usernameError.style.color = "red";
    return false;
  }
}

// Rubric #5: suggested password shown when the password box is clicked
async function displaySuggestedPassword() {
  let suggestedPwd = document.querySelector("#suggestedPwd");

  try {
    let url = "https://csumb.space/api/suggestedPassword.php?length=8";
    let response = await fetch(url);
    let data = await response.json();
    suggestedPwd.textContent = `Suggested: ${data.password}`;
    suggestedPwd.style.color = "#0d6efd";
  } catch (error) {
    console.error(error);
    suggestedPwd.textContent = "";
  }
}

async function validateForm(event) {
  event.preventDefault();
  let isValid = true;

  // Username validation
  let usernameAvailable = await checkUsername();
  if (usernameAvailable === false) {
    isValid = false;
  }

  // Password validation
  let password = document.querySelector("#password").value;
  let passwordAgain = document.querySelector("#passwordAgain").value;
  let passwordError = document.querySelector("#passwordError");
  passwordError.textContent = "";
  passwordError.style.color = "red";

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters";
    isValid = false;
  } else if (password !== passwordAgain) {
    passwordError.textContent = "Passwords do not match";
    isValid = false;
  }

  if (isValid) {
    document.querySelector("#signupForm").submit();
  }
}