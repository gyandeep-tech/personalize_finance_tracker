import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { useUserProfile, deriveFinance } from "@/context/UserProfile";

// Data mapping and helper logic adapted from the HTML logic
function fmt(n: number) {
  n = Math.round(n);
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + 'L';
  return '₹' + n.toLocaleString('en-IN');
}

function row(k: string, v: string | number, cls?: string, override?: string) {
  return '<div class="res-row"><span class="res-key">' + k + '</span>' +
    '<span class="res-val' + (cls ? ' ' + cls : '') + '">' + (override || v) + '</span></div>';
}

function calcEMI(p: number, r: number, n: number) {
  if (r === 0) return p / n;
  return p * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
}

function futureValue(pmt: number, r: number, n: number) {
  return pmt * (Math.pow(1+r, n) - 1) / r;
}

function calcSIPRequired(fv: number, r: number, n: number) {
  if (r === 0) return fv / n;
  return fv * r / (Math.pow(1+r, n) - 1);
}

function monthsToReachWithSIP(target: number, monthly: number, rate: number) {
  let acc = 0, m = 0;
  while (acc < target && m < 600) {
    acc = acc * (1 + rate) + monthly;
    m++;
  }
  return m;
}

const QUICK = [
  "When can I buy a car?",
  "What is my savings rate?",
  "Can I take a home loan?",
  "How much can I invest monthly?",
  "When can I retire?",
  "Is my emergency fund enough?",
  "How long to save ₹10 lakhs?",
  "Am I financially healthy?"
];

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

export const Chatbot = () => {
  const { profile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && profile) {
      // First boot greeting
      setMessages([{ id: 'init', sender: 'bot', text: greetingMsg() }]);
    }
  }, [isOpen, profile]); // eslint-disable-line

  if (!profile) return null;

  // Build the unified profile object P matching the original JS script
  const df = deriveFinance(profile);
  const P = {
    income: profile.income,
    expense: profile.expenses,
    emi: 0, // Assumption
    savings: profile.savings,
    target: profile.goal.targetAmount,
    credit: 750, // Assumption
    carPrice: profile.goal.targetAmount, // Map general goal to car price for car queries
    age: 30, // Assumption
    retire: 60, // Assumption
    surplus: df.monthlySavings,
    dti: 0, // 0 EMI assumed initially
    sr: df.savingsRate * 100,
    annInc: profile.income * 12,
    yearsLeft: 60 - 30, // retire - age
  };

  const handleQuickSend = (q: string) => {
    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: q };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setTimeout(() => {
      const reply = answer(q);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: reply }]);
    }, 600 + Math.random() * 400); // simulated network delay
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const query = input;
    setInput("");
    handleQuickSend(query);
  };

  // ----- LOGIC PORTED FROM HTML SCRIPT -----
  function greetingMsg() {
    const status = P.surplus > 0 ? '<span class="ok">Positive cash flow ✓</span>' : '<span class="warn">Negative cash flow ✗</span>';
    return 'Hey! I\'ve automatically loaded your financial profile. Here\'s your snapshot:\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Your Financial Profile</div>' +
        row('Monthly Income', fmt(P.income)) +
        row('Monthly Expenses', '- ' + fmt(P.expense + P.emi)) +
        row('Monthly Surplus', fmt(P.surplus), P.surplus >= 0 ? 'good' : 'bad') +
        row('Savings Rate', P.sr.toFixed(1) + '%', P.sr >= 20 ? 'good' : P.sr >= 10 ? 'neutral' : 'bad') +
        row('Cash Flow', '', 'good', status) +
      '</div>\n\n' +
      'I can <strong>only answer questions about your personal finances</strong>. Try the quick buttons below or type any finance question!';
  }

  function answer(q: string) {
    const ql = q.toLowerCase();
    
    const finKeywords = ['money','income','expense','saving','loan','emi','invest','car','bike','house','home','retire','debt','credit','salary','budget','tax','fund','surplus','afford','buy','purchase','eligible','months','years','rate','interest','insurance','stock','mutual','sip','lump','wealth','goal','emergency','cash','flow','dti','ratio','spend','earn','profit','loss','bank','account','deposit','fd','rd','ppf','nps','401','ira','roth','bond','equity','portfolio','risk','financial','finance','fiscal','monetary', 'hello', 'hi', 'hey'];
    const hasFinKey = finKeywords.some(k => ql.includes(k));
    if (!hasFinKey) {
      return '⚠️ <span class="warn">I\'m a <strong>financial advisor only.</strong></span>\n\nI can only answer questions related to your personal finances — savings, loans, investments, car eligibility, retirement, tax, budget, debt, and more.\n\nPlease ask a finance-related question!';
    }

    if (ql.match(/car|vehicle|auto/) && ql.match(/month|when|eligible|afford|buy|loan|time|how long/)) return answerCar();
    if (ql.match(/saving.{0,5}rate|how much.*sav|sav.*percent|sav.*ratio/)) return answerSavingsRate();
    if (ql.match(/surplus|leftover|left after|take home|net|disposable/)) return answerSurplus();
    if (ql.match(/home loan|house loan|mortgage|property loan/)) return answerHomeLoan();
    if (ql.match(/personal loan|borrow|loan.*eligible|can i.*loan/)) return answerPersonalLoan();
    if (ql.match(/invest|sip|mutual fund|stock|equity|portfolio|bond|fd|rd|ppf|nps/)) return answerInvestment();
    if (ql.match(/retire|retirement|pension|when.*retire|retire.*when/)) return answerRetirement();
    if (ql.match(/emergency.*fund|rainy.*day|safety net|backup fund/)) return answerEmergencyFund();
    if (ql.match(/dti|debt.*income|debt.*ratio|debt.*percent/)) return answerDTI();
    if (ql.match(/tax|80c|ppf|elss|nps.*tax|tax.*save|section/)) return answerTax();
    if (ql.match(/how long.*save|save.*how long|how many months.*save|how many years.*save/)) return answerSaveGoal(q);
    if (ql.match(/health|status|overall|am i.*ok|how am i doing|financial.*state/)) return answerHealth();
    if (ql.match(/reduce.*debt|pay.*debt|clear.*loan|debt.*strategy|debt.*faster/)) return answerReduceDebt();
    if (ql.match(/budget|50.30.20|how.*spend|spending.*plan|expense.*reduce/)) return answerBudget();
    if (ql.match(/credit.*score|cibil|improve.*credit|credit.*improve/)) return answerCredit();

    if (ql.match(/hi|hello|hey/)) return 'Hello! How can I help you with your finances today?';

    return 'I understand you\'re asking about your finances. Based on your profile:\n\n' +
      '• Monthly Income: <span class="val">' + fmt(P.income) + '</span>\n' +
      '• Monthly Surplus: <span class="' + (P.surplus>=0?'ok':'warn') + '">' + fmt(P.surplus) + '</span>\n' +
      'Could you be more specific? Try asking:\n' +
      '• "When can I buy a car?"\n' +
      '• "Am I financially healthy?"\n' +
      '• "How to invest my surplus?"';
  }

  function answerCar() {
    const downAmt = P.carPrice * 0.20;
    const loanAmt = P.carPrice - downAmt;
    const emi_car = calcEMI(loanAmt, 0.085/12, 60);
    const totalEmiAfter = P.emi + emi_car;
    const dtiAfter = totalEmiAfter / P.income * 100;
  
    const canAffordEMI = dtiAfter <= 50;
    const monthsToDown = P.surplus > 0 ? Math.ceil((downAmt - P.savings) / P.surplus) : Infinity;
    const alreadyHasDown = P.savings >= downAmt;
    const eligible = canAffordEMI;
  
    const verdict = eligible
      ? (alreadyHasDown ? '<span class="ok">✓ You can buy the vehicle NOW</span>' : '<span class="note">✓ Eligible — need to save for down payment</span>')
      : '<span class="warn">✗ Not yet eligible — improve finances first</span>';
  
    const prog_pct = alreadyHasDown ? 100 : Math.min(100, Math.round(P.savings / downAmt * 100));
  
    return 'Based on your profile, here\'s your <strong>vehicle eligibility analysis</strong> (assuming target goal is vehicle):\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Vehicle Eligibility Report</div>' +
        row('Target Vehicle Price', fmt(P.carPrice)) +
        row('Down Payment Needed (20%)', fmt(downAmt)) +
        row('Estimated Car EMI', fmt(Math.round(emi_car)) + '/mo', canAffordEMI ? 'good' : 'bad') +
        row('DTI After Purchase', dtiAfter.toFixed(1) + '%', dtiAfter <= 40 ? 'good' : dtiAfter <= 50 ? 'neutral' : 'bad') +
        row('Down Payment Saved', fmt(P.savings) + ' / ' + fmt(downAmt), alreadyHasDown ? 'good' : 'neutral') +
      '</div>\n\n' +
      '<div class="prog-wrap">' +
        '<div class="prog-label"><span>Down payment progress</span><span>' + prog_pct + '%</span></div>' +
        '<div class="prog-track"><div class="prog-fill bg-primary" style="width:' + prog_pct + '%;"></div></div>' +
      '</div>\n\n' +
      '<strong>Verdict:</strong> ' + verdict + '\n\n' +
      (alreadyHasDown
        ? '<span class="ok">✓ You have sufficient savings for down payment.</span> Your DTI after the EMI will be <span class="val">' + dtiAfter.toFixed(1) + '%</span>.'
        : (P.surplus > 0
            ? 'You need <span class="val">' + fmt(downAmt - P.savings) + '</span> more for down payment. That\'s roughly <strong><span class="note">' + monthsToDown + ' months</span></strong>.'
            : '<span class="warn">Your current surplus is zero or negative. Reduce expenses first.</span>'));
  }

  function answerSavingsRate() {
    const sr = P.sr;
    const gradeClass = sr >= 30 ? 'good' : sr >= 20 ? 'good' : sr >= 10 ? 'neutral' : 'bad';
    return '<strong>Your savings rate analysis:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Savings Rate Breakdown</div>' +
        row('Monthly Income', fmt(P.income)) +
        row('Monthly Surplus', fmt(P.surplus), P.surplus >= 0 ? 'good' : 'bad') +
        row('Savings Rate', sr.toFixed(1) + '%', gradeClass) +
      '</div>\n\n' +
      '<div class="prog-wrap">' +
        '<div class="prog-label"><span>Target: 20%</span><span>' + Math.min(100, Math.round(sr*10)/10) + '%</span></div>' +
        '<div class="prog-track"><div class="prog-fill bg-primary" style="width:' + Math.min(100,sr) + '%;"></div></div>' +
      '</div>\n\n' +
      (sr < 20 ? `To reach the 20% rule, save ${fmt(P.income * 0.2)}/mo. You are saving ${fmt(P.surplus)}. Cut expenses!` : `You're meeting the recommended savings rate!`);
  }

  function answerSurplus() {
    return '<strong>Your monthly surplus breakdown:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Cash Flow Statement</div>' +
        row('Income', fmt(P.income), 'good') +
        row('Living Expenses', '- ' + fmt(P.expense), 'bad') +
        row('Net Surplus', fmt(P.surplus), P.surplus >= 0 ? 'good' : 'bad') +
      '</div>\n\n' +
      (P.surplus > 0
        ? `You have <span class="val">${fmt(P.surplus)}</span> free each month.`
        : `<span class="warn">You are overspending by ${fmt(Math.abs(P.surplus))}/mo.</span>`);
  }

  function answerHomeLoan() {
    const maxEligibleLoan = (P.income * 0.5 - P.emi) * 12 / 0.075;
    const canApply = maxEligibleLoan > 0;
    return '<strong>Home Loan Eligibility:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Home Loan Assessment</div>' +
        row('Monthly Income', fmt(P.income)) +
        row('Max EMI Capacity (50% rule)', fmt(Math.max(0, P.income * 0.5)), canApply ? 'good' : 'bad') +
        row('Max Loan Eligible', fmt(Math.round(maxEligibleLoan)), canApply ? 'good' : 'bad') +
      '</div>';
  }

  function answerPersonalLoan() {
    const maxEMI = P.income * 0.5 - P.emi;
    const maxLoan = Math.max(0, maxEMI * 60 / (1 + 0.12 * 5));
    return '<strong>Personal Loan Eligibility:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Loan Analysis</div>' +
        row('Max Loan Eligible', fmt(Math.round(maxLoan))) +
      '</div>';
  }

  function answerInvestment() {
    const investable = Math.max(0, P.surplus * 0.6);
    const riskProfile = P.sr >= 25 ? 'Aggressive' : P.sr >= 15 ? 'Balanced' : 'Conservative';
    return '<strong>Investment Suggestion (' + riskProfile + '):</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Allocation</div>' +
        row('Total Monthly Investable', fmt(Math.round(investable)), 'good') +
        row('SIP / Equity Funds', fmt(Math.round(investable * 0.6)) + '/mo') +
        row('FD / Debt Instruments', fmt(Math.round(investable * 0.2)) + '/mo') +
        row('PPF / Tax-saving', fmt(Math.round(investable * 0.2)) + '/mo') +
      '</div>';
  }

  function answerRetirement() {
    const monthsLeft = P.yearsLeft * 12;
    const retirementCorpus = P.income * 12 * 25; // 25x rule
    const remaining = Math.max(0, retirementCorpus - P.savings);
    const requiredSIP = calcSIPRequired(remaining, 0.12/12, monthsLeft);
    const canMeetGoal = requiredSIP <= P.surplus;

    return '<strong>Retirement Planning for you:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Retirement Focus</div>' +
        row('Target Corpus (25x rule)', fmt(Math.round(retirementCorpus)), 'neutral') +
        row('Already Saved', fmt(P.savings)) +
        row('Remaining to Save', fmt(Math.round(remaining))) +
        row('Required Monthly SIP', fmt(Math.round(requiredSIP)), canMeetGoal ? 'good' : 'bad') +
      '</div>';
  }

  function answerEmergencyFund() {
    const recommended = P.expense * 6;
    const gap = Math.max(0, recommended - P.savings);
    const pct = Math.min(100, Math.round(P.savings / recommended * 100));
    
    return '<strong>Emergency Fund Analysis:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Emergency Fund Check</div>' +
        row('Recommended Fund (6mo)', fmt(Math.round(recommended))) +
        row('Current Savings', fmt(P.savings), P.savings >= recommended ? 'good' : 'neutral') +
        row('Gap', gap > 0 ? fmt(Math.round(gap)) : 'None!', gap === 0 ? 'good' : 'bad') +
      '</div>\n\n' +
      '<div class="prog-wrap"><div class="prog-track"><div class="prog-fill bg-indigo-500" style="width:' + pct + '%;"></div></div></div>';
  }

  function answerDTI() {
    return 'DTI calculation requires valid EMI data. Currently mapped at 0% default. Setup true loan tracking if applicable!';
  }

  function answerTax() {
    const slab = P.annInc > 1500000 ? 'High (30%)' : P.annInc > 1000000 ? 'Moderate (20%)' : 'Basic (0-5%)';
    return '<strong>Tax Strategy:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Tax Bracket</div>' +
        row('Annual Income', fmt(Math.round(P.annInc))) +
        row('Tax Slab roughly', slab) +
      '</div>\n\n• Maximize ELSS SIPs & PPF under 80C block up to 1.5L.';
  }

  function answerSaveGoal(q: string) {
    const match = q.match(/[\d,]+/g);
    const goalAmt = match ? parseFloat(match.join('').replace(/,/g,'')) : P.target;
    const remaining = Math.max(0, goalAmt - P.savings);
    const months = P.surplus > 0 ? Math.ceil(remaining / P.surplus) : Infinity;
    
    return '<strong>Goal Calculator:</strong>\n\n' +
      '<div class="res-card">' +
        '<div class="res-card-title">Timeline</div>' +
        row('Goal Amt', fmt(Math.round(goalAmt))) +
        row('Time Required', P.surplus > 0 ? months + ' months' : 'N/A') +
      '</div>';
  }

  function answerHealth() {
    let score = 0;
    if (P.sr >= 20) score += 25;
    if (P.dti <= 30) score += 25;
    if (P.credit >= 700) score += 25;
    if (P.savings >= P.expense * 3) score += 25;
    
    return '<strong>Health Score:</strong> ' + score + '/100\n\n' +
      '<div class="prog-wrap"><div class="prog-track"><div class="prog-fill bg-green-500" style="width:' + score + '%;"></div></div></div>';
  }

  function answerReduceDebt() { return 'Avalanche Method is recommended. Pay high-interest loans first.'; }
  function answerBudget() { return 'Aim for 50% Needs, 30% Wants, 20% Savings.'; }
  function answerCredit() { return 'Credit tracking mapped to 750 default. Maintain <30% utilization to grow it.'; }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform flex items-center justify-center z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open AI Bot"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Slideover Modal */}
      <div 
        className={`fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)]' : 'scale-90 opacity-0 pointer-events-none'}`}
        style={{ height: "600px", maxHeight: "calc(100vh - 4rem)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 flex items-center justify-between text-white shrink-0 shadow-sm relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-inner ring-2 ring-white/20">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-[15px] tracking-wide drop-shadow-sm">FinSight Assistant</div>
              <div className="text-xs text-blue-100 font-medium flex items-center gap-1.5 pt-0.5 opacity-90">
                <span className="h-2 w-2 rounded-full bg-green-400 border border-white/20 animate-pulse"></span>
                Online & Ready to help
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors relative z-10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Messages container */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border ${msg.sender === 'user' ? 'bg-secondary border-border text-muted-foreground' : 'bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-700 text-white shadow-sm'}`}>
                {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div 
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-blue-50/80 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 border rounded-tl-sm text-foreground'}`}
                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
              />
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 max-w-[90%] self-start animate-fade-in">
              <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-600 border border-indigo-700 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-blue-50/80 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 border rounded-tl-sm flex items-center gap-1 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length < 5 && (
          <div className="px-4 pb-4 flex flex-nowrap overflow-x-auto gap-2.5 scrollbar-none pt-2 bg-gradient-to-b from-transparent to-card shrink-0 relative z-10" style={{ scrollbarWidth: 'none' }}>
            {QUICK.slice(0, 4).map(q => (
              <button 
                key={q} 
                onClick={() => handleQuickSend(q)}
                className="whitespace-nowrap px-4 py-2 text-[13px] font-medium rounded-full border border-blue-200 dark:border-blue-800/40 bg-white/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-all shadow-sm active:scale-95"
                disabled={isTyping}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 bg-card border-t border-border/50 shrink-0 shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center bg-background border border-border rounded-full pl-5 pr-1.5 py-1.5 shadow-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..." 
              className="flex-1 bg-transparent py-2 text-sm focus:outline-none placeholder:text-muted-foreground/60 disabled:opacity-50 font-medium"
              disabled={isTyping}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm rounded-full disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-all ml-2 active:scale-95"
            >
              <Send className="h-4 w-4 -ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
