"use client";

import React, { useState, useRef, useEffect } from "react";

const MathExercise = () => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const maxQuestions = 10;
  const maxSecond = 10;
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [countdown, setCountdown] = useState(maxSecond);
  const [operation, setOperation] = useState("karışık");
  const [currentOperation, setCurrentOperation] = useState("");
  const recognitionRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const countdownRef = useRef(null);
  const inputRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const turkceSayilariCoz = (text) => {
    const sayilar = {
      "bir": 1, "iki": 2, "üç": 3, "dört": 4, "beş": 5,
      "altı": 6, "yedi": 7, "sekiz": 8, "dokuz": 9,
      "on": 10, "sıfır": 0,
    };
    return sayilar[text.toLowerCase()] ?? NaN;
  };

  const askQuestion = () => {
    clearTimeout(timeoutIdRef.current);

    let n1, n2, selectedOperation;
    const operations = ["toplama", "çıkarma", "çarpma", "bölme"];

    selectedOperation = operation === "karışık"
      ? operations[Math.floor(Math.random() * operations.length)]
      : operation;

    switch (selectedOperation) {
      case "toplama":
        n1 = Math.floor(Math.random() * 10) + 1;
        n2 = Math.floor(Math.random() * 10) + 1;
        break;
      case "çıkarma":
        n1 = Math.floor(Math.random() * 10) + 1;
        n2 = Math.floor(Math.random() * 10) + 1;
        if (n2 > n1) [n1, n2] = [n2, n1];
        break;
      case "çarpma":
        n1 = Math.floor(Math.random() * 10) + 1;
        n2 = Math.floor(Math.random() * 10) + 1;
        break;
      case "bölme":
        n2 = Math.floor(Math.random() * 9) + 1;
        const temp = Math.floor(Math.random() * 10) + 1;
        n1 = n2 * temp;
        break;
    }

    setNum1(n1);
    setNum2(n2);
    setCurrentOperation(selectedOperation);
    setUserAnswer("");
    setMessage("");
    setCountdown(maxSecond);
  };

  const calculateAnswer = () => {
    switch (currentOperation) {
      case "toplama": return num1 + num2;
      case "çıkarma": return num1 - num2;
      case "çarpma": return num1 * num2;
      case "bölme": return num1 / num2;
      default: return NaN;
    }
  };

  const checkAnswer = (answerToCheck) => {
    const correctAnswer = calculateAnswer();
    const parsed = parseInt(answerToCheck);

    if (!answerToCheck) {
      setMessage(`⏰ Süre doldu. Cevap verilmedi. Doğru cevap: ${correctAnswer}`);
      endExercise();
      return;
    }

    if (!isNaN(parsed)) {
      if (parsed === correctAnswer) {
        const newScore = score + 1;
        setScore(newScore);
        if (questionCount + 1 < maxQuestions) {
          setQuestionCount((prev) => prev + 1);
          askQuestion();
        } else {
          setQuestionCount(maxQuestions);
          setMessage("🎉 Tebrikler! Tüm sorular tamamlandı.");
          setFinished(true);
          setStarted(false);
        }
      } else {
        setMessage(`❌ Yanlış cevap! Doğru cevap: ${correctAnswer}`);
        endExercise();
      }
    } else {
      setMessage(`❌ Geçersiz cevap: "${answerToCheck}"`);
      endExercise();
    }
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanımayı desteklemiyor.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.start();

    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript.trim();
      setSpokenText(spoken);

      let parsed = parseInt(spoken);
      if (isNaN(parsed)) {
        parsed = turkceSayilariCoz(spoken);
      }

      if (!isNaN(parsed)) {
        setUserAnswer(parsed.toString());
        checkAnswer(parsed.toString());
      } else {
        setMessage(`❌ Anlaşılamayan giriş: "${spoken}"`);
        endExercise();
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
        setMessage("🎤 Ses tanıma hatası: " + event.error);
        endExercise();
      }
    };
  };

  const endExercise = () => {
    setStarted(false);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    clearTimeout(timeoutIdRef.current);
    clearInterval(countdownRef.current);
  };

  const handleTimeout = () => {
    const currentValue = inputRef.current?.value;
    checkAnswer(currentValue);
  };

  const handleStart = () => {
    setScore(0);
    setQuestionCount(0);
    setFinished(false);
    setStarted(true);
    askQuestion();
  };

  const handleInputChange = (e) => {
    setUserAnswer(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      checkAnswer(userAnswer);
    }
  };

  useEffect(() => {
    if (!started) return;

    inputRef.current?.focus();

    const timeout = setTimeout(() => {
      handleTimeout();
    }, maxSecond*1000);
    timeoutIdRef.current = timeout;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownRef.current);
        }
        return prev - 1;
      });
    }, 1000);

    startListening();

    return () => {
      clearTimeout(timeout);
      clearInterval(countdownRef.current);
    };
  }, [num1, num2, started]);

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-gray-500 rounded-xl shadow-lg text-center">
      <h1 className="text-2xl font-bold text-orange-400 mb-4">Dört İşlem Alıştırması</h1>

      {!started && !finished && (
        <div className="mb-4">
          <label className="text-white mr-2">İşlem Türü:</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="px-2 py-1 rounded"
          >
            <option value="toplama">Toplama</option>
            <option value="çıkarma">Çıkarma</option>
            <option value="çarpma">Çarpma</option>
            <option value="bölme">Bölme</option>
            <option value="karışık">Karışık</option>
          </select>
        </div>
      )}

      {!started && (
        <button
          onClick={handleStart}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Başla
        </button>
      )}

      {started && (
        <div>
          {operation === "karışık" && (
            <p className="text-md font-semibold text-indigo-600 mb-2">
              🧠 Soru Türü: {currentOperation.charAt(0).toUpperCase() + currentOperation.slice(1)}
            </p>
          )}
          <p className="text-lg mb-2">{num1} {operationSymbol(currentOperation)} {num2} = ?</p>
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="border px-2 py-1 mb-2"
          />
          <p className="text-sm mt-5 text-white">
            🕔 {countdown} saniyeniz var. Cevabınızı sesli söyleyin veya yazın.
          </p>
        </div>
      )}

      <p className="mt-4 text-lg font-semibold">{message}</p>
      {started && <p className="mt-4 mb-4">Son Söylenen: "{spokenText}"</p>}
      {questionCount > 0 && (
        <p className="text-red-400 text-2xl mt-4 font-bold">
          Başarılı Sonuç: {questionCount}/{maxQuestions}
        </p>
      )}
    </div>
  );
};

// Yardımcı fonksiyon: işlem sembolünü getirir
const operationSymbol = (op) => {
  switch (op) {
    case "toplama": return "+";
    case "çıkarma": return "-";
    case "çarpma": return "×";
    case "bölme": return "÷";
    default: return "?";
  }
};

export default MathExercise;
