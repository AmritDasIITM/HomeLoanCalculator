# 🏠 Home Loan Calculator

A comprehensive progressive disbursement home loan calculator with advanced EMI calculations, prepayment analysis, and scenario management. Perfect for analyzing home loans with staggered fund releases and prepayment strategies.

## 🆕 Recent Updates (v3.0) - Major EMI Method Enhancement

### 🚀 **New EMI Method Comparison System**
- **Dual EMI Methods**: Choose between Pre-EMI (interest-only during construction) and Full EMI (complete EMI from day one)
- **Side-by-Side Comparison**: Comprehensive comparison view showing both methods simultaneously
- **Construction Period Configuration**: Set specific construction period (default 18 months)
- **Results View Toggle**: Switch between individual method view and comparison analysis

### 💰 **Advanced Financial Analysis**
- **Cash Flow Analysis**: Compare construction period cash flow requirements between methods
- **Break-Even Calculation**: Determine when Full EMI method becomes financially advantageous
- **Total Interest Comparison**: See exact interest savings/costs for each method
- **Tenure Impact Analysis**: Understand how each method affects loan duration

### 📊 **Enhanced Visualization**
- **Comparison Charts**: Side-by-side breakdown charts for both EMI methods
- **Timeline Comparison**: Dual timeline showing payment patterns and outstanding balances
- **Construction Period Highlighting**: Visual distinction for construction vs regular EMI periods
- **Comprehensive Comparison Tables**: Detailed month-by-month comparison with savings indicators

### 🧮 **Intelligent Prepayment System**
- **Auto-Calculated Prepayments**: Prepayment amounts calculated based on growth rate and time
- **Growth Rate Options**: Annual or monthly compounding for prepayment escalation
- **Base Amount Configuration**: Set starting prepayment amount with automatic growth
- **Real-Time Recalculation**: Instant updates when base parameters change

### 🎨 **Enhanced User Interface**
- **Method Selection Cards**: Intuitive visual selection between Pre-EMI and Full EMI methods
- **Professional Styling**: Clean, modern interface with improved readability
- **Mobile-Optimized Comparison**: Responsive design for complex comparison views
- **Interactive Elements**: Better hover states and visual feedback throughout

### 🔧 **Technical Improvements**
- **Robust Calculation Engine**: Separate calculation logic for each EMI method
- **Enhanced Save/Load**: Support for new EMI method parameters in scenarios
- **Improved Performance**: Optimized calculations for complex comparison scenarios
- **Better Error Handling**: Comprehensive validation and user feedback

## ✨ Core Features

### �️ **Progressive Disbursement Support**
- **Realistic Home Loan Simulation**: Models actual bank disbursement patterns
- **Multiple Disbursements**: Add unlimited disbursement schedules
- **Percentage-Based Calculations**: Easy percentage to amount conversions
- **Timeline Visualization**: Complete loan timeline with disbursement markers

### 💰 **Advanced EMI Calculations**
- **Disbursement-Triggered EMI**: EMI recalculated only on new disbursements
- **Constant EMI Logic**: Maintains consistent payments between disbursements
- **Tenure Reduction**: Prepayments reduce loan duration, not EMI amount
- **Final Payment Logic**: Handles loan closure when balance < EMI

### 📈 **Prepayment Analysis**
- **Dynamic Prepayment Schedule**: Add multiple prepayments at different months
- **Interest Savings Calculator**: Shows total interest saved vs. base loan
- **Tenure Impact**: Visualizes how prepayments reduce loan duration
- **Flexible Scheduling**: Set prepayment amounts and specific months

### 📊 **Comprehensive Analytics**
- **Interactive Charts**: EMI breakdown and complete payment timeline
- **Payment Schedule Table**: Detailed month-by-month breakdown
- **Summary Cards**: Key metrics at a glance
- **Interest Rate Comparison**: Mobile-optimized side-by-side comparison

### 💾 **Data Management**
- **Scenario Save/Load**: Save multiple loan scenarios with custom names
- **Export/Import**: Download/upload loan data as JSON files
- **Auto-Save**: Automatically saves current data as you type
- **Local Storage**: Persistent data across browser sessions

### 🎯 **User Experience**
- **Professional UI**: Clean, organized interface with consistent light theme
- **Toast Notifications**: User-friendly success/error messages
- **Fully Responsive**: Optimized for all screen sizes and devices
- **Input Validation**: Comprehensive error handling and validation

## 🚀 Quick Start

### **Option 1: GitHub Pages (Recommended)**
Visit the live calculator: `https://[your-username].github.io/HomeLoanCalculator`

### **Option 2: Local Development**
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start calculating your home loan scenarios!

```bash
git clone https://github.com/[your-username]/HomeLoanCalculator.git
cd HomeLoanCalculator
# Open index.html in your browser
```

## 📁 File Structure

```
HomeLoanCalculator/
├── index.html          # Main HTML file with calculator interface
├── styles.css          # Complete CSS styling for modern UI
├── script.js           # JavaScript logic for all calculations
├── README.md           # This documentation file
└── data/              # Default scenarios (optional)
    ├── default-scenarios.json
    └── sample-loans.json
```

## 🔧 Technical Details

### **Core Technologies**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for interactive visualizations
- **Storage**: Browser localStorage for data persistence
- **Hosting**: GitHub Pages compatible (static hosting)

### **Key Algorithms**
- **EMI Formula**: `EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)`
- **Progressive Logic**: Recalculates EMI only on disbursements
- **Interest Calculation**: Monthly compounding with precise date handling
- **Prepayment Impact**: Direct principal reduction with tenure adjustment

### **Browser Support**
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 📖 Usage Guide

### **1. Basic Loan Setup**
1. **Enter loan details**: Amount (₹1.55 crore default), interest rate, tenure
2. **Set start date**: Month-year when loan begins (Jan 2026 default)
3. **Configure extra EMI**: Optional additional monthly payment

### **2. Disbursement Schedule**
1. **Add disbursements**: Click "Add Disbursement" 
2. **Set month and amount**: When bank releases funds
3. **Use percentages**: Easy conversion from percentage to amount
4. **Multiple releases**: Add as many disbursements as needed

### **3. Prepayment Planning**
1. **Add prepayments**: Click "Add Prepayment"
2. **Schedule timing**: Set month for extra payment
3. **Set amount**: Additional principal payment
4. **Analyze impact**: See tenure reduction and interest savings

### **4. Scenario Management**
1. **Save scenarios**: Give your loan plan a name and save
2. **Load scenarios**: Quick access to saved calculations
3. **Export data**: Download as JSON for backup
4. **Import data**: Restore from previously exported files

### **5. Rate Comparison**
1. **Enter 3 rates**: Compare different interest rate options
2. **Instant analysis**: See EMI, interest, and total payment differences
3. **Best rate highlighting**: Automatically shows most economical option

## 🌐 GitHub Pages Deployment

Available at: https://amritdasiitm.github.io/HomeLoanCalculator/

## 💡 Example Scenarios

### **Scenario 1: Standard Home Loan**
- **Loan**: ₹1.55 crore at 7.65% for 25 years
- **Disbursements**: 10% at start, 90% after 6 months
- **Prepayments**: ₹2 lakh annually for first 5 years
- **Result**: ~8 years early closure, ₹45+ lakh interest savings

### **Scenario 2: Under Construction**
- **Loan**: ₹2 crore at 8.5% for 30 years
- **Disbursements**: 20% stages over 18 months
- **Strategy**: Pre-EMI interest payments + lump sum prepayments
- **Benefit**: Reduced effective tenure and optimized cash flow

## 🔄 Data Storage

### **Local Storage (Primary)**
- Scenarios saved in browser localStorage
- Auto-save functionality for current inputs
- Cross-session persistence
- ~10MB storage limit per domain

### **Export/Import (Backup)**
- JSON format for easy portability
- Complete scenario data including settings
- Date-stamped filenames for organization
- Cross-device compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Questions**: Use GitHub Discussions for general questions
- **Documentation**: Comprehensive inline comments in source code

## 🏆 Acknowledgments

- **Chart.js**: For beautiful interactive charts
- **Modern CSS**: Responsive design principles
- **Progressive Enhancement**: Accessible to all users
- **Open Source**: Built with community-first mindset

*Made with ❤️ for better financial planning*

