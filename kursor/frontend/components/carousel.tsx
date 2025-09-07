"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({ slides, autoTransition = true, interval = 10000 }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Safely get slides array
  const safeSlides = Array.isArray(slides) ? slides : [];
  const hasSlides = safeSlides.length > 0;

  // Ensure current slide is within bounds
  const validCurrentSlide = hasSlides ? Math.max(0, Math.min(currentSlide, safeSlides.length - 1)) : 0;

  // Auto transition effect
  useEffect(() => {
    if (!autoTransition || !hasSlides || safeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        const nextIndex = prev + 1;
        return nextIndex >= safeSlides.length ? 0 : nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoTransition, interval, hasSlides, safeSlides.length]);

  // Reset to 0 if current slide is out of bounds
  useEffect(() => {
    if (hasSlides && (currentSlide >= safeSlides.length || currentSlide < 0)) {
      setCurrentSlide(0);
    }
  }, [hasSlides, safeSlides.length, currentSlide]);

  const nextSlide = () => {
    if (!hasSlides) return;
    setCurrentSlide(prev => {
      const nextIndex = prev + 1;
      return nextIndex >= safeSlides.length ? 0 : nextIndex;
    });
  };

  const prevSlide = () => {
    if (!hasSlides) return;
    setCurrentSlide(prev => {
      const prevIndex = prev - 1;
      return prevIndex < 0 ? safeSlides.length - 1 : prevIndex;
    });
  };

  const goToSlide = (slideIndex) => {
    if (!hasSlides || slideIndex < 0 || slideIndex >= safeSlides.length) return;
    setCurrentSlide(slideIndex);
  };

  // Don't render if no slides
  if (!hasSlides) {
    return (
      <div className="relative flex items-center">
        <button className="bg-gray-200 rounded-full p-3 shadow-md mr-6 cursor-not-allowed opacity-50">
          <ChevronLeft className="w-6 h-6 text-gray-400" />
        </button>
        <div className="relative bg-gray-200 rounded-2xl p-8 overflow-hidden flex-1">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No slides available</p>
          </div>
        </div>
        <button className="bg-gray-200 rounded-full p-3 shadow-md ml-6 cursor-not-allowed opacity-50">
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </button>
      </div>
    );
  }

  // Get current slide data safely
  const currentSlideData = safeSlides[validCurrentSlide] || {};

  return (
    <div className="relative flex items-center">
      {/* Left Arrow - Outside */}
      <button 
        onClick={prevSlide}
        className="bg-white hover:bg-gray-50 rounded-full p-3 shadow-md transition-colors mr-6 z-10"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      {/* Carousel Content */}
      <div className="relative bg-[#FFDE59] rounded-2xl overflow-hidden flex-1 min-h-[500px] flex items-center">
        <div className="flex items-center h-full px-8 py-6">
          
          {/* Left side - Dominant Illustration */}
          <div className="w-[65%] flex justify-center items-center pt-10 pl-5 pb-5">
              <img 
                src={currentSlideData.image || '/default-slide.png'} 
                alt={currentSlideData.subtitle || 'Slide image'}
                className="w-[450px] h-[450px] top=[100px]"
              />
          </div>

          {/* Right side - Stacked Text */}
          <div className="w-[35%] flex flex-col justify-center text-right space-y-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-2">
                {currentSlideData.title || 'Explore and get started with'}
              </h1>
              <div className="text-4xl md:text-5xl font-bold text-white leading-tight">
                {currentSlideData.subtitle || 'KURSOR'}
              </div>
            </div>
          </div>

        </div>

        {/* Dots indicator */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {safeSlides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              onClick={() => goToSlide(slideIndex)}
              className={`w-3 h-3 rounded-full transition-colors ${
                slideIndex === validCurrentSlide ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right Arrow - Outside */}
      <button 
        onClick={nextSlide}
        className="bg-white hover:bg-gray-50 rounded-full p-3 shadow-md transition-colors ml-6 z-10"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>
    </div>
  );
}