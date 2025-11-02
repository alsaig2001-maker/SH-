onst karats = [
{ karat: 9, ratio: 9/24 }
];


const METALS_API_KEY = 'YOUR_METALS_API_KEY';
const goldChartCtx = document.getElementById('goldChart').getContext('2d');
let goldChart = null;
let lastPrice24Local = null;


async function requestNotificationPermission() {
if ('Notification' in window && Notification.permission !== 'granted') {
await Notification.requestPermission();
}
}
requestNotificationPermission();


document.getElementById('calculateBtn').addEventListener('click', async () => {
const country = document.getElementById('country').value;
const weight = parseFloat(document.getElementById('weight').value) || 1;
const currencySymbol = country;
const resultsDiv = document.getElementById('results');
resultsDiv.innerHTML = 'جاري جلب الأسعار...';
try {
const latestRes = await fetch(`https://metals-api.com/api/latest?access_key=${METALS_API_KEY}&base=USD&symbols=XAU`);
const latestData = await latestRes.json();
if (!latestData.success) throw new Error('Failed to fetch latest gold price');
const price24USD = latestData.rates.XAU;


const exchangeRes = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${country}`);
const exchangeData = await exchangeRes.json();
const rate = exchangeData.rates[country];
if (!rate) throw new Error('Failed to fetch exchange rate');


const price24Local = price24USD * rate;


const changeThreshold = 0.02;
if (lastPrice24Local !== null) {
const diff = Math.abs(price24Local - lastPrice24Local) / lastPrice24Local;
if (diff >= changeThreshold && Notification.permission === 'granted') {
new Notification('تنبيه الذهب', { body: `سعر غرام الذهب 24 قيراط تغير أكثر من 2%! السعر الحالي: ${price24Local.toFixed(2)} ${currencySymbol}`, icon: '/icon-192.png' });
}
}
lastPrice24Local = price24Local;


resultsDiv.innerHTML = '';
karats.forEach(item => {
const price = (price24Local * item.ratio * weight).toFixed(2);
const row = document.createElement('div');
row.classList.add('result-row');
row.innerHTML = `<span>${item.karat} قيراط</span><span>${price} ${currencySymbol}</span>`;
resultsDiv.appendChild(row);
});


const endDateObj = new Date();
endDateObj.setDate(endDateObj.getDate() - 1);
const endDate = endDateObj.toISOString().split('T')[0];
const startDateObj = new Date();
startDateObj.setDate(startDateObj.getDate() - 7);
const startDate = startDateObj.toISOString().split('T')[0];


const histRes = await fetch(`https://metals-api.com/api/timeseries?access_key=${METALS_API_KEY}&base=USD&symbols=XAU&start_date=${startDate}&end_date=${endDate}`);
const histData = await histRes.json();
if (!histData.success) throw new Error('Failed to fetch historical gold data');


const dates = [];
const prices = [];
Object.keys(histData.rates).forEach(dateStr => {
dates.push(dateStr);
const usdRate = histData.rates[dateStr].XAU;
const localRate = usdRate * rate;
prices.push(localRate.toFixed(2));
});


if (goldChart) goldChart.destroy();
goldChart = new Chart(goldChartCtx, { type: 'line', data: { labels: dates, datasets: [{ label: `سعر غرام الذهب 24 قيراط (${currencySymbol})`, data: prices, borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.2)', tension: 0.3, fill: true }] }, options: { responsive: true, plugins: { legend: { labels: { color: '#FFD700' } } }, scales: { x: { ticks: { color: '#FFD700' }, grid: { color: '#444' } }, y: { ticks: { color: '#FFD700' }, grid: { color: '#444' } } } } });


} catch (err) {
console.error(err);
resultsDiv.innerHTML = 'حدث خطأ في جلب الأسعار. حاول لاحقاً.';
}
});