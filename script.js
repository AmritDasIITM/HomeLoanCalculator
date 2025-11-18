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
    
    // EMI Method controls
    constructionPeriod: document.getElementById('constructionPeriod'),
    emiMethodRadios: document.querySelectorAll('input[name="emiMethod"]'),
    resultsViewRadios: document.querySelectorAll('input[name="resultsView"]'),
    
    // Disbursement controls
    addDisbursement: document.getElementById('addDisbursement'),
    clearDisbursements: document.getElementById('clearDisbursements'),
    disbursementList: document.getElementById('disbursementList'),
    totalDisbursed: document.getElementById('totalDisbursed'),
    remainingAmount: document.getElementById('remainingAmount'),
    
    // Prepayment controls
    basePrepaymentAmount: document.getElementById('basePrepaymentAmount'),
    prepaymentGrowthRate: document.getElementById('prepaymentGrowthRate'),
    prepaymentGrowthType: document.getElementById('prepaymentGrowthType'),
    addPrepayment: document.getElementById('addPrepayment'),
    clearPrepayments: document.getElementById('clearPrepayments'),
    recalculatePrepayments: document.getElementById('recalculatePrepayments'),
    prepaymentList: document.getElementById('prepaymentList'),
    totalPrepayments: document.getElementById('totalPrepayments'),
    prepaymentCount: document.getElementById('prepaymentCount'),
    averagePrepayment: document.getElementById('averagePrepayment'),
    
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
let globalDisbursementMode = 'percentage'; // Global mode state

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
            basePrepaymentAmount: elements.basePrepaymentAmount.value,
            prepaymentGrowthRate: elements.prepaymentGrowthRate.value,
            prepaymentGrowthType: elements.prepaymentGrowthType.value,
            globalDisbursementMode: getGlobalDisbursementMode(),
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
    
    // Load prepayment parameters
    elements.basePrepaymentAmount.value = data.basePrepaymentAmount || 200000;
    elements.prepaymentGrowthRate.value = data.prepaymentGrowthRate || 10;
    elements.prepaymentGrowthType.value = data.prepaymentGrowthType || 'annual';
    
    // Load global disbursement mode if saved
    if (data.globalDisbursementMode) {
        globalDisbursementMode = data.globalDisbursementMode;
        const modeRadio = document.querySelector(`input[name="globalDisbursementMode"][value="${data.globalDisbursementMode}"]`);
        if (modeRadio) {
            modeRadio.checked = true;
        }
        updateModeDescription();
    }
    
    // Clear and load disbursements
    clearAllDisbursements();
    if (data.disbursements) {
        data.disbursements.forEach(d => {
            addDisbursementRow();
            const items = document.querySelectorAll('.disbursement-item');
            const lastItem = items[items.length - 1];
            
            // Set basic values
            lastItem.querySelector('.disbursement-month').value = d.month;
            lastItem.querySelector('.disbursement-amount').value = d.amount;
            lastItem.querySelector('.disbursement-percentage').value = d.percentage || ((d.amount / parseFloat(elements.loanAmount.value)) * 100).toFixed(2);
        });
        
        // Apply global mode to all loaded rows
        applyGlobalModeToAllRows();
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

// Global disbursement mode functions
function getGlobalDisbursementMode() {
    const selectedMode = document.querySelector('input[name="globalDisbursementMode"]:checked');
    return selectedMode ? selectedMode.value : 'percentage';
}

function updateModeDescription() {
    const modeDescription = document.getElementById('modeDescription');
    const mode = getGlobalDisbursementMode();
    
    if (mode === 'percentage') {
        modeDescription.textContent = 'Enter percentages, amounts auto-calculate from loan total';
    } else {
        modeDescription.textContent = 'Enter fixed amounts, percentages shown for reference';
    }
}

function applyGlobalModeToAllRows() {
    const disbursementItems = document.querySelectorAll('.disbursement-item');
    disbursementItems.forEach(item => {
        applyGlobalModeToRow(item);
    });
    updateDisbursementSummary();
}

function applyGlobalModeToRow(disbursementDiv) {
    const mode = getGlobalDisbursementMode();
    const amountInput = disbursementDiv.querySelector('.disbursement-amount');
    const percentageInput = disbursementDiv.querySelector('.disbursement-percentage');
    const amountLabel = disbursementDiv.querySelector('.amount-label');
    const percentageLabel = disbursementDiv.querySelector('.percentage-label');
    
    if (mode === 'percentage') {
        // Percentage mode: Amount is auto-calculated
        amountInput.style.backgroundColor = '#f8f9fa';
        amountInput.style.cursor = 'not-allowed';
        amountInput.readOnly = true;
        percentageInput.readOnly = false;
        percentageInput.style.backgroundColor = '#fff';
        percentageInput.style.cursor = 'text';
        
        amountLabel.textContent = 'Amount (₹) - Auto Calculated';
        percentageLabel.textContent = 'Percentage (%)';
        
        // Recalculate amount based on percentage
        const totalLoan = parseFloat(elements.loanAmount.value) || 0;
        const percentage = parseFloat(percentageInput.value) || 0;
        amountInput.value = Math.round(totalLoan * percentage / 100);
    } else {
        // Fixed amount mode: Percentage is informational
        amountInput.readOnly = false;
        amountInput.style.backgroundColor = '#fff';
        amountInput.style.cursor = 'text';
        percentageInput.style.backgroundColor = '#f8f9fa';
        percentageInput.style.cursor = 'not-allowed';
        percentageInput.readOnly = true;
        
        amountLabel.textContent = 'Amount (₹) - Manual Entry';
        percentageLabel.textContent = 'Percentage (%) - Info Only';
        
        // Update percentage for display
        const totalLoan = parseFloat(elements.loanAmount.value) || 0;
        const amount = parseFloat(amountInput.value) || 0;
        percentageInput.value = totalLoan > 0 ? ((amount / totalLoan) * 100).toFixed(2) : 0;
    }
}

// Disbursement management
function addDisbursementRow() {
    disbursementCounter++;
    const disbursementDiv = document.createElement('div');
    disbursementDiv.className = 'disbursement-item';
    disbursementDiv.dataset.id = disbursementCounter;
    
    // Calculate default values based on global mode
    const defaultPercentage = 10;
    const defaultAmount = Math.round((parseFloat(elements.loanAmount.value) || 15500000) * defaultPercentage / 100);
    
    disbursementDiv.innerHTML = `
        <div class="form-group">
            <label>Month</label>
            <input type="number" class="disbursement-month" value="${disbursementCounter}" min="0">
        </div>
        <div class="form-group">
            <label class="amount-label">Amount (₹)</label>
            <input type="number" class="disbursement-amount" value="${defaultAmount}" step="10000">
        </div>
        <div class="form-group">
            <label class="percentage-label">Percentage (%)</label>
            <input type="number" class="disbursement-percentage" value="${defaultPercentage}" step="0.1" min="0" max="100">
        </div>
        <button type="button" class="btn-remove" onclick="removeDisbursement(${disbursementCounter})">Remove</button>
    `;
    
    elements.disbursementList.appendChild(disbursementDiv);
    
    // Apply global mode to the new row
    applyGlobalModeToRow(disbursementDiv);
    
    // Add event listeners for calculations
    setupDisbursementEventListeners(disbursementDiv);
    
    updateDisbursementSummary();
}

function setupDisbursementEventListeners(disbursementDiv) {
    const percentageInput = disbursementDiv.querySelector('.disbursement-percentage');
    const amountInput = disbursementDiv.querySelector('.disbursement-amount');
    
    // Input handlers based on global mode
    percentageInput.addEventListener('input', function() {
        const mode = getGlobalDisbursementMode();
        if (mode === 'percentage') {
            const totalLoan = parseFloat(elements.loanAmount.value) || 0;
            const percentage = parseFloat(this.value) || 0;
            amountInput.value = Math.round(totalLoan * percentage / 100);
            updateDisbursementSummary();
        }
    });
    
    amountInput.addEventListener('input', function() {
        const mode = getGlobalDisbursementMode();
        if (mode === 'fixed') {
            // In fixed mode, update percentage for display only
            const totalLoan = parseFloat(elements.loanAmount.value) || 0;
            const amount = parseFloat(this.value) || 0;
            percentageInput.value = totalLoan > 0 ? ((amount / totalLoan) * 100).toFixed(2) : 0;
        } else {
            // In percentage mode, sync percentage when amount changes
            const totalLoan = parseFloat(elements.loanAmount.value) || 0;
            const amount = parseFloat(this.value) || 0;
            percentageInput.value = ((amount / totalLoan) * 100).toFixed(2);
        }
        updateDisbursementSummary();
    });
}

function getSelectedDisbursementMode(disbursementDiv) {
    const selectedMode = disbursementDiv.querySelector('.disbursement-mode:checked');
    return selectedMode ? selectedMode.value : 'percentage';
}

function updateDisbursementInputMode(disbursementDiv) {
    const mode = getSelectedDisbursementMode(disbursementDiv);
    const amountInput = disbursementDiv.querySelector('.disbursement-amount');
    const percentageInput = disbursementDiv.querySelector('.disbursement-percentage');
    const amountLabel = disbursementDiv.querySelector('.amount-label');
    const percentageLabel = disbursementDiv.querySelector('.percentage-label');
    
    if (mode === 'percentage') {
        // Percentage mode: Amount is auto-calculated
        amountInput.style.backgroundColor = '#f8f9fa';
        amountInput.style.cursor = 'not-allowed';
        amountInput.readOnly = true;
        percentageInput.readOnly = false;
        percentageInput.style.backgroundColor = '#fff';
        percentageInput.style.cursor = 'text';
        
        amountLabel.textContent = 'Amount (₹) - Auto Calculated';
        percentageLabel.textContent = 'Percentage (%)';
        
        // Recalculate amount based on percentage
        const totalLoan = parseFloat(elements.loanAmount.value) || 0;
        const percentage = parseFloat(percentageInput.value) || 0;
        amountInput.value = Math.round(totalLoan * percentage / 100);
    } else {
        // Fixed amount mode: Percentage is informational
        amountInput.readOnly = false;
        amountInput.style.backgroundColor = '#fff';
        amountInput.style.cursor = 'text';
        percentageInput.style.backgroundColor = '#f8f9fa';
        percentageInput.style.cursor = 'not-allowed';
        percentageInput.readOnly = true;
        
        amountLabel.textContent = 'Amount (₹) - Manual Entry';
        percentageLabel.textContent = 'Percentage (%) - Info Only';
        
        // Update percentage for display
        const totalLoan = parseFloat(elements.loanAmount.value) || 0;
        const amount = parseFloat(amountInput.value) || 0;
        percentageInput.value = totalLoan > 0 ? ((amount / totalLoan) * 100).toFixed(2) : 0;
    }
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
        const mode = getSelectedDisbursementMode(item);
        const percentage = parseFloat(item.querySelector('.disbursement-percentage').value) || 0;
        
        disbursements.push({ month, amount, mode, percentage });
    });
    
    // Sort by month
    return disbursements.sort((a, b) => a.month - b.month);
}

// Enhanced Prepayment Management with Auto-Calculation
function calculatePrepaymentAmount(month, baseAmount, growthRate, growthType) {
    if (month <= 0 || baseAmount <= 0) return baseAmount;
    
    const yearsFromStart = month / 12;
    const annualGrowthDecimal = growthRate / 100;
    
    if (growthType === 'monthly') {
        // Monthly compound: (1 + annual_rate/12)^months
        const monthlyGrowthRate = annualGrowthDecimal / 12;
        return baseAmount * Math.pow(1 + monthlyGrowthRate, month);
    } else {
        // Annual growth: base_amount * (1 + growth_rate)^years
        return baseAmount * Math.pow(1 + annualGrowthDecimal, yearsFromStart);
    }
}

function addPrepaymentRow() {
    prepaymentCounter++;
    const prepaymentDiv = document.createElement('div');
    prepaymentDiv.className = 'prepayment-item';
    prepaymentDiv.dataset.id = prepaymentCounter;
    
    // Calculate initial amount based on current parameters
    const month = 12; // Default month
    const baseAmount = parseFloat(elements.basePrepaymentAmount.value) || 200000;
    const growthRate = parseFloat(elements.prepaymentGrowthRate.value) || 10;
    const growthType = elements.prepaymentGrowthType.value || 'annual';
    const calculatedAmount = calculatePrepaymentAmount(month, baseAmount, growthRate, growthType);
    
    prepaymentDiv.innerHTML = `
        <div class="form-group">
            <label>Month</label>
            <input type="number" class="prepayment-month" value="${month}" min="1">
        </div>
        <div class="form-group">
            <label>Amount (₹) - Auto Calculated</label>
            <input type="number" class="prepayment-amount" value="${Math.round(calculatedAmount)}" step="10000" readonly>
            <small class="calculated-amount-info">Based on base amount and growth rate</small>
        </div>
        <button type="button" class="btn-remove" onclick="removePrepayment(${prepaymentCounter})">Remove</button>
    `;
    
    elements.prepaymentList.appendChild(prepaymentDiv);
    
    // Add event listener for month changes to recalculate amount
    const monthInput = prepaymentDiv.querySelector('.prepayment-month');
    monthInput.addEventListener('input', function() {
        updateSinglePrepaymentAmount(prepaymentDiv);
        updatePrepaymentSummary();
    });
    
    updatePrepaymentSummary();
}

function updateSinglePrepaymentAmount(prepaymentDiv) {
    const monthInput = prepaymentDiv.querySelector('.prepayment-month');
    const amountInput = prepaymentDiv.querySelector('.prepayment-amount');
    
    const month = parseInt(monthInput.value) || 1;
    const baseAmount = parseFloat(elements.basePrepaymentAmount.value) || 200000;
    const growthRate = parseFloat(elements.prepaymentGrowthRate.value) || 10;
    const growthType = elements.prepaymentGrowthType.value || 'annual';
    
    const calculatedAmount = calculatePrepaymentAmount(month, baseAmount, growthRate, growthType);
    amountInput.value = Math.round(calculatedAmount);
}

function recalculateAllPrepaymentAmounts() {
    const prepaymentItems = document.querySelectorAll('.prepayment-item');
    prepaymentItems.forEach(item => {
        updateSinglePrepaymentAmount(item);
    });
    updatePrepaymentSummary();
    showToast('Prepayment amounts recalculated!', 'success');
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
    let count = prepaymentItems.length;
    
    prepaymentItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.prepayment-amount').value) || 0;
        totalPrepayments += amount;
    });
    
    const averagePrepayment = count > 0 ? totalPrepayments / count : 0;
    
    elements.totalPrepayments.textContent = formatNumber(totalPrepayments);
    elements.prepaymentCount.textContent = count;
    elements.averagePrepayment.textContent = formatNumber(Math.round(averagePrepayment));
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

// Helper functions for EMI method selection
function getSelectedEMIMethod() {
    const selectedMethod = document.querySelector('input[name="emiMethod"]:checked');
    return selectedMethod ? selectedMethod.value : 'preemi';
}

function getSelectedResultsView() {
    const selectedView = document.querySelector('input[name="resultsView"]:checked');
    return selectedView ? selectedView.value : 'individual';
}

// Pre-EMI Loan Calculation (Interest-Only during construction)
function calculatePreEMILoan() {
    const loanAmount = parseFloat(elements.loanAmount.value);
    const annualRate = parseFloat(elements.interestRate.value);
    const tenureYears = parseInt(elements.tenure.value);
    const extraEMI = parseFloat(elements.extraEMI.value) || 0;
    const constructionPeriod = parseInt(elements.constructionPeriod.value) || 18;
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
    let fullEMI = 0;
    
    // Calculate full EMI based on total loan amount (for post-construction period)
    fullEMI = calculateEMI(loanAmount, annualRate, tenureYears);
    
    // Find the maximum month that has any activity
    const maxActivityMonth = Math.max(
        disbursements.length > 0 ? Math.max(...disbursements.map(d => d.month)) : 0,
        prepayments.length > 0 ? Math.max(...prepayments.map(p => p.month)) : 0,
        originalTotalMonths + constructionPeriod
    );
    
    for (let month = 0; month <= maxActivityMonth + 12; month++) {
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
            schedule.push({
                month: 0,
                date: formatMonthYear(0, startDate),
                disbursement: disbursedThisMonth,
                prepayment: prepaymentThisMonth,
                emi: 0,
                interest: 0,
                principal: 0,
                balance: currentPrincipal,
                cumulativeInterest: 0,
                isConstruction: true
            });
            continue;
        }
        
        // Skip if no principal balance
        if (currentPrincipal <= 0) {
            break;
        }
        
        let actualEMI = 0;
        let interestPayment = 0;
        let principalPayment = 0;
        
        // During construction period - Pay only interest
        if (month <= constructionPeriod) {
            interestPayment = currentPrincipal * monthlyRate;
            principalPayment = prepaymentThisMonth; // Only prepayments reduce principal
            actualEMI = interestPayment;
            
            schedule.push({
                month: month,
                date: formatMonthYear(month, startDate),
                disbursement: disbursedThisMonth,
                prepayment: prepaymentThisMonth,
                emi: actualEMI,
                interest: interestPayment,
                principal: principalPayment,
                balance: currentPrincipal - principalPayment,
                cumulativeInterest: totalInterestPaid + interestPayment,
                isConstruction: true
            });
        } else {
            // Post-construction - Full EMI
            const totalEMI = fullEMI + extraEMI;
            interestPayment = currentPrincipal * monthlyRate;
            let principalFromEMI = totalEMI - interestPayment;
            
            // Handle final payment
            if (currentPrincipal < totalEMI) {
                actualEMI = currentPrincipal + interestPayment;
                principalFromEMI = currentPrincipal;
            } else {
                actualEMI = totalEMI;
            }
            
            principalPayment = principalFromEMI + prepaymentThisMonth;
            
            // Ensure principal payment doesn't exceed remaining balance
            if (principalPayment > currentPrincipal) {
                principalPayment = currentPrincipal;
            }
            
            schedule.push({
                month: month,
                date: formatMonthYear(month, startDate),
                disbursement: disbursedThisMonth,
                prepayment: prepaymentThisMonth,
                emi: actualEMI,
                interest: interestPayment,
                principal: principalPayment,
                balance: currentPrincipal - principalPayment,
                cumulativeInterest: totalInterestPaid + interestPayment,
                isConstruction: false
            });
        }
        
        // Update totals
        currentPrincipal -= principalPayment;
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;
        
        // Loan is fully paid
        if (currentPrincipal <= 1) {
            break;
        }
        
        // Safety check
        if (month > originalTotalMonths + constructionPeriod + 120) {
            break;
        }
    }
    
    return {
        schedule: schedule,
        totalInterest: totalInterestPaid,
        totalPayment: loanAmount + totalInterestPaid,
        actualTenure: schedule.length - 1,
        currentEMI: fullEMI + extraEMI,
        startDate: startDate,
        method: 'preemi'
    };
}

// Full EMI Loan Calculation (Full EMI from day one)
function calculateFullEMILoan() {
    const loanAmount = parseFloat(elements.loanAmount.value);
    const annualRate = parseFloat(elements.interestRate.value);
    const tenureYears = parseInt(elements.tenure.value);
    const extraEMI = parseFloat(elements.extraEMI.value) || 0;
    const constructionPeriod = parseInt(elements.constructionPeriod.value) || 18;
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
    let outstandingPrincipal = loanAmount; // Start with full loan amount
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let fullEMI = 0;
    
    // Calculate full EMI based on total loan amount
    fullEMI = calculateEMI(loanAmount, annualRate, tenureYears);
    
    // Find the maximum month that has any activity
    const maxActivityMonth = Math.max(
        disbursements.length > 0 ? Math.max(...disbursements.map(d => d.month)) : 0,
        prepayments.length > 0 ? Math.max(...prepayments.map(p => p.month)) : 0,
        originalTotalMonths
    );
    
    for (let month = 0; month <= maxActivityMonth + 12; month++) {
        let disbursedThisMonth = 0;
        let prepaymentThisMonth = 0;
        
        // Check for disbursements in this month
        disbursements.forEach(disbursement => {
            if (disbursement.month === month) {
                disbursedThisMonth += disbursement.amount;
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
            schedule.push({
                month: 0,
                date: formatMonthYear(0, startDate),
                disbursement: disbursedThisMonth,
                prepayment: prepaymentThisMonth,
                emi: 0,
                interest: 0,
                principal: 0,
                balance: outstandingPrincipal,
                cumulativeInterest: 0,
                isConstruction: month <= constructionPeriod
            });
            continue;
        }
        
        // Skip if no outstanding balance
        if (outstandingPrincipal <= 0) {
            break;
        }
        
        // Calculate interest on current outstanding amount
        const interestPayment = outstandingPrincipal * monthlyRate;
        const totalEMI = fullEMI + extraEMI;
        
        let principalFromEMI = totalEMI - interestPayment;
        let actualEMI = totalEMI;
        
        // Handle final payment
        if (outstandingPrincipal < totalEMI) {
            actualEMI = outstandingPrincipal + interestPayment;
            principalFromEMI = outstandingPrincipal;
        }
        
        // Add prepayment to principal reduction
        let totalPrincipalPayment = principalFromEMI + prepaymentThisMonth;
        
        // Ensure total principal payment doesn't exceed remaining balance
        if (totalPrincipalPayment > outstandingPrincipal) {
            totalPrincipalPayment = outstandingPrincipal;
        }
        
        // Update balances
        outstandingPrincipal -= totalPrincipalPayment;
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
            balance: outstandingPrincipal,
            cumulativeInterest: totalInterestPaid,
            isConstruction: month <= constructionPeriod
        });
        
        // Loan is fully paid
        if (outstandingPrincipal <= 1) {
            break;
        }
        
        // Safety check
        if (month > originalTotalMonths + 120) {
            break;
        }
    }
    
    return {
        schedule: schedule,
        totalInterest: totalInterestPaid,
        totalPayment: loanAmount + totalInterestPaid,
        actualTenure: schedule.length - 1,
        currentEMI: fullEMI + extraEMI,
        startDate: startDate,
        method: 'fullemi'
    };
}

// Legacy function for backward compatibility
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

// Comparison calculation engine
function calculateEMIComparison() {
    const preEMIResult = calculatePreEMILoan();
    const fullEMIResult = calculateFullEMILoan();
    
    if (!preEMIResult || !fullEMIResult) {
        return null;
    }
    
    // Calculate cash flow analysis
    const constructionPeriod = parseInt(elements.constructionPeriod.value) || 18;
    
    // Construction period cash flow
    let preEMIConstructionCashFlow = 0;
    let fullEMIConstructionCashFlow = 0;
    
    preEMIResult.schedule.forEach(row => {
        if (row.month > 0 && row.month <= constructionPeriod) {
            preEMIConstructionCashFlow += row.emi + (row.prepayment || 0);
        }
    });
    
    fullEMIResult.schedule.forEach(row => {
        if (row.month > 0 && row.month <= constructionPeriod) {
            fullEMIConstructionCashFlow += row.emi + (row.prepayment || 0);
        }
    });
    
    const cashFlowDifference = fullEMIConstructionCashFlow - preEMIConstructionCashFlow;
    const interestDifference = preEMIResult.totalInterest - fullEMIResult.totalInterest;
    const tenureDifference = preEMIResult.actualTenure - fullEMIResult.actualTenure;
    
    // Break-even analysis: When does the lower total interest of Full EMI 
    // compensate for the higher cash flow during construction?
    let breakEvenMonth = 0;
    let cumulativeSavings = -cashFlowDifference; // Start with the extra cash flow spent
    
    for (let month = constructionPeriod + 1; month <= Math.max(preEMIResult.actualTenure, fullEMIResult.actualTenure); month++) {
        const preEMIRow = preEMIResult.schedule.find(r => r.month === month);
        const fullEMIRow = fullEMIResult.schedule.find(r => r.month === month);
        
        if (preEMIRow && fullEMIRow) {
            const monthlyInterestSaving = preEMIRow.interest - fullEMIRow.interest;
            cumulativeSavings += monthlyInterestSaving;
            
            if (cumulativeSavings >= 0 && breakEvenMonth === 0) {
                breakEvenMonth = month;
                break;
            }
        }
    }
    
    return {
        preEMI: preEMIResult,
        fullEMI: fullEMIResult,
        comparison: {
            constructionCashFlow: {
                preEMI: preEMIConstructionCashFlow,
                fullEMI: fullEMIConstructionCashFlow,
                difference: cashFlowDifference
            },
            totalInterest: {
                preEMI: preEMIResult.totalInterest,
                fullEMI: fullEMIResult.totalInterest,
                savings: interestDifference
            },
            tenure: {
                preEMI: preEMIResult.actualTenure,
                fullEMI: fullEMIResult.actualTenure,
                difference: tenureDifference
            },
            breakEvenMonth: breakEvenMonth
        }
    };
}

// Main calculation function
function performLoanCalculation() {
    const container = document.querySelector('.container');
    container.classList.add('loading');
    
    setTimeout(() => {
        const selectedMethod = getSelectedEMIMethod();
        const resultsView = getSelectedResultsView();
        
        let result;
        let comparisonData = null;
        
        if (resultsView === 'comparison') {
            // Calculate both methods for comparison
            comparisonData = calculateEMIComparison();
            if (!comparisonData) {
                container.classList.remove('loading');
                return;
            }
            result = comparisonData.preEMI; // Default to Pre-EMI for main display
        } else {
            // Calculate selected method only
            if (selectedMethod === 'preemi') {
                result = calculatePreEMILoan();
            } else {
                result = calculateFullEMILoan();
            }
            
            if (!result) {
                container.classList.remove('loading');
                return;
            }
        }
        
        const baseResult = calculateBaseLoan();
        
        // Calculate completion date
        const startDate = new Date(result.startDate);
        const completionDate = new Date(startDate);
        completionDate.setMonth(completionDate.getMonth() + result.actualTenure);
        
        if (resultsView === 'comparison') {
            // Display comparison results
            displayComparisonResults(comparisonData);
        } else {
            // Display individual results
            displayIndividualResults(result, baseResult, completionDate);
        }
        
        // Show results
        elements.resultsSection.style.display = 'block';
        elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        container.classList.remove('loading');
    }, 500);
}

// Display individual results
function displayIndividualResults(result, baseResult, completionDate) {
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
}

// Display comparison results
function displayComparisonResults(comparisonData) {
    // Update the results section to show comparison
    updateResultsSectionForComparison(comparisonData);
    
    // Create comparison charts
    createComparisonCharts(comparisonData);
    
    // Populate comparison table
    populateComparisonTable(comparisonData);
}

// Update results section for comparison view
function updateResultsSectionForComparison(comparisonData) {
    const { preEMI, fullEMI, comparison } = comparisonData;
    
    // Clear existing results section content
    const resultsSection = elements.resultsSection;
    
    // Create comparison summary cards
    const summaryHTML = `
        <h2>📊 EMI Method Comparison Results</h2>
        
        <!-- Key Metrics Comparison -->
        <div class="comparison-summary">
            <div class="comparison-metric">
                <h4>💰 Construction Period Cash Flow</h4>
                <div class="metric-comparison">
                    <div class="metric-item pre-emi">
                        <span class="label">Pre-EMI:</span>
                        <span class="value">${formatCurrency(comparison.constructionCashFlow.preEMI)}</span>
                    </div>
                    <div class="metric-item full-emi">
                        <span class="label">Full EMI:</span>
                        <span class="value">${formatCurrency(comparison.constructionCashFlow.fullEMI)}</span>
                    </div>
                    <div class="metric-difference ${comparison.constructionCashFlow.difference > 0 ? 'negative' : 'positive'}">
                        <span class="label">Extra Cash Flow (Full EMI):</span>
                        <span class="value">${formatCurrency(Math.abs(comparison.constructionCashFlow.difference))}</span>
                    </div>
                </div>
            </div>
            
            <div class="comparison-metric">
                <h4>🏦 Total Interest Paid</h4>
                <div class="metric-comparison">
                    <div class="metric-item pre-emi">
                        <span class="label">Pre-EMI:</span>
                        <span class="value">${formatCurrency(comparison.totalInterest.preEMI)}</span>
                    </div>
                    <div class="metric-item full-emi">
                        <span class="label">Full EMI:</span>
                        <span class="value">${formatCurrency(comparison.totalInterest.fullEMI)}</span>
                    </div>
                    <div class="metric-difference ${comparison.totalInterest.savings > 0 ? 'positive' : 'negative'}">
                        <span class="label">Interest Savings (Full EMI):</span>
                        <span class="value">${formatCurrency(Math.abs(comparison.totalInterest.savings))}</span>
                    </div>
                </div>
            </div>
            
            <div class="comparison-metric">
                <h4>📅 Loan Tenure</h4>
                <div class="metric-comparison">
                    <div class="metric-item pre-emi">
                        <span class="label">Pre-EMI:</span>
                        <span class="value">${calculateYearsMonths(comparison.tenure.preEMI)}</span>
                    </div>
                    <div class="metric-item full-emi">
                        <span class="label">Full EMI:</span>
                        <span class="value">${calculateYearsMonths(comparison.tenure.fullEMI)}</span>
                    </div>
                    <div class="metric-difference ${comparison.tenure.difference > 0 ? 'positive' : 'negative'}">
                        <span class="label">Tenure Reduction:</span>
                        <span class="value">${Math.abs(comparison.tenure.difference)} months</span>
                    </div>
                </div>
            </div>
            
            <div class="comparison-metric break-even">
                <h4>⚖️ Break-Even Analysis</h4>
                <div class="break-even-info">
                    ${comparison.breakEvenMonth > 0 
                        ? `<p>Full EMI method breaks even in <strong>${comparison.breakEvenMonth} months</strong> (${formatMonthYear(comparison.breakEvenMonth, preEMI.startDate)})</p>
                           <p class="break-even-explanation">After this point, the interest savings compensate for the extra cash flow during construction.</p>`
                        : `<p><strong>Full EMI method does not break even</strong> within the loan tenure.</p>
                           <p class="break-even-explanation">The extra cash flow during construction exceeds the total interest savings.</p>`
                    }
                </div>
            </div>
        </div>
    `;
    
    resultsSection.innerHTML = summaryHTML;
}

// Create comparison charts
function createComparisonCharts(comparisonData) {
    const { preEMI, fullEMI } = comparisonData;
    
    // Create side-by-side breakdown charts
    createComparisonBreakdownCharts(preEMI, fullEMI);
    
    // Create timeline comparison chart
    createTimelineComparisonChart(preEMI, fullEMI);
    
    // Add charts to results section
    const chartsHTML = `
        <div class="charts-section comparison-charts">
            <div class="chart-container">
                <canvas id="preEMIBreakdownChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="fullEMIBreakdownChart"></canvas>
            </div>
        </div>
        <div class="chart-container timeline-comparison">
            <canvas id="timelineComparisonChart"></canvas>
        </div>
    `;
    
    elements.resultsSection.insertAdjacentHTML('beforeend', chartsHTML);
    
    // Now create the actual charts
    createComparisonBreakdownCharts(preEMI, fullEMI);
    createTimelineComparisonChart(preEMI, fullEMI);
}

// Create breakdown comparison charts
function createComparisonBreakdownCharts(preEMI, fullEMI) {
    const loanAmount = parseFloat(elements.loanAmount.value);
    
    // Pre-EMI breakdown chart
    const preEMICtx = document.getElementById('preEMIBreakdownChart')?.getContext('2d');
    if (preEMICtx) {
        new Chart(preEMICtx, {
            type: 'doughnut',
            data: {
                labels: ['Principal', 'Interest'],
                datasets: [{
                    data: [loanAmount, preEMI.totalInterest],
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
                        text: 'Pre-EMI Method - Payment Breakdown',
                        font: { size: 14, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Full EMI breakdown chart
    const fullEMICtx = document.getElementById('fullEMIBreakdownChart')?.getContext('2d');
    if (fullEMICtx) {
        new Chart(fullEMICtx, {
            type: 'doughnut',
            data: {
                labels: ['Principal', 'Interest'],
                datasets: [{
                    data: [loanAmount, fullEMI.totalInterest],
                    backgroundColor: ['#27ae60', '#f39c12'],
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
                        text: 'Full EMI Method - Payment Breakdown',
                        font: { size: 14, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Create timeline comparison chart
function createTimelineComparisonChart(preEMI, fullEMI) {
    const ctx = document.getElementById('timelineComparisonChart')?.getContext('2d');
    if (!ctx) return;
    
    const maxLength = Math.max(preEMI.schedule.length, fullEMI.schedule.length);
    const months = [];
    const preEMIPayments = [];
    const fullEMIPayments = [];
    const preEMIBalance = [];
    const fullEMIBalance = [];
    
    for (let i = 0; i < maxLength; i++) {
        if (i < preEMI.schedule.length) {
            months.push(preEMI.schedule[i].date);
            preEMIPayments.push(preEMI.schedule[i].emi);
            preEMIBalance.push(preEMI.schedule[i].balance);
        }
        if (i < fullEMI.schedule.length) {
            fullEMIPayments.push(fullEMI.schedule[i].emi);
            fullEMIBalance.push(fullEMI.schedule[i].balance);
        }
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Pre-EMI Monthly Payment',
                data: preEMIPayments,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: false,
                yAxisID: 'y'
            }, {
                label: 'Full EMI Monthly Payment',
                data: fullEMIPayments,
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                fill: false,
                yAxisID: 'y'
            }, {
                label: 'Pre-EMI Outstanding Balance',
                data: preEMIBalance,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: false,
                yAxisID: 'y1',
                borderDash: [5, 5]
            }, {
                label: 'Full EMI Outstanding Balance',
                data: fullEMIBalance,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: false,
                yAxisID: 'y1',
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'EMI Methods Timeline Comparison',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        maxTicksLimit: 15
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monthly Payment (₹)'
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
                    }
                }
            }
        }
    });
}

// Populate comparison table
function populateComparisonTable(comparisonData) {
    const { preEMI, fullEMI } = comparisonData;
    const constructionPeriod = parseInt(elements.constructionPeriod.value) || 18;
    
    const tableHTML = `
        <div class="table-section comparison-table">
            <h3>📋 Detailed Payment Schedule Comparison</h3>
            <div class="table-container">
                <table id="comparisonScheduleTable">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Date</th>
                            <th colspan="2">Pre-EMI Method</th>
                            <th colspan="2">Full EMI Method</th>
                            <th>Difference</th>
                        </tr>
                        <tr class="sub-header">
                            <th></th>
                            <th></th>
                            <th>Payment</th>
                            <th>Balance</th>
                            <th>Payment</th>
                            <th>Balance</th>
                            <th>Monthly Savings</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;
    
    elements.resultsSection.insertAdjacentHTML('beforeend', tableHTML);
    
    const tbody = document.querySelector('#comparisonScheduleTable tbody');
    const maxLength = Math.max(preEMI.schedule.length, fullEMI.schedule.length);
    
    for (let i = 0; i < maxLength && i < 50; i++) { // Limit to first 50 rows for performance
        const preRow = i < preEMI.schedule.length ? preEMI.schedule[i] : null;
        const fullRow = i < fullEMI.schedule.length ? fullEMI.schedule[i] : null;
        
        if (!preRow && !fullRow) continue;
        
        const tr = document.createElement('tr');
        
        const month = preRow ? preRow.month : fullRow.month;
        const date = preRow ? preRow.date : fullRow.date;
        const prePayment = preRow ? preRow.emi : 0;
        const preBalance = preRow ? preRow.balance : 0;
        const fullPayment = fullRow ? fullRow.emi : 0;
        const fullBalance = fullRow ? fullRow.balance : 0;
        const monthlySavings = prePayment - fullPayment;
        
        // Add construction period styling
        if (month <= constructionPeriod) {
            tr.classList.add('construction-period');
        }
        
        tr.innerHTML = `
            <td>${month === 0 ? 'Start' : month}</td>
            <td>${date}</td>
            <td class="currency">${formatCurrency(prePayment)}</td>
            <td class="currency">${formatCurrency(preBalance)}</td>
            <td class="currency">${formatCurrency(fullPayment)}</td>
            <td class="currency">${formatCurrency(fullBalance)}</td>
            <td class="currency ${monthlySavings > 0 ? 'positive' : monthlySavings < 0 ? 'negative' : ''}">
                ${monthlySavings !== 0 ? formatCurrency(Math.abs(monthlySavings)) : '-'}
            </td>
        `;
        
        tbody.appendChild(tr);
    }
}

// Event listeners
elements.addDisbursement.addEventListener('click', addDisbursementRow);
elements.clearDisbursements.addEventListener('click', clearAllDisbursements);
elements.addPrepayment.addEventListener('click', addPrepaymentRow);
elements.clearPrepayments.addEventListener('click', clearAllPrepayments);
elements.recalculatePrepayments.addEventListener('click', recalculateAllPrepaymentAmounts);
elements.calculateLoan.addEventListener('click', performLoanCalculation);

// Prepayment parameter change listeners for real-time recalculation
elements.basePrepaymentAmount.addEventListener('input', () => {
    recalculateAllPrepaymentAmounts();
    autoSave();
});

elements.prepaymentGrowthRate.addEventListener('input', () => {
    recalculateAllPrepaymentAmounts();
    autoSave();
});

elements.prepaymentGrowthType.addEventListener('change', () => {
    recalculateAllPrepaymentAmounts();
    autoSave();
});

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
    
    // Update individual disbursement amounts based on their mode
    const disbursementItems = document.querySelectorAll('.disbursement-item');
    disbursementItems.forEach(item => {
        const mode = getSelectedDisbursementMode(item);
        const percentageInput = item.querySelector('.disbursement-percentage');
        const amountInput = item.querySelector('.disbursement-amount');
        const currentAmount = parseFloat(amountInput.value) || 0;
        let percentage = parseFloat(percentageInput.value) || 0;
        
        if (mode === 'percentage') {
            // In percentage mode, update amount based on percentage
            if (percentage === 0 && currentAmount > 0 && previousLoanAmount > 0) {
                percentage = (currentAmount / previousLoanAmount) * 100;
                percentageInput.value = percentage.toFixed(2);
            }
            
            if (percentage > 0 && currentLoanAmount > 0) {
                const newAmount = Math.round(currentLoanAmount * percentage / 100);
                amountInput.value = newAmount;
            }
        } else {
            // In fixed mode, keep amount unchanged but update percentage display
            if (currentLoanAmount > 0) {
                percentageInput.value = ((currentAmount / currentLoanAmount) * 100).toFixed(2);
            }
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

// Global disbursement mode event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add global disbursement mode change listeners
    const globalModeRadios = document.querySelectorAll('input[name="globalDisbursementMode"]');
    globalModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            globalDisbursementMode = this.value;
            updateModeDescription();
            applyGlobalModeToAllRows();
        });
    });
    
    // Initialize mode description
    updateModeDescription();
    
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
            
            // Load global disbursement mode if saved
            if (data.globalDisbursementMode) {
                globalDisbursementMode = data.globalDisbursementMode;
                const modeRadio = document.querySelector(`input[name="globalDisbursementMode"][value="${data.globalDisbursementMode}"]`);
                if (modeRadio) {
                    modeRadio.checked = true;
                }
                updateModeDescription();
            }
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
