// Application State
const transactions = JSON.parse(localStorage.getItem("transactions")) || []
let currency = localStorage.getItem("currency") || "$"
let isDarkMode = localStorage.getItem("darkMode") !== "false"
let monthlyBudget = Number.parseFloat(localStorage.getItem("monthlyBudget")) || 5000
let incomeGoal = Number.parseFloat(localStorage.getItem("incomeGoal")) || 10000

// DOM Elements
const sections = document.querySelectorAll(".content-section")
const navButtons = document.querySelectorAll(".nav-btn")
const transactionForm = document.getElementById("transaction-form")
const transactionsBody = document.getElementById("transactions-body")
const themeToggle = document.getElementById("theme-toggle")
const themeToggleHeader = document.getElementById("theme-toggle-header")
const currencySelector = document.getElementById("currency-selector")
const monthlyBudgetInput = document.getElementById("monthly-budget")
const incomeGoalInput = document.getElementById("income-goal")
const clearAllBtn = document.getElementById("clear-all-btn")

function updateUI() {
  updateBalance()
  renderTransactions()
  updateCharts()
  updateQuickStats()
  updateProgressBars()
}

function updateBalance() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const balance = income - expenses

  console.log("[v0] Calculating balance:", { income, expenses, balance })

  animateValue("total-balance", 0, balance, 1500, true)

  setTimeout(() => {
    document.getElementById("total-income").textContent =
      `${currency}${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, 200)

  setTimeout(() => {
    document.getElementById("total-expenses").textContent =
      `${currency}${expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, 400)
}

function animateValue(id, start, end, duration, addCurrency = false) {
  const obj = document.getElementById(id)
  if (!obj) return

  let startTimestamp = null
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp
    const progress = Math.min((timestamp - startTimestamp) / duration, 1)

    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    const current = Math.floor(easeOutQuart * (end - start) + start)

    if (addCurrency) {
      obj.textContent = `${currency}${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      obj.textContent = current.toLocaleString()
    }

    if (progress < 1) {
      window.requestAnimationFrame(step)
    }
  }
  window.requestAnimationFrame(step)
}

function updateQuickStats() {
  const today = new Date().toISOString().split("T")[0]
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const todaySpending = transactions
    .filter((t) => t.type === "expense" && t.date === today)
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const weekSpending = transactions
    .filter((t) => t.type === "expense" && t.date >= oneWeekAgo)
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const todayEl = document.getElementById("today-spending")
  const weekEl = document.getElementById("week-spending")

  if (todayEl) todayEl.textContent = `${currency}${todaySpending.toFixed(0)}`
  if (weekEl) weekEl.textContent = `${currency}${weekSpending.toFixed(0)}`
}

function updateProgressBars() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0)

  const incomeProgress = Math.min((income / incomeGoal) * 100, 100)
  const expenseProgress = Math.min((expenses / monthlyBudget) * 100, 100)

  const incomeProgressEl = document.getElementById("income-progress")
  const expenseProgressEl = document.getElementById("expense-progress")
  const incomeLabelEl = document.getElementById("income-label")
  const expenseLabelEl = document.getElementById("expense-label")

  if (incomeProgressEl) {
    setTimeout(() => {
      incomeProgressEl.style.width = `${incomeProgress}%`
    }, 100)
  }

  if (expenseProgressEl) {
    setTimeout(() => {
      expenseProgressEl.style.width = `${expenseProgress}%`
    }, 200)
  }

  if (incomeLabelEl) {
    incomeLabelEl.textContent = `${incomeProgress.toFixed(1)}% of goal (${currency}${incomeGoal.toLocaleString()})`
  }

  if (expenseLabelEl) {
    expenseLabelEl.textContent = `${expenseProgress.toFixed(1)}% of budget (${currency}${monthlyBudget.toLocaleString()})`
  }
}

function renderTransactions() {
  transactionsBody.innerHTML = ""

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
  const recent = sorted.slice(0, 10)

  recent.forEach((t, index) => {
    const row = document.createElement("tr")
    row.style.opacity = "0"
    row.style.transform = "translateY(10px)"
    row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.category}</td>
            <td>${currency}${Number.parseFloat(t.amount).toFixed(2)}</td>
            <td class="type-${t.type}">${t.type.toUpperCase()}</td>
            <td><button class="delete-btn" data-id="${t.id}">✕</button></td>
        `
    transactionsBody.appendChild(row)

    setTimeout(() => {
      row.style.transition = "opacity 0.3s ease, transform 0.3s ease"
      row.style.opacity = "1"
      row.style.transform = "translateY(0)"
    }, index * 50)
  })

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.target.getAttribute("data-id"))
      deleteTransaction(id)
    })
  })
}

function deleteTransaction(id) {
  const index = transactions.findIndex((t) => t.id === id)
  if (index !== -1) {
    transactions.splice(index, 1)
    localStorage.setItem("transactions", JSON.stringify(transactions))
    updateUI()
  }
}

function updateCharts() {
  const chartContainer = document.getElementById("category-chart")
  const summaryList = document.getElementById("monthly-summary-list")

  chartContainer.innerHTML = ""
  summaryList.innerHTML = ""

  const expensesByCategory = {}
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number.parseFloat(t.amount)
    })

  const categories = Object.keys(expensesByCategory)
  const maxAmount = Math.max(...Object.values(expensesByCategory), 0) || 1

  categories.forEach((cat, index) => {
    const amount = expensesByCategory[cat]
    const heightPercent = (amount / maxAmount) * 100

    const barWrapper = document.createElement("div")
    barWrapper.className = "chart-bar-wrapper"
    barWrapper.style.opacity = "0"
    barWrapper.innerHTML = `
            <div class="chart-bar" style="height: 0%; transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s">
                <span class="chart-value">${currency}${amount.toFixed(0)}</span>
            </div>
            <span class="chart-label" title="${cat}">${cat}</span>
        `
    chartContainer.appendChild(barWrapper)

    setTimeout(() => {
      barWrapper.style.transition = "opacity 0.5s ease"
      barWrapper.style.opacity = "1"
      const bar = barWrapper.querySelector(".chart-bar")
      bar.style.height = `${heightPercent}%`
    }, index * 100)

    const summaryItem = document.createElement("div")
    summaryItem.className = "summary-item"
    summaryItem.innerHTML = `
      <div class="summary-item-header">
        <span>${cat}</span>
        <span class="summary-amount">${currency}${amount.toFixed(2)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(amount / maxAmount) * 100}%; transition: width 0.8s ease ${index * 0.1}s"></div>
      </div>
    `
    summaryList.appendChild(summaryItem)
  })

  if (categories.length === 0) {
    chartContainer.innerHTML =
      '<p style="align-self: center; width: 100%; text-align: center; color: var(--muted);">No expense data available yet</p>'
  }
}

// Event Listeners
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetSection = btn.getAttribute("data-section")

    navButtons.forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")

    sections.forEach((s) => {
      s.classList.remove("active")
      if (s.id === targetSection) {
        s.classList.add("active")
      }
    })

    if (targetSection === "analytics") updateCharts()
  })
})

transactionForm.addEventListener("submit", (e) => {
  e.preventDefault()

  const newTransaction = {
    id: Date.now(),
    amount: document.getElementById("amount").value,
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
  }

  transactions.push(newTransaction)
  localStorage.setItem("transactions", JSON.stringify(transactions))

  transactionForm.reset()
  document.getElementById("date").valueAsDate = new Date()
  updateUI()

  document.querySelector('[data-section="dashboard"]').click()
})

function toggleTheme() {
  isDarkMode = !isDarkMode
  document.body.classList.toggle("dark-mode", isDarkMode)
  document.body.classList.toggle("light-mode", !isDarkMode)
  const text = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
  const icon = isDarkMode ? "🌙" : "☀️"

  if (themeToggle) themeToggle.textContent = text
  if (themeToggleHeader) themeToggleHeader.textContent = icon

  localStorage.setItem("darkMode", isDarkMode)
  console.log("[v0] Theme toggled:", isDarkMode ? "dark" : "light")
}

if (themeToggle) themeToggle.addEventListener("click", toggleTheme)
if (themeToggleHeader) themeToggleHeader.addEventListener("click", toggleTheme)

currencySelector.addEventListener("change", (e) => {
  currency = e.target.value
  localStorage.setItem("currency", currency)
  updateUI()
})

if (monthlyBudgetInput) {
  monthlyBudgetInput.value = monthlyBudget
  monthlyBudgetInput.addEventListener("change", (e) => {
    monthlyBudget = Number.parseFloat(e.target.value) || 5000
    localStorage.setItem("monthlyBudget", monthlyBudget)
    updateProgressBars()
  })
}

if (incomeGoalInput) {
  incomeGoalInput.value = incomeGoal
  incomeGoalInput.addEventListener("change", (e) => {
    incomeGoal = Number.parseFloat(e.target.value) || 10000
    localStorage.setItem("incomeGoal", incomeGoal)
    updateProgressBars()
  })
}

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all transactions? This cannot be undone.")) {
      transactions.length = 0
      localStorage.setItem("transactions", JSON.stringify(transactions))
      updateUI()
    }
  })
}

// Initialization
function init() {
  document.getElementById("date").valueAsDate = new Date()

  document.body.className = isDarkMode ? "dark-mode" : "light-mode"
  const text = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
  const icon = isDarkMode ? "🌙" : "☀️"

  if (themeToggle) themeToggle.textContent = text
  if (themeToggleHeader) themeToggleHeader.textContent = icon

  currencySelector.value = currency

  updateUI()
}

init()
