import React, { useState, useEffect } from 'react';

const LoadingScreen = () => {
    const [step, setStep] = useState(0);
    const steps = [
        { label: 'Retrieving source', sub: 'Fetching...' },
        { label: 'Optimizing proxy', sub: 'Compressing...' },
        { label: 'AI Analysis', sub: 'Thinking...' },
        { label: 'Vector Indexing', sub: 'Finalizing...' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 5000);
        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-16 h-16 border-2 border-panel border-t-accent-primary rounded-full animate-spin-slow mb-12"></div>
            <div className="w-full max-w-xs space-y-6">
                {steps.map((s, index) => (
                    <div key={index} className={`flex items-center gap-4 transition-all duration-700 ease-out ${index === step ? 'opacity-100 translate-x-0' : index < step ? 'opacity-40 -translate-x-2' : 'opacity-20 translate-x-2'}`}>
                        <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${index <= step ? 'bg-accent-primary' : 'bg-border-subtle'}`}></div>
                        <div className="flex-1 flex justify-between items-baseline">
                            <h3 className={`font-serif text-lg leading-none ${index === step ? 'text-text-main' : 'text-text-muted'}`}>{s.label}</h3>
                            {index === step && <span className="text-xs font-mono text-accent-primary animate-pulse">{s.sub}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LoadingScreen;
