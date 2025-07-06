import React from 'react';

const SectionSelector = ({ sections = [], currentSection = 0, onSectionChange, sectionProgress = {} }) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Sections</h3>
        <p className="text-gray-500">No sections available</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Sections</h3>
      <div className="flex flex-wrap gap-2">
        {sections.map((section, idx) => {
          const progress = sectionProgress[idx] || 0;
          const isActive = currentSection === idx;
          
          return (
            <button
              key={idx}
              onClick={() => onSectionChange(idx)}
              className={`relative px-4 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <span>Section {idx + 1}</span>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-green-500 rounded-b"
                style={{ width: `${progress}%` }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SectionSelector;