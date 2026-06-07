import { Designer } from "@pdfme/ui";
import { useEffect, useRef } from "react";
import { Template, BLANK_PDF, getDefaultFont } from '@pdfme/common';  

const template: Template = {  
  basePdf: BLANK_PDF,  
  schemas: [  
    [  
      {  
        name: 'a',  
        type: 'text',  
        position: { x: 0, y: 0 },  
        width: 10,  
        height: 10,  
      },  
      {  
        name: 'b',  
        type: 'text',  
        position: { x: 10, y: 10 },  
        width: 10,  
        height: 10,  
      },  
      {  
        name: 'c',  
        type: 'text',  
        position: { x: 20, y: 20 },  
        width: 10,  
        height: 10,  
      },  
    ],  
  ],  
};

export default function Page() {
  const designerRef = useRef<Designer | null>(null);  
  const containerRef = useRef<HTMLDivElement>(null);  
  
  useEffect(() => {  
    if (!containerRef.current) return;  
  
    const designer = new Designer({  
      domContainer: containerRef.current,  
      template: template, 
      options: {  
        font: getDefaultFont(),  
      },  
    });  
  
    designerRef.current = designer;  
  
    return () => {  
      designer.destroy();  
    };  
  }, []);  
  
  return (
    <section className="w-full h-full">
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100vh',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          perspective: 1000
        }} 
      />
    </section>
  );
}