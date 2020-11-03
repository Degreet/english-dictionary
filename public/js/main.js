import Toaster from '../Toaster/Toaster.js'

const toaster = new Toaster({
  side: "bottom-right",
  limit: 5,
  life: 5,
  width: 30,
  gap: 10
})

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

regNextBtn.onclick = () => {
  const login = regLoginInp.value
  const pass = regPassInp.value
  const passConf = regPassConfInp.value
  let error

  if (login.length < 3 || login.length > 20)
    error = "Логин должен содержать от 3 до 20 символов"
  else if (pass.length < 8 || pass.length > 32)
    error = "Пароль должен содержать от 8 до 32 символов"
  else if (pass != passConf)
    error = "Введенные пароли не совпадают"

  if (error) {
    toaster.log(error, "error-toast toast")
  } else {
    fetch("/api/reg", {
      method: "POST",
      body: JSON.stringify({ login, pass })
    }).then(resp => resp.json()).then(data => {
      if (data.success) {
        toaster.log("Вы успешно зарегистрировались!", "success-toast toast")
        setTimeout(() => location.href = "/dashboard", 1200)
      } else {
        toaster.log(data.msg, "error-toast toast")
      }
    })
  }
}

authNextBtn.onclick = () => {
  const login = authLoginInp.value
  const pass = authPassInp.value

  fetch("/api/auth", {
    method: "POST",
    body: JSON.stringify({ login, pass })
  }).then(resp => resp.json()).then(data => {
    if (data.success) {
      toaster.log("Вы успешно авторизовались!", "success-toast toast")
      setTimeout(() => location.href = "/dashboard", 1200)
    } else {
      toaster.log(data.msg, "error-toast toast")
    }
  })
}