require('c4console')
const { MongoClient, ObjectId } = require("mongodb")
const { createServer } = require('http')
const fs = require('fs'), fsp = fs.promises
const bcrypt = require('bcrypt')
const Cookies = require('cookies')
const dotenv = require('dotenv')
dotenv.config()

const dbName = "english-dict"
const appName = "EnglishDict"

const PORT = process.env.PORT || 3000
const pass = process.env.KEY
const server = createServer(requestHandler)
const uri = `mongodb+srv://Node:${pass}@cluster0-ttfss.mongodb.net/${dbName}?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

async function requestHandler(req, resp) {
  let { url } = req
  const cookies = new Cookies(req, resp)
  resp.setHeader('Content-Type', 'text/html')

  if (url.startsWith('/api/')) {
    url = url.slice(5)

    if (url == "reg") {
      const user = JSON.parse(await streamToString(req))
      const candidate = await getCandidate({ login: user.login })
      const data = {}

      if (candidate) {
        data.success = false
        data.msg = "Такой логин уже занят"
      } else {
        const token = generateToken()

        user.token = token
        user.date = generateDate()
        user.pass = bcrypt.hashSync(user.pass, 10)

        cookies.set("token", token)
        await users.insertOne(user)
        data.success = true
      }

      resp.end(JSON.stringify(data))
    } else if (url == "auth") {
      const user = JSON.parse(await streamToString(req))
      const candidate = await getCandidate({ login: user.login })
      const data = {}

      if (candidate) {
        const checkPass = bcrypt.compareSync(user.pass, candidate.pass)

        if (checkPass) {
          const token = generateToken()

          cookies.set("token", token)
          await users.updateOne({ _id: candidate._id }, { $set: { token } })

          data.success = true
        } else {
          data.success = false
          data.msg = "Неверный пароль"
        }
      } else {
        data.success = false
        data.msg = "Пользователь не найден"
      }

      resp.end(JSON.stringify(data))
    }
  } else if (url == "/dashboard") {
    const candidate = await getCandidate({ cookies })
    let result

    if (candidate) {
      result = await getPage(`${appName} - Личный кабинет`, buildPath("dashboard.html"),
        { path: "dashboard" })
    } else {
      result = "<script>location.href = '/'</script>"
    }

    resp.end(result)
  } else {
    let path = process.cwd() + '/public' + url.replace(/\/$/, '')

    try {
      const target = await fsp.stat(path).catch(_ => fsp.stat(path += '.html'))
      if (target.isDirectory()) path += '/index.html'
      const match = path.match(/\.(\w+)$/), ext = match ? match[1] : 'html'

      if (path.endsWith("/public/index.html")) {
        const candidate = await getCandidate({ cookies })
        let result

        if (candidate) {
          result = `<script>location.href = "/dashboard"</script>`
        } else {
          result = await getPage(`${appName} - Главная`, buildPath("index.html"),
            { path: "main", type: "module" })
        }

        resp.end(result)
      } else {
        fs.createReadStream(path).pipe(resp)
        resp.setHeader('Content-Type', {
          html: 'text/html',
          json: 'application/json',
          css: 'text/css',
          ico: 'image/x-icon',
          jpg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          svg: 'image/svg+xml',
          js: 'application/javascript',
        }[ext])
      }
    } catch {
      resp.end(await getPage(`${appName} - Ошибка №404`, buildPath("errors/404.html")))
    }
  }
}

async function getPage(title, path, script) {
  const [file, body] = await Promise.all([fsp.readFile(path),
  fsp.readFile(buildPath("templates/main.html"))])
  const html = body.toString()
    .replace("PAGE_TITLE", title)
    .replace("PAGE_BODY", file.toString())
    .replace("PAGE_SCRIPT", script ? `<script src="/js/${script.path}.js"
      ${script.type == "module" ? 'type="module"' : ""}></script>` : "")
  return html
}

function buildPath(path) {
  return `${__dirname}/public/${path}`
}

function generateDate() {
  return new Date().toISOString().slice(0, 19).replace("T", " ")
}

async function getCandidate(data) {
  const forSearch = {}

  if (data.cookies) {
    const token = data.cookies.get("token")
    forSearch.token = token
  } else if (data.login) {
    forSearch.login = data.login
  }

  return await users.findOne(forSearch)
}

function streamToString(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

function generateToken() {
  let res = ''
  const chars = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890'
  for (let i = 0; i < 32; i++) res += chars[Math.floor(Math.random() * chars.length)]
  return res
}

client.connect(err => {
  if (err) console.log(err)

  global.users = client.db(dbName).collection("users")

  server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`))
  setTimeout(() => client.close(), 1e9)
})