// Global variables for charts
let emiBreakdownChart = null;
let paymentTimelineChart = null;

// Data storage
let prepayments = [];
let prepaymentCounter = 0;
let savedScenarios = JSON.parse(localStorage.getItem('loanScenarios') || '[]');

// DOM elements
const elements = {
    // Basic inputs
    startDate: document.getElementById('startDate'),
    loanAmount: document.getElementById('loanAmount'),
    loanAmountDisplay: document.getElementById('loanAmountDisplay'),
    interestRate: document.getElementById('interestRate'),
    tenure: document.getElementById('tenure'),
    extraEMI: document.getElementById('extraEMI'),
    
    // Disbursement controls
    addDisbursement: document.getElementById('addDisbursement'),
    clearDisbursements: document.getElementById('clearDisbursements'),
    disbursementList: document.getElementById('disbursementList'),
    totalDisbursed: document.getElementById('totalDisbursed'),
    remainingAmount: document.getElementById('remainingAmount'),
    
    // Prepayment controls
    addPrepayment: document.getElementById('addPrepayment'),
    clearPrepayments: document.getElementById('clearPrepayments'),
    prepaymentList: document.getElementById('prepaymentList'),
    totalPrepayments: document.getElementById('totalPrepayments'),
    prepaymentCount: document.getElementById('prepaymentCount'),
    
    // Save/Load controls
    scenarioName: document.getElementById('scenarioName'),
    saveScenario: document.getElementById('saveScenario'),
    loadScenario: document.getElementById('loadScenario'),
    exportData: document.getElementById('exportData'),
    importData: document.getElementById('importData'),
    importBtn: document.getElementById('importBtn'),
    savedScenarios: document.getElementById('savedScenarios'),
    
    // Comparison controls
    compareRate1: document.getElementById('compareRate1'),
    compareRate2: document.getElementById('compareRate2'),
    compareRate3: document.getElementById('compareRate3'),
    compareRates: document.getElementById('compareRates'),
    comparisonResults: document.getElementById('comparisonResults'),
    
    // Results elements
    calculateLoan: document.getElementById('calculateLoan'),
    resultsSection: document.getElementById('resultsSection'),
    currentEMI: document.getElementById('currentEMI'),
    totalInterest: document.getElementById('totalInterest'),
    totalPayment: document.getElementById('totalPayment'),
    loanDuration: document.getElementById('loanDuration'),
    completionDate: document.getElementById('completionDate'),
    interestSaved: document.getElementById('interestSaved'),
    paymentScheduleTable: document.getElementById('paymentScheduleTable').getElementsByTagName('tbody')[0]
};

// Disbursement data
let disbursements = [];
let disbursementCounter = 0;

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number);
}

function formatMonthYear(monthNumber, startDate) {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + monthNumber);
    return start.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function formatLoanAmountDisplay(amount) {
    const crores = amount / 10000000; // 1 crore = 10,000,000
    if (crores >= 1) {
        return `₹${crores.toFixed(2)} Crore`;
    } else {
        const lakhs = amount / 100000; // 1 lakh = 100,000
        return `₹${lakhs.toFixed(2)} Lakh`;
    }
}

function updateLoanAmountDisplay() {
    const amount = parseFloat(elements.loanAmount.value) || 0;
    elements.loanAmountDisplay.textContent = formatLoanAmountDisplay(amount);
}

function calculateYearsMonths(totalMonths) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return `${years} years ${months} months`;
}

function calculateEMI(principal, rate, tenure) {
    const monthlyRate = rate / (12 * 100);
    const numPayments = tenure * 12;
    
    if (monthlyRate === 0) {
        return principal / numPayments;
    }
    
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / 
                (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return emi;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Save/Load functionality
function saveCurrentScenario() {
    const scenarioName = elements.scenarioName.value.trim();
    if (!scenarioName) {
        showToast('Please enter a scenario name', 'error');
        return;
    }
    
    const scenario = {
        name: scenarioName,
        timestamp: new Date().toISOString(),
        data: {
            startDate: elements.startDate.value,
            loanAmount: elements.loanAmount.value,
            interestRate: elements.interestRate.value,
            tenure: elements.tenure.value,
            extraEMI: elements.extraEMI.value,
            disbursements: getDisbursements(),
            prepayments: getPrepayments()
        }
    };
    
    // Check if scenario exists and replace it
    const existingIndex = savedScenarios.findIndex(s => s.name === scenarioName);
    if (existingIndex >= 0) {
        savedScenarios[existingIndex] = scenario;
    } else {
        savedScenarios.push(scenario);
    }
    
    localStorage.setItem('loanScenarios', JSON.stringify(savedScenarios));
    updateSavedScenariosList();
    showToast(`Scenario "${scenarioName}" saved successfully!`, 'success');
}

function loadScenario(scenarioName) {
    const scenario = savedScenarios.find(s => s.name === scenarioName);
    if (!scenario) {
        showToast('Scenario not found', 'error');
        return;
    }
    
    const data = scenario.data;
    elements.startDate.value = data.startDate || '2026-01';
    elements.loanAmount.value = data.loanAmount || 15500000;
    elements.interestRate.value = data.interestRate || 7.65;
    elements.tenure.value = data.tenure || 25;
    elements.extraEMI.value = data.extraEMI || 0;
    elements.scenarioName.value = scenario.name;
    
    // Clear and load disbursements
    clearAllDisbursements();
    if (data.disbursements) {
        data.disbursements.forEach(d => {
            addDisbursementRow();
            const items = document.querySelectorAll('.disbursement-item');
            const lastItem = items[items.length - 1];
            lastItem.querySelector('.disbursement-month').value = d.month;
            lastItem.querySelector('.disbursement-amount').value = d.amount;
            const percentage = ((d.amount / parseFloat(elements.loanAmount.value)) * 100).toFixed(2);
            lastItem.querySelector('.disbursement-percentage').value = percentage;
        });
    }
    
    // Clear and load prepayments
    clearAllPrepayments();
    if (data.prepayments) {
        data.prepayments.forEach(p => {
            addPrepaymentRow();
            const items = document.querySelectorAll('.prepayment-item');
            const lastItem = items[items.length - 1];
            lastItem.querySelector('.prepayment-month').value = p.month;
            lastItem.querySelector('.prepayment-amount').value = p.amount;
        });
    }
    
    updateDisbursementSummary();
    updatePrepaymentSummary();
    showToast(`Scenario "${scenarioName}" loaded successfully!`, 'success');
}

function deleteScenario(scenarioName) {
    savedScenarios = savedScenarios.filter(s => s.name !== scenarioName);
    localStorage.setItem('loanScenarios', JSON.stringify(savedScenarios));
    updateSavedScenariosList();
    showToast(`Scenario "${scenarioName}" deleted`, 'info');
}

function updateSavedScenariosList() {
    elements.savedScenarios.innerHTML = '';
    savedScenarios.forEach(scenario => {
        const div = document.createElement('div');
        div.className = 'scenario-item';
        div.innerHTML = `
            <span class="scenario-name">${scenario.name}</span>
            <div class="scenario-actions">
                <button class="btn-small btn-load" onclick="loadScenario('${scenario.name}')">Load</button>
                <button class="btn-small btn-delete" onclick="deleteScenario('${scenario.name}')">Delete</button>
            </div>
        `;
        elements.savedScenarios.appendChild(div);
    });
}

function exportData() {
    const data = {
        scenarios: savedScenarios,
        currentScenario: {
            name: elements.scenarioName.value,
            data: {
                startDate: elements.startDate.value,
                loanAmount: elements.loanAmount.value,
                interestRate: elements.interestRate.value,
                tenure: elements.tenure.value,
                extraEMI: elements.extraEMI.value,
                disbursements: getDisbursements(),
                prepayments: getPrepayments()
            }
        },
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-calculator-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.scenarios) {
                savedScenarios = data.scenarios;
                localStorage.setItem('loanScenarios', JSON.stringify(savedScenarios));
                updateSavedScenariosList();
            }
            if (data.currentScenario) {
                loadScenario(data.currentScenario.name);
            }
            showToast('Data imported successfully!', 'success');
        } catch (error) {
            showToast('Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Disbursement management
function addDisbursementRow() {
    disbursementCounter++;
    const disbursementDiv = document.createElement('div');
    disbursementDiv.className = 'disbursement-item';
    disbursementDiv.dataset.id = disbursementCounter;
    
    disbursementDiv.innerHTML = `
        <div class="form-group">
            <label>Month</label>
            <input type="number" class="disbursement-month" value="${disbursementCounter}" min="0">
        </div>
        <div class="form-group">
            <label>Amount (₹)</label>
            <input type="number" class="disbursement-amount" value="1550000" step="10000">
        </div>
        <div class="form-group">
            <label>Percentage (%)</label>
            <input type="number" class="disbursement-percentage" value="10" step="0.1" min="0" max="100">
        </div>
        <button type="button" class="btn-remove" onclick="removeDisbursement(${disbursementCounter})">Remove</button>
    `;
    
    elements.disbursementList.appendChild(disbursementDiv);
    
    // Add event listeners for automatic calculations
    const percentageInput = disbursementDiv.querySelector('.disbursement-percentage');
    const amountInput = disbursementDiv.querySelector('.disbursement-amount');
    
    percentageInput.addEventListener('input', function() {
        const totalLoan = parseFloat(elements.loanAmount.value) || 0;
        const percentage = parseFloat(this.value) || 0;
        amountInput.value = Math.round(totalLoan * percentage / 100);
        updateDisbursementSummary();
    });
    
    amountInput.addEventListener('input', function() {
        const totalLoan = parseFloat(elements.loanAmount.value) || 0;
        const amount = parseFloat(this.value) || 0;
        percentageInput.value = ((amount / totalLoan) * 100).toFixed(2);
        updateDisbursementSummary();
    });
    
    updateDisbursementSummary();
}

function removeDisbursement(id) {
    const disbursementItem = document.querySelector(`[data-id="${id}"]`);
    if (disbursementItem) {
        disbursementItem.remove();
        updateDisbursementSummary();
    }
}

function clearAllDisbursements() {
    elements.disbursementList.innerHTML = '';
    disbursementCounter = 0;
    updateDisbursementSummary();
}

function updateDisbursementSummary() {
    const disbursementItems = document.querySelectorAll('.disbursement-item');
    let totalDisbursed = 0;
    
    disbursementItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.disbursement-amount').value) || 0;
        totalDisbursed += amount;
    });
    
    const loanAmount = parseFloat(elements.loanAmount.value) || 0;
    const remaining = loanAmount - totalDisbursed;
    
    elements.totalDisbursed.textContent = formatNumber(totalDisbursed);
    elements.remainingAmount.textContent = formatNumber(remaining);
}

function getDisbursements() {
    const disbursementItems = document.querySelectorAll('.disbursement-item');
    const disbursements = [];
    
    disbursementItems.forEach(item => {
        const month = parseInt(item.querySelector('.disbursement-month').value) || 0;
        const amount = parseFloat(item.querySelector('.disbursement-amount').value) || 0;
        
        disbursements.push({ month, amount });
    });
    
    // Sort by month
    return disbursements.sort((a, b) => a.month - b.month);
}

// Prepayment management
function addPrepaymentRow() {
    prepaymentCounter++;
    const prepaymentDiv = document.createElement('div');
    prepaymentDiv.className = 'prepayment-item';
    prepaymentDiv.dataset.id = prepaymentCounter;
    
    prepaymentDiv.innerHTML = `
        <div class="form-group">
            <label>Month</label>
            <input type="number" class="prepayment-month" value="12" min="1">
        </div>
        <div class="form-group">
            <label>Amount (₹)</label>
            <input type="number" class="prepayment-amount" value="100000" step="10000">
        </div>
        <button type="button" class="btn-remove" onclick="removePrepayment(${prepaymentCounter})">Remove</button>
    `;
    
    elements.prepaymentList.appendChild(prepaymentDiv);
    
    // Add event listener for summary update
    const amountInput = prepaymentDiv.querySelector('.prepayment-amount');
    amountInput.addEventListener('input', updatePrepaymentSummary);
    
    updatePrepaymentSummary();
}

function removePrepayment(id) {
    const prepaymentItem = document.querySelector(`.prepayment-item[data-id="${id}"]`);
    if (prepaymentItem) {
        prepaymentItem.remove();
        updatePrepaymentSummary();
    }
}

function clearAllPrepayments() {
    elements.prepaymentList.innerHTML = '';
    prepaymentCounter = 0;
    updatePrepaymentSummary();
}

function updatePrepaymentSummary() {
    const prepaymentItems = document.querySelectorAll('.prepayment-item');
    let totalPrepayments = 0;
    
    prepaymentItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.prepayment-amount').value) || 0;
        totalPrepayments += amount;
    });
    
    elements.totalPrepayments.textContent = formatNumber(totalPrepayments);
    elements.prepaymentCount.textContent = prepaymentItems.length;
}

function getPrepayments() {
    const prepaymentItems = document.querySelectorAll('.prepayment-item');
    const prepayments = [];
    
    prepaymentItems.forEach(item => {
        const month = parseInt(item.querySelector('.prepayment-month').value) || 0;
        const amount = parseFloat(item.querySelector('.prepayment-amount').value) || 0;
        
        prepayments.push({ month, amount });
    });
    
    // Sort by month
    return prepayments.sort((a, b) => a.month - b.month);
}

// Interest Rate Comparison
function compareInterestRates() {
    const rate1 = parseFloat(elements.compareRate1.value);
    const rate2 = parseFloat(elements.compareRate2.value);
    const rate3 = parseFloat(elements.compareRate3.value);
    const loanAmount = parseFloat(elements.loanAmount.value);
    const tenure = parseInt(elements.tenure.value);
    
    const rates = [
        { rate: rate1, name: `Rate 1 (${rate1}%)` },
        { rate: rate2, name: `Rate 2 (${rate2}%)` },
        { rate: rate3, name: `Rate 3 (${rate3}%)` }
    ];
    
    const results = rates.map(r => {
        const emi = calculateEMI(loanAmount, r.rate, tenure);
        const totalPayment = emi * tenure * 12;
        const totalInterest = totalPayment - loanAmount;
        
        return {
            rate: r.rate,
            name: r.name,
            emi: emi,
            totalInterest: totalInterest,
            totalPayment: totalPayment,
            duration: `${tenure} years`
        };
    });
    
    // Find best rate (lowest total interest)
    const bestRate = results.reduce((best, current) => 
        current.totalInterest < best.totalInterest ? current : best
    );
    
    // Update comparison table
    const tbody = document.querySelector('#comparisonTable tbody');
    tbody.innerHTML = '';
    
    results.forEach(result => {
        const row = document.createElement('tr');
        if (result.rate === bestRate.rate) {
            row.className = 'best-rate';
        }
        
        row.innerHTML = `
            <td>${result.name}</td>
            <td class="currency">${formatCurrency(result.emi)}</td>
            <td class="currency">${formatCurrency(result.totalInterest)}</td>
            <td class="currency">${formatCurrency(result.totalPayment)}</td>
            <td>${result.duration}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    elements.comparisonResults.style.display = 'block';
}

// Loan calculation functions
function calculateProgressiveLoan() {
    const loanAmount = parseFloat(elements.loanAmount.value);
    const annualRate = parseFloat(elements.interestRate.value);
    const tenureYears = parseInt(elements.tenure.value);
    const extraEMI = parseFloat(elements.extraEMI.value) || 0;
    const startDate = elements.startDate.value;
    
    const monthlyRate = annualRate / (12 * 100);
    const originalTotalMonths = tenureYears * 12;
    
    const disbursements = getDisbursements();
    const prepayments = getPrepayments();
    
    if (disbursements.length === 0) {
        alert('Please add at least one disbursement to calculate the loan schedule.');
        return null;
    }
    
    let schedule = [];
    let currentPrincipal = 0;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let currentEMI = 0;
    let lastDisbursementMonth = -1;
    
    // Find the maximum month that has any activity (disbursements or prepayments)
    const maxActivityMonth = Math.max(
        disbursements.length > 0 ? Math.max(...disbursements.map(d => d.month)) : 0,
        prepayments.length > 0 ? Math.max(...prepayments.map(p => p.month)) : 0,
        originalTotalMonths
    );
    
    for (let month = 0; month <= maxActivityMonth + 12; month++) { // Add buffer months
        let disbursedThisMonth = 0;
        let prepaymentThisMonth = 0;
        
        // Check for disbursements in this month
        disbursements.forEach(disbursement => {
            if (disbursement.month === month) {
                disbursedThisMonth += disbursement.amount;
                currentPrincipal += disbursement.amount;
            }
        });
        
        // Check for prepayments in this month
        prepayments.forEach(prepayment => {
            if (prepayment.month === month) {
                prepaymentThisMonth += prepayment.amount;
            }
        });
        
        // Handle initial month (month 0)
        if (month === 0) {
            // If there's a disbursement in month 0, calculate initial EMI
            if (disbursedThisMonth > 0) {
                currentEMI = calculateEMI(currentPrincipal, annualRate, tenureYears);
                lastDisbursementMonth = 0;
            }
            
            schedule.push({
                month: 0,
                date: formatMonthYear(0, startDate),
                disbursement: disbursedThisMonth,
                prepayment: prepaymentThisMonth,
                emi: 0,
                interest: 0,
                principal: 0,
                balance: currentPrincipal,
                cumulativeInterest: 0
            });
            continue;
        }
        
        // Skip if no principal balance
        if (currentPrincipal <= 0) {
            break;
        }
        
        // Recalculate EMI only when new disbursement occurs
        if (disbursedThisMonth > 0) {
            // Calculate remaining tenure from original loan start
            const monthsSinceStart = month;
            const remainingOriginalMonths = Math.max(1, originalTotalMonths - monthsSinceStart);
            currentEMI = calculateEMI(currentPrincipal, annualRate, remainingOriginalMonths / 12);
            lastDisbursementMonth = month;
        }
        
        // Skip if no EMI established yet (no disbursements have occurred)
        if (currentEMI === 0) {
            continue;
        }
        
        // Add extra EMI to current EMI
        const totalEMI = currentEMI + extraEMI;
        
        // Calculate interest for this month
        const interestPayment = currentPrincipal * monthlyRate;
        
        // Calculate principal payment from EMI
        let principalFromEMI = totalEMI - interestPayment;
        
        // If balance is less than EMI, pay only the remaining balance
        let actualEMI = totalEMI;
        if (currentPrincipal < totalEMI) {
            actualEMI = currentPrincipal + interestPayment;
            principalFromEMI = currentPrincipal;
        }
        
        // Add prepayment to principal reduction
        let totalPrincipalPayment = principalFromEMI + prepaymentThisMonth;
        
        // Ensure total principal payment doesn't exceed remaining balance
        if (totalPrincipalPayment > currentPrincipal) {
            totalPrincipalPayment = currentPrincipal;
        }
        
        // Update balances
        currentPrincipal -= totalPrincipalPayment;
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += totalPrincipalPayment;
        
        schedule.push({
            month: month,
            date: formatMonthYear(month, startDate),
            disbursement: disbursedThisMonth,
            prepayment: prepaymentThisMonth,
            emi: actualEMI,
            interest: interestPayment,
            principal: totalPrincipalPayment,
            balance: currentPrincipal,
            cumulativeInterest: totalInterestPaid
        });
        
        // Loan is fully paid - break the loop
        if (currentPrincipal <= 1) {
            break;
        }
        
        // Safety check to prevent infinite loops
        if (month > originalTotalMonths + 120) { // 10 extra years buffer
            break;
        }
    }
    
    return {
        schedule: schedule,
        totalInterest: totalInterestPaid,
        totalPayment: loanAmount + totalInterestPaid,
        actualTenure: schedule.length - 1,
        currentEMI: currentEMI + extraEMI,
        startDate: startDate
    };
}

function calculateBaseLoan() {
    const loanAmount = parseFloat(elements.loanAmount.value);
    const annualRate = parseFloat(elements.interestRate.value);
    const tenureYears = parseInt(elements.tenure.value);
    
    const baseEMI = calculateEMI(loanAmount, annualRate, tenureYears);
    const totalPayment = baseEMI * tenureYears * 12;
    const totalInterest = totalPayment - loanAmount;
    
    return {
        emi: baseEMI,
        totalInterest: totalInterest,
        totalPayment: totalPayment,
        tenure: tenureYears * 12
    };
}

// Chart functions
function createEMIBreakdownChart(schedule) {
    const ctx = document.getElementById('emiBreakdownChart').getContext('2d');
    
    if (emiBreakdownChart) {
        emiBreakdownChart.destroy();
    }
    
    const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
    const totalPrincipal = parseFloat(elements.loanAmount.value);
    
    emiBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [totalPrincipal, totalInterest],
                backgroundColor: ['#3498db', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Total Payment Breakdown',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createPaymentTimelineChart(schedule) {
    const ctx = document.getElementById('paymentTimelineChart').getContext('2d');
    
    if (paymentTimelineChart) {
        paymentTimelineChart.destroy();
    }
    
    const months = schedule.slice(1).map(row => row.date);
    const principalData = schedule.slice(1).map(row => row.principal);
    const interestData = schedule.slice(1).map(row => row.interest);
    const balanceData = schedule.slice(1).map(row => row.balance);
    
    paymentTimelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Principal',
                data: principalData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: false,
                yAxisID: 'y'
            }, {
                label: 'Interest',
                data: interestData,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: false,
                yAxisID: 'y'
            }, {
                label: 'Outstanding Balance',
                data: balanceData,
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                fill: false,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Complete Loan Timeline',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        maxTicksLimit: 20
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Payment Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Outstanding Balance (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 100000).toFixed(1) + 'L';
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Table functions
function populatePaymentScheduleTable(schedule) {
    elements.paymentScheduleTable.innerHTML = '';
    
    schedule.forEach(row => {
        const tr = document.createElement('tr');
        
        // Add special styling for disbursement and prepayment rows
        if (row.disbursement > 0) {
            tr.classList.add('disbursement-row');
        }
        if (row.prepayment > 0) {
            tr.classList.add('prepayment-row');
        }
        
        tr.innerHTML = `
            <td>${row.month === 0 ? 'Start' : row.date}</td>
            <td class="currency">${formatCurrency(row.emi)}</td>
            <td class="currency">${formatCurrency(row.principal)}</td>
            <td class="currency">${formatCurrency(row.interest)}</td>
            <td class="currency">${formatCurrency(row.balance)}</td>
            <td class="currency">${row.disbursement > 0 ? formatCurrency(row.disbursement) : '-'}</td>
            <td class="currency">${row.prepayment > 0 ? formatCurrency(row.prepayment) : '-'}</td>
        `;
        
        elements.paymentScheduleTable.appendChild(tr);
    });
}

// Main calculation function
function performLoanCalculation() {
    const container = document.querySelector('.container');
    container.classList.add('loading');
    
    setTimeout(() => {
        const result = calculateProgressiveLoan();
        const baseResult = calculateBaseLoan();
        
        if (!result) {
            container.classList.remove('loading');
            return;
        }
        
        // Calculate completion date
        const startDate = new Date(result.startDate);
        const completionDate = new Date(startDate);
        completionDate.setMonth(completionDate.getMonth() + result.actualTenure);
        
        // Update summary cards
        elements.currentEMI.textContent = formatCurrency(result.currentEMI);
        elements.totalInterest.textContent = formatCurrency(result.totalInterest);
        elements.totalPayment.textContent = formatCurrency(result.totalPayment);
        elements.loanDuration.textContent = calculateYearsMonths(result.actualTenure);
        elements.completionDate.textContent = completionDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
        
        const interestSaved = baseResult.totalInterest - result.totalInterest;
        elements.interestSaved.textContent = formatCurrency(Math.max(0, interestSaved));
        
        // Create charts
        createEMIBreakdownChart(result.schedule);
        createPaymentTimelineChart(result.schedule);
        
        // Populate table
        populatePaymentScheduleTable(result.schedule);
        
        // Show results
        elements.resultsSection.style.display = 'block';
        elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        container.classList.remove('loading');
    }, 500);
}

// Event listeners
elements.addDisbursement.addEventListener('click', addDisbursementRow);
elements.clearDisbursements.addEventListener('click', clearAllDisbursements);
elements.addPrepayment.addEventListener('click', addPrepaymentRow);
elements.clearPrepayments.addEventListener('click', clearAllPrepayments);
elements.calculateLoan.addEventListener('click', performLoanCalculation);

// Save/Load event listeners
elements.saveScenario.addEventListener('click', saveCurrentScenario);
elements.exportData.addEventListener('click', exportData);
elements.importBtn.addEventListener('click', () => elements.importData.click());
elements.importData.addEventListener('change', importData);

// Comparison event listener
elements.compareRates.addEventListener('click', compareInterestRates);

// Store previous loan amount for calculating existing disbursement percentages
let previousLoanAmount = parseFloat(elements.loanAmount.value) || 15500000;

// Update summaries when loan amount changes
elements.loanAmount.addEventListener('input', () => {
    // Update loan amount display
    updateLoanAmountDisplay();
    
    const currentLoanAmount = parseFloat(elements.loanAmount.value) || 0;
    
    // Update individual disbursement amounts
    const disbursementItems = document.querySelectorAll('.disbursement-item');
    disbursementItems.forEach(item => {
        const percentageInput = item.querySelector('.disbursement-percentage');
        const amountInput = item.querySelector('.disbursement-amount');
        const currentAmount = parseFloat(amountInput.value) || 0;
        let percentage = parseFloat(percentageInput.value) || 0;
        
        // If percentage is not set but amount exists, calculate percentage from previous loan amount
        if (percentage === 0 && currentAmount > 0 && previousLoanAmount > 0) {
            percentage = (currentAmount / previousLoanAmount) * 100;
            percentageInput.value = percentage.toFixed(2);
        }
        
        // Update amount based on percentage if percentage exists
        if (percentage > 0 && currentLoanAmount > 0) {
            const newAmount = Math.round(currentLoanAmount * percentage / 100);
            amountInput.value = newAmount;
        }
    });
    
    // Store current loan amount as previous for next change
    previousLoanAmount = currentLoanAmount;
    
    updateDisbursementSummary();
    updatePrepaymentSummary();
});

// Auto-save functionality
let autoSaveTimeout;
function autoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        const data = {
            startDate: elements.startDate.value,
            loanAmount: elements.loanAmount.value,
            interestRate: elements.interestRate.value,
            tenure: elements.tenure.value,
            extraEMI: elements.extraEMI.value,
            disbursements: getDisbursements(),
            prepayments: getPrepayments()
        };
        localStorage.setItem('autoSave', JSON.stringify(data));
    }, 2000);
}

// Add auto-save to all inputs
[elements.startDate, elements.loanAmount, elements.interestRate, elements.tenure, elements.extraEMI].forEach(element => {
    element.addEventListener('input', autoSave);
});

// Initialize with default disbursements and load auto-saved data
document.addEventListener('DOMContentLoaded', function() {
    // Load auto-saved data
    const autoSavedData = localStorage.getItem('autoSave');
    if (autoSavedData) {
        try {
            const data = JSON.parse(autoSavedData);
            elements.startDate.value = data.startDate || '2026-01';
            elements.loanAmount.value = data.loanAmount || 15500000;
            elements.interestRate.value = data.interestRate || 7.65;
            elements.tenure.value = data.tenure || 25;
            elements.extraEMI.value = data.extraEMI || 0;
        } catch (e) {
            console.log('Failed to load auto-saved data');
        }
    }
    
    // Initialize loan amount display
    updateLoanAmountDisplay();
    
    // Add default disbursements if none exist
    if (getDisbursements().length === 0) {
        addDisbursementRow(); // 10% today (month 0)
        addDisbursementRow(); // 10% after 1 month
        
        // Set the disbursement months
        const disbursementItems = document.querySelectorAll('.disbursement-item');
        if (disbursementItems.length >= 2) {
            disbursementItems[0].querySelector('.disbursement-month').value = 0;
            disbursementItems[1].querySelector('.disbursement-month').value = 1;
        }
    }
    
    updateDisbursementSummary();
    updatePrepaymentSummary();
    updateSavedScenariosList();
});

// Make functions global for onclick handlers
window.removeDisbursement = removeDisbursement;
window.removePrepayment = removePrepayment;
window.loadScenario = loadScenario;
window.deleteScenario = deleteScenario;
