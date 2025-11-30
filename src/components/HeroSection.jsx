import React, { useState, useEffect } from 'react';

function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1920&q=80',
      alt: 'El Nido, Palawan'
    },
    {
      image: 'https://images.unsplash.com/photo-1553195029-754fbd369560?w=1920&q=80',
      alt: 'Boracay White Beach'
    },
    {
      image: 'https://images.unsplash.com/photo-1728042743743-e2a2abf35c47?w=1920&q=80',
      alt: 'Chocolate Hills, Bohol'
    },
    {
      image: 'https://images.unsplash.com/photo-1555590858-be28a58c2688?w=1920&q=80',
      alt: 'Mayon Volcano, Albay'
    },
    {
      image: 'https://images.unsplash.com/photo-1565113180093-077f1e8f1c74?w=1920&q=80',
      alt: 'Siargao Island'
    }
  ];

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="position-relative" style={{ height: '80vh', overflow: 'hidden' }}>
      {/* Carousel */}
      <div id="heroCarousel" className="carousel slide carousel-fade h-100" data-bs-ride="carousel">
        <div className="carousel-inner h-100">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`carousel-item h-100 ${index === currentSlide ? 'active' : ''}`}
            >
              <img 
                src={slide.image} 
                className="d-block w-100 h-100" 
                alt={slide.alt}
                style={{ objectFit: 'cover', filter: 'brightness(0.7)' }}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <button 
          className="carousel-control-prev" 
          type="button" 
          onClick={prevSlide}
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button 
          className="carousel-control-next" 
          type="button" 
          onClick={nextSlide}
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>

        {/* Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={index === currentSlide ? 'active' : ''}
              onClick={() => goToSlide(index)}
              aria-label={`Slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>

      {/* Overlay Text */}
      <div 
        className="position-absolute top-50 start-50 translate-middle text-center text-white"
        style={{ zIndex: 10, width: '90%', maxWidth: '800px' }}
      >
        <h1 className="display-2 fw-bold mb-3" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
          TravelMate
        </h1>
        <p className="display-6 fw-light" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.7)' }}>
          Where anything is possible
        </p>
      </div>
    </section>
  );
}

export default HeroSection;
