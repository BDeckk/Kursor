"use client";

import { useState } from "react";
import { questions } from "./question";
import Navbar from "@/components/homepage-navbar";
import { useRouter } from "next/navigation";

type RIASEC = "R" | "I" | "A" | "S" | "E" | "C";

export default function AssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const router = useRouter();

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const scores: Record<RIASEC, number> = {
      R: 0,
      I: 0,
      A: 0,
      S: 0,
      E: 0,
      C: 0,
    };

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer) {
        // Example scoring rule: gikan 1-5 ang 4 kay (Likely) and 5 (Very Likely) or "Yes"
        if (answer >= 4) {
          scores[q.category] += answer;
        }
      }
    });

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3).map(([letter]) => letter).join("");

    // Save both scores + top3
    localStorage.setItem('scores', JSON.stringify(scores));
    localStorage.setItem('riasecCode', top3);
    router.push('/result');
  };

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />
      
      <div className="flex flex-col items-center justify-center p-6 pt-30">
        {/* Assessment Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">
            ASSESSMENT <span className="text-yellow-400">TEST</span>
          </h1>
          
          {/* Progress Bar */}
          <div className="w-150 h-3 bg-gray-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
                <p className="text-xl font-medium text-black mb-8 text-center">
                  {currentQ.question}
                </p>
                <div className="flex justify-center items-center gap-8">
                  <span className="text-lg font-medium text-black">Unlikely</span>
                  
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <label key={num} className="flex flex-col items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="radio"
                            name={`question-${currentQ.id}`}
                            value={num}
                            checked={answers[currentQ.id] === num}
                            onChange={() => handleAnswer(currentQ.id, num)}
                            className="sr-only"
                          />
                          <div className={`w-8 h-8 rounded-full border-4 ${
                            answers[currentQ.id] === num 
                              ? 'bg-black border-black' 
                              : 'bg-white border-black'
                          }`} />
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <span className="text-lg font-medium text-black">Likely</span>
                </div>
            
            {/* Next Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
                className="bg-white text-black font-medium px-8 py-3 rounded-full hover:bg-black-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestion < questions.length - 1 ? 'Next' : 'Submit'}
              </button>
            </div>
          

        {/* Question Counter */}
        <div className="mt-6 text-gray-600">
          Question {currentQuestion + 1} of {questions.length}
        </div>
    </div>
    </div>
  );
}