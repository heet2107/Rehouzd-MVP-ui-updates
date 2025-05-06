import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RentValues {
  rent: number;
  expense: number;
  capRate: number;
  lowRehab: number;
  highRehab: number;
  afterRepairValue: number;
}

interface FlipValues {
  sellingCosts: number;
  holdingCosts: number;
  margin: number;
  lowRehab: number;
  highRehab: number;
  afterRepairValue: number;
  estimatedOffer: number;
}

interface OfferRange {
  low: number;
  high: number;
}

interface UnderwriteState {
  activeStrategy: 'rent' | 'flip';
  rent: RentValues;
  flip: FlipValues;
  offerRange: OfferRange;
  currentAddress: string | null;
}

const initialState: UnderwriteState = {
  activeStrategy: 'rent',
  rent: {
    rent: 1000,
    expense: 3500,
    capRate: 6.5,
    lowRehab: 30,
    highRehab: 40,
    afterRepairValue: 0
  },
  flip: {
    sellingCosts: 7,
    holdingCosts: 4,
    margin: 20,
    lowRehab: 30,
    highRehab: 40,
    afterRepairValue: 0,
    estimatedOffer: 0
  },
  offerRange: {
    low: 0,
    high: 0
  },
  currentAddress: null,
};

export const underwriteSlice = createSlice({
  name: 'underwrite',
  initialState,
  reducers: {
    setActiveStrategy: (state, action: PayloadAction<'rent' | 'flip'>) => {
      state.activeStrategy = action.payload;
    },
    updateRentValues: (state, action: PayloadAction<RentValues>) => {
      state.rent = {...state.rent, ...action.payload};
    },
    updateFlipValues: (state, action: PayloadAction<FlipValues>) => {
      state.flip = {...state.flip, ...action.payload};
    },
    updateRentARV: (state, action: PayloadAction<number>) => {
      state.rent.afterRepairValue = action.payload;
    },
    updateFlipARV: (state, action: PayloadAction<number>) => {
      state.flip.afterRepairValue = action.payload;
    },
    updateOfferRange: (state, action: PayloadAction<OfferRange>) => {
      state.offerRange = action.payload;
    },
    setCurrentAddress: (state, action: PayloadAction<string | null>) => {
      state.currentAddress = action.payload;
    },
    resetUnderwriteValues: (state) => {
      return initialState;
    },
  },
});

export const { 
  setActiveStrategy, 
  updateRentValues, 
  updateFlipValues,
  updateRentARV,
  updateFlipARV,
  updateOfferRange,
  setCurrentAddress,
  resetUnderwriteValues
} = underwriteSlice.actions;

export default underwriteSlice.reducer; 