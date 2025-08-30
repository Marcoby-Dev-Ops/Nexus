import React, { useState, useEffect } from 'react';

interface SocialProofBannerProps {
  className?: string;
}

export function SocialProofBanner({ className = '' }: SocialProofBannerProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const testimonials = [
    {
      text: "Nexus helped us streamline our entire business operations. We've seen a 40% increase in efficiency!",
      author: "Sarah Chen",
      role: "CEO, TechFlow Solutions",
      company: "Technology"
    },
    {
      text: "The AI-powered insights are game-changing. We've made better decisions in 3 months than in the last 2 years.",
      author: "Marcus Rodriguez",
      role: "Operations Director",
      company: "Manufacturing"
    },
    {
      text: "Finally, a business platform that actually understands what we need. The onboarding was incredibly smooth.",
      author: "Jennifer Park",
      role: "Founder",
      company: "Healthcare Startup"
    }
  ];

  useEffect(() => {
    // Show banner after 2 seconds
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Rotate testimonials every 5 seconds
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (!isVisible) return null;

  return (
    <div className={`bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Trust indicators */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-green-300">Trusted by 10,000+ businesses</span>
          </div>

          {/* Testimonial */}
          <div className="relative">
            <blockquote className="text-sm text-green-200 italic mb-2">
              "{testimonials[currentTestimonial].text}"
            </blockquote>
            <div className="text-xs text-green-300">
              <span className="font-medium">{testimonials[currentTestimonial].author}</span>
              <span className="mx-1">•</span>
              <span>{testimonials[currentTestimonial].role}</span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex space-x-1 mt-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? 'bg-green-400' 
                    : 'bg-green-400/30 hover:bg-green-400/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-green-400 hover:text-white transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

