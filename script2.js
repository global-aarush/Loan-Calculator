const el = (id) => document.getElementById(id);

const fmt = (v) =>
  v.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

let amortizationData = [];

/* ===============================
   SAVE & LOAD FROM LOCAL STORAGE
================================ */

function saveLastData(data) {
  localStorage.setItem("lastLoanData", JSON.stringify(data));
}

function loadLastData() {
  const saved = localStorage.getItem("lastLoanData");
  if (saved) {
    const data = JSON.parse(saved);

    el("principal").value = data.principal;
    el("rate").value = data.rate;
    el("years").value = data.years;
    el("frequency").value = data.frequency;
    el("procFee").value = data.procFee;

    calculate(); // auto recalc
  }
}

/* ===============================
   MAIN CALCULATION
================================ */

function calculate() {
  const P = parseFloat(el("principal").value) || 0;
  const rate = parseFloat(el("rate").value) || 0;
  const years = parseInt(el("years").value) || 0;
  const freq = parseInt(el("frequency").value) || 12;
  const procFee = parseFloat(el("procFee").value) || 0;

  const n = years * freq;
  const r = (rate / 100) / freq;

  let emi = 0;
  if (r === 0) emi = P / (n || 1);
  else emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const totalPayment = emi * n + procFee;
  const totalInterest = totalPayment - P - procFee;

  el("emi").textContent = fmt(emi);
  el("totalInterest").textContent = fmt(totalInterest);
  el("totalPayment").textContent = fmt(totalPayment);
  el("procAmount").textContent = fmt(procFee);

  el("sumPrincipal").textContent = fmt(P);
  el("sumTenure").textContent = years + " yr";

  buildAmortization(P, r, n, emi);

  // SAVE LAST DATA
  saveLastData({
    principal: P,
    rate: rate,
    years: years,
    frequency: freq,
    procFee: procFee,
  });
}

/* ===============================
   AMORTIZATION
================================ */

function buildAmortization(P, r, n, emi) {
  const body = el("amortBody");
  body.innerHTML = "";
  amortizationData = [];

  let balance = P;
  const rows = Math.min(n, 100);

  for (let i = 1; i <= rows; i++) {
    const interest = balance * r;
    const principal = emi - interest;
    balance -= principal;

    amortizationData.push({
      installment: i,
      payment: Math.round(emi),
      interest: Math.round(interest),
      principal: Math.round(principal),
      balance: Math.max(0, Math.round(balance)),
    });

    body.innerHTML += `
      <tr>
        <td>${i}</td>
        <td>${fmt(emi)}</td>
        <td>${fmt(interest)}</td>
        <td>${fmt(principal)}</td>
        <td>${fmt(Math.max(balance, 0))}</td>
      </tr>
    `;
  }
}

/* ===============================
   CSV DOWNLOAD
================================ */

function downloadCSV() {
  if (amortizationData.length === 0) {
    alert("No data to export");
    return;
  }

  let csv = "Installment,Payment,Interest,Principal,Balance\n";
  amortizationData.forEach((r) => {
    csv += `${r.installment},${r.payment},${r.interest},${r.principal},${r.balance}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "last_loan_data.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* ===============================
   RESET
================================ */

function resetForm() {
  localStorage.removeItem("lastLoanData");
  location.reload();
}

/* ===============================
   EVENTS
================================ */

document.addEventListener("DOMContentLoaded", () => {
  el("calculateBtn").addEventListener("click", calculate);
  el("downloadCsv").addEventListener("click", downloadCSV);
  el("resetBtn").addEventListener("click", resetForm);
  el("showAmort").addEventListener("change", (e) => {
    el("amortization").hidden = !e.target.checked;
  });

  loadLastData(); // 🔥 LOAD LAST SAVED DATA
});
