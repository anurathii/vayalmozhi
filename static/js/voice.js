/* ============================================================
   VayalMozhi — Voice Guidance Module (Tamil + English)
   ============================================================ */

const Voice = (() => {
  let recognition = null;
  let synth = window.speechSynthesis;
  let isListening = false;
  let currentLang = 'en-IN';
  let audioEnabled = true;
  let initialized = false;

  // All translatable element IDs
  const translatableIds = [
    'voice-page-title', 'voice-page-desc', 'voice-lang-label',
    'voice-audio-label', 'voice-tap-label', 'mic-status',
    'voice-transcript-label', 'voice-response-label',
    'voice-tips-title'
  ];

  // Knowledge base for voice responses
  const knowledgeBase = {
    en: {
      greetings: [
        "Hello! Welcome to VayalMozhi. How can I help you today?",
        "Greetings! I am your agriculture assistant. Ask me anything about farming.",
      ],
      prices: "You can check the latest market prices on the Market Prices page. We track prices for over 15 crops across major markets in Tamil Nadu. Would you like me to take you there?",
      disease: "You can detect crop diseases by uploading a photo on the Disease Detection page. We will analyze the image and provide both organic and chemical treatment options. Would you like to try it?",
      schemes: "We have information about 8 major government schemes for farmers including PM-KISAN, PMFBY, and Soil Health Card. Visit the Schemes page for complete details, eligibility criteria, and application links.",
      marketplace: "The VayalMozhi Marketplace lets you buy and sell livestock, seeds, fertilizers, and agricultural machinery. You can list your products for free and connect with buyers across Tamil Nadu.",
      paddy: "Paddy is one of the most important crops in Tamil Nadu. Current prices range from 2200 to 2450 rupees per quintal depending on the variety and market. Samba paddy is priced at approximately 2200 rupees in Thanjavur market.",
      fertilizer: "For paddy cultivation, a balanced NPK fertilizer with ratio 17-17-17 is recommended. Apply 150 kg of urea, 50 kg of DAP, and 50 kg of MOP per hectare. Organic alternatives include vermicompost at 5 tonnes per hectare.",
      blast: "Rice blast is caused by the fungus Magnaporthe oryzae. Symptoms include diamond-shaped lesions on leaves. For organic treatment, use Trichoderma harzianum. For chemical treatment, spray Tricyclazole at 0.6g per liter of water.",
      blight: "Bacterial leaf blight appears as water-soaked lesions turning yellow. Organic treatment includes neem oil spray at 5ml per liter. Chemical treatment involves Streptocycline at 500 ppm concentration.",
      navigation: {
        marketplace: "Taking you to the Marketplace page.",
        prices: "Taking you to the Market Prices page.",
        disease: "Taking you to the Disease Detection page.",
        schemes: "Taking you to the Government Schemes page.",
        home: "Taking you to the Home page.",
        voice: "You are already on the Voice Assistance page."
      },
      fallback: "I understand you are asking about farming. Could you please rephrase your question? You can ask about market prices, crop diseases, government schemes, or the marketplace."
    },
    ta: {
      greetings: [
        "வணக்கம்! VayalMozhi-க்கு வரவேற்கிறோம். நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        "வணக்கம்! நான் உங்கள் விவசாய உதவியாளர். விவசாயம் பற்றி எதையும் கேளுங்கள்.",
      ],
      prices: "சந்தை விலைகள் பக்கத்தில் சமீபத்திய விலைகளை பார்க்கலாம். தமிழ்நாட்டின் முக்கிய சந்தைகளில் 15-க்கும் மேற்பட்ட பயிர்களின் விலைகளை நாங்கள் கண்காணிக்கிறோம். நான் உங்களை அங்கு அழைத்துச் செல்லட்டுமா?",
      disease: "பயிர் நோய்களை கண்டறிய, நோய் கண்டறிதல் பக்கத்தில் ஒரு புகைப்படத்தை பதிவேற்றலாம். நாங்கள் படத்தை ஆராய்ந்து இயற்கை மற்றும் இரசாயன சிகிச்சை விருப்பங்களை வழங்குவோம்.",
      schemes: "PM-KISAN, PMFBY, மண் சுகாதார அட்டை உள்ளிட்ட 8 முக்கிய அரசு திட்டங்கள் பற்றிய தகவல்கள் உள்ளன. முழு விவரங்கள், தகுதி அளவுகோல்கள் மற்றும் விண்ணப்ப இணைப்புகளுக்கு திட்டங்கள் பக்கத்தைப் பாருங்கள்.",
      marketplace: "VayalMozhi சந்தையில் கால்நடைகள், விதைகள், உரங்கள் மற்றும் விவசாய இயந்திரங்களை வாங்கவும் விற்கவும் முடியும். உங்கள் பொருட்களை இலவசமாக பட்டியலிடலாம் மற்றும் தமிழ்நாடு முழுவதும் உள்ள வாங்குபவர்களுடன் தொடர்பு கொள்ளலாம்.",
      paddy: "நெல் தமிழ்நாட்டின் மிக முக்கியமான பயிர்களில் ஒன்றாகும். தற்போதைய விலைகள் வகை மற்றும் சந்தையைப் பொறுத்து குவிண்டாலுக்கு 2200 முதல் 2450 ரூபாய் வரை உள்ளன. தஞ்சாவூர் சந்தையில் சம்பா நெல் தோராயமாக 2200 ரூபாய்க்கு விலை நிர்ணயிக்கப்பட்டுள்ளது.",
      fertilizer: "நெல் சாகுபடிக்கு, 17-17-17 விகிதத்தில் சமநிலை NPK உரம் பரிந்துரைக்கப்படுகிறது. ஹெக்டேருக்கு 150 கிலோ யூரியா, 50 கிலோ DAP மற்றும் 50 கிலோ MOP இடவும். இயற்கை மாற்றாக ஹெக்டேருக்கு 5 டன் மண்புழு உரம் பயன்படுத்தலாம்.",
      blast: "நெல் ப்ளாஸ்ட் நோய் Magnaporthe oryzae என்ற பூஞ்சையால் ஏற்படுகிறது. இலைகளில் வைர வடிவ புள்ளிகள் அறிகுறியாகும். இயற்கை சிகிச்சைக்கு Trichoderma harzianum பயன்படுத்தவும். இரசாயன சிகிச்சைக்கு ஒரு லிட்டர் தண்ணீருக்கு 0.6 கிராம் Tricyclazole தெளிக்கவும்.",
      blight: "பாக்டீரியா இலைக் கருகல் நோய் மஞ்சள் நிறமாக மாறும் நீர் ஊறிய புள்ளிகளாக தோன்றும். இயற்கை சிகிச்சையாக ஒரு லிட்டருக்கு 5ml வேப்ப எண்ணெய் தெளிக்கவும். இரசாயன சிகிச்சையாக 500 ppm செறிவில் Streptocycline பயன்படுத்தவும்.",
      navigation: {
        marketplace: "உங்களை சந்தை பக்கத்திற்கு அழைத்துச் செல்கிறேன்.",
        prices: "உங்களை சந்தை விலைகள் பக்கத்திற்கு அழைத்துச் செல்கிறேன்.",
        disease: "உங்களை நோய் கண்டறிதல் பக்கத்திற்கு அழைத்துச் செல்கிறேன்.",
        schemes: "உங்களை அரசு திட்டங்கள் பக்கத்திற்கு அழைத்துச் செல்கிறேன்.",
        home: "உங்களை முகப்பு பக்கத்திற்கு அழைத்துச் செல்கிறேன்.",
        voice: "நீங்கள் ஏற்கனவே குரல் உதவி பக்கத்தில் இருக்கிறீர்கள்."
      },
      fallback: "நான் உங்கள் கேள்வியைப் புரிந்துகொள்கிறேன். தயவுசெய்து உங்கள் கேள்வியை மீண்டும் கேளுங்கள். சந்தை விலைகள், பயிர் நோய்கள், அரசு திட்டங்கள், அல்லது சந்தை பற்றி கேக்கலாம்."
    }
  };

  function init() {
    if (initialized) return;
    setupSpeechRecognition();
    setupEventListeners();
    initialized = true;
  }

  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const micBtn = document.getElementById('mic-btn');
      const micStatus = document.getElementById('mic-status');
      if (micStatus) micStatus.textContent = currentLang === 'ta-IN'
        ? 'இந்த உலாவியில் குரல் அடையாளம் ஆதரிக்கப்படவில்லை'
        : 'Speech recognition not supported in this browser';
      if (micBtn) micBtn.disabled = true;
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = currentLang;

    recognition.onstart = () => {
      isListening = true;
      const micBtn = document.getElementById('mic-btn');
      const micStatus = document.getElementById('mic-status');
      if (micBtn) micBtn.classList.add('recording');
      if (micStatus) micStatus.textContent = currentLang === 'ta-IN' ? 'கேட்கிறேன்...' : 'Listening...';
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const transcriptEl = document.getElementById('voice-transcript');
      if (transcriptEl) transcriptEl.textContent = transcript;

      // Process final result
      if (event.results[event.results.length - 1].isFinal) {
        processVoiceInput(transcript.toLowerCase().trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopListening();
      
      const micStatus = document.getElementById('mic-status');
      if (event.error === 'no-speech') {
        if (micStatus) micStatus.textContent = currentLang === 'ta-IN'
          ? 'பேச்சு கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'No speech detected. Try again.';
      } else if (event.error === 'not-allowed') {
        if (micStatus) micStatus.textContent = currentLang === 'ta-IN'
          ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது.'
          : 'Microphone access denied. Please allow microphone access.';
      } else {
        if (micStatus) micStatus.textContent = currentLang === 'ta-IN'
          ? 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
          : 'Error occurred. Click to try again.';
      }
    };

    recognition.onend = () => {
      stopListening();
    };

    // Sync initial language from I18n if available
    if (typeof I18n !== 'undefined') {
      const lang = I18n.getLang();
      setLanguage(lang === 'ta' ? 'ta-IN' : 'en-IN');
    }

    // Listen for global language changes
    window.addEventListener('languageChanged', (e) => {
      setLanguage(e.detail === 'ta' ? 'ta-IN' : 'en-IN');
    });
  }

  function setupEventListeners() {
    // Mic button
    const micBtn = document.getElementById('mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', toggleListening);
    }

    // Language buttons
    const langEn = document.getElementById('lang-en');
    const langTa = document.getElementById('lang-ta');

    if (langEn) {
      langEn.addEventListener('click', () => {
        setLanguage('en-IN');
        respond("Language switched to English.");
      });
    }

    if (langTa) {
      langTa.addEventListener('click', () => {
        setLanguage('ta-IN');
        respond("மொழி தமிழுக்கு மாற்றப்பட்டது. இப்போது நீங்கள் தமிழில் பேசலாம்.");
      });
    }

    // Audio toggle
    const audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        audioToggle.classList.toggle('active', audioEnabled);
      });
    }

    // Tip cards — handle both languages
    document.querySelectorAll('.voice-tip-card').forEach(card => {
      card.addEventListener('click', () => {
        const isTamil = currentLang === 'ta-IN';
        const tip = isTamil ? (card.getAttribute('data-tip-ta') || card.getAttribute('data-tip')) : card.getAttribute('data-tip');
        const transcriptEl = document.getElementById('voice-transcript');
        if (transcriptEl) transcriptEl.textContent = tip;
        processVoiceInput(tip.toLowerCase());
      });
    });
  }

  function setLanguage(langCode) {
    currentLang = langCode;
    const isTa = langCode.startsWith('ta');
    const uilang = isTa ? 'ta' : 'en';

    // Update buttons
    const langEn = document.getElementById('lang-en');
    const langTa = document.getElementById('lang-ta');
    if (langEn) langEn.classList.toggle('neo-btn-primary', !isTa);
    if (langTa) langTa.classList.toggle('neo-btn-primary', isTa);

    if (recognition) recognition.lang = currentLang;
    switchUILanguage(uilang);
  }

  /**
   * Switch all UI labels between English and Tamil
   */
  function switchUILanguage(lang) {
    const attr = lang === 'ta' ? 'data-ta' : 'data-en';

    // Switch all labeled elements
    translatableIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const text = el.getAttribute(attr);
        if (text) el.textContent = text;
      }
    });

    // Switch voice transcript and response placeholders (only if showing default text)
    const transcript = document.getElementById('voice-transcript');
    const response = document.getElementById('voice-response');
    
    if (transcript) {
      const defaultEn = transcript.getAttribute('data-en');
      const defaultTa = transcript.getAttribute('data-ta');
      const currentText = transcript.textContent.trim();
      if (currentText === defaultEn || currentText === defaultTa) {
        transcript.textContent = lang === 'ta' ? defaultTa : defaultEn;
      }
    }
    
    if (response) {
      const defaultEn = response.getAttribute('data-en');
      const defaultTa = response.getAttribute('data-ta');
      const currentText = response.textContent.trim();
      if (currentText === defaultEn || currentText === defaultTa) {
        response.textContent = lang === 'ta' ? defaultTa : defaultEn;
      }
    }

    // Switch tip card texts
    document.querySelectorAll('.voice-tip-card span[data-en]').forEach(span => {
      const text = span.getAttribute(attr);
      if (text) span.textContent = text;
    });
  }

  function toggleListening() {
    if (isListening) {
      if (recognition) recognition.stop();
    } else {
      startListening();
    }
  }

  function startListening() {
    if (!recognition) {
      const msg = currentLang === 'ta-IN'
        ? 'இந்த உலாவியில் குரல் அடையாளம் கிடைக்கவில்லை.'
        : 'Speech recognition is not available in this browser.';
      App.notify(currentLang === 'ta-IN' ? 'ஆதரிக்கப்படவில்லை' : 'Not Supported', msg, 'error');
      return;
    }

    // Stop any ongoing speech
    synth.cancel();

    try {
      recognition.lang = currentLang;
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }

  function stopListening() {
    isListening = false;
    const micBtn = document.getElementById('mic-btn');
    const micStatus = document.getElementById('mic-status');
    if (micBtn) micBtn.classList.remove('recording');
    if (micStatus) {
      const currentText = micStatus.textContent;
      const listenTexts = ['Listening...', 'கேட்கிறேன்...'];
      if (listenTexts.includes(currentText)) {
        const attr = currentLang === 'ta-IN' ? 'data-ta' : 'data-en';
        micStatus.textContent = micStatus.getAttribute(attr) || 'Click to start listening';
      }
    }
  }

  function processVoiceInput(text) {
    const isTamil = currentLang === 'ta-IN';
    const kb = isTamil ? knowledgeBase.ta : knowledgeBase.en;
    let response = '';

    if (isTamil) {
      // Tamil language processing
      if (text.includes('விலை') || text.includes('சந்தை') || text.includes('rate') || text.includes('price')) {
        if (text.includes('நெல்') || text.includes('paddy')) {
          response = kb.paddy;
        } else {
          response = kb.prices;
          setTimeout(() => { window.location.hash = 'prices'; }, 2500);
        }
      } else if (text.includes('நோய்') || text.includes('பாதிப்பு') || text.includes('disease') || text.includes('detect')) {
        if (text.includes('ப்ளாஸ்ட்') || text.includes('blast')) {
          response = kb.blast;
        } else if (text.includes('கருகல்') || text.includes('blight')) {
          response = kb.blight;
        } else {
          response = kb.disease;
          setTimeout(() => { window.location.hash = 'disease'; }, 2500);
        }
      } else if (text.includes('திட்ட') || text.includes('அரசு') || text.includes('scheme') || text.includes('kisan')) {
        response = kb.schemes;
        setTimeout(() => { window.location.hash = 'schemes'; }, 2500);
      } else if (text.includes('வாங்க') || text.includes('விற்க') || text.includes('marketplace') || text.includes('சந்தை')) {
        response = kb.navigation.marketplace + ' ' + kb.marketplace;
        setTimeout(() => { window.location.hash = 'marketplace'; }, 2000);
      } else if (text.includes('உரம்') || text.includes('fertilizer') || text.includes('சாகுபடி')) {
        response = kb.fertilizer;
      } else if (text.includes('வணக்கம்') || text.includes('உதவி') || text.includes('hello') || text.includes('help')) {
        response = kb.greetings[Math.floor(Math.random() * kb.greetings.length)];
      } else if (text.includes('செல்') || text.includes('navigate') || text.includes('go to') || text.includes('போ')) {
        const navMap = {
          'முகப்பு': 'home', 'home': 'home',
          'சந்தை': 'marketplace', 'marketplace': 'marketplace',
          'விலை': 'prices', 'prices': 'prices',
          'நோய்': 'disease', 'disease': 'disease',
          'திட்ட': 'schemes', 'schemes': 'schemes',
          'குரல்': 'voice', 'voice': 'voice'
        };
        let navigated = false;
        for (const [keyword, target] of Object.entries(navMap)) {
          if (text.includes(keyword)) {
            response = kb.navigation[target] || `${target} பக்கத்திற்குச் செல்கிறேன்.`;
            setTimeout(() => { window.location.hash = target; }, 1500);
            navigated = true;
            break;
          }
        }
        if (!navigated) response = kb.fallback;
      } else {
        response = kb.fallback;
      }
    } else {
      // English language processing
      if (text.includes('marketplace') || text.includes('market place') || text.includes('buy') || text.includes('sell')) {
        if (text.includes('price') || text.includes('rate')) {
          response = kb.prices;
          setTimeout(() => { window.location.hash = 'prices'; }, 2000);
        } else {
          response = kb.navigation.marketplace + ' ' + kb.marketplace;
          setTimeout(() => { window.location.hash = 'marketplace'; }, 2000);
        }
      } else if (text.includes('price') || text.includes('rate') || text.includes('cost')) {
        if (text.includes('paddy') || text.includes('rice')) {
          response = kb.paddy;
        } else {
          response = kb.prices;
        }
      } else if (text.includes('disease') || text.includes('detect') || text.includes('sick') || text.includes('infection')) {
        if (text.includes('blast')) {
          response = kb.blast;
        } else if (text.includes('blight')) {
          response = kb.blight;
        } else {
          response = kb.disease;
        }
      } else if (text.includes('scheme') || text.includes('government') || text.includes('subsidy') || text.includes('kisan')) {
        response = kb.schemes;
        setTimeout(() => { window.location.hash = 'schemes'; }, 2000);
      } else if (text.includes('fertilizer') || text.includes('manure') || text.includes('nutrient')) {
        response = kb.fertilizer;
      } else if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('help')) {
        response = kb.greetings[Math.floor(Math.random() * kb.greetings.length)];
      } else if (text.includes('go to') || text.includes('navigate') || text.includes('open') || text.includes('show')) {
        const navTargets = ['home', 'marketplace', 'prices', 'disease', 'schemes', 'voice'];
        let navigated = false;
        for (const target of navTargets) {
          if (text.includes(target)) {
            response = kb.navigation[target] || `Taking you to ${target}.`;
            setTimeout(() => { window.location.hash = target; }, 1500);
            navigated = true;
            break;
          }
        }
        if (!navigated) response = kb.fallback;
      } else if (text.includes('organic') || text.includes('treatment') || text.includes('cure')) {
        if (text.includes('blight')) {
          response = kb.blight;
        } else if (text.includes('blast')) {
          response = kb.blast;
        } else {
          response = kb.disease;
        }
      } else {
        response = kb.fallback;
      }
    }

    respond(response);
  }

  function respond(text) {
    const responseEl = document.getElementById('voice-response');
    if (responseEl) responseEl.textContent = text;

    if (audioEnabled && text) {
      speak(text);
    }
  }

  function speak(text) {
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Find best matching voice
    const voices = synth.getVoices();
    let voice = null;
    
    if (currentLang.startsWith('ta')) {
      // Prioritize Google Tamil or any TA voice
      voice = voices.find(v => v.lang === 'ta-IN' || v.lang === 'ta_IN') || 
              voices.find(v => v.lang.startsWith('ta'));
    } else {
      voice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en-GB') || 
              voices.find(v => v.lang.startsWith('en'));
    }

    if (voice) utterance.voice = voice;
    
    // Fallback if synth isn't ready
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = synth.getVoices();
        const fallbackVoice = updatedVoices.find(v => v.lang.startsWith(currentLang.split('-')[0]));
        if (fallbackVoice) utterance.voice = fallbackVoice;
        synth.speak(utterance);
      };
    } else {
      synth.speak(utterance);
    }
  }

  return { init, setLanguage };
})();

// Pre-load voices
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
