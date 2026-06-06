import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiMinimize2, FiPhone, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { courseAPI } from '../utils/api';

const quickReplies = [
  { label: '📚 Course', value: 'course herna chahanchu' },
  { label: '💰 Payment', value: 'payment kasari garne' },
  { label: '📝 Enrollment', value: 'enrollment garna kasto ho' },
  { label: '❓ Help', value: 'help chahiyo malai' },
];

const classOptions = [
  'Class 8', 'Class 9', 'Class 10', 'Class 11 (+2)', 'Class 12 (+2)', 'Bachelor', 'Master', 'Aayog Tayari'
];

const helpOptions = [
  { label: 'Enrollment Help', value: 'enrollment kasari garne', icon: '📝' },
  { label: 'Payment Help', value: 'payment garna sakinna', icon: '💳' },
  { label: 'Login Problem', value: 'login hudaina', icon: '🔑' },
  { label: 'Course Access', value: 'course kasari herne', icon: '📖' },
  { label: 'Refund Policy', value: 'paisa ferrna milxa', icon: '↩️' },
  { label: 'Contact Support', value: 'contact garnu cha', icon: '📞' },
];

const AI = {
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[?!.,;:'"()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  fuzzyMatch(input, keywords) {
    const words = input.split(' ');
    for (const keyword of keywords) {
      if (input.includes(keyword)) return true;
      for (const word of words) {
        if (word.startsWith(keyword.substring(0, Math.max(3, Math.floor(keyword.length * 0.7))))) return true;
      }
    }
    return false;
  },

  detectLanguage(text) {
    const nepaliWords = ['ho', 'cha', 'ma', 'malai', 'tapai', 'kaso', 'kasto', 'garna', 'garne', 'hernu', 'garnus', 'vako', 'huncha', 'haina', 'xa', 'le', 'ko', 'ka', 'la', 'ma', 'bata', 'lai', 'sanga', 'pani', 'ra', 'ani', 'tara', 'yo', 'tyo', 'k', 'ke', 'kasari', 'kina', 'kidhar', 'kaha', 'belukaal', 'aaja', 'bholi', 'chahi', 'matra', 'dherai', 'alikati', 'sano', 'thulo', 'naya', 'purano', 'ramro', 'naramro', 'sajilo', 'gahro'];
    const words = text.toLowerCase().split(/\s+/);
    const nepaliCount = words.filter(w => nepaliWords.includes(w)).length;
    return nepaliCount > 0 ? 'ne' : 'en';
  },

  detectSentiment(text) {
    const positive = ['thank', 'dhanyabad', 'ramro', 'dammi', 'great', 'awesome', 'nice', 'good', 'best', 'satisfy', 'happy', 'thankyou', 'thanks', 'appreciate', 'perfect', 'excellent'];
    const negative = ['problem', 'samasya', 'hudaina', 'vayena', 'naramro', 'bad', 'worst', 'frustrat', 'annoy', '投诉', 'complain', 'not working', 'kaam garena', 'chaina', 'nahuda', 'gahro', 'mushkil'];
    const lower = text.toLowerCase();
    if (positive.some(w => lower.includes(w))) return 'positive';
    if (negative.some(w => lower.includes(w))) return 'negative';
    return 'neutral';
  },

  extractEntities(text) {
    const lower = text.toLowerCase();
    const entities = {};
    const classMatch = lower.match(/class\s*(\d+)/);
    if (classMatch) entities.classNum = parseInt(classMatch[1]);
    if (lower.includes('+2') || lower.includes('plus2') || lower.includes('plus 2') || lower.includes('11') || lower.includes('12')) entities.level = 'plus2';
    if (lower.includes('bachelor') || lower.includes('bbs') || lower.includes('bba') || lower.includes('bsc') || lower.includes('ba')) entities.level = 'bachelor';
    if (lower.includes('master') || lower.includes('mba') || lower.includes('ma') || lower.includes('msc')) entities.level = 'master';
    if (lower.includes('aayog') || lower.includes('loksewa') || lower.includes('psc')) entities.level = 'aayog';
    if (lower.includes('8') || lower.includes('9')) entities.level = entities.level || 'school';
    if (lower.includes('10') || lower.includes('see') || lower.includes('slc')) entities.level = 'school';
    const priceMatch = lower.match(/(\d[\d,]*)\s*(rs|rup|rupees|price|cost|fee|kimat)/);
    if (priceMatch) entities.price = priceMatch[1].replace(',', '');
    return entities;
  },

  detectIntent(text) {
    const n = this.normalize(text);

    const intents = [
      {
        intent: 'greeting',
        patterns: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'hola', 'good morning', 'good evening', 'sup', 'k cha', 'k xa', 'kaso cha', 'kasto cha', 'sanjha', 'barkha', 'subha'],
        priority: 1,
      },
      {
        intent: 'thanks',
        patterns: ['thank', 'dhanyabad', 'dhanyabad', 'shukriya', 'appreciate', 'great help', 'thanks a lot', 'thank you', 'thnx', 'thx'],
        priority: 1,
      },
      {
        intent: 'payment_status',
        patterns: ['payment pending', 'payment vayena', 'unlock vayena', 'course unlock', 'payment approved', 'payment verify', 'payment gareko', 'paisa tiryo', 'paisa gayo', 'screenshot upload', 'payment status', 'kati din', 'kati baje', 'payment bhako', 'nahune', 'payment na bhako', 'payment failed'],
        priority: 3,
      },
      {
        intent: 'payment',
        patterns: ['payment', 'pay', 'khalti', 'qr', 'bank', 'esewa', 'ime pay', 'cid', 'transaction', 'receipt', 'screenshot', 'screenshot upload', 'payment kasari', 'paisa', 'tirnu', 'tirna', 'kimat', 'price', 'cost', 'fee', 'free', 'mahanggo', 'sasto', 'discount', 'offer', 'coupon'],
        priority: 2,
      },
      {
        intent: 'course_list',
        patterns: ['course', 'courses', 'subject', 'subject haru', 'class', 'kun class', 'school', 'college', 'university', 'level', 'category', 'courses haru', 'course haru', 'kati course', 'course available', 'course herna', 'herne course', 'course cha'],
        priority: 2,
      },
      {
        intent: 'enrollment',
        patterns: ['enroll', 'enrollment', 'register', 'admission', 'join', 'addmission', 'kasaile', 'enroll garna', 'ke garna', 'apply', 'form', 'sign up', 'sigh up', 'banda', 'add', 'khola'],
        priority: 2,
      },
      {
        intent: 'login',
        patterns: ['login', 'log in', 'sign in', 'password', 'forgot', 'reset', 'email', 'account', 'verify', 'auth', 'logged out', 'session', 'logout'],
        priority: 2,
      },
      {
        intent: 'course_access',
        patterns: ['access', 'watch', 'video', 'herne', 'hernu', 'video herne', 'notes', 'download', 'pdf', 'content', 'material', 'lecture', 'lesson', 'chapter', 'syllabus', 'class herne'],
        priority: 2,
      },
      {
        intent: 'refund',
        patterns: ['refund', 'return', 'paisa ferr', 'paisa back', 'cancel', 'unsubscribe', 'drop', 'leave'],
        priority: 2,
      },
      {
        intent: 'contact',
        patterns: ['contact', 'phone', 'whatsapp', 'number', 'email', 'address', 'location', 'kaha cha', 'phone number', 'call', 'message'],
        priority: 2,
      },
      {
        intent: 'help',
        patterns: ['help', 'support', 'sahayog', 'madad', 'guide', 'assist', 'problem', 'issue', 'error', 'bug', 'not working', 'kaam garena', 'chaldaina'],
        priority: 1,
      },
      {
        intent: 'about',
        patterns: ['about', 'hamro tuition', 'who', 'what is', 'k ho', 'k ho yo', 'about us', 'hamro baare', 'tumharo baare', 'details'],
        priority: 1,
      },
      {
        intent: 'recommend',
        patterns: ['recommend', 'suggest', 'best course', 'kun course', 'which course', 'kun lai', 'kun x', 'which one', 'better', 'best', 'ramro course', 'sabai bhandaa'],
        priority: 2,
      },
    ];

    let bestMatch = { intent: 'unknown', confidence: 0 };

    for (const intentDef of intents) {
      let maxScore = 0;
      for (const pattern of intentDef.patterns) {
        if (n.includes(pattern)) {
          const score = pattern.length / n.length * intentDef.priority;
          if (score > maxScore) maxScore = score;
        }
      }
      if (maxScore > bestMatch.confidence) {
        bestMatch = { intent: intentDef.intent, confidence: maxScore };
      }
    }

    return bestMatch.confidence > 0.05 ? bestMatch.intent : 'unknown';
  },

  generateResponse(intent, entities, sentiment, language, context) {
    const isNepali = language === 'ne';
    const responses = {
      greeting: isNepali
        ? "Namaste! Ma Hamro Tuition ko AI Assistant ho. Tapailai course, payment, enrollment ke help chahiyo? Ma Nepali ra English dono ma bujhna sakinchu!"
        : "Hello! I'm Hamro Tuition AI Assistant. I can help you with courses, payments, enrollment, and more! Feel free to ask in English or Nepali.",

      thanks: isNepali
        ? "Tappai lai swagat cha! Aru kehi help lagyo bhane bhandinu hai. Hamro mission cha tapailai best education dilaaunu!"
        : "You're welcome! Feel free to ask if you need anything else. Our mission is to provide the best education to you!",

      payment: isNepali
        ? "Payment kasari garne?\n\n(1) Course ma gayera Enroll Now ma click garnus\n(2) Khalti ya Bank QR chhanus\n(3) QR code scan garera paisa tirnus\n(4) Payment screenshot upload garnus\n(5) Admin le 24 ghanta bhitra verify garxan\n\nVerify bhayepaxi course unlock hunxa!"
        : "How to pay?\n\n(1) Go to course, click Enroll Now\n(2) Choose Khalti or Bank QR\n(3) Scan QR and pay\n(4) Upload payment screenshot\n(5) Admin verifies within 24 hours\n\nCourse unlocks after approval!",

      payment_status: isNepali
        ? "Payment status herne:\n\n(1) Dashboard ma Payment History ma herunus\n(2) Status Pending vaye 24 ghanta samma parak\n(3) Status Rejected vaye pani payment garnus\n(4) 24 ghanta bhayo bhane WhatsApp ma contact garnus\n\nSikke payment kasari garyo?"
        : "Check payment status:\n\n(1) Go to Dashboard, Payment History\n(2) Status Pending: Wait up to 24 hours\n(3) Status Rejected: Re-submit payment\n(4) If 24 hours passed: Contact on WhatsApp\n\nDid you upload the screenshot?",

      course_list: null,

      enrollment: isNepali
        ? "Enrollment kasari garne?\n\n(1) Hamro site ma login garnus\n(2) Courses page ma gayera mann parne course chhanus\n(3) Enroll Now click garnus\n(4) Payment complete garnus\n(5) 24 ghanta bhitra approval aaucha\n\nEnrollment vayo! Course herna saknu hunxa!"
        : "How to enroll?\n\n(1) Login to our website\n(2) Browse courses and pick one\n(3) Click Enroll Now\n(4) Complete payment\n(5) Approval within 24 hours\n\nDone! You can start learning!",

      login: isNepali
        ? "Login problem?\n\nYi steps follow garnus:\n(1) Sahi email ra password halnus\n(2) Caps Lock band cha hernus\n(3) Browser cache safa garnus\n(4) Forgot Password bata reset garnus\n\nPani hudaina bhane WhatsApp ma message garnus, hami help garxau!"
        : "Login problem?\n\nTry these steps:\n(1) Check your email and password\n(2) Make sure Caps Lock is off\n(3) Clear browser cache\n(4) Reset via Forgot Password\n\nStill stuck? Message us on WhatsApp!",

      course_access: isNepali
        ? "Course kasaile herne?\n\n(1) Login garera My Courses ma janus\n(2) Enrolled course ma click garnus\n(3) Video herunus, notes download garnus\n(4) Quiz ra assignment liunus\n\nCourse access lifetime cha! Kei paila gayera herna milxa."
        : "How to access courses?\n\n(1) Login, go to My Courses\n(2) Click on your enrolled course\n(3) Watch videos, download notes\n(4) Take quizzes and assignments\n\nLifetime access! Watch anytime.",

      refund: isNepali
        ? "Refund niti:\n\n(YES) Course access nagari 7 din bhitra refund lina milxa\n(NO) Course access garepaxi refund hudaina\n\nRefund ko lagi WhatsApp ma admin lai contact garnus. Screenshot ra reason lekhnus."
        : "Refund Policy:\n\n(YES) Refund within 7 days if no course access\n(NO) No refund after accessing course content\n\nContact admin on WhatsApp with screenshot and reason.",

      contact: isNepali
        ? "Samparka garnus:\n\nWhatsApp: +977-9843684295\nEmail: support@hamrotuition.com\nSama: 9 AM - 6 PM (Sun-Fri)\n\nWhatsApp button thichnus!"
        : "Contact us:\n\nWhatsApp: +977-9843684295\nEmail: support@hamrotuition.com\nHours: 9 AM - 6 PM (Sun-Fri)\n\nClick the WhatsApp button below!",

      help: isNepali
        ? "Malai kasari help garne?\n\nTapailai kun chij ma help chahiyo? Yo options ma click garnus ya directly message lekhunus."
        : "How can I help?\n\nWhat do you need help with? Click an option below or type your question directly.",

      about: isNepali
        ? "Hamro Tuition baare:\n\nHamro Tuition ek online education platform ho jo Class 8 dekhi Master level samma courses provide garxa.\n\n> Expert teachers\n> Affordable price\n> Lifetime access\n> Certificate\n> Nepali + English medium\n\nPuru Nepal ma quality education lyaunu hamro lakshya ho!"
        : "About Hamro Tuition:\n\nWe are an online education platform providing courses from Class 8 to Master's level.\n\n> Expert teachers\n> Affordable prices\n> Lifetime access\n> Certificates\n> Nepali and English medium\n\nOur mission is to bring quality education across Nepal!",

      recommend: null,

      unknown: isNepali
        ? "Ma bujhina tapakai kura.\n\nKripaya aru word ma lekhnus ya yo options ma click garnus:\n- course  Course ko lagi\n- payment  Payment ko lagi\n- help  Help ko lagi\n- enroll  Enrollment ko lagi"
        : "I did not quite understand that.\n\nTry rephrasing or use these options:\n- course  For course info\n- payment  For payment help\n- help  For support\n- enroll  For enrollment",
    };

    return responses[intent] || responses.unknown;
  },
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [context, setContext] = useState({ lastIntent: null, conversationCount: 0, askedClass: false });
  const [feedbackMap, setFeedbackMap] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && messages.length === 0) setShowPopup(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      setTimeout(() => addBotMessage(AI.generateResponse('greeting', {}, 'neutral', 'en', {})), 500);
    }
    if (isOpen) {
      setShowPopup(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const addBotMessage = (text, extra = null) => {
    setIsTyping(true);
    const delay = 600 + Math.random() * 1000 + (text.length > 200 ? 500 : 0);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text, extra, time: new Date(), id: Date.now() }]);
      setIsTyping(false);
    }, delay);
  };

  const fetchCourseRecommendations = async (cls) => {
    try {
      const { data } = await courseAPI.getAll();
      const allCourses = Array.isArray(data) ? data : [];
      const c = cls.toLowerCase();
      let filtered = [];
      if (c.includes('8') || c.includes('9') || c.includes('10') || c.includes('school')) filtered = allCourses.filter(x => x.category === 'School');
      else if (c.includes('11') || c.includes('12') || c.includes('+2') || c.includes('plus2')) filtered = allCourses.filter(x => x.category === 'Plus2');
      else if (c.includes('bachelor') || c.includes('bbs') || c.includes('bba') || c.includes('bsc')) filtered = allCourses.filter(x => x.category === 'Bachelor');
      else if (c.includes('master') || c.includes('mba') || c.includes('msc')) filtered = allCourses.filter(x => x.category === 'Master');
      else if (c.includes('aayog') || c.includes('loksewa')) filtered = allCourses.filter(x => x.category === 'Aayog');
      if (filtered.length === 0) filtered = allCourses.slice(0, 4);
      return filtered;
    } catch { return []; }
  };

  const processMessage = async (text) => {
    const lang = AI.detectLanguage(text);
    const sentiment = AI.detectSentiment(text);
    const entities = AI.extractEntities(text);
    const intent = AI.detectIntent(text);

    const newCtx = { ...context, lastIntent: intent, conversationCount: context.conversationCount + 1 };
    setContext(newCtx);

    if (intent === 'course_list' || intent === 'recommend' || entities.classNum || entities.level) {
      setShowClassSelect(true);
      const responseText = AI.generateResponse('course_list', entities, sentiment, lang, newCtx);
      addBotMessage(responseText, { type: 'classSelect' });
      return;
    }

    if (intent === 'help') {
      const responseText = AI.generateResponse('help', entities, sentiment, lang, newCtx);
      addBotMessage(responseText, { type: 'helpOptions' });
      return;
    }

    const responseText = AI.generateResponse(intent, entities, sentiment, lang, newCtx);
    addBotMessage(responseText);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userText, time: new Date() }]);
    setInput('');
    processMessage(userText);
  };

  const handleQuickReply = (value) => {
    setMessages(prev => [...prev, { type: 'user', text: value, time: new Date() }]);
    processMessage(value);
  };

  const handleClassSelect = (cls) => {
    setMessages(prev => [...prev, { type: 'user', text: cls, time: new Date() }]);
    setShowClassSelect(false);
    fetchCourseRecommendations(cls).then(courses => {
      if (courses.length > 0) {
        const lang = AI.detectLanguage(cls);
        addBotMessage(
          lang === 'ne'
            ? `Dammi ${cls}! 🎉 Tapailai ${cls} ko lagi yo courses recommend garxu:`
            : `Great choice! 🎉 Here are my recommendations for ${cls}:`,
          { type: 'courses', data: courses }
        );
      } else {
        addBotMessage(`Sorry, no courses found for ${cls}. Check our courses page! 📚`);
      }
    });
  };

  const handleHelpOption = (value) => {
    setMessages(prev => [...prev, { type: 'user', text: value, time: new Date() }]);
    processMessage(value);
  };

  const handleFeedback = (msgId, type) => {
    setFeedbackMap(prev => ({ ...prev, [msgId]: type }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <AnimatePresence>
        {showPopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-[260px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 animate-bounce">
                <FiMessageSquare className="text-white text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Need help? 🤔</p>
                <p className="text-xs text-gray-500 mt-0.5">Ask me anything! Ma Nepali ma pani bujhinchu.</p>
              </div>
            </div>
            <button onClick={() => setShowPopup(false)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100">
              <FiX className="text-gray-400 text-xs" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            style={{ height: '540px', maxHeight: 'calc(100vh - 8rem)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
                  <FiMessageSquare className="text-white text-lg" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Hamro Tuition AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-blue-200 text-xs">AI Online • Nepali & English</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <FiMinimize2 className="text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {msg.type === 'bot' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiMessageSquare className="text-blue-600 text-[10px]" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">AI Assistant</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                    }`}>
                      {msg.text}

                      {msg.extra?.type === 'classSelect' && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {classOptions.map(cls => (
                            <button key={cls} onClick={() => handleClassSelect(cls)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                              {cls}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.extra?.type === 'courses' && (
                        <div className="space-y-2 mt-2">
                          {msg.extra.data.map(course => (
                            <a key={course._id} href={`/course/${course._id}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">📚</span>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-900 truncate">{course.title}</p>
                                <p className="text-[10px] text-gray-500">{course.category} • {course.lessons?.length || 0} lessons</p>
                                <p className="text-[10px] text-blue-600 font-bold">Rs. {course.price?.toLocaleString()}</p>
                              </div>
                            </a>
                          ))}
                          <a href="/courses" target="_blank" rel="noopener noreferrer"
                            className="block text-center text-xs text-blue-600 font-medium hover:underline py-1">
                            View All Courses →
                          </a>
                        </div>
                      )}

                      {msg.extra?.type === 'helpOptions' && (
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {helpOptions.map(opt => (
                            <button key={opt.value} onClick={() => handleHelpOption(opt.value)}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left border border-blue-100">
                              <span className="text-sm">{opt.icon}</span>
                              <span className="text-xs font-medium text-blue-700">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {msg.type === 'bot' && !msg.extra && (
                      <div className="flex items-center gap-2 mt-1 ml-7">
                        <span className="text-[10px] text-gray-400">{formatTime(msg.time)}</span>
                        <button onClick={() => handleFeedback(msg.id, 'up')}
                          className={`p-0.5 rounded transition-colors ${feedbackMap[msg.id] === 'up' ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                          <FiThumbsUp className="text-[10px]" />
                        </button>
                        <button onClick={() => handleFeedback(msg.id, 'down')}
                          className={`p-0.5 rounded transition-colors ${feedbackMap[msg.id] === 'down' ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}`}>
                          <FiThumbsDown className="text-[10px]" />
                        </button>
                      </div>
                    )}
                    {msg.type === 'user' && (
                      <p className="text-[10px] text-gray-400 mt-1 text-right">{formatTime(msg.time)}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiMessageSquare className="text-blue-600 text-[10px]" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">AI is thinking...</span>
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && !isTyping && (
              <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 flex-wrap flex-shrink-0">
                {quickReplies.map(qr => (
                  <button key={qr.value} onClick={() => handleQuickReply(qr.value)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <a href="https://wa.me/9779843684295" target="_blank" rel="noopener noreferrer"
                  className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex-shrink-0" title="WhatsApp">
                  <FiPhone className="text-sm" />
                </a>
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress} placeholder="Type message (English/Nepali)..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all" />
                <button onClick={sendMessage} disabled={!input.trim()}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                  <FiSend className="text-sm" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-blue-500/30'
        }`}
      >
        {isOpen ? <FiX className="text-white text-xl" /> : (
          <>
            <FiMessageSquare className="text-white text-xl" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center animate-pulse">1</span>
          </>
        )}
      </motion.button>
    </>
  );
};

export default Chatbot;
