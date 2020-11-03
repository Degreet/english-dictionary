addEventListener("load", () => {
  document.querySelectorAll("button[redirect]").forEach(btn => {
    btn.addEventListener("click", () => {
      location.href = btn.getAttribute("redirect")
    })
  })
})