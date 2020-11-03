document.querySelectorAll(".toRegBtn").forEach(btn => btn.onclick = () => {
  auth.hidden = true
  main.hidden = true
  reg.hidden = false
})