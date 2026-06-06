import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock, FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
  FiHelpCircle, FiBarChart2, FiRefreshCw, FiAward, FiBookOpen,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { studentAPI } from '../../utils/api';

const Quiz = () => {
  const [view, setView] = useState('list');
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMCQs = async () => {
      try {
        const { data } = await studentAPI.getMyCourses();
        const courses = Array.isArray(data) ? data : data?.courses || [];
        const list = [];
        courses.forEach(c => {
          (c.chapters || []).forEach((ch, chIdx) => {
            if (ch.mcqs?.length > 0) {
              list.push({
                _id: `quiz-${c._id}-${chIdx}`,
                courseId: c._id,
                courseTitle: c.title,
                chapterName: ch.name || `Chapter ${chIdx + 1}`,
                title: `${c.title} - ${ch.name || `Chapter ${chIdx + 1}`}`,
                questionsCount: ch.mcqs.length,
                mcqs: ch.mcqs,
                timeLimit: Math.ceil(ch.mcqs.length * 2),
              });
            }
          });
        });
        setQuizzes(list);
      } catch {}
    };
    fetchMCQs();
  }, []);

  useEffect(() => {
    let timer;
    if (view === 'active' && timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, submitted]);

  const startQuiz = async (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setLoading(true);

    const qs = quiz.mcqs.map((m, i) => ({
      _id: `mcq-${i}`,
      text: m.question,
      options: m.options,
      correct: m.correctAnswer,
    }));
    setQuestions(qs);

    setTimeLeft((quiz.timeLimit || 10) * 60);
    setView('active');
    setLoading(false);
  };

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    let correct = 0;
    questions.forEach((q) => {
      if (answers[q._id] === q.correct) correct++;
    });
    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    setResults({
      correct,
      total,
      percentage,
      details: questions.map((q) => ({
        ...q,
        userAnswer: answers[q._id],
        isCorrect: answers[q._id] === q.correct,
      })),
    });

    try {
      await studentAPI.submitQuiz({
        quizId: activeQuiz?._id,
        answers,
        score: correct,
        total,
      });
    } catch {}

    if (correct === total) {
      toast.success('Perfect score! Outstanding!');
    } else if (percentage >= 60) {
      toast.success(`You scored ${percentage}%!`);
    } else {
      toast('Keep practicing, you can do better!');
    }
  }, [answers, questions, submitted, activeQuiz]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleBackToList = () => {
    setView('list');
    setActiveQuiz(null);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setTimeLeft(0);
  };

  if (view === 'list') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-500 text-sm mt-1">Test your knowledge after each lesson</p>
        </div>

        {!quizzes.length ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
              <FiHelpCircle className="text-blue-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Quizzes Available</h3>
            <p className="text-sm text-gray-500">Complete lessons to unlock quizzes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz, i) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{quiz.courseTitle}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{quiz.chapterName} &middot; {quiz.questionsCount} MCQs</p>
                  </div>
                  <Link
                    to={`/dashboard/student/course/${quiz.courseId}/lesson/${quiz.courseId}`}
                    className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                  >
                    <FiBookOpen className="text-blue-600" />
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <FiBarChart2 /> {quiz.questionsCount} questions
                  </span>
                  {quiz.timeLimit && (
                    <span className="flex items-center gap-1">
                      <FiClock /> {quiz.timeLimit} min
                    </span>
                  )}
                </div>
                <button
                  onClick={() => startQuiz(quiz)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20"
                >
                  Start Quiz
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted && results) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm text-center"
        >
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            results.percentage >= 60 ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            <FiAward className={`text-3xl ${results.percentage >= 60 ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h2>
          <p className="text-gray-500 text-sm mb-6">{activeQuiz?.title}</p>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div>
              <div className="text-4xl font-bold text-blue-600">{results.percentage}%</div>
              <p className="text-xs text-gray-500 mt-1">Score</p>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{results.correct}/{results.total}</div>
              <p className="text-xs text-gray-500 mt-1">Correct</p>
            </div>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                results.percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                results.percentage >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                'bg-gradient-to-r from-orange-400 to-red-500'
              }`}
              style={{ width: `${results.percentage}%` }}
            />
          </div>

          <div className="space-y-3 mb-6 text-left">
            {results.details.map((q, i) => (
              <div key={q._id} className={`p-4 rounded-xl border ${
                q.isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {q.isCorrect
                      ? <FiCheckCircle className="text-green-500" />
                      : <FiXCircle className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">{q.text}</p>
                    <p className="text-xs text-gray-500">
                      {q.isCorrect
                        ? `Correct answer: ${q.options[q.correct]}`
                        : `Your answer: ${q.options[q.userAnswer] !== undefined ? q.options[q.userAnswer] : 'None'} | Correct: ${q.options[q.correct]}`
                      }
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${q.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {q.isCorrect ? '+1' : '+0'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleBackToList}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20"
          >
            Back to Quizzes
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <FiArrowLeft /> Back to Quizzes
          </button>
          <h1 className="text-xl font-bold text-gray-900">{activeQuiz?.title}</h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
          timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'
        }`}>
          <FiClock className={timeLeft < 60 ? 'text-red-500' : ''} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-gray-500">
            Question {currentQ + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentQ ? 'bg-blue-600 scale-125' :
                  answers[questions[i]?._id] !== undefined ? 'bg-blue-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {questions[currentQ]?.text}
            </h2>

            <div className="space-y-3">
              {questions[currentQ]?.options.map((option, oi) => {
                const isSelected = answers[questions[currentQ]._id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(questions[currentQ]._id, oi)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm font-medium ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-400'
                      }`}>
                        {String.fromCharCode(65 + oi)}
                      </div>
                      <span className="text-sm">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiArrowLeft /> Previous
        </button>

        {currentQ < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/20"
          >
            Next <FiArrowRight />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-600/20"
          >
            <FiCheckCircle /> Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
