import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface ConnectionSliderProps {
  connections: number;
  setConnections: (value: number) => void;
  companies: number;
  minConnections?: number;
  maxConnections?: number;
}

const ConnectionSlider: React.FC<ConnectionSliderProps> = ({
  connections,
  setConnections,
  companies,
  minConnections = 1,
  maxConnections = 20
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(connections.toString());

  const pricePerConnection = 12;
  const additionalConnections = connections - 1;
  const costPerCompany = additionalConnections * pricePerConnection;
  const totalAdditionalCost = costPerCompany * companies;

  const handleIncrement = () => {
    const newValue = Math.min(connections + 1, maxConnections);
    setConnections(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(connections - 1, minConnections);
    setConnections(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      const boundedValue = Math.min(Math.max(numValue, minConnections), maxConnections);
      setConnections(boundedValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue);
    if (isNaN(numValue)) {
      setInputValue(connections.toString());
    } else {
      const boundedValue = Math.min(Math.max(numValue, minConnections), maxConnections);
      setConnections(boundedValue);
      setInputValue(boundedValue.toString());
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-[#180D43]">
          Select Number of Connections
        </h3>
        <p className="text-gray-600 text-sm mt-2">
          First connection is included, additional connections cost ${pricePerConnection.toFixed(2)} per company
        </p>
      </div>

      <div className="relative mb-8">
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 cursor-pointer group"
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-16 text-center bg-[#1239FF] text-white px-3 py-1 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1239FF]/50"
              autoFocus
              min={minConnections}
              max={maxConnections}
            />
          ) : (
            <div className="bg-[#1239FF] text-white px-4 py-1 rounded-full text-sm group-hover:bg-[#1239FF]/90 transition-colors">
              {connections}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Click to edit
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <input
            type="range"
            min={minConnections}
            max={maxConnections}
            value={connections}
            onChange={(e) => {
              setConnections(parseInt(e.target.value));
              setInputValue(e.target.value);
            }}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1239FF]"
          />
          <button
            onClick={handleIncrement}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="text-4xl font-bold text-[#1239FF] mb-2">
          {connections} Connections
        </div>
        {connections > 1 && (
          <>
            <div className="text-gray-600 mb-1">
              {additionalConnections} additional connection{additionalConnections > 1 ? 's' : ''}
            </div>
            <div className="text-[#180D43]">
              ${costPerCompany.toFixed(2)} per company
            </div>
            <div className="text-[#1239FF] font-medium mt-1">
              Total additional cost: ${totalAdditionalCost.toFixed(2)}/month
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionSlider;