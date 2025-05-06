import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Note: The fetchBuyers async thunk was previously defined here but has been removed.
 * Components now fetch buyers directly from the API using fetch() instead of Redux.
 * This reduces dependencies and simplifies error handling.
 */

// Backend Buyer interface
export interface BackendBuyer {
  slvr_int_inv_dtl_sk: number;
  investor_company_nm_txt: string;
  investor_profile: any;
  num_prop_purchased_lst_12_mths_nr: number;
  active_flg: boolean;
}

// Frontend Buyer interface (maintained for UI components)
export interface Buyer {
    id?: string;
    name: string;
    address: string;
    phone?: string;
    type: string[];
    priceRange: string;
    likelihood: string;
    recentPurchases: number;
    purchase_history?: Array<{
        address?: string;
        date?: string;
        price?: string | number;
    }>;
}

interface BuyerState {
    buyers: Buyer[];
    loading: boolean;
    error: string | null;
}

const initialState: BuyerState = {
    buyers: [],
    loading: false,
    error: null
};

const buyerSlice = createSlice({
    name: 'buyers',
    initialState,
    reducers: {
        setBuyers(state, action: PayloadAction<Buyer[]>) {
            state.buyers = action.payload;
        },
        clearBuyers(state) {
            state.buyers = [];
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        }
    }
});

// Helper function to transform backend buyers to frontend format
export const transformBuyerData = (backendBuyer: BackendBuyer): Buyer => {
    // Extract data from investor_profile if available
    const profile = backendBuyer.investor_profile || {};
    
    // Default type if not available
    const buyerTypes = profile.property_types || ['Investor'];
    
    // Create price range from min/max values if available
    const minPrice = profile.min_price || 0;
    const maxPrice = profile.max_price || 0;
    const priceRange = maxPrice ? `$${minPrice/1000}k - $${maxPrice/1000}k` : 'Variable';
    
    // Extract purchase history if available
    const purchaseHistory = profile.purchase_history || [];
    
    return {
        id: backendBuyer.slvr_int_inv_dtl_sk.toString(),
        name: backendBuyer.investor_company_nm_txt,
        address: profile.location || 'United States',
        phone: profile.contact_phone || undefined,
        type: buyerTypes,
        priceRange: priceRange,
        likelihood: backendBuyer.num_prop_purchased_lst_12_mths_nr > 5 ? 'Likely' : 'Possible',
        recentPurchases: backendBuyer.num_prop_purchased_lst_12_mths_nr,
        purchase_history: purchaseHistory.length > 0 ? purchaseHistory : undefined
    };
};

export const { setBuyers, clearBuyers, setLoading, setError } = buyerSlice.actions;
export default buyerSlice.reducer; 