import React, { createContext, useContext, useState, useEffect } from 'react';
import { CropTarget } from '@/api/entities';

const CropContext = createContext();

export const useCrop = () => {
  const context = useContext(CropContext);
  if (!context) {
    throw new Error('useCrop must be used within a CropProvider');
  }
  return context;
};

export const CropProvider = ({ children }) => {
  const [selectedCrop, setSelectedCrop] = useState('corn');
  const [targetsDict, setTargetsDict] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const loadTargetsForCrop = async (crop) => {
    setIsLoading(true);
    try {
      const targets = await CropTarget.filter({ crop });
      const dict = {};
      targets.forEach(target => {
        dict[target.metric] = {
          min: target.min,
          max: target.max,
          units: target.units,
          source: target.source
        };
      });
      setTargetsDict(dict);
    } catch (error) {
      console.error('Error loading crop targets:', error);
      setTargetsDict({});
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTargetsForCrop(selectedCrop);
  }, [selectedCrop]);

  const value = {
    selectedCrop,
    setSelectedCrop,
    targetsDict,
    isLoading
  };

  return (
    <CropContext.Provider value={value}>
      {children}
    </CropContext.Provider>
  );
};