getTripData().then((data) => {
  document.querySelector("h1").textContent = data.title;
  document.getElementById("status").textContent =
    "Scaffold ready — plans coming soon.";
});
