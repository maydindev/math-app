'use client';
import { useEffect, useRef, useState } from 'react';

const SpeechRecognition = typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const operations = ['+', '-', '*', '/'];

export default function MentalMathGame() {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operation, setOperation] = useState('+');
  const [selectedOperation, setSelectedOperation] = useState('random');
  const [answer, setAnswer] = useState('');
  const [correct, setCorrect] = useState(null);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [enableVoice, setEnableVoice] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [difficulty, setDifficulty] = useState(1);

  const inputRef = useRef(null);
  const countdownRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const answeredRef = useRef(false); // cevap verildi mi

  const maxSecond = customTime;

  useEffect(() => {
    if (!started) return;

    inputRef.current?.focus();
    answeredRef.current = false;

    const timeout = setTimeout(() => {
      if (!answeredRef.current) {
        handleAnswer();
      }
    }, maxSecond * 1000);
    timeoutIdRef.current = timeout;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
        }
        return prev - 1;
      });
    }, 1000);

    if (enableVoice) {
      startListening();
    }

    return () => {
      clearTimeout(timeoutIdRef.current);
      clearInterval(countdownRef.current);
    };
  }, [num1, num2, operation, started, enableVoice]);

  const generateNumbers = () => {
    const newOperation = selectedOperation === 'random'
      ? operations[Math.floor(Math.random() * operations.length)]
      : selectedOperation;

    let a, b;
    const maxNumber = Math.pow(10, difficulty) - 1;

    switch (newOperation) {
      case '+':
        a = Math.floor(Math.random() * maxNumber);
        b = Math.floor(Math.random() * maxNumber);
        break;
      case '-':
        a = Math.floor(Math.random() * maxNumber);
        b = Math.floor(Math.random() * a);
        break;
      case '*':
        a = Math.floor(Math.random() * (maxNumber / 10));
        b = Math.floor(Math.random() * (maxNumber / 10));
        break;
      case '/':
        b = Math.floor(Math.random() * (maxNumber / 10)) + 1;
        const result = Math.floor(Math.random() * (maxNumber / 10));
        a = b * result;
        break;
    }

    setNum1(a);
    setNum2(b);
    setOperation(newOperation);
    setAnswer('');
    setCorrect(null);
    setCountdown(customTime && !isNaN(customTime) && customTime > 0 ? parseInt(customTime, 10) : maxSecond);
  };

  const handleStart = () => {
    setStarted(true);
    generateNumbers();
  };

  const handleAnswer = () => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const userAnswer = parseInt(answer, 10);
    let correctAnswer;

    switch (operation) {
      case '+':
        correctAnswer = num1 + num2;
        break;
      case '-':
        correctAnswer = num1 - num2;
        break;
      case '*':
        correctAnswer = num1 * num2;
        break;
      case '/':
        correctAnswer = num1 / num2;
        break;
    }

    const isCorrect = userAnswer === correctAnswer;
    setCorrect(isCorrect);

    setTimeout(() => {
      generateNumbers();
    }, 3000);
  };

  const handleEndGame = () => {
    clearTimeout(timeoutIdRef.current);
    clearInterval(countdownRef.current);
    setStarted(false);
    setNum1(0);
    setNum2(0);
    setOperation('');
    setAnswer('');
    setCorrect(null);
    setCountdown(5);
  };

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const cleaned = transcript.replace(/\D/g, '');
      if (cleaned) {
        setAnswer(cleaned);
        setTimeout(() => {
          handleAnswer();
        }, 500);
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice error:', event.error);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-r from-blue-100 to-indigo-200">
      <h1 className="text-3xl font-bold mb-6 text-indigo-800">Dört İşlem Oyunu</h1>

      {!started ? (
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-4">
            <label htmlFor="operationSelect" className="text-black font-medium">İşlem Türü:</label>
            <select
              id="operationSelect"
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="random">Karışık</option>
              <option value="+">Toplama</option>
              <option value="-">Çıkarma</option>
              <option value="*">Çarpma</option>
              <option value="/">Bölme</option>
            </select>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label htmlFor="difficultySelect" className="text-black font-medium">Zorluk Seviyesi:</label>
            <select
              id="difficultySelect"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="p-2 border rounded text-sm"
            >
              <option value={1}>Kolay (1 haneli)</option>
              <option value={2}>Orta (2 haneli)</option>
              <option value={3}>Zor (3 haneli)</option>
              <option value={4}>Çok Zor (4 haneli)</option>
            </select>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label htmlFor="customTime" className="text-black font-medium">Süre (saniye):</label>
            <input
              id="customTime"
              type="number"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="p-2 border rounded text-sm"
              min="1"
            />
          </div>

          <div className="flex items-center justify-center mb-4 gap-2">
            <label htmlFor="voice-toggle" className="text-black">🎤 Sesli Yanıt</label>
            <input
              id="voice-toggle"
              type="checkbox"
              checked={enableVoice}
              onChange={(e) => {
                const value = e.target.checked;
                setEnableVoice(value);
                if (value && SpeechRecognition) {
                  const testRecognition = new SpeechRecognition();
                  testRecognition.onstart = () => testRecognition.abort();
                  testRecognition.start();
                }
              }}
            />
          </div>

          <button
            onClick={handleStart}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Başla
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white shadow-xl rounded p-6 text-center">
          <div className="text-2xl font-semibold mb-4 text-indigo-700">
            {num1} {operation} {num2} = ?
          </div>

          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAnswer();
              }
            }}
            className="w-full px-4 py-2 border rounded mb-4 text-center text-lg"
          />

          <button
            onClick={handleAnswer}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Cevapla
          </button>

          <div className="mt-4 text-lg">
            {correct === true && <span className="text-green-600 font-bold">✅ Doğru!</span>}
            {correct === false && (
              <>
                <span className="text-red-600 font-bold">❌ Yanlış!</span>
                <div className="text-green-500 text-2xl font-bold">Doğru Cevap {/*num1*/} {/*operation*/} {/*num2*/} = {eval(`${num1} ${operation} ${num2}`)}</div>
              </>
            )}
          </div>

          <div className="mt-2 text-sm text-gray-600">
            ⏳ Kalan Süre: {countdown} saniye
          </div>

          <button
            onClick={handleEndGame}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Bitti
          </button>
        </div>
      )}
    </div>
  );
}
