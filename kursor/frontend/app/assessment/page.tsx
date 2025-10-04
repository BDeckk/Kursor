"use client";

import { useEffect, useState } from "react";
import { questions } from "./question";
import Navbar from "@/components/homepage-navbar";
import { useRouter } from "next/navigation";

type RIASEC = "R" | "I" | "A" | "S" | "E" | "C";

export default function AssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const router = useRouter();

  useEffect(() => {

    setCurrentQuestion(0);
    setAnswers({});
    
    localStorage.removeItem('scores');
    localStorage.removeItem('riasecCode');
  }, []);

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
        if (answer >= 4) {
          scores[q.category] += answer;
        }
      }
    });

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3).map(([letter]) => letter).join("");

    localStorage.setItem('scores', JSON.stringify(scores));
    localStorage.setItem('riasecCode', top3);
    router.push('/result');
  };

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-white-100">
      {/* Navbar */}
      <Navbar />
      
      <div className="flex flex-col items-center justify-center px-6 pb-12 pt-30">
        {/* Assessment Title */}
        <div className="text-center mb-8 w-full max-w-4xl">
          <h1 className="text-5xl font-bold text-black mb-6">
            ASSESSMENT <span style={{ color: '#FFDE59' }}>TEST</span>
          </h1>
          
          {/* Progress Bar */}
          <div className="w-full max-w-2xl mx-auto h-4 rounded-full overflow-hidden"
           style={{backgroundColor: "#FDEDAA"}}>
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: '#F4C400'
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div
          className="w-full mx-auto rounded-3xl p-3 shadow-lg"
          style={{ backgroundColor: "#FFDE59", width: "800px" }} // Outermost (bright yellow)
        >
          <div
            className="rounded-2xl pt-10 pb-6 px-10 flex flex-col"
            style={{ backgroundColor: "#FDEDAA" }} // Middle layer (soft yellow)
          >
            {/* Inner Lightest Yellow wraps ONLY Q + Circles */}
            <div
              className="rounded-4xl px-5 pt-5 pb-10 mb-6 mx-auto"
              style={{ backgroundColor: "#FFFDEC", width: "700px"}} // Innermost (cream)
            >
              {/* Question */}
              <p className="text-3xl font-medium font-fredoka text-black mb-6 text-center leading-relaxed">
                {currentQ.question}
              </p>

              {/* Likert Scale */}
              <div className="flex justify-center items-center gap-6">
                <span className="text-xl font-regular font-fredoka text-black min-w-[100px] text-right">
                  Unlikely
                </span>

                <div className="flex gap-5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <label key={num} className="flex flex-col items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        value={num}
                        checked={answers[currentQ.id] === num}
                        onChange={() => handleAnswer(currentQ.id, num)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          answers[currentQ.id] === num
                            ? "bg-[#FFDE59] border-black scale-110"
                            : "bg-white border-black hover:scale-105"
                        }`}
                      />
                    </label>
                  ))}
                </div>

                <span className="text-xl font-regular font-fredoka text-black min-w-[100px] text-left">
                  Likely
                </span>
              </div>
            </div>

            {/* Next Button stays outside the cream box */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
                className="bg-[#FFFDEC] text-black font-medium font-fredoka text-lg px-10 py-2 rounded-full 
                            transition-all duration-300 ease-in-out 
                            disabled:opacity-50 disabled:cursor-not-allowed shadow-md 
                            hover:scale-105"
             >
                {currentQuestion < questions.length - 1 ? "Next" : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Question Counter */}
        <div className="mt-8 text-gray-600 text-lg font-medium">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>
    </div>
  );
}