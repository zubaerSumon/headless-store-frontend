import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from 'next/image';

interface SliderProps {
  sliderList?: any[];
}

function Slider({ sliderList }: SliderProps) {
  // Use static carousel images from public/carousel directory
  const carouselImages = [
    '/carousel/carousel-img1.png',
    '/carousel/carouse-img2.jpg',
  ];

  return (
    <Carousel>
      <CarouselContent>
        {carouselImages.map((imagePath, index) => (
          <CarouselItem key={index}>
            <Image
              src={imagePath}
              width={1000}
              height={400}
              alt={`slider ${index + 1}`}
              className='w-full h-[200px] md:h-[400px] object-cover rounded-2xl'
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

export default Slider;

