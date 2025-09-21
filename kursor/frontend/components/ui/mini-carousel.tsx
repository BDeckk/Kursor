"use client";

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FieldCard {
  title: string;
  image: string;
  description?: string;
  color?: string;
  imageWidth?: string; // Width in pixels
  imageHeight?: string; // Height in pixels
  imageTop?: string; // Top position (e.g., "16px", "-20px")
  imageLeft?: string; // Left offset from center (e.g., "0px", "10px")
}

interface MiniCarouselProps {
  mini_card: FieldCard[];
}

export const MiniCarousel = ({ mini_card }: MiniCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  
  // Show 4 cards at once like in the reference
  const itemsPerView = 4;
  const totalItems = mini_card.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="relative w-full mt-8">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        disabled={currentIndex === 0}
        className={`absolute left-[8%] top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 ${
          currentIndex === 0 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50 hover:shadow-xl'
        }`}
      >
        <ChevronLeft size={24} className="text-gray-600" />
      </button>

      <button
        onClick={nextSlide}
        disabled={currentIndex >= maxIndex}
        className={`absolute right-[8%] top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 ${
          currentIndex >= maxIndex 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50 hover:shadow-xl'
        }`}
      >
        <ChevronRight size={24} className="text-gray-600" />
      </button>

      {/* Carousel Container - Controls horizontal sliding */}
      <div className="px-[13%] relative">
        {/* Mask container - only clips horizontally, not vertically */}
        <div className="relative pt-3 pb-7" style={{ overflow: 'hidden' }}> 
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 25}%)`,
              width: `${(totalItems / itemsPerView) * 100}%`
            }}
          >
            {mini_card.map((field: FieldCard, index: number) => (
              <div
                key={index}
                className="flex-shrink-0 px-3"
                style={{ width: `${100 / totalItems}%` }}
              >
                <div className="bg-[#FFDE59] rounded-2xl p-6 h-89 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group relative border-2 border-transparent hover:border-yellow-400" style={{ overflow: 'visible' }}>
                  
                  {/* White inner square - similar to dashboard cards */}
                  <div className="absolute w-[220px] h-[220px] bg-white top-4 rounded-2xl flex items-center justify-center mx-auto overflow-hidden left-1/2 -translate-x-1/2 z-0"></div>
                  
                  {/* Icon/Image - absolutely positioned to pop out of the white square */}
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 z-30"
                    style={{
                      width: field.imageWidth || '140px',
                      height: field.imageHeight || '140px',
                      top: field.imageTop || '-10px',
                      marginLeft: field.imageLeft || '0px'
                    }}
                  >
                    <img 
                      src={field.image} 
                      alt={field.title}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-xl"
                    />
                  </div>
                  
                  {/* Content section - positioned with more space from image */}
                  <div className="left-4 right-4 text-center flex flex-col items-center justify-center z-10 translate-y-58 transition-transform duration-300 group-hover:scale-104">
                    {/* Title */}
                    <h3 className="text-[22px] font-bold text-gray-800 leading-tight mb-1 text-center w-full">
                      {field.title}
                    </h3>
                    
                    {/* Description */}
                    {field.description && (
                      <p className="text-sm text-gray-600 text-center w-full">
                        {field.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dots Indicator - matching reference style */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: maxIndex + 1 }, (_, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-200 ${
              currentIndex === index 
                ? 'bg-yellow-500 w-8' 
                : 'bg-gray-300 w-2 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};