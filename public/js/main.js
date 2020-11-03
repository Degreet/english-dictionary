document.querySelectorAll(".toRegBtn").forEach(btn => btn.onclick = () => {
  auth.hidden = true
  main.hidden = true
  reg.hidden = false
})

document.querySelectorAll(".toAuthBtn").forEach(btn => btn.onclick = () => {
  auth.hidden = false
  main.hidden = true
  reg.hidden = true
})